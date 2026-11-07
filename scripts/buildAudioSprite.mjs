/**
 * buildAudioSprite.mjs
 * 
 * Mobile Web Audio SFX Sprite Packing & Virtual Slicing Engine
 * Concatenates dozens of high-frequency combat SFX, punches, slashes, dashes,
 * and impacts into a single compact MP3 file (~500 KB) with sample-accurate
 * byte offsets, eliminating 30+ separate HTTP network round-trips on mobile devices.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

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

export async function buildAudioSprite() {
  console.log('📦 [Sound Sprite Pipeline] Packing core combat audio into single sprite atlas...');

  const outputDir = path.join(rootDir, 'Assets', 'Sound Effects', 'Sprites');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'combat_core_sfx.mp3');

  const paddingSec = 0.05; // 50ms silence padding to avoid overlap bleed
  const slices = {};
  let currentOffset = 0;

  const validEntries = [];
  for (const entry of CORE_SOUND_ENTRIES) {
    const fullPath = path.join(rootDir, entry.path);
    if (fs.existsSync(fullPath)) {
      validEntries.push({ ...entry, fullPath });
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
    const buf = execFileSync(ffmpegPath, [
      '-i', entry.fullPath,
      '-f', 's16le',
      '-ac', '1',
      '-ar', '44100',
      '-'
    ], { stdio: ['ignore', 'pipe', 'ignore'] });

    const rawDuration = buf.length / (2 * 44100);
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

  // 2. Concatenate audio files with ffmpeg
  const ffmpegArgs = [];
  validEntries.forEach(e => ffmpegArgs.push('-i', e.fullPath));

  const filter = validEntries.map((_, i) => `[${i}:a]aformat=sample_rates=44100:channel_layouts=stereo,apad=pad_dur=${paddingSec}[a${i}]`).join(';') +
    ';' + validEntries.map((_, i) => `[a${i}]`).join('') + `concat=n=${validEntries.length}:v=0:a=1[out]`;

  ffmpegArgs.push('-filter_complex', filter, '-map', '[out]', '-b:a', '128k', '-y', outputFile);

  execFileSync(ffmpegPath, ffmpegArgs, { stdio: 'ignore' });

  const stat = fs.statSync(outputFile);
  const sizeKb = (stat.size / 1024).toFixed(1);

  // 3. Write Manifest
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

  console.log(`✅ [Sound Sprite Pipeline] Created combat_core_sfx.mp3 (${sizeKb} KB, ${validEntries.length} sounds, ${currentOffset.toFixed(2)}s total).`);
  console.log(`✅ [Sound Sprite Pipeline] Manifest written to js/configs/combatSoundSpriteManifest.js`);

  return {
    outputFile,
    manifestPath,
    sizeKb,
    count: validEntries.length
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildAudioSprite().catch(err => {
    console.error('Error building sound sprite:', err);
    process.exit(1);
  });
}
