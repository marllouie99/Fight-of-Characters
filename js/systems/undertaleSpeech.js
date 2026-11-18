// ───────────────────────────────────────────────────────────────────────────
// Shared Undertale / Deltarune Speech Bubble Controller
// Reused across Error Sans, Jevil, Roaring Knight, and Kaizo Knight
// so typewriter reveal, cooldown throttling, and voice blips live in one place.
// ───────────────────────────────────────────────────────────────────────────

import { audioSystem } from './audioSystem.js';

const DEFAULT_BLIP_SRC = 'Assets/Sound Effects/Sans/SansSpeak.ogg';

/**
 * Initializes or resets speech bubble tracking fields on a fighter.
 */
export function resetSpeechState(fighter) {
  if (!fighter) return;
  fighter.speechBubble = {
    text: '',
    fullText: '',
    charIndex: 0,
    timer: 0,
    maxTimer: 0,
    charTimer: 0,
    blipInterval: 3,
  };
  fighter._speechCooldown = 0;
  fighter._hasSaidIntroQuote = false;
  fighter._hasSaidWinQuote = false;
}

/**
 * Triggers an Undertale / Deltarune typewriter speech bubble above the fighter.
 */
export function triggerFighterSpeech(fighter, text, opts = {}) {
  if (!fighter || !text) return;
  const duration = opts.duration ?? 120;
  const force = Boolean(opts.force);
  if (!force && (fighter._speechCooldown || 0) > 0 && fighter.speechBubble && fighter.speechBubble.timer > 0) {
    return;
  }

  const formatted = opts.preserveCase ? String(text) : String(text).toLowerCase();
  const blipSrc = opts.blipSrc === false ? null : (opts.blipSrc || DEFAULT_BLIP_SRC);
  const blipSpeed = opts.blipSpeed ?? 1.0;
  const blipVolume = opts.blipVolume ?? 0.65;

  fighter.speechBubble = {
    text: '',
    fullText: formatted,
    charIndex: 0,
    timer: duration,
    maxTimer: duration,
    charTimer: 0,
    blipInterval: opts.blipInterval ?? 3,
    blipSrc,
    blipSpeed,
    blipVolume,
    bgColor: opts.bgColor || '#FFFFFF',
    borderColor: opts.borderColor || '#000000',
    textColor: opts.textColor || '#000000',
    font: opts.font || null,
  };
  fighter._speechCooldown = duration + 35;

  if (blipSrc && typeof audioSystem !== 'undefined' && typeof audioSystem.playSFX === 'function') {
    audioSystem.playSFX(blipSrc, Math.min(1.0, blipVolume + 0.08), blipSpeed, 0);
  }
}

/**
 * Advances typewriter reveal and ticks cooldowns cleanly (Rule 25 top-of-update safe).
 */
export function updateFighterSpeech(fighter) {
  if (!fighter) return;
  if (fighter._speechCooldown > 0) fighter._speechCooldown--;
  const bubble = fighter.speechBubble;
  if (!bubble || bubble.timer <= 0) return;

  bubble.timer--;
  if (bubble.charIndex < bubble.fullText.length) {
    bubble.charTimer++;
    if (bubble.charTimer >= (bubble.blipInterval || 3)) {
      bubble.charTimer = 0;
      bubble.charIndex = Math.min(bubble.fullText.length, bubble.charIndex + 1);
      bubble.text = bubble.fullText.slice(0, bubble.charIndex);
      const ch = bubble.fullText[bubble.charIndex - 1];
      if (bubble.blipSrc && ch && ch !== ' ' && bubble.charIndex % 2 === 0) {
        if (typeof audioSystem !== 'undefined' && typeof audioSystem.playSFX === 'function') {
          audioSystem.playSFX(bubble.blipSrc, bubble.blipVolume ?? 0.62, bubble.blipSpeed ?? 1.0, 0);
        }
      }
    }
  }
}

/**
 * Shared intro & victory line trigger to avoid boilerplate in fighter update() loops.
 */
export function tickFighterIntroAndWinSpeech(fighter, opponent, opts = {}) {
  if (!fighter) return;
  if (!fighter._hasSaidIntroQuote && opponent && opponent.hp > 0 && opts.introText) {
    fighter._hasSaidIntroQuote = true;
    triggerFighterSpeech(fighter, opts.introText, opts.speechStyle);
    if (typeof opts.onSpeak === 'function') opts.onSpeak('intro');
  }
  const isMinionOrSummon = Boolean(
    opponent && (opponent.isMinion || opponent.isSummon || opponent.isTurret || opponent.isIllusion || opponent.owner)
  );
  if (opponent && opponent.hp <= 0 && !isMinionOrSummon && !fighter._hasSaidWinQuote && opts.winText) {
    fighter._hasSaidWinQuote = true;
    triggerFighterSpeech(fighter, opts.winText, { ...(opts.speechStyle || {}), duration: 140, force: true });
    if (typeof opts.onSpeak === 'function') opts.onSpeak('win');
  }
}
