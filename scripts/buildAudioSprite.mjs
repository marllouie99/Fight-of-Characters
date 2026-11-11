/**
 * buildAudioSprite.mjs
 * 
 * Automated Character Voice Atlas Generator & Mobile Sound Sprite Packing Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Packs universal high-frequency combat SFX (punches, slashes, dashes, impacts,
 *    announcer bells/ticks) into `Assets/Sound Effects/Sprites/combat_core_sfx.mp3`.
 * 2. Packs per-character short voice lines, chants, domain calls, and unique SFX
 *    into `Assets/Sound Effects/Sprites/Characters/char_<charId>_sfx.mp3`, eliminating
 *    hundreds of separate HTTP round-trips during pre-match loading on mobile devices.
 * 3. Supports targeted single/multi-character packing with atomic manifest merging:
 *    `npm run build:voicesprite sukuna` (preserves all other 42+ characters).
 * 4. Includes `--inspect <characterId>` audio diagnostics, `--list` registry table,
 *    `--clean` orphaned file pruner, and `--force` cache bypass.
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
  { keys: ['battleintro_transitions', 'battleintro-transitions'], path: 'Assets/Sound Effects/Announcer/era_dev-duplicispear-swing.wav' },
  { keys: ['faah'], path: 'Assets/Sound Effects/Announcer/faah.mp3' },
  { keys: ['youwin', 'street_fighter_you_win'], path: 'Assets/Sound Effects/Announcer/street-fighter-ii-you-win.mp3' },
  { keys: ['fighter_summon', 'era_eno_clericstaffhit'], path: 'Assets/Sound Effects/Announcer/era_eno_clericstaffhit.wav' },

  // Universal Fighter Death & Tombstone SFX
  { keys: ['crazydave_planting'], path: 'Assets/Sound Effects/SkillEffects/crazydave-Planting.ogg' },
  { keys: ['effect_flare'], path: 'Assets/Sound Effects/SkillEffects/flare.mp3' }
];

const _durationCache = new Map();

/**
 * Measures exact sample-accurate duration in seconds via PCM decode.
 * @param {string} fullPath
 * @returns {number}
 */
export function measureExactDuration(fullPath) {
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
 * Comprehensive sound clip evaluator: determines eligibility and diagnostic reason.
 * Excludes looping continuous audio, BGM musical themes, and clips longer than 4.5s.
 * @param {string} relPath
 * @param {string} fullPath
 * @param {Set<string>} corePathSet
 * @returns {{ eligible: boolean, reason?: string, cleanRel?: string, duration?: number, size?: number }}
 */
export function evaluateSoundClip(relPath, fullPath, corePathSet) {
  if (!relPath) return { eligible: false, reason: 'EMPTY_PATH' };
  const cleanRel = relPath.replace(/\\/g, '/');
  if (!fs.existsSync(fullPath)) {
    return { eligible: false, reason: 'FILE_NOT_FOUND', cleanRel };
  }

  const lower = cleanRel.toLowerCase();
  if (corePathSet && corePathSet.has(lower)) {
    return { eligible: false, reason: 'CORE_ATLAS_DUPLICATE', cleanRel };
  }

  // Exclude looping sounds and background music tracks
  if (
    lower.includes('loop') ||
    lower.includes('bgm') ||
    lower.includes('background') ||
    lower.includes('theme') ||
    lower.includes('music') ||
    lower.includes('ambient') ||
    lower.includes('ost') ||
    lower.includes('song') ||
    lower.includes('flamespray1') ||
    lower.includes('chainsaw_engine') ||
    lower.includes('fugatravel') ||
    lower.includes('walking')
  ) {
    return { eligible: false, reason: 'LOOP_OR_BGM_TRACK', cleanRel };
  }

  const stat = fs.statSync(fullPath);
  const isWav = lower.endsWith('.wav');
  // 180 KB for mp3/ogg, 850 KB for uncompressed wav
  const maxSize = isWav ? 850 * 1024 : 180 * 1024;
  if (stat.size > maxSize) {
    return { eligible: false, reason: `FILE_TOO_LARGE (${(stat.size / 1024).toFixed(0)} KB)`, cleanRel, size: stat.size };
  }

  try {
    const dur = measureExactDuration(fullPath);
    if (dur <= 0.02) {
      return { eligible: false, reason: `DURATION_TOO_SHORT (${dur.toFixed(2)}s <= 0.02s)`, cleanRel, duration: dur, size: stat.size };
    }
    if (dur > 4.5) {
      return { eligible: false, reason: `DURATION_TOO_LONG (${dur.toFixed(2)}s > 4.5s)`, cleanRel, duration: dur, size: stat.size };
    }
    return { eligible: true, cleanRel, duration: dur, size: stat.size };
  } catch (e) {
    return { eligible: false, reason: `FFMPEG_DECODE_ERROR (${e.message})`, cleanRel };
  }
}

/**
 * Resolves a fighter definition matching a given query (characterId, type, id, or name).
 * @param {string|number} query
 * @returns {object|null}
 */
export function findFighterDef(query) {
  if (query === undefined || query === null) return null;
  const q = String(query).toLowerCase().trim();
  return FIGHTER_DEFS.find(def => {
    const charId = String(def.characterId || '').toLowerCase();
    const type = String(def.type || '').toLowerCase();
    const id = String(def.id || '').toLowerCase();
    const name = String(def.name || '').toLowerCase();
    const displayName = String(def.displayName || '').toLowerCase();
    return charId === q || type === q || id === q || name === q || displayName === q || name.includes(q);
  }) || null;
}

/**
 * Loads the existing character voice sprite manifest safely from disk.
 * @param {string} charManifestPath
 * @returns {Promise<object>}
 */
async function loadExistingCharacterManifest(charManifestPath) {
  if (!fs.existsSync(charManifestPath)) return {};
  try {
    const fileUrl = `file://${charManifestPath.replace(/\\/g, '/')}?t=${Date.now()}`;
    const mod = await import(fileUrl);
    if (mod.CHARACTER_VOICE_SPRITE_MANIFEST) {
      return { ...mod.CHARACTER_VOICE_SPRITE_MANIFEST };
    }
  } catch (_) {
    try {
      const raw = fs.readFileSync(charManifestPath, 'utf8');
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(raw.slice(start, end + 1));
      }
    } catch (_) {}
  }
  return {};
}

/**
 * Writes the character voice sprite manifest cleanly formatted with sorted keys.
 * @param {string} charManifestPath
 * @param {object} characterManifest
 */
function saveCharacterManifest(charManifestPath, characterManifest) {
  const sortedManifest = {};
  for (const key of Object.keys(characterManifest).sort()) {
    sortedManifest[key] = characterManifest[key];
  }
  const content = `// Automatically generated by scripts/buildAudioSprite.mjs\nexport const CHARACTER_VOICE_SPRITE_MANIFEST = ${JSON.stringify(sortedManifest, null, 2)};\n`;
  fs.writeFileSync(charManifestPath, content, 'utf8');
}

/**
 * Detailed terminal diagnostic: audits all audio files for a character and displays inclusion status.
 * @param {string} charQuery
 * @param {Set<string>} corePathSet
 */
export function inspectCharacter(charQuery, corePathSet) {
  const def = findFighterDef(charQuery) || { id: charQuery, type: charQuery, characterId: charQuery, name: charQuery };
  console.log(`\n🔍 AUDIT: Voice Atlas Sound Candidates for "${def.name || charQuery}" [id: ${def.id}, type: ${def.type || 'n/a'}]`);
  console.log('─────────────────────────────────────────────────────────────────────────────');

  const rawCharId = def.characterId || def.type || def.id;
  const cfg = CONFIG[rawCharId] || CONFIG[String(rawCharId).toLowerCase()] || CONFIG[def.type] || CONFIG[def.id];

  const rawPaths = [
    ...getFighterBasicAttackSoundPaths(def.id, def.type),
    ...getFighterSkillSoundPaths(def.id),
    ...(def.type && def.type !== def.id ? getFighterSkillSoundPaths(def.type) : []),
    ...(rawCharId && rawCharId !== def.type ? getFighterSkillSoundPaths(rawCharId) : []),
    ...extractSoundsFromConfig(cfg)
  ];

  const uniqueRelPaths = [...new Set(rawPaths.filter(Boolean).map(p => String(p).replace(/\\/g, '/')))];
  if (uniqueRelPaths.length === 0) {
    console.log('⚠️ No sound effects or voice lines declared in character config or skill mappings.');
    return;
  }

  let includedCount = 0;
  let excludedCount = 0;
  let totalDur = 0;

  for (const relPath of uniqueRelPaths) {
    const fullPath = path.join(rootDir, relPath);
    const evalResult = evaluateSoundClip(relPath, fullPath, corePathSet);
    if (evalResult.eligible) {
      includedCount++;
      totalDur += evalResult.duration;
      const durStr = evalResult.duration.toFixed(2) + 's';
      const sizeStr = (evalResult.size / 1024).toFixed(1) + ' KB';
      console.log(`  ✅ [PACKED]   ${relPath.padEnd(52)} (${durStr.padStart(5)}, ${sizeStr.padStart(8)})`);
    } else {
      excludedCount++;
      console.log(`  ❌ [EXCLUDED] ${relPath.padEnd(52)} -> ${evalResult.reason}`);
    }
  }

  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log(`Summary: ${includedCount} packed (${totalDur.toFixed(2)}s total), ${excludedCount} excluded (${uniqueRelPaths.length} candidates).`);
  if (includedCount >= 2) {
    console.log(`Status:  Eligible for character voice atlas (char_${String(rawCharId).toLowerCase()}_sfx.mp3).`);
  } else {
    console.log(`Status:  Not eligible for dedicated sprite sheet (< 2 short clips). Will stream individually on demand.`);
  }
}

/**
 * Displays a clean ASCII table of all registered character voice sprite atlases.
 * @param {string} charManifestPath
 * @param {string} charSpritesDir
 */
export function listCharacterAtlases(charManifestPath, charSpritesDir) {
  let manifest = {};
  if (fs.existsSync(charManifestPath)) {
    try {
      const raw = fs.readFileSync(charManifestPath, 'utf8');
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        manifest = JSON.parse(raw.slice(start, end + 1));
      }
    } catch (e) {
      console.error('Failed to read character voice sprite manifest:', e.message);
      return;
    }
  }

  const entries = Object.entries(manifest);
  if (entries.length === 0) {
    console.log('No character voice sprite atlases found in manifest.');
    return;
  }

  console.log('\n🎙️ REGISTERED CHARACTER VOICE SFX SPRITE ATLASES:');
  console.log('┌─────────────────────┬───────────────────────────┬────────┬──────────┬──────────┬────────────────────────────────────────────────────────┐');
  console.log('│ Character ID        │ Sheet ID                  │ Slices │ Duration │ Size     │ Audio Path                                             │');
  console.log('├─────────────────────┼───────────────────────────┼────────┼──────────┼──────────┼────────────────────────────────────────────────────────┤');

  let totalSlices = 0;
  let totalDur = 0;
  let totalBytes = 0;

  for (const [charId, data] of entries) {
    const fileName = `char_${charId}_sfx.mp3`;
    const fullPath = path.join(charSpritesDir, fileName);
    let sizeStr = 'Missing';
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      totalBytes += stat.size;
      sizeStr = (stat.size / 1024).toFixed(1) + ' KB';
    }
    totalSlices += data.sliceCount || 0;
    totalDur += data.totalDuration || 0;

    const cIdCol = charId.padEnd(19);
    const sIdCol = (data.sheetId || '').padEnd(25);
    const slCol = String(data.sliceCount || 0).padStart(6);
    const durCol = (String(data.totalDuration || 0) + 's').padStart(8);
    const szCol = sizeStr.padStart(8);
    const pathCol = (data.audioUrl || '').slice(0, 54).padEnd(54);

    console.log(`│ ${cIdCol} │ ${sIdCol} │ ${slCol} │ ${durCol} │ ${szCol} │ ${pathCol} │`);
  }

  console.log('└─────────────────────┴───────────────────────────┴────────┴──────────┴──────────┴────────────────────────────────────────────────────────┘');
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`Total: ${entries.length} character atlases | ${totalSlices} slices | ${totalDur.toFixed(1)}s audio | ${totalMb} MB combined\n`);
}

/**
 * Removes orphaned char_*.mp3 voice files on disk that are not registered in the manifest.
 * @param {string} charManifestPath
 * @param {string} charSpritesDir
 */
export function cleanOrphanedVoiceFiles(charManifestPath, charSpritesDir) {
  if (!fs.existsSync(charSpritesDir)) return;
  let manifest = {};
  if (fs.existsSync(charManifestPath)) {
    try {
      const raw = fs.readFileSync(charManifestPath, 'utf8');
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        manifest = JSON.parse(raw.slice(start, end + 1));
      }
    } catch (_) {}
  }

  const validFiles = new Set(Object.keys(manifest).map(id => `char_${id}_sfx.mp3`));
  const filesOnDisk = fs.readdirSync(charSpritesDir).filter(f => f.startsWith('char_') && f.endsWith('.mp3'));

  let removedCount = 0;
  for (const f of filesOnDisk) {
    if (!validFiles.has(f)) {
      const p = path.join(charSpritesDir, f);
      fs.unlinkSync(p);
      console.log(`🗑️ Removed orphaned voice sprite: ${f}`);
      removedCount++;
    }
  }

  if (removedCount === 0) {
    console.log('✅ No orphaned voice sprite files found. All files on disk match active manifest.');
  } else {
    console.log(`✅ Pruned ${removedCount} orphaned voice sprite file(s).`);
  }
}

/**
 * Primary Sound Sprite & Character Voice Atlas Packing Engine.
 * Supports targeted single-character compilation, full batch processing, and diagnostics.
 * @param {object} [options]
 * @returns {Promise<object|null>}
 */
export async function buildAudioSprite(options = {}) {
  const {
    characters = [],
    voiceOnly = false,
    coreOnly = false,
    force = false,
    inspect = null,
    list = false,
    clean = false
  } = options;

  const outputDir = path.join(rootDir, 'Assets', 'Sound Effects', 'Sprites');
  const charSpritesDir = path.join(outputDir, 'Characters');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(charSpritesDir, { recursive: true });

  const outputFile = path.join(outputDir, 'combat_core_sfx.mp3');
  const manifestPath = path.join(rootDir, 'js', 'configs', 'combatSoundSpriteManifest.js');
  const charManifestPath = path.join(rootDir, 'js', 'configs', 'characterVoiceSpriteManifest.js');

  const paddingSec = 0.05; // 50ms silence padding to avoid overlap bleed
  const corePathSet = new Set();
  CORE_SOUND_ENTRIES.forEach(e => corePathSet.add(e.path.toLowerCase()));

  // 1. Diagnostic Modes
  if (inspect) {
    inspectCharacter(inspect, corePathSet);
    return null;
  }

  if (list) {
    listCharacterAtlases(charManifestPath, charSpritesDir);
    return null;
  }

  if (clean) {
    cleanOrphanedVoiceFiles(charManifestPath, charSpritesDir);
    return null;
  }

  // 2. Build Core Combat Sound Sprite (unless voice-only or single character targeted)
  let coreResults = null;
  const isSingleCharTargeted = Array.isArray(characters) && characters.length > 0;

  if (!voiceOnly && !isSingleCharTargeted) {
    console.log('📦 [Sound Sprite Pipeline] Packing core combat audio into single sprite atlas...');
    const validEntries = [];

    for (const entry of CORE_SOUND_ENTRIES) {
      const fullPath = path.join(rootDir, entry.path);
      if (fs.existsSync(fullPath)) {
        validEntries.push({ ...entry, fullPath });
      } else {
        console.warn(`⚠️ Warning: Sound file not found on disk: ${entry.path}`);
      }
    }

    if (validEntries.length > 0) {
      const slices = {};
      let currentOffset = 0;

      for (const entry of validEntries) {
        const rawDuration = measureExactDuration(entry.fullPath);
        const durationRounded = Math.round(rawDuration * 1000) / 1000;
        const offsetRounded = Math.round(currentOffset * 1000) / 1000;

        const sliceData = [offsetRounded, durationRounded];
        entry.keys.forEach(k => {
          slices[k] = sliceData;
          slices[k.toLowerCase()] = sliceData;
        });
        slices[entry.path] = sliceData;
        slices[entry.path.toLowerCase()] = sliceData;

        currentOffset += rawDuration + paddingSec;
      }

      const maxCoreSrcMtime = Math.max(
        fs.statSync(__filename).mtimeMs,
        ...validEntries.map(e => fs.statSync(e.fullPath).mtimeMs)
      );
      let coreDurationMismatch = false;
      if (fs.existsSync(outputFile)) {
        try {
          const actualDur = measureExactDuration(outputFile);
          if (Math.abs(actualDur - currentOffset) > 0.25) {
            coreDurationMismatch = true;
          }
        } catch (_) {
          coreDurationMismatch = true;
        }
      }
      const coreNeedsEncode = force || !fs.existsSync(outputFile) || coreDurationMismatch || fs.statSync(outputFile).mtimeMs < maxCoreSrcMtime;

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

      const manifestContent = `// Automatically generated by scripts/buildAudioSprite.mjs\nexport const COMBAT_SOUND_SPRITE_MANIFEST = {\n  sheetId: 'combat_core_sfx',\n  audioUrl: 'Assets/Sound Effects/Sprites/combat_core_sfx.mp3',\n  totalDuration: ${Math.round(currentOffset * 100) / 100},\n  sliceCount: ${validEntries.length},\n  slices: ${JSON.stringify(slices, null, 2)}\n};\n`;
      fs.writeFileSync(manifestPath, manifestContent, 'utf8');
      console.log(`✅ [Sound Sprite Pipeline] Core combat atlas ready: combat_core_sfx.mp3 (${sizeKb} KB, ${validEntries.length} sounds, ${currentOffset.toFixed(2)}s total).`);

      coreResults = { sizeKb, count: validEntries.length, duration: currentOffset };
    }
  }

  if (coreOnly) {
    return { coreResults };
  }

  // 3. Build Character Voice Atlases
  const existingManifest = await loadExistingCharacterManifest(charManifestPath);
  const characterManifest = isSingleCharTargeted ? { ...existingManifest } : {};

  // Resolve target fighter definitions
  let targetDefs = [];
  if (isSingleCharTargeted) {
    for (const charQuery of characters) {
      const found = findFighterDef(charQuery);
      if (found) {
        targetDefs.push(found);
      } else {
        const cleanQuery = String(charQuery).toLowerCase().trim();
        targetDefs.push({ id: cleanQuery, type: cleanQuery, characterId: cleanQuery, name: cleanQuery });
      }
    }
  } else {
    targetDefs = [...FIGHTER_DEFS];
  }

  console.log(`🎙️ [Sound Sprite Pipeline] ${isSingleCharTargeted ? `Targeting ${targetDefs.length} character(s)...` : 'Building per-character voice line & SFX sprite atlases...'}`);

  let builtCharSheets = 0;
  let cachedCharSheets = 0;
  let totalCharSlices = 0;
  let totalCharSizeBytes = 0;

  for (const def of targetDefs) {
    const fId = def.id;
    const fType = def.type || def.characterId;
    const rawCharId = def.characterId || fType || fId;
    if (!rawCharId) continue;
    const charKey = String(rawCharId).toLowerCase();

    // Avoid duplicate iterations when building full roster
    if (!isSingleCharTargeted && characterManifest[charKey]) continue;

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
      const evalResult = evaluateSoundClip(relPath, fullPath, corePathSet);
      if (evalResult.eligible) {
        packableEntries.push({ relPath, fullPath });
      }
    }

    // Only build dedicated character sprite atlas if the fighter has >= 2 short voice/SFX clips
    if (packableEntries.length < 2) {
      if (isSingleCharTargeted) {
        console.log(`ℹ️ [Sound Sprite Pipeline] "${def.name || charKey}" has ${packableEntries.length} short voice clip(s) (< 2 threshold). Streams individually on demand.`);
        if (characterManifest[charKey]) {
          delete characterManifest[charKey];
        }
      }
      continue;
    }

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
    const prevCharEntry = existingManifest[charKey];
    const manifestChanged = !prevCharEntry ||
      prevCharEntry.sliceCount !== packableEntries.length ||
      Math.abs((prevCharEntry.totalDuration || 0) - Math.round(charOffset * 100) / 100) > 0.05;
    const needsEncode = force || !fs.existsSync(outFullPath) || manifestChanged || fs.statSync(outFullPath).mtimeMs < maxSrcMtime;

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

    if (isSingleCharTargeted) {
      const durStr = charOffset.toFixed(2) + 's';
      const sizeStr = (outStat.size / 1024).toFixed(1) + ' KB';
      console.log(`✅ [Sound Sprite Pipeline] "${def.name || charKey}" atlas updated: ${outFileName} (${packableEntries.length} slices, ${durStr}, ${sizeStr}; ${needsEncode ? 'encoded' : 'cached'}).`);
    }
  }

  saveCharacterManifest(charManifestPath, characterManifest);

  const totalCharMb = (totalCharSizeBytes / (1024 * 1024)).toFixed(2);
  const totalCharSheetCount = Object.keys(characterManifest).length;

  if (!isSingleCharTargeted) {
    console.log(`✅ [Sound Sprite Pipeline] Packed ${totalCharSheetCount} character voice/SFX atlases (${totalCharSlices} slices, ${totalCharMb} MB total; ${builtCharSheets} encoded, ${cachedCharSheets} cached).`);
  }
  console.log(`✅ [Sound Sprite Pipeline] Manifest updated at js/configs/characterVoiceSpriteManifest.js`);

  return {
    outputFile,
    manifestPath,
    charManifestPath,
    coreResults,
    charSheetCount: totalCharSheetCount,
    charSliceCount: totalCharSlices
  };
}

function printHelp() {
  console.log(`
🎙️ CIRCLE MINI-BATTLE CHARACTER VOICE ATLAS GENERATOR
=====================================================
Packs and virtualizes character voice lines, skill shouts, domain chants,
and combat SFX into compressed 128kbps stereo MP3 sprite sheets with
zero-latency Web Audio playback slices.

Usage:
  npm run build:sound-sprite                  # Incremental build of core + all characters
  npm run build:voicesprite [characterId...]  # Build voice sprite for character(s)
  node scripts/buildAudioSprite.mjs [options] [characterId...]

Commands & Modes:
  (no args)                     Pack core combat atlas + all character voice atlases (incremental)
  <charId> [charId2...]         Pack voice atlas for specific character(s) and merge into manifest
  --char=<id>, -c <id>          Target specific character (comma-separated or multiple flags)
  --voice-only                  Skip core combat atlas, process only character voice atlases
  --core-only                   Process only universal core combat atlas (combat_core_sfx.mp3)
  --inspect=<id>, -i <id>       Audit all sounds for a fighter (shows included & excluded clips with reasons)
  --list, -l                    Display summary table of all registered character voice sprite atlases
  --clean                       Prune orphaned char_*_sfx.mp3 files not referenced in manifest
  --force, -f                   Bypass modification-time cache and force ffmpeg re-encode
  --help, -h                    Show this help message

Examples:
  npm run build:voicesprite -- sukuna
  node scripts/buildAudioSprite.mjs sukuna --force
  node scripts/buildAudioSprite.mjs --inspect=gojo
  node scripts/buildAudioSprite.mjs --list
  node scripts/buildAudioSprite.mjs --clean
`);
}

function parseCommandLineArgs(argv) {
  const args = argv.slice(2);
  const options = {
    characters: [],
    voiceOnly: false,
    coreOnly: false,
    force: false,
    list: false,
    inspect: null,
    clean: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--list' || arg === '-l') {
      options.list = true;
    } else if (arg === '--clean') {
      options.clean = true;
    } else if (arg === '--voice-only') {
      options.voiceOnly = true;
    } else if (arg === '--core-only') {
      options.coreOnly = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg.startsWith('--char=')) {
      const chars = arg.slice(7).split(',').map(s => s.trim()).filter(Boolean);
      options.characters.push(...chars);
    } else if (arg === '--char' || arg === '-c') {
      if (i + 1 < args.length) {
        options.characters.push(args[++i].trim());
      }
    } else if (arg.startsWith('--inspect=')) {
      options.inspect = arg.slice(10).trim();
    } else if (arg === '--inspect' || arg === '-i') {
      if (i + 1 < args.length) {
        options.inspect = args[++i].trim();
      }
    } else if (arg === '--all') {
      options.all = true;
    } else if (!arg.startsWith('-')) {
      options.characters.push(arg.trim());
    }
  }

  return options;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseCommandLineArgs(process.argv);
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  buildAudioSprite(options).catch(err => {
    console.error('Error building sound sprite:', err);
    process.exit(1);
  });
}
