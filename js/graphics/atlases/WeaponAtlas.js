/**
 * Weapon & Projectile Texture Atlas (WeaponAtlas.js)
 * 
 * Ahead-Of-Time (AOT) pre-baked offscreen texture atlas consolidating high-frequency
 * ballistic bullets, magical energy orbs, and combat impact decals into single-quad
 * GPU drawImage blits (Rule 35 — Mobile 60 FPS Pre-Baked Sprite Architecture).
 * 
 * Replaces per-frame vector path drawing (ctx.beginPath, quadraticCurveTo, arc, stroke)
 * with O(1) hardware-accelerated texture blits on mobile GPUs (Adreno / Mali).
 */

let _atlasCanvas = null;

export const ATLAS_SPRITES = {
  bullet_metal_jacket: {
    x: 4,
    y: 4,
    width: 48,
    height: 16,
    anchorX: 36,
    anchorY: 8
  },
  bullet_casull_silver: {
    x: 56,
    y: 4,
    width: 48,
    height: 16,
    anchorX: 36,
    anchorY: 8
  },
  bullet_jackal_black: {
    x: 108,
    y: 4,
    width: 52,
    height: 16,
    anchorX: 38,
    anchorY: 8
  },
  bullet_shotgun_slug: {
    x: 164,
    y: 4,
    width: 36,
    height: 16,
    anchorX: 24,
    anchorY: 8
  },
  pea_core_green: {
    x: 4,
    y: 44,
    width: 28,
    height: 28,
    anchorX: 14,
    anchorY: 14
  },
  pea_core_ice: {
    x: 36,
    y: 44,
    width: 28,
    height: 28,
    anchorX: 14,
    anchorY: 14
  },
  pea_core_fire: {
    x: 68,
    y: 44,
    width: 32,
    height: 32,
    anchorX: 16,
    anchorY: 16
  },
  blood_splat_1: {
    x: 4,
    y: 88,
    width: 24,
    height: 24,
    anchorX: 12,
    anchorY: 12
  },
  blood_splat_2: {
    x: 32,
    y: 88,
    width: 24,
    height: 24,
    anchorX: 12,
    anchorY: 12
  },
  blood_splat_3: {
    x: 60,
    y: 88,
    width: 24,
    height: 24,
    anchorX: 12,
    anchorY: 12
  },
  blood_splat_4: {
    x: 88,
    y: 88,
    width: 24,
    height: 24,
    anchorX: 12,
    anchorY: 12
  }
};

/**
 * Initializes and returns the shared 256x256 Weapon Texture Atlas offscreen canvas.
 */
export function getWeaponAtlasCanvas() {
  if (_atlasCanvas) return _atlasCanvas;
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ─────────────────────────────────────────────────────────────
  // 1. bullet_metal_jacket (Toji & John Wick 9mm Tactical Bullet)
  // Anchor at (x: 36, y: 8), total box: 48x16
  // ─────────────────────────────────────────────────────────────
  {
    const sx = ATLAS_SPRITES.bullet_metal_jacket.x + ATLAS_SPRITES.bullet_metal_jacket.anchorX;
    const sy = ATLAS_SPRITES.bullet_metal_jacket.y + ATLAS_SPRITES.bullet_metal_jacket.anchorY;
    const len = 14;
    const width = 3.6;
    const trailLen = 32;

    ctx.save();
    ctx.translate(sx, sy);

    // Supersonic motion trail
    const trailGrad = ctx.createLinearGradient(-trailLen, 0, 0, 0);
    trailGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
    trailGrad.addColorStop(0.55, 'rgba(251, 191, 36, 0.45)');
    trailGrad.addColorStop(1, 'rgba(254, 240, 138, 0.95)');
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(-trailLen, 0);
    ctx.lineTo(-len / 2, -width * 0.85);
    ctx.lineTo(0, 0);
    ctx.lineTo(-len / 2, width * 0.85);
    ctx.closePath();
    ctx.fill();

    // Copper/gold metal jacket core
    const coreGrad = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
    coreGrad.addColorStop(0, '#B45309');
    coreGrad.addColorStop(0.35, '#F59E0B');
    coreGrad.addColorStop(0.7, '#FDE047');
    coreGrad.addColorStop(1, '#FEF08A');
    ctx.fillStyle = coreGrad;
    ctx.strokeStyle = '#0E0F14';
    ctx.lineWidth = 0.8;

    ctx.beginPath();
    ctx.moveTo(-len / 2, -width / 2);
    ctx.lineTo(len * 0.15, -width / 2);
    ctx.quadraticCurveTo(len * 0.5, -width * 0.3, len * 0.55, 0);
    ctx.quadraticCurveTo(len * 0.5, width * 0.3, len * 0.15, width / 2);
    ctx.lineTo(-len / 2, width / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Razor specular line
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-len * 0.25, -width * 0.35, len * 0.5, 0.9);

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // 2. bullet_casull_silver (GunSlinger / Alucard .454 Casull)
  // Anchor at (x: 36, y: 8), total box: 48x16
  // ─────────────────────────────────────────────────────────────
  {
    const sx = ATLAS_SPRITES.bullet_casull_silver.x + ATLAS_SPRITES.bullet_casull_silver.anchorX;
    const sy = ATLAS_SPRITES.bullet_casull_silver.y + ATLAS_SPRITES.bullet_casull_silver.anchorY;

    ctx.save();
    ctx.translate(sx, sy);

    // Silver Speed Streak
    for (let i = 1; i <= 12; i++) {
      const alpha = (1.0 - i / 12) * 0.75;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = (i % 2 === 0) ? '#FFFFFF' : '#CBD5E1';
      ctx.fillRect(-i * 2 - 4, -1, 2, (i % 2 === 0) ? 2 : 1);
    }
    ctx.globalAlpha = 1.0;

    // Consecrated Silver Heavy Cartridge
    ctx.fillStyle = '#0E0F14';
    ctx.fillRect(-4, -2, 6, 4);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(-3, -1, 5, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-3, -1, 5, 1);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-3, 1, 5, 1);

    // Sacred Bullet Head
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(2, -2, 3, 4);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(3, -1, 2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(5, 0, 1, 1);

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // 3. bullet_jackal_black (GunSlinger / Alucard 13mm Jackal AP)
  // Anchor at (x: 38, y: 8), total box: 52x16
  // ─────────────────────────────────────────────────────────────
  {
    const sx = ATLAS_SPRITES.bullet_jackal_black.x + ATLAS_SPRITES.bullet_jackal_black.anchorX;
    const sy = ATLAS_SPRITES.bullet_jackal_black.y + ATLAS_SPRITES.bullet_jackal_black.anchorY;

    ctx.save();
    ctx.translate(sx, sy);

    // Dark Crimson Smoke Trail
    for (let i = 1; i <= 14; i++) {
      const alpha = (1.0 - i / 14) * 0.8;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = (i % 2 === 0) ? '#DC2626' : '#7F1D1D';
      ctx.fillRect(-i * 2 - 5, -1, 2, (i % 2 === 0) ? 2 : 1);
    }
    ctx.globalAlpha = 1.0;

    // 13mm Heavy Matte Black Slug
    ctx.fillStyle = '#0E0F14';
    ctx.fillRect(-5, -2, 8, 4);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-4, -1, 7, 2);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-4, -1, 7, 1);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-4, 1, 7, 1);

    // Mercury Explosive Crimson Tip
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(3, -2, 3, 4);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(4, -1, 2, 2);
    ctx.fillStyle = '#F87171';
    ctx.fillRect(5, 0, 2, 1);

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // 4. bullet_shotgun_slug (Heavy Shotgun Pellets & Slug)
  // Anchor at (x: 24, y: 8), total box: 36x16
  // ─────────────────────────────────────────────────────────────
  {
    const sx = ATLAS_SPRITES.bullet_shotgun_slug.x + ATLAS_SPRITES.bullet_shotgun_slug.anchorX;
    const sy = ATLAS_SPRITES.bullet_shotgun_slug.y + ATLAS_SPRITES.bullet_shotgun_slug.anchorY;

    ctx.save();
    ctx.translate(sx, sy);

    // Trail
    const sGrad = ctx.createLinearGradient(-20, 0, 0, 0);
    sGrad.addColorStop(0, 'rgba(148, 163, 184, 0)');
    sGrad.addColorStop(1, 'rgba(226, 232, 240, 0.7)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-4, -3);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();

    // Slug Core
    ctx.fillStyle = '#0E0F14';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(-1.2, -1.2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // 5. pea_core_green (Crazy Dave Green Pea Projectile)
  // Anchor at (x: 14, y: 14), total box: 28x28
  // ─────────────────────────────────────────────────────────────
  {
    const sx = ATLAS_SPRITES.pea_core_green.x + ATLAS_SPRITES.pea_core_green.anchorX;
    const sy = ATLAS_SPRITES.pea_core_green.y + ATLAS_SPRITES.pea_core_green.anchorY;
    const r = 6.0;

    ctx.save();
    ctx.translate(sx, sy);

    // Ambient glow halo
    const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, r + 5);
    halo.addColorStop(0, 'rgba(134, 239, 172, 0.75)');
    halo.addColorStop(0.5, 'rgba(34, 197, 94, 0.35)');
    halo.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
    ctx.fill();

    // Pea sphere
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#065F46';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Specular shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // 6. pea_core_ice (Crazy Dave Snow Pea Frost Projectile)
  // Anchor at (x: 14, y: 14), total box: 28x28
  // ─────────────────────────────────────────────────────────────
  {
    const sx = ATLAS_SPRITES.pea_core_ice.x + ATLAS_SPRITES.pea_core_ice.anchorX;
    const sy = ATLAS_SPRITES.pea_core_ice.y + ATLAS_SPRITES.pea_core_ice.anchorY;
    const r = 6.0;

    ctx.save();
    ctx.translate(sx, sy);

    // Frost halo
    const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, r + 5);
    halo.addColorStop(0, 'rgba(186, 230, 253, 0.85)');
    halo.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
    halo.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
    ctx.fill();

    // Ice Pea sphere
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0369A1';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Specular shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // 7. pea_core_fire (Crazy Dave Torchwood Fire Pea Projectile)
  // Anchor at (x: 16, y: 16), total box: 32x32
  // ─────────────────────────────────────────────────────────────
  {
    const sx = ATLAS_SPRITES.pea_core_fire.x + ATLAS_SPRITES.pea_core_fire.anchorX;
    const sy = ATLAS_SPRITES.pea_core_fire.y + ATLAS_SPRITES.pea_core_fire.anchorY;
    const r = 7.0;

    ctx.save();
    ctx.translate(sx, sy);

    // Fire corona
    const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, r + 7);
    halo.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    halo.addColorStop(0.45, 'rgba(249, 115, 22, 0.55)');
    halo.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, r + 7, 0, Math.PI * 2);
    ctx.fill();

    // Molten fiery core
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7C2D12';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Golden core center
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.25, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // 8. Blood Decal Droplet Stamps (blood_splat_1 .. blood_splat_4)
  // Box: 24x24 each, anchor at (12, 12)
  // ─────────────────────────────────────────────────────────────
  const splatConfigs = [
    { id: 'blood_splat_1', radii: [5, 3, 2], offsets: [[0, 0], [4, -3], [-3, 3]] },
    { id: 'blood_splat_2', radii: [5.5, 2.5, 2], offsets: [[0, 0], [-4, -4], [3, 4]] },
    { id: 'blood_splat_3', radii: [4.5, 3.5, 2.5], offsets: [[0, 0], [5, 2], [-4, -3]] },
    { id: 'blood_splat_4', radii: [6, 2, 1.8], offsets: [[0, 0], [-5, 3], [4, -4]] }
  ];

  for (const s of splatConfigs) {
    const sp = ATLAS_SPRITES[s.id];
    const sx = sp.x + sp.anchorX;
    const sy = sp.y + sp.anchorY;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#880808';

    for (let i = 0; i < s.radii.length; i++) {
      const [ox, oy] = s.offsets[i];
      const rad = s.radii[i];
      ctx.beginPath();
      ctx.arc(ox, oy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dark dried blood center dot
    ctx.fillStyle = '#4A0404';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _atlasCanvas = canvas;
  return canvas;
}

/**
 * Renders a single pre-baked sprite from the Weapon Atlas directly onto the target context.
 * Performs a single O(1) hardware-accelerated drawImage blit.
 * 
 * @param {CanvasRenderingContext2D} ctx - Target 2D rendering context
 * @param {string} spriteId - Identifier in ATLAS_SPRITES
 * @param {number} x - Destination X
 * @param {number} y - Destination Y
 * @param {number} [angle=0] - Rotation angle in radians
 * @param {number} [scale=1] - Uniform scale factor
 * @param {number} [alpha=1] - Opacity multiplier (0.0 to 1.0)
 */
export function drawAtlasSprite(ctx, spriteId, x, y, angle = 0, scale = 1, alpha = 1) {
  const sprite = ATLAS_SPRITES[spriteId];
  if (!sprite) return;
  const atlas = getWeaponAtlasCanvas();
  if (!atlas) return;

  ctx.save();
  if (alpha < 0.999) {
    ctx.globalAlpha = Math.max(0, Math.min(1.0, ctx.globalAlpha * alpha));
  }
  ctx.translate(x, y);
  if (angle !== 0) ctx.rotate(angle);
  if (scale !== 1) ctx.scale(scale, scale);

  ctx.drawImage(
    atlas,
    sprite.x, sprite.y, sprite.width, sprite.height,
    -sprite.anchorX, -sprite.anchorY, sprite.width, sprite.height
  );

  ctx.restore();
}
