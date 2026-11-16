# ERROR SANS — Fighter Technical & Lore Specification

## 1. Header & Metadata
- **Character ID**: `error_sans` (aliases: `errorsans`, `ErrorSans`, `ERROR_SANS`)
- **Display Name**: `ERROR SANS`
- **Fighter ID**: `75`
- **Grade**: `SS`
- **Category / Element**: `Gaming` / `dark`
- **Theme Color**: `#DD0000` (Crimson Error — Secondary `#00A0FF` Electric Cyan Strings, `#FFEB00` Core Trim)
- **Combat Role**: Glitch-Evasive Bullet-Hell / Tether Controller & Titan Error Blaster

---

## 2. Lore & Character Philosophy
> *"Just another anomaly waiting to be deleted."*

Error Sans stalks the Anti-Void as the self-appointed **Destroyer of AUs**, unraveling timelines with snapping electric-cyan puppet strings (`BLUE STRINGS`), corrupted bone barrages, and crimson-eyed Error Gaster Blasters. Just like classic Sans, Error Sans carries an authentic **`1 HP` glass-cannon pool backed by a `100` Dodge Stamina bar** (`ERROR WARP`), paired with sustained `Code Corruption` DoT pressure and non-cancelling simultaneous bullet-hell attacks.

---

## 3. Visual Design & Rendering Standards (Rules 19, 20, 22, 24, 32, 35)
- **4-Zone Rule 24 Body Model (`js/graphics/fighters/errorSansSkin.js`)**:
  ```
       [ ErrorSans-hair.png — Floating ERROR Glitch Crown ]
         ╭──────────────────────────────────────────────╮
         │ Zone 1 (<0.26r): Obsidian Dome + Cyan Tears  │  <- Crimson/Gold Scar Bars (No Eyes/Mouth)
         ├──────────────────────────────────────────────┤
         │ Zone 2 (0.26r–0.66r): Fur Collar + Open Coat │  <- #1B2236 Coat, #FFEB00 Trim, #DD0000 Shirt
         ├──────────────────────────────────────────────┤
         │ Zone 3 (0.66r–0.78r): Dark Belt & Glitch Seam│
         ├──────────────────────────────────────────────┤
         │ Zone 4 (>=0.78r): Charcoal Shorts + Stripes  │
         ╰──────────────────────────────────────────────╯
  ```
- **Offscreen Canvas Pre-Baking (Rule 35)**: Body circle rasterized once per integer radius `intR` (`P = 2.0px`) with 4-neighbor `#0E0F14` manga ink border, then blitted via single `ctx.drawImage`.
- **Canonical World Translation & 2.0px Outline (Rule 32)**: `drawErrorSansSkin(ctx, fighter)` translates internally to `(fighter.x, fighter.y - fighter.z)` and renders an explicit `2.0px` `#0E0F14` outline circle.
- **Zero Detached Idle Hands (Rule 20)**: Canonical pixel hands appear only at `(±r*0.82, +r*0.38)` when actively casting Error Strings, Glitch Bones, or Forced Crash (`drawErrorSansWeaponPreview`).
- **Rule 22 Hair Asset**: `Assets/model/error_sans/ErrorSans-hair.png` (`148×68`) cached via `_getErrorSansHairImage()` and integrated into `SkinStudioScreen.js` and `SKIN_CUSTOMIZATIONS_DATABASE`.

---

## 4. Core Combat Mechanics & Passive Traits
- **Rule 23 Projectile Suppression**: `ErrorSansFighter.shoot()` is cleanly overridden to prevent base generic bullet orbs.
- **Passive 1 — `1 HP + ERROR WARP` (`enableGlitchDodge`)**: Error Sans spawns with `hp: 1, maxHp: 1` and `100` Dodge Stamina displayed cleanly in the HUD bar via `hudManager.js`. Whenever stamina suffices, non-guaranteed attacks and domain slice lines are negated via glitch-warp teleportation (costing 10% of incoming attack damage, minimum `1`, or `1` inside Sukuna's domain), leaving chromatic afterimages, `ERROR!` popups, and `badnoise1..3.mp3`. Blaster beam hits restore stamina (`+0.5`). Once stamina runs out or while frozen/stunned, any hit drops `hp` from `1` to `0`.
- **Passive 2 — `Code Corruption` (`enableErrorKarma`)**: Inflicts stackable Error Karma DoT (`2 dmg` every `20f`, up to `8` stacks) using `skipInterrupt: true` so DoT ticks never cancel enemy skills.

---

## 5. Dedicated Combat Skills Breakdown
- **Basic Attack — `Glitch Bone Volley` (`enableGlitchBoneBasic`)**: Fires a 3-bone spread (`11 dmg` each, speed `9.8`) using `ErrorBoneV.png`. Each connected volley increments `crashHits` toward `FORCED CRASH`.
- **Unified Skill 1 — `ERROR ART` (Anti-Repeat Random Cycle, `330f` CD)**:
  1. **`BLUE STRINGS` (`enableErrorStrings`)**: Fires triple `#00A0FF` puppet strings (`16 dmg` + `6` DoT tick) that latch and pull enemies (`6.2` pull force, respects `isPullImmune`).
  2. **`ERROR BLASTER` (`enableErrorBlaster`)**: Summons `3` crimson/black Error Gaster Blasters (`ErrorSans-gaster-blaster-sprite-sheet.png`) flanking the target (`22` initial dmg + continuous beam ticks).
  3. **`GLITCH ZONE` (`enableGlitchZone`)**: Places `6` warning runes around the opponent that erupt into `ErrorBoneStabV.png` spikes (`18 dmg`).
- **Signature Ultimate — `FORCED CRASH` (`enableForcedCrash`, unlocks at `5` basic hits)**: Locks aim (`Rule 1.4`), binds the opponent with triple Error Strings inside glitch `"ERR // 404"` windows, unleashes `2` `2.05×` Titan Error Blasters, and slams enemies with a staggered Rule 26 concentric shockwave (`38` guaranteed AOE dmg + knockback). All damage calls pass `{ skipInterrupt: true }`.

---

## 6. HUD Skill Configuration & Data Provider Gating (Rule 18)
Implemented in `hudSkillProviders.js` (`error_sans`):
- Uses unified `#DD0000` `themeColor` across his active skill bars (`error_skill1`, `forced_crash`), while `ERROR WARP` stamina is displayed cleanly on the main Sans-style `100 / 100` stamina bar via `hudManager.js` (zero duplicate stamina bars).
- Gated strictly via `isSkillEnabled(cfg.enable[Skill], true)` and `cfgSkillName(...)`.
- Clean idle labels (`ERROR ART` / dynamic cast name, `FORCED CRASH (X/5)`).
- Registered `forced_crash` in `isSkillExceptionInDarkMode()` `signatureMap`.

---

## 7. Physics & Status Effect Interactions (Rules 1, 21, 25)
- `update()` executes `_updateAllVfxLifecycles(arena)` before `_handleTimeStop()` so Error Bones, Blasters, Traps, Strings, Glitch Windows, and Shockwave Ripples decay seamlessly during stuns or time-stops.
- Delegates movement & wall collisions to `super.update(opponent, ownerIndex, arena)` (Rule 1.2).
- `draw()` ends with `this.drawHealth(ctx); this.drawFreezeTimer(ctx);` (Rule 21).

---

## 8. Sound & Audio Engineering
- Glitch static bursts extracted from `mario1D240`: `Assets/Sound Effects/ErrorSans/badnoise1.mp3`, `badnoise2.mp3`, `badnoise3.mp3`.
- Blaster, bone stab, slam, warning, and flash audio reused from `Assets/Sound Effects/Sans/*.ogg` with normalized `soundVolumes` in `errorSansConfig.js`.
- Registered in `js/configs/audioConfig.js` and `js/soundEffects/basicAttackSounds.js`.

---

## 9. Asset Manifest (`Assets/model/error_sans/` & `Assets/Sound Effects/ErrorSans/`)
- `Assets/model/error_sans/ErrorSans-hair.png` (`148×68` pixel glitch crown)
- `Assets/model/error_sans/ErrorSans-gaster-blaster-sprite-sheet.png` (`342×44`, 6×`57×44` frames)
- `Assets/model/error_sans/ErrorBoneV.png` (`10×24`)
- `Assets/model/error_sans/ErrorBoneStabV.png` (`12×24`)
- `Assets/Sound Effects/ErrorSans/badnoise1.mp3`, `badnoise2.mp3`, `badnoise3.mp3`

---

## 10. Verification & Test Coverage Matrix
- `[TEST 189]` in `scripts/testInteractions.mjs`: Validates Rule 24 scaled radius, Rule 23 `shoot()` suppression, Glitch Warp dodge + `ERROR!` window, Code Corruption DoT, all 3 anti-repeat Skill 1 modes (`error_strings`, `error_blaster`, `glitch_zone`), `FORCED CRASH` ultimate, Rule 25 freeze VFX decay, Rule 18 HUD bars, Canvas 2D stack depth `== 0`, Rule 21 `drawHealth()` invocation, and non-cancellation against Roaring Knight active casts.
- Verified with `npm run verify`.
