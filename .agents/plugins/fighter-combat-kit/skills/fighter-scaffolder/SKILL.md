---
name: fighter-scaffolder
description: Scaffold and implement a new fighter character adhering to all repository coding rules, upright minimalist skin standards, and WebGL rendering.
---

# Fighter Scaffolder Skill

Use this skill when introducing a new fighter character to ensure complete compliance with repository standards and prevent regressions.

## Step-by-Step Implementation Guide

### 1. Fighter Class Template (`update()` loop)
At the top of `update(opponent, ownerIndex, arena)`:
```javascript
// 0. Process active visual effects lifecycles (Rule 25: Never get stuck on freeze)
this._updateVisualExplosions?.();
this._updateVisualEffects?.();

// 1. Mandatory freeze & time-stop guard
const isFrozen = this._handleTimeStop();
if (isFrozen || this.isTargetOfAmbush) {
  this.interruptAttacks();
  return;
}
```

At the end of `update()`:
```javascript
// Delegate to base class centralized physics
super.update(opponent, ownerIndex, arena);
```

### 2. Upright Minimalist Skin Standard (Front POV) & Offscreen Caching (Rule 19 & 3.5)
- **Offscreen Canvas Caching (Gojo / Yuji / Sukuna Pattern)**: When rendering procedural pixel art bodies, ALWAYS rasterize once to an offscreen canvas (`_cachedFighterCanvas`) and blit via `ctx.drawImage`. NEVER call per-pixel `ctx.fillRect` loops inside the rotated game loop.
- **Local Space Transform**: Rotate by `gunAngle` (or 0 during winner reveal), and flip Y when facing left:
  ```javascript
  const angle = fighter._isWinnerReveal ? 0 : (fighter.gunAngle || 0);
  ctx.rotate(angle);
  const facingLeft = Math.abs(angle) > Math.PI / 2;
  if (facingLeft) {
    ctx.scale(1, -1);
  }
  ```
- **Facial Feature Prohibition**: NEVER draw eyes, pupils, mouth, or nose. Represent character identity through hair silhouette, headwear/eyewear, scars/markings, and clothing/collars.

### 3. Frontal Arc AOE Standards
- **Martial Arts / Brawlers**: 90° arc, ~65px reach.
- **Melee Weapon Users**: 120° - 160° arc, reach scaled to weapon length.
- Target query MUST check both `state.fighters` and `state.illusions`.

### 4. Performance & Rendering
- Avoid `ctx.shadowBlur` / `ctx.shadowColor` anywhere in rendering loops.
- Heavy persistent VFX (trails, spheres, full-screen dims) must use the PixiJS WebGL Hybrid Container Pattern.
- HUD skill bars must use unified character `themeColor`.

### 5. Mandatory In-Game Overlay HP & Status Drawing (Rule 21)
- If overriding `draw(ctx, opponent)`: ALWAYS call `this.drawHealth(ctx);` and `this.drawFreezeTimer(ctx);` at the end of the `draw()` pipeline.
- ALWAYS implement `drawBody(ctx) { draw[Name]Skin(ctx, this); }` so standard renderers, previews, and engine hooks work properly.

### 6. Mandatory Hair & Head Asset Model Import (Rule 22)
- ALWAYS import and load the character's dedicated hair asset (`Assets/model/<characterId>/<Name>-hair.png`) via module-level eager caching (`_get[Name]HairImage()`).
- Implement `_draw[Name]Hair(ctx, r, facingLeft)` supporting `state.skinCustomizations?.[characterId]` with `ctx.imageSmoothingEnabled = false;` and calibrated crown offsets (`-1.15r` to `-1.30r`).
- Register `assets.hair` inside `js/configs/characters/<name>Config.js`.

### 7. Mandatory Basic Projectile Suppression (Rule 23)
- Unless the character is explicitly a vanilla generic gun/bullet shooter, ALL fighter classes MUST override `shoot(ownerIndex)` with a blank method or custom melee/skill trigger:
  ```javascript
  /**
   * Overrides base Fighter.shoot() to suppress default generic bullet projectiles.
   */
  shoot(ownerIndex) {
    // Intentionally empty: Character uses dedicated combat skills, weapons, or melee combos
  }
  ```
- This prevents the base `Fighter.update()` loop from spawning unwanted generic circular bullet projectiles during basic attack loops.

### 8. Mandatory Universal Character Body Model & Scale Standard (Rule 24 — The Canonical Reference Trio: Toji, Sukuna & Gojo)
- **Primary Canonical Reference Trio**: ALWAYS reference the Canonical Manga Ink Trio: Toji (`js/graphics/fighters/tojiSkin.js`), Sukuna (`js/graphics/fighters/sukunaSkin.js`), or Gojo (`js/graphics/fighters/gojoSkin.js`) as the primary blueprints and gold standard for all new fighter body models, proportions, and hand layering.
- **Universal Baseline Body Radius & Global Scaling (NEVER Overwrite `this.r` with Raw Config Value)**: All standard humanoid fighters MUST declare `r: 25, radius: 25` in `js/configs/characters/<name>Config.js` and `FIGHTER_DEFS`. In the fighter constructor, **NEVER** overwrite `this.r = cfg.r || 25` after `super(def)` — that bypasses `CONFIG.globalFighter.sizeMultiplier` (`1.2`) and `CONFIG.internalScale`, making the fighter render noticeably smaller (`25` instead of `30`). Either leave `this.r` inherited from `super(def)` untouched, or set `this.r = computeScaledFighterRadius(def?.radius ?? cfg.radius ?? cfg.r ?? 25);` (imported from `../fighter.js`).
- **1:1 Offscreen Canvas Buffer Architecture (Canonical Standard)**:
  ```javascript
  const P = 2.0;
  const snap = (v) => Math.round(v / P) * P;
  const steps = Math.ceil((intR + P) / P);
  const size = (steps * 2 + 1) * P;
  ```
- **Universal Vertical Proportions (Toji/Sukuna/Gojo Baseline)**:
  - `ry < r * 0.28` to `0.32` (`ny < 0.30`): Face & head clean skin tone dome (fair `#FEDBC0` or tan `#E8BD9B`, upper 28–32% of radius, zero baked hair, zero drawn mouths/eyes).
  - `r * 0.28 <= ry < r * 0.64` to `0.68`: Collar & upper torso / shirt / vest / robe (full circle width, high-collar rim, center placket/zipper).
  - `r * 0.64 <= ry < r * 0.78`: Waistband / belt band / sash knot / obi frame.
  - `ry >= r * 0.78`: Lower trousers / hakama / skirt with center fly seam & pleat creases ($Y \ge 24$).
- **Zero Hands on Neutral Body (Anti-Floating-Fists Standard)**:
  - Never render loose or static disembodied hands on the neutral body circle in `draw[Name]Skin`. Hands are strictly drawn ONLY over weapon grips via `drawPixelHand` in weapon space or during active melee strike animations.
- **Outer 4-Neighbor Ink Outline Shell**:
  - Always use the 4-neighbor boundary test filled with `#0E0F14`.
- **Hair Scale & Crown Volume**:
  - `targetHairWidth = r * 3.00 - r * 3.20` and `targetHairHeight = r * 1.95 - r * 2.10`.
  - Crown apex anchor `drawY = -r * 1.30` to `-r * 1.45`.

### 9. Mandatory Non-Freezing Active Visual Effects & Particle Decay Standard (Rule 25)
- **Decay Before Freeze Guard**: Always update and decay transient visual effect arrays (explosions, slashes, particle bursts, shockwave rings) at the top of `update()` before `_handleTimeStop()`.
- **Interrupt / Death Cleanup**: Clear effect arrays or decouple them to world space on `interruptAttacks(forceCancelAll = true)` or defeat so visual effects never freeze or stay stuck on screen when character movement is stopped.

### 10. Mandatory 5-Phase Melee Combat Animation, Impact Lock & Arm Physical Force Standard (Rule 30)
- **No Weightless Snappy Swings & Zero Floating Hands**: When scaffolding melee weapon fighters (swords, axes, scythes, daggers), NEVER transition directly from swing to recovery on the same frame, and NEVER render weapons with disconnected floating hands rotating around a static body center `(0, 0)`.
- **Mandatory Dynamic Arm Linkages & Physical Force Drive**:
  - **Dynamic Arm Segments**: Render explicit arm segments (upper arm, elbow flexion, forearm polygons or strokes matching character skin tone, sleeves, or armor) connecting the fighter's shoulders/torso flanks (`±r * 0.65, r * 0.22`) directly to the hands gripping the weapon.
  - **Bodily Kinetic Force Transfer**: Hands and weapon hilt MUST translate dynamically through space via `_getSwordSwingOffsets()` (`lunge`, `offY`), pulling back during Phase 1 (Coil), thrusting forward into the cleave plane during Phase 3 (Strike), and locking at full extension during Phase 4 (Impact Lock).
  - **Recoil Kickback & Elastic Settle**: Heavy swings MUST apply a backward recoil velocity impulse on the fighter entity (`this.vx -= Math.cos(angle) * recoilKick`), screen rumble (`triggerGlobalScreenShake(2.5, 4)`), and spring-damped arm recovery oscillation (`Math.sin(rp * Math.PI * 2.2) * Math.exp(-rp * 4.2)`).
- **5-Phase Lifecycle**: Implement all 5 distinct phases across config, renderer, and entity update:
  1. **Lift / Coil** (`hit*LiftFrames`, ~6–8f)
  2. **Poised Hold** (`hit*HoldFrames`, ~2–4f)
  3. **Hypersonic Whip Strike** (`hit*StrikeFrames`, ~5–8f) — impact at `strikeP >= 0.50`
  4. **THE IMPACT LOCK / IMPACT LATCH** (`hit*ImpactLockFrames` / `hit*LockFrames` / alias `hit*PinFrames`, ~5–7f) — blade stays locked at impact angle (ground embed, target flesh, or apex), `vx = 0, vy = 0`, tremor jitter, slash arc mesh held on impact plane, concentric compression ring & sparks
  5. **Recovery Settle** (`hit*RecoveryFrames`, ~9–12f) — blade dislodges, returns to canonical hands (Rule 20), slash arc erases from tail to tip (Rule 15).
- **Layered Fleshy Slap Audio**: Stack `attack_fleshhit` (1.0) + blade slice (0.90) + finisher concussive punch (0.95) on impact.
- **Reference Playbook**: See dedicated skill `melee-attack-animator` (`.agents/skills/melee-attack-animator/SKILL.md`).

### 11. Mandatory Universal Character Black Outline Standard (Rule 32)
- **Always Add Outer Black Outline**: Whenever scaffolding or creating a new fighter character skin, ALWAYS render a crisp, bold black manga ink outline (`#0E0F14` or `#000000`, 2.0px stroke) around the character's body circle and pixel hands:
  ```javascript
  // Layer 1.5: Mandatory Universal Character Black Outline Standard (Rule 32)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#0E0F14';
  ctx.stroke();
  ctx.restore();
  ```
- **Pixel Hand Outlines**: Canonical hands (`drawPixelHand`) MUST always use `outlineColor = '#0E0F14'` so fists remain sharply defined against the body.
- **Canonical World-Space Coordinate Translation Contract**:
  - `draw[Name]Skin(ctx, fighter)` **MUST ALWAYS** translate to `ctx.translate(fighter.x || 0, (fighter.y || 0) - (fighter.z || 0));` at the top of the skin function after `ctx.save()`.
  - Fighter class `draw(ctx, opponent)` **MUST ALWAYS** call `this.drawBody(ctx);` directly in world space without an outer `ctx.translate(this.x, this.y)`.
  - **Why**: `fighterOutlineRenderer.js` (`drawFighterInkOutline`) creates a $160 \times 160$ silhouette buffer offset by `HALF_BUFFER - fighter.x, HALF_BUFFER - fighter.y`. If `draw[Name]Skin` does not translate internally to `(fighter.x, fighter.y)`, the character is drawn completely offscreen outside the buffer ($80 - x, 80 - y$), producing an empty silhouette and zero in-game black outline!
- **Silhouette Pass Filtering**:
  - Transient glowing auras, energy shields, and attack sparkles MUST check `if (!fighter._isSilhouettePass)` to avoid contaminating the 2.2px manga outline silhouette.
- **Reference Playbook**: See dedicated skill `character-black-outline` (`.agents/skills/character-black-outline/SKILL.md`).

### 12. Mandatory Fighter Documentation Markdown File Standard (docs/fighters/<characterId>.md - Rule 33)
- **MANDATORY INSTRUCTION — ALWAYS INCLUDE THE FIGHTER MD FILE**: Whenever creating or scaffolding a new fighter, the agent **MUST ALWAYS** create and include the character's dedicated documentation file at `docs/fighters/<characterId>.md`.
  - **STRICT PROHIBITION**: Scaffolding, implementing, or committing a new fighter without creating its corresponding `docs/fighters/<characterId>.md` file is strictly prohibited.
- **Required 10-Section Documentation Structure**:
  1. Header & Metadata (`category`, `characterId`, `grade`, `themeColor`, `role`)
  2. Lore & Character Philosophy (Quote, background, circle fighter combat philosophy)
  3. Visual Design & Rendering Standards (Rule 24 4-zone ASCII diagram, hair asset import, 2.0px `#0E0F14` outer outline, canonical hands)
  4. Core Combat Mechanics & Passive Traits (Rule 23 generic projectile suppression, movement, stats)
  5. Dedicated Combat Skills Breakdown (Basic Attack, Skill 1, Skill 2, Ultimate with damage, cooldown, frames, Rule 30 melee kinematics)
  6. HUD Skill Configuration & Data Provider Gating (Rule 18 unified `themeColor`, `isSkillEnabled(cfg.enable[Skill])`, zero parenthetical status suffixes)
  7. Physics & Status Effect Interactions (Rule 1 freeze guard, Rule 25 top-of-update VFX decay, wall bounce)
  8. Sound & Audio Engineering (Volume config in `audioVolumeConfig.js`, layered impact SFX)
  9. Asset Manifest & Directory Structure (`Assets/model/<characterId>/`)
  10. Verification & Test Coverage Matrix (`scripts/testInteractions.mjs`, `npm run verify`)


