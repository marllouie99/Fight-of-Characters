---
name: mobile-60fps-optimizer
description: Enforce Weapon Ball Z & Ball Fight League mobile 60 FPS rendering optimizations (Rule 35), offscreen sprite caching for pixel grids/hands/weapons, pre-baked radial glows, dirty-flagged canvases, lazy asset scaling, and mobile HUD fast-paths. Refer to docs/MOBILE_OPTIMIZATION_BLUEPRINT.md.
---

# Mobile 60 FPS Optimizer Skill (*Weapon Ball Z* & *Ball Fight League* Architecture)

Use this skill whenever creating, optimizing, or reviewing fighter skins, weapon graphics, particle effects, HUD layouts, or mobile performance in **Circle Mini-Battle**.

> **Primary Reference Document**: Always read [`docs/MOBILE_OPTIMIZATION_BLUEPRINT.md`](../../../docs/MOBILE_OPTIMIZATION_BLUEPRINT.md) for the complete forensic APK breakdown, file-by-file targets, and code templates.

---

## Core Optimization Rules (Rule 35)

### 1. Bake All `(gx, gy)` Pixel Grids into Offscreen Canvases (`ctx.drawImage`)
- **Why**: In *Weapon Ball Z* and *Ball Fight League*, every ball, outline, hand, and weapon is a pre-baked sprite quad (2 triangles). On mobile tile-based GPUs (Adreno/Mali), running `for (let gy...) for (let gx...) ctx.fillRect(px, py, 2, 2)` under `ctx.rotate(angle)` forces the browser to tessellate hundreds of 4-vertex polygons per frame.
- **Rule**: Never run uncached `for (gy) for (gx)` pixel loops on the live game `ctx`. Render the pixel grid once onto an offscreen `<canvas>` and blit via `ctx.drawImage(cachedCanvas, -halfW, -halfH)`.
- **Applies To**:
  - Fighter skins (`js/graphics/fighters/*Skin.js`)
  - Pixel hands (`drawPixelHand` in `js/graphics/renderers/fighterRenderer.js`)
  - Weapon pixel grids (`js/graphics/weapons/*WeaponGraphics.js`)

### 2. Replace Per-Frame `createRadialGradient` Calls with Cached Glow Canvases
- **Why**: Allocating `ctx.createRadialGradient()` or `ctx.createLinearGradient()` inside 60 FPS projectile/particle loops compiles gradient LUTs every frame.
- **Rule**: Bake radial glows once into a `128x128` offscreen `<canvas>` keyed by color stops and blit via `ctx.drawImage(glowSprite, x - r, y - r, r * 2, r * 2)`.

### 3. Preserve Dirty-Flagged Full-Screen Canvas Layers
- Never clear or composite `540x960` secondary canvases (`flameCanvas`, `topLevelUiCanvas`, `webglOverlayCanvas`) unless content was actually drawn to them during the frame (`_flameCanvasDirty`, `state._topLevelUiDirty`).

### 4. Preserve Mobile Asset Scaler & HUD Fast-Paths
- Keep lazy on-demand `Image.src` assignment and 2-slot mip caching active in `js/graphics/mobileAssetScaler.js`.
- Keep mobile top HUD portrait canvases (`renderTopHudProfileCanvas` in `js/graphics/hudManager.js`) at `160x160` (`102 KB` VRAM) instead of desktop `1400x1400` (`7.84 MB` VRAM).
- Strip multi-pass CSS `filter: drop-shadow(...)` and `backdrop-filter: blur(...)` under `body.mobile-device` in `css/style.css`.

### 5. Pre-Battle Loading Curtain, GPU Pre-Warming & Object Pooling
- **Pre-Battle Loading Curtain (`SceneLoadingCurtain` Pattern)**: Before starting Round 1, decode and draw (`1x1` `ctx.drawImage`) only the active match fighters' sprite sheets and offscreen skin/weapon canvases behind a loading curtain so mobile GPUs upload textures before combat begins.
- **Object Pooling & Density Scaling (`SimplePool` / `DamagePopupPool` / `GhostTrail2D` Pattern)**: Reuse pooled projectiles/particles with swap-and-pop array removal, cap mobile floating damage texts via density scaling, and gate afterimage trails by minimum velocity and distance traveled.


