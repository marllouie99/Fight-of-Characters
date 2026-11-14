# Roaring Knight (`roaring_knight`)

> **Archetype:** Gaming / S-Tier Swordmaster Boss (*Deltarune Chapter 3*)  
> **Signature Kit:** Black Knife Cleave, Falling Swords, Star Burst, Roaring Swoon  
> **Standards Enforced:** Rule 1, Rule 11, Rule 18, Rule 20, Rule 21, Rule 22, Rule 23, Rule 24, Rule 25, Rule 26, Rule 30, Rule 32, Rule 33, Rule 35.

---

## 1. Visual & Skin Architecture
- **Circle Body (`js/graphics/fighters/roaringKnightSkin.js`)**: Pre-baked 1:1 offscreen buffer (`P = 2.0`, Rule 24 Toji/Gojo standard, scaled `r = 25` base -> `30` via `super(def)`).
  - **Zone 1 (Helmet Faceplate & Visor Dome)**: Dark slate-obsidian plating (`#1B1E2B`) with highlighted metallic brow rim (`#32384D`) and a razor-sharp crescent white eye visor (`#F8FAFC`).
  - **Zone 2 (Upper Thorax & Ribcage Armor)**: Stepped obsidian chestplate (`#161822`) with luminous white rib-plate core slash and shoulder pauldrons (`Y >= 24` luminance inside `#0E0F14` 4-neighbor ink border).
  - **Zone 3 (Waist Belt & Mantle Clasp)**: Silver clasp highlight (`#94A3B8`) and crimson core accent (`#EF4444`).
  - **Zone 4 (Greaves & Shadow Mantle Hem)**: Articulated obsidian leg plating (`#1F2433`).
- **Layer 2 Horned Crown (`Assets/model/roaring_knight/RoaringKnight-hair.png`)**: Swept forked Deltarune antler crown anchored to the top of the faceplate via `_drawRoaringKnightHair`.
- **Canonical Weapon Grip (Rule 20)**: Black Knife (`Assets/model/roaring_knight/BlackKnife.png`) anchored strictly to the canonical main-hand position with single-source `drawPixelHand` knuckles over the hilt and dynamic shoulder-to-wrist arm linkage during swings. Zero loose floating fists on neutral idle.

## 2. Configuration & Balance (`js/configs/characters/roaringKnightConfig.js`)
- **Base Stats**: `hp: 460`, `r: 25` (`radius: 25`), `speed: 4.9`, `grade: 'S'`, unified HUD `themeColor: '#EF4444'`.
- **Config Toggles (`isSkillEnabled`)**: `enableShadowMantle`, `enableBlackKnife`, `enableFallingSwords`, `enableStarBurst`, `enableRoaringSwoon`.

## 3. Passive: Shadow Mantle Dash
- Leaves crisp, short-lived obsidian/silver afterimage trails when dashing above `afterImageMinSpeed` (`4.4`), avoiding mobile GPU overload via strict velocity/frame gating (Rule 35).

## 4. Basic Attack: Black Knife Cleave (Rule 30 5-Phase Melee)
- Suppresses default generic bullets via empty `shoot(ownerIndex)` override (Rule 23).
- Executes a 5-phase melee lifecycle alternating downward cleave and upward rising slash:
  - Windup (`9f`) -> Strike (`7f`) -> Impact Lock (`6f`) -> Recovery/Settle (`13f`) — zero micro-frames.
  - Multi-target frontal arc AOE (`88px` reach, `140°` cone, `26` damage, `11` knockback).

## 5. Skill 1: Falling Swords
- Channels dark power (`26f`) before ringing the opponent with `6` `FallingSword.png` blades around their coordinates.
- Holds a clear `18f` locked-angle telegraph before plunging inward at `14.5 px/frame` (`16` damage per blade hit, non-freezing decay).

## 6. Skill 2: Star Burst
- Launches a spinning 6-pointed `StarBullet.png` orb toward the target (`5.4 px/frame`).
- Pulses crimson (`StarBulletRed.png`) over `42f` (or upon impact) and detonates radially (`24` core blast damage + concentric Rule 26 ripple shockwave), bursting `8` piercing `StarChild.png` diamond shards outward (`12` damage each).

## 7. Ultimate: Roaring Swoon (Dark Fountain Dimensional Cleave)
- Signature move registered in `signatureMap` (`roaring_knight`).
- **Channel (`38f`)**: Locks continuous 360° aim (`skillCastAngle`), triggers `snd_knightroar.wav` + `snd_knight_powerup_white.wav`, and projects a pulsing crimson aiming seam across the arena.
- **Execution (`14f` active + `20f` recovery)**: Unleashes a full-arena dimensional cut (`RoaringSwoonLine.png` + sweeping `RedSlash.png` crescents), dealing `78` damage across a `560px` length × `42px` half-width corridor with `20` knockback, `22f` swoon stun, and camera shake.

## 8. Audio Integration (`Assets/Sound Effects/RoaringKnightSFX/`)
- Registered in `js/configs/audioConfig.js`, `js/soundEffects/basicAttackSounds.js` (`id: 73` & `'roaring_knight'`), and `js/soundEffects/skillSounds.js`.
- Uses authentic Deltarune Chapter 3 knight cuts, falling swords, star explosion, metal hits, roar, boxbreak, wide slash, and dark fountain SFX.

## 9. HUD & Skin Studio Integration
- **HUD (`js/graphics/ui/hudSkillProviders.js`)**: Unified `themeColor` (`#EF4444`), strict `isSkillEnabled` gating, clean idle labels (no `(READY)`), dynamic timer countdowns, and `signatureMap` dark-mode registration.
- **Skin Studio (`js/graphics/ui/SkinStudioScreen.js`)**, **Card Element (`js/configs/cardElementConfig.js` -> `dark`)**, and **`js/configs/skinCustomizationsDatabase.js`**.

## 10. Verification & Edge-Case Guards
- Rule 1 freeze guard + Rule 25 top-of-update VFX decay ensure projectiles/slashes/afterimages never freeze in mid-air during time stops.
- All Canvas 2D contexts maintain exact `0` transform stack depth (`save`/`restore` parity), verified in `scripts/testInteractions.mjs` Test 172 and `npm run verify`.
