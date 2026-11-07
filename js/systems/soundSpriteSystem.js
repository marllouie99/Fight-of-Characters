/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SOUND SPRITE SYSTEM — Web Audio SFX Sprite Packing & Virtual Slicing Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Bundles dozens of short combat SFX, UI clicks, footsteps, and impact sounds
 * into concatenated AudioBuffer slices.
 * 
 * Benefits:
 * 1. Reduces hundreds of individual HTTP asset requests down to single audio sheets.
 * 2. Instant zero-latency playback using Web Audio start(time, offset, duration).
 * 3. Dynamic in-memory virtual buffer stitching: concatenates decoded individual
 *    buffers into a single memory block with silence padding to prevent bleed.
 * 4. Graceful fallback: transparently falls back to individual file requests if
 *    sound sprite sheet is missing or sound key is not packed.
 */

import { COMBAT_SOUND_SPRITE_MANIFEST } from '../configs/combatSoundSpriteManifest.js';
import { CHARACTER_VOICE_SPRITE_MANIFEST } from '../configs/characterVoiceSpriteManifest.js';
import { AUDIO_CONFIG } from '../configs/audioConfig.js';

export const CORE_COMBAT_SFX_PATHS = [
  'Assets/Sound Effects/Attacks/fleshhit.mp3',
  'Assets/Sound Effects/Attacks/punch.mp3',
  'Assets/Sound Effects/Attacks/swordswing.mp3',
  'Assets/Sound Effects/Attacks/groundSmash.mp3',
  'Assets/Sound Effects/Attacks/explosion.mp3',
  'Assets/Sound Effects/Attacks/spaceshot.mp3',
  'Assets/Sound Effects/Attacks/laserpew.mp3',
  'Assets/Sound Effects/Attacks/heavypunch1.mp3',
  'Assets/Sound Effects/Attacks/heavypunch2.mp3',
  'Assets/Sound Effects/Attacks/heavypunch3.mp3',
  'Assets/Sound Effects/Attacks/energysword.mp3',
  'Assets/Sound Effects/Attacks/energysword2.mp3',
  'Assets/Sound Effects/Attacks/thunderstrike.mp3',
  'Assets/Sound Effects/Attacks/spikestab.mp3',
  'Assets/Sound Effects/Attacks/shurikenthrow.mp3',
  'Assets/Sound Effects/Attacks/syctheattack.mp3'
];

class SoundSpriteManager {
  constructor() {
    this.spriteSheets = new Map(); // id -> { id, url, buffer, loadingPromise, sprites: Map, isVirtual, characterId }
    this.keyToSheetMap = new Map(); // sfxKey / fileSrc -> { sheetId, offset, duration }
    this.keyToSheetListMap = new Map(); // sfxKey / fileSrc -> Array<{ sheetId, offset, duration }>
    this._initDefaultSheets();
  }

  _initDefaultSheets() {
    // 1. Register default core combat hits virtual sheet descriptor (fallback)
    this.registerSpriteSheet('core_combat_hits', 'virtual://core_combat_hits', {
      'punch': [0.0, 0.45],
      'Assets/Sound Effects/Attacks/punch.mp3': [0.0, 0.45],
      'fleshhit': [0.5, 0.40],
      'Assets/Sound Effects/Attacks/fleshhit.mp3': [0.5, 0.40],
      'swordswing': [0.95, 0.55],
      'Assets/Sound Effects/Attacks/swordswing.mp3': [0.95, 0.55],
      'groundSmash': [1.55, 0.70],
      'Assets/Sound Effects/Attacks/groundSmash.mp3': [1.55, 0.70],
      'explosion': [2.30, 0.85],
      'Assets/Sound Effects/Attacks/explosion.mp3': [2.30, 0.85],
      'spaceshot': [3.20, 0.65],
      'Assets/Sound Effects/Attacks/spaceshot.mp3': [3.20, 0.65]
    });

    // 2. Register real pre-baked combat sound sprite atlas if available
    if (typeof COMBAT_SOUND_SPRITE_MANIFEST !== 'undefined' && COMBAT_SOUND_SPRITE_MANIFEST?.sheetId) {
      this.registerSpriteSheet(
        COMBAT_SOUND_SPRITE_MANIFEST.sheetId,
        COMBAT_SOUND_SPRITE_MANIFEST.audioUrl,
        COMBAT_SOUND_SPRITE_MANIFEST.slices,
        false
      );
    }

    // 3. Register per-character voice line & SFX sprite atlases
    if (typeof CHARACTER_VOICE_SPRITE_MANIFEST !== 'undefined' && CHARACTER_VOICE_SPRITE_MANIFEST) {
      for (const entry of Object.values(CHARACTER_VOICE_SPRITE_MANIFEST)) {
        if (entry && entry.sheetId && entry.audioUrl && entry.slices) {
          this.registerSpriteSheet(
            entry.sheetId,
            entry.audioUrl,
            entry.slices,
            false,
            entry.characterId || null
          );
        }
      }
    }
  }

  _addKeyMapping(key, data) {
    this.keyToSheetMap.set(key, data);
    let list = this.keyToSheetListMap.get(key);
    if (!list) {
      list = [];
      this.keyToSheetListMap.set(key, list);
    }
    const existingIdx = list.findIndex(item => item.sheetId === data.sheetId);
    if (existingIdx !== -1) {
      list[existingIdx] = data;
    } else {
      list.push(data);
    }
  }

  /**
   * Register a sound sprite sheet definition.
   * @param {string} sheetId - Unique identifier (e.g. 'core_combat_hits')
   * @param {string} sheetUrl - Path to the concatenated audio file
   * @param {Record<string, [number, number]>} spriteSlices - Map of soundKey -> [offsetInSeconds, durationInSeconds]
   * @param {boolean} [isVirtual=false] - Whether this is an in-memory stitched virtual sheet
   * @param {string|null} [characterId=null] - Optional fighter characterId for per-character voice sheets
   */
  registerSpriteSheet(sheetId, sheetUrl, spriteSlices, isVirtual = false, characterId = null) {
    if (!sheetId || !sheetUrl || !spriteSlices) return;

    const isVirt = Boolean(isVirtual || (sheetUrl && sheetUrl.startsWith('virtual://')));
    const sliceMap = new Map();
    for (const [key, slice] of Object.entries(spriteSlices)) {
      if (Array.isArray(slice) && slice.length >= 2) {
        const offset = Number(slice[0]) || 0;
        const duration = Number(slice[1]) || 0.1;
        const data = { sheetId, offset, duration };
        const cleanKey = String(key).replace(/\\/g, '/');
        const lowerKey = cleanKey.toLowerCase();
        sliceMap.set(cleanKey, data);
        sliceMap.set(lowerKey, data);
        this._addKeyMapping(cleanKey, data);
        if (lowerKey !== cleanKey) {
          this._addKeyMapping(lowerKey, data);
        }

        // Also map basename (e.g. "fuga.mp3" from "Assets/Sound Effects/Skills/fuga.mp3")
        if (cleanKey.includes('/')) {
          const baseName = cleanKey.split('/').pop();
          const lowerBase = baseName.toLowerCase();
          if (!sliceMap.has(baseName)) {
            sliceMap.set(baseName, data);
            sliceMap.set(lowerBase, data);
            this._addKeyMapping(baseName, data);
            if (lowerBase !== baseName) {
              this._addKeyMapping(lowerBase, data);
            }
          }
        }
      }
    }

    // Auto-map AUDIO_CONFIG aliases to sprite slices
    if (typeof AUDIO_CONFIG !== 'undefined' && AUDIO_CONFIG) {
      for (const [aliasKey, aliasTarget] of Object.entries(AUDIO_CONFIG)) {
        if (!aliasTarget) continue;
        const targetClean = String(aliasTarget).replace(/\\/g, '/');
        const targetLower = targetClean.toLowerCase();
        if (sliceMap.has(targetClean) || sliceMap.has(targetLower)) {
          const sliceData = sliceMap.get(targetClean) || sliceMap.get(targetLower);
          sliceMap.set(aliasKey, sliceData);
          sliceMap.set(aliasKey.toLowerCase(), sliceData);
          this._addKeyMapping(aliasKey, sliceData);
          this._addKeyMapping(aliasKey.toLowerCase(), sliceData);
        }
      }
    }

    this.spriteSheets.set(sheetId, {
      id: sheetId,
      url: sheetUrl,
      buffer: null,
      loadingPromise: null,
      sprites: sliceMap,
      isVirtual: isVirt,
      characterId: characterId ? String(characterId).toLowerCase() : null
    });
  }

  /**
   * Check if a given sound key or file source is registered in a sound sprite sheet.
   * @param {string} keyOrSrc
   * @returns {boolean}
   */
  hasSprite(keyOrSrc) {
    if (!keyOrSrc) return false;
    return Boolean(this.getSpriteInfo(keyOrSrc));
  }

  /**
   * Retrieve the sprite slice metadata for a given key.
   * Prefers a sheet whose AudioBuffer is already loaded or actively loading in memory.
   * @param {string} keyOrSrc
   * @returns {{ sheetId: string, offset: number, duration: number } | null}
   */
  getSpriteInfo(keyOrSrc) {
    if (!keyOrSrc) return null;
    let cleanKey = String(keyOrSrc).replace(/\\/g, '/');
    let lowerKey = cleanKey.toLowerCase();

    // 1. Direct lookup
    let list = this.keyToSheetListMap.get(cleanKey) || this.keyToSheetListMap.get(lowerKey);

    // 2. AUDIO_CONFIG alias lookup
    if (!list && typeof AUDIO_CONFIG !== 'undefined' && AUDIO_CONFIG && AUDIO_CONFIG[keyOrSrc]) {
      const mapped = String(AUDIO_CONFIG[keyOrSrc]).replace(/\\/g, '/');
      cleanKey = mapped;
      lowerKey = mapped.toLowerCase();
      list = this.keyToSheetListMap.get(cleanKey) || this.keyToSheetListMap.get(lowerKey);
    }

    // 3. Basename lookup (e.g. "fuga.mp3" or "Sukuna-slice.mp3")
    if (!list && cleanKey.includes('/')) {
      const base = cleanKey.split('/').pop();
      list = this.keyToSheetListMap.get(base) || this.keyToSheetListMap.get(base.toLowerCase());
      if (list) {
        cleanKey = base;
        lowerKey = base.toLowerCase();
      }
    }

    if (list && list.length > 0) {
      // 1. Prefer sheet that already has a decoded buffer in memory
      for (let i = list.length - 1; i >= 0; i--) {
        const cand = list[i];
        const sheet = this.spriteSheets.get(cand.sheetId);
        if (sheet && sheet.buffer) return cand;
      }
      // 2. Prefer sheet that is currently loading in flight
      for (let i = list.length - 1; i >= 0; i--) {
        const cand = list[i];
        const sheet = this.spriteSheets.get(cand.sheetId);
        if (sheet && sheet.loadingPromise) return cand;
      }
      return list[0];
    }
    return this.keyToSheetMap.get(cleanKey) || this.keyToSheetMap.get(lowerKey) || null;
  }

  /**
   * Resolves the characterId that owns this sound key/slice.
   * @param {string} keyOrSrc
   * @returns {string|null}
   */
  getCharacterIdForSound(keyOrSrc) {
    const info = this.getSpriteInfo(keyOrSrc);
    if (info && info.sheetId) {
      const sheet = this.spriteSheets.get(info.sheetId);
      if (sheet && sheet.characterId) {
        return sheet.characterId;
      }
    }
    return null;
  }

  /**
   * Resolves the registered character voice sprite sheet ID for a given characterId.
   * @param {string|number} characterId
   * @returns {string|null}
   */
  getCharacterSheetId(characterId) {
    if (!characterId) return null;
    const charKey = String(characterId).toLowerCase();
    const sheetId = `char_voice_${charKey}`;
    return this.spriteSheets.has(sheetId) ? sheetId : null;
  }

  /**
   * Checks whether a character has a registered voice/SFX sprite atlas.
   * @param {string|number} characterId
   * @returns {boolean}
   */
  hasCharacterVoiceSprite(characterId) {
    return Boolean(this.getCharacterSheetId(characterId));
  }

  /**
   * Preloads and decodes a character's voice/SFX sprite atlas into Web Audio memory.
   * @param {string|number} characterId
   * @param {AudioContext} [audioCtx]
   * @returns {Promise<AudioBuffer|null>}
   */
  async loadCharacterVoiceSprite(characterId, audioCtx) {
    const sheetId = this.getCharacterSheetId(characterId);
    if (!sheetId) return null;
    return this.loadSpriteSheet(sheetId, audioCtx);
  }

  /**
   * Checks if a given sound key or path belongs to a specific sprite sheet.
   * @param {string} keyOrSrc
   * @param {string} sheetId
   * @returns {boolean}
   */
  isKeyInSheet(keyOrSrc, sheetId) {
    if (!keyOrSrc || !sheetId) return false;
    const sheet = this.spriteSheets.get(sheetId);
    if (!sheet || !sheet.sprites) return false;
    const cleanKey = String(keyOrSrc).replace(/\\/g, '/');
    return sheet.sprites.has(cleanKey) || sheet.sprites.has(cleanKey.toLowerCase());
  }

  /**
   * Releases decoded AudioBuffers for character voice sprite sheets that are not part
   * of the active match roster, preventing mobile Web Audio PCM memory accumulation.
   * @param {Array<string>} activeCharacterIds
   */
  releaseInactiveCharacterSheets(activeCharacterIds = []) {
    const activeSet = new Set(
      (activeCharacterIds || []).filter(Boolean).map(id => String(id).toLowerCase())
    );
    for (const sheet of this.spriteSheets.values()) {
      if (sheet && sheet.characterId && !activeSet.has(sheet.characterId)) {
        sheet.buffer = null;
        sheet.loadingPromise = null;
      }
    }
  }

  /**
   * Preload and decode a registered sound sprite sheet into memory.
   * @param {string} sheetId
   * @param {AudioContext} audioCtx
   * @returns {Promise<AudioBuffer|null>}
   */
  async loadSpriteSheet(sheetId, audioCtx) {
    const sheet = this.spriteSheets.get(sheetId);
    if (!sheet) return null;
    if (sheet.buffer) return sheet.buffer;
    if (sheet.loadingPromise) return sheet.loadingPromise;

    // Never invoke Fetch API on in-memory virtual URIs (e.g. 'virtual://...') to prevent CSP violations
    if (sheet.isVirtual || (sheet.url && sheet.url.startsWith('virtual://'))) {
      return sheet.buffer || null;
    }

    sheet.loadingPromise = (async () => {
      try {
        if (!audioCtx) {
          const AudioContextClass = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
                                    (typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext));
          if (AudioContextClass) {
            try { audioCtx = new AudioContextClass(); } catch (e) {}
          }
        }
        if (!audioCtx) return null;

        const response = await fetch(sheet.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuf = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
        sheet.buffer = audioBuffer;
        return audioBuffer;
      } catch (err) {
        // Fallback to standalone files
        return null;
      } finally {
        sheet.loadingPromise = null;
      }
    })();

    return sheet.loadingPromise;
  }

  /**
   * Dynamic in-memory stitcher: takes a dictionary of { [key]: AudioBuffer } and concatenates
   * them into a single continuous AudioBuffer, registering slices and offsets with silence padding.
   * @param {string} sheetId - Unique sheet ID
   * @param {Record<string, AudioBuffer>} bufferMap - Map of soundKey -> AudioBuffer
   * @param {AudioContext} audioCtx
   * @param {number} [paddingSec=0.05] - Silence padding between slices
   * @returns {AudioBuffer|null}
   */
  stitchBuffersToSpriteSheet(sheetId, bufferMap, audioCtx, paddingSec = 0.05) {
    if (!sheetId || !bufferMap || typeof bufferMap !== 'object') return null;
    const entries = Object.entries(bufferMap).filter(([k, b]) => b && typeof b.duration === 'number');
    if (entries.length === 0) return null;

    if (!audioCtx) {
      const AudioContextClass = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
                                (typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext));
      if (AudioContextClass) {
        try { audioCtx = new AudioContextClass(); } catch (e) {}
      }
    }
    if (!audioCtx) return null;

    const sampleRate = audioCtx.sampleRate || 44100;
    const paddingSamples = Math.floor(paddingSec * sampleRate);
    let maxChannels = 1;
    let totalSamples = 0;

    for (const [, buf] of entries) {
      maxChannels = Math.max(maxChannels, buf.numberOfChannels || 1);
      const bufLen = buf.length || Math.floor(buf.duration * sampleRate);
      totalSamples += bufLen + paddingSamples;
    }

    let compositeBuffer = null;
    if (typeof audioCtx.createBuffer === 'function') {
      try {
        compositeBuffer = audioCtx.createBuffer(maxChannels, totalSamples, sampleRate);
      } catch (e) {}
    }
    if (!compositeBuffer) {
      const AudioBufferClass = (typeof AudioBuffer !== 'undefined' ? AudioBuffer : (typeof globalThis !== 'undefined' ? globalThis.AudioBuffer : null));
      if (AudioBufferClass) {
        try {
          compositeBuffer = new AudioBufferClass({ numberOfChannels: maxChannels, length: totalSamples, sampleRate, duration: totalSamples / sampleRate });
        } catch (e2) {}
      }
    }
    if (!compositeBuffer) {
      compositeBuffer = {
        numberOfChannels: maxChannels,
        length: totalSamples,
        sampleRate,
        duration: totalSamples / sampleRate
      };
    }

    const sliceMap = new Map();
    let currentSampleOffset = 0;

    for (const [key, buf] of entries) {
      const offsetSec = currentSampleOffset / sampleRate;
      const durationSec = buf.duration;
      const data = { sheetId, offset: offsetSec, duration: durationSec };

      const cleanKey = String(key).replace(/\\/g, '/');
      const lowerKey = cleanKey.toLowerCase();
      sliceMap.set(cleanKey, data);
      sliceMap.set(lowerKey, data);
      this._addKeyMapping(cleanKey, data);
      if (lowerKey !== cleanKey) {
        this._addKeyMapping(lowerKey, data);
      }

      const bufLen = buf.length || Math.floor(buf.duration * sampleRate);
      if (compositeBuffer && typeof compositeBuffer.copyToChannel === 'function') {
        for (let ch = 0; ch < maxChannels; ch++) {
          const srcCh = Math.min(ch, (buf.numberOfChannels || 1) - 1);
          if (typeof buf.getChannelData === 'function') {
            const srcData = buf.getChannelData(srcCh);
            compositeBuffer.copyToChannel(srcData, ch, currentSampleOffset);
          }
        }
      }
      currentSampleOffset += bufLen + paddingSamples;
    }

    this.spriteSheets.set(sheetId, {
      id: sheetId,
      url: `virtual://${sheetId}`,
      buffer: compositeBuffer,
      loadingPromise: null,
      sprites: sliceMap,
      isVirtual: true
    });

    return compositeBuffer;
  }

  /**
   * Automatically builds or warms up the virtual core combat sprite sheet in memory.
   * @param {AudioContext} audioCtx
   * @param {string[]} [sfxPaths=CORE_COMBAT_SFX_PATHS]
   * @returns {Promise<AudioBuffer|null>}
   */
  async buildVirtualCombatSpriteSheet(audioCtx, sfxPaths = CORE_COMBAT_SFX_PATHS) {
    if (this.spriteSheets.has('core_combat_hits') && this.spriteSheets.get('core_combat_hits').buffer) {
      return this.spriteSheets.get('core_combat_hits').buffer;
    }

    if (!audioCtx) {
      const AudioContextClass = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
                                (typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext));
      if (AudioContextClass) {
        try { audioCtx = new AudioContextClass(); } catch (e) {}
      }
    }
    if (!audioCtx) return null;

    const bufferMap = {};
    for (const path of sfxPaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          if (audioBuffer) {
            bufferMap[path] = audioBuffer;
          }
        }
      } catch (err) {}
    }

    return this.stitchBuffersToSpriteSheet('core_combat_hits', bufferMap, audioCtx);
  }

  /**
   * Attempt to retrieve decoded AudioBuffer and slice timing for zero-latency sprite playback.
   * @param {string} keyOrSrc
   * @returns {{ buffer: AudioBuffer, offset: number, duration: number } | null}
   */
  getSpriteAudio(keyOrSrc) {
    const info = this.getSpriteInfo(keyOrSrc);
    if (!info) return null;

    const sheet = this.spriteSheets.get(info.sheetId);
    if (!sheet || !sheet.buffer) return null;

    return {
      buffer: sheet.buffer,
      offset: info.offset,
      duration: info.duration
    };
  }

  /**
   * Returns a diagnostic list of all registered sound sprite sheets and their status.
   * @returns {Array<{ id: string, url: string, isLoaded: boolean, isVirtual: boolean, sliceCount: number }>}
   */
  getRegisteredSheets() {
    const result = [];
    for (const [id, sheet] of this.spriteSheets.entries()) {
      result.push({
        id,
        url: sheet.url,
        isLoaded: Boolean(sheet.buffer),
        isVirtual: Boolean(sheet.isVirtual),
        sliceCount: sheet.sprites ? sheet.sprites.size : 0
      });
    }
    return result;
  }

  /**
   * Returns statistics about the sound sprite manager.
   * @returns {{ totalSheets: number, loadedSheets: number, totalSlices: number }}
   */
  getSpriteStats() {
    let loadedSheets = 0;
    let totalSlices = 0;
    for (const sheet of this.spriteSheets.values()) {
      if (sheet.buffer) loadedSheets++;
      if (sheet.sprites) totalSlices += sheet.sprites.size;
    }
    return {
      totalSheets: this.spriteSheets.size,
      loadedSheets,
      totalSlices
    };
  }

  /**
   * Clears decoded sprite buffer memory while keeping registration metadata intact.
   */
  clearSpriteBuffers() {
    for (const sheet of this.spriteSheets.values()) {
      sheet.buffer = null;
      sheet.loadingPromise = null;
    }
  }
}

export const soundSpriteManager = new SoundSpriteManager();
