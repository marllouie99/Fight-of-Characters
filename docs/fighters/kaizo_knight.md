# Kaizo Knight (`kaizo_knight`)

> **Category:** Gaming | **Grade:** SS | **Theme Color:** `#86A2FF`  
> **Role:** Relentless Dark Fountain Anomaly (*Deltarune Kaizo Roaring Knight v2.3.3 Mod*)  
> **Standards Enforced:** Rules 1, 11, 15, 18, 20, 21, 22, 23, 24, 25, 26, 30, 32, 33, 35.

---

## 1. Header & Metadata
- **ID:** `kaizo_knight` (`id: 74` in `FIGHTER_DEFS`)
- **Display Name:** `Kaizo Knight`
- **Source Inspiration & Extracted Assets:** Adapted directly from [`Mezu-Bezu/kaizo-knight-browser`](https://github.com/Mezu-Bezu/kaizo-knight-browser) (`dist/runtime/game.part1..2` sprites and `.ogg` audio cues).
- **Config File:** [`js/configs/characters/kaizoKnightConfig.js`](../../js/configs/characters/kaizoKnightConfig.js)

---

## 2. Lore & Character Philosophy
An intensified, relentless incarnation of the Dark Fountain's herald. Equipped with the luminous `#86A2FF`-edged **Radiant Knife**, prismatic RGB afterimages (`rgbafterimages`), **Gloom Chill** slow pressure, and reality-splitting Kaizo mod patterns (**Soul Splitter**, **Diamond Storm**, **Vortex Storm**, **Kaizo Tunnel**, **Hypernova Starstorm**, and **Roaring Δ Screen Shatter**).

---

## 3. Visual Design & Rendering Standards (Rules 11, 22, 24, 32, 35)
- **Pre-Baked 1:1 Body Buffer (`js/graphics/fighters/kaizoKnightSkin.js`)**:
  - Pixel step `P = 2.0`, 4-neighbor `#0E0F14` manga ink outer shell + `2.0px #0E0F14` Rule 32 outline ring.
  - Interior electric periwinkle `#86A2FF` contour rim separating obsidian armor (`#0A0B10`) from the outline.
  - **Zone 1 (`ny < -0.10`)**: Armored helm dome with subtle central `#86A2FF` crest glint. Zero eyes/mouth/nose.
  - **Zone 2 (`-0.10 <= ny < 0.42`)**: Radiant white + `#86A2FF` V-visor collar and twin collarbone glints + flared shoulder pauldrons (`drawKaizoKnightPauldrons`).
  - **Zone 3 (`0.42 <= ny < 0.66`)**: Alternating white / `#86A2FF` skeletal rib chevrons.
  - **Zone 4 (`ny >= 0.66`)**: Obsidian mantle hem with glowing vertical center slit.
  - **Zero Loose Hands on Neutral Body (Rule 24)**: Body circle contains no disembodied hands; canonical gauntlet (`_getKaizoGripCanvas`) renders exclusively over the Radiant Knife grip.
- **Layer 2 Horned Antlers (`Rule 22`)**: `Assets/model/kaizo_knight/KaizoKnight-hair.png` loaded via `_getKaizoKnightHairImage()` and anchored at `-r * 1.48`.

---

## 4. Core Combat Mechanics & Passive Traits (Rules 20, 23, 25, 30)
- **Stats**: `hp: 500`, `speed: 6.4`, `r: 25` (`30px` scaled via `super(def)`).
- **Rule 23 Generic Bullet Suppression**: Empty `shoot()` override prevents vanilla bullet spawns.
- **Passive 1 — Kaizo Step & Gloom Chill**: Executes periodic `15.0 px/f` gap-closer dashes (`kaizoStepCooldown: 105f`), emits prismatic RGB afterimages (`#86A2FF`, `#38BDF8`, `#FF1E4D`, `#C084FC`), and inflicts `90f` Gloom Chill (`0.62x` speed) on crescent/skill strikes.
- **Passive 2 — Radiant Parry**: `42%` passive (`72%` guarded) parry chance rendering `BlockVFX.png` + `BlockShieldOL.png` with close-range `14` DMG melee riposte.

---

## 5. Dedicated Combat Skills Breakdown
1. **Basic Attack — Crescent Quickslash (`25` DMG cleave + `14` DMG Crescent Wave + `[2, 3, 4]` Board Cuts)**:
   - 5-phase Radiant Knife cleave (Windup `6f` -> Hold `2f` -> Strike `6f` -> Impact Lock `3f` -> Recovery `4f`, `185px` reach, `151°` arc) paired with `KaizoCrescentArc.png` and `KaizoCrescentSlash.png` projectile emission plus `[2, 3, 4]` Quickslash arena cuts.
2. **Skill 1 (`KAIZO ART`, `390f` CD) — Randomly Selects Among All 5 Kaizo Signatures (Anti-Repeat Pool)**:
   - **Soul Splitter**: Projects crimson fault line, detonates with `SwordBreakVFX.png` (`24` DMG + outward knockback), and launches `12` perpendicular `KaizoSpark.png` shards (`11` DMG).
   - **Diamond Storm**: Spawns `12` orbiting `DiamondSwordBullet.png` crystals that track -> red-laser lock -> morph into `DiamondBladeLong.png` lances (`14` DMG).
   - **Vortex Storm**: Traps opponent inside an inward-spiraling ring of `8` Radiant Knives (`12` DMG ticks) that burst outward as spark bolts (`11` DMG).
   - **Kaizo Tunnel**: Generates a rotating spiral sword corridor (`TunnelSlash.png`) culminating in `4` red-laser Mach tunnel beams (`20` DMG).
   - **Hypernova Starstorm**: Emits `10` `StarBulletKaizo.png` stars through a `#86A2FF` cone, reverses velocity inward, locks crimson (`6`-ray stars), and explodes (`14` DMG) into `StarChildKaizo.png` homing shards (`11` DMG).
3. **Ultimate — `ROARING DELTA` (`5` Basic Hits, Spawns Directly in Front)**:
   - Keeps Kaizo Knight anchored at his position (`roaringDeltaOrigin` projected `2.5 × r` ahead along `skillCastAngle`), pulls opponents toward the front Dark Fountain vortex (`RoaringFire.png` + inbound fountain bullets), chains `14` rapid Quickslash arena cuts (`10` DMG each + `KaizoBattleFlurry.png`) right in front of him, and finishes with **`RoaringFinalShatter.png` Screen Shatter** (`34` guaranteed AOE DMG + clean Rule 26 concentric shockwaves).

---

## 6. HUD Skill Configuration & Data Provider Gating (`Rule 18`)
- Implemented in `js/graphics/ui/hudSkillProviders.js` (`kaizo_knight(f)` & `signatureMap`).
- All 3 HUD bars (`KAIZO STEP`, `KAIZO ART` [randomized active slot], `ROARING DELTA`) strictly use unified `themeColor` (`#86A2FF`), `isSkillEnabled` config gating, clamped `0–100%` fill, and zero redundant idle status suffixes.

---

## 7. Physics & Status Effect Interactions (`Rules 1, 25`)
- Top-of-update `_updateAllVfxLifecycles(arena)` runs BEFORE `_handleTimeStop()` so projectiles, slashes, ripples, and glass shatter always decay smoothly during freeze/time stops.
- Dark Fountain suction strictly skips `isPullImmune` fighters (e.g., Escanor Solar Poise).

---

## 8. Sound & Audio Engineering
- Uses 14 authentic extracted `.ogg` SFX in `Assets/Sound Effects/KaizoKnightSFX/` plus Deltarune Ch.3 Knight SFX in `Assets/Sound Effects/RoaringKnightSFX/`, all mapped with normalized volumes in `kaizoKnightConfig.soundVolumes`, `js/configs/audioConfig.js`, and `js/soundEffects/basicAttackSounds.js`.

---

## 9. Asset Manifest & Directory Structure (`Assets/model/kaizo_knight/`)
- `KaizoKnight-hair.png`, `RadiantBlackKnife.png`, `KaizoCrescentSlash.png`, `KaizoCrescentArc.png`, `DiamondSwordBullet.png`, `DiamondBladeMedium.png`, `DiamondBladeLong.png`, `SwordBreakVFX.png`, `TunnelSlash.png`, `RoaringFinalShatter.png`, `RoaringFire.png`, `BlockVFX.png`, `BlockShieldOL.png`, `KaizoSpark.png`, `StarBulletKaizo.png`, `StarChildKaizo.png`, `KaizoBattleFlurry.png`.

---

## 10. Verification & Test Coverage Matrix
- Covered by `scripts/testAllFighters.mjs` (full roster lifecycle + Canvas 2D stack parity) and `[TEST 188]` in `scripts/testInteractions.mjs` (Rules 1, 18, 21, 23, 24, 25, 32, and all 4 Skill 1 variants + Skill 2 + Roaring Delta).
- Validated via `npm run verify` (`exit code 0`).
