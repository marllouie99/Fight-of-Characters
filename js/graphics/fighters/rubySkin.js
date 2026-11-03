// ─────────────────────────────────────────────
// RUBY FIGHTER SKIN & BODY MODEL
// Little Red Hood / Scythe Wielder (Mobile Legends / RWBY Reference)
// Adheres strictly to:
// - Rule 19 (Upright Front POV Camera Orientation, Zero Eyes/Mouth/Nose)
// - Rule 20 (Hand Visibility & Canonical Default Hand Placement)
// - Rule 21 (Mandatory In-Game Overlay HP & Status Drawing via drawHealth/drawFreezeTimer)
// - Rule 22 (Mandatory Hair & Head Asset Model Import: Assets/model/ruby/Ruby-hair.png)
// - Rule 24 (Toji Reference Standard: 4-neighbor manga outline, proportional zoning)
// ─────────────────────────────────────────────

import { getHandSize } from '../../core/config.js';
import { state } from '../../core/state.js';
import { drawPixelHand } from '../renderers/fighterRenderer.js';

let _rubyHairImage = null;
let _rubyHairImageLoading = false;

export function _getRubyHairImage() {
  if (_rubyHairImage && _rubyHairImage.complete && _rubyHairImage.naturalWidth > 0) {
    return _rubyHairImage;
  }
  if (!_rubyHairImageLoading && typeof Image !== 'undefined') {
    _rubyHairImageLoading = true;
    const img = new Image();
    img.onload = () => {
      _rubyHairImage = img;
      _rubyHairImageLoading = false;
    };
    img.onerror = (e) => {
      console.warn('Failed to load Ruby hair image at Assets/model/ruby/Ruby-hair.png', e);
      _rubyHairImageLoading = false;
    };
    img.src = 'Assets/model/ruby/Ruby-hair.png?v=1';
    _rubyHairImage = img;
  }
  return _rubyHairImage;
}

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getRubyHairImage();
}

/**
 * Draws Ruby's authentic anime Red Hood and Hair from Assets/model/ruby/Ruby-hair.png.
 * Features:
 * - Draped crimson hood cowl with crown peak
 * - Choppy obsidian anime bangs with vibrant ruby-crimson ombré tips
 * - Symmetrical cheek-framing locks
 * - Gold cross clasp / brooch at the throat
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} r - Character body radius
 * @param {boolean} [facingLeft=false]
 */
export function _drawRubyHair(ctx, r, facingLeft = false) {
  const hairImg = _getRubyHairImage();
  if (!hairImg || !hairImg.complete || hairImg.naturalWidth <= 0) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false; // Nearest-neighbor pixel fidelity (Rule 19 / 22)

  const custom = (typeof state !== 'undefined' && state.skinCustomizations?.ruby) || {};
  const wMult = custom.widthScale ?? 1.0;
  const hMult = custom.heightScale ?? 1.0;
  const offX = custom.offsetX ?? 0;
  const offY = custom.offsetY ?? 0;
  const rot = custom.angleOffset ?? 0;
  const flipX = custom.flipX ? -1 : 1;
  const flipY = custom.flipY ? -1 : 1;

  // Ruby-hair.png is 560x712.
  // Aperture vertical center is at Y = 530.
  const targetW = r * 3.4 * wMult;
  const scale = targetW / 560;
  const drawW = targetW;
  const drawH = 712 * scale * hMult;
  const drawX = -drawW / 2 + offX;
  const drawY = -(530 * scale) + offY;

  if (rot !== 0 || flipX !== 1 || flipY !== 1) {
    ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
    if (rot !== 0) ctx.rotate(rot);
    if (flipX !== 1 || flipY !== 1) ctx.scale(flipX, flipY);
    ctx.drawImage(hairImg, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.drawImage(hairImg, drawX, drawY, drawW, drawH);
  }

  ctx.restore();
}

/**
 * Main Skin Renderer for Ruby (Little Red Hood)
 * Renders the full Rule 24 body model + Rule 22 Red Hood & Hair.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter
 */
export function drawRubySkin(ctx, fighter) {
  const r = fighter.r || 25;
  const isPodiumPreview = Boolean(fighter._isWinnerReveal);
  const now = Date.now();

  const isSuppressed = !isPodiumPreview && Boolean(
    fighter.isTargetOfAmbush ||
    (typeof fighter.areAttackEffectsSuppressed === 'function' && fighter.areAttackEffectsSuppressed())
  );

  ctx.save();
  ctx.translate(fighter.x, fighter.y);

  // 1. Standard Upright Orientation & Local Angle Transforms (Rule 19)
  const angle = isPodiumPreview ? 0 : (fighter.gunAngle || 0);
  ctx.rotate(angle);

  const facingLeft = Math.abs(angle) > Math.PI / 2;
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  // 2. LAYER 1: Central Body Circle (Fair Skin Base & Gothic Dress)
  const P = 2.0;
  const steps = Math.ceil((r + P) / P);

  // Body Palette (Toji / Manga Standard)
  const C_INK = '#0E0F14';
  const C_SKIN = '#FFE8D6';       // Fair anime face dome
  const C_SKIN_SHADOW = '#F2CCB6';
  const C_CORSET_BLACK = '#161720';// Gothic black corset / bodice
  const C_CORSET_TRIM = '#880E4F'; // Crimson trim
  const C_SASH_RED = '#C2185B';   // Waistband sash

  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      const d = Math.hypot(rx, ry);
      if (d > r) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;

      // 4-neighbor boundary test for clean 1px ink outline
      const isBorder = (
        Math.hypot((gx + 1) * P, gy * P) > r ||
        Math.hypot((gx - 1) * P, gy * P) > r ||
        Math.hypot(gx * P, (gy + 1) * P) > r ||
        Math.hypot(gx * P, (gy - 1) * P) > r
      );

      if (isBorder) {
        ctx.fillStyle = C_INK;
        ctx.fillRect(px, py, P, P);
      } else {
        // Vertical Zoning (Toji standard)
        // Zone 1: Pure Face Dome (ry < r * 0.28)
        if (ry < r * 0.28) {
          ctx.fillStyle = (Math.abs(rx) > r * 0.70) ? C_SKIN_SHADOW : C_SKIN;
        }
        // Zone 2: Gothic Corset Bodice (r * 0.28 <= ry < r * 0.65)
        else if (ry < r * 0.65) {
          if (Math.abs(rx) <= P) {
            ctx.fillStyle = C_CORSET_TRIM; // Center crimson corset lace seam
          } else {
            ctx.fillStyle = C_CORSET_BLACK;
          }
        }
        // Zone 3: Waistband Sash (r * 0.65 <= ry < r * 0.78)
        else if (ry < r * 0.78) {
          ctx.fillStyle = C_SASH_RED;
        }
        // Zone 4: Lower Gothic Skirt (ry >= r * 0.78)
        else {
          ctx.fillStyle = C_CORSET_BLACK;
        }
        ctx.fillRect(px, py, P, P);
      }
    }
  }

  // 3. LAYER 2: Ruby's Red Hood & Choppy Hair (Assets/model/ruby/Ruby-hair.png)
  _drawRubyHair(ctx, r, facingLeft);

  // 4. LAYER 3: Symmetrical Canonical Default Hands (Rule 20)
  // Positioned symmetrically at lower flanks: Left (-r * 0.82, +r * 0.38), Right (+r * 0.82, +r * 0.38)
  const handRadius = getHandSize(r * 0.30);
  drawPixelHand(ctx, -r * 0.82, r * 0.38, handRadius, C_SKIN);
  drawPixelHand(ctx, r * 0.82, r * 0.38, handRadius, C_SKIN);

  ctx.restore();
}

