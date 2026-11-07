/**
 * buildAudioSprite.mjs
 * 
 * Mobile Web Audio SFX & Character Voice Sprite Packing & Virtual Slicing Engine
 * 1. Packs universal high-frequency combat SFX (punches, slashes, dashes, impacts,
 *    announcer bells/ticks) into `Assets/Sound Effects/Sprites/combat_core_sfx.mp3`.
 * 2. Packs per-character short voice lines, chants, domain calls, and unique SFX
 *    into `Assets/Sound Effects/Sprites/Characters/char_<charId>_sfx.mp3`, eliminating
 *    dozens of separate HTTP round-trips during pre-match loading on mobile devices.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { CONFIG, FIGHTER_DEFS } from '../js/core/config.js';
import { getFighterBasicAttackSoundPaths } from '../js/soundEffects/basicAttackSounds.js';
import { getFighterSkillSoundPaths } from '../js/soundEffects/skillSounds.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let ffmpegPath = null;
try {
  const ffmpegModule = await import('ffmpeg-static');
  ffmpegPath = ffmpegModule.default || ffmpegModule;
} catch (e) {
  ffmpegPath = null;
}

if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
  console.error('❌ ffmpeg-static not available. Cannot pack audio sprite.');
  process.exit(1);
}

export const CORE_SOUND_ENTRIES = [
  // Core Melee & Impact Hits
  { keys: ['punch', 'attack_punch'], path: 'Assets/Sound Effects/Attacks/punch.mp3' },
  { keys: ['heavypunch1', 'attack_heavypunch1'], path: 'Assets/Sound Effects/Attacks/heavypunch1.mp3' },
  { keys: ['heavypunch2', 'attack_heavypunch2'], path: 'Assets/Sound Effects/Attacks/heavypunch2.mp3' },
  { keys: ['heavypunch3', 'attack_heavypunch3'], path: 'Assets/Sound Effects/Attacks/heavypunch3.mp3' },
  { keys: ['fleshhit', 'attack_fleshhit'], path: 'Assets/Sound Effects/Attacks/fleshhit.mp3' },
  { keys: ['swordswing', 'attack_swordswing'], path: 'Assets/Sound Effects/Attacks/swordswing.mp3' },
  { keys: ['groundSmash', 'attack_groundsmash'], path: 'Assets/Sound Effects/Attacks/groundSmash.mp3' },
  { keys: ['explosion', 'attack_explosion'], path: 'Assets/Sound Effects/Attacks/explosion.mp3' },
  { keys: ['spaceshot', 'attack_spaceshot'], path: 'Assets/Sound Effects/Attacks/spaceshot.mp3' },
  { keys: ['laserpew', 'attack_laserpew'], path: 'Assets/Sound Effects/Attacks/laserpew.mp3' },
  { keys: ['lasersniper1', 'crimsonSniperShot'], path: 'Assets/Sound Effects/Attacks/lasersniper1.mp3' },
  { keys: ['Sukuna-slice', 'sukuna_slice', 'attack_sukunaslice'], path: 'Assets/Sound Effects/Attacks/Sukuna-slice.mp3' },
  { keys: ['energysword'], path: 'Assets/Sound Effects/Attacks/energysword.mp3' },
  { keys: ['energysword2'], path: 'Assets/Sound Effects/Attacks/energysword2.mp3' },
  { keys: ['shurikenthrow'], path: 'Assets/Sound Effects/Attacks/shurikenthrow.mp3' },
  { keys: ['spikestab'], path: 'Assets/Sound Effects/Attacks/spikestab.mp3' },
  { keys: ['syctheattack'], path: 'Assets/Sound Effects/Attacks/syctheattack.mp3' },

  // Dashes & Combat Skills
  { keys: ['dash1', 'skill_dash1', 'ui_click'], path: 'Assets/Sound Effects/Skills/dash1.mp3' },
  { keys: ['dash2', 'skill_dash2'], path: 'Assets/Sound Effects/Skills/dash2.mp3' },
  { keys: ['dash3', 'skill_dash3', 'ui_hover'], path: 'Assets/Sound Effects/Skills/dash3.mp3' },
  { keys: ['dash4', 'skill_dash4'], path: 'Assets/Sound Effects/Skills/dash4.mp3' },
  { keys: ['dash5', 'skill_dash5'], path: 'Assets/Sound Effects/Skills/dash5.mp3' },
  { keys: ['backstab', 'skill_backstab'], path: 'Assets/Sound Effects/Skills/backstab.mp3' },
  { keys: ['parry', 'skill_parry'], path: 'Assets/Sound Effects/Skills/parry.mp3' },
  { keys: ['shieldblock', 'shield_block', 'skill_shieldblock'], path: 'Assets/Sound Effects/Skills/shieldblock.mp3' },
  { keys: ['shieldbreak', 'shield_break'], path: 'Assets/Sound Effects/SkillEffects/shield-break.mp3' },

  // Announcer & UI
  { keys: ['timertick'], path: 'Assets/Sound Effects/Announcer/timertick.mp3' },
  { keys: ['bell', 'ui_bell'], path: 'Assets/Sound Effects/Announcer/bell.mp3' },
  { keys: ['fight'], path: 'Assets/Sound Effects/Announcer/fight.mp3' },
  { keys: ['ringbell', 'ring_bell'], path: 'Assets/Sound Effects/Announcer/ring-bell.mp3' },
  { keys: ['battleintro_transitions', 'battleintro-transitions'], path: 'Assets/Sound Effects/Announcer/era_dev-duplicispear-swing.wav' }
];

const _durationCache = new Map();

/**
 * Measures exact sample-accurate duration in seconds via PCM decode.
 * @param {string} fullPath
 * @returns {number}
 */
function measureExactDuration(fullPath) {
  if (_durationCache.has(fullPath)) {
    return _durationCache.get(fullPath);
  }
  const buf = execFileSync(ffmpegPath, [
    '-i', fullPath,
    '-f', 's16le',
    '-ac', '1',
    '-ar', '44100',
    '-'
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  const rawDuration = buf.length / (2 * 44100);
  _durationCache.set(fullPath, rawDuration);
  return rawDuration;
}

/**
 * Recursively extracts audio paths from a character config object.
 */
function extractSoundsFromConfig(obj, seen = new Set(), results = []) {
  if (!obj || typeof obj !== 'object' || seen.has(obj)) return results;
  seen.add(obj);

  for (const val of Object.values(obj)) {
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      if ((lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg')) && !results.includes(val)) {
        results.push(val);
      }
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string') {
          const lower = item.toLowerCase();
          if ((lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg')) && !results.includes(item)) {
            results.push(item);
          }
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      extractSoundsFromConfig(val, seen, results);
    }
  }
  return results;
}

/**
 * Determines whether a sound file is eligible for packing into a character voice/SFX sprite.
 * Excludes looping tracks, full-length BGM themes, and clips longer than 4.5s.
 */
function isPackableCharacterClip(relPath, fullPath, corePathSet) {
  if (!relPath || !fs.existsSync(fullPath)) return false;
  const cleanRel = relPath.replace(/\\/g, '/');
  const lower = cleanRel.toLowerCase();
  if (corePathSet.has(lower)) return false;

  // Exclude looping sounds and background music tracks
  if (
    lower.includes('loop') ||
    lower.includes('bgm') ||
    lower.includes('background') ||
    lower.includes('theme') ||
    lower.includes('music') ||
    lower.includes('flamespray1') ||
    lower.includes('chainsaw_engine') ||
    lower.includes('fugatravel') ||
    lower.includes('walking')
  ) {
    return false;
  }

  const stat = fs.statSync(fullPath);
  if (stat.size > 180 * 1024) return false; // Cap file size at 180 KB to exclude long musical themes

  try {
    const dur = measureExactDuration(fullPath);
    if (dur <= 0.02 || dur > 4.5) return false; // Restrict strictly to short voice/SFX clips (<= 4.5s)
  } catch (e) {
    return false;
  }

  return true;
}

export async function buildAudioSprite() {
  console.log('📦 [Sound Sprite Pipeline] Packing core combat audio into single sprite atlas...');

  const outputDir = path.join(rootDir, 'Assets', 'Sound Effects', 'Sprites');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'combat_core_sfx.mp3');

  const paddingSec = 0.05; // 50ms silence padding to avoid overlap bleed
  const slices = {};
  let currentOffset = 0;

  const validEntries = [];
  const corePathSet = new Set();

  for (const entry of CORE_SOUND_ENTRIES) {
    const fullPath = path.join(rootDir, entry.path);
    if (fs.existsSync(fullPath)) {
      validEntries.push({ ...entry, fullPath });
      corePathSet.add(entry.path.toLowerCase());
    } else {
      console.warn(`⚠️ Warning: Sound file not found on disk: ${entry.path}`);
    }
  }

  if (validEntries.length === 0) {
    console.error('❌ No valid sound files found to pack.');
    return null;
  }

  // 1. Measure exact sample-accurate durations via PCM decode
  for (const entry of validEntries) {
    const rawDuration = measureExactDuration(entry.fullPath);
    const durationRounded = Math.round(rawDuration * 1000) / 1000;
    const offsetRounded = Math.round(currentOffset * 1000) / 1000;

    // Register all aliases
    const sliceData = [offsetRounded, durationRounded];
    entry.keys.forEach(k => {
      slices[k] = sliceData;
      slices[k.toLowerCase()] = sliceData;
    });
    slices[entry.path] = sliceData;
    slices[entry.path.toLowerCase()] = sliceData;

    currentOffset += rawDuration + paddingSec;
  }

  // 2. Concatenate core audio files with ffmpeg (incremental check)
  const maxCoreSrcMtime = Math.max(...validEntries.map(e => fs.statSync(e.fullPath).mtimeMs));
  const coreNeedsEncode = !fs.existsSync(outputFile) || fs.statSync(outputFile).mtimeMs < maxCoreSrcMtime;

  if (coreNeedsEncode) {
    const ffmpegArgs = [];
    validEntries.forEach(e => ffmpegArgs.push('-i', e.fullPath));

    const filter = validEntries.map((_, i) => `[${i}:a]aformat=sample_rates=44100:channel_layouts=stereo,apad=pad_dur=${paddingSec}[a${i}]`).join(';') +
      ';' + validEntries.map((_, i) => `[a${i}]`).join('') + `concat=n=${validEntries.length}:v=0:a=1[out]`;

    ffmpegArgs.push('-filter_complex', filter, '-map', '[out]', '-b:a', '128k', '-y', outputFile);
    execFileSync(ffmpegPath, ffmpegArgs, { stdio: 'ignore' });
  }

  const stat = fs.statSync(outputFile);
  const sizeKb = (stat.size / 1024).toFixed(1);

  // 3. Write Core Manifest
  const manifestPath = path.join(rootDir, 'js', 'configs', 'combatSoundSpriteManifest.js');
  const manifestContent = `// Automatically generated by scripts/buildAudioSprite.mjs
export const COMBAT_SOUND_SPRITE_MANIFEST = {
  sheetId: 'combat_core_sfx',
  audioUrl: 'Assets/Sound Effects/Sprites/combat_core_sfx.mp3',
  totalDuration: ${Math.round(currentOffset * 100) / 100},
  sliceCount: ${validEntries.length},
  slices: ${JSON.stringify(slices, null, 2)}
};
`;

  fs.writeFileSync(manifestPath, manifestContent, 'utf8');
  console.log(`✅ [Sound Sprite Pipeline] Core combat atlas ready: combat_core_sfx.mp3 (${sizeKb} KB, ${validEntries.length} sounds, ${currentOffset.toFixed(2)}s total).`);

  // 4. Build Secondary Per-Character Voice Line & SFX Sound Sprite Atlases
  console.log('🎙️ [Sound Sprite Pipeline] Building per-character voice line & SFX sprite atlases...');
  const charSpritesDir = path.join(outputDir, 'Characters');
  fs.mkdirSync(charSpritesDir, { recursive: true });

  const characterManifest = {};
  let builtCharSheets = 0;
  let cachedCharSheets = 0;
  let totalCharSlices = 0;
  let totalCharSizeBytes = 0;

  for (const def of FIGHTER_DEFS) {
    const fId = def.id;
    const fType = def.type || def.characterId;
    const rawCharId = def.characterId || fType || fId;
    if (!rawCharId) continue;
    const charKey = String(rawCharId).toLowerCase();
    if (characterManifest[charKey]) continue;

    const rawPaths = [
      ...getFighterBasicAttackSoundPaths(fId, fType),
      ...getFighterSkillSoundPaths(fId),
      ...(fType && fType !== fId ? getFighterSkillSoundPaths(fType) : []),
      ...(rawCharId && rawCharId !== fType ? getFighterSkillSoundPaths(rawCharId) : []),
      ...extractSoundsFromConfig(CONFIG[rawCharId] || CONFIG[charKey] || CONFIG[fType] || CONFIG[fId])
    ];

    const uniqueRelPaths = [...new Set(rawPaths.filter(Boolean).map(p => String(p).replace(/\\/g, '/')))];
    const packableEntries = [];

    for (const relPath of uniqueRelPaths) {
      const fullPath = path.join(rootDir, relPath);
      if (isPackableCharacterClip(relPath, fullPath, corePathSet)) {
        packableEntries.push({ relPath, fullPath });
      }
    }

    // Only build a dedicated character sprite atlas if the fighter has >= 2 short voice/SFX clips
    if (packableEntries.length < 2) continue;

    const sheetId = `char_voice_${charKey}`;
    const outFileName = `char_${charKey}_sfx.mp3`;
    const outRelUrl = `Assets/Sound Effects/Sprites/Characters/${outFileName}`;
    const outFullPath = path.join(charSpritesDir, outFileName);

    let charOffset = 0;
    const charSlices = {};

    for (const item of packableEntries) {
      const rawDur = measureExactDuration(item.fullPath);
      const durRounded = Math.round(rawDur * 1000) / 1000;
      const offRounded = Math.round(charOffset * 1000) / 1000;
      const sliceTuple = [offRounded, durRounded];

      // Register exact relative path and basename aliases
      charSlices[item.relPath] = sliceTuple;
      const baseName = path.basename(item.relPath);
      const baseNoExt = path.basename(item.relPath, path.extname(item.relPath));
      if (!corePathSet.has(baseName.toLowerCase())) {
        charSlices[baseName] = sliceTuple;
      }
      if (!corePathSet.has(baseNoExt.toLowerCase())) {
        charSlices[baseNoExt] = sliceTuple;
      }

      charOffset += rawDur + paddingSec;
    }

    const maxSrcMtime = Math.max(...packableEntries.map(e => fs.statSync(e.fullPath).mtimeMs));
    const needsEncode = !fs.existsSync(outFullPath) || fs.statSync(outFullPath).mtimeMs < maxSrcMtime;

    if (needsEncode) {
      const ffmpegArgs = [];
      packableEntries.forEach(e => ffmpegArgs.push('-i', e.fullPath));

      const filter = packableEntries.map((_, i) => `[${i}:a]aformat=sample_rates=44100:channel_layouts=stereo,apad=pad_dur=${paddingSec}[a${i}]`).join(';') +
        ';' + packableEntries.map((_, i) => `[a${i}]`).join('') + `concat=n=${packableEntries.length}:v=0:a=1[out]`;

      ffmpegArgs.push('-filter_complex', filter, '-map', '[out]', '-b:a', '128k', '-y', outFullPath);
      execFileSync(ffmpegPath, ffmpegArgs, { stdio: 'ignore' });
      builtCharSheets++;
    } else {
      cachedCharSheets++;
    }

    const outStat = fs.statSync(outFullPath);
    totalCharSizeBytes += outStat.size;
    totalCharSlices += packableEntries.length;

    characterManifest[charKey] = {
      sheetId,
      characterId: charKey,
      audioUrl: outRelUrl,
      totalDuration: Math.round(charOffset * 100) / 100,
      sliceCount: packableEntries.length,
      slices: charSlices
    };
  }

  const charManifestPath = path.join(rootDir, 'js', 'configs', 'characterVoiceSpriteManifest.js');
  const charManifestContent = `// Automatically generated by scripts/buildAudioSprite.mjs
export const CHARACTER_VOICE_SPRITE_MANIFEST = ${JSON.stringify(characterManifest, null, 2)};
`;
  fs.writeFileSync(charManifestPath, charManifestContent, 'utf8');

  const totalCharMb = (totalCharSizeBytes / (1024 * 1024)).toFixed(2);
  const totalCharSheetCount = Object.keys(characterManifest).length;
  console.log(`✅ [Sound Sprite Pipeline] Packed ${totalCharSheetCount} character voice/SFX atlases (${totalCharSlices} slices, ${totalCharMb} MB total; ${builtCharSheets} encoded, ${cachedCharSheets} cached).`);
  console.log(`✅ [Sound Sprite Pipeline] Manifest written to js/configs/characterVoiceSpriteManifest.js`);

  return {
    outputFile,
    manifestPath,
    charManifestPath,
    sizeKb,
    count: validEntries.length,
    charSheetCount: totalCharSheetCount,
    charSliceCount: totalCharSlices
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildAudioSprite().catch(err => {
    console.error('Error building sound sprite:', err);
    process.exit(1);
  });
}
