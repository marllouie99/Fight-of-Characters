// ─────────────────────────────────────────────
// ISAGI YOICHI WEAPON & COMBAT VFX GRAPHICS
// Soccer Ball Projectile, Metavision Puzzle Particles,
// Aim Lock Reticle, and Supersonic Direct Volley Blast
// Complies with Rule 11 (No shadowBlur), Rule 25 (Non-freezing decay),
// Rule 26 (Clean Concentric Shockwaves - No cobwebs), and Rule 24.
// ─────────────────────────────────────────────

/**
 * Draws a stylized procedural puzzle piece particle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {number} angle
 * @param {string} color
 * @param {number} alpha
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
 * Precomputes the unit-sphere 3D Truncated Icosahedron geometry once at module load:
 * - 12 Black Pentagons centered at the 12 vertices of a regular icosahedron
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
  const dRot = (proj.rotation || 0) - proj._lastStepRot;

  proj._lastStepX = proj.x || 0;
  proj._lastStepY = proj.y || 0;
  proj._lastStepRot = proj.rotation || 0;

  const r = Math.max(8, proj.r || 16);
  const rollScale = 1 / (r * 0.82);

  // Pure physical no-slip ball rolling:
  // When moving by (dx, dy) across the floor, the sphere rolls strictly around the horizontal
  // axle perpendicular to velocity: axis = (-dy, +dx, 0), with zero flat 2D Z-axis spin.
  let wx = -dy * rollScale;
  let wy = dx * rollScale;
  const wz = 0;

  // Fallback only if stationary in place (e.g. in a static preview with no velocity)
  if (Math.hypot(dx, dy) < 0.001 && Math.abs(proj.vx || 0) < 0.001 && Math.abs(proj.vy || 0) < 0.001 && Math.abs(dRot) > 0.001) {
    wx = -dRot * 0.65;
    wy = dRot * 0.75;
  }

  const theta = Math.hypot(wx, wy, wz);
  if (theta < 0.002) {
    return !!proj._needs3DRender;
  }

  const kx = wx / theta;
  const ky = wy / theta;
  const kz = wz / theta;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const v = 1 - c;

  // Rodrigues' 3D rotation matrix R(k, theta)
  const r00 = kx * kx * v + c;
  const r01 = kx * ky * v - kz * s;
  const r02 = kx * kz * v + ky * s;
  const r10 = ky * kx * v + kz * s;
  const r11 = ky * ky * v + c;
  const r12 = ky * kz * v - kx * s;
  const r20 = kz * kx * v - ky * s;
  const r21 = kz * ky * v + kx * s;
  const r22 = kz * kz * v + c;

  const M = proj._rotMatrix;
  const n00 = r00 * M[0] + r01 * M[3] + r02 * M[6];
  const n01 = r00 * M[1] + r01 * M[4] + r02 * M[7];
  const n02 = r00 * M[2] + r01 * M[5] + r02 * M[8];

  const n10 = r10 * M[0] + r11 * M[3] + r12 * M[6];
  const n11 = r10 * M[1] + r11 * M[4] + r12 * M[7];
  const n12 = r10 * M[2] + r11 * M[5] + r12 * M[8];

  // Gram-Schmidt orthonormalization to prevent floating-point drift
  const l0 = Math.hypot(n00, n01, n02) || 1;
  const u0x = n00 / l0, u0y = n01 / l0, u0z = n02 / l0;

  const dot01 = u0x * n10 + u0y * n11 + u0z * n12;
  let u1x = n10 - dot01 * u0x;
  let u1y = n11 - dot01 * u0y;
  let u1z = n12 - dot01 * u0z;
  const l1 = Math.hypot(u1x, u1y, u1z) || 1;
  u1x /= l1; u1y /= l1; u1z /= l1;

  // Row 2 = Row 0 x Row 1
  const u2x = u0y * u1z - u0z * u1y;
  const u2y = u0z * u1x - u0x * u1z;
  const u2z = u0x * u1y - u0y * u1x;

  M[0] = u0x; M[1] = u0y; M[2] = u0z;
  M[3] = u1x; M[4] = u1y; M[5] = u1z;
  M[6] = u2x; M[7] = u2y; M[8] = u2z;

  proj._needs3DRender = true;
  return true;
}

/**
 * Rasterizes the 3D-rotated 16-bit Telstar soccer ball onto an offscreen canvas buffer.
 *
 * @param {HTMLCanvasElement|object} canvas - Reusable offscreen canvas
 * @param {number} r - Ball radius in pixels
 * @param {boolean} isDirectVolley - Whether charged with Direct Volley ego energy
 * @param {number[]} M - 9-element 3x3 rotation matrix
 */
function _render3D16BitSoccerBallToCanvas(canvas, r, isDirectVolley, M) {
  const P = 1.0;
  const rEff = r - 0.25; // Eliminates 1px cardinal nubs at top/bottom/left/right
  const steps = Math.ceil((r + P) / P);
  const size = (steps * 2 + 1) * P;

  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }

  const destCtx = canvas.getContext('2d');
  if (!destCtx) return;

  destCtx.clearRect(0, 0, size, size);
  destCtx.save();
  destCtx.imageSmoothingEnabled = false;
  destCtx.translate(size / 2, size / 2);

  // 1-Pixel Bresenham Seam Plotter
  const seamSet = new Set();
  function plotLine(x0, y0, x1, y1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let guard = 128;
    while (guard-- > 0) {
      seamSet.add(x0 + ',' + y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  function transformVec(v) {
    return [
      M[0] * v[0] + M[1] * v[1] + M[2] * v[2],
      M[3] * v[0] + M[4] * v[1] + M[5] * v[2],
      M[6] * v[0] + M[7] * v[1] + M[8] * v[2]
    ];
  }

  // Project visible 3D seam arcs onto front hemisphere (z >= 0)
  function plotArcSegment(p0, p1) {
    if (p0[2] < 0 && p1[2] < 0) return;
    let a = p0;
    let b = p1;
    if (a[2] < 0) {
      const t = a[2] / (a[2] - b[2]);
      const mx = a[0] + t * (b[0] - a[0]);
      const my = a[1] + t * (b[1] - a[1]);
      const ml = Math.hypot(mx, my) || 1;
      a = [mx / ml, my / ml, 0];
    } else if (b[2] < 0) {
      const t = b[2] / (b[2] - a[2]);
      const mx = b[0] + t * (a[0] - b[0]);
      const my = b[1] + t * (a[1] - b[1]);
      const ml = Math.hypot(mx, my) || 1;
      b = [mx / ml, my / ml, 0];
    }
    plotLine(a[0] * rEff, a[1] * rEff, b[0] * rEff, b[1] * rEff);
  }

  const seamEdges = _SOCCER_BALL_3D_GEO.seamEdges;
  for (let i = 0; i < seamEdges.length; i++) {
    const edge = seamEdges[i];
    const ru = transformVec(edge.u);
    const rm = transformVec(edge.m);
    const rv = transformVec(edge.v);
    plotArcSegment(ru, rm);
    plotArcSegment(rm, rv);
  }

  const pentagons = _SOCCER_BALL_3D_GEO.pentagons;

  // Discrete 16-Bit Spherical Pixel Rasterization Loop
  for (let gy = -steps; gy <= steps; gy++) {
    for (let gx = -steps; gx <= steps; gx++) {
      const rx = gx * P;
      const ry = gy * P;
      const dist = Math.hypot(rx, ry);
      if (dist > rEff) continue;

      const px = rx - P / 2;
      const py = ry - P / 2;

      // 4-neighbor boundary test for crisp outer 1-pixel rim
      const isBorder = (
        Math.hypot((gx + 1) * P, gy * P) > rEff ||
        Math.hypot((gx - 1) * P, gy * P) > rEff ||
        Math.hypot(gx * P, (gy + 1) * P) > rEff ||
        Math.hypot(gx * P, (gy - 1) * P) > rEff
      );

      if (isBorder) {
        destCtx.fillStyle = isDirectVolley ? '#00F0FF' : '#242C3A';
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      // Lift 2D pixel (rx, ry) onto the 3D visible front hemisphere (nz >= 0)
      const nx = rx / rEff;
      const ny = ry / rEff;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

      // Inverse-transform (M^T) into ball local 3D model space
      const lx = M[0] * nx + M[3] * ny + M[6] * nz;
      const ly = M[1] * nx + M[4] * ny + M[7] * nz;
      const lz = M[2] * nx + M[5] * ny + M[8] * nz;

      // Find nearest icosahedron vertex (pentagon center)
      let bestI = 0;
      let bestDot = -2;
      for (let i = 0; i < 12; i++) {
        const c = pentagons[i].center;
        const d = lx * c[0] + ly * c[1] + lz * c[2];
        if (d > bestDot) {
          bestDot = d;
          bestI = i;
        }
      }

      // 1. Check inclusion in nearest Black Pentagon using its 5 3D half-space normals
      let inPentagon = false;
      if (bestDot > 0.85) {
        inPentagon = true;
        const norms = pentagons[bestI].edgeNormals;
        for (let m = 0; m < 5; m++) {
          const n = norms[m];
          if (lx * n[0] + ly * n[1] + lz * n[2] < 0) {
            inPentagon = false;
            break;
          }
        }
      }

      if (inPentagon) {
        destCtx.fillStyle = isDirectVolley ? '#090E1A' : '#0F1116';
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      // 2. 1-Pixel Bresenham Seam Stitching
      if (seamSet.has(gx + ',' + gy)) {
        destCtx.fillStyle = isDirectVolley ? '#00F0FF' : '#0F1116';
        destCtx.fillRect(px, py, P, P);
        continue;
      }

      // 3. White Hexagonal Leather Panels with fixed top-left 3D spherical lighting
      const normLight = (-rx - ry) / (rEff * 1.414);
      if (isDirectVolley) {
        if (normLight > 0.35) destCtx.fillStyle = '#F0F9FF';
        else if (normLight > -0.35) destCtx.fillStyle = '#E0F2FE';
        else destCtx.fillStyle = '#BAE6FD';
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
 * Draws a 3D all-around rotating 16-bit retro arcade soccer ball projectile with ego aura.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} proj - Projectile object
 */
export function drawSoccerBallProjectile(ctx, proj) {
  const x = proj.x;
  const y = proj.y;
  const r = proj.r || 16;
  const isDirectVolley = !!proj.isDirectVolley;

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

  // 1. 16-Bit Ego Aura Glow (Rule 11 Compliant - Zero shadowBlur)
  if (proj.isKickedByIsagi) {
    if (isDirectVolley) {
      // Direct Volley: Supersonic flow aura
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 136, 0.28)';
      ctx.fill();
    } else {
      // Normal ego kick aura
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fill();
    }
  }

  // 2. Blit 16-Bit 3D Rotating Soccer Ball (unrotated blit keeps 16-bit pixel grid crisp)
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
 * Draws Metavision aim reticle & spatial puzzle grid when winding up Direct Volley.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} fighter
 * @param {object} opponent
 * @param {number} progress - 0.0 to 1.0
 */
export function drawMetavisionAimReticle(ctx, fighter, opponent, progress) {
  if (!opponent || progress <= 0) return;

  ctx.save();
  const tx = opponent.x;
  const ty = opponent.y;
  const tr = opponent.r || 25;

  const alpha = Math.min(1, progress * 1.8);
  ctx.globalAlpha = alpha;

  // 1. Direct Aim Vector line from Isagi to Target
  const angle = fighter.gunAngle || Math.atan2(ty - fighter.y, tx - fighter.x);
  const dist = Math.hypot(tx - fighter.x, ty - fighter.y);

  ctx.beginPath();
  ctx.setLineDash([8, 6]);
  ctx.moveTo(fighter.x, fighter.y);
  ctx.lineTo(tx, ty);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#00F0FF';
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // 2. Metavision Tactical Grid around Target
  ctx.save();
  ctx.translate(tx, ty);
  const reticleSize = tr * (2.2 - progress * 0.7); // Shrinks down into tight lock-on
  ctx.rotate(progress * Math.PI * 1.5);

  // Crosshair brackets
  const bLen = reticleSize * 0.35;
  ctx.strokeStyle = '#00FF88';
  ctx.lineWidth = 2.0;

  // 4 corner brackets
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 2);
    ctx.beginPath();
    ctx.moveTo(reticleSize - bLen, reticleSize);
    ctx.lineTo(reticleSize, reticleSize);
    ctx.lineTo(reticleSize, reticleSize - bLen);
    ctx.stroke();
    ctx.restore();
  }

  // Inner lock-on circle
  ctx.beginPath();
  ctx.arc(0, 0, reticleSize * 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();

  // 3. Floating Puzzle Pieces assembling onto target
  const pCount = 3;
  for (let i = 0; i < pCount; i++) {
    const pAngle = (i * 2 * Math.PI) / pCount + progress * 3;
    const pDist = tr * (2.0 - progress * 1.0);
    const px = tx + Math.cos(pAngle) * pDist;
    const py = ty + Math.sin(pAngle) * pDist;
    drawPuzzlePiece(ctx, px, py, 11, pAngle, '#00F0FF', alpha * 0.85);
  }

  ctx.restore();
}

/**
 * Draws concentric clean shockwave rings for Direct Volley (Rule 26 Compliant).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} wave - { x, y, maxR, progress, color }
 */
export function drawDirectVolleyShockwave(ctx, wave) {
  const { x, y, maxR, progress, color = '#00F0FF' } = wave;
  if (progress <= 0 || progress >= 1) return;

  ctx.save();
  ctx.translate(x, y);

  // Progressive wave expansion
  const currentR = maxR * Math.pow(progress, 0.65);
  const fadeOut = Math.pow(1 - progress, 1.25);

  // 1. Semi-transparent warm ego wash interior (Rule 26)
  ctx.beginPath();
  ctx.arc(0, 0, currentR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0, 240, 255, ${0.12 * fadeOut})`;
  ctx.fill();

  // 2. Supersonic leading core ring
  ctx.beginPath();
  ctx.arc(0, 0, currentR, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, 3.5 * fadeOut);
  ctx.strokeStyle = color;
  ctx.stroke();

  // 3. Inner ionization compression ring
  if (currentR > 12) {
    ctx.beginPath();
    ctx.arc(0, 0, currentR * 0.76, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1, 2.0 * fadeOut);
    ctx.strokeStyle = `rgba(0, 255, 136, ${0.8 * fadeOut})`;
    ctx.stroke();
  }

  ctx.restore();
}

// ─────────────────────────────────────────────
// 12-FRAME KICK IMPACT SPRITE ANIMATION
// Canonical Reference Architecture (The Reze Model)
// ─────────────────────────────────────────────

const ISAGI_KICK_IMPACT_FRAME_COUNT = 12;
const ISAGI_KICK_IMPACT_FRAME_PATHS = Array.from(
  { length: 12 },
  (_, i) => `Assets/model/isagi/kick_impact/kick_impact-${i + 1}.png`
);

let _isagiKickImpactFrames = [];
let _isagiKickImpactFramesLoading = false;

export function _getIsagiKickImpactFrames() {
  if (
    _isagiKickImpactFrames.length === ISAGI_KICK_IMPACT_FRAME_COUNT &&
    _isagiKickImpactFrames.every(img => img && img.complete && img.naturalWidth > 0)
  ) {
    return _isagiKickImpactFrames;
  }
  if (!_isagiKickImpactFramesLoading && typeof Image !== 'undefined') {
    _isagiKickImpactFramesLoading = true;
    _isagiKickImpactFrames = [];
    ISAGI_KICK_IMPACT_FRAME_PATHS.forEach((src, idx) => {
      const img = new Image();
      img.onload = () => {
        _isagiKickImpactFrames[idx] = img;
      };
      img.onerror = (e) => {
        console.warn(`Failed to load Isagi kick impact frame ${idx + 1} at ${src}:`, e);
      };
      img.src = `${src}?v=1`;
      _isagiKickImpactFrames[idx] = img;
    });
  }
  return _isagiKickImpactFrames;
}

// Proactive eager initialization in browser environment
if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  _getIsagiKickImpactFrames();
}

/**
 * Draws the 12-frame retro pixel art kick impact animation sprite.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} impact - { x, y, angle, timer, maxTimer, isDirectVolley }
 */
export function drawIsagiKickImpact(ctx, impact) {
  if (!impact || impact.timer <= 0) return;

  const p = Math.max(0, Math.min(1.0, 1.0 - (impact.timer / impact.maxTimer)));
  const frames = _getIsagiKickImpactFrames();
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
  // Direct Volley is slightly larger
  const scale = impact.isDirectVolley ? 0.58 : 0.46;
  const drawW = 256 * scale;
  const drawH = 256 * scale;
  const anchorX = 128 * scale;
  const anchorY = 128 * scale;

  ctx.drawImage(frameImg, -anchorX, -anchorY, drawW, drawH);

  // Restore context state cleanly (Rule 2.4 Stack Integrity)
  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.globalAlpha = prevAlpha;
  ctx.restore();
}

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
 * @param {object} hit - { x, y, angle, timer, maxTimer, isDirectVolley, isCrit, particles }
 */
export function drawIsagi16BitHitImpact(ctx, hit) {
  if (!hit || hit.timer <= 0) return;

  const p = Math.max(0, Math.min(1.0, 1.0 - (hit.timer / hit.maxTimer)));
  const alpha = 1.0 - Math.pow(p, 1.5);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(Math.round(hit.x), Math.round(hit.y));
  ctx.imageSmoothingEnabled = false;

  const P = 2.0; // 16-bit discrete pixel block unit
  const snap = (v) => Math.round(v / P) * P;

  const isDirect = !!hit.isDirectVolley;
  const isCrit = !!hit.isCrit;
  const baseColor = isDirect ? '#00FF88' : (isCrit ? '#FACC15' : '#00F0FF');
  const coreColor = '#FFFFFF';
  const inkColor = '#0E0F14';

  // ─── Phase 1: 16-Bit Quantized Stepped Starburst Flash (p: 0.0 -> 0.5) ───
  if (p < 0.5) {
    const flashProgress = p / 0.5;
    const flashAlpha = Math.sin(flashProgress * Math.PI) * alpha;
    ctx.globalAlpha = Math.max(0, Math.min(1, flashAlpha));

    const starScale = (isDirect ? 1.5 : 1.0) * (1.0 - flashProgress * 0.3);
    const armLen = snap(14 * starScale);
    const diagLen = snap(9 * starScale);
    const coreSize = snap(6 * starScale);

    // 1. Dark ink border backdrop (Rule 24 Manga Ink Outline)
    ctx.fillStyle = inkColor;
    ctx.fillRect(-coreSize / 2 - P, -coreSize / 2 - P, coreSize + P * 2, coreSize + P * 2);
    ctx.fillRect(-armLen - P, -P * 1.5, (armLen + P) * 2, P * 3);
    ctx.fillRect(-P * 1.5, -armLen - P, P * 3, (armLen + P) * 2);
    for (let d = -diagLen; d <= diagLen; d += P) {
      if (Math.abs(d) > P) {
        ctx.fillRect(d - P * 0.5, d - P * 0.5, P * 2, P * 2);
        ctx.fillRect(d - P * 0.5, -d - P * 0.5, P * 2, P * 2);
      }
    }

    // 2. Neon cyan / green theme fill
    ctx.fillStyle = baseColor;
    ctx.fillRect(-armLen, -P * 0.5, armLen * 2, P);
    ctx.fillRect(-P * 0.5, -armLen, P, armLen * 2);
    for (let d = -diagLen; d <= diagLen; d += P) {
      ctx.fillRect(d, d, P, P);
      ctx.fillRect(d, -d, P, P);
    }

    // 3. Pure white-hot core box
    ctx.fillStyle = coreColor;
    ctx.fillRect(-coreSize / 2, -coreSize / 2, coreSize, coreSize);
  }

  // ─── Phase 2: Expanding 16-Bit Stepped Pixel Shock Diamond (p: 0.1 -> 0.85) ───
  if (p >= 0.1 && p <= 0.85) {
    const waveP = (p - 0.1) / 0.75;
    const waveAlpha = (1.0 - waveP) * alpha;
    ctx.globalAlpha = Math.max(0, Math.min(1, waveAlpha));

    const maxR = isDirect ? 40 : 28;
    const radius = snap(maxR * Math.pow(waveP, 0.7));

    if (radius >= P * 2) {
      ctx.fillStyle = baseColor;
      for (let s = 0; s <= radius; s += P) {
        const rem = radius - s;
        ctx.fillRect(s, rem, P, P);
        ctx.fillRect(-s, rem, P, P);
        ctx.fillRect(s, -rem, P, P);
        ctx.fillRect(-s, -rem, P, P);
      }

      // If Direct Volley, secondary white inner diamond
      if (isDirect && radius >= P * 4) {
        ctx.fillStyle = coreColor;
        const innerR = snap(radius * 0.65);
        for (let s = 0; s <= innerR; s += P) {
          const rem = innerR - s;
          ctx.fillRect(s, rem, P, P);
          ctx.fillRect(-s, rem, P, P);
          ctx.fillRect(s, -rem, P, P);
          ctx.fillRect(-s, -rem, P, P);
        }
      }
    }
  }

  // ─── Phase 3: 16-Bit Square Pixel Sparks Debris ───
  if (hit.particles && hit.particles.length > 0) {
    for (let i = 0; i < hit.particles.length; i++) {
      const part = hit.particles[i];
      const partAlpha = Math.max(0, Math.min(1, (part.life / part.maxLife) * alpha));
      ctx.globalAlpha = partAlpha;

      const px = snap(part.x);
      const py = snap(part.y);
      const sz = snap(part.size || P);

      // Dark shadow pixel
      ctx.fillStyle = inkColor;
      ctx.fillRect(px + P, py + P, sz, sz);

      // Main pixel
      ctx.fillStyle = part.color || baseColor;
      ctx.fillRect(px, py, sz, sz);
    }
  }

  ctx.restore();
}
