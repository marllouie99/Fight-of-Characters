import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let sharp = null;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default || sharpModule;
} catch (e) {
  sharp = null;
}

let ffmpegPath = null;
try {
  const ffmpegModule = await import('ffmpeg-static');
  ffmpegPath = ffmpegModule.default || ffmpegModule;
} catch (e) {
  ffmpegPath = null;
}

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF];
  }
  return (c ^ -1) >>> 0;
}

function createChunk(typeStr, dataBuf) {
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const len = dataBuf ? dataBuf.length : 0;
  const header = Buffer.alloc(8);
  header.writeUInt32BE(len, 0);
  typeBuf.copy(header, 4);

  const crcBuf = Buffer.alloc(4);
  const toCrc = dataBuf ? Buffer.concat([typeBuf, dataBuf]) : typeBuf;
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return dataBuf ? Buffer.concat([header, dataBuf, crcBuf]) : Buffer.concat([header, crcBuf]);
}

function readPngHeader(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504E47 || buf.readUInt32BE(4) !== 0x0D0A1A0A) {
    return null;
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25]
  };
}

function decodePngBuffer(buffer) {
  let offset = 8;
  let width = 0, height = 0, colorType = 0, bitDepth = 0;
  let plteChunk = null;
  let trnsChunk = null;
  const idatChunks = [];

  while (offset < buffer.length) {
    const len = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + len);
    offset += 12 + len;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'PLTE') {
      plteChunk = data;
    } else if (type === 'tRNS') {
      trnsChunk = data;
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2 && colorType !== 3)) return null;
  if (colorType === 3 && !plteChunk) return null;

  const bpp = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
  let decompressed;
  try {
    decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  } catch (e) {
    return null;
  }

  const stride = width * bpp;
  const pixels = Buffer.alloc(width * height * 4);

  let inOffset = 0;
  let prevRecon = Buffer.alloc(stride);
  let recon = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = decompressed[inOffset++];
    const scanline = decompressed.subarray(inOffset, inOffset + stride);
    inOffset += stride;

    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? recon[x - bpp] : 0;
      const b = prevRecon[x];
      const c = x >= bpp ? prevRecon[x - bpp] : 0;
      const val = scanline[x];

      if (filter === 0) recon[x] = val;
      else if (filter === 1) recon[x] = (val + a) & 0xff;
      else if (filter === 2) recon[x] = (val + b) & 0xff;
      else if (filter === 3) recon[x] = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        recon[x] = (val + pr) & 0xff;
      }
    }

    for (let x = 0; x < width; x++) {
      const outIdx = (y * width + x) * 4;
      const inIdx = x * bpp;
      if (colorType === 6) {
        pixels[outIdx] = recon[inIdx];
        pixels[outIdx + 1] = recon[inIdx + 1];
        pixels[outIdx + 2] = recon[inIdx + 2];
        pixels[outIdx + 3] = recon[inIdx + 3];
      } else if (colorType === 2) {
        pixels[outIdx] = recon[inIdx];
        pixels[outIdx + 1] = recon[inIdx + 1];
        pixels[outIdx + 2] = recon[inIdx + 2];
        pixels[outIdx + 3] = 255;
      } else if (colorType === 3) {
        const palIdx = recon[inIdx];
        const p3 = palIdx * 3;
        pixels[outIdx] = plteChunk[p3] || 0;
        pixels[outIdx + 1] = plteChunk[p3 + 1] || 0;
        pixels[outIdx + 2] = plteChunk[p3 + 2] || 0;
        pixels[outIdx + 3] = (trnsChunk && palIdx < trnsChunk.length) ? trnsChunk[palIdx] : 255;
      }
    }
    prevRecon.set(recon);
  }

  return { width, height, pixels };
}

function downsample05x(srcWidth, srcHeight, srcPixels) {
  const dstWidth = Math.max(1, Math.floor(srcWidth / 2));
  const dstHeight = Math.max(1, Math.floor(srcHeight / 2));
  const dstPixels = Buffer.alloc(dstWidth * dstHeight * 4);

  for (let y = 0; y < dstHeight; y++) {
    const srcY0 = y * 2;
    const srcY1 = Math.min(srcHeight - 1, srcY0 + 1);

    for (let x = 0; x < dstWidth; x++) {
      const srcX0 = x * 2;
      const srcX1 = Math.min(srcWidth - 1, srcX0 + 1);
      const dstIdx = (y * dstWidth + x) * 4;
      const idx00 = (srcY0 * srcWidth + srcX0) * 4;
      let chosenIdx = idx00;

      // Preserve thin outlines if top-left sample is transparent
      if (srcPixels[idx00 + 3] === 0) {
        const idx10 = (srcY0 * srcWidth + srcX1) * 4;
        const idx01 = (srcY1 * srcWidth + srcX0) * 4;
        const idx11 = (srcY1 * srcWidth + srcX1) * 4;
        if (srcPixels[idx10 + 3] > 0) chosenIdx = idx10;
        else if (srcPixels[idx01 + 3] > 0) chosenIdx = idx01;
        else if (srcPixels[idx11 + 3] > 0) chosenIdx = idx11;
      }

      dstPixels[dstIdx] = srcPixels[chosenIdx];
      dstPixels[dstIdx + 1] = srcPixels[chosenIdx + 1];
      dstPixels[dstIdx + 2] = srcPixels[chosenIdx + 2];
      dstPixels[dstIdx + 3] = srcPixels[chosenIdx + 3];
    }
  }

  return { width: dstWidth, height: dstHeight, pixels: dstPixels };
}

function encodePngRgba(width, height, pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const stride = width * 4;
  const rawScanlines = Buffer.alloc(height * (stride + 1));
  let inOffset = 0;
  let outOffset = 0;

  for (let y = 0; y < height; y++) {
    rawScanlines[outOffset++] = 0;
    pixels.copy(rawScanlines, outOffset, inOffset, inOffset + stride);
    outOffset += stride;
    inOffset += stride;
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 6 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', null);

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function isPixelArtAsset(relPath) {
  const lower = relPath.toLowerCase();
  // Overlays, backgrounds, and photographic textures are continuous-tone
  if (lower.includes('assets/overlays/') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return false;
  }
  if (lower.includes('texture') || lower.includes('nebula') || lower.includes('cosmic') || lower.includes('arena_overlay')) {
    return false;
  }
  // Sprite sheets, character models, pixel hands, hair, and weapons are strictly pixel art
  return true;
}

function walkDir(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '_mobile05x') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, out);
    } else if (/\.(png|jpg|jpeg)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

export async function buildMobileAssets(options = {}) {
  const silent = Boolean(options.silent);
  const log = silent ? () => {} : console.log;

  log(`📱 [Mobile Asset Pipeline] Scanning for large assets (>= 1024px or > 500KB) with ${sharp ? 'Sharp WebP/PNG engine' : 'pure-JS PNG engine'}...`);

  const targetDirs = [
    path.join(rootDir, 'Assets', 'model'),
    path.join(rootDir, 'Assets', 'Overlays'),
    path.join(rootDir, 'Assets', 'effects'),
    path.join(rootDir, 'Assets', 'weapon'),
    path.join(rootDir, 'Assets', 'character'),
    path.join(rootDir, 'Assets', 'Sprites')
  ];

  const candidatePaths = [];
  for (const dir of targetDirs) {
    candidatePaths.push(...walkDir(dir));
  }

  const outputBaseDir = path.join(rootDir, 'Assets', '_mobile05x');
  fs.mkdirSync(outputBaseDir, { recursive: true });

  const manifest = {};
  let newlyGenerated = 0;
  let skippedUpToDate = 0;
  let totalSavedBytes = 0;
  let totalDecodedRamSaved = 0;

  for (const fullPath of candidatePaths) {
    const relAssetPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
    const srcStat = fs.statSync(fullPath);

    let width = 0;
    let height = 0;

    if (sharp) {
      try {
        const meta = await sharp(fullPath).metadata();
        width = meta.width || 0;
        height = meta.height || 0;
      } catch (e) {
        continue;
      }
    } else {
      const buf = fs.readFileSync(fullPath);
      const header = readPngHeader(buf);
      if (!header) continue;
      width = header.width;
      height = header.height;
    }

    if (width === 0 || height === 0) continue;
    if (Math.max(width, height) < 1024 && srcStat.size < 500 * 1024) continue;

    // Relative subpath after "Assets/"
    const subpath = relAssetPath.replace(/^Assets\//, '');
    const destPathBase = path.join(outputBaseDir, subpath);
    const destDir = path.dirname(destPathBase);
    fs.mkdirSync(destDir, { recursive: true });

    const isPixel = isPixelArtAsset(relAssetPath);
    const origDecoded = width * height * 4;
    const halfWidth = Math.max(1, Math.floor(width / 2));
    const halfHeight = Math.max(1, Math.floor(height / 2));
    const downDecoded = halfWidth * halfHeight * 4;
    totalDecodedRamSaved += (origDecoded - downDecoded);

    const destWebpPath = destPathBase.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    const destPngPath = destPathBase.replace(/\.(jpg|jpeg)$/i, '.png');

    const webpExists = fs.existsSync(destWebpPath);
    const pngExists = fs.existsSync(destPngPath);
    const isWebpUpToDate = webpExists && fs.statSync(destWebpPath).mtimeMs >= srcStat.mtimeMs;
    const isPngUpToDate = pngExists && fs.statSync(destPngPath).mtimeMs >= srcStat.mtimeMs;

    const hasWebp = sharp !== null;
    manifest[relAssetPath] = [width, height, hasWebp ? 1 : 0];

    if (isWebpUpToDate && isPngUpToDate) {
      skippedUpToDate++;
      const saved = srcStat.size - (webpExists ? fs.statSync(destWebpPath).size : fs.statSync(destPngPath).size);
      totalSavedBytes += Math.max(0, saved);
      continue;
    }

    try {
      if (sharp) {
        const pipeline = sharp(fullPath);

        // 1. Generate crisp @0.5x downscaled variant
        // For pixel art (sprites/weapons): use 'nearest' neighbor to preserve 100% sharp pixel grids
        // For backdrops/overlays: use smooth bicubic scaling
        const resized = pipeline.clone().resize(halfWidth, halfHeight, {
          kernel: isPixel ? sharp.kernel.nearest : sharp.kernel.lanczos3
        });

        // 2. Encode WebP variant
        // Pixel art: 100% bit-exact lossless WebP
        // Backdrops: high-fidelity quality 90 WebP with 100% alpha quality
        if (isPixel) {
          await resized.clone().webp({ lossless: true, effort: 4 }).toFile(destWebpPath);
        } else {
          await resized.clone().webp({ quality: 90, effort: 4, alphaQuality: 100 }).toFile(destWebpPath);
        }

        // 3. Encode fallback @0.5x PNG variant
        await resized.clone().png({ compressionLevel: 6 }).toFile(destPngPath);

        newlyGenerated++;
        const finalSize = fs.statSync(destWebpPath).size;
        totalSavedBytes += Math.max(0, srcStat.size - finalSize);
      } else {
        // Pure-JS PNG fallback
        const buf = fs.readFileSync(fullPath);
        const decoded = decodePngBuffer(buf);
        if (!decoded) continue;

        const downsampled = downsample05x(decoded.width, decoded.height, decoded.pixels);
        const encoded = encodePngRgba(downsampled.width, downsampled.height, downsampled.pixels);

        fs.writeFileSync(destPngPath, encoded);
        newlyGenerated++;
        totalSavedBytes += Math.max(0, buf.length - encoded.length);
      }
    } catch (err) {
      console.warn(`⚠️ [Mobile Asset Pipeline] Failed to process ${relAssetPath}:`, err.message);
    }
  }

  // Write mobileAssetManifest.js
  const manifestPath = path.join(rootDir, 'js', 'configs', 'mobileAssetManifest.js');
  const manifestContent = `// ─────────────────────────────────────────────
// AUTO-GENERATED MOBILE ASSET MANIFEST (@0.5x WebP Pipeline)
// Generated by scripts/buildMobileAssets.mjs
// Maps 1x asset paths to original [width, height, hasWebp] dimensions.
// ─────────────────────────────────────────────

export const MOBILE_ASSET_MANIFEST = ${JSON.stringify(manifest, null, 2)};
`;

  fs.writeFileSync(manifestPath, manifestContent, 'utf8');

  log(`   ✅ Processed ${Object.keys(manifest).length} large assets (${newlyGenerated} newly generated, ${skippedUpToDate} up to date).`);
  log(`   📉 Decoded RAM savings pool: ${(totalDecodedRamSaved / 1024 / 1024).toFixed(1)} MB (75% reduction on mobile).`);
  log(`   💾 Storage savings: ${(totalSavedBytes / 1024 / 1024).toFixed(1)} MB.`);
  log(`   📄 Manifest written to js/configs/mobileAssetManifest.js\n`);

  // Run mobile audio transcoding pipeline (96 kbps cache for APK packaging)
  await buildMobileAudio();

  return {
    manifest,
    totalAssets: Object.keys(manifest).length,
    newlyGenerated,
    skippedUpToDate,
    totalSavedBytes,
    totalDecodedRamSaved
  };
}

export async function buildMobileAudio() {
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    console.log('ℹ️  [Mobile Audio Pipeline] ffmpeg-static not available. Skipping audio transcoding.');
    return { count: 0, savedBytes: 0 };
  }

  const soundEffectsDir = path.join(rootDir, 'Assets', 'Sound Effects');
  const mobileAudioDir = path.join(rootDir, 'Assets', '_mobile_audio');
  if (!fs.existsSync(soundEffectsDir)) return { count: 0, savedBytes: 0 };

  console.log('🎵 [Mobile Audio Pipeline] Checking 96 kbps transcoded audio cache...');

  function collectAudioFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        results = results.concat(collectAudioFiles(full));
      } else {
        const lower = ent.name.toLowerCase();
        if (lower.endsWith('.mp3') || lower.endsWith('.ogg') || lower.endsWith('.wav')) {
          results.push(full);
        }
      }
    }
    return results;
  }

  const audioFiles = collectAudioFiles(soundEffectsDir);
  let newlyTranscoded = 0;
  let skippedUpToDate = 0;
  let totalSavedBytes = 0;

  for (const srcFile of audioFiles) {
    const stat = fs.statSync(srcFile);
    // Focus on files >= 120 KB (large BGM tracks, heavy ability sound themes, uncompressed WAVs)
    if (stat.size < 120 * 1024) continue;

    const relSub = path.relative(soundEffectsDir, srcFile);
    const destFile = path.join(mobileAudioDir, relSub);
    const destDir = path.dirname(destFile);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    if (fs.existsSync(destFile)) {
      const destStat = fs.statSync(destFile);
      if (destStat.mtimeMs >= stat.mtimeMs) {
        skippedUpToDate++;
        totalSavedBytes += Math.max(0, stat.size - destStat.size);
        continue;
      }
    }

    const ext = path.extname(srcFile).toLowerCase();
    const tempOut = destFile + '.tmp' + ext;

    try {
      let args = ['-i', srcFile];
      if (ext === '.mp3') {
        args.push('-b:a', '96k', '-ar', '44100');
      } else if (ext === '.ogg') {
        args.push('-c:a', 'libvorbis', '-b:a', '96k');
      } else if (ext === '.wav') {
        args.push('-ar', '22050');
      }
      args.push('-y', tempOut);

      execFileSync(ffmpegPath, args, { stdio: 'ignore' });

      if (fs.existsSync(tempOut)) {
        const optStat = fs.statSync(tempOut);
        if (optStat.size < stat.size) {
          fs.renameSync(tempOut, destFile);
          totalSavedBytes += (stat.size - optStat.size);
          newlyTranscoded++;
        } else {
          fs.copyFileSync(srcFile, destFile);
          fs.unlinkSync(tempOut);
        }
      }
    } catch (err) {
      if (fs.existsSync(tempOut)) {
        try { fs.unlinkSync(tempOut); } catch (_) {}
      }
    }
  }

  console.log(`   ✅ Processed mobile audio: ${newlyTranscoded} newly transcoded, ${skippedUpToDate} up to date.`);
  if (totalSavedBytes > 0) {
    console.log(`   📉 Mobile audio storage savings pool: ${(totalSavedBytes / 1024 / 1024).toFixed(1)} MB.`);
  }

  return { newlyTranscoded, skippedUpToDate, totalSavedBytes };
}

export function pruneAndroidDuplicate1xAssets(manifest) {
  const androidPublicDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets', 'public');
  if (!fs.existsSync(androidPublicDir)) return;

  let prunedCount = 0;
  let prunedBytes = 0;
  let strippedZipCount = 0;
  let strippedZipBytes = 0;

  // 1. Purge any lingering .zip release archives from Android assets
  try {
    for (const f of fs.readdirSync(androidPublicDir)) {
      if (f.endsWith('.zip')) {
        const zipFile = path.join(androidPublicDir, f);
        const sz = fs.statSync(zipFile).size;
        fs.unlinkSync(zipFile);
        strippedZipCount++;
        strippedZipBytes += sz;
      }
    }
  } catch (e) {}

  if (strippedZipCount > 0) {
    console.log(`   🧹 [Android APK Optimizer] Purged ${strippedZipCount} stale distribution ZIPs from APK assets (${(strippedZipBytes / 1024 / 1024).toFixed(1)} MB reclaimed).`);
  }

  // 1.5. Purge internal audio build cache if copied into Android assets
  const androidMobileAudioDir = path.join(androidPublicDir, 'Assets', '_mobile_audio');
  if (fs.existsSync(androidMobileAudioDir)) {
    try {
      fs.rmSync(androidMobileAudioDir, { recursive: true, force: true });
    } catch (e) {}
  }

  // 2. Prune redundant 1x assets when mobile variant exists
  for (const relAssetPath of Object.keys(manifest)) {
    const subpath = relAssetPath.replace(/^Assets\//, '');
    const mobile05xPng = path.join(androidPublicDir, 'Assets', '_mobile05x', subpath.replace(/\.(jpg|jpeg)$/i, '.png'));
    const mobile05xWebp = path.join(androidPublicDir, 'Assets', '_mobile05x', subpath.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
    const redundant1xFile = path.join(androidPublicDir, relAssetPath);

    if ((fs.existsSync(mobile05xPng) || fs.existsSync(mobile05xWebp)) && fs.existsSync(redundant1xFile)) {
      const stat1x = fs.statSync(redundant1xFile);
      fs.unlinkSync(redundant1xFile);
      prunedCount++;
      prunedBytes += stat1x.size;
    }
  }

  if (prunedCount > 0) {
    console.log(`   🧹 [Android APK Optimizer] Pruned ${prunedCount} redundant 1x textures from android/app/src/main/assets/public (${(prunedBytes / 1024 / 1024).toFixed(1)} MB stripped from APK).`);
  }

  // 3. Inject transcoded 96 kbps audio assets into Android assets
  const mobileAudioDir = path.join(rootDir, 'Assets', '_mobile_audio');
  const androidSoundDir = path.join(androidPublicDir, 'Assets', 'Sound Effects');
  let audioReplacedCount = 0;
  let audioSavedBytes = 0;

  if (fs.existsSync(mobileAudioDir) && fs.existsSync(androidSoundDir)) {
    function applyAudio(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          applyAudio(full);
        } else {
          const rel = path.relative(mobileAudioDir, full);
          const targetInAndroid = path.join(androidSoundDir, rel);
          if (fs.existsSync(targetInAndroid)) {
            const origStat = fs.statSync(targetInAndroid);
            const optStat = fs.statSync(full);
            if (optStat.size < origStat.size) {
              fs.copyFileSync(full, targetInAndroid);
              audioReplacedCount++;
              audioSavedBytes += (origStat.size - optStat.size);
            }
          }
        }
      }
    }
    applyAudio(mobileAudioDir);
  }

  if (audioReplacedCount > 0) {
    console.log(`   🎵 [Android APK Audio Optimizer] Injected ${audioReplacedCount} transcoded 96 kbps audio files (${(audioSavedBytes / 1024 / 1024).toFixed(1)} MB saved in APK).`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('buildMobileAssets.mjs')) {
  const res = await buildMobileAssets();
  if (process.argv.includes('--prune-android') && res && res.manifest) {
    pruneAndroidDuplicate1xAssets(res.manifest);
  }
}
