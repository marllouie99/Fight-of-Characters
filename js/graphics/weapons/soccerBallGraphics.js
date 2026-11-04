// ─────────────────────────────────────────────
// CENTRALIZED BLUE LOCK SOCCER BALL & KICK VFX SYSTEM
// Shared 16-Bit 3D Telstar Ball Rasterizer, 12-Frame Kick Impacts,
// Concentric Shockwaves, 16-Bit Hit Bursts, and Ego Particles
//
// Complies with:
// - Rule 11: Prohibition of shadowBlur CPU filters
// - Rule 19: Upright Minimalist Manga Aesthetic
// - Rule 24: Toji Reference Standard Geometry
// - Rule 25: Non-Freezing Active Visual Effects Decay
// - Rule 26: Clean Concentric Shockwaves (No Cobweb / Mesh Lines)
// ─────────────────────────────────────────────

/**
 * Draws a stylized procedural puzzle piece (Ego Shard) particle.
 * Can be themed per Blue Lock character (Isagi Cyan, Rin Teal/Violet, Bachira Yellow, etc.).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {number} angle
 * @param {string} [color='#00F0FF']
 * @param {number} [alpha=1.0]
 */
export function drawPuzzlePiece(ctx, x, y, size, angle, color = '#00F0FF', alpha = 1.0) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  const s = size / 2;
  const tab = s * 0.45;

  ctx.beginPath();
  // Top edge with protruding tab
  ctx.moveTo(-s, -s);
  ctx.lineTo(-tab, -s);
  ctx.arc(0, -s, tab, Math.PI, 0, false);
  ctx.lineTo(s, -s);

  // Right edge with protruding tab
  ctx.lineTo(s, -tab);
  ctx.arc(s, 0, tab, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineTo(s, s);

  // Bottom edge with indented socket
  ctx.lineTo(tab, s);
  ctx.arc(0, s, tab, 0, Math.PI, true);
  ctx.lineTo(-s, s);

  // Left edge with indented socket
  ctx.lineTo(-s, tab);
  ctx.arc(-s, 0, tab, Math.PI / 2, -Math.PI / 2, true);
  ctx.closePath();

  // Solid fill and dark manga ink outline
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();

  ctx.restore();
}

// ─────────────────────────────────────────────
// 16-BIT 3D TELSTAR SOCCER BALL RASTERIZER
// True 3D Truncated Icosahedron (12 Black Pentagons + 20 White Hexagons + 90 Seams)
// Full 360° 3-Axis Spherical Rolling (Pitch, Yaw, Roll) in 16-Bit Pixel Art
// ─────────────────────────────────────────────

/**
 * Precomputes unit-sphere 3D Truncated Icosahedron geometry once at module load:
 * - 12 Black Pentagons centered at 12 vertices of a regular icosahedron
 * - 60 Pentagon corner vertices (truncated at tCut = 0.355 along icosahedron edges)
 * - 5 inward-pointing half-space normal vectors per pentagon for fast 3D inclusion testing
 * - 90 Seam edges (60 pentagon edges + 30 hexagon-to-hexagon edges) with spherical midpoints
 */
const _SOCCER_BALL_3D_GEO = (() => {
  const tCut = 0.355;
  const s5 = Math.sqrt(5);
  const cLat = 1 / s5;
  const sLat = 2 / s5;
  const V = [];

  // 0: Front Pole (+Z)
  V.push([0, 0, 1]);
  // 1..5: Northern hemisphere ring
  for (let k = 0; k < 5; k++) {
    const th = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    V.push([sLat * Math.cos(th), sLat * Math.sin(th), cLat]);
  }
  // 6..10: Southern hemisphere ring
  for (let k = 0; k < 5; k++) {
    const ph = -Math.PI / 2 + ((k + 0.5) * 2 * Math.PI) / 5;
    V.push([sLat * Math.cos(ph), sLat * Math.sin(ph), -cLat]);
  }
  // 11: Back Pole (-Z)
  V.push([0, 0, -1]);

  function norm(v) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  const pentagons = [];
  const cornerMap = {};
  const icoEdges = [];

  for (let i = 0; i < 12; i++) {
    const vi = V[i];
    const up = Math.abs(vi[2]) < 0.9 ? [0, 0, 1] : [0, -1, 0];
    const e1 = norm(cross(up, vi));
    const e2 = norm(cross(vi, e1));

    const neighbors = [];
    for (let j = 0; j < 12; j++) {
      if (i === j) continue;
      if (dot(vi, V[j]) > 0.40) {
        const ang = Math.atan2(dot(V[j], e2), dot(V[j], e1));
        neighbors.push({ j, ang });
        if (i < j) icoEdges.push([i, j]);
      }
    }
    neighbors.sort((a, b) => a.ang - b.ang);

    const corners = [];
    for (let m = 0; m < 5; m++) {
      const j = neighbors[m].j;
      const vj = V[j];
      const c = norm([
        (1 - tCut) * vi[0] + tCut * vj[0],
        (1 - tCut) * vi[1] + tCut * vj[1],
        (1 - tCut) * vi[2] + tCut * vj[2]
      ]);
      corners.push(c);
      cornerMap[i + '_' + j] = c;
    }

    const edgeNormals = [];
    for (let m = 0; m < 5; m++) {
      const c0 = corners[m];
      const c1 = corners[(m + 1) % 5];
      let n = norm(cross(c0, c1));
      if (dot(n, vi) < 0) n = [-n[0], -n[1], -n[2]];
      edgeNormals.push(n);
    }

    pentagons.push({ center: vi, corners, edgeNormals });
  }

  const seamEdges = [];
  function addSeam(u, v) {
    const m = norm([u[0] + v[0], u[1] + v[1], u[2] + v[2]]);
    seamEdges.push({ u, m, v });
  }

  for (let i = 0; i < 12; i++) {
    const corners = pentagons[i].corners;
    for (let m = 0; m < 5; m++) {
      addSeam(corners[m], corners[(m + 1) % 5]);
    }
  }
  for (let k = 0; k < icoEdges.length; k++) {
    const i = icoEdges[k][0];
    const j = icoEdges[k][1];
    addSeam(cornerMap[i + '_' + j], cornerMap[j + '_' + i]);
  }

  return { pentagons, seamEdges };
})();

/**
 * Advances the soccer ball's 3x3 orthonormal rotation matrix in 3D space
 * based on its 2D velocity vector (vx, vy) and axial spin (rotSpeed / rotation).
 * Ensures the ball rolls and tumbles in all 3D directions rather than flat 2D rotation.
 *
 * @param {object} proj - Soccer ball projectile object
 * @param {number} [stepDx] - Displacement delta X
 * @param {number} [stepDy] - Displacement delta Y
 * @returns {boolean} True if the 3D orientation changed since last render
 */
export function stepSoccerBall3DRotation(proj, stepDx, stepDy) {
  if (!proj) return false;
  if (!proj._rotMatrix) {
    proj._rotMatrix = [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ];
    proj._lastStepX = proj.x || 0;
    proj._lastStepY = proj.y || 0;
    proj._lastStepRot = proj.rotation || 0;
    proj._needs3DRender = true;
  }

  let dx = stepDx !== undefined ? stepDx : ((proj.x || 0) - proj._lastStepX);
  let dy = stepDy !== undefined ? stepDy : ((proj.y || 0) - proj._lastStepY);
  let dRot = (proj.rotation || 0) - proj._lastStepRot;

  proj._lastStepX = proj.x || 0;
  proj._lastStepY = proj.y || 0;
  proj._lastStepRot = proj.rotation || 0;

  const moveDist = Math.hypot(dx, dy);
  if (moveDist < 0.001 && Math.abs(dRot) < 0.001) {
    return false;
  }

  const r = proj.r || 16;
  let M = proj._rotMatrix;

  // 1. Pure Rolling Rotation around surface contact axis: axis = [-dy, dx, 0]
  if (moveDist > 0.001) {
    const rollAngle = moveDist / r;
    const ax = -dy / moveDist;
    const ay = dx / moveDist;
    M = _multiplyRotMatrix(M, _axisAngleMatrix(ax, ay, 0, rollAngle));
  }

  // 2. Axial Spin / Curve Ball Rotation around Z axis (perpendicular to turf)
  if (Math.abs(dRot) > 0.001) {
    M = _multiplyRotMatrix(M, _axisAngleMatrix(0, 0, 1, dRot));
  }

  // Re-orthonormalize matrix to eliminate floating point drift
  proj._rotMatrix = _orthonormalize3x3(M);
  proj._needs3DRender = true;
  return true;
}

function _axisAngleMatrix(x, y, z, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  return [
    t * x * x + c,     t * x * y - s * z, t * x * z + s * y,
    t * x * y + s * z, t * y * y + c,     t * y * z - s * x,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c
  ];
}

function _multiplyRotMatrix(A, B) {
  const R = new Array(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      R[r * 3 + c] =
        A[r * 3 + 0] * B[0 * 3 + c] +
        A[r * 3 + 1] * B[1 * 3 + c] +
        A[r * 3 + 2] * B[2 * 3 + c];
    }
  }
  return R;
}

function _orthonormalize3x3(M) {
  let r0 = [M[0], M[1], M[2]];
  let r1 = [M[3], M[4], M[5]];
  let l0 = Math.hypot(r0[0], r0[1], r0[2]) || 1;
  r0 = [r0[0] / l0, r0[1] / l0, r0[2] / l0];

  const dot01 = r0[0] * r1[0] + r0[1] * r1[1] + r0[2] * r1[2];
  r1 = [r1[0] - dot01 * r0[0], r1[1] - dot01 * r0[1], r1[2] - dot01 * r0[2]];
  let l1 = Math.hypot(r1[0], r1[1], r1[2]) || 1;
  r1 = [r1[0] / l1, r1[1] / l1, r1[2] / l1];

  const r2 = [
    r0[1] * r1[2] - r0[2] * r1[1],
    r0[2] * r1[0] - r0[0] * r1[2],
    r0[0] * r1[1] - r0[1] * r1[0]
  ];

  return [
    r0[0], r0[1], r0[2],
    r1[0], r1[1], r1[2],
    r2[0], r2[1], r2[2]
  ];
}

/**
 * Renders the true 3D spherical Telstar soccer ball onto an offscreen 16-bit pixel canvas.
 * Complies with Rule 19 & Rule 24:
 * - Quantized pixel grid (P = 1.0 or 1.5)
 * - 4-neighbor attached outer manga border (#0E0F14)
 * - Diffuse spherical lighting with top-left keylight and soft bottom-right ambient bounce
 * - 12 Black Pentagons & 90 curved seam edges
 */
function _render3D16BitSoccerBallToCanvas(destCanvas, r, isDirectVolley = false, rotM = null) {
  const P = 1.0;
  const snapR = Math.round(r);
  const size = (snapR + 2) * 2;
  if (destCanvas.width !== size || destCanvas.height !== size) {
    destCanvas.width = size;
    destCanvas.height = size;
  }
  const destCtx = destCanvas.getContext('2d');
  destCtx.clearRect(0, 0, size, size);
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;

  const cx = size / 2;
  const cy = size / 2;

  const M = rotM || [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const invM = [
    M[0], M[3], M[6],
    M[1], M[4], M[7],
    M[2], M[5], M[8]
  ];

  function toBody(wx, wy, wz) {
    return [
      invM[0] * wx + invM[1] * wy + invM[2] * wz,
      invM[3] * wx + invM[4] * wy + invM[5] * wz,
      invM[6] * wx + invM[7] * wy + invM[8] * wz
    ];
  }

  const lx = -0.577;
  const ly = -0.577;
  const lz = 0.577;

  const visiblePentagons = [];
  const pentagons = _SOCCER_BALL_3D_GEO.pentagons;
  for (let i = 0; i < 12; i++) {
    const c = pentagons[i].center;
    const wx = M[0] * c[0] + M[1] * c[1] + M[2] * c[2];
    const wy = M[3] * c[0] + M[4] * c[1] + M[5] * c[2];
    const wz = M[6] * c[0] + M[7] * c[1] + M[8] * c[2];
    if (wz > -0.32) {
      visiblePentagons.push(pentagons[i]);
    }
  }

  const visibleSeams = [];
  const seamEdges = _SOCCER_BALL_3D_GEO.seamEdges;
  for (let k = 0; k < seamEdges.length; k++) {
    const s = seamEdges[k];
    const mx = M[0] * s.m[0] + M[1] * s.m[1] + M[2] * s.m[2];
    const my = M[3] * s.m[0] + M[4] * s.m[1] + M[5] * s.m[2];
    const mz = M[6] * s.m[0] + M[7] * s.m[1] + M[8] * s.m[2];
    if (mz > -0.15) {
      visibleSeams.push(s);
    }
  }

  const R2 = snapR * snapR;
  const rInv = 1.0 / snapR;

  for (let py = 0; py < size; py += P) {
    const dy = (py + P / 2) - cy;
    const dy2 = dy * dy;
    if (dy2 > R2) continue;

    for (let px = 0; px < size; px += P) {
      const dx = (px + P / 2) - cx;
      const d2 = dx * dx + dy2;
      if (d2 > R2) continue;

      const isBorder =
        ((dx + P) * (dx + P) + dy2 > R2) ||
        ((dx - P) * (dx - P) + dy2 > R2) ||
        (dx * dx + (dy + P) * (dy + P) > R2) ||
        (dx * dx + (dy - P) * (dy - P) > R2);

      if (isBorder) {
        destCtx.fillStyle = '#0E0F14';
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      const wz = Math.sqrt(Math.max(0, R2 - d2));
      const nx = dx * rInv;
      const ny = dy * rInv;
      const nz = wz * rInv;

      const normLight = nx * lx + ny * ly + nz * lz;
      const bVec = toBody(nx, ny, nz);

      let isPentagon = false;
      for (let i = 0; i < visiblePentagons.length; i++) {
        const pent = visiblePentagons[i];
        const pcen = pent.center;
        if (bVec[0] * pcen[0] + bVec[1] * pcen[1] + bVec[2] * pcen[2] > 0.82) {
          const norms = pent.edgeNormals;
          let inside = true;
          for (let m = 0; m < 5; m++) {
            const en = norms[m];
            if (bVec[0] * en[0] + bVec[1] * en[1] + bVec[2] * en[2] < 0) {
              inside = false;
              break;
            }
          }
          if (inside) {
            isPentagon = true;
            break;
          }
        }
      }

      let isSeam = false;
      if (!isPentagon) {
        for (let k = 0; k < visibleSeams.length; k++) {
          const s = visibleSeams[k];
          const sm = s.m;
          if (bVec[0] * sm[0] + bVec[1] * sm[1] + bVec[2] * sm[2] > 0.94) {
            const u = s.u;
            const v = s.v;
            const sux = bVec[0] - u[0];
            const suy = bVec[1] - u[1];
            const suz = bVec[2] - u[2];
            const evx = v[0] - u[0];
            const evy = v[1] - u[1];
            const evz = v[2] - u[2];
            const segLen2 = evx * evx + evy * evy + evz * evz || 1;
            const projT = Math.max(0, Math.min(1, (sux * evx + suy * evy + suz * evz) / segLen2));
            const cxp = u[0] + projT * evx;
            const cyp = u[1] + projT * evy;
            const czp = u[2] + projT * evz;
            const dist2 = (bVec[0] - cxp) * (bVec[0] - cxp) +
                          (bVec[1] - cyp) * (bVec[1] - cyp) +
                          (bVec[2] - czp) * (bVec[2] - czp);
            if (dist2 < 0.0038) {
              isSeam = true;
              break;
            }
          }
        }
      }

      if (isPentagon) {
        if (isDirectVolley) {
          destCtx.fillStyle = (normLight > 0.25) ? '#00F0FF' : '#0369A1';
        } else {
          if (normLight > 0.35) destCtx.fillStyle = '#27272A';
          else if (normLight > -0.10) destCtx.fillStyle = '#18181B';
          else destCtx.fillStyle = '#09090B';
        }
      } else if (isSeam) {
        destCtx.fillStyle = '#0E0F14';
      } else {
        if (normLight > 0.35) destCtx.fillStyle = '#FFFFFF';
        else if (normLight > -0.40) destCtx.fillStyle = '#F8FAFC';
        else destCtx.fillStyle = '#E2E8F0';
      }
      destCtx.fillRect(px, py, P, P);
    }
  }

  destCtx.restore();
}

/**
 * Draws a 3D all-around rotating 16-bit retro arcade soccer ball projectile with customizable aura.
 * Supports arbitrary character theme colors (Isagi Cyan, Rin Teal/Violet, Bachira Yellow, etc.).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} proj - Projectile / soccer ball object
 * @param {object} [options={}] - Custom rendering overrides
 * @param {string} [options.auraColor] - Custom aura color (defaults to kicker theme color or '#00F0FF')
 * @param {string} [options.superAuraColor] - Custom super shot aura color (defaults to '#00FF88')
 */
export function drawSoccerBallProjectile(ctx, proj, options = {}) {
  if (!proj) return;
  const x = proj.x;
  const y = proj.y;
  const r = proj.r || 16;
  const isDirectVolley = Boolean(proj.isDirectVolley || proj.isStriker || proj.isSuperShot || proj.isSpecialKick);
  const isKicked = Boolean(proj.isKickedByIsagi || proj.isKicked || proj.lastKicker);

  // Step 3D rotation matrix if position/rotation changed since last step
  stepSoccerBall3DRotation(proj);

  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    if (!proj._ball3DCanvas) {
      proj._ball3DCanvas = document.createElement('canvas');
      proj._needs3DRender = true;
    }
    if (proj._needs3DRender || proj._lastRenderedR !== r || proj._lastRenderedVolley !== isDirectVolley) {
      _render3D16BitSoccerBallToCanvas(proj._ball3DCanvas, r, isDirectVolley, proj._rotMatrix);
      proj._lastRenderedR = r;
      proj._lastRenderedVolley = isDirectVolley;
      proj._needs3DRender = false;
    }
  }

  ctx.save();
  ctx.translate(x, y);

  // 1. 16-Bit Ego Aura Glow & Dribble Control Rings (Rule 11 Compliant - Zero shadowBlur)
  if (proj.dribbler && proj.dribbler.hp > 0 && !proj.dribbler.isDead) {
    const dribbleColor = options.auraColor || proj.dribbler.themeColor || proj.dribbler.color || '#00F0FF';
    const control = proj.effectiveControl !== undefined ? proj.effectiveControl : 0.85;

    // Outer turf control disc
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.25 + control * 0.25), 0, Math.PI * 2);
    ctx.fillStyle = dribbleColor.startsWith('#')
      ? `${dribbleColor}20`
      : 'rgba(0, 240, 255, 0.12)';
    ctx.fill();

    // High Control inner magnetized ring (Isagi 96% / Chigiri 90%+)
    if (control >= 0.90) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = dribbleColor.startsWith('#')
        ? `${dribbleColor}44`
        : 'rgba(0, 240, 255, 0.26)';
      ctx.stroke();
    }
  } else if (isKicked) {
    const kickerColor = options.auraColor || proj.kickerThemeColor || (proj.lastKicker?.color) || '#00F0FF';
    const superColor = options.superAuraColor || '#00FF88';

    if (isDirectVolley) {
      // Supersonic Flow Aura (Double concentric discs)
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = kickerColor.startsWith('#')
        ? `${kickerColor}28` // ~16% alpha
        : 'rgba(0, 240, 255, 0.16)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = superColor.startsWith('#')
        ? `${superColor}47` // ~28% alpha
        : 'rgba(0, 255, 136, 0.28)';
      ctx.fill();
    } else {
      // Normal Kick Aura
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
      ctx.fillStyle = kickerColor.startsWith('#')
        ? `${kickerColor}26` // ~15% alpha
        : 'rgba(0, 240, 255, 0.15)';
      ctx.fill();
    }
  }

  // 2. Blit 16-Bit 3D Rotating Soccer Ball
  ctx.imageSmoothingEnabled = false;

  if (proj._ball3DCanvas && proj._ball3DCanvas.width > 0) {
    const size = proj._ball3DCanvas.width;
    ctx.drawImage(proj._ball3DCanvas, -size / 2, -size / 2);
  } else {
    // Fallback if canvas creation failed in headless mode
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#0E0F14';
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws Metavision / Spatial Awareness aim reticle & spatial puzzle grid when winding up special kicks.
 * Themed with character color (default '#00F0FF').
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter
 * @param {object} opponent
 * @param {number} progress - 0.0 to 1.0
 * @param {string} [themeColor='#00F0FF']
 */
export function drawMetavisionAimReticle(ctx, fighter, opponent, progress, themeColor = '#00F0FF') {
  if (!opponent || progress <= 0) return;

  ctx.save();
  const tx = opponent.x;
  const ty = opponent.y;
  const tr = opponent.r || 25;

  const alpha = Math.min(1, progress * 1.8);
  ctx.globalAlpha = alpha;

  // 1. Concentric Lock-On Target Rings
  const reticleR = tr + (1.0 - progress) * 28 + 6;
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = themeColor;

  ctx.beginPath();
  ctx.arc(tx, ty, reticleR, 0, Math.PI * 2);
  ctx.stroke();

  // 4 Corner brackets on reticle
  const bSize = 8;
  const corners = [
    [-reticleR, 0], [reticleR, 0], [0, -reticleR], [0, reticleR]
  ];
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) {
    const [cx, cy] = corners[i];
    ctx.beginPath();
    if (cx !== 0) {
      ctx.moveTo(tx + cx, ty + cy - bSize);
      ctx.lineTo(tx + cx, ty + cy + bSize);
    } else {
      ctx.moveTo(tx + cx - bSize, ty + cy);
      ctx.lineTo(tx + cx + bSize, ty + cy);
    }
    ctx.stroke();
  }

  // 2. Spatial Metavision Ray linking Kicker to Target
  if (fighter) {
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = themeColor;
    ctx.moveTo(fighter.x, fighter.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export const drawSoccerAimReticle = drawMetavisionAimReticle;

/**
 * Draws Supersonic Direct Volley Shockwave (Rule 26 Compliant - Zero cobwebs/radial spokes).
 * Staggered concentric compression rings expanding along non-linear power curve.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} wave - { x, y, maxR, progress, color, speed }
 */
export function drawDirectVolleyShockwave(ctx, wave) {
  if (!wave || wave.progress >= 1.0) return;

  ctx.save();
  const p = wave.progress;
  const maxR = wave.maxR || 90;
  const baseColor = wave.color || '#00F0FF';

  // Concentric wave staggered propagation offsets
  const ringOffsets = [0.0, 0.16, 0.32];
  const ringAlphaBase = (1.0 - Math.pow(p, 1.4));

  for (let k = 0; k < ringOffsets.length; k++) {
    const ringP = (p - ringOffsets[k]) / (1.0 - ringOffsets[k]);
    if (ringP <= 0 || ringP >= 1.0) continue;

    const ringRadius = maxR * Math.pow(ringP, 0.72);
    const ringAlpha = ringAlphaBase * (1.0 - ringP);

    ctx.beginPath();
    ctx.arc(wave.x, wave.y, ringRadius, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1.2, (3.2 * (1.0 - ringP)));
    ctx.strokeStyle = (k === 0) ? '#FFFFFF' : baseColor;
    ctx.globalAlpha = Math.max(0, Math.min(1, ringAlpha));
    ctx.stroke();

    // Subtle translucent expanding wash on leading wave disc
    if (k === 0) {
      ctx.fillStyle = baseColor.startsWith('#')
        ? `${baseColor}1F` // ~12% alpha
        : 'rgba(0, 240, 255, 0.12)';
      ctx.fill();
    }
  }

  ctx.restore();
}

export const drawStrikerShockwave = drawDirectVolleyShockwave;
export const drawSoccerShockwave = drawDirectVolleyShockwave;

// ─────────────────────────────────────────────
// 12-FRAME RETRO PIXEL ART KICK IMPACT ANIMATION (Rule 30 & Twelve-Frame Standard)
// ─────────────────────────────────────────────

const KICK_IMPACT_FRAME_COUNT = 12;
const KICK_IMPACT_FRAME_PATHS = Array.from({ length: 12 }, (_, i) =>
  `Assets/model/isagi/kick_impact/kick_impact-${i + 1}.png`
);

let _sharedKickImpactFrames = [];
let _sharedKickImpactFramesLoading = false;

/**
 * Returns cached 12-frame kick impact animation sprite sequence.
 * @returns {HTMLImageElement[]}
 */
export function getKickImpactFrames() {
  if (
    _sharedKickImpactFrames.length === KICK_IMPACT_FRAME_COUNT &&
    _sharedKickImpactFrames.every(img => img && img.complete && img.naturalWidth > 0)
  ) {
    return _sharedKickImpactFrames;
  }
  if (!_sharedKickImpactFramesLoading && typeof Image !== 'undefined') {
    _sharedKickImpactFramesLoading = true;
    _sharedKickImpactFrames = [];
    KICK_IMPACT_FRAME_PATHS.forEach((src, idx) => {
      const img = new Image();
      img.onload = () => {
        _sharedKickImpactFrames[idx] = img;
      };
      img.onerror = (e) => {
        console.warn(`Failed to load kick impact frame ${idx + 1} at ${src}:`, e);
      };
      img.src = `${src}?v=1`;
      _sharedKickImpactFrames[idx] = img;
    });
  }
  return _sharedKickImpactFrames;
}

// Backward-compatible alias
export const _getIsagiKickImpactFrames = getKickImpactFrames;

if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  getKickImpactFrames();
}

/**
 * Draws the 12-frame retro pixel art kick impact animation sprite.
 * Supports character theme scaling and volley sizing.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} impact - { x, y, angle, timer, maxTimer, isDirectVolley, scale }
 */
export function drawKickImpact(ctx, impact) {
  if (!impact || impact.timer <= 0) return;

  const p = Math.max(0, Math.min(1.0, 1.0 - (impact.timer / impact.maxTimer)));
  const frames = getKickImpactFrames();
  const frameIndex = Math.min(11, Math.max(0, Math.floor(p * 12)));
  const frameImg = frames[frameIndex];

  if (!frameImg || !frameImg.complete || frameImg.naturalWidth <= 0) {
    return;
  }

  ctx.save();
  ctx.translate(impact.x, impact.y);
  if (typeof impact.angle === 'number') {
    ctx.rotate(impact.angle);
  }

  const prevSmoothing = ctx.imageSmoothingEnabled;
  const prevAlpha = ctx.globalAlpha;
  ctx.imageSmoothingEnabled = false;

  // Natural fade-out on late dissipating frames (frames 1-9 solid, 10-12 dissolve)
  const fadeAlpha = p > 0.82 ? Math.max(0, (1.0 - p) / 0.18) : 1.0;
  ctx.globalAlpha = prevAlpha * fadeAlpha;

  // Scale calibrated to match soccer ball kick radius (scaled up for r=16 ball)
  const customScale = impact.scale || ((impact.isDirectVolley || impact.isStriker) ? 0.58 : 0.46);
  const drawW = 256 * customScale;
  const drawH = 256 * customScale;
  const anchorX = 128 * customScale;
  const anchorY = 128 * customScale;

  ctx.drawImage(frameImg, -anchorX, -anchorY, drawW, drawH);

  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.globalAlpha = prevAlpha;
  ctx.restore();
}

// Backward-compatible alias
export const drawIsagiKickImpact = drawKickImpact;

// ─────────────────────────────────────────────
// HARDCODED 16-BIT ENEMY HIT IMPACT EFFECT
// Stepped Pixel Flash, Quantized Diamond Shock & Debris
// ─────────────────────────────────────────────

/**
 * Draws a hardcoded 16-bit retro arcade hit impact effect.
 * Features discrete stepped pixel starburst, quantized shock diamond,
 * and 16-bit square debris particles (Zero shadowBlur - Rule 11).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} hit - { x, y, angle, timer, maxTimer, isDirectVolley, isCrit, color, particles }
 */
export function draw16BitHitImpact(ctx, hit) {
  if (!hit || hit.timer <= 0) return;

  const p = Math.max(0, Math.min(1.0, 1.0 - (hit.timer / hit.maxTimer)));
  const alpha = 1.0 - Math.pow(p, 1.5);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(hit.x, hit.y);
  if (typeof hit.angle === 'number') {
    ctx.rotate(hit.angle);
  }

  const isDirectVolley = Boolean(hit.isDirectVolley || hit.isStriker);
  const isCrit = !!hit.isCrit;
  const P = 2.0;
  const baseColor = hit.color || (isDirectVolley ? '#00FF88' : '#00F0FF');
  const accentColor = isCrit ? '#FACC15' : '#FFFFFF';

  // 1. Quantized Expanding Shock Diamond
  const diamondR = Math.round((8 + p * (isDirectVolley ? 36 : 22)) / P) * P;
  if (diamondR > 0 && alpha > 0.15) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(0, -diamondR);
    ctx.lineTo(diamondR * 1.2, 0);
    ctx.lineTo(0, diamondR);
    ctx.lineTo(-diamondR * 1.2, 0);
    ctx.closePath();
    ctx.fill();

    // Inner crisp white core diamond
    const innerR = Math.round((diamondR * 0.45) / P) * P;
    if (innerR > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(0, -innerR);
      ctx.lineTo(innerR * 1.2, 0);
      ctx.lineTo(0, innerR);
      ctx.lineTo(-innerR * 1.2, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Stepped 16-Bit Pixel Cross / Slash Rays
  const rayLen = Math.round((14 + (1.0 - Math.pow(p, 2.0)) * (isDirectVolley ? 44 : 26)) / P) * P;
  const rayThick = P * (isDirectVolley ? 2 : 1);

  ctx.save();
  ctx.globalAlpha = alpha;

  // Primary Cross (Horizontal & Vertical 16-Bit Beams)
  ctx.fillStyle = accentColor;
  ctx.fillRect(-rayLen, -rayThick / 2, rayLen * 2, rayThick);
  ctx.fillRect(-rayThick / 2, -rayLen, rayThick, rayLen * 2);

  // Secondary Diagonal Slash Ray
  ctx.fillStyle = baseColor;
  const diagLen = Math.round((rayLen * 0.65) / P) * P;
  for (let s = -diagLen; s <= diagLen; s += P) {
    ctx.fillRect(s, s, P, P);
    ctx.fillRect(s, -s, P, P);
  }
  ctx.restore();

  // 3. 16-Bit Discrete Square Debris Particles
  if (Array.isArray(hit.particles)) {
    ctx.save();
    for (let i = 0; i < hit.particles.length; i++) {
      const part = hit.particles[i];
      const partAlpha = Math.max(0, 1.0 - (p / 0.95));
      if (partAlpha <= 0.01) continue;

      const px = Math.round((part.vx * p * 28) / P) * P;
      const py = Math.round((part.vy * p * 28) / P) * P;
      const pSize = Math.max(P, Math.round(((part.size || 3) * (1.0 - p * 0.5)) / P) * P);

      ctx.globalAlpha = partAlpha;
      ctx.fillStyle = part.color || baseColor;
      ctx.fillRect(px, py, pSize, pSize);
    }
    ctx.restore();
  }

  ctx.restore();
}

// Backward-compatible alias
export const drawIsagi16BitHitImpact = draw16BitHitImpact;

/**
 * Draws the high-octane Blue Lock EGO Awakening Aura around a fighter.
 * Features concentric pulsing aura discs, crisp theme-colored boundary rings,
 * and orbiting procedural puzzle pieces (Ego Shards).
 *
 * Complies with:
 * - Rule 11: Prohibition of shadowBlur CPU filters (uses concentric transparent geometries)
 * - Rule 19: Upright Minimalist Manga Aesthetic
 * - Rule 24: Toji Baseline Proportions
 * - Rule 26: Clean Concentric Rings (Zero web meshes / spoke needles)
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter - Blue Lock fighter entity with active Ego
 */
export function drawBlueLockEgoAura(ctx, fighter) {
  if (!ctx || !fighter || !fighter.isEgoActive) return;

  const x = fighter.x;
  const y = fighter.y;
  const r = fighter.r || 25;
  const themeColor = fighter.color || '#00F0FF';
  const timer = fighter._egoAuraTimer || 0;

  ctx.save();
  ctx.translate(x, y);

  // 1. Concentric Pulsing Outer Aura Discs (Zero shadowBlur - layered semi-transparency)
  const pulse1 = Math.sin(timer * 0.08) * 0.12 + 0.88;
  const pulse2 = Math.cos(timer * 0.11) * 0.12 + 0.88;

  // Outer ethereal aura wash
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.55 * pulse1, 0, Math.PI * 2);
  ctx.fillStyle = themeColor;
  ctx.globalAlpha = 0.10;
  ctx.fill();

  // Mid-density inner aura flame
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.28 * pulse2, 0, Math.PI * 2);
  ctx.fillStyle = themeColor;
  ctx.globalAlpha = 0.18;
  ctx.fill();

  // 2. Crisp Supersonic Ionization Ring
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.38 * pulse1, 0, Math.PI * 2);
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.45;
  ctx.stroke();

  // 3. Orbiting Procedural Ego Shards (Puzzle Pieces)
  const shardCount = 4;
  const orbitR = r * 1.62;
  for (let i = 0; i < shardCount; i++) {
    const orbitAngle = (timer * 0.04) + (i * (Math.PI * 2 / shardCount));
    const sx = Math.cos(orbitAngle) * orbitR;
    const sy = Math.sin(orbitAngle) * orbitR * 0.82; // Perspective oval
    const pieceSize = 7 + (i % 2) * 2;
    drawPuzzlePiece(ctx, sx, sy, pieceSize, orbitAngle + Math.PI / 4, themeColor, 0.75);
  }

  ctx.restore();
}

// Backward-compatible alias
export const drawIsagiEgoAura = drawBlueLockEgoAura;
