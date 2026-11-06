import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) return null;

  const bpp = colorType === 6 ? 4 : 3;
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
      if (bpp === 4) {
        pixels[outIdx] = recon[inIdx];
        pixels[outIdx + 1] = recon[inIdx + 1];
        pixels[outIdx + 2] = recon[inIdx + 2];
        pixels[outIdx + 3] = recon[inIdx + 3];
      } else {
        pixels[outIdx] = recon[inIdx];
        pixels[outIdx + 1] = recon[inIdx + 1];
        pixels[outIdx + 2] = recon[inIdx + 2];
        pixels[outIdx + 3] = 255;
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

function walkDir(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '_mobile05x') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, out);
    } else if (entry.name.endsWith('.png')) {
      out.push(full);
    }
  }
  return out;
}

export function buildMobileAssets(options = {}) {
  const silent = Boolean(options.silent);
  const log = silent ? () => {} : console.log;

  log('📱 [Mobile Asset Pipeline] Scanning for large sprite sheets (>= 1024px)...');

  const targetDirs = [
    path.join(rootDir, 'Assets', 'model'),
    path.join(rootDir, 'Assets', 'Overlays'),
    path.join(rootDir, 'Assets', 'effects')
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
    const buf = fs.readFileSync(fullPath);
    const header = readPngHeader(buf);

    if (!header) continue;
    if (Math.max(header.width, header.height) < 1024) continue;
    if (header.bitDepth !== 8 || (header.colorType !== 6 && header.colorType !== 2)) continue;

    // Relative subpath after "Assets/"
    const subpath = relAssetPath.replace(/^Assets\//, '');
    const destPath = path.join(outputBaseDir, subpath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    manifest[relAssetPath] = [header.width, header.height];

    const srcStat = fs.statSync(fullPath);
    const destExists = fs.existsSync(destPath);
    const isUpToDate = destExists && fs.statSync(destPath).mtimeMs >= srcStat.mtimeMs;

    const origDecoded = header.width * header.height * 4;
    const halfWidth = Math.max(1, Math.floor(header.width / 2));
    const halfHeight = Math.max(1, Math.floor(header.height / 2));
    const downDecoded = halfWidth * halfHeight * 4;
    totalDecodedRamSaved += (origDecoded - downDecoded);

    if (isUpToDate) {
      skippedUpToDate++;
      totalSavedBytes += Math.max(0, buf.length - fs.statSync(destPath).size);
      continue;
    }

    try {
      const decoded = decodePngBuffer(buf);
      if (!decoded) continue;

      const downsampled = downsample05x(decoded.width, decoded.height, decoded.pixels);
      const encoded = encodePngRgba(downsampled.width, downsampled.height, downsampled.pixels);

      fs.writeFileSync(destPath, encoded);
      newlyGenerated++;
      totalSavedBytes += Math.max(0, buf.length - encoded.length);
    } catch (err) {
      console.warn(`⚠️ [Mobile Asset Pipeline] Failed to process ${relAssetPath}:`, err.message);
    }
  }

  // Write mobileAssetManifest.js
  const manifestPath = path.join(rootDir, 'js', 'configs', 'mobileAssetManifest.js');
  const manifestContent = `// ─────────────────────────────────────────────
// AUTO-GENERATED MOBILE ASSET MANIFEST (@0.5x Pipeline)
// Generated by scripts/buildMobileAssets.mjs
// Maps 1x asset paths to original [width, height] dimensions.
// ─────────────────────────────────────────────

export const MOBILE_ASSET_MANIFEST = ${JSON.stringify(manifest, null, 2)};
`;

  fs.writeFileSync(manifestPath, manifestContent, 'utf8');

  log(`   ✅ Processed ${Object.keys(manifest).length} large assets (${newlyGenerated} newly generated, ${skippedUpToDate} up to date).`);
  log(`   📉 Decoded RAM savings pool: ${(totalDecodedRamSaved / 1024 / 1024).toFixed(1)} MB (75% reduction on mobile).`);
  log(`   💾 Storage savings: ${(totalSavedBytes / 1024 / 1024).toFixed(1)} MB.`);
  log(`   📄 Manifest written to js/configs/mobileAssetManifest.js\n`);

  return {
    totalAssets: Object.keys(manifest).length,
    newlyGenerated,
    skippedUpToDate,
    totalSavedBytes,
    totalDecodedRamSaved
  };
}

if (process.argv[1] && process.argv[1].endsWith('buildMobileAssets.mjs')) {
  buildMobileAssets();
}
