// ═══════════════════════════════════════════════════════════════════════════
// CREEPER (Minecraft) — TNT Block, Explosion & Sulfur Particle Graphics
// Adheres strictly to Rule 11 (Zero shadowBlur), Rule 26 (Concentric Shockwaves),
// Rule 31 (Anti-Rectangular Clipping & Feathered Boundaries), and Rule 35.
// ═══════════════════════════════════════════════════════════════════════════

import { drawMinecraftExplosionCore } from '../particles/renderers/minecraftExplosionRenderer.js';

/**
 * Draws a classic Minecraft red-and-white TNT block with authentic pixel face,
 * top fuse cord, and rhythmic white priming flash.
 */
export function drawMinecraftTntBlock(ctx, tnt) {
  if (!ctx || !tnt) return;
  const size = tnt.size || 22;
  const half = size * 0.5;

  ctx.save();
  ctx.translate(tnt.x, tnt.y);

  // Rotation while traveling through air
  if (tnt.isBouncing || tnt.isAirborne) {
    ctx.rotate(tnt.rotation || 0);
  }

  // White flash cadence as fuse burns down
  const fuseP = Math.max(0, 1.0 - (tnt.fuseTimer || 0) / Math.max(1, tnt.maxFuseTimer || 135));
  const flashFreq = 3 + fuseP * 14;
  const isFlashingWhite = Math.sin(fuseP * Math.PI * flashFreq) > 0.15;

  // Outer black ink frame (Rule 32)
  ctx.fillStyle = '#0E0F14';
  ctx.fillRect(-half - 1.5, -half - 1.5, size + 3, size + 3);

  if (isFlashingWhite) {
    // Solid white flash on prime
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-half, -half, size, size);
  } else {
    // Red TNT Top / Bottom bands
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-half, -half, size, size);

    // Dark red bottom shadow
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(-half, half - 3, size, 3);

    // Top highlight rim
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-half, -half, size, 3);

    // Center white band
    const bandH = size * 0.44;
    const bandY = -bandH * 0.5;
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-half, bandY, size, bandH);

    // Dark band border lines
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-half, bandY - 1, size, 1);
    ctx.fillRect(-half, bandY + bandH, size, 1);

    // Authentic pixel "TNT" lettering
    ctx.fillStyle = '#0F172A';
    // 'T'
    ctx.fillRect(-half + 3, bandY + 2, 4, 1.5);
    ctx.fillRect(-half + 4.2, bandY + 2, 1.5, bandH - 4);
    // 'N'
    ctx.fillRect(-half + 8.5, bandY + 2, 1.5, bandH - 4);
    ctx.fillRect(-half + 10, bandY + 3.5, 1.5, 2.5);
    ctx.fillRect(-half + 11.5, bandY + 2, 1.5, bandH - 4);
    // 'T'
    ctx.fillRect(-half + 14.5, bandY + 2, 4, 1.5);
    ctx.fillRect(-half + 15.7, bandY + 2, 1.5, bandH - 4);
  }

  // Top fuse spark
  if (tnt.fuseTimer > 0) {
    const sparkX = Math.sin(fuseP * 25) * 2;
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-1, -half - 3, 2, 3); // Gray fuse string
    ctx.fillStyle = isFlashingWhite ? '#FEF08A' : '#F97316';
    ctx.beginPath();
    ctx.arc(sparkX, -half - 4.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders Creeper's explosion using the canonical pre-baked Minecraft crescent smoke,
 * upper smoke spheres, white starburst motes, and rising embers renderer.
 */
export function drawCreeperExplosion(ctx, vfx) {
  if (!ctx || !vfx) return;
  const p = Math.min(1.0, 1.0 - (vfx.timer || 0) / Math.max(1, vfx.maxTimer || 34));
  if (p >= 1.0) return;

  drawMinecraftExplosionCore(ctx, {
    x: vfx.x,
    y: vfx.y,
    radius: vfx.radius || 130,
    p,
    isCharged: Boolean(vfx.isCharged)
  });
}
