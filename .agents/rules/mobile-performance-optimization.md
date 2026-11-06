---
description: Mandatory mobile 60 FPS rendering and pre-baked sprite architecture standard modeled after Weapon Ball Z and Ball Fight League (Rule 35).
alwaysApply: true
---

# Mandatory Mobile 60 FPS Rendering & Pre-Baked Sprite Architecture Standard (Rule 35)

Whenever creating, scaffolding, optimizing, or modifying any fighter skin (`js/graphics/fighters/*Skin.js`), weapon renderer (`js/graphics/weapons/*WeaponGraphics.js`), particle/effect renderer, or HUD component, the agent **MUST ALWAYS** enforce the **Mobile 60 FPS Pre-Baked Sprite Architecture** documented in [`docs/MOBILE_OPTIMIZATION_BLUEPRINT.md`](../../docs/MOBILE_OPTIMIZATION_BLUEPRINT.md).

## 1. 100% Pre-Baked Offscreen Canvas Quads (Zero Uncached `for (gy) for (gx)` Loops)
- Mobile tile-based GPUs (Qualcomm Adreno, ARM Mali, Apple TBDR) stall when tessellating rotated `ctx.fillRect(px, py, 2, 2)` calls every frame because rotated `fillRect` calls become 4-vertex anti-aliased polygons instead of hardware axis-aligned fills.
- **STRICT PROHIBITION**: NEVER execute raw `for (let gy...) for (let gx...) ctx.fillRect(...)` pixel-grid loops directly onto the live game `ctx` during the 60 FPS render loop.
- Every fighter body skin, pixel hand (`drawPixelHand`), and pixel-grid weapon/orb MUST bake its pixel grid once into an offscreen `<canvas>` cache and blit it onto `ctx` via a single `ctx.drawImage(cachedCanvas, ...)` quad call (2 triangles on the GPU).

## 2. Pre-Baked Radial Glows Over Per-Frame Gradient Allocations
- Calling `ctx.createRadialGradient(...)` or `ctx.createLinearGradient(...)` inside 60 FPS projectile, aura, or particle loops allocates new gradient shader objects and lookup table (LUT) textures every frame.
- Always bake radial glows into reusable offscreen canvases (`128x128` cached glow sprites) and blit via `ctx.drawImage()` with `ctx.globalAlpha`.

## 3. Dirty-Flagged Full-Screen Secondary Canvases
- Secondary full-screen `540x960` canvases (`flameCanvas` in `js/graphics/canvasManager.js`, `topLevelUiCanvas` in `js/systems/renderSystem.js`) MUST remain gated by dirty flags (`_flameCanvasDirty`, `state._topLevelUiDirty`) so idle frames perform zero full-screen `clearRect` or `drawImage` blits.

## 4. Lazy On-Demand Asset Loading & 2-Slot Mip Caching
- Preserve lazy on-demand image decoding and 2-slot pre-scaled mip canvas caching (`img._mip0`, `img._mip1`) in `js/graphics/mobileAssetScaler.js` so `Assets/model/`, `Assets/character/`, and `Assets/effects/` sprites decode only when first drawn and never overwhelm mobile WebView memory at startup.

## 5. Mobile HUD & CSS Compositor Fast-Path
- Keep `.hud-top-profile__canvas` sized at `160x160` on mobile (`state.isMobileDevice`) with proportional `resScale = w / 1400` in `renderTopHudProfileCanvas()`.
- Never apply multi-pass CSS `filter: drop-shadow(...)` or `backdrop-filter: blur(...)` rules to animated HUD overlays on mobile (`body.mobile-device`).

