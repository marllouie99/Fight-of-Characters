# Engineer — Master Builder & Combat Support (Team Fortress 2)

**Category:** Gaming (*Team Fortress 2* by Valve Corporation)  
**Character ID:** `engineer`  
**Fighter Grade:** `A`  
**Title:** `Combat Engineer`  
**Boss Title:** `Master of the Machine`  
**Theme Color:** Hardhat Gold / Warm Amber (`#FFB800`)  
**Secondary Accents:** RED Team Crimson (`#B91C1C`), Construction Orange (`#F97316`), Industrial Steel (`#64748B`), Sentry Shell Charcoal (`#1E293B`), Manga Ink (`#0E0F14`)  
**Role:** Builder / Architect, Area-Denial Turtler, Automated Fire Support & Sustained Healing Anchor  

---

## 📖 Lore & Character Philosophy

> *"Hey look, buddy. I'm an Engineer. That means I solve problems. Not problems like 'What is beauty?', 'cause that would fall within the purview of your conundrums of philosophy. I solve practical problems."*
> — *Dell Conagher, The Engineer*

Hailing from Bee Cave, Texas, **Dell Conagher** is a soft-spoken, intellectually towering polymath possessing eleven hard-science PhDs. While mercenaries brawl across gravel pits and industrial facilities with raw muscle and brute munitions, the Engineer approaches the battlefield as a complex physics and spatial equation waiting to be optimized. Armed with an automated blueprint PDA, an indestructible steel wrench, and his trusty 12-gauge shotgun, he fortifies ground with precision-machined sentry emplacements and life-saving support dispensers.

In the *Circle Mini-Battle* arena, the **Engineer** transforms open combat into an impenetrable fortress. Moving as a balanced humanoid circle fighter (`r = 25`), he constructs an autonomous **Sentry Turret** that tracks enemies across 360° and levels up into a quad-rocket minigun battery, while anchoring his survival with a **Dispenser** that tethers constant healing and ammo recovery. Armed with zero-knockback shotgun volleys and a heavy wrench swing that repels encroachers and repairs mechanical constructs, the Engineer proves that brains and engineering triumphs over raw chaos.

---

## 🎨 Visual Design & Rendering Standards

```
                      ┌─────────────────────────────────┐
                      │     ENGINEER BODY ZONING        │
                      └────────────────┬────────────────┘
                                       │
      ry < r * 0.28   ┌─────────────────┴─────────────────┐  Sun-Baked Tan Face & Goggles
                      │ Zone 1: Face Dome & Tinted Lenses │  (#FEDBC0, #1E293B Welder Lenses)
                      └─────────────────┬─────────────────┘
                                       │
  r*0.28 <= ry < r*0.68 ┌───────────────┴─────────────────┐  RED Work Shirt & Overalls
                      │ Zone 2: RED Shirt & Tool Suspender│  (#B91C1C Red, #262230 Charcoal)
                      └─────────────────┬─────────────────┘
                                       │
  r*0.68 <= ry < r*0.78 ┌───────────────┴─────────────────┐  Heavy Stitched Toolbelt
                      │ Zone 3: Leather Belt & Holster Box│  (#854D0E Saddle Brown & Brass)
                      └─────────────────┬─────────────────┘
                                       │
      ry >= r * 0.78  ┌─────────────────┴─────────────────┐  Work Trousers & Steel-Toe Boots
                      │ Zone 4: Dark Pants & Knee Guards  │  (High Luminance Y >= 24)
                      └───────────────────────────────────┘
```

### 1. Upright Fighter Body Model (Rule 19 Front POV Standard & Rule 24 Toji Baseline)
The Engineer's procedural pixel art body adheres strictly to the canonical Toji proportion zoning (`r = 25`):
- **Zone 1: Face Dome & Welding Goggles (`ry < r * 0.28`)**:
  - Warm sun-baked skin base (`#FEDBC0`) with cheek contour (`#E9B796`).
  - **Dark Welding Goggles (`Y ~ 0`)**: Opaque charcoal goggles frame (`#1E293B`) spanning `-r * 0.44` to `+r * 0.44` with subtle glass reflection gleam (`#475569`).
  - **Faceless Minimalist Standard (Rule 3.2 & Rule 19)**: Zero eyes, pupils, mouth, or nose. Expressive identity is established entirely through goggles, hardhat, red collar, and toolbelt.
- **Zone 2: RED Work Shirt & Overalls (`r * 0.28 <= ry < r * 0.68`)**:
  - Classic RED Team crimson fabric (`#B91C1C`) with white undershirt V-notch.
  - Charcoal overall bib and suspender straps (`#262230`) secured by metallic brass rivets (`#F59E0B`).
- **Zone 3: Heavy Stitched Leather Toolbelt (`r * 0.68 <= ry < r * 0.78`)**:
  - Saddle-brown stitched leather belt (`#854D0E`) with oversized rectangular brass buckle (`#EAB308`).
- **Zone 4: Heavy Work Trousers & Knee Guards (`ry >= r * 0.78`)**:
  - Dark brown work pants (`#3E2723`, $Y \ge 24$) with center fly seam, reinforced tan knee patches, and steel-toe boot caps (`#1E293B`).
- **Outer 4-Neighbor Ink Outline Shell (Rule 24 & Rule 32)**:
  - Solid dark manga ink outline (`#0E0F14`, 2.0px stroke) rendered using 4-neighbor boundary test into offscreen canvas (`_cachedEngineerBodyCanvas`) at $P = 2.0\text{px}$.

### 2. Construction Hard Hat Asset Import (Rule 22)
- **Asset Path**: `Assets/model/engineer/Engineer-Hair.png` (registered under `assets.hair` in `engineerConfig.js`).
- **Module Cache & Renderer**: Eagerly loaded via `_getEngineerHairImage()` and rendered by `_drawEngineerHair(ctx, r, facingLeft)` with nearest-neighbor scaling (`imageSmoothingEnabled = false`).
- **Bounding Box Calibration**: `targetHatWidth = r * 2.60`, `targetHatHeight = r * 1.55`, crown apex offset at `drawY = -r * 1.15`, perfectly framing the top head dome.

### 3. Canonical Hand Positioning & Tool Wielding (Rule 20)
- **Symmetrical Lower-Flank Placement**:
  - **Left Hand**: `(x: -r * 0.82, y: +r * 0.38)` with heavy yellow rubberized leather work glove (`#EAB308`, `#0E0F14` outline).
  - **Right Hand**: `(x: +r * 0.82, y: +r * 0.38)` holding shotgun grip or wrench handle directly at `(0, 0)` in weapon local space.
  - Zero duplicate hands are generated; exactly ONE pair of hands exists across all match states.

---

## ⚔️ Core Combat Mechanics & Passive Traits

- **Base Attributes**: HP: `400`, Speed: `5.0`, Radius: `r = 25`.
- **Rule 23 Generic Projectile Suppression**: Base `Fighter.shoot(ownerIndex)` is completely overridden; default generic bullet projectiles are suppressed in favor of dedicated multi-pellet Shotgun spreads and autonomous Sentry fire.
- **Automated Construct CC Immunity**: Sentry Turrets and Dispensers enjoy 100% debuff, CC, time-stop, and DoT immunity. They cannot be frozen by Gojo Infinity, chained by Makima, or stasis-locked by domain expansions.
- **Zero Knockback Standard**: Engineer's Shotgun pellets and Sentry bullets deal purely kinetic damage with **zero knockback push** on enemies, preventing enemies from being knocked uncontrollably out of the Sentry's firing cone. Knockback is strictly reserved for the close-quarters Wrench swing (`wrenchPushForce = 12`).

---

## 💥 Dedicated Combat Skills Breakdown

### 1. Primary Ranged Attack: 12-Gauge Pump Shotgun
- **Cooldown**: `100` frames (~1.67s)
- **Pellets**: `8` pellets fired in a wide conical spread (`spread = 0.45` rad ~26°).
- **Damage**: `5.20` per pellet (~41.6 total point-blank burst).
- **Range & Velocity**: `300px` range, `30px/frame` initial speed.
- **Weapon Kinematics**: Multi-phase recoil and pump slide racking animation (`shotgunRecoilDuration = 28` frames) with muzzle flash and ejecting brass casings.

### 2. Melee Weapon & Repair Tool: Heavy Steel Wrench
- **Cooldown**: `30` frames (~0.5s)
- **Damage**: `15` damage to enemies; repairs `30 HP` when striking friendly Sentry Turrets or Dispensers.
- **Frontal Arc**: 135° frontal melee cone, `85px` reach, delivering `12` knockback push and `8` frames of hit-stun.
- **Dual Function**: Acts as both a defensive anti-rushdown repellent and a maintenance tool to upgrade and heal damaged buildings.

### 3. Skill 1: Automated Sentry Turret
- **Cooldown**: `500` frames (~8.3s rebuild cooldown upon destruction).
- **Construction Time**: `200` frames (~1.5s) deploy phase with wrench build animations.
- **Target Acquisition**: Continuous 360° omnidirectional tracking within `360px` range.
- **Evolutionary Tiers**:
  - **Level 1**: Single Barrel Cannon (200 HP, 1.0 dmg/shot, fire rate 8f, 10 rounds/mag).
  - **Level 2**: Dual Gatling Miniguns (280 HP, 1.5 dmg/bullet = 3.6 per twin volley, fire rate 6f, 20 rounds/mag).
  - **Level 3**: Quad Rocket Pod + Heavy Gatlings (380 HP, 2.0 dmg/bullet, supersonic 5f fire rate, 30 rounds/mag, plus micro-rocket salvo dealing 5.0 AOE damage every 4 volleys).
- **HUD Overhead Indicators**: Floating ammo pips and segmented reload progress bar rendered directly above the turret head.

### 4. Skill 2: Field Dispenser
- **Health**: `300 HP`.
- **Tether Support**: Emits a luminous golden healing beam (`#FFB800`) to the Engineer within `160px` range, restoring continuous HP and drastically reducing weapon reload and pump recovery frames.

---

## 📊 HUD Skill Configuration & Data Provider Gating (Rule 18)

- **Provider**: `js/graphics/ui/hudSkillProviders.js`
- **Theme Color**: Strictly `#FFB800` across all skill bars (Unified Character Palette Standard).
- **Gating**:
  - `enableSentryTurret`: Gated by `isSkillEnabled(cfg.enableSentryTurret, true)`.
  - `enableDispenser`: Gated by `isSkillEnabled(cfg.enableDispenser, true)`.
- **Clean Labels**: Displays clean labels (`SENTRY TURRET`, `DISPENSER`) with dynamic countdowns strictly in parenthetical numbers (e.g. `(4.2S)`), never redundant `(READY)` or `(ACTIVE)` tags.

---

## 🛡️ Physics & Status Effect Interactions

- **Rule 1 Freeze Guard**: Universal `_handleTimeStop()` check at the top of `update()`. If frozen, attacks and building animations halt immediately.
- **Rule 25 VFX Decay**: Transient muzzle flashes, spark debris, and smoke arrays decay at the very top of `update()` before the freeze guard, preventing visual artifacts from freezing in mid-air.
- **Building Collision**: Sentry Turret (`r = 18`) and Dispenser (`r = 16`) possess physical body hitboxes that provide solid cover against enemy projectiles and body block melee rushdown.

---

## 🔊 Sound & Audio Engineering

- **Shotgun Blast**: Deep concussive boom layered with metallic pump slide rack.
- **Wrench Clang**: Visceral metallic hammer strike on buildings; layered fleshy slap (`attack_fleshhit`) on enemy impact.
- **Sentry Gatling**: Rapid mechanical gunfire with supersonic tracer whistle and micro-rocket hiss.
- **Volume Balancing**: Calibrated inside `js/configs/audioVolumeConfig.js`.

---

## 📁 Asset Manifest & Directory Structure

- `Assets/model/engineer/Engineer-Hair.png` (Hard hat asset)
- `js/entities/fighters/EngineerFighter.js` (Combat entity logic)
- `js/graphics/fighters/engineerSkin.js` (Procedural skin & hard hat renderer)
- `js/graphics/weapons/engineerWeaponGraphics.js` (Shotgun, Wrench & Muzzle graphics)
- `js/configs/characters/engineerConfig.js` (Config source-of-truth)
- `docs/fighters/engineer.md` (This documentation file)

---

## 🧪 Verification & Test Coverage Matrix

- Validated via `scripts/verifyCodebase.js` (zero duplicate keys, exact asset casing).
- 100% Canvas 2D transform stack depth balance in `scripts/testAllFighters.mjs`.
- Multi-fighter interaction tests in `scripts/testInteractions.mjs`:
  - **Test 113**: Engineer Buildings (Turret & Dispenser) 100% debuff, CC & DoT immunity.
  - **Test 117**: Engineer Sentry & Shotgun zero knockback and wrench melee push standard.

