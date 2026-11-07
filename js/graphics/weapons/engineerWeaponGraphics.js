// ─────────────────────────────────────────────
// Engineer WEAPON & ENTITY GRAPHICS (100% Discrete Pixel Art Style — Saitama Tech)
// Features:
// - Shotgun: Walnut stock & pump, beveled gunmetal receiver, sliding pump action & ejecting shell
// - Wrench: Industrial cast-iron hook jaws, brass adjusting knurl, dipped red handle & crescent slash
// - Sentry Turret (Lv 1, 2, 3): Discrete pixel tripod, armored swivel head, Gatling barrels, rocket pod & laser
// - Dispenser: Upright heavy steel cabinet, glowing medical cross, CRT scanline provisions gauge & healing beam
// - Bullets & Muzzle Blasts: High-contrast discrete pixel tracers (Light & Dark Mode visible), starburst flashes & smoke
// Rule 11 (Zero shadowBlur) & Rule 20 Compliant
// ─────────────────────────────────────────────

import { state } from '../../core/state.js';
import { CONFIG, getHandSize } from '../../core/config.js';
import { drawEngineerPixelBody, drawEngineerPixelHand, _drawEngineerHair } from '../fighters/engineerSkin.js';

export const Engineer_WEAPON_GRAPHICS = {
  colors: {
    darkMetal: '#1E232B',
    mediumMetal: '#334155',
    lightMetal: '#64748B',
    wood: '#5C4033',          // Shotgun pump/stock
    wrench: '#94A3B8',        // Silver wrench
    accent: '#D97706',        // Goldenrod / brass accent
    outline: '#0B0D12',
    turretBase: '#1E232B',
    turretBody: '#334155',
    turretLens: '#06B6D4'
  }
};

const P = 2.0;
const snap = (v) => Math.round(v / P) * P;

/**
 * Main draw wrapper for Engineer in weapon studio, UI previews, and standalone rendering.
 */
export function drawEngineer(ctx, options = {}) {
  const {
    x = 0,
    y = 0,
    gunAngle = 0,
    r = 20,
    facingRight = true,
    wrenchActive = false,
    wrenchTimer = 0,
    wrenchAngle = 0,
    wrenchSlashFadeTimer = 0,
    shotgunRecoilTimer = 0,
    lastWeaponUsed = 'shotgun',
    color = '#ffcc00',
    hideHands = false,
    isWinnerReveal = false
  } = options;

  const shouldHideHands = (typeof state !== 'undefined' && state.showSkinOnly) || hideHands;

  ctx.save();
  ctx.translate(x, y);

  const angle = isWinnerReveal ? 0 : gunAngle;
  ctx.rotate(angle);
  const isFacingLeft = Math.abs(angle) > Math.PI / 2;
  if (isFacingLeft && !isWinnerReveal) {
    ctx.scale(1, -1);
  }

  // 1. Back Weapon (stowed on back)
  if (lastWeaponUsed === 'wrench') {
    drawEngineerShotgun(ctx, 0, 0, 0, r, true, 0, true, color, shouldHideHands, isWinnerReveal);
  } else {
    drawEngineerWrench(ctx, 0, 0, 0, r, true, 0, true, color, 0, shouldHideHands, isWinnerReveal);
  }

  // 2. 100% Discrete Pixel Art Body (Hard Hat, Goggles, Red Shirt, Denim Overalls, Toolbelt)
  drawEngineerPixelBody(ctx, r);

  // 3. Hard Hat PNG Overlay (Assets/model/engineer/Engineer-Hair.png)
  _drawEngineerHair(ctx, r, isFacingLeft);

  // 4. Front Weapon (active in hand)
  if (lastWeaponUsed === 'wrench') {
    drawEngineerWrench(ctx, 0, 0, wrenchActive ? wrenchAngle : 0, r, true, wrenchActive ? wrenchTimer : 0, false, color, wrenchSlashFadeTimer, shouldHideHands, isWinnerReveal);
  } else {
    drawEngineerShotgun(ctx, 0, 0, 0, r, true, shotgunRecoilTimer, false, color, shouldHideHands, isWinnerReveal);
  }

  ctx.restore();
}

/**
 * Renders the explosive muzzle blast flash and smoke wisps at the shotgun barrel tip in 100% discrete pixel art
 */
export function drawEngineerMuzzleBlast(ctx, x, y, blastP) {
  ctx.save();
  ctx.translate(snap(x), snap(y));

  const alpha = Math.max(0, 1.0 - blastP);
  const flashScale = 1.0 + blastP * 0.5;

  // 1. Expanding translucent pixel smoke puffs
  ctx.fillStyle = `rgba(148, 163, 184, ${(alpha * 0.45).toFixed(2)})`;
  const smokeBlocks = [
    { dx: 8 * flashScale, dy: -4, s: 6 },
    { dx: 14 * flashScale, dy: 2, s: 8 },
    { dx: 20 * flashScale, dy: -2, s: 6 }
  ];
  for (let s = 0; s < smokeBlocks.length; s++) {
    const sb = smokeBlocks[s];
    ctx.fillRect(snap(sb.dx), snap(sb.dy), sb.s, sb.s);
  }

  // 2. Outer Fiery Orange Radial Spikes
  ctx.fillStyle = `rgba(234, 88, 12, ${(alpha * 0.90).toFixed(2)})`;
  ctx.fillRect(0, -4, snap(20 * flashScale), 8);
  ctx.fillRect(snap(4 * flashScale), -10, snap(4 * flashScale), 20);
  ctx.fillRect(snap(8 * flashScale), -8, snap(6 * flashScale), 16);
  ctx.fillRect(snap(14 * flashScale), -4, snap(6 * flashScale), 8);

  // 3. Middle Bright Golden-Yellow Flare
  ctx.fillStyle = `rgba(251, 191, 36, ${alpha.toFixed(2)})`;
  ctx.fillRect(0, -3, snap(14 * flashScale), 6);
  ctx.fillRect(snap(2 * flashScale), -6, snap(4 * flashScale), 12);
  ctx.fillRect(snap(6 * flashScale), -4, snap(6 * flashScale), 8);

  // 4. Inner White-Hot Star Core
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
  ctx.fillRect(0, -2, snap(8 * flashScale), 4);
  ctx.fillRect(snap(2 * flashScale), -4, snap(3 * flashScale), 8);

  // 5. Ballistic Pixel Sparks
  const sparks = [
    { dx: 24 * flashScale, dy: -6, c: '#FFFFFF' },
    { dx: 28 * flashScale, dy: 4, c: '#FEF08A' },
    { dx: 34 * flashScale, dy: -1, c: '#F59E0B' },
    { dx: 22 * flashScale, dy: 8, c: '#EA580C' }
  ];
  for (let sp = 0; sp < sparks.length; sp++) {
    ctx.fillStyle = sparks[sp].c;
    ctx.fillRect(snap(sparks[sp].dx), snap(sparks[sp].dy), 2, 2);
  }

  ctx.restore();
}

/**
 * Draws Engineer's 12-Gauge Pump Shotgun in 100% discrete pixel art style.
 */
export function drawEngineerShotgun(ctx, x, y, gunAngle, r, facingRight, recoilTimer = 0, isStowed = false, color = '#ffcc00', shouldHideHands = false, isWinnerReveal = false) {
  ctx.save();
  ctx.translate(x, y);

  const maxRecoil = (CONFIG.Engineer && CONFIG.Engineer.shotgunRecoilDuration) || 28;
  const p = (recoilTimer > 0) ? Math.max(0, Math.min(1.0, 1.0 - (recoilTimer / maxRecoil))) : 1.0;

  let recoilX = 0;
  let muzzleRiseAngle = 0;
  let pumpOffset = 0;
  let ejectionPortOpen = 0;

  if (recoilTimer > 0 && !isStowed) {
    if (p < 0.15) {
      // Kickback & Muzzle Rise
      const kickP = p / 0.15;
      const easeKick = Math.sin(kickP * Math.PI * 0.5);
      recoilX = -easeKick * 10.0;
      muzzleRiseAngle = -easeKick * 0.12;
    } else if (p < 0.52) {
      // Pump Slide Back & Extraction
      const pumpP = (p - 0.15) / 0.37;
      const easePump = Math.sin(pumpP * Math.PI * 0.5);
      recoilX = -10.0 + pumpP * 4.0;
      muzzleRiseAngle = -0.12 * (1.0 - pumpP * 0.35);
      pumpOffset = -easePump * 8.0;
      ejectionPortOpen = easePump;
    } else if (p < 0.80) {
      // Pump Slam Forward
      const fwdP = (p - 0.52) / 0.28;
      const powerFwd = Math.pow(fwdP, 1.6);
      recoilX = -6.0 * (1.0 - powerFwd);
      muzzleRiseAngle = -0.08 * (1.0 - powerFwd);
      pumpOffset = -8.0 * (1.0 - powerFwd);
      ejectionPortOpen = 1.0 - powerFwd;
    } else {
      recoilX = 0;
      muzzleRiseAngle = 0;
      pumpOffset = 0;
      ejectionPortOpen = 0;
    }
  }

  const custom = (!isStowed && typeof state !== 'undefined' && state.weaponCustomizations && state.weaponCustomizations.engineer)
    ? state.weaponCustomizations.engineer
    : null;
  const customOffsetX = custom?.offsetX || 0;
  const customOffsetY = custom?.offsetY || 0;
  const customScale = custom?.scale ?? 1.0;
  const customAngle = custom?.angleOffset || 0;
  const customWidthScale = custom?.widthScale ?? 1.0;
  const customLengthScale = custom?.lengthScale ?? 1.0;

  if (isWinnerReveal) {
    if (isStowed) {
      ctx.translate(-r * 0.45, r * 0.35);
      ctx.rotate(Math.PI * 0.28);
      ctx.scale(0.95, 0.95);
    } else {
      ctx.translate(r * 0.95 + customOffsetX, r * 0.12 + customOffsetY);
      ctx.rotate(-0.16 + customAngle);
      ctx.scale(1.20 * customScale * customLengthScale, 1.20 * customScale * customWidthScale);
    }
  } else if (isStowed) {
    ctx.rotate(gunAngle + Math.PI);
    ctx.translate(r * 0.4, 0);
    ctx.rotate(Math.PI / 4);
    ctx.scale(0.95, 0.95);
  } else {
    ctx.rotate(gunAngle + (facingRight ? muzzleRiseAngle : -muzzleRiseAngle) + customAngle);
    ctx.translate(r + 6 + recoilX + customOffsetX, customOffsetY);
    ctx.scale(customScale * customLengthScale, customScale * customWidthScale);
  }

  if (!facingRight && !isWinnerReveal) {
    ctx.scale(1, -1);
  }

  const defaultShotgunScale = isStowed ? 1.0 : 1.20;
  ctx.scale(defaultShotgunScale, defaultShotgunScale);

  drawEngineerShotgunModel(ctx, recoilTimer, isStowed, color, shouldHideHands, pumpOffset, ejectionPortOpen);

  // Muzzle blast at barrel tip
  if (!isStowed && recoilTimer > (maxRecoil - 5) && !isWinnerReveal) {
    const blastP = (maxRecoil - recoilTimer) / 5;
    drawEngineerMuzzleBlast(ctx, 44, -3, blastP);
  }

  ctx.restore();
}

/**
 * Core 100% discrete pixel art model for Engineer's Shotgun.
 */
export function drawEngineerShotgunModel(ctx, recoilTimer, isStowed = false, color = '#ffcc00', shouldHideHands = false, pumpOffset = 0, ejectionPortOpen = 0) {
  ctx.save();

  // 1. Curved Pistol Grip & Stock (Rich Walnut Wood)
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(-26, 4, 18, 12);
  ctx.fillRect(-22, 14, 8, 4);

  // Walnut body
  ctx.fillStyle = '#78350F';
  ctx.fillRect(-24, 6, 14, 8);
  ctx.fillRect(-20, 12, 6, 4);

  // Wood highlights
  ctx.fillStyle = '#9A3412';
  ctx.fillRect(-22, 6, 10, 2);
  ctx.fillStyle = '#5C4033'; // Underside shadow
  ctx.fillRect(-20, 10, 8, 4);

  // Metal buttplate
  ctx.fillStyle = '#1E232B';
  ctx.fillRect(-26, 6, 2, 10);

  // 2. Trigger Guard & Trigger
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(-6, 3, 8, 5);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-4, 4, 4, 3);
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(-4, 4, 2, 2);

  // 3. Main Steel Receiver (Parkerized Gunmetal)
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(-13, -7, 24, 12);

  ctx.fillStyle = '#334155';
  ctx.fillRect(-12, -6, 22, 10);

  // Top receiver highlight chamfer
  ctx.fillStyle = '#64748B';
  ctx.fillRect(-11, -6, 20, 2);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(-8, -6, 12, 1);

  // Ejection Port
  const openW = snap(6.0 * (ejectionPortOpen || 0));
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(0, -4, 8, 4);

  if (ejectionPortOpen > 0.1) {
    ctx.fillStyle = '#CBD5E1'; // Silver bolt carrier
    ctx.fillRect(openW * 0.5, -3, 4, 2);
    ctx.fillStyle = '#F59E0B'; // Brass 12ga cartridge
    ctx.fillRect(0, -3, Math.max(2, openW * 0.8), 2);
  } else {
    ctx.fillStyle = '#CBD5E1'; // Closed bolt
    ctx.fillRect(1, -3, 6, 2);
  }

  // 4. Barrels (Twin Heavy Steel Tubes)
  // Main Barrel
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(10, -6, 34, 6);
  ctx.fillStyle = '#334155';
  ctx.fillRect(11, -5, 32, 4);
  ctx.fillStyle = '#64748B';
  ctx.fillRect(11, -5, 30, 1);

  // Front Bead Sight
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(40, -7, 2, 2);

  // Under-barrel Magazine Tube
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(10, 0, 26, 5);
  ctx.fillStyle = '#1E232B';
  ctx.fillRect(11, 1, 24, 3);
  ctx.fillStyle = '#475569';
  ctx.fillRect(34, 1, 2, 3); // Magazine cap

  // 5. Walnut Wood Pump Handle (Forend) with dynamic slide offset
  const pX = snap(14 + pumpOffset);
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(pX - 1, -1, 14, 7);
  ctx.fillStyle = '#78350F';
  ctx.fillRect(pX, 0, 12, 5);
  ctx.fillStyle = '#9A3412';
  ctx.fillRect(pX, 0, 12, 1);
  // Tactile grip grooves
  ctx.fillStyle = '#5C4033';
  ctx.fillRect(pX + 3, 1, 1, 4);
  ctx.fillRect(pX + 6, 1, 1, 4);
  ctx.fillRect(pX + 9, 1, 1, 4);

  // 6. Ejecting Spent 12ga Red Shotgun Shell
  if (ejectionPortOpen > 0.35) {
    ctx.save();
    ctx.translate(snap(4 + ejectionPortOpen * 4), snap(-10 - ejectionPortOpen * 6));
    ctx.rotate(ejectionPortOpen * 1.5);
    ctx.fillStyle = '#0B0D12';
    ctx.fillRect(-3, -2, 6, 4);
    ctx.fillStyle = '#DC2626'; // Red hull
    ctx.fillRect(-2, -1, 3, 2);
    ctx.fillStyle = '#F59E0B'; // Brass rim
    ctx.fillRect(1, -1, 1, 2);
    ctx.restore();
  }

  // 7. Pixel Work Gloves holding the Shotgun
  if (!shouldHideHands && !isStowed) {
    // Front hand on trigger
    drawEngineerPixelHand(ctx, -2, 5, getHandSize(4.0), '#D97706', true);
    // Back hand on pump
    drawEngineerPixelHand(ctx, pX + 5, 2, getHandSize(3.6), '#D97706', true);
  }

  ctx.restore();
}

/**
 * Draws Engineer's Pipe Wrench in 100% discrete pixel art style.
 */
export function drawEngineerWrench(ctx, x, y, gunAngle, r, facingRight, timer, isStowed = false, color = '#ffcc00', slashFadeTimer = 0, shouldHideHands = false, isWinnerReveal = false) {
  ctx.save();
  ctx.translate(x, y);

  const swipeArc = Math.PI * 0.85;

  const custom = (!isStowed && typeof state !== 'undefined' && state.weaponCustomizations && state.weaponCustomizations.engineer)
    ? state.weaponCustomizations.engineer
    : null;
  const customOffsetX = custom?.offsetX || 0;
  const customOffsetY = custom?.offsetY || 0;
  const customScale = custom?.scale ?? 1.0;
  const customAngle = custom?.angleOffset || 0;
  const customWidthScale = custom?.widthScale ?? 1.0;
  const customLengthScale = custom?.lengthScale ?? 1.0;

  if (isWinnerReveal) {
    if (isStowed) {
      ctx.translate(-r * 0.50, r * 0.35);
      ctx.rotate(-Math.PI * 0.32);
      ctx.scale(0.85, 0.85);
    } else {
      ctx.translate(r * 0.95 + customOffsetX, r * 0.12 + customOffsetY);
      ctx.rotate(-0.20 + customAngle);
      ctx.scale(1.0 * customScale * customLengthScale, 1.0 * customScale * customWidthScale);
    }
  } else if (isStowed) {
    ctx.rotate(gunAngle + Math.PI);
    ctx.translate(r * 0.4, 0);
    ctx.rotate(-Math.PI / 4);
    ctx.scale(0.85, 0.85);
    if (!facingRight) ctx.scale(1, -1);
  } else {
    const flipDir = facingRight ? 1 : -1;
    let armAngleOffset = 0;
    let wristAngleOffset = 0;
    let showSlash = false;
    let slashProgress = 1.0;
    let slashAlpha = 0.0;

    if (timer > 0) {
      const maxTimer = CONFIG.Engineer?.wrenchSwipeDuration || 16;
      const p = Math.min(1.0, Math.max(0.0, 1.0 - (timer / maxTimer)));
      let swingT = 0;
      let wristOffset = 0;

      if (p < 0.20) {
        const wP = p / 0.20;
        const easeW = Math.sin(wP * Math.PI * 0.5);
        swingT = -easeW * 0.18;
        wristOffset = -0.60 * easeW;
      } else if (p < 0.65) {
        const sP = (p - 0.20) / 0.45;
        const powerCurve = Math.pow(sP, 1.75);
        swingT = -0.18 + 1.18 * powerCurve;
        wristOffset = -0.60 + 1.10 * Math.sin(sP * Math.PI);
      } else if (p < 0.82) {
        const hP = (p - 0.65) / 0.17;
        swingT = 1.0 + Math.sin(hP * Math.PI * 4) * 0.025;
        wristOffset = 0.50 * (1 - hP);
      } else {
        const rP = (p - 0.82) / 0.18;
        const easeR = Math.sin(rP * Math.PI * 0.5);
        swingT = 1.0 * (1 - easeR);
        wristOffset = 0;
      }

      armAngleOffset = (-swipeArc * 0.5 + swipeArc * swingT) * flipDir;
      wristAngleOffset = wristOffset * flipDir;
      showSlash = true;
      slashProgress = Math.min(1.0, Math.max(0.0, (swingT + 0.18) / 1.18));
      slashAlpha = (p < 0.20) ? (p / 0.20) : (p > 0.82 ? (1 - (p - 0.82) / 0.18) : 1.0);
    } else {
      armAngleOffset = 0;
      wristAngleOffset = 0;
      if (slashFadeTimer > 0) {
        showSlash = true;
        slashProgress = 1.0;
        slashAlpha = Math.pow(slashFadeTimer / 12, 1.4);
      }
    }

    // ── Pixel Art Industrial Crescent Slash Arc ──
    if (showSlash && slashAlpha > 0.01) {
      ctx.save();
      const startAngle = gunAngle + (-swipeArc * 0.5) * flipDir;
      const sweepAngle = (swipeArc * slashProgress) * flipDir;
      const midR = r + 28;
      const steps = 16;
      const stepAngle = sweepAngle / steps;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = startAngle + i * stepAngle;
        const rad = midR + Math.sin(t * Math.PI) * 10;
        const px = snap(Math.cos(a) * rad);
        const py = snap(Math.sin(a) * rad);

        ctx.fillStyle = `rgba(245, 158, 11, ${(0.80 * slashAlpha).toFixed(2)})`;
        ctx.fillRect(px - 2, py - 2, 4, 4);

        ctx.fillStyle = `rgba(255, 255, 255, ${(0.95 * slashAlpha).toFixed(2)})`;
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
      ctx.restore();
    }

    ctx.rotate(gunAngle + armAngleOffset + customAngle);
    ctx.translate(r + 5 + customOffsetX, customOffsetY);
    ctx.scale(customScale * customLengthScale, customScale * customWidthScale);

    if (!shouldHideHands) {
      drawEngineerPixelHand(ctx, 0, 0, getHandSize(4.2), '#D97706', true);
    }

    ctx.rotate(wristAngleOffset);
    if (!facingRight) ctx.scale(1, -1);
  }

  ctx.scale(1.4, 1.4);

  // ── WRENCH PIXEL ART MODEL ──
  // 1. Tapered Red Handle
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(-3, -3, 30, 6);

  ctx.fillStyle = '#DC2626'; // Dipped red grip
  ctx.fillRect(-2, -2, 28, 4);
  ctx.fillStyle = '#EF4444'; // Top highlight
  ctx.fillRect(-1, -2, 26, 1);
  ctx.fillStyle = '#991B1B'; // Bottom shadow
  ctx.fillRect(-1, 1, 26, 1);

  // Central Weight Hole
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(4, -1, 10, 2);

  // 2. Brass Knurled Nut Wheel
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(18, -6, 6, 8);
  ctx.fillStyle = '#D97706';
  ctx.fillRect(19, -5, 4, 6);
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(20, -5, 2, 1);

  // 3. Lower Fixed Jaw & Cast-Iron Housing
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(24, -12, 10, 14);
  ctx.fillStyle = '#475569';
  ctx.fillRect(25, -11, 8, 12);
  ctx.fillStyle = '#64748B';
  ctx.fillRect(25, -11, 2, 10);

  // Serrated Teeth on Lower Jaw
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(31, -10, 2, 2);
  ctx.fillRect(31, -6, 2, 2);

  // 4. Upper Movable Hook Jaw
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(20, -20, 18, 9);
  ctx.fillRect(32, -18, 6, 8);

  ctx.fillStyle = '#64748B';
  ctx.fillRect(21, -19, 16, 7);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(22, -19, 14, 2);

  // Upper Jaw Hardened Teeth
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(31, -14, 2, 2);
  ctx.fillRect(34, -14, 2, 2);

  ctx.restore();
}

let _engBulletTrailGrad = null;
let _engBulletCoreGrad = null;
let _turretTrailGrad = null;
let _turretCoreGrad = null;

function _getEngBulletTrailGrad(ctx) {
  if (!_engBulletTrailGrad) {
    _engBulletTrailGrad = ctx.createLinearGradient(-32, 0, 0, 0);
    _engBulletTrailGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
    _engBulletTrailGrad.addColorStop(0.55, 'rgba(245, 158, 11, 0.40)');
    _engBulletTrailGrad.addColorStop(1.0, 'rgba(254, 240, 138, 0.90)');
  }
  return _engBulletTrailGrad;
}

function _getEngBulletCoreGrad(ctx) {
  if (!_engBulletCoreGrad) {
    _engBulletCoreGrad = ctx.createLinearGradient(-7, 0, 7, 0);
    _engBulletCoreGrad.addColorStop(0, '#B45309');    // Rich copper base
    _engBulletCoreGrad.addColorStop(0.55, '#F59E0B'); // Polished golden brass
    _engBulletCoreGrad.addColorStop(1.0, '#FEF08A');  // Bright yellow tip
  }
  return _engBulletCoreGrad;
}

function _getTurretTrailGrad(ctx) {
  if (!_turretTrailGrad) {
    _turretTrailGrad = ctx.createLinearGradient(-36, 0, 0, 0);
    _turretTrailGrad.addColorStop(0, 'rgba(234, 88, 12, 0)');
    _turretTrailGrad.addColorStop(0.50, 'rgba(245, 158, 11, 0.45)');
    _turretTrailGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.95)');
  }
  return _turretTrailGrad;
}

function _getTurretCoreGrad(ctx) {
  if (!_turretCoreGrad) {
    _turretCoreGrad = ctx.createLinearGradient(-8, 0, 8, 0);
    _turretCoreGrad.addColorStop(0, '#D97706');    // Copper jacket base
    _turretCoreGrad.addColorStop(0.60, '#F59E0B'); // Polished brass middle
    _turretCoreGrad.addColorStop(1.0, '#10B981');  // Green-tip steel penetrator
  }
  return _turretCoreGrad;
}

/**
 * Draws Engineer's Shotgun Buckshot Tracer Bullet (matching John Wick's gun projectile style).
 */
export function drawEngineerBullet(ctx, xOrObj, y, angle, scale = 1.0, lifeRatio = 1.0) {
  let bx, by, bAngle, bScale, bLife, bHistory, isFrozen = false, freezeTimer = 0;
  if (typeof xOrObj === 'object' && xOrObj !== null) {
    bx = xOrObj.x;
    by = xOrObj.y;
    const vx = (xOrObj.vx === 0 && xOrObj.vy === 0 && xOrObj._resumeVx !== undefined) ? xOrObj._resumeVx : (xOrObj.vx || 0);
    const vy = (xOrObj.vx === 0 && xOrObj.vy === 0 && xOrObj._resumeVy !== undefined) ? xOrObj._resumeVy : (xOrObj.vy || 0);
    bAngle = (vx !== 0 || vy !== 0) ? Math.atan2(vy, vx) : (xOrObj.angle || 0);
    bScale = xOrObj.scale || 1.0;
    bLife = Math.max(0.4, (xOrObj.life || 40) / (xOrObj.maxLife || 40));
    bHistory = xOrObj.history;
    isFrozen = Boolean(xOrObj.isFrozenByInfinity || (xOrObj.infinityFreezeTimer && xOrObj.infinityFreezeTimer > 0));
    freezeTimer = xOrObj.infinityFreezeTimer || 0;
  } else {
    bx = xOrObj;
    by = y;
    bAngle = angle || 0;
    bScale = scale || 1.0;
    bLife = lifeRatio !== undefined ? lifeRatio : 1.0;
  }
  if (bx === undefined || by === undefined || isNaN(bx) || isNaN(by)) return;

  const len = 14 * bScale;
  const width = 3.6 * bScale;
  const fadeAlpha = (isFrozen && freezeTimer < 30 && freezeTimer > 0) ? Math.max(0, freezeTimer / 30) : 1.0;

  // 1. Persistent World-Space Tracer Trail (using projectile path history)
  if (bHistory && bHistory.length > 1) {
    ctx.save();
    ctx.globalAlpha = fadeAlpha;
    // Outer glow line
    ctx.beginPath();
    ctx.moveTo(bHistory[0].x, bHistory[0].y);
    for (let i = 1; i < bHistory.length; i++) {
      ctx.lineTo(bHistory[i].x, bHistory[i].y);
    }
    ctx.strokeStyle = isFrozen ? 'rgba(0, 229, 255, 0.50)' : 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 2.0 * bScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Inner highlight line on latest segments
    const sliceCount = Math.max(1, bHistory.length - 4);
    ctx.beginPath();
    ctx.moveTo(bHistory[sliceCount - 1].x, bHistory[sliceCount - 1].y);
    for (let i = sliceCount; i < bHistory.length; i++) {
      ctx.lineTo(bHistory[i].x, bHistory[i].y);
    }
    ctx.strokeStyle = isFrozen ? 'rgba(224, 247, 255, 0.90)' : 'rgba(254, 240, 138, 0.85)';
    ctx.lineWidth = 1.0 * bScale;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = fadeAlpha;
  ctx.translate(bx, by);
  ctx.rotate(bAngle);

  if (isFrozen) {
    // Electric Limitless Infinity Stasis Halo
    const freezeHalo = ctx.createRadialGradient(0, 0, 1, 0, 0, 12 * bScale);
    freezeHalo.addColorStop(0.0, 'rgba(0, 229, 255, 0.85)');
    freezeHalo.addColorStop(0.5, 'rgba(56, 189, 248, 0.40)');
    freezeHalo.addColorStop(1.0, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = freezeHalo;
    ctx.beginPath();
    ctx.arc(0, 0, 12 * bScale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. High-speed Motion Trail (Fading gradient streak trailing backward)
  const trailLen = 32 * bScale;
  if (isFrozen) {
    const frozenTrailGrad = ctx.createLinearGradient(-trailLen, 0, 0, 0);
    frozenTrailGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
    frozenTrailGrad.addColorStop(0.55, 'rgba(0, 229, 255, 0.45)');
    frozenTrailGrad.addColorStop(1.0, 'rgba(224, 247, 255, 0.95)');
    ctx.fillStyle = frozenTrailGrad;
  } else {
    ctx.fillStyle = _getEngBulletTrailGrad(ctx);
  }
  ctx.beginPath();
  ctx.moveTo(-trailLen, 0);
  ctx.lineTo(-len / 2, -width * 0.85);
  ctx.lineTo(0, 0);
  ctx.lineTo(-len / 2, width * 0.85);
  ctx.closePath();
  ctx.fill();

  // 3. Bullet Core (Sharp aerodynamic metal jacket bullet)
  if (isFrozen) {
    const frozenCoreGrad = ctx.createLinearGradient(-7, 0, 7, 0);
    frozenCoreGrad.addColorStop(0, '#0284C7');    // Deep icy blue base
    frozenCoreGrad.addColorStop(0.55, '#00E5FF'); // Radiant electric limitless cyan
    frozenCoreGrad.addColorStop(1.0, '#E0F7FF');  // Brilliant white-cyan tip
    ctx.fillStyle = frozenCoreGrad;
    ctx.strokeStyle = '#0369A1';
  } else {
    ctx.fillStyle = _getEngBulletCoreGrad(ctx);
    ctx.strokeStyle = '#78350F';
  }
  ctx.lineWidth = 0.8 * bScale;

  ctx.beginPath();
  // Flat back
  ctx.moveTo(-len / 2, -width / 2);
  // Straight body
  ctx.lineTo(len * 0.15, -width / 2);
  // Pointed aerodynamic tip
  ctx.quadraticCurveTo(len / 2, 0, len / 2, 0);
  ctx.quadraticCurveTo(len * 0.15, width / 2, len * 0.15, width / 2);
  // Straight body bottom
  ctx.lineTo(-len / 2, width / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Inner Hot-White core shine
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(-len * 0.2, -width * 0.25);
  ctx.lineTo(len * 0.2, 0);
  ctx.lineTo(-len * 0.2, width * 0.25);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draws Turret Bullet (matching John Wick's gun projectile style).
 */
export function drawTurretBullet(ctx, xOrObj, y, angle, scale = 1.0, lifeRatio = 1.0) {
  let bx, by, bAngle, bScale, bLife, bHistory, isFrozen = false, freezeTimer = 0;
  if (typeof xOrObj === 'object' && xOrObj !== null) {
    bx = xOrObj.x;
    by = xOrObj.y;
    const vx = (xOrObj.vx === 0 && xOrObj.vy === 0 && xOrObj._resumeVx !== undefined) ? xOrObj._resumeVx : (xOrObj.vx || 0);
    const vy = (xOrObj.vx === 0 && xOrObj.vy === 0 && xOrObj._resumeVy !== undefined) ? xOrObj._resumeVy : (xOrObj.vy || 0);
    bAngle = (vx !== 0 || vy !== 0) ? Math.atan2(vy, vx) : (xOrObj.angle || 0);
    bScale = xOrObj.scale || 1.0;
    bLife = Math.max(0.4, (xOrObj.life || 40) / (xOrObj.maxLife || 40));
    bHistory = xOrObj.history;
    isFrozen = Boolean(xOrObj.isFrozenByInfinity || (xOrObj.infinityFreezeTimer && xOrObj.infinityFreezeTimer > 0));
    freezeTimer = xOrObj.infinityFreezeTimer || 0;
  } else {
    bx = xOrObj;
    by = y;
    bAngle = angle || 0;
    bScale = scale || 1.0;
    bLife = lifeRatio !== undefined ? lifeRatio : 1.0;
  }
  if (bx === undefined || by === undefined || isNaN(bx) || isNaN(by)) return;

  const len = 16 * bScale;
  const width = 3.8 * bScale;
  const fadeAlpha = (isFrozen && freezeTimer < 30 && freezeTimer > 0) ? Math.max(0, freezeTimer / 30) : 1.0;

  // 1. Persistent World-Space Tracer Trail (using projectile path history)
  if (bHistory && bHistory.length > 1) {
    ctx.save();
    ctx.globalAlpha = fadeAlpha;
    // Outer glow line
    ctx.beginPath();
    ctx.moveTo(bHistory[0].x, bHistory[0].y);
    for (let i = 1; i < bHistory.length; i++) {
      ctx.lineTo(bHistory[i].x, bHistory[i].y);
    }
    ctx.strokeStyle = isFrozen ? 'rgba(0, 229, 255, 0.55)' : 'rgba(249, 115, 22, 0.50)';
    ctx.lineWidth = 2.2 * bScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Inner razor-sharp white-hot tracer line on latest segments
    const sliceCount = Math.max(1, bHistory.length - 4);
    ctx.beginPath();
    ctx.moveTo(bHistory[sliceCount - 1].x, bHistory[sliceCount - 1].y);
    for (let i = sliceCount; i < bHistory.length; i++) {
      ctx.lineTo(bHistory[i].x, bHistory[i].y);
    }
    ctx.strokeStyle = isFrozen ? 'rgba(224, 247, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.2 * bScale;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = fadeAlpha;
  ctx.translate(bx, by);
  ctx.rotate(bAngle);

  if (isFrozen) {
    // Electric Limitless Infinity Stasis Halo
    const freezeHalo = ctx.createRadialGradient(0, 0, 1, 0, 0, 14 * bScale);
    freezeHalo.addColorStop(0.0, 'rgba(0, 229, 255, 0.85)');
    freezeHalo.addColorStop(0.5, 'rgba(56, 189, 248, 0.40)');
    freezeHalo.addColorStop(1.0, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = freezeHalo;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * bScale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. High-speed Supersonic Motion Trail (Fading gradient streak trailing backward)
  const trailLen = 36 * bScale;
  if (isFrozen) {
    const frozenTrailGrad = ctx.createLinearGradient(-trailLen, 0, 0, 0);
    frozenTrailGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
    frozenTrailGrad.addColorStop(0.50, 'rgba(0, 229, 255, 0.50)');
    frozenTrailGrad.addColorStop(1.0, 'rgba(224, 247, 255, 0.95)');
    ctx.fillStyle = frozenTrailGrad;
  } else {
    ctx.fillStyle = _getTurretTrailGrad(ctx);
  }
  ctx.beginPath();
  ctx.moveTo(-trailLen, 0);
  ctx.lineTo(-len / 2, -width * 0.85);
  ctx.lineTo(0, 0);
  ctx.lineTo(-len / 2, width * 0.85);
  ctx.closePath();
  ctx.fill();

  // 3. 7.62mm Armor-Piercing Bullet Core (Copper base, brass body, green penetrator tip / Frozen cyan)
  if (isFrozen) {
    const frozenCoreGrad = ctx.createLinearGradient(-8, 0, 8, 0);
    frozenCoreGrad.addColorStop(0, '#0284C7');    // Deep icy blue base
    frozenCoreGrad.addColorStop(0.60, '#00E5FF'); // Radiant electric cyan middle
    frozenCoreGrad.addColorStop(1.0, '#E0F7FF');  // Bright white-cyan penetrator tip
    ctx.fillStyle = frozenCoreGrad;
    ctx.strokeStyle = '#0369A1';
  } else {
    ctx.fillStyle = _getTurretCoreGrad(ctx);
    ctx.strokeStyle = '#78350F';
  }
  ctx.lineWidth = 0.8 * bScale;

  ctx.beginPath();
  // Flat back
  ctx.moveTo(-len / 2, -width / 2);
  // Straight body
  ctx.lineTo(len * 0.20, -width / 2);
  // Pointed aerodynamic tip
  ctx.quadraticCurveTo(len / 2, 0, len / 2, 0);
  ctx.quadraticCurveTo(len * 0.20, width / 2, len * 0.20, width / 2);
  // Straight body bottom
  ctx.lineTo(-len / 2, width / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Inner Brilliant White-Hot core shine
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(-len * 0.25, -width * 0.25);
  ctx.lineTo(len * 0.25, 0);
  ctx.lineTo(-len * 0.25, width * 0.25);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Renders the industrial military tripod base for the Sentry Gun in authentic 16-bit pixel art.
 */
function _drawTurretTripodBase(ctx, level, isHit) {
  const legLen = level === 3 ? 24 : (level === 2 ? 22 : 18);
  const legCount = 3;

  // 16-bit Stepped Palette
  const cOutline = '#0B0D12';
  const cSpecular = isHit ? '#FFFFFF' : '#CBD5E1';
  const cHighlight = isHit ? '#E2E8F0' : '#64748B';
  const cMetal = isHit ? '#CBD5E1' : '#334155';
  const cShadow = isHit ? '#94A3B8' : '#1E293B';
  const cDeep = '#0F172A';
  const cChrome = isHit ? '#FFFFFF' : '#F8FAFC';
  const cBrass = isHit ? '#FEF08A' : '#F59E0B';
  const cBronze = '#78350F';

  // 1. Tripod Base Legs (3 articulated radial legs)
  for (let i = 0; i < legCount; i++) {
    const a = (i * Math.PI * 2) / legCount - Math.PI / 2;
    ctx.save();
    ctx.rotate(a);

    // ── Main Strut Outer Ink Outline ──
    ctx.fillStyle = cOutline;
    ctx.fillRect(-5, 0, 10, legLen + 2);

    // ── Main Strut 16-bit Shading Ramp ──
    // Left Specular Edge
    ctx.fillStyle = cSpecular;
    ctx.fillRect(-4, 1, 1, legLen);
    // Upper Highlight Facet
    ctx.fillStyle = cHighlight;
    ctx.fillRect(-3, 1, 2, legLen);
    // Midtone Gunmetal Core
    ctx.fillStyle = cMetal;
    ctx.fillRect(-1, 1, 2, legLen);
    // Right Underside Shadow
    ctx.fillStyle = cShadow;
    ctx.fillRect(1, 1, 2, legLen);
    // Deep Occlusion Crease
    ctx.fillStyle = cDeep;
    ctx.fillRect(3, 1, 1, legLen);

    // Structural Hex Bolt Rivets
    ctx.fillStyle = cSpecular;
    ctx.fillRect(-2, 3, 1, 1);
    ctx.fillRect(-2, 8, 1, 1);
    ctx.fillStyle = cOutline;
    ctx.fillRect(-2, 4, 1, 1);
    ctx.fillRect(-2, 9, 1, 1);

    // ── Hydraulic Cylinder & Piston (Lv 2 & 3) ──
    if (level >= 2) {
      // Outer Hydraulic Bracket Box
      ctx.fillStyle = cOutline;
      ctx.fillRect(-7, 6, 14, 8);
      ctx.fillStyle = cShadow;
      ctx.fillRect(-6, 7, 12, 6);
      ctx.fillStyle = cMetal;
      ctx.fillRect(-5, 7, 10, 4);
      ctx.fillStyle = cHighlight;
      ctx.fillRect(-5, 7, 10, 1);

      // Polished Chrome Hydraulic Piston Rod
      ctx.fillStyle = cChrome;
      ctx.fillRect(-1, 4, 1, 10);
      ctx.fillStyle = cSpecular;
      ctx.fillRect(0, 4, 1, 10);
      ctx.fillStyle = cHighlight;
      ctx.fillRect(1, 4, 1, 10);

      // Brass Packing Gland Bushing Ring
      ctx.fillStyle = cBrass;
      ctx.fillRect(-2, 11, 4, 1);
      ctx.fillStyle = cBronze;
      ctx.fillRect(-1, 12, 2, 1);
    }

    // ── Articulated Footpad & Disc Base ──
    // Stepped Octagon Footpad (Corner cutouts)
    ctx.fillStyle = cOutline;
    ctx.fillRect(-7, legLen - 1, 14, 5);
    ctx.fillRect(-8, legLen, 16, 3);

    // Footpad 16-bit Shaded Body
    ctx.fillStyle = cShadow;
    ctx.fillRect(-7, legLen, 14, 3);
    ctx.fillStyle = cMetal;
    ctx.fillRect(-6, legLen, 12, 2);
    ctx.fillStyle = cHighlight;
    ctx.fillRect(-5, legLen - 1, 10, 1);

    // Rubber Non-Slip Grip Tread Notches (Bottom)
    ctx.fillStyle = cDeep;
    ctx.fillRect(-6, legLen + 3, 2, 1);
    ctx.fillRect(-1, legLen + 3, 2, 1);
    ctx.fillRect(4, legLen + 3, 2, 1);

    // Anchor Bolt Rivet
    ctx.fillStyle = cSpecular;
    ctx.fillRect(0, legLen + 1, 1, 1);

    ctx.restore();
  }

  // 2. Heavy Center Swivel Collar Hub (16-bit Stepped Octagonal Ring & Brass Gear Teeth)
  const hubR = level === 3 ? 9 : (level === 2 ? 8 : 7);

  // Outer Octagonal Black Ink Border
  ctx.fillStyle = cOutline;
  ctx.fillRect(-hubR - 2, -hubR, (hubR + 2) * 2, hubR * 2);
  ctx.fillRect(-hubR, -hubR - 2, hubR * 2, (hubR + 2) * 2);
  ctx.fillRect(-hubR - 1, -hubR - 1, (hubR + 1) * 2, (hubR + 1) * 2);

  // Gunmetal Beveled Collar Ring
  ctx.fillStyle = cShadow;
  ctx.fillRect(-hubR, -hubR + 1, hubR * 2, hubR * 2 - 2);
  ctx.fillRect(-hubR + 1, -hubR, hubR * 2 - 2, hubR * 2);
  ctx.fillStyle = cMetal;
  ctx.fillRect(-hubR + 1, -hubR + 1, hubR * 2 - 2, hubR * 2 - 2);
  ctx.fillStyle = cHighlight;
  ctx.fillRect(-hubR + 1, -hubR + 1, hubR * 2 - 2, 2);
  ctx.fillRect(-hubR + 1, -hubR + 1, 2, hubR * 2 - 2);

  // Machined Brass Gear Teeth Ring (Visible 8-tooth cog bevel)
  const gR = hubR - 2;
  ctx.fillStyle = cBronze;
  ctx.fillRect(-gR, -gR, gR * 2, gR * 2);
  ctx.fillStyle = cBrass;
  // 8 Gear Teeth Pixels
  ctx.fillRect(-gR + 1, -gR, gR * 2 - 2, 1);
  ctx.fillRect(-gR + 1, gR - 1, gR * 2 - 2, 1);
  ctx.fillRect(-gR, -gR + 1, 1, gR * 2 - 2);
  ctx.fillRect(gR - 1, -gR + 1, 1, gR * 2 - 2);
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(-gR + 2, -gR, 2, 1);
  ctx.fillRect(gR - 4, -gR, 2, 1);

  // Center Steel Bearing Axle
  const axR = Math.max(2, hubR - 4);
  ctx.fillStyle = cOutline;
  ctx.fillRect(-axR, -axR, axR * 2, axR * 2);
  ctx.fillStyle = cMetal;
  ctx.fillRect(-axR + 1, -axR + 1, axR * 2 - 2, axR * 2 - 2);
  ctx.fillStyle = cSpecular;
  ctx.fillRect(-1, -1, 2, 1);
}

/**
 * Draws the rear RED Team ammunition drum in 16-bit stepped pixel art.
 */
function _drawTurretAmmoDrum(ctx, level, isHit) {
  const drumW = level === 3 ? 18 : (level === 2 ? 16 : 14);
  const drumH = level === 3 ? 24 : (level === 2 ? 22 : 18);
  const drumX = -drumW - 2;
  const drumY = -Math.floor(drumH / 2);

  const cOutline = '#0B0D12';
  const cRedGlint = isHit ? '#FFFFFF' : '#FCA5A5';
  const cRedHigh = isHit ? '#FFFFFF' : '#EF4444';
  const cRedMid = isHit ? '#E2E8F0' : '#DC2626';
  const cRedDark = isHit ? '#CBD5E1' : '#991B1B';
  const cRedDeep = isHit ? '#94A3B8' : '#450A0A';
  const cSteelHigh = isHit ? '#FFFFFF' : '#64748B';
  const cSteelMid = isHit ? '#CBD5E1' : '#334155';
  const cSteelDark = '#1E293B';
  const cAmber = '#FACC15';

  // ── 1. Stepped Cylindrical Outer Black Ink Contour (Corner Cuts) ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(drumX, drumY - 1, drumW, drumH + 2);
  ctx.fillRect(drumX - 1, drumY, drumW + 2, drumH);

  // ── 2. RED Enamel 16-bit Vertical Shading Ramp ──
  // Deep Shadow (Left / Bottom-Left)
  ctx.fillStyle = cRedDeep;
  ctx.fillRect(drumX, drumY, drumW, drumH);
  // Dark Red Base
  ctx.fillStyle = cRedDark;
  ctx.fillRect(drumX + 1, drumY, drumW - 1, drumH);
  // Saturated RED Midtone
  ctx.fillStyle = cRedMid;
  ctx.fillRect(drumX + 2, drumY + 1, drumW - 4, drumH - 2);
  // Specular Highlight Column (Upper Left)
  ctx.fillStyle = cRedHigh;
  ctx.fillRect(drumX + 3, drumY + 1, 3, drumH - 2);
  ctx.fillStyle = cRedGlint;
  ctx.fillRect(drumX + 3, drumY + 2, 2, 2);

  // ── 3. Top & Bottom Reinforced Steel Retaining Rims ──
  // Top Collar
  ctx.fillStyle = cSteelMid;
  ctx.fillRect(drumX, drumY, drumW, 2);
  ctx.fillStyle = cSteelHigh;
  ctx.fillRect(drumX + 1, drumY, drumW - 2, 1);
  // Bottom Collar
  ctx.fillStyle = cSteelDark;
  ctx.fillRect(drumX, drumY + drumH - 3, drumW, 3);
  ctx.fillStyle = cSteelMid;
  ctx.fillRect(drumX + 1, drumY + drumH - 2, drumW - 2, 1);

  // Rivet Studs on Retaining Rims
  ctx.fillStyle = cSteelHigh;
  ctx.fillRect(drumX + 2, drumY, 1, 1);
  ctx.fillRect(drumX + drumW - 3, drumY, 1, 1);
  ctx.fillRect(drumX + 2, drumY + drumH - 2, 1, 1);
  ctx.fillRect(drumX + drumW - 3, drumY + drumH - 2, 1, 1);

  // ── 4. Industrial Ammo Decal / Hazard Badge ──
  ctx.fillStyle = cAmber;
  ctx.fillRect(drumX + 3, drumY + Math.floor(drumH / 2) - 2, 4, 4);
  ctx.fillStyle = cOutline;
  ctx.fillRect(drumX + 4, drumY + Math.floor(drumH / 2) - 1, 2, 2);
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(drumX + 4, drumY + Math.floor(drumH / 2) - 1, 1, 1);

  // ── 5. Forward Ammo Feed Coupling Flange ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(drumX + drumW, drumY + 3, 2, drumH - 6);
  ctx.fillStyle = cSteelMid;
  ctx.fillRect(drumX + drumW, drumY + 4, 1, drumH - 8);
}

/**
 * Draws Level 1 Single Heavy Barrel Sentry Head in 16-bit stepped pixel art.
 */
function _drawTurretLevel1Head(ctx, isHit) {
  _drawTurretAmmoDrum(ctx, 1, isHit);

  const cOutline = '#0B0D12';
  const cSpecular = isHit ? '#FFFFFF' : '#CBD5E1';
  const cHigh = isHit ? '#E2E8F0' : '#64748B';
  const cMid = isHit ? '#CBD5E1' : '#334155';
  const cDark = isHit ? '#94A3B8' : '#1E293B';

  // ── 1. Main Cast-Iron Receiver Box ──
  // Stepped Black Ink Outline
  ctx.fillStyle = cOutline;
  ctx.fillRect(-5, -8, 18, 16);
  ctx.fillRect(-4, -9, 16, 18);

  // Receiver 16-bit Shading
  ctx.fillStyle = cDark;
  ctx.fillRect(-4, -8, 16, 16);
  ctx.fillStyle = cMid;
  ctx.fillRect(-4, -7, 14, 14);
  // Top Chamfer Bevel Highlight
  ctx.fillStyle = cHigh;
  ctx.fillRect(-3, -7, 14, 2);
  ctx.fillStyle = cSpecular;
  ctx.fillRect(-3, -7, 6, 1);

  // Lateral Cooling Louver Slits (3 horizontal vents)
  for (let v = 0; v < 3; v++) {
    const vy = -3 + v * 3;
    ctx.fillStyle = cOutline;
    ctx.fillRect(-1, vy, 8, 1);
    ctx.fillStyle = cHigh;
    ctx.fillRect(-1, vy - 1, 8, 1);
  }

  // Receiver Corner Hex Rivets
  ctx.fillStyle = cSpecular;
  ctx.fillRect(-3, -6, 1, 1);
  ctx.fillRect(-3, 5, 1, 1);

  // ── 2. Optical Sensor Scope (Top Periscope Eye) ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(0, -13, 9, 6);
  ctx.fillRect(1, -14, 7, 8);

  // Scope Armored Hood
  ctx.fillStyle = cMid;
  ctx.fillRect(1, -13, 7, 5);
  ctx.fillStyle = cHigh;
  ctx.fillRect(1, -13, 7, 1);

  // 16-bit Cyan Objective Sensor Lens
  ctx.fillStyle = '#082F49'; // Dark ocular rim
  ctx.fillRect(4, -12, 4, 4);
  ctx.fillStyle = '#0284C7'; // Deep optical glass
  ctx.fillRect(4, -12, 3, 3);
  ctx.fillStyle = '#06B6D4'; // Bright cyan glow
  ctx.fillRect(5, -12, 2, 2);
  ctx.fillStyle = '#FFFFFF'; // White specular glint pip
  ctx.fillRect(5, -12, 1, 1);

  // ── 3. Single Heavy Barrel Assembly ──
  // Breech / Forward Receiver Collar
  ctx.fillStyle = cOutline;
  ctx.fillRect(11, -6, 6, 12);
  ctx.fillStyle = cMid;
  ctx.fillRect(12, -5, 4, 10);
  ctx.fillStyle = cHigh;
  ctx.fillRect(12, -5, 4, 2);

  // Heavy Fluted Steel Barrel (x = 16 to 28, y = -3 to 3)
  ctx.fillStyle = cOutline;
  ctx.fillRect(16, -4, 12, 8);
  // Underside Shadow Flute
  ctx.fillStyle = cDark;
  ctx.fillRect(16, -3, 12, 6);
  // Center Gunmetal Barrel Core
  ctx.fillStyle = cMid;
  ctx.fillRect(16, -2, 12, 4);
  // Longitudinal Top Highlight Flute
  ctx.fillStyle = cHigh;
  ctx.fillRect(16, -2, 12, 1);
  ctx.fillStyle = cSpecular;
  ctx.fillRect(17, -2, 4, 1);

  // Anodized RED Clamp Band with Brass Screw (x = 22 to 25)
  ctx.fillStyle = cOutline;
  ctx.fillRect(22, -5, 4, 10);
  ctx.fillStyle = isHit ? '#FFFFFF' : '#991B1B';
  ctx.fillRect(23, -4, 2, 8);
  ctx.fillStyle = isHit ? '#FFFFFF' : '#DC2626';
  ctx.fillRect(23, -3, 2, 6);
  ctx.fillStyle = isHit ? '#FFFFFF' : '#EF4444';
  ctx.fillRect(23, -4, 2, 1);
  // Brass Hex Bolt Pin
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(23, -1, 1, 2);

  // Heavy Slotted Muzzle Brake (x = 28 to 32)
  ctx.fillStyle = cOutline;
  ctx.fillRect(28, -5, 4, 10);
  ctx.fillStyle = cMid;
  ctx.fillRect(28, -4, 3, 8);
  ctx.fillStyle = cHigh;
  ctx.fillRect(28, -4, 3, 1);
  // Lateral Gas Port Vents
  ctx.fillStyle = cOutline;
  ctx.fillRect(29, -3, 1, 6);
  // Recessed Dark Muzzle Bore
  ctx.fillStyle = '#05070A';
  ctx.fillRect(31, -2, 1, 4);
}

/**
 * Draws a curved segmented ammo feed chute in 16-bit pixel art.
 */
function _drawSegmentedAmmoChute(ctx, fromX, fromY, toX, toY, isHit) {
  const steps = 6;
  const cOutline = '#0B0D12';
  const cSteel = isHit ? '#CBD5E1' : '#334155';
  const cSteelHigh = isHit ? '#FFFFFF' : '#64748B';
  const cBrassTip = isHit ? '#FFFFFF' : '#FEF08A';
  const cBrass = isHit ? '#FEF08A' : '#F59E0B';
  const cBronze = '#B45309';

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const curveY = Math.sin(t * Math.PI) * (toY > 0 ? 6 : -6);
    const px = Math.round(fromX + (toX - fromX) * t);
    const py = Math.round(fromY + (toY - fromY) * t + curveY);

    // Segment Link Outer Shell (Beveled 5x6 block)
    ctx.fillStyle = cOutline;
    ctx.fillRect(px - 3, py - 3, 6, 6);

    // Steel Link Body
    ctx.fillStyle = cSteel;
    ctx.fillRect(px - 2, py - 2, 4, 4);
    ctx.fillStyle = cSteelHigh;
    ctx.fillRect(px - 2, py - 2, 4, 1);

    // Peeking Machined Brass Cartridge
    ctx.fillStyle = cBronze;
    ctx.fillRect(px - 1, py - 1, 3, 2);
    ctx.fillStyle = cBrass;
    ctx.fillRect(px - 1, py - 1, 2, 2);
    ctx.fillStyle = cBrassTip;
    ctx.fillRect(px, py - 1, 1, 1);

    // Hinge Pivot Pin
    ctx.fillStyle = cOutline;
    ctx.fillRect(px - 2, py, 1, 1);
  }
}

/**
 * Draws a 6-barrel rotary Gatling minigun cluster in 16-bit stepped pixel art.
 */
function _drawGatlingMinigunCluster(ctx, x, y, isHit) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  const cOutline = '#0B0D12';
  const cSpecular = isHit ? '#FFFFFF' : '#CBD5E1';
  const cHigh = isHit ? '#E2E8F0' : '#64748B';
  const cMid = isHit ? '#CBD5E1' : '#334155';
  const cDark = isHit ? '#94A3B8' : '#1E293B';

  // ── 1. Armored Receiver Housing (x = -4 to 6, y = -6 to 6) ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(-5, -6, 12, 12);
  ctx.fillRect(-4, -7, 10, 14);

  ctx.fillStyle = cDark;
  ctx.fillRect(-4, -6, 10, 12);
  ctx.fillStyle = cMid;
  ctx.fillRect(-4, -5, 9, 10);
  ctx.fillStyle = cHigh;
  ctx.fillRect(-4, -5, 9, 2);
  ctx.fillStyle = cSpecular;
  ctx.fillRect(-4, -5, 4, 1);

  // Ventilation Louvers
  ctx.fillStyle = cOutline;
  ctx.fillRect(-2, -2, 5, 1);
  ctx.fillRect(-2, 1, 5, 1);

  // ── 2. Cylindrical Rotor Drive Motor Housing (x = 6 to 11, y = -5 to 5) ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(6, -6, 6, 12);
  ctx.fillStyle = cDark;
  ctx.fillRect(6, -5, 5, 10);
  ctx.fillStyle = cMid;
  ctx.fillRect(7, -4, 4, 8);
  ctx.fillStyle = cHigh;
  ctx.fillRect(7, -4, 4, 1);

  // Drive Pulley Belt Notch
  ctx.fillStyle = cOutline;
  ctx.fillRect(9, -5, 1, 10);

  // ── 3. 6-Barrel Rotary Minigun Cluster (Barrels at y = -4, -1, 2) ──
  const barrelYs = [-4, -1, 2];
  for (let b = 0; b < barrelYs.length; b++) {
    const by = barrelYs[b];
    // Barrel Tube Outer Outline
    ctx.fillStyle = cOutline;
    ctx.fillRect(11, by - 1, 18, 4);

    // Barrel 16-bit Shading
    ctx.fillStyle = cDark;
    ctx.fillRect(11, by, 17, 3);
    ctx.fillStyle = cMid;
    ctx.fillRect(11, by, 17, 2);
    ctx.fillStyle = cHigh;
    ctx.fillRect(11, by, 16, 1);

    if (b === 0) {
      // Top Barrel Specular Line
      ctx.fillStyle = cSpecular;
      ctx.fillRect(13, by, 8, 1);
    }
  }

  // ── 4. Forward Barrel Retention Collar Ring (x = 20 to 23, y = -6 to 6) ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(20, -6, 4, 12);
  ctx.fillStyle = cDark;
  ctx.fillRect(21, -5, 2, 10);
  ctx.fillStyle = cMid;
  ctx.fillRect(21, -4, 2, 8);
  ctx.fillStyle = cSpecular;
  ctx.fillRect(21, -5, 2, 1);

  // Clamping Hex Pins
  ctx.fillStyle = cSpecular;
  ctx.fillRect(21, -3, 1, 1);
  ctx.fillRect(21, 2, 1, 1);

  // ── 5. Muzzle Crown Ring & Recessed Dark Bores (x = 27 to 30) ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(27, -5, 3, 10);
  ctx.fillStyle = cDark;
  ctx.fillRect(27, -4, 2, 8);
  ctx.fillStyle = cHigh;
  ctx.fillRect(27, -4, 2, 1);

  // Recessed Dark Barrel Muzzle Bores
  ctx.fillStyle = '#05070A';
  ctx.fillRect(29, -4, 1, 2);
  ctx.fillRect(29, -1, 1, 2);
  ctx.fillRect(29, 2, 1, 2);

  // Center Axis Spindle Pin
  ctx.fillStyle = cSpecular;
  ctx.fillRect(28, 0, 1, 1);

  ctx.restore();
}

/**
 * Draws Level 2 Twin Gatling Miniguns with dual looping ammo feed chutes in 16-bit pixel art.
 */
function _drawTurretLevel2Head(ctx, isHit) {
  _drawTurretAmmoDrum(ctx, 2, isHit);

  const cOutline = '#0B0D12';
  const cSpecular = isHit ? '#FFFFFF' : '#CBD5E1';
  const cHigh = isHit ? '#E2E8F0' : '#64748B';
  const cMid = isHit ? '#CBD5E1' : '#334155';
  const cDark = isHit ? '#94A3B8' : '#1E293B';

  // ── 1. Heavy Cast Steel Yoke Crossbar (x = -3 to 6, y = -17 to 17) ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(-3, -17, 9, 34);

  // Crossbar 16-bit Shading
  ctx.fillStyle = cDark;
  ctx.fillRect(-2, -16, 7, 32);
  ctx.fillStyle = cMid;
  ctx.fillRect(-2, -15, 6, 30);
  ctx.fillStyle = cHigh;
  ctx.fillRect(-2, -15, 6, 2); // Top bevel
  ctx.fillRect(-2, 13, 6, 2);  // Bottom bevel
  ctx.fillStyle = cSpecular;
  ctx.fillRect(-1, -15, 4, 1);

  // Structural Reinforcement Gusset Bolts
  ctx.fillStyle = cSpecular;
  ctx.fillRect(0, -11, 1, 1);
  ctx.fillRect(0, 10, 1, 1);
  ctx.fillStyle = cOutline;
  ctx.fillRect(0, -10, 1, 1);
  ctx.fillRect(0, 11, 1, 1);

  // ── 2. Center Armored Swivel Core & Optical Sensor Scope ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(-5, -8, 16, 16);
  ctx.fillStyle = cDark;
  ctx.fillRect(-4, -7, 14, 14);
  ctx.fillStyle = cMid;
  ctx.fillRect(-4, -6, 12, 12);
  ctx.fillStyle = cHigh;
  ctx.fillRect(-4, -6, 12, 2);

  // Cyan Optical Sensor Scope (Dual Lenses)
  ctx.fillStyle = cOutline;
  ctx.fillRect(1, -12, 8, 5);
  ctx.fillStyle = '#082F49';
  ctx.fillRect(2, -11, 6, 3);
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(2, -11, 5, 3);
  ctx.fillStyle = '#06B6D4';
  ctx.fillRect(3, -11, 4, 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(3, -11, 1, 1);
  ctx.fillRect(6, -11, 1, 1);

  // ── 3. Dual 16-bit Segmented Looping Ammo Belts ──
  _drawSegmentedAmmoChute(ctx, -14, -8, 2, -13, isHit);
  _drawSegmentedAmmoChute(ctx, -14, 8, 2, 13, isHit);

  // ── 4. Top & Bottom Rotary Gatling Minigun Clusters ──
  _drawGatlingMinigunCluster(ctx, 6, -13, isHit);
  _drawGatlingMinigunCluster(ctx, 6, 13, isHit);
}

/**
 * Draws Level 3 Twin Gatlings + Top-Mounted RED Quad Rocket Launcher Pod in 16-bit pixel art.
 */
function _drawTurretLevel3Head(ctx, isHit) {
  // Base Twin Gatlings & Looping Ammo Chutes
  _drawTurretLevel2Head(ctx, isHit);

  const cOutline = '#0B0D12';
  const cSpecular = isHit ? '#FFFFFF' : '#CBD5E1';
  const cHigh = isHit ? '#E2E8F0' : '#64748B';
  const cMid = isHit ? '#CBD5E1' : '#334155';
  const cDark = isHit ? '#94A3B8' : '#1E293B';

  const cRedGlint = isHit ? '#FFFFFF' : '#FCA5A5';
  const cRedHigh = isHit ? '#FFFFFF' : '#EF4444';
  const cRedMid = isHit ? '#E2E8F0' : '#DC2626';
  const cRedDark = isHit ? '#CBD5E1' : '#991B1B';
  const cRedDeep = isHit ? '#94A3B8' : '#450A0A';

  // ── 1. Articulated Vertical Rocket Support Pylon (x = -4 to 3, y = -23 to -11) ──
  ctx.fillStyle = cOutline;
  ctx.fillRect(-4, -23, 8, 13);
  ctx.fillStyle = cDark;
  ctx.fillRect(-3, -22, 6, 11);
  ctx.fillStyle = cMid;
  ctx.fillRect(-3, -21, 4, 9);
  ctx.fillStyle = cHigh;
  ctx.fillRect(-3, -21, 2, 9);

  // Polished Chrome Hydraulic Lift Cylinder
  ctx.fillStyle = isHit ? '#FFFFFF' : '#F8FAFC';
  ctx.fillRect(0, -21, 1, 8);
  ctx.fillStyle = cSpecular;
  ctx.fillRect(1, -21, 1, 8);

  // ── 2. RED Quad Rocket Launcher Pod Box (x = -6 to 22, y = -35 to -21) ──
  const podX = -6;
  const podY = -35;
  const podW = 28;
  const podH = 15;

  // Stepped Black Ink Outline Shell (Corner cuts)
  ctx.fillStyle = cOutline;
  ctx.fillRect(podX, podY - 1, podW, podH + 2);
  ctx.fillRect(podX - 1, podY, podW + 2, podH);

  // Crimson Enamel Shading Ramp
  ctx.fillStyle = cRedDeep;
  ctx.fillRect(podX, podY, podW, podH);
  ctx.fillStyle = cRedDark;
  ctx.fillRect(podX + 1, podY, podW - 1, podH);
  ctx.fillStyle = cRedMid;
  ctx.fillRect(podX + 1, podY + 1, podW - 2, podH - 2);

  // Top Armored Rim Specular Highlight
  ctx.fillStyle = cRedHigh;
  ctx.fillRect(podX + 1, podY + 1, podW - 2, 2);
  ctx.fillStyle = cRedGlint;
  ctx.fillRect(podX + 2, podY + 1, 8, 1);

  // ── 3. 16-bit 45° Diagonal Industrial Hazard Warning Stripes (Top Fascia) ──
  // Fascia from podX + 2 to podX + 14, y = podY + 3 to podY + 6 (height 4px)
  for (let hx = podX + 2; hx <= podX + 14; hx++) {
    for (let hy = podY + 3; hy <= podY + 6; hy++) {
      const isYellow = ((hx - hy) % 4 + 4) % 4 < 2;
      ctx.fillStyle = isYellow ? '#FACC15' : '#0F172A';
      ctx.fillRect(hx, hy, 1, 1);
    }
  }

  // ── 4. 2x2 Grid of 4 Rocket Launch Tubes (Tubes at x = 11, 18 and y = -31, -25) ──
  const tubeXs = [11, 18];
  const tubeYs = [-31, -25];
  for (let tx of tubeXs) {
    for (let ty of tubeYs) {
      // Stepped Octagonal Tube Bezel Rim (6x6 pixels, corner cuts)
      ctx.fillStyle = cOutline;
      ctx.fillRect(tx - 3, ty - 2, 6, 4);
      ctx.fillRect(tx - 2, ty - 3, 4, 6);

      // Bevel Shading (Top-Left Highlight, Bottom-Right Shadow)
      ctx.fillStyle = cDark;
      ctx.fillRect(tx - 2, ty - 2, 4, 4);
      ctx.fillStyle = cHigh;
      ctx.fillRect(tx - 2, ty - 2, 3, 1);
      ctx.fillRect(tx - 2, ty - 2, 1, 3);
      ctx.fillStyle = cSpecular;
      ctx.fillRect(tx - 2, ty - 2, 1, 1);

      // Deep Dark Recessed Tube Interior (3x3 pixels)
      ctx.fillStyle = '#05070A';
      ctx.fillRect(tx - 1, ty - 1, 3, 3);

      // Armed 70mm Rocket Warhead Inside
      // Red Ogive Warhead Nose Cone
      ctx.fillStyle = isHit ? '#FFFFFF' : '#DC2626';
      ctx.fillRect(tx, ty, 2, 2);
      ctx.fillStyle = isHit ? '#FFFFFF' : '#EF4444';
      ctx.fillRect(tx, ty, 1, 1);

      // Machined Brass Detonator Fuse Point
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(tx, ty, 1, 1);
    }
  }

  // ── 5. Armored Flexible Braided Cable Conduits ──
  ctx.fillStyle = '#C2410C';
  ctx.fillRect(-2, -21, 2, 8);
  ctx.fillStyle = '#EA580C';
  ctx.fillRect(-2, -21, 1, 8);
  ctx.fillStyle = '#9A3412';
  ctx.fillRect(-4, -19, 2, 6);
  ctx.fillStyle = '#C2410C';
  ctx.fillRect(-4, -19, 1, 6);
  ctx.fillStyle = cOutline;
  ctx.fillRect(-3, -15, 3, 1); // Clamp band
}

/**
 * Draws the Sentry Turret (Lv 1, Lv 2, Lv 3) in authentic 16-bit pixel art (Saitama tech).
 */
export function drawTurret(ctx, turret) {
  const { x, y, r, gunAngle, isBuilding, buildProgress, owner, level = 1 } = turret;

  let zOffset = turret.z || 0;
  if (isBuilding) {
    const engineer = state.fighters && state.fighters[owner];
    if (engineer && engineer.z) {
      zOffset = engineer.z;
    }
  }

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - zOffset));

  const bp = (isBuilding && buildProgress !== undefined) ? buildProgress : 1;
  const s = r / 20;
  ctx.scale(s, s);

  const isHit = turret.hitFlashTimer > 0;

  // ═══════════════════════════════════════════
  // 1. CONSTRUCTION PHASE (16-bit Blueprint Scaffolding & Welding Sparks)
  // ═══════════════════════════════════════════
  if (isBuilding && bp < 1 && !turret._isSilhouettePass) {
    const now = Date.now();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.28)';
    ctx.fillRect(-22, -22, 44, 44);

    _drawCachedEngineerBlueprintGrid(ctx, false);

    for (let i = 0; i < 6; i++) {
      const a = (now * 0.01 + i * 1.05) % (Math.PI * 2);
      const dist = 6 + (now * 0.05 + i * 5) % 20;
      ctx.fillStyle = (i % 2 === 0) ? '#FFFFFF' : '#FACC15';
      ctx.fillRect(Math.round(Math.cos(a) * dist), Math.round(Math.sin(a) * dist), 2, 2);
    }
  }

  // ═══════════════════════════════════════════
  // 2. TRIPOD BASE (Anchored in World Orientation)
  // ═══════════════════════════════════════════
  _drawTurretTripodBase(ctx, level, isHit);

  // ═══════════════════════════════════════════
  // 3. ROTATING TURRET SWIVEL HEAD (Gun Angle)
  // ═══════════════════════════════════════════
  const angle = (gunAngle !== undefined) ? gunAngle : (turret.angle || 0);
  ctx.rotate(angle);

  const recoilTimer = turret.recoilTimer || 0;
  const recoilOff = (recoilTimer > 0) ? -Math.round((recoilTimer / 10) * 5) : 0;
  ctx.translate(recoilOff, 0);

  // Red Targeting Laser Beam (16-bit Pixel Beam & Reticle)
  if (!turret._isSilhouettePass) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.fillRect(14, 0, 100, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(114, -1, 3, 3); // Reticle point
    ctx.fillRect(115, -2, 1, 5); // Crosshair vertical
    ctx.fillRect(113, 0, 5, 1);  // Crosshair horizontal
  }

  // Level-specific Swivel Head
  if (level === 1) {
    _drawTurretLevel1Head(ctx, isHit);
  } else if (level === 2) {
    _drawTurretLevel2Head(ctx, isHit);
  } else {
    _drawTurretLevel3Head(ctx, isHit);
  }

  // Muzzle Blast when firing
  if (recoilTimer > 0 && !turret._isSilhouettePass) {
    if (level === 1) {
      drawEngineerMuzzleBlast(ctx, 32, 0, 0.2);
    } else if (level === 2) {
      drawEngineerMuzzleBlast(ctx, 36, -13, 0.2);
      drawEngineerMuzzleBlast(ctx, 36, 13, 0.2);
    } else {
      drawEngineerMuzzleBlast(ctx, 36, -13, 0.2);
      drawEngineerMuzzleBlast(ctx, 36, 13, 0.2);
    }
  }

  ctx.restore();
}

/**
 * Draws the 16-bit pixel stencil "RED" logo on the Dispenser hopper.
 */
function _drawPixelRedStencil(ctx, cx, cy, color = '#FEF2F2', shadowColor = '#450A0A') {
  const drawGlyph = (pixels, ox, oy) => {
    for (let i = 0; i < pixels.length; i += 2) {
      const px = ox + pixels[i];
      const py = oy + pixels[i + 1];
      if (shadowColor) {
        ctx.fillStyle = shadowColor;
        ctx.fillRect(px, py + 1, 1, 1);
      }
      ctx.fillStyle = color;
      ctx.fillRect(px, py, 1, 1);
    }
  };

  // 'R' (4x5) at cx - 6
  const rPixels = [
    0,0, 1,0, 2,0, 3,0,
    0,1,           3,1,
    0,2, 1,2, 2,2, 3,2,
    0,3,      2,3,
    0,4,           3,4
  ];
  // 'E' (4x5) at cx - 1
  const ePixels = [
    0,0, 1,0, 2,0, 3,0,
    0,1,
    0,2, 1,2, 2,2,
    0,3,
    0,4, 1,4, 2,4, 3,4
  ];
  // 'D' (4x5) at cx + 4
  const dPixels = [
    0,0, 1,0, 2,0,
    0,1,           3,1,
    0,2,           3,2,
    0,3,           3,3,
    0,4, 1,4, 2,4
  ];

  drawGlyph(rPixels, cx - 6, cy - 2);
  drawGlyph(ePixels, cx - 1, cy - 2);
  drawGlyph(dPixels, cx + 4, cy - 2);
}

/**
 * Draws the 16-bit micro-pixel "PROVISIONS" typography on the backlit marquee sign.
 */
function _drawPixelProvisions(ctx, cx, cy, color = '#DC2626') {
  const drawGlyph = (pixels, ox, oy) => {
    ctx.fillStyle = color;
    for (let i = 0; i < pixels.length; i += 2) {
      ctx.fillRect(ox + pixels[i], oy + pixels[i + 1], 1, 1);
    }
  };

  // 10 letters centered around cx:
  // P (-17), R (-13), O (-9), V (-5), I (-1), S (1), I (5), O (7), N (11), S (15)
  // Height 5 (-2 to +2 relative to cy)

  // P (3x5) at cx - 17
  drawGlyph([
    0,0, 1,0,
    0,1,      2,1,
    0,2, 1,2,
    0,3,
    0,4
  ], cx - 17, cy - 2);

  // R (3x5) at cx - 13
  drawGlyph([
    0,0, 1,0,
    0,1,      2,1,
    0,2, 1,2,
    0,3,      2,3,
    0,4,      2,4
  ], cx - 13, cy - 2);

  // O (3x5) at cx - 9
  drawGlyph([
    0,0, 1,0, 2,0,
    0,1,      2,1,
    0,2,      2,2,
    0,3,      2,3,
    0,4, 1,4, 2,4
  ], cx - 9, cy - 2);

  // V (3x5) at cx - 5
  drawGlyph([
    0,0,      2,0,
    0,1,      2,1,
    0,2,      2,2,
    0,3,      2,3,
         1,4
  ], cx - 5, cy - 2);

  // I (1x5) at cx - 1
  drawGlyph([
    0,0,
    0,1,
    0,2,
    0,3,
    0,4
  ], cx - 1, cy - 2);

  // S (3x5) at cx + 1
  drawGlyph([
    0,0, 1,0, 2,0,
    0,1,
    0,2, 1,2, 2,2,
              2,3,
    0,4, 1,4, 2,4
  ], cx + 1, cy - 2);

  // I (1x5) at cx + 5
  drawGlyph([
    0,0,
    0,1,
    0,2,
    0,3,
    0,4
  ], cx + 5, cy - 2);

  // O (3x5) at cx + 7
  drawGlyph([
    0,0, 1,0, 2,0,
    0,1,      2,1,
    0,2,      2,2,
    0,3,      2,3,
    0,4, 1,4, 2,4
  ], cx + 7, cy - 2);

  // N (3x5) at cx + 11
  drawGlyph([
    0,0,      2,0,
    0,1, 1,1, 2,1,
    0,2,      2,2,
    0,3,      2,3,
    0,4,      2,4
  ], cx + 11, cy - 2);

  // S (3x5) at cx + 15
  drawGlyph([
    0,0, 1,0, 2,0,
    0,1,
    0,2, 1,2, 2,2,
              2,3,
    0,4, 1,4, 2,4
  ], cx + 15, cy - 2);
}

/**
 * Draws the TF2 RED Dispenser Cabinet in authentic 16-bit pixel art (Saitama tech).
 */
export function drawDispenser(ctx, dispenser) {
  const { x, y, r, hp = 100, maxHp = 160, isBuilding, buildProgress } = dispenser;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  const isHit = dispenser.hitFlashTimer > 0;
  const s = r / 20;
  ctx.scale(s, s);

  // 16-bit Universal Palette
  const cOutline = '#0B0D12';
  const cSpecular = isHit ? '#FFFFFF' : '#CBD5E1';
  const cHigh = isHit ? '#E2E8F0' : '#64748B';
  const cMid = isHit ? '#CBD5E1' : '#334155';
  const cDark = isHit ? '#94A3B8' : '#1E293B';
  const cDeep = '#0F172A';

  const cRedGlint = isHit ? '#FFFFFF' : '#FCA5A5';
  const cRedHigh = isHit ? '#FFFFFF' : '#EF4444';
  const cRedMid = isHit ? '#E2E8F0' : '#DC2626';
  const cRedDark = isHit ? '#CBD5E1' : '#991B1B';
  const cRedDeep = isHit ? '#94A3B8' : '#450A0A';

  // ═══════════════════════════════════════════
  // 1. CONSTRUCTION PHASE (16-bit Blueprint Wireframe & Welding Sparks)
  // ═══════════════════════════════════════════
  const bp = (isBuilding && buildProgress !== undefined) ? buildProgress : 1;
  if (isBuilding && bp < 1 && !dispenser._isSilhouettePass) {
    const now = Date.now();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.28)';
    ctx.fillRect(-22, -34, 44, 60);

    _drawCachedEngineerBlueprintGrid(ctx, true);

    // Dynamic Welding Sparks
    for (let i = 0; i < 6; i++) {
      const a = (now * 0.01 + i * 1.05) % (Math.PI * 2);
      const dist = 6 + (now * 0.05 + i * 5) % 20;
      ctx.fillStyle = (i % 2 === 0) ? '#FFFFFF' : '#FACC15';
      ctx.fillRect(Math.round(Math.cos(a) * dist), Math.round(Math.sin(a) * dist), 2, 2);
    }
  }

  // ═══════════════════════════════════════════
  // 2. BASE MOUNTING FEET & FLOOR PLATE (Y: [18, 27])
  // ═══════════════════════════════════════════
  // Stepped Outline
  ctx.fillStyle = cOutline;
  ctx.fillRect(-21, 18, 42, 9);
  ctx.fillRect(-22, 19, 44, 7);

  // Cast Steel Base Plate
  ctx.fillStyle = cDark;
  ctx.fillRect(-20, 19, 40, 7);
  ctx.fillStyle = cMid;
  ctx.fillRect(-19, 19, 38, 5);
  ctx.fillStyle = cHigh;
  ctx.fillRect(-18, 19, 36, 1);

  // 16-bit Diamond-Plate Tread Texture (Subtle Dithered Pixel Pattern)
  ctx.fillStyle = cHigh;
  for (let tx = -16; tx <= 16; tx += 4) {
    ctx.fillRect(tx, 21, 1, 1);
    ctx.fillRect(tx + 2, 22, 1, 1);
  }

  // Anti-slip Rubber Feet (Left & Right)
  ctx.fillStyle = cOutline;
  ctx.fillRect(-20, 25, 9, 3);
  ctx.fillRect(11, 25, 9, 3);
  ctx.fillStyle = '#06080C';
  ctx.fillRect(-19, 26, 7, 2);
  ctx.fillRect(12, 26, 7, 2);

  // ═══════════════════════════════════════════
  // 3. BOTTOM SCRAP & AMMO HOPPER BIN (Y: [6, 19])
  // ═══════════════════════════════════════════
  // Stepped Outline
  ctx.fillStyle = cOutline;
  ctx.fillRect(-19, 5, 38, 15);
  ctx.fillRect(-18, 4, 36, 17);

  // Crimson Bin Shading Ramp
  ctx.fillStyle = cRedDeep;
  ctx.fillRect(-18, 5, 36, 14);
  ctx.fillStyle = cRedDark;
  ctx.fillRect(-17, 6, 34, 13);
  ctx.fillStyle = cRedMid;
  ctx.fillRect(-16, 7, 32, 11);
  ctx.fillStyle = cRedHigh;
  ctx.fillRect(-16, 7, 32, 1);

  // Open Scrap Compartment Cavity (Recessed dark cavity)
  ctx.fillStyle = cOutline;
  ctx.fillRect(-15, 6, 30, 5);
  ctx.fillStyle = cDeep;
  ctx.fillRect(-14, 7, 28, 4);

  // 16-bit Pipe Wrench (Hook Jaw, Brass Knurl, Dipped Red Handle)
  // Silver Jaws
  ctx.fillStyle = cSpecular;
  ctx.fillRect(-13, 7, 2, 3);
  ctx.fillRect(-11, 7, 2, 1);
  ctx.fillStyle = cHigh;
  ctx.fillRect(-12, 8, 2, 1);
  // Brass Adjustment Knurl
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(-9, 7, 1, 2);
  // Red Dipped Handle
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(-8, 8, 5, 2);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-8, 8, 5, 1);

  // Metal Scrap Hex Nut
  ctx.fillStyle = cHigh;
  ctx.fillRect(-1, 8, 3, 3);
  ctx.fillStyle = cOutline;
  ctx.fillRect(0, 9, 1, 1);

  // 12-Gauge Shotgun Shells (Brass Heads, Red Plastic Hulls)
  // Shell 1
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(3, 8, 2, 2);
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(3, 8, 1, 1);
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(5, 8, 3, 2);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(5, 8, 3, 1);
  // Shell 2
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(9, 8, 2, 2);
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(9, 8, 1, 1);
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(11, 8, 3, 2);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(11, 8, 3, 1);

  // 16-bit Hand-Crafted Stencil "RED" Logo
  _drawPixelRedStencil(ctx, 0, 14, isHit ? '#FFFFFF' : '#FEF2F2', cRedDeep);

  // ═══════════════════════════════════════════
  // 4. MIDDLE DISPENSING SHELF & MEDICAL BAY (Y: [-8, 6])
  // ═══════════════════════════════════════════
  ctx.fillStyle = cOutline;
  ctx.fillRect(-19, -9, 38, 16);
  ctx.fillRect(-18, -10, 36, 18);

  ctx.fillStyle = cRedDeep;
  ctx.fillRect(-18, -8, 36, 14);
  ctx.fillStyle = cRedMid;
  ctx.fillRect(-17, -8, 34, 14);

  // Recessed Stainless Steel Dispensing Bay
  ctx.fillStyle = cOutline;
  ctx.fillRect(-16, -6, 32, 11);
  ctx.fillStyle = cDeep;
  ctx.fillRect(-15, -5, 30, 9);
  ctx.fillStyle = cDark;
  ctx.fillRect(-14, -4, 28, 8);

  // Pull-Out Stainless Steel Tray with Bevel
  ctx.fillStyle = cMid;
  ctx.fillRect(-13, 0, 26, 4);
  ctx.fillStyle = cSpecular;
  ctx.fillRect(-12, 0, 24, 1);

  // 16-bit Medical Vials & Syringe
  // Cyan Health Serum Ampoule
  ctx.fillStyle = '#082F49';
  ctx.fillRect(-9, -4, 4, 5);
  ctx.fillStyle = '#06B6D4';
  ctx.fillRect(-8, -3, 2, 4);
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(-8, -3, 1, 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-8, -4, 1, 1); // Glass neck reflection

  // Precision Glass Syringe
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(-4, -5, 2, 6);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-4, -5, 1, 5);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(-4, -2, 2, 1); // Measurement tick mark
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(-3, 0, 1, 2);  // Steel plunger rod

  // Emerald Green Antidote Bottle
  ctx.fillStyle = '#064E3B';
  ctx.fillRect(1, -4, 4, 5);
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(2, -3, 2, 4);
  ctx.fillStyle = '#86EFAC';
  ctx.fillRect(2, -3, 1, 2);
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(2, -5, 2, 1); // Silver cap

  // Glowing Emergency Red Push Button (Left Panel)
  ctx.fillStyle = cOutline;
  ctx.fillRect(-14, -4, 4, 4);
  ctx.fillStyle = '#991B1B';
  ctx.fillRect(-13, -3, 3, 3);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-13, -3, 2, 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-13, -3, 1, 1);

  // ═══════════════════════════════════════════
  // 5. LEFT HEALING GAS CYLINDER & DIAL GAUGE (X: [-26, -17])
  // ═══════════════════════════════════════════
  // 16-bit Rounded Dome Cap & Cylinder (Stepped concentric rows)
  ctx.fillStyle = cOutline;
  ctx.fillRect(-24, -20, 5, 2);
  ctx.fillRect(-25, -19, 7, 2);
  ctx.fillRect(-26, -18, 8, 2);
  ctx.fillRect(-27, -17, 10, 32);

  // Cylinder Shading Ramp
  // Deep rust-orange shadow on left/back
  ctx.fillStyle = isHit ? '#CBD5E1' : '#7C2D12';
  ctx.fillRect(-26, -16, 8, 29);
  // Saturated orange body
  ctx.fillStyle = isHit ? '#E2E8F0' : '#EA580C';
  ctx.fillRect(-25, -16, 6, 29);
  // Specular highlight column
  ctx.fillStyle = isHit ? '#FFFFFF' : '#FB923C';
  ctx.fillRect(-24, -16, 2, 28);
  ctx.fillStyle = isHit ? '#FFFFFF' : '#FDBA74';
  ctx.fillRect(-24, -15, 1, 26);

  // Rounded Dome Top Shading
  ctx.fillStyle = isHit ? '#FFFFFF' : '#EA580C';
  ctx.fillRect(-23, -19, 3, 2);
  ctx.fillRect(-24, -18, 5, 2);
  ctx.fillStyle = isHit ? '#FFFFFF' : '#FDBA74';
  ctx.fillRect(-23, -19, 1, 2);
  ctx.fillRect(-23, -18, 2, 1);

  // Steel Mounting Bands with Rivet Studs
  for (let bY of [-8, 4]) {
    ctx.fillStyle = cOutline;
    ctx.fillRect(-27, bY - 1, 10, 4);
    ctx.fillStyle = cDark;
    ctx.fillRect(-26, bY, 8, 2);
    ctx.fillStyle = cHigh;
    ctx.fillRect(-26, bY, 8, 1);
    ctx.fillStyle = cSpecular;
    ctx.fillRect(-25, bY, 1, 1);
    ctx.fillRect(-20, bY, 1, 1);
  }

  // 16-bit Red Medical Cross Badge on Cylinder
  ctx.fillStyle = cOutline;
  ctx.fillRect(-25, 6, 7, 7);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-24, 7, 5, 5);
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(-22, 7, 1, 5);
  ctx.fillRect(-24, 9, 5, 1);

  // Brass Bottom Valve Wheel
  ctx.fillStyle = cOutline;
  ctx.fillRect(-25, 14, 6, 4);
  ctx.fillStyle = '#B45309';
  ctx.fillRect(-24, 15, 4, 2);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(-24, 15, 3, 1);

  // Circular Dial Pressure Gauge (Top Left, x = [-26, -18], y = [-26, -18])
  ctx.fillStyle = cOutline;
  ctx.fillRect(-26, -26, 9, 9);
  ctx.fillRect(-25, -27, 7, 11);
  ctx.fillStyle = cDark;
  ctx.fillRect(-25, -26, 7, 7);
  ctx.fillStyle = cHigh;
  ctx.fillRect(-25, -26, 7, 1);

  // White Dial Face
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-24, -25, 5, 5);
  // Safe / Danger Arc Ticks
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(-21, -25, 2, 1); // Green safe sector
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-24, -25, 1, 2); // Red danger sector
  // Pointer Needle (Ticking upward-right)
  ctx.fillStyle = cOutline;
  ctx.fillRect(-23, -23, 2, 1);
  ctx.fillRect(-22, -24, 1, 1);

  // ═══════════════════════════════════════════
  // 6. RIGHT FLEXIBLE SUPPLY CONDUIT (X: [17, 24])
  // ═══════════════════════════════════════════
  ctx.fillStyle = cOutline;
  ctx.fillRect(17, -18, 7, 33);
  ctx.fillStyle = cDark;
  ctx.fillRect(18, -17, 5, 31);

  // Corrugated Bellows Ribs with Metallic Highlights
  for (let rY = -16; rY <= 11; rY += 3) {
    ctx.fillStyle = cHigh;
    ctx.fillRect(18, rY, 5, 1);
    ctx.fillStyle = cSpecular;
    ctx.fillRect(19, rY, 2, 1);
    ctx.fillStyle = cOutline;
    ctx.fillRect(18, rY + 1, 5, 1);
  }

  // ═══════════════════════════════════════════
  // 7. CRT PROVISIONS MONITOR & SPEEDOMETER GAUGE (Y: [-25, -9])
  // ═══════════════════════════════════════════
  // Monitor Outer Shell (Corner cuts)
  ctx.fillStyle = cOutline;
  ctx.fillRect(-19, -25, 38, 17);
  ctx.fillRect(-18, -26, 36, 19);

  ctx.fillStyle = cRedDeep;
  ctx.fillRect(-18, -24, 36, 15);
  ctx.fillStyle = cRedDark;
  ctx.fillRect(-17, -24, 34, 14);

  // 16-bit Curved CRT Screen Bezel (Stepped rounded corners)
  ctx.fillStyle = cOutline;
  ctx.fillRect(-16, -23, 32, 14);
  ctx.fillRect(-15, -24, 30, 16);

  // Deep CRT Phosphor Screen (x = -14 to 14, y = -22 to -11)
  ctx.fillStyle = '#2A0808';
  ctx.fillRect(-14, -22, 28, 12);

  // Glowing Speedometer Dome Sectors
  // Left Red Zone (Low HP / Empty)
  ctx.fillStyle = '#991B1B';
  ctx.fillRect(-11, -19, 7, 7);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-10, -18, 5, 5);

  // Center Amber Zone (Half HP)
  ctx.fillStyle = '#B45309';
  ctx.fillRect(-4, -21, 8, 9);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(-3, -20, 6, 7);

  // Right Green Zone (Full HP / Ready)
  ctx.fillStyle = '#166534';
  ctx.fillRect(4, -19, 7, 7);
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(5, -18, 5, 5);

  // Sector Dividing Radial Ticks
  ctx.fillStyle = '#FEE2E2';
  ctx.fillRect(-4, -20, 1, 7);
  ctx.fillRect(4, -20, 1, 7);

  // Subtle 16-bit CRT Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fillRect(-14, -21, 28, 1);
  ctx.fillRect(-14, -18, 28, 1);
  ctx.fillRect(-14, -15, 28, 1);
  ctx.fillRect(-14, -12, 28, 1);

  // Glass Reflection Glint (Top-left CRT arc)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.fillRect(-12, -21, 4, 1);
  ctx.fillRect(-8, -20, 3, 1);

  // Dynamic Indicator Needle (E to F based on HP ratio)
  const hpRatio = Math.max(0, Math.min(1.0, hp / maxHp));
  const needleAngle = -Math.PI * 0.78 + hpRatio * Math.PI * 0.78;
  const nLen = 7;
  const nX = Math.round(Math.cos(needleAngle) * nLen);
  const nY = Math.round(-13 + Math.sin(needleAngle) * nLen);

  // Needle Arm & Center Pivot
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, -14, 2, 2);
  ctx.fillRect(nX, nY, 2, 2);
  ctx.fillStyle = '#EF4444'; // Red pointer tip
  ctx.fillRect(nX, nY, 1, 1);
  ctx.fillStyle = '#F59E0B'; // Brass center pivot pin
  ctx.fillRect(0, -13, 1, 1);

  // ═══════════════════════════════════════════
  // 8. "PROVISIONS" ILLUMINATED BACKLIT SIGN (Y: [-32, -25])
  // ═══════════════════════════════════════════
  // Outer Beveled Frame (x = -19 to 19, y = -33 to -24)
  ctx.fillStyle = cOutline;
  ctx.fillRect(-19, -33, 38, 9);
  ctx.fillRect(-18, -34, 36, 11);

  ctx.fillStyle = cDark;
  ctx.fillRect(-18, -32, 36, 7);
  ctx.fillStyle = cHigh;
  ctx.fillRect(-18, -32, 36, 1);

  // Illuminated Ivory Backlit Marquee Panel (x = -18 to 18, y = -31 to -25)
  ctx.fillStyle = isHit ? '#FFFFFF' : '#FEF3C7';
  ctx.fillRect(-18, -31, 36, 6);
  ctx.fillStyle = isHit ? '#FFFFFF' : '#FFFBEB';
  ctx.fillRect(-17, -30, 34, 4);

  // Corner Mounting Screw Rivets
  ctx.fillStyle = cHigh;
  ctx.fillRect(-18, -31, 1, 1);
  ctx.fillRect(17, -31, 1, 1);
  ctx.fillRect(-18, -26, 1, 1);
  ctx.fillRect(17, -26, 1, 1);

  // 16-bit Micro-Pixel Typography "PROVISIONS"
  _drawPixelProvisions(ctx, 0, -28, isHit ? '#FFFFFF' : '#DC2626');

  // ═══════════════════════════════════════════
  // 9. TOP CROWN CAP & CRT STATUS BOX (Y: [-39, -33])
  // ═══════════════════════════════════════════
  ctx.fillStyle = cOutline;
  ctx.fillRect(-17, -39, 34, 7);
  ctx.fillRect(-16, -40, 32, 9);

  ctx.fillStyle = cRedDeep;
  ctx.fillRect(-16, -38, 32, 6);
  ctx.fillStyle = cRedDark;
  ctx.fillRect(-15, -38, 30, 5);
  ctx.fillStyle = cRedMid;
  ctx.fillRect(-14, -37, 28, 3);
  ctx.fillStyle = cRedHigh;
  ctx.fillRect(-14, -37, 28, 1);

  // 16-bit Green Cross (+) Status LED Box
  ctx.fillStyle = cOutline;
  ctx.fillRect(-11, -38, 8, 5);
  ctx.fillStyle = '#064E3B';
  ctx.fillRect(-10, -37, 6, 3);
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(-9, -36, 4, 1);
  ctx.fillRect(-8, -37, 2, 3);
  ctx.fillStyle = '#86EFAC';
  ctx.fillRect(-8, -36, 2, 1);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-8, -36, 1, 1); // LED Core

  // Amber Vacuum-Tube Capacitors / Filament Fuses
  ctx.fillStyle = cOutline;
  ctx.fillRect(5, -38, 3, 4);
  ctx.fillRect(9, -38, 3, 4);
  ctx.fillStyle = '#475569';
  ctx.fillRect(5, -35, 3, 1);
  ctx.fillRect(9, -35, 3, 1);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(6, -37, 1, 2);
  ctx.fillRect(10, -37, 1, 2);
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(6, -37, 1, 1);
  ctx.fillRect(10, -37, 1, 1);

  ctx.restore();
}

/**
 * Draws the Animated Healing Tether Beam from Dispenser to Target in 100% discrete pixel art.
 */
export function drawDispenserTetherBeam(ctx, fromX, fromY, toX, toY, isOvercharge = false) {
  ctx.save();
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) {
    ctx.restore();
    return;
  }

  const steps = Math.ceil(dist / 6);
  const now = Date.now();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wave = Math.sin(now * 0.008 + i * 0.8) * 3;
    const px = snap(fromX + dx * t + (-dy / dist) * wave);
    const py = snap(fromY + dy * t + (dx / dist) * wave);

    ctx.fillStyle = isOvercharge ? '#06B6D4' : '#22C55E';
    ctx.fillRect(px - 2, py - 2, 4, 4);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(px - 1, py - 1, 2, 2);
  }

  ctx.restore();
}

/**
 * Draws the Holographic Healing Field Perimeter Ring for Dispenser in 100% discrete pixel art.
 */
export function drawDispenserHealingRing(ctx, dispenser) {
  if (!dispenser || dispenser.hp <= 0) return;

  const range = CONFIG.Engineer?.dispenserRange || 260;
  const now = Date.now();
  let currentRadius = range;
  let ringAlpha = 0.75;

  if (dispenser.isBuilding) {
    const buildP = dispenser.buildProgress || 0.05;
    currentRadius = range * buildP;
    ringAlpha = buildP * 0.55;
  }

  ctx.save();

  // Stepped Pixel Perimeter Ring with Medical Crosses
  const steps = 36;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2 + now * 0.0004;
    const px = snap(dispenser.x + Math.cos(a) * currentRadius);
    const py = snap(dispenser.y + Math.sin(a) * currentRadius);

    if (i % 6 === 0) {
      // Stepped Green Medical Cross
      ctx.fillStyle = `rgba(34, 197, 94, ${ringAlpha.toFixed(2)})`;
      ctx.fillRect(px - 1, py - 3, 2, 6);
      ctx.fillRect(px - 3, py - 1, 6, 2);
    } else {
      // Perimeter Pixel Dot
      ctx.fillStyle = `rgba(74, 222, 128, ${(ringAlpha * 0.6).toFixed(2)})`;
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }
  }

  ctx.restore();
}

const _engBlueprintGridCache = new Map();
function _drawCachedEngineerBlueprintGrid(ctx, isTall) {
  const key = isTall ? 'tall' : 'sq';
  let entry = _engBlueprintGridCache.get(key);
  if (!entry && typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = isTall ? 68 : 48;
    const bCtx = c.getContext('2d');
    if (bCtx) {
      bCtx.save();
      bCtx.translate(24, isTall ? 34 : 24);
      bCtx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      for (let gx = -20; gx <= 20; gx += 8) bCtx.fillRect(gx, isTall ? -32 : -20, 1, isTall ? 56 : 40);
      for (let y = isTall ? -30 : -20, maxY = isTall ? 24 : 20; y <= maxY; y += 8) bCtx.fillRect(-20, y, 40, 1);
      bCtx.restore();
      entry = { canvas: c, ox: -24, oy: isTall ? -34 : -24 };
      _engBlueprintGridCache.set(key, entry);
    }
  }
  if (entry) ctx.drawImage(entry.canvas, entry.ox, entry.oy);
}
