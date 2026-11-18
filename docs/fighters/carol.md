# CAROL HOLIDAY — Fighter Technical & Lore Specification

## 1. Header & Metadata
- **Character ID**: `carol` (aliases: `carol_holiday`, `Carol`, `CAROL`, `mayor_holiday`)
- **Display Name**: `CAROL HOLIDAY`
- **Fighter ID**: `82`
- **Grade**: `SS`
- **Category / Element**: `Gaming` / `water` (Ice / Frost)
- **Theme Color**: `#38BDF8` (Glacial Frost Cyan — Secondary `#BAE6FD` Crystalline Ice, `#1E2D6B` Royal Navy Coat)
- **Combat Role**: Frost Katana Iaijutsu Swordsman / Crowd-Control Freezer & Arena-Splitter

---

## 2. Lore & Character Philosophy
> *"You are not welcome here. Stand down, or freeze."*

Adapted from Deltarune's **"Resolve"** fan-encounter (`Resolve.zip`), **Mayor Carol Holiday** fights with cold discipline and razor-sharp precision. Wielding her **Glacial Katana** in a 5-phase 2-hit Iaijutsu combo, she chills enemies with stacking **Frostbite** that triggers a crisp **Flash Freeze**, parries incoming blows with frost guard ripostes, and overwhelms the arena with **Dagger Hailstorms**, **Frost Gale** snowflakes, **Ice Split Slashes**, and **Permafrost**.

---

## 3. Visual Design & Rendering Standards (Rules 19, 20, 22, 24, 30, 32, 35)
- **4-Zone Rule 24 Body Model (`js/graphics/fighters/carolSkin.js`)**:
  ```
       [ Carol-hair.png — Snow-White Swept Bob + Twin Cyan-Indigo Antlers ]
         ╭─────────────────────────────────────────────────────────╮
         │ Zone 1 (<0.28r): Faceless Pale Fawn Dome (#E8DEC8)      │
         ├─────────────────────────────────────────────────────────┤
         │ Zone 2 (0.28r–0.64r): Royal Navy Double-Breasted Coat   │
         │   • Vertical Gold Brass Buttons (#E5D9B6) & Lapels      │
         ├─────────────────────────────────────────────────────────┤
         │ Zone 3 (0.64r–0.78r): Glacial Cyan Scabbard Sash Belt   │
         ├─────────────────────────────────────────────────────────┤
         │ Zone 4 (>=0.78r): Tailored Dark Slate-Indigo Trousers   │
         ╰─────────────────────────────────────────────────────────╯
  ```
- **Offscreen Canvas Pre-Baking (Rule 35)**: Body, frost afterimage ghost, and frost aura canvases are pre-baked per integer radius `intR` and GPU-uploaded via `prewarmAssets(targetCtx)` before Round 1.
- **Canonical World Translation & 2.0px Outline (Rule 32)**: `drawCarolSkin(ctx, fighter)` translates internally to `(fighter.x, fighter.y - fighter.z)` and renders an explicit `2.0px` `#0E0F14` outline circle, filtering aura glow via `!fighter._isSilhouettePass`.
- **Canonical Lower-Flank Hands (Dante `r * 0.30` Standard — Rules 20 & 30)**: Canonical circular hands (`drawPixelHand`, `r * 0.30`) anchor directly at `(±r*0.82, +r*0.38..0.42)` without attached sleeve/arm strokes, normalized under `facingLeft` so hands never flip onto her hair/antlers.
- **Rule 22 Hair Asset**: `Assets/model/carol/Carol-hair.png` (`152×84`) cached via `_getCarolHairImage()` and wired into `SkinStudioScreen.js` and `SKIN_CUSTOMIZATIONS_DATABASE`.

---

## 4. Core Combat Mechanics & Passive Traits
- **Rule 23 Projectile Suppression**: `CarolFighter.shoot()` is cleanly overridden to prevent base generic bullet orbs.
- **Passive 1 — `Frostbite & Flash Freeze` (`enableFrostStacks`)**: Hits chill foes (`slowMultiplier: 0.72` for `95f`) and apply Frost stacks; at `3` stacks, triggers **FROZEN!** (`26f` freeze + `14` bonus ice shatter damage).
- **Passive 2 — `Iaijutsu Frost Parry` (`enableIceParry`)**: `30%` chance (`150f` CD) to parry non-guaranteed incoming hits with metallic blade clash sparks and a `14` dmg close-range riposte.
- **Passive 3 — `Cryo Mend / Carol_Heal` (`enableCarolHeal`)**: Triggers **once per match** when Carol drops below `38%` HP, playing `carol_spellcast.wav`, restoring `55` HP via Rule 27 healthbar-only feedback (`_healthBarHealTimer`), and raising a brief cyan frost barrier (`36f`).

---

## 5. Dedicated Combat Skills Breakdown
- **Basic Attack — `Glacial Iaijutsu 2-Hit Combo + Fractal Slash Follow-Up` (`enableBasicSword` & `enableBasicFractalFollowup`, Rule 30 5-Phase)**:
  - **Hit 1 (Upward Rising Slash)**: `8f` Lift, `3f` Hold, `6f` Whip Strike, `6f` Impact Lock, `12f` Recovery (`140°` arc, `18` dmg, layered `attack_fleshhit` + `carol_slice.mp3`).
  - **Hit 2 (Downward Frost Cleave)**: `8f` Lift, `3f` Hold, `7f` Whip Strike, `7f` Impact Lock, `14f` Recovery (`155°` arc, `24` dmg + `carol_impact.wav`).
  - **Fractal Slash Follow-Up (`attacks//Ice_Slash`)**: After entering Phase 5 recovery, Carol emits a `ring(3)` (`60°` steps) `Ice_Slash` web (plus `3×6` `expandring` outward chords on Hit 2) using exponential `Turn /= spin` deceleration, `effect1` center pulse, and `effect3/4/5` 8-streak detonation bursts.
- **Unified Skill 1 — `RESOLVE ART` (100% Ported `Resolve` `project.json` Scripts, `240f` CD)**:
  1. **`DAGGER HAILSTORM` (`enableDaggerHailstorm`, `attacks//Dagger_Hailstorm`)**: Spawns `10` cycling `knife`–`knife8` daggers in a bowed flanking crescent halo around Carol (`carol_knife_spawn.wav`) over swirling frost mist, pulls back (`Speed = -3`, `/1.25`), waits shuffled `Delaylist` timers, slides out while smoothly easing aim (`diff / 5`), flares the `Carol-dagger-aim.png` reticle, and stabs across the arena leaving `Carol-knife-dmg.png` + tiled `Carol-dagger-trail.png` (`9` dmg) + wall embed (`stuckTimer`).
  2. **`DAGGER HAIL + FRACTAL II` (`enableDaggerFractalCombo`, `0:54–1:01` Resolve Combo)**: Holds Carol's waist-level katana `stance` over swirling frost mist (`drawCarolCastMist`) while spawning the `12`-dagger `DaggerHail II` flanking crescent around her + `4` rhythmic `FractalSlash II` cyan triangle grid waves over the target that detonate into blinding white-core beams and trigger Carol's giant white-cyan `Flurry_Slash` crescent katana sweep + frost splash bursts.
  3. **`FRACTAL SLASH` (`enableFractalSlash`, `attacks//Ice_Slash`)**: Emits center `Carol-fractal-ring.png`, stretching beams (`0 -> 1500`) with exponential spin decay (`spinDecay: 1.12 / 1.25`) across `ring(3)` + `3` outward `expandring(6)` hexagonal chord waves, detonating with `Carol-fractal-flash.png`, `Carol-fractal-core.png`, and `8` radial `Carol-fractal-streak.png` sparks per cut.
  3. **`ICICLE BLIZZARD` (`enableIcicleBlizzard`, `attacks//Icicle_Blizzard`)**: Emits vertical 8-shard sweeping columns (`150°` / `210°` diagonals matching Scratch `-120°` / `-60°`) in paired slow (`4.8`) and fast (`7.2`) diamond walls cycling `Carol-icicle`..`Carol-icicle-5`.
  4. **`FROST GALE` (`enableFrostGale`, `attacks//Frost_Gale`)**: Launches `8` decelerating `Carol-snowflake.png` + `Carol-snowflake-aura.png` (`Flake2`) bloom orbs (no artificial vortex pull) that shatter into `Resolve`'s dual-hexagon burst: `6` full-scale (`100%`, `60°` steps) + `6` inner (`60%`, `+30°` offset) animated crystal shards.
  5. **`QUICK SLASH / RAPIDSLASH II & III` (`enableQuickSlash`, `attacks//Quick_Slash`)**: Pure blade barrage (`0` daggers) — fires `9` accelerating target-centered telegraph beats (`12f -> 3f`, paired perpendicular X-crosses on alternating casts), pauses, then detonates `10` simultaneous arena-wide `Quick_Slash` beams (`Carol-quick-arc-1..4.png` + `Carol-knife-dmg.png`) + `Sheath_Cut` dash afterimage.
- **Signature Ultimate — `PERMAFROST // AQUA HEATBAR` (`enablePermafrost`, unlocks at `5` hits)**: Locks aim (Rule 1.4), plays `carol_snowgrave.wav`, blows high-speed horizontal `Carol-blizzard-snow.png` wind streaks right-to-left while fading in `Carol-permafrost-screen.png` (`whole screen`), fires `2` slow `Ice_Slash` `ring(1)` cuts, snaps `carol_permafrost_snap.wav` (`snd_noise`) to freeze `20` simultaneous `Quick_Slash` lines around the target during stasis (`permafrostFreezeHold`), then detonates all `20` cuts + `Sheath_Cut` knockback (`28` dmg) and inflicts **Aqua Soul Heatbar Chill** (`150f`, `0.68×` speed).

---

## 6. HUD Skill Configuration & Data Provider Gating (Rule 18)
Implemented in `hudSkillProviders.js` (`carol`):
- Uses unified `#38BDF8` `themeColor` across `carol_skill1` and `permafrost` bars.
- Gated strictly via `isSkillEnabled(cfg.enable[Skill], true)` and `cfgSkillName(...)` with zero redundant status suffixes.
- Registered `permafrost` in `isSkillExceptionInDarkMode()` `signatureMap`.

---

## 7. Physics & Status Effect Interactions (Rules 1, 21, 25)
- `update()` calls `_updateAllVfxLifecycles(arena)` BEFORE `_handleTimeStop()` so Daggers, Snowflakes, Blizzard Spawners, Icicles, Ice Splits/Fractal cuts, Aqua Heatbar timers, Snow drops, and Ripples decay smoothly during stuns/time-stops.
- Delegates movement & wall bounce to `super.update(opponent, ownerIndex, arena)` (Rule 1.2).
- `draw()` ends with `this.drawHealth(ctx); this.drawFreezeTimer(ctx); drawSansSpeechBubble(ctx, this);` (Rule 21).

---

## 8. Sound & Audio Engineering
- All `16` SFX extracted from `Resolve.zip` (`project.json`) into `Assets/Sound Effects/CarolSFX/`: `carol_slice.mp3`, `carol_cut.wav`, `carol_dash.wav`, `carol_knife_spawn.wav`, `carol_icespell.wav`, `carol_snowgrave.wav`, `carol_permafrost_snap.wav`, `carol_stardrop.wav`, `carol_slash_line.wav`, `carol_boxbreak.wav`, `carol_star_explode.wav`, `carol_impact.wav`, `carol_spellcast.wav`, `carol_spear_choppy.wav`, `carol_heavyswing.wav`, `carol_txt.wav`.
- Registered in `audioConfig.js`, `basicAttackSounds.js`, and `skillSounds.js`.

---

## 9. Asset Manifest (`Assets/model/carol/` & `Assets/Sound Effects/CarolSFX/`)
- `Assets/model/carol/Carol-hair.png` (`152×84`)
- `Assets/model/carol/Carol-katana.png` (`96×24`)
- `Assets/model/carol/Carol-dagger.png` (`74×29`) + `Carol-dagger-2.png` .. `Carol-dagger-8.png` (8-frame spinning spawn sequence)
- `Assets/model/carol/Carol-dagger-aim.png` (`480×5`, Resolve `aim` reticle beam)
- `Assets/model/carol/Carol-knife-dmg.png` (`480×5`, Resolve `knifeDMG` stab core)
- `Assets/model/carol/Carol-dagger-trail.png` (`517×29`, tiled in native 517px chunks)
- `Assets/model/carol/Carol-snowflake.png` (`82×86`) + `Carol-snowflake-aura.png` (`82×86`, Resolve `Flake2` bloom)
- `Assets/model/carol/Carol-icicle.png` (`32×22`) + `Carol-icicle-2.png` .. `Carol-icicle-5.png` (5-frame `splitbullet` cycle)
- `Assets/model/carol/Carol-slash-line.png` (`240×15`)
- `Assets/model/carol/Carol-quick-beam.png` (`128×30`)
- `Assets/model/carol/Carol-quick-arc-1.png`, `Carol-quick-arc-2.png`, `Carol-quick-arc.png`, `Carol-quick-arc-4.png` (4-frame Resolve `Slash1`–`Slash4` burst sequence)
- `Assets/model/carol/Carol-fractal-beam.png` (`128×30`) + `Carol-fractal-ring.png` (`100×100`), `Carol-fractal-flash.png` (`888×96`), `Carol-fractal-core.png` (`922×30`), `Carol-fractal-streak.png` (`128×5`)
- `Assets/model/carol/Carol-blizzard-snow.png` (`100×100`) & `Carol-permafrost-screen.png` (`960×720`)
- `Assets/model/carol/Carol-cspell-1.png` .. `Carol-cspell-5.png` (5-frame `Sprites//Carol` additive spell ring crests for `Carol_Heal` & `PERMAFROST`)
- `Assets/Sound Effects/CarolSFX/*` (16 SFX clips)

---

## 10. Verification & Test Coverage Matrix
- `[TEST 197]` in `scripts/testInteractions.mjs`: Validates Rule 24 scaled radius, Rule 23 `shoot()` suppression, Rule 30 5-phase Glacial Katana 2-hit combo + Frostbite Flash Freeze at 3 stacks, Frost Parry riposte, once-per-match `Cryo Mend (Carol_Heal)`, all 5 anti-repeat Resolve Arts (`dagger_hailstorm`, `fractal_slash`, `icicle_blizzard`, `frost_gale` shatter, `quick_slash`), `PERMAFROST` ultimate aim lock + Aqua Heatbar chill completion, Rule 25 freeze VFX decay, Rule 35 `prewarmMatchAssets` cache population, Rule 18 HUD bars & dark-mode exemption, Canvas 2D stack depth `== 0`, and Rule 21 `drawHealth()` invocation.
- Verified with `node scripts/buildMobileAssets.mjs`, `benchmarkCombat.mjs`, and `npm run verify`.
