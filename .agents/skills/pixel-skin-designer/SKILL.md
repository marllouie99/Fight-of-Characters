---
name: pixel-skin-designer
description: Design and code faceless, upright minimalist anime fighter skins, hair silhouettes, and weapon renderers adhering to repository art standards.
---

# Upright Minimalist Pixel Art Skin Playbook

Use this skill when designing or coding character skins, hair silhouettes, headwear, uniforms, and weapon renderers.

## Phase 1: Coordinate Frame & Upright POV Standards (Rule 19)
1. **Front Profile Upright POV**:
   - The fighter body model MUST always face the camera/player upright:
     - **`-Y` (Top)**: Hair crown, bangs, horns/crest, head accessories.
     - **`Y ~ 0` (Center)**: Eyewear (blindfolds, goggles, masks, stitches, scars).
     - **`+Y` (Bottom)**: Collar, neck opening, jacket/uniform, belt.
     - **`-X` / `+X` (Left / Right)**: Symmetrical ears, side hair locks, arms.
2. **Strict Facial Feature Prohibition**:
   - **NEVER** draw eyes, pupils, sclera, irises, eyelashes, mouths, lips, or nose bridges on fighter skins.
   - Convey identity exclusively through hair silhouettes, headwear/eyewear, iconic scars/stitches, and tailored clothing.

## Phase 2: Vertical Proportion Bands (Canonical Reference Trio — Toji, Sukuna & Gojo)
- **Primary Reference**: ALWAYS reference the Canonical Manga Ink Trio: Toji (`js/graphics/fighters/tojiSkin.js`), Sukuna (`js/graphics/fighters/sukunaSkin.js`), or Gojo (`js/graphics/fighters/gojoSkin.js`) as baseline blueprints.
- **`ry < r * 0.28` to `0.32` (`ny < 0.30`)**: Face & head clean skin tone dome (fair `#FEDBC0` or tan `#E8BD9B`, cheek contour `#E9B796` / `#D4A373`, forehead highlight `#FFF0E2`, scars/markings strictly bounded inside, zero baked hair, zero drawn mouths/eyes).
- **`r * 0.28 <= ry < r * 0.64` to `0.68`**: Collar, neck opening, compression shirt / uniform jacket / kimono robe (full body circle width `-r` to `+r`).
- **`r * 0.64 <= ry < r * 0.78`**: Waistband, belt, dark sash knot with ribbon split, patterned obi, or buckle frame.
- **`ry >= r * 0.78`**: Lower trousers, hakama pants, skirts with fly seam, pleat creases, and luminance $Y \ge 24$.

## Phase 3: Local Transform & Hand Layering
1. **Transform Setup**:
   ```javascript
   ctx.save();
   ctx.translate(fighter.x, fighter.y - (fighter.z || 0));
   const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle || 0);
   ctx.rotate(angle);
   if (Math.abs(angle) > Math.PI / 2) {
     ctx.scale(1, -1); // Keep hair on top and body on bottom when facing left
   }
   ```
2. **Canonical Default Hand Positioning Standard**:
   - **Neutral Body Standard (Zero Floating Hands)**: Just like Toji, Gojo, and Sukuna, character body skin functions (`draw[Name]Skin`) **MUST NEVER render loose, static, disembodied hands (`drawPixelHand`) glued to the neutral body circle**. Neutral moving and idle sprites are clean circular manga figures.
   - **Weapon Grips & Combat Strikes (Only When Wielding / Striking)**:
     - **Main-Hand Weapon Anchor**: Main-hand weapon hilt anchors at `(+r * 0.82, +r * 0.38)` during idle/rest, with the right hand (`drawPixelHand`) drawn directly over the grip in weapon local space.
     - **Off-Hand / Dual-Wield Anchor**: Off-hand anchors at `(-r * 0.82, +r * 0.38)` with the left hand drawn directly over the grip.

## Phase 4: Mandatory Offscreen Canvas Caching Pattern (Canonical Trio Standard)
- **STRICT PROHIBITION**: NEVER call per-pixel `ctx.fillRect(px, py, P, P)` loops directly in the game loop while the canvas is rotated (`ctx.rotate(angle)`). Rotated sub-pixel rectangles create ugly "crisscross white grid lines / screen-door artifacts" and cause severe frame drops.
- **The Canonical Architecture (Canonical Trio Standard — `tojiSkin.js`, `sukunaSkin.js`, `gojoSkin.js`)**:
  ```javascript
  let _cachedCanvas = null;
  let _cachedR = 0;

  function _renderPixelBodyToCanvas(destCtx, r) {
    destCtx.imageSmoothingEnabled = false;
    const P = 2.0;
    const steps = Math.ceil((r + P) / P);
    const cx = destCtx.canvas.width / 2;
    const cy = destCtx.canvas.height / 2;

    destCtx.save();
    destCtx.translate(cx, cy);

    for (let gy = -steps; gy <= steps; gy++) {
      for (let gx = -steps; gx <= steps; gx++) {
        const rx = gx * P;
        const ry = gy * P;
        if (Math.hypot(rx, ry) > r) continue;

        const px = rx - P / 2;
        const py = ry - P / 2;

        // 4-neighbor attached border test for solid dark manga ink outline
        const isBorder = (
          Math.hypot((gx + 1) * P, gy * P) > r ||
          Math.hypot((gx - 1) * P, gy * P) > r ||
          Math.hypot(gx * P, (gy + 1) * P) > r ||
          Math.hypot(gx * P, (gy - 1) * P) > r
        );

        if (isBorder) {
          destCtx.fillStyle = '#0E0F14';
          destCtx.fillRect(px, py, P, P);
          continue;
        }

        // Apply clean solid stepped color zones (NO modulo dither noise)
        // ...
        destCtx.fillStyle = '#262039';
        destCtx.fillRect(px, py, P, P);
      }
    }
    destCtx.restore();
  }

  export function drawCharacterPixelBody(ctx, r) {
    if (typeof document === 'undefined') return;

    if (!_cachedCanvas || _cachedR !== r) {
      _cachedR = r;
      const P = 2.0;
      const steps = Math.ceil((r + P) / P);
      const size = (steps * 2 + 1) * P;

      _cachedCanvas = document.createElement('canvas');
      _cachedCanvas.width = size;
      _cachedCanvas.height = size;
      const offCtx = _cachedCanvas.getContext('2d');
      _renderPixelBodyToCanvas(offCtx, r);
    }

    if (_cachedCanvas) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(_cachedCanvas, -_cachedCanvas.width / 2, -_cachedCanvas.height / 2);
      ctx.restore();
    }
  }
  ```

## Phase 5: Mandatory Hair & Head Asset Model Import (Rule 22)
1. **Module-Level Image Cache**:
   ```javascript
   let _characterHairImage = null;
   let _characterHairImageLoading = false;

   export function _getCharacterHairImage() {
     if (_characterHairImage && _characterHairImage.complete && _characterHairImage.naturalWidth > 0) {
       return _characterHairImage;
     }
     if (!_characterHairImageLoading && typeof Image !== 'undefined') {
       _characterHairImageLoading = true;
       const img = new Image();
       img.onload = () => {
         _characterHairImage = img;
         _characterHairImageLoading = false;
       };
       img.onerror = () => {
         _characterHairImageLoading = false;
       };
       img.src = 'Assets/model/<characterId>/<Name>-hair.png?v=1';
       _characterHairImage = img;
     }
     return _characterHairImage;
   }

   if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
     _getCharacterHairImage();
   }
   ```
2. **Hair Drawing Pipeline**:
   - MUST implement `_draw[Name]Hair(ctx, r, facingLeft)` with `ctx.imageSmoothingEnabled = false;`.
   - Apply `state.skinCustomizations?.[characterId]` scaling and offsets.
   - Calibrate visible bounds to frame crown at `-1.15r` to `-1.30r`.

## Phase 6: Mandatory Universal Character Black Outline Standard (Rule 32)
Whenever creating, scaffolding, designing, or rendering any character skin, ALWAYS apply a crisp black manga ink outline around the body circle and pixel hands:
1. **Body Circle Black Outline (`Layer 1.5`)**:
   ```javascript
   ctx.save();
   ctx.beginPath();
   ctx.arc(0, 0, r, 0, Math.PI * 2);
   ctx.lineWidth = 2.0;
   ctx.strokeStyle = '#0E0F14';
   ctx.stroke();
   ctx.restore();
   ```
2. **Canonical Pixel Hand Black Outlines (`Layer 2` / Rule 20)**:
   - `drawPixelHand` MUST always receive `outlineColor = '#0E0F14'` so the hands maintain sharp manga ink borders against the torso.
3. **Canonical World-Space Coordinate Translation Contract**:
   - `draw[Name]Skin(ctx, fighter)` **MUST ALWAYS** translate to `ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));` at the top of the skin function after `ctx.save()`.
   - Fighter class `draw(ctx, opponent)` **MUST ALWAYS** call `this.drawBody(ctx);` directly in world space without an outer `ctx.translate(this.x, this.y)`.
   - **Why**: `fighterOutlineRenderer.js` (`drawFighterInkOutline`) creates a $160 \times 160$ silhouette buffer offset by `HALF_BUFFER - fighter.x, HALF_BUFFER - fighter.y`. If `draw[Name]Skin` does not translate internally to `(fighter.x, fighter.y)`, the character is drawn completely offscreen outside the buffer ($80 - x, 80 - y$), producing an empty silhouette and zero in-game black outline!
4. **Silhouette Pass Filtering**:
   - Transient glowing auras, energy shields, and attack sparkles MUST check `if (!fighter._isSilhouettePass)` to avoid contaminating the 2.2px manga outline silhouette.
5. **Reference Playbook**:
   - See dedicated skill `character-black-outline` (`.agents/skills/character-black-outline/SKILL.md`).


