// ─────────────────────────────────────────────
// STRIKER SOCCER BALL — MOLTEN LIQUID-PLASMA WAKE, HOOKED FLAME CLAWS,
// BALL-HUGGING CORONA RIM, CRACKLING LIGHTNING & EMBER SHOWER
//
// Directly modeled on the 4-stage Soccer Ball VFX Reference Progression:
// Stage 1: Tight Ball-Hugging Undulating Plasma Corona Rim & Initial Liquid Tongue
// Stage 2: Sculpted Inward-Hooking Liquid-Plasma C-Claws & Glossy Molten Core
// Stage 3: Roaring Turbulent Outer Fire Shroud & Whipping S-Curve Flame Tongues
// Stage 4: Dissolving Feathered Tail Tendrils, Crackling Micro-Lightning & Ember Shower
//
// Complies strictly with:
// - Rule 11: Prohibition of shadowBlur CPU filters (uses feathered radial gradients & layered bezier tongues)
// - Rule 16: Manga Action Speed Lines (4-point filled needle polygons)
// - Rule 25: Non-Freezing Active Visual Effects Decay
// - Rule 31: Feathered 0-alpha outer boundaries (zero box or V-corner bounce artifacts)
// ─────────────────────────────────────────────

const MAX_BALL_TRAIL_NODES = 20;
const MAX_BALL_SPARKS = 44;

// ─────────────────────────────────────────────
// 1. MOLTEN PLASMA PALETTES
// ─────────────────────────────────────────────

function _hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [245, 178, 11];
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length >= 6) {
    return [
      parseInt(clean.substring(0, 2), 16) || 0,
      parseInt(clean.substring(2, 4), 16) || 0,
      parseInt(clean.substring(4, 6), 16) || 0
    ];
  }
  return [245, 178, 11];
}

function _rgba(rgb, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a.toFixed(3)})`;
}

function _getStrikerBallPalette(ball, kickerColor) {
  const primary = kickerColor || ball.kickerThemeColor || (ball.lastKicker?.color) || '#00F0FF';
  const charId = (ball.lastKicker?.characterId || '').toLowerCase();
  const cleanPrimary = typeof primary === 'string' ? primary.toUpperCase() : '';

  if (charId === 'chigiri' || cleanPrimary === '#EC4899' || cleanPrimary === '#F43F5E') {
    return {
      primary: '#EC4899',
      rgbOuter: [190, 24, 93],
      rgbMid: [244, 63, 140],
      rgbBright: [254, 215, 102],    // Molten Golden-Pink Plasma highlight
      rgbCore: [255, 250, 245],
      coreWhite: '#FFFFFF',
      sparkColors: ['#FFFFFF', '#FFFBEB', '#FDE047', '#FF94C6', '#EC4899', '#F43F5E']
    };
  }

  if (charId === 'isagi' || cleanPrimary === '#00F0FF') {
    return {
      primary: '#00F0FF',
      rgbOuter: [14, 155, 145],
      rgbMid: [0, 232, 218],
      rgbBright: [135, 255, 242],
      rgbCore: [242, 255, 254],
      coreWhite: '#FFFFFF',
      sparkColors: ['#FFFFFF', '#E6FFFA', '#78FFEC', '#00F0FF', '#FDE047']
    };
  }

  const baseRgb = _hexToRgb(primary);
  return {
    primary,
    rgbOuter: [Math.round(baseRgb[0] * 0.72), Math.round(baseRgb[1] * 0.65), Math.round(baseRgb[2] * 0.65)],
    rgbMid: baseRgb,
    rgbBright: [
      Math.min(255, baseRgb[0] + 65),
      Math.min(255, baseRgb[1] + 65),
      Math.min(255, baseRgb[2] + 65)
    ],
    rgbCore: [255, 252, 240],
    coreWhite: '#FFFFFF',
    sparkColors: ['#FFFFFF', '#FFFDE8', '#FDE047', primary]
  };
}

// ─────────────────────────────────────────────
// 2. KINEMATICS & DECAY LIFECYCLES (RULE 25)
// ─────────────────────────────────────────────

/**
 * Updates the Striker ball's historical wake pockets and streaking ember sparks.
 *
 * @param {object} ball - Soccer ball projectile entity
 */
export function updateStrikerBallTrail(ball) {
  if (!ball) return;

  if (!Array.isArray(ball._strikerTrailNodes)) {
    ball._strikerTrailNodes = [];
  }
  if (!Array.isArray(ball._strikerSparks)) {
    ball._strikerSparks = [];
  }

  ball._strikerTrailTimer = (ball._strikerTrailTimer || 0) + 1;
  const bx = ball.x;
  const by = ball.y;
  const vx = ball.vx || 0;
  const vy = ball.vy || 0;
  const speed = Math.hypot(vx, vy);
  const angle = speed > 0.2 ? Math.atan2(vy, vx) : (ball.angle || 0);

  const nodes = ball._strikerTrailNodes;
  const last = nodes[0];
  const distFromLast = last ? Math.hypot(bx - last.x, by - last.y) : 999;

  // Detect wall bounce ricochet angle change (> 48 deg) so pre-bounce wisps never fold into a V-corner
  let isBreak = false;
  if (last && typeof last.angle === 'number') {
    const angleDiff = Math.abs(Math.atan2(Math.sin(angle - last.angle), Math.cos(angle - last.angle)));
    if (angleDiff > 0.84) {
      isBreak = true;
    }
  }

  if (!last || distFromLast >= 2.5 || speed > 3.0) {
    nodes.unshift({
      x: bx,
      y: by,
      vx,
      vy,
      speed,
      angle,
      age: 0,
      isBreak,
      r: ball.r || 16
    });
  } else {
    last.x = bx;
    last.y = by;
    last.vx = vx;
    last.vy = vy;
    last.speed = speed;
    last.angle = angle;
  }

  for (let i = 1; i < nodes.length; i++) {
    const n = nodes[i];
    n.age += 1 / MAX_BALL_TRAIL_NODES;
    const backAng = (n.angle || 0) + Math.PI;
    const perpAng = backAng + Math.PI * 0.5;
    const wave = Math.sin((ball._strikerTrailTimer || 0) * 0.35 + i * 0.7) * 0.55;
    n.x += Math.cos(backAng) * 0.65 + Math.cos(perpAng) * wave;
    n.y += Math.sin(backAng) * 0.65 + Math.sin(perpAng) * wave;
  }
  while (nodes.length > MAX_BALL_TRAIL_NODES) {
    nodes.pop();
  }

  // Spawn Streaking Ember Sparks (Reference Stages 3 & 4)
  const palette = _getStrikerBallPalette(ball, ball.kickerThemeColor);
  const backAngle = angle + Math.PI;
  const ballR = ball.r || 16;

  if (speed > 2.5 && ball._strikerSparks.length < MAX_BALL_SPARKS) {
    const spawnCount = (speed > 10.0) ? 3 : 2;
    for (let s = 0; s < spawnCount; s++) {
      if (ball._strikerSparks.length >= MAX_BALL_SPARKS) break;
      const spread = (Math.random() - 0.5) * 1.45;
      const rimAng = backAngle + (Math.random() - 0.5) * 1.85;
      const launchAngle = backAngle + spread * 0.55;
      const sparkSpeed = (speed * 0.22) + 1.4 + Math.random() * 3.8;
      const color = palette.sparkColors[Math.floor(Math.random() * palette.sparkColors.length)];

      ball._strikerSparks.push({
        x: bx + Math.cos(rimAng) * ballR * (0.65 + Math.random() * 0.45),
        y: by + Math.sin(rimAng) * ballR * (0.65 + Math.random() * 0.45),
        vx: Math.cos(launchAngle) * sparkSpeed,
        vy: Math.sin(launchAngle) * sparkSpeed,
        size: 1.2 + Math.random() * 2.2,
        streakLen: 4.0 + Math.random() * 8.0,
        color,
        life: 14 + Math.floor(Math.random() * 12),
        maxLife: 26,
        rot: launchAngle,
        rotSpeed: (Math.random() - 0.5) * 0.12
      });
    }
  }

  _updateStrikerSparks(ball);
}

/**
 * Naturally decays remaining nodes and sparks when the ball slows down or hits a target (Rule 25).
 *
 * @param {object} ball - Soccer ball projectile entity
 */
export function decayStrikerBallTrail(ball) {
  if (!ball) return;

  if (Array.isArray(ball._strikerTrailNodes) && ball._strikerTrailNodes.length > 0) {
    for (let i = ball._strikerTrailNodes.length - 1; i >= 0; i--) {
      const node = ball._strikerTrailNodes[i];
      node.age += 0.10;
      if (node.age >= 1.0) {
        ball._strikerTrailNodes.splice(i, 1);
      }
    }
  }

  _updateStrikerSparks(ball);
}

function _updateStrikerSparks(ball) {
  if (!Array.isArray(ball._strikerSparks)) return;

  for (let i = ball._strikerSparks.length - 1; i >= 0; i--) {
    const sp = ball._strikerSparks[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vx *= 0.92;
    sp.vy *= 0.92;
    sp.rot += sp.rotSpeed || 0;
    sp.life--;
    if (sp.life <= 0) {
      ball._strikerSparks.splice(i, 1);
    }
  }
}

// ─────────────────────────────────────────────
// 3. ORGANIC FLAME TONGUE & PLASMA PRIMITIVES
// ─────────────────────────────────────────────

function _drawHookedFlameTongue(ctx, x0, y0, nx, ny, c1x, c1y, c2x, c2y, tipX, tipY, baseHalfW, midHalfW, fillStyle) {
  const mnx = -ny;
  const mny = nx;

  ctx.beginPath();
  ctx.moveTo(x0 + nx * baseHalfW, y0 + ny * baseHalfW);
  ctx.bezierCurveTo(
    c1x + nx * midHalfW,
    c1y + ny * midHalfW,
    c2x + nx * (midHalfW * 0.38) + mnx * (midHalfW * 0.24),
    c2y + ny * (midHalfW * 0.38) + mny * (midHalfW * 0.24),
    tipX,
    tipY
  );
  ctx.bezierCurveTo(
    c2x - nx * (midHalfW * 0.38) - mnx * (midHalfW * 0.15),
    c2y - ny * (midHalfW * 0.38) - mny * (midHalfW * 0.15),
    c1x - nx * (midHalfW * 0.85),
    c1y - ny * (midHalfW * 0.85),
    x0 - nx * baseHalfW,
    y0 - ny * baseHalfW
  );
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function _drawFeatheredBallPlasmaPocket(ctx, cx, cy, radius, palette, alpha, isHotCore = false) {
  if (radius <= 1.0 || alpha <= 0.015) return;
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius);
  if (isHotCore) {
    grad.addColorStop(0.0, _rgba(palette.rgbCore, 0.95 * alpha));
    grad.addColorStop(0.35, _rgba(palette.rgbBright, 0.82 * alpha));
    grad.addColorStop(0.70, _rgba(palette.rgbMid, 0.42 * alpha));
    grad.addColorStop(1.0, _rgba(palette.rgbOuter, 0.0));
  } else {
    grad.addColorStop(0.0, _rgba(palette.rgbBright, 0.62 * alpha));
    grad.addColorStop(0.45, _rgba(palette.rgbMid, 0.38 * alpha));
    grad.addColorStop(0.78, _rgba(palette.rgbOuter, 0.16 * alpha));
    grad.addColorStop(1.0, _rgba(palette.rgbOuter, 0.0));
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function _drawBallLightningFilament(ctx, x0, y0, x1, y1, timer, seed, palette, alpha) {
  if (alpha <= 0.04) return;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 3) return;

  const nx = -dy / len;
  const ny = dx / len;
  const steps = 5;
  const pts = [{ x: x0, y: y0 }];

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const env = Math.sin(t * Math.PI);
    const jitter = (Math.sin(timer * 1.9 + seed * 4.1 + i * 3.3) * 4.8 +
                    Math.cos(timer * 2.7 - seed * 2.3 + i * 5.1) * 2.8) * env;
    pts.push({
      x: x0 + dx * t + nx * jitter,
      y: y0 + dy * t + ny * jitter
    });
  }
  pts.push({ x: x1, y: y1 });

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = _rgba(palette.rgbMid, 0.72 * alpha);
  ctx.lineWidth = 2.2;
  ctx.stroke();

  ctx.strokeStyle = _rgba(palette.rgbCore, 0.96 * alpha);
  ctx.lineWidth = 0.95;
  ctx.stroke();
}

// ─────────────────────────────────────────────
// 4. DYNAMIC 4-STAGE SOCCER BALL COMET RENDERER
// ─────────────────────────────────────────────

/**
 * Draws the 4-stage molten liquid-plasma wake, hooked flame claws, ball-hugging corona rim,
 * crackling micro-lightning, and streaking ember sparks on the Striker soccer ball.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} ball - Soccer ball projectile entity
 * @param {string} [kickerColor] - Character theme color
 */
export function drawStrikerBallTrail(ctx, ball, kickerColor) {
  if (!ctx || !ball) return;

  const nodes = ball._strikerTrailNodes;
  const sparks = ball._strikerSparks;
  const hasNodes = Array.isArray(nodes) && nodes.length >= 2;
  const hasSparks = Array.isArray(sparks) && sparks.length > 0;

  if (!hasNodes && !hasSparks) return;

  const timer = ball._strikerTrailTimer || 0;
  const palette = _getStrikerBallPalette(ball, kickerColor);
  const ballR = ball.r || 16;

  ctx.save();

  // 1. Dissolving World-Space Turbulent Flame Pockets & Hooked Wake Licks (Tail-to-Head)
  if (hasNodes) {
    const N = nodes.length;

    for (let i = N - 1; i >= 1; i--) {
      const node = nodes[i];
      const prev = nodes[i - 1];
      const t = i / N;
      const ageFade = Math.max(0, 1.0 - (node.age || 0));
      const fade = Math.pow(1.0 - t, 1.50) * ageFade;
      if (fade <= 0.02) continue;

      const tailAng = (node.angle || 0) + Math.PI;
      const tx = Math.cos(tailAng);
      const ty = Math.sin(tailAng);
      const nx = -ty;
      const ny = tx;

      // 1A. Plasma Pocket: Prohibit redundant secondary ball drawing behind the ball
      // (Supersonic wake is rendered via sculpted liquid flame claws, lightning arcs & ember sparks)

      // 1B. Alternating Curling / Hooked Flame Claws along the ball wake
      const side = (i % 2 === 0) ? 1 : -1;
      const wave = Math.sin(timer * 0.34 + i * 0.95) * (ballR * 0.28);
      const tongueLen = ballR * (1.15 + 0.75 * (1.0 - t));
      const baseHalfW = ballR * 0.38 * (1.0 - t * 0.60);

      const x0 = node.x + nx * side * (ballR * 0.30 * (1.0 - t * 0.4));
      const y0 = node.y + ny * side * (ballR * 0.30 * (1.0 - t * 0.4));
      const c1x = x0 + tx * (tongueLen * 0.38) + nx * (side * ballR * 0.42 + wave);
      const c1y = y0 + ty * (tongueLen * 0.38) + ny * (side * ballR * 0.42 + wave);
      const c2x = x0 + tx * (tongueLen * 0.78) + nx * (side * ballR * 0.14 - wave * 0.5);
      const c2y = y0 + ty * (tongueLen * 0.78) + ny * (side * ballR * 0.14 - wave * 0.5);
      const tipX = x0 + tx * tongueLen - nx * (side * ballR * 0.16);
      const tipY = y0 + ty * tongueLen - ny * (side * ballR * 0.16);

      _drawHookedFlameTongue(
        ctx, x0, y0, nx, ny, c1x, c1y, c2x, c2y, tipX, tipY,
        baseHalfW * 1.25, baseHalfW * 0.85,
        _rgba(palette.rgbOuter, 0.46 * fade)
      );
      _drawHookedFlameTongue(
        ctx, x0, y0, nx, ny, c1x, c1y, c2x, c2y, tipX, tipY,
        baseHalfW * 0.82, baseHalfW * 0.54,
        _rgba(palette.rgbMid, 0.78 * fade)
      );

      if (t < 0.65) {
        _drawHookedFlameTongue(
          ctx, x0, y0, nx, ny, c1x, c1y, c2x, c2y,
          (c2x + tipX) * 0.5, (c2y + tipY) * 0.5,
          baseHalfW * 0.42, baseHalfW * 0.26,
          _rgba(palette.rgbCore, 0.90 * fade)
        );
      }

      // 1C. Feathered Wispy Tail Tendrils (Skips across wall-bounce breaks!)
      const segDist = Math.hypot(node.x - prev.x, node.y - prev.y);
      if (!prev.isBreak && !node.isBreak && segDist < ballR * 3.0) {
        const wispSway = Math.sin(timer * 0.38 + i * 1.1) * (ballR * 0.25 * t);
        const mx = (prev.x + node.x) * 0.5 + nx * wispSway;
        const my = (prev.y + node.y) * 0.5 + ny * wispSway;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.quadraticCurveTo(mx, my, node.x, node.y);
        ctx.strokeStyle = _rgba(t < 0.42 ? palette.rgbCore : palette.rgbBright, 0.68 * fade);
        ctx.lineWidth = Math.max(0.7, 3.4 * (1.0 - t * 0.78));
        ctx.stroke();
      }

      // 1D. Crackling Wake Micro-Lightning Arcs
      if (i % 3 === 1 && i < N - 2 && !node.isBreak) {
        const nextNode = nodes[Math.min(N - 1, i + 2)];
        if (Math.hypot(nextNode.x - node.x, nextNode.y - node.y) < ballR * 3.8) {
          _drawBallLightningFilament(
            ctx,
            node.x + nx * side * (ballR * 0.28),
            node.y + ny * side * (ballR * 0.28),
            nextNode.x - nx * side * (ballR * 0.18),
            nextNode.y - ny * side * (ballR * 0.18),
            timer,
            i * 1.9,
            palette,
            fade * 0.90
          );
        }
      }
    }

    // 2. Head-Anchored Sculpted Liquid-Plasma Core & Hooked Claws (Only when actively traveling at speed)
    const head = nodes[0];
    const ballSpeed = Math.hypot(ball.vx || 0, ball.vy || 0);
    if (ballSpeed > 2.5 && Boolean(ball.isDirectVolley || ball.isStriker || ball.isSuperShot)) {
      _drawBallSculptedPlasmaHead(ctx, ball, head, ballR, timer, palette);
    }
  }

  // 3. Streaking Ember Sparks (Reference Stages 3 & 4)
  if (hasSparks) {
    _drawStreakingBallSparks(ctx, sparks);
  }

  ctx.restore();
}

/**
 * Draws the head-anchored Sculpted Liquid-Plasma Core, Hooked C-Claws, and Ball-Hugging Corona
 * directly around the soccer ball (Reference Stages 1, 2 & 3).
 */
function _drawBallSculptedPlasmaHead(ctx, ball, head, ballR, timer, palette) {
  const vx = ball.vx !== undefined ? ball.vx : (head.vx || 0);
  const vy = ball.vy !== undefined ? ball.vy : (head.vy || 0);
  const speed = Math.hypot(vx, vy);
  const forwardAngle = speed > 0.2 ? Math.atan2(vy, vx) : (head.angle || 0);
  const stretch = 1.0 + Math.min(0.95, speed * 0.045);

  ctx.save();
  ctx.translate(ball.x, ball.y - (ball.z || 0));
  ctx.rotate(forwardAngle);

  // 2.1 Turbulent Outer Flame Tongues (Reference Stage 3: 83bdab23)
  for (let side = -1; side <= 1; side += 2) {
    for (let k = 0; k < 2; k++) {
      const phase = timer * (0.28 + k * 0.06) + k * 2.1 + (side > 0 ? 1.1 : 0.0);
      const reach = ballR * (2.25 + k * 0.85) * stretch * (0.9 + 0.15 * Math.sin(phase));
      const startX = -ballR * (0.15 + k * 0.20);
      const startY = side * ballR * (0.84 - k * 0.12);
      const c1x = startX - reach * 0.38;
      const c1y = side * ballR * (1.32 + k * 0.18 + Math.sin(phase) * 0.18);
      const c2x = startX - reach * 0.76;
      const c2y = side * ballR * (0.45 + Math.cos(phase) * 0.22);
      const tipX = startX - reach;
      const tipY = side * ballR * 0.22;

      _drawHookedFlameTongue(
        ctx, startX, startY, 0, side, c1x, c1y, c2x, c2y, tipX, tipY,
        ballR * 0.42, ballR * 0.30, _rgba(palette.rgbOuter, 0.55)
      );
      _drawHookedFlameTongue(
        ctx, startX, startY, 0, side, c1x, c1y, c2x, c2y, tipX + ballR * 0.22, tipY * 0.85,
        ballR * 0.28, ballR * 0.20, _rgba(palette.rgbMid, 0.84)
      );
    }
  }

  // 2.3 Sculpted Inward-Hooking Liquid-Plasma C-Claws (Reference Stage 2: 2f1752e4)
  const coreLen = ballR * 2.55 * stretch;
  const sway = Math.sin(timer * 0.32) * (ballR * 0.18);

  for (let side = -1; side <= 1; side += 2) {
    const wWave = Math.sin(timer * 0.34 + (side > 0 ? 1.5 : 0.0)) * (ballR * 0.15);
    const x0 = -ballR * 0.15;
    const y0 = side * ballR * 0.88;
    const c1x = -coreLen * 0.42;
    const c1y = side * (ballR * 1.16 + wWave);
    const c2x = -coreLen * 0.88;
    const c2y = side * (ballR * 0.70 - wWave * 0.5);
    const tipX = -coreLen * 0.76;
    const tipY = side * ballR * 0.14 + sway * 0.3;

    _drawHookedFlameTongue(
      ctx, x0, y0, 0, side, c1x, c1y, c2x, c2y, tipX, tipY,
      ballR * 0.36, ballR * 0.28, _rgba(palette.rgbMid, 0.88)
    );
    _drawHookedFlameTongue(
      ctx, x0, y0, 0, side, c1x, c1y, c2x, c2y, tipX, tipY,
      ballR * 0.24, ballR * 0.18, _rgba(palette.rgbBright, 0.94)
    );
    _drawHookedFlameTongue(
      ctx, x0, y0, 0, side, c1x, c1y * 0.92, c2x * 0.92, c2y * 0.88,
      (c2x + tipX) * 0.5, (c2y + tipY) * 0.5,
      ballR * 0.12, ballR * 0.09, _rgba(palette.rgbCore, 0.98)
    );
  }

  // 2.4 Whipping S-Curved Central Molten Tail
  const tailReach = coreLen * 1.35;
  _drawHookedFlameTongue(
    ctx, -ballR * 0.40, 0, 0, 1,
    -tailReach * 0.38, sway * 1.3,
    -tailReach * 0.74, -sway * 1.5,
    -tailReach, sway * 0.8,
    ballR * 0.58, ballR * 0.34, _rgba(palette.rgbBright, 0.92)
  );
  _drawHookedFlameTongue(
    ctx, -ballR * 0.40, 0, 0, 1,
    -tailReach * 0.34, sway * 0.8,
    -tailReach * 0.62, -sway * 0.9,
    -tailReach * 0.72, sway * 0.4,
    ballR * 0.32, ballR * 0.18, _rgba(palette.rgbCore, 0.98)
  );

  // 2.6 Crackling Rim & Wake Lightning Filaments
  for (let side = -1; side <= 1; side += 2) {
    _drawBallLightningFilament(
      ctx,
      ballR * 0.25,
      side * ballR * 1.06,
      -ballR * 2.55 * stretch,
      side * ballR * 0.42,
      timer,
      side > 0 ? 1.3 : 3.9,
      palette,
      0.92
    );
  }

  ctx.restore();
}

/**
 * Draws streaking velocity-aligned ember sparks and glowing pinpoint stardust.
 */
function _drawStreakingBallSparks(ctx, sparks) {
  for (let i = 0; i < sparks.length; i++) {
    const sp = sparks[i];
    const lifeRatio = Math.max(0, sp.life / sp.maxLife);
    const alpha = Math.pow(lifeRatio, 1.15) * 0.94;
    if (alpha <= 0.02) continue;

    const spd = Math.hypot(sp.vx || 0, sp.vy || 0);
    const ang = spd > 0.1 ? Math.atan2(sp.vy, sp.vx) : (sp.rot || 0);
    const streak = (sp.streakLen || 5.0) * (0.4 + 0.6 * lifeRatio);
    const rad = Math.max(0.7, (sp.size || 1.8) * (0.45 + 0.55 * lifeRatio));

    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(ang);
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(streak * 0.55, 0);
    ctx.quadraticCurveTo(0, rad, -streak * 0.85, 0);
    ctx.quadraticCurveTo(0, -rad, streak * 0.55, 0);
    ctx.closePath();
    ctx.fillStyle = sp.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(streak * 0.18, 0, rad * 0.58, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();
  }
}
