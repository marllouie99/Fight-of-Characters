# LAST BREATH SANS — Fighter Technical & Lore Specification

## 1. Header & Metadata
- **Character ID**: `last_breath_sans` (aliases: `lastbreathsans`, `LastBreathSans`, `LAST_BREATH_SANS`)
- **Display Name**: `LAST BREATH SANS`
- **Fighter ID**: `81`
- **Grade**: `SS`
- **Category / Element**: `Gaming` / `dark`
- **Theme Color**: `#EF4444` (Deep Crimson Chest Slash — Secondary `#00E5FF` Electric Cyan Soul Eye, `#FF9500` Enigmatic Amber Flame)
- **Combat Role**: 3-Phase Evasive Bullet-Hell Controller / Gaster Hand Turret & Cracked Blaster Specialist

---

## 2. Lore & Character Philosophy
> *"it's not over yet... let's finish this."*

Inspired by *Undertale: Last Breath* (`mario1D240/undertale-last-breath-remake-bad-time-simulator`), **Last Breath Sans** begins battle at **`1 HP` backed by `100` Last Breath Stamina** (`LAST BREATH`) and escalates violently across all **3 iconic phases** as the fight wears him down:
- **Phase 1 ("Judgment")**: Clean dark hoodie, shadow-step dodges, and rapid Bone Volleys.
- **Phase 2 ("The Slaughter Continues")**: Triggers below `62` Stamina — reveals the diagonal crimson slash across his hoodie chest, restores `+12` resolve stamina, speeds up cooldowns, and mixes freezing **Blue Bones** and scorching **Orange Bones** into his basic volleys.
- **Phase 3 ("An Enigmatic Encounter")**: On his first lethal / stamina-breaking blow (`_revivePhase3Used === false`), Sans refuses defeat—cracking his skull vertically down across the socket, recovering **+40 Stamina** (one-time per match), summoning **Twin Void Gaster Hands**, and fully charging **`ENIGMATIC ENCOUNTER`**.

---

## 3. Visual Design & Rendering Standards (Rules 19, 20, 22, 24, 32, 35)
- **4-Zone Rule 24 Body Model (`js/graphics/fighters/lastBreathSansSkin.js`)**:
  ```
       [ LastBreathSans-hair.png — Spectral Cyan/Red/Amber Flame Crown ]
         ╭──────────────────────────────────────────────────────╮
         │ Zone 1 (<0.16r): Bone Skull + Ph.3 Diagonal Crack   │
         │   • Ph.1: Clean Skull & Pupils + Mouth Blood Drip   │
         │   • Ph.2/3: Blazing Cyan/Amber/Crimson Eye Glows    │
         ├──────────────────────────────────────────────────────┤
         │ Zone 2 (0.16r–0.32r): Fluffy White Hood Collar      │
         ├──────────────────────────────────────────────────────┤
         │ Zone 3 (0.32r–0.70r): Dark Hoodie + Ph.2/3 Slash    │
         ├──────────────────────────────────────────────────────┤
         │ Zone 4 (>=0.70r): Black Basketball Shorts & Stripes │
         ╰──────────────────────────────────────────────────────╯
  ```
- **Offscreen Canvas Pre-Baking (Rule 35)**: Body textures are pre-baked per `(intR, phase, eyeActive)` onto offscreen canvases (`P = 2.0px`, 4-neighbor `#0E0F14` outline) and blitted in a single quad (`ctx.drawImage`).
- **Canonical World Translation & 2.0px Outline (Rule 32)**: `drawLastBreathSansSkin(ctx, fighter)` translates internally to `(fighter.x, fighter.y - fighter.z)` and draws an explicit `2.0px` `#0E0F14` outline circle. Glowing eye lenses check `!fighter._isSilhouettePass`.
- **Zero Detached Idle Hands (Rule 20)**: Canonical pixel hands appear strictly at `(±r * 0.82, +r * 0.38)` during active telekinesis/skill casts (`drawLastBreathSansWeaponPreview`).
- **Rule 22 Hair Asset**: `Assets/model/last_breath_sans/LastBreathSans-hair.png` (`148×68`) cached via `_getLastBreathSansHairImage()` and wired into `SkinStudioScreen.js` and `SKIN_CUSTOMIZATIONS_DATABASE`.

---

## 4. Core Combat Mechanics & Passive Traits
- **Rule 23 Projectile Suppression**: `LastBreathSansFighter.shoot()` is overridden cleanly to prevent base generic bullet orbs.
- **Passive 1 — `1 HP + LAST BREATH` (`enableLastBreathDodge` & `enablePhase3Awaken`)**: Spawns with `hp: 1, maxHp: 1` and `100` Dodge Stamina rendered in the Sans-style HUD stamina bar via `hudManager.js`. Non-guaranteed incoming hits and slice lines are evaded via Shadow-Step (`MISS`, `biu.ogg`), costing `9%` of incoming damage (minimum `1`, or `1` in Sukuna's Domain), and counter-punishing with 2 Cracked Blasters. His first fatal blow when stamina is depleted triggers his one-time **Phase 3 Second Wind** (`+40` Stamina). Subsequent un-dodged hits reduce `hp` to `0`.
- **Passive 2 — `Karmic Retribution (KR)` (`enableKarma`)**: Applies stackable KR poison ticks (`1.5` base scaling, every `20f`, up to `10` stacks) with `{ skipInterrupt: true }`.

---

## 5. Dedicated Combat Skills Breakdown
- **Basic Attack — `Bone & Color Volley` (`enableBasicBone`)**: Fires a 3-bone spread (`11 dmg` each, speed `9.8`) using `BoneV.png`. From Phase 2 onward, outer bones alternate **Blue (`ColorBoneV.png`, stuns fast-moving targets for `12f`)** and **Orange (extra KR stacks)**. Connected basic hits build `finaleHits` toward **Enigmatic Encounter**.
- **Unified Skill 1 — `LAST BREATH ART` (Anti-Repeat Random Cycle, `300f` base CD, faster in Phases 2/3)**:
  1. **`CRACKED BLASTER` (`enableCrackedBlaster`)**: Summons `3` jagged Last Breath Gaster Blasters (`LastBreathSans-gaster-blaster-sprite-sheet.png`) around the enemy (respects Gojo Limitless Infinity & Knight Shield beam blocking).
  2. **`GASTER HANDS` (`enableGasterHands`)**: Summons **Twin Void Gaster Hands** (`GasterHand.png` from `ulb_repo/images/ball.png`) flanking left/right and firing aimed **Void Bullets** (`GasterBullet.png` + `biu.ogg`) while a center Cracked Blaster sweeps downward—adapted directly from `lastbreath.csv`.
  3. **`BONE CAGE SLAM` (`enableBoneCage`)**: Telekinetically slams (`Slam.ogg`) the enemy (`12 dmg` + knockback) and erupts `6` `BoneStabV.png` traps (`18 dmg`) with `Warning.ogg` ground telegraphs.
- **Signature Ultimate — `ENIGMATIC ENCOUNTER` (`enableEnigmaticFinale`, unlocks at `5` basic hits or Phase 3 awakening)**: Locks aim (`Rule 1.4`), triggers `dark.ogg` + `Flash.ogg`, surrounds the target with a `4`-blaster ring, fires a **`2.05×` Colossal Phase 3 Titan Blaster** down the committed aim vector, and finishes with a Rule 26 staggered concentric shockwave (`36` guaranteed AOE dmg + `14.5` knockback).

---

## 6. HUD Skill Configuration & Data Provider Gating (Rule 18)
Implemented in `hudSkillProviders.js` (`last_breath_sans`):
- Unified `#EF4444` `themeColor` across all skill bars (`last_breath_skill1`, `enigmatic_finale`), while `LAST BREATH` stamina uses the main Sans-style stamina bar via `hudManager.js`.
- Gated via `isSkillEnabled(cfg.enable[Skill], true)` and `cfgSkillName(...)` with zero redundant parenthetical suffixes.
- Registered `enigmatic_finale` in `isSkillExceptionInDarkMode()` `signatureMap`.

---

## 7. Physics & Status Effect Interactions (Rules 1, 21, 25)
- `update()` calls `_updateAllVfxLifecycles(arena)` BEFORE `_handleTimeStop()` so Blasters, Gaster Hands, Void Bullets, Color Bones, Traps, and Ripples decay cleanly even while frozen or stunned.
- Delegates movement & wall bounce to `super.update(opponent, ownerIndex, arena)` (Rule 1.2).
- `draw()` ends with `this.drawHealth(ctx); this.drawFreezeTimer(ctx); drawSansSpeechBubble(ctx, this);` (Rule 21).

---

## 8. Sound & Audio Engineering
- Unique SFX extracted from `mario1D240`: `Assets/Sound Effects/LastBreathSans/biu.ogg` and `Assets/Sound Effects/LastBreathSans/dark.ogg`.
- Reuses canonical Sans SFX in `Assets/Sound Effects/Sans/*.ogg` with normalized `soundVolumes` in `lastBreathSansConfig.js`.
- Registered in `audioConfig.js`, `basicAttackSounds.js`, and `skillSounds.js`.

---

## 9. Asset Manifest (`Assets/model/last_breath_sans/` & `Assets/Sound Effects/LastBreathSans/`)
- `Assets/model/last_breath_sans/LastBreathSans-hair.png` (`148×68`)
- `Assets/model/last_breath_sans/LastBreathSans-gaster-blaster-sprite-sheet.png` (`342×44`, 6×`57×44` frames)
- `Assets/model/last_breath_sans/GasterHand.png` (`32×32`)
- `Assets/model/last_breath_sans/GasterBullet.png` (`8×13`)
- `Assets/model/last_breath_sans/BoneV.png` (`10×24`)
- `Assets/model/last_breath_sans/BoneStabV.png` (`12×24`)
- `Assets/model/last_breath_sans/ColorBoneV.png` (`10×24`)
- `Assets/Sound Effects/LastBreathSans/biu.ogg`, `dark.ogg`

---

## 10. Verification & Test Coverage Matrix
- `[TEST 196]` in `scripts/testInteractions.mjs`: Validates Rule 24 scaled radius, Rule 23 `shoot()` suppression, Shadow-Step dodge + counter Cracked Blasters, Phase 1 -> Phase 2 transition + Blue/Orange Color Bone volleys, Phase 3 one-time lethal-hit Second Wind revival & Twin Gaster Hand turrets, Gaster Hand Void Bullets, Bone Cage Slam traps, `ENIGMATIC ENCOUNTER` ultimate lock/blast, Rule 25 freeze VFX decay, Rule 18 HUD bars, Canvas 2D stack depth `== 0`, and Rule 21 `drawHealth()` invocation.
- Verified with `node scripts/buildMobileAssets.mjs` and `npm run verify`.