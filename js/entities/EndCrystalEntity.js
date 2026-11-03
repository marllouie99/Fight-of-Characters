// ─────────────────────────────────────────────
// End Crystal Minion Entity — Minecraft End Crystal Boss Minion
// 6-Frame Animated Glass Cage & Rotating Magenta Rune Cube
// Flagged with isMinion = true, isImmovable = true, cannotBeKnockbacked = true
// ─────────────────────────────────────────────

import { Fighter, applyDamageToTarget, resolveDamageNumberColor } from './fighter.js';
import { state, triggerGlobalScreenShake, spawnFloatingText } from '../core/state.js';
import { spawnSparks, spawnImpactFlash } from '../graphics/particles/sparkEffect.js';
import { audioSystem } from '../systems/audioSystem.js';

let _crystalSheetImg = null;
let _crystalSheetLoaded = false;
let _crystalBeamImg = null;
let _crystalBeamLoaded = false;
let _crystal60FrameStrip = null;
let _crystal60FrameLoaded = false;

export function getEndCrystalSpriteSheet() {
  if (!_crystalSheetImg && typeof Image !== 'undefined') {
    _crystalSheetImg = new Image();
    _crystalSheetImg.onload = () => { _crystalSheetLoaded = true; };
    _crystalSheetImg.src = encodeURI('Assets/model/enderDragon/End-crystal-animation-sprite-sheet.png?v=1');
  }
  return _crystalSheetImg;
}

export function getEndCrystal60FrameStrip() {
  if (!_crystal60FrameStrip && typeof Image !== 'undefined') {
    _crystal60FrameStrip = new Image();
    _crystal60FrameStrip.onload = () => { _crystal60FrameLoaded = true; };
    _crystal60FrameStrip.src = encodeURI('Assets/model/enderDragon/end_crystal/end_crystal-b.png?v=2');
  }
  return _crystal60FrameStrip;
}
export const getEndCrystal18FrameStrip = getEndCrystal60FrameStrip;
export const getEndCrystal12FrameStrip = getEndCrystal60FrameStrip;

export function getEndCrystalBeamImage() {
  if (!_crystalBeamImg && typeof Image !== 'undefined') {
    _crystalBeamImg = new Image();
    _crystalBeamImg.onload = () => { _crystalBeamLoaded = true; };
    _crystalBeamImg.src = encodeURI('Assets/model/enderDragon/end_crystal_beam.png?v=1');
  }
  return _crystalBeamImg;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  getEndCrystalSpriteSheet();
  getEndCrystal60FrameStrip();
  getEndCrystalBeamImage();
}

export class EndCrystalEntity extends Fighter {
  constructor(x, y, id = 'crystal_node', name = 'End Crystal') {
    const maxHp = 60;
    const radius = 28;

    const def = {
      id: 888,
      name: name,
      color: '#C026D3',
      startX: x,
      startY: y,
      startVx: 0,
      startVy: 0,
      radius: radius,
      type: 'EndCrystal',
      isMinion: true,
      hp: maxHp,
      damage: 0,
      cooldown: 999,
      moveSpeed: 0,
    };
    super(def);

    this.crystalId = id;
    this._fixedX = x;
    this._fixedY = y;
    this.x = x;
    this.y = y;

    // Comprehensive Immobility & Debuff Immunity Flags
    this.isMinion = true;
    this.isEndCrystal = true;
    this.isDeployable = true;
    this.isImmovable = true;
    this.cannotBeKnockbacked = true;
    this.immuneToKnockback = true;
    this.immuneToPush = true;
    this.immuneToPull = true;
    this.immuneToSuction = true;
    this.immuneToDrag = true;
    this.immuneToCC = true;
    this.immuneToBurn = true;
    this.immuneToParalyze = true;
    this.immuneToSlow = true;
    this.immuneToHitStun = true;
    this.immuneToTimeStop = true;
    this.immuneToDebuffs = true;
    this.immuneToSoulDisfigurement = true;
    this.immuneToTelekinesis = true;
    this.immuneToDomainStasis = true;
    this.cannotBeChained = true;
    this.cannotBeGrabbed = true;
    this.cannotBeSwapped = true;

    this.hideHpText = true;
    this.hideHands = true;
    this.hideGun = true;
    this.hideFrontHand = true;
    this.hideBackHand = true;

    this.maxHp = maxHp;
    this.hp = maxHp;
    this.r = radius;
    this.hitFlashTimer = 0;
    this.animTimer = Math.floor(Math.random() * 24);
    this.bobPhase = Math.random() * Math.PI * 2;
    this._visualBobY = 0;

    // Tether healing mechanics
    this.isTetheredToDragon = false;
    this.tetherDragonTarget = null;
    this.tetherTickTimer = 0;

    // Bedrock Base
    this.pedestalRadius = radius * 1.35;
  }

  reset() {
    super.reset();
    this.isMinion = true;
    this.isEndCrystal = true;
    this.isDeployable = true;
    this.isImmovable = true;
    this.cannotBeKnockbacked = true;
    this.immuneToKnockback = true;
    this.immuneToPush = true;
    this.immuneToPull = true;
    this.immuneToSuction = true;
    this.cannotBeSwapped = true;
    this.hideHpText = true;
    this.hp = this.maxHp;
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.burnTimer = 0;
    this.paralyzeTimer = 0;
    this.slowTimer = 0;
    this.hitStunTimer = 0;
    this.timeStopTimer = 0;
    if (this._fixedX !== undefined) {
      this.x = this._fixedX;
      this.y = this._fixedY;
    }
    this.hitFlashTimer = 0;
    this.isTetheredToDragon = false;
    this._visualBobY = 0;
  }

  // ── Convenience Tether Getters/Setters ──
  get isTethered() { return this.isTetheredToDragon; }
  set isTethered(val) { this.isTetheredToDragon = val; }
  get tetherTarget() { return this.tetherDragonTarget; }
  set tetherTarget(val) { this.tetherDragonTarget = val; }
  get healTimer() { return this.tetherTickTimer; }
  set healTimer(val) { this.tetherTickTimer = val; }

  // ── Complete Movement & Physics Neutralization ──
  applyKnockback() { return; }
  applyPush() { return; }
  applyPull() { return; }
  applySuction() { return; }
  applyDrag() { return; }
  applyMovementPhysics() {
    if (this._fixedX !== undefined) {
      this.x = this._fixedX;
      this.y = this._fixedY;
    }
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
  }
  resolveWallBounce() { return; }

  // ── Complete Debuff & Status Effect Neutralization ──
  applyBurn() { this.burnTimer = 0; return; }
  applyParalyze() { this.paralyzeTimer = 0; return; }
  applyHitStun() { this.hitStunTimer = 0; return; }
  applyTimeStop() { this.timeStopTimer = 0; return; }
  applySlow() { this.slowTimer = 0; return; }
  applyPoison() { return; }
  applyBleed() { return; }
  applySoulDisfigurement() { return; }
  applyTelekinesis() { return; }
  applyChain() { return; }
  applyRatioCrit() { return; }
  applyDomainStasis() { return; }
  applyGetsugaDrag() { return; }
  _handleTimeStop() { return false; }
  isEffectivelyAlive() { return false; }

  // ── Zero UI / HUD / Overhead Renderers ──
  drawHealth() { /* End Crystals do not have overhead/HUD health bars */ }
  drawGun() { /* End Crystals do not wield firearms */ }
  drawFreezeTimer() { /* End Crystals are immune to freeze */ }
  drawStatusOverlays() { /* End Crystals are immune to debuffs */ }

  update(opponent, ownerIndex, arena) {
    if (this.hp <= 0) {
      this.detonate();
      return;
    }

    // Lock position strictly to fixed anchor coordinates
    if (this._fixedX !== undefined) {
      this.x = this._fixedX;
      this.y = this._fixedY;
    }
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.burnTimer = 0;
    this.paralyzeTimer = 0;
    this.slowTimer = 0;
    this.hitStunTimer = 0;
    this.timeStopTimer = 0;
    this.animTimer++;

    // Retro Arcade 2.0px discrete stepped bobbing [-6px, -4px, -2px, 0px, +2px, +4px, +6px]
    const rawBob = Math.sin(this.animTimer * 0.08 + (this.bobPhase || 0)) * 6.0;
    this._visualBobY = Math.round(rawBob / 2.0) * 2.0;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer--;
    }

    // ── Check Tether with Closest Ender Dragon ──
    const dragons = (state.fighters || []).filter(f => f && (f.characterId === 'ender_dragon' || f.type === 'ender_dragon') && f.hp > 0);
    let dragon = null;
    let closestDist = Infinity;
    for (let d of dragons) {
      const dist = Math.hypot(d.x - this.x, d.y - this.y);
      if (dist < closestDist) {
        closestDist = dist;
        dragon = d;
      }
    }

    if (dragon) {
      const cfg = typeof dragon._getConfig === 'function' ? dragon._getConfig() : (typeof CONFIG !== 'undefined' ? CONFIG.ender_dragon : null);
      const tetherReach = (cfg && cfg.crystalTetherReach) || 340;

      if (closestDist <= tetherReach) {
        this.isTetheredToDragon = true;
        this.tetherDragonTarget = dragon;
        this.tetherTickTimer++;

        const healInterval = (cfg && cfg.crystalHealInterval) || 45;
        const healAmt = (cfg && cfg.crystalHealAmount) || 6;

        // Heal dragon every healInterval frames (+6 HP default)
        if (this.tetherTickTimer >= healInterval) {
          this.tetherTickTimer = 0;
          if (dragon.hp < dragon.maxHp) {
            dragon.hp = Math.min(dragon.maxHp, dragon.hp + healAmt);
            dragon._lastHealAmount = (dragon._lastHealAmount || 0) + healAmt;
            dragon._healthBarHealTimer = 16;
            if (typeof spawnFloatingText === 'function') {
              spawnFloatingText(dragon.x, dragon.y - 30, `+${healAmt}`, '#4ADE80');
            }
          }
        }
      } else {
        this.isTetheredToDragon = false;
        this.tetherDragonTarget = null;
      }
    } else {
      this.isTetheredToDragon = false;
      this.tetherDragonTarget = null;
    }
  }

  takeDamage(amount, source, options) {
    if (this.hp <= 0) return 0;
    // Friendly Fire Protection: The tethered Ender Dragon (or Boss) cannot damage its own healing crystals
    if (source && (source.isBoss || source === this.tetherDragonTarget || source === this.owner)) {
      return 0;
    }
    const finalDmg = Math.max(1, Math.round(amount));
    this.hp -= finalDmg;
    this.hitFlashTimer = 6;

    // Maintain strict anchor lock on hit
    if (this._fixedX !== undefined) {
      this.x = this._fixedX;
      this.y = this._fixedY;
    }
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;

    if (typeof spawnFloatingText === 'function') {
      const color = resolveDamageNumberColor(source, options, '#C026D3');
      spawnFloatingText(this.x, this.y - 20, `-${finalDmg}`, color);
    }

    if (this.hp <= 0) {
      this.detonate(source);
    }
    return finalDmg;
  }

  detonate(source) {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.hp = 0;
    this.dead = true;
    this.isDead = true;

    // Visual & Audio Detonation Explosion
    triggerGlobalScreenShake(8, 24);
    spawnImpactFlash(this.x, this.y, 90, '#F5D0FE');
    spawnSparks(this.x, this.y, '#C026D3', 24, 7.0);
    spawnSparks(this.x, this.y, '#E879F9', 18, 5.5);
    spawnSparks(this.x, this.y, '#FFFFFF', 12, 4.0);

    if (typeof audioSystem !== 'undefined' && audioSystem.playSFX) {
      audioSystem.playSFX('Assets/Sound Effects/Attacks/explosion.mp3', 0.95);
      audioSystem.playSFX('Assets/Sound Effects/Skills/purpledeploy.mp3', 0.80);
    }

    // Radial Blast Damage to nearby opponents/entities (excluding the dragon which takes dedicated backlash)
    const blastRadius = 110;
    const blastDamage = 28;
    const blastKnockback = 16.0;
    const targets = (state.fighters || []).filter(f => f && f !== this && f.hp > 0 && f.characterId !== 'ender_dragon' && f.type !== 'ender_dragon');

    for (let target of targets) {
      const dist = Math.hypot(target.x - this.x, target.y - this.y);
      if (dist <= blastRadius) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        applyDamageToTarget(target, blastDamage, source || this);
        if (typeof target.applyKnockback === 'function') {
          target.applyKnockback(Math.cos(angle) * blastKnockback, Math.sin(angle) * blastKnockback, 12);
        }
      }
    }

    // ── Dragon Backlash & Enrage Trigger ──
    const dragons = (state.fighters || []).filter(f => f && (f.characterId === 'ender_dragon' || f.type === 'ender_dragon') && f.hp > 0);
    let dragon = null;
    let closestDist = Infinity;
    for (let d of dragons) {
      const dist = Math.hypot(d.x - this.x, d.y - this.y);
      if (dist < closestDist) {
        closestDist = dist;
        dragon = d;
      }
    }

    if (dragon) {
      const cfg = typeof dragon._getConfig === 'function' ? dragon._getConfig() : (typeof CONFIG !== 'undefined' ? CONFIG.ender_dragon : null);
      const backlashDmg = (cfg && cfg.crystalBacklashDamage) || 60;
      applyDamageToTarget(dragon, backlashDmg, source || this);
      if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(dragon.x, dragon.y - 35, `-${backlashDmg} BACKLASH!`, '#E879F9');
      }

      // Trigger dragon enrage response & flight direction shift
      if (typeof dragon._evaluateEnvironmentalReactivity === 'function') {
        dragon.patrolDirection = (dragon.patrolDirection || 1) * -1;
        dragon.targetAltitude = 1.7;
        triggerGlobalScreenShake(10, 28);
        dragon._playAudio('roar', 'Assets/Sound Effects/Skills/ragescream.mp3', 1.0);
      }
    }

    // Remove from active fighters array
    const idx = (state.fighters || []).indexOf(this);
    if (idx !== -1) {
      state.fighters.splice(idx, 1);
    }
  }

  drawBody(ctx) {
    this.draw(ctx);
  }

  draw(ctx) {
    if (!ctx) return;
    const sheetImg = getEndCrystalSpriteSheet();
    const isReady = Boolean(sheetImg && sheetImg.complete && sheetImg.naturalWidth > 0);
    const bobY = this._visualBobY !== undefined ? this._visualBobY : 0;

    const cfg = (typeof state !== 'undefined' && state.fighters)
      ? (state.fighters.find(f => f && (f.characterId === 'ender_dragon' || f.type === 'ender_dragon'))?._getConfig?.() || (typeof CONFIG !== 'undefined' ? CONFIG.ender_dragon : null))
      : (typeof CONFIG !== 'undefined' ? CONFIG.ender_dragon : null);
    const drawSize = (cfg && cfg.crystalDrawSize) || 140;
    const dx = -drawSize / 2;
    const dy = -Math.round(drawSize * 0.832);
    const coreOffsetY = Math.round(drawSize * 0.449);

    // 0. Subtle Floor Contact Shadow (Anchored under the 3D bedrock base)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = 'rgba(10, 10, 15, 0.40)';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.round(drawSize * 0.23), Math.round(drawSize * 0.065), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Authentic 60-Frame Minecraft End Crystal 3D Animation (Master 10x6 sheet: end_crystal-b.png)
    const stripImg = getEndCrystal60FrameStrip();
    const isStripReady = Boolean(stripImg && stripImg.complete && stripImg.naturalWidth > 0);

    ctx.imageSmoothingEnabled = false; // Nearest-neighbor pixel fidelity

    if (isStripReady) {
      const cellW = 256;
      const cellH = 256;
      const cols = 10;
      const animTicks = (cfg && cfg.crystalAnimTicks) || 3; // Calm, steady cadence (~3.0s per 360-deg rotation)
      const frameIdx = Math.floor(this.animTimer / animTicks) % 60;
      const col = frameIdx % cols;
      const row = Math.floor(frameIdx / cols);
      const sx = col * cellW;
      const sy = row * cellH;

      ctx.drawImage(
        stripImg,
        sx, sy, cellW, cellH,
        dx, dy, drawSize, drawSize
      );
    } else if (isReady) {
      // Legacy 6-frame fallback
      const fw = 362;
      const fh = 724;
      const sx = (Math.floor(this.animTimer / 5) % 6) * fw;
      ctx.drawImage(
        sheetImg,
        sx, 0, fw, fh,
        -56 / 2, -56 * 0.75, 56, 56 * 1.5
      );
    } else {
      // Procedural fallback
      ctx.fillStyle = '#C026D3';
      ctx.beginPath();
      ctx.arc(0, -coreOffsetY, this.r * 1.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#F5D0FE';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 2. Retro Arcade Pixel Energy Motes (2.0px discrete grid)
    if (!this._isSilhouettePass) {
      const P = 2.0;
      const moteTicks = Math.floor(this.animTimer / 4);
      const motesRadius = Math.round(drawSize * 0.36);
      for (let m = 0; m < 4; m++) {
        const angle = (m / 4) * Math.PI * 2 + moteTicks * 0.16;
        const dist = motesRadius + ((moteTicks + m * 2) % 3) * 2.0;
        const mx = Math.round((Math.cos(angle) * dist) / P) * P;
        const my = Math.round((Math.sin(angle) * dist * 0.60) / P) * P - coreOffsetY;
        const mSize = (m % 2 === 0) ? P : P * 1.5;
        const mColor = (m % 3 === 0) ? '#FFFFFF' : (m % 2 === 0 ? '#F5D0FE' : '#E879F9');

        ctx.fillStyle = mColor;
        ctx.fillRect(mx - mSize / 2, my - mSize / 2, mSize, mSize);
      }

      // 3. Retro Hit Flash Overlay (Stepped 1-bit strobe)
      if (this.hitFlashTimer > 0 && Math.floor(this.hitFlashTimer) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        const pad = Math.round(drawSize * 0.16);
        ctx.fillRect(dx + pad, dy + pad, drawSize - pad * 2, drawSize - pad * 2);
      }
    }

    ctx.restore();
  }
}

/**
 * Computes the 4 Corner Coordinates for End Crystals in Fighter Ender Dragon matches
 */
export function getCornerEndCrystals(arena) {
  const curArena = arena || (typeof state !== 'undefined' ? state.arena : null) || (typeof CONFIG !== 'undefined' ? CONFIG.arena : null) || { x: 45, y: 240, width: 450, height: 450, shape: 'rect' };
  const marginX = 66;
  const marginTop = 102;
  const marginBottom = 54;
  if (curArena.shape === 'circle') {
    const cx = curArena.x + curArena.width / 2;
    const cy = curArena.y + curArena.height / 2;
    const rad = Math.max(50, (curArena.radius || (curArena.width / 2)) - 72);
    const diagX = rad * Math.SQRT1_2;
    const diagY = rad * Math.SQRT1_2;
    return [
      { id: 'crystal_corner_tl', name: 'Top-Left End Crystal', x: Math.round(cx - diagX), y: Math.round(cy - diagY + 20) },
      { id: 'crystal_corner_tr', name: 'Top-Right End Crystal', x: Math.round(cx + diagX), y: Math.round(cy - diagY + 20) },
      { id: 'crystal_corner_bl', name: 'Bottom-Left End Crystal', x: Math.round(cx - diagX), y: Math.round(cy + diagY - 8) },
      { id: 'crystal_corner_br', name: 'Bottom-Right End Crystal', x: Math.round(cx + diagX), y: Math.round(cy + diagY - 8) },
    ];
  }
  return [
    { id: 'crystal_corner_tl', name: 'Top-Left End Crystal', x: Math.round(curArena.x + marginX), y: Math.round(curArena.y + marginTop) },
    { id: 'crystal_corner_tr', name: 'Top-Right End Crystal', x: Math.round(curArena.x + curArena.width - marginX), y: Math.round(curArena.y + marginTop) },
    { id: 'crystal_corner_bl', name: 'Bottom-Left End Crystal', x: Math.round(curArena.x + marginX), y: Math.round(curArena.y + curArena.height - marginBottom) },
    { id: 'crystal_corner_br', name: 'Bottom-Right End Crystal', x: Math.round(curArena.x + curArena.width - marginX), y: Math.round(curArena.y + curArena.height - marginBottom) },
  ];
}

/**
 * Draws the Authentic Minecraft End Crystal Healing Tether Beams
 * Connects crystals to the Ender Dragon using the vanilla end_crystal_beam.png scrolling static texture,
 * dual-layer cylindrical 3D rotation parallax, crisp pixel borders, and anchor sparkles.
 */
export function drawCrystalHealingTetherBeams(ctx, dragon) {
  if (!ctx || typeof state === 'undefined' || !state.fighters) return;
  const targetDragon = dragon || state.fighters.find(f => f && (f.characterId === 'ender_dragon' || f.type === 'ender_dragon') && f.hp > 0);
  if (!targetDragon || targetDragon.hp <= 0) return;

  targetDragon._drewTetherBeamsFrame = state.frameCount;

  const crystals = state.fighters.filter(
    f => f && f.isEndCrystal && f.hp > 0 && f.isTetheredToDragon && (!f.tetherDragonTarget || f.tetherDragonTarget === targetDragon)
  );
  if (crystals.length === 0) return;

  const time = state.frameCount || (typeof performance !== 'undefined' ? Math.floor(performance.now() / 16.6) : 0);
  const beamImg = getEndCrystalBeamImage();
  const hasBeamImg = Boolean(beamImg && beamImg.complete && beamImg.naturalWidth > 0);

  const cfg = typeof targetDragon._getConfig === 'function' ? targetDragon._getConfig() : (typeof CONFIG !== 'undefined' ? CONFIG.ender_dragon : null);
  const crystalDrawSize = (cfg && cfg.crystalDrawSize) || 140;
  const coreOffsetY = Math.round(crystalDrawSize * 0.449);

  for (let crystal of crystals) {
    const startX = crystal.x;
    const startY = crystal.y - coreOffsetY; // Anchor directly into 3D spinning crystal rune cube core
    const endX = targetDragon.x;
    const endY = targetDragon.y - (targetDragon.z || 0);

    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) continue;

    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(startX, startY);
    // Align so local +Y extends along the beam towards targetDragon: theta = angle - Math.PI / 2
    ctx.rotate(angle - Math.PI / 2);
    ctx.imageSmoothingEnabled = false;

    // ── 1. Subtle Translucent Void Amethyst Corona Rim ──
    ctx.strokeStyle = 'rgba(192, 38, 211, 0.22)';
    ctx.lineWidth = 24.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, dist);
    ctx.stroke();

    if (hasBeamImg) {
      // ── 2. Authentic Minecraft Outer Beam Column (18px wide) ──
      // In Minecraft, the outer beam scrolls and displays the noisy black-and-white static texture
      const outerWidth = 18;
      const scrollSpeed1 = 3.2; // px per frame upwards towards dragon
      const baseScroll1 = Math.floor((time * scrollSpeed1) % 256);

      ctx.save();
      ctx.globalAlpha = 0.88;

      let currentY1 = 0;
      while (currentY1 < dist) {
        const sy = Math.floor((256 - baseScroll1 + currentY1) % 256);
        const chunkLen = Math.min(256 - sy, dist - currentY1);
        ctx.drawImage(
          beamImg,
          0, sy, 16, chunkLen,
          -outerWidth / 2, currentY1, outerWidth, chunkLen
        );
        currentY1 += chunkLen;
      }
      ctx.restore();

      // ── 3. Authentic Minecraft Inner Rotating Core (12px wide) ──
      // Scrolls at a different speed with a 64px phase offset, creating Minecraft's 3D rotating cylinder effect
      const innerWidth = 12;
      const scrollSpeed2 = 5.0;
      const baseScroll2 = Math.floor(((time * scrollSpeed2) + 64) % 256);

      ctx.save();
      ctx.globalAlpha = 1.0;

      let currentY2 = 0;
      while (currentY2 < dist) {
        const sy = Math.floor((256 - baseScroll2 + currentY2) % 256);
        const chunkLen = Math.min(256 - sy, dist - currentY2);
        ctx.drawImage(
          beamImg,
          0, sy, 16, chunkLen,
          -innerWidth / 2, currentY2, innerWidth, chunkLen
        );
        currentY2 += chunkLen;
      }
      ctx.restore();

      // ── 4. Crisp Black Pixel Edge Borders (Defines the column boundaries matching Image 1) ──
      ctx.strokeStyle = 'rgba(14, 15, 20, 0.90)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-outerWidth / 2, 0);
      ctx.lineTo(-outerWidth / 2, dist);
      ctx.moveTo(outerWidth / 2, 0);
      ctx.lineTo(outerWidth / 2, dist);
      ctx.stroke();

    } else {
      // ── Procedural Minecraft Pixel Static Fallback (Headless / Loading state) ──
      const beamW = 18;
      const P = 2.0; // 2px retro discrete pixel size
      const steps = Math.ceil(dist / P);
      const scrollRow = Math.floor(time * 3.0);

      // Dark obsidian background column
      ctx.fillStyle = '#101014';
      ctx.fillRect(-beamW / 2, 0, beamW, dist);

      // Procedural pixel noise pattern
      const palette = ['#FFFFFF', '#F4F4F5', '#E4E4E7', '#A1A1AA', '#71717A', '#3F3F46'];
      const xPixelCount = Math.floor(beamW / P);

      for (let s = 0; s < steps; s++) {
        const yPos = s * P;
        for (let xp = 0; xp < xPixelCount; xp++) {
          const seed = ((s + scrollRow) * 19 + xp * 31) % 23;
          if (seed > 11) {
            ctx.fillStyle = palette[seed % palette.length];
            ctx.fillRect(-beamW / 2 + xp * P, yPos, P, P);
          }
        }
      }

      // Border lines
      ctx.strokeStyle = '#0E0F14';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-beamW / 2, 0);
      ctx.lineTo(-beamW / 2, dist);
      ctx.moveTo(beamW / 2, 0);
      ctx.lineTo(beamW / 2, dist);
      ctx.stroke();
    }

    // ── 5. Origin & Terminus Sparkle / Core Motes ──
    // Square Minecraft sparkle at crystal core
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.fillStyle = '#F5D0FE';
    ctx.fillRect(-5, -1, 10, 2);
    ctx.fillRect(-1, -5, 2, 10);

    // Terminus impact flash at Ender Dragon
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-5, dist - 5, 10, 10);
    ctx.fillStyle = '#C026D3';
    ctx.fillRect(-8, dist - 3, 16, 6);

    ctx.restore();
  }
}

