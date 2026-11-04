# The Warden — Blind Horror of the Deep Dark (Minecraft)

**Category:** Gaming (*Minecraft: The Wild Update* by Mojang Studios)  
**Character ID:** `warden`  
**Fighter Grade:** `S` (Boss Tier)  
**Title:** `Blind Horror of the Deep Dark`  
**Boss Title:** `Sculk Behemoth`  
**Theme Color:** Deep Sculk Teal (`#0D9488`)  
**Secondary Accents:** Glowing Soul Cyan (`#00F5D4`), Abyssal Sculk Obsidian (`#020608` / `#051318`), Weathered Ancient Bone (`#E5DEC9` / `#C4BCA2`), Manga Ink (`#0E0F14`)  
**Role:** Hulking Boss-Tier Stalker, Vibration Echolocator, Enraged Juggernaut & Supersonic Kinetic Sniper  

---

## 📖 Lore & Character Philosophy

> *"A hulking blind monster that lurks in the deepest subterranean caverns. It cannot see you... but every step you take, every arrow you loose, and every swing of your blade echoes through the sculk, fueling its bottomless rage."*

Deep beneath the bedrock of the Overworld lies the ruined **Ancient City**, blanketed in sound-reactive sculk growth. Guarding these forgotten abysses is **The Warden**—not merely an apex predator, but a subterranean force of nature engineered to punish hubris. Completely devoid of eyes, the Warden perceives its environment entirely through sound, air displacement, and smell. Those who attempt to evade it soon discover that distance provides no sanctuary; channeling the trapped souls in its glowing ribcage, it unleashes an unblockable, supersonic shockwave capable of obliterating armor and flesh through solid rock.

In the *Circle Mini-Battle* arena, **The Warden** operates as a massive boss-tier entity (`r = 30`). It introduces the innovative **Sculk Echolocation & Anger Engine**: initially pacing the arena at an eerie, deliberate stalk (`speed: 3.8`), every enemy dash, projectile shot, blade swing, and explosive blast generates acoustic vibrations that fill its Anger gauge. Upon hitting maximum rage, the Warden unleashes an enraged battle cry, surging forward at blistering rushdown speed (`speed: 5.6`) to pulverize enemies with bone-shattering melee strikes, snaring foes with sculk tendril traps, blinding the arena in Darkness pulses, and blasting across the entire map with its terrifying signature move: the **Sculk Sonic Boom**!

---

## 🎨 Visual Design & Rendering Standards

```
                      ┌─────────────────────────────────┐
                      │      THE WARDEN BODY ZONING     │
                      └────────────────┬────────────────┘
                                       │
      ry < r * 0.24   ┌─────────────────┴─────────────────┐  Sculk Head Dome & Gaping Maw
                      │ Zone 1: Gaping Maw & Sculk Crown  │  (#020608 Void, Cyan Catalyst Specks)
                      └─────────────────┬─────────────────┘
                                       │
  r*0.24 <= ry < r*0.78 ┌───────────────┴─────────────────┐  Exposed Soul Ribcage
                      │ Zone 2: Ancient Bone Ribs & Core  │  (#E5DEC9 Bone, Pulsing Soul Center)
                      └─────────────────┬─────────────────┘
                                       │
  r*0.78 <= ry < r*0.86 ┌───────────────┴─────────────────┐  Abyssal Pelvis & Abdomen
                      │ Zone 3: Compact Sculk Abdomen     │  (#051318 Dense Sculk)
                      └─────────────────┬─────────────────┘
                                       │
      ry >= r * 0.86  ┌─────────────────┴─────────────────┐  Sculk Tendril Legs & Claws
                      │ Zone 4: Rooted Heavy Sculk Base   │  (High Luminance Y >= 24)
                      └───────────────────────────────────┘
```

### 1. Upright Fighter Body Model (Rule 19 Front POV Standard & Rule 24 Boss Tier r = 30)
The Warden's body geometry adheres strictly to the canonical manga ink standard at a hulking boss scale (`r = 30`):
- **Zone 1: Gaping Sculk Maw & Forehead Dome (`ry < r * 0.24`)**:
  - Deep sculk void interior (`#020608`) flanked by tooth-like jagged sculk perimeter rows (`#0E313B`).
  - Forehead crown dotted with procedural glowing soul cyan speckles (`#00F5D4`).
  - **Faceless Minimalist Lore Compliance**: Zero human eyes, pupils, or nose. Senses the arena purely via vibrational echolocation and scent.
- **Zone 2: Ancient Bone Ribcage & Luminous Soul Core (`r * 0.24 <= ry < r * 0.78`)**:
  - Outer shoulder bone plates (`#E5DEC9`) framing four distinct horizontal ancient bone rib pairs.
  - **Pulsing Chest Soul Core**: Center ribcage cavity filled with glowing soul teal (`#0C9486`) and dynamic beating soul cyan pulses (`#00F5D4`) that glow intensely during Sonic Boom charging.
- **Zone 3: Dense Sculk Waistband (`r * 0.78 <= ry < r * 0.86`)**:
  - Abyssal dark teal sculk band (`#051318`) cinching the ribcage above the base.
- **Zone 4: Rooted Heavy Sculk Base (`ry >= r * 0.86`)**:
  - Dark sculk stone base (`#0E313B`, $Y \ge 24$) with subtle glowing soul flecks.
- **Outer 4-Neighbor Ink Outline Shell (Rule 24 & Rule 32)**:
  - Solid dark manga ink outline (`#0E0F14`, 2.0px stroke) rendered using 4-neighbor boundary test into offscreen canvas (`_cachedWardenBodyCanvas`) at $P = 2.0\text{px}$.

### 2. Sculk Antenna Horns Asset Import (Rule 22)
- **Asset Path**: `Assets/model/warden/warden-hair.png` (registered under `assets.hair` in `wardenConfig.js`).
- **Module Cache & Renderer**: Eagerly loaded via `_getWardenHairImage()` and rendered by `_drawWardenHair(ctx, r, facingLeft)` with nearest-neighbor scaling (`imageSmoothingEnabled = false`).
- **Calibration**: `targetHairWidth = r * 3.30`, `targetHairHeight = r * 1.75`, crown offset `drawY = -r * 1.58`, creating the iconic branching 16-bit sound-sensitive sculk sensor horns sprouting from the temples.

### 3. Canonical Hand Positioning & Pulverize Wielding (Rule 20)
- **Symmetrical Placement**:
  - **Left Hand**: `(x: -r * 0.82, y: +r * 0.38)` with massive sculk bone fist (`handRadius = r * 0.30`, `#092128` fill, `#0E0F14` outline).
  - **Right Hand**: `(x: +r * 0.82, y: +r * 0.38)` anchoring pulverizing ground slams.
  - Zero floating hands; exactly ONE pair of hands exists across all match states.

---

## ⚔️ Core Combat Mechanics & Passive Traits

- **Base Attributes**: HP: `580`, Calm Speed: `3.8`, Enraged Speed: `5.6`, Radius: `r = 30` (Boss Tier).
- **Rule 23 Generic Projectile Suppression**: Base `Fighter.shoot(ownerIndex)` is completely overridden; generic bullet projectiles are suppressed.
- **Passive: Sculk Echolocation & The Anger Engine**:
  - Cannot see opponents directly.
  - Detects acoustic vibrations within `420px` radius: footstep dashes (`+3 anger`), enemy swings/casts (`+10 anger`), bullets fired (`+14 anger`), and detonations (`+25 anger`).
  - Upon reaching `100 anger`, enters **Enraged State** for 6.0 seconds (`enragedDuration = 360` frames): movement speed increases to `5.6`, attack damage increases from `42` to `62`, and the Warden roars with visual screen shake.

---

## 💥 Dedicated Combat Skills Breakdown

### 1. Basic Attack: Heavy Sculk Pulverize (Rule 30 Melee Kinematics)
- **Cooldown**: `48` frames (~0.8s)
- **Damage**: `42` normal, `62` when enraged.
- **Reach & Knockback**: `80px` reach, `14` knockback impulse.
- **5-Phase Lifecycle (Rule 30)**:
  1. Lift/Coil: `8` frames
  2. Poised Hold: `3` frames
  3. Strike: `7` frames
  4. Impact Lock / Ground Latch: `8` frames with `vx = 0, vy = 0` and impact tremors
  5. Recovery Settle: `14` frames

### 2. Skill 1: Darkness Pulse (Deep Dark Blindness)
- **Cooldown**: `480` frames (8.0s)
- **Radius**: `240px` expanding abyssal soul mist.
- **Duration**: `150` frames (2.5s)
- **Effect**: Reduces arena visibility and slows caught enemies by `45%` (`slowMultiplier = 0.55`).

### 3. Skill 2: Sculk Tendril Sniff (Stealth Tracking & Ground Trap)
- **Cooldown**: `380` frames (~6.3s)
- **Duration**: `40` frames
- **Effect**: Sniffs out hidden/stealthed targets (including Toji in ambush); spawns creeping sculk tendril ground traps beneath enemies that deal `24` damage and root targets for `45` frames (0.75s).

### 4. Ultimate: SCULK SONIC BOOM (Rule 1.4 & Rule 26 Piercing Supersonic Blast)
- **Cooldown**: `720` frames (12.0s)
- **Charge Phase**: `45` frames (0.75s) telegraphed chest charging where soul core pulses intensely.
- **Firing Phase**: `24` frames (0.40s) active supersonic beam extending `520px` with `36px` beam width.
- **Damage**: `95` unblockable kinetic damage delivering `22` massive knockback impulse.
- **Visuals**: Animated 12-frame master strip (`Assets/model/warden/sonic_boom/sonic_boom-b.png`) with clean concentric water-ripple compression rings (Rule 26) and zero rectangular clipping (Rule 31).

---

## 📊 HUD Skill Configuration & Data Provider Gating (Rule 18)

- **Provider**: `js/graphics/ui/hudSkillProviders.js`
- **Theme Color**: Strictly `#0D9488` (Sculk Teal) across all skill bars.
- **Gating**:
  - `enableDarknessPulse`: Gated by `isSkillEnabled(cfg.enableDarknessPulse, true)`.
  - `enableSculkSniff`: Gated by `isSkillEnabled(cfg.enableSculkSniff, true)`.
  - `enableSonicBoom`: Declares `isSignature: true, signature: true, isUltimate: true` and registered in `isSkillExceptionInDarkMode()` signature map.
- **Clean Labels**: Clean labels (`DARKNESS PULSE`, `SCULK SNIFF`, `SONIC BOOM`) with dynamic countdowns strictly in parenthetical numbers (e.g. `(6.2S)`), never redundant `(READY)` or `(ACTIVE)` tags.

---

## 🛡️ Physics & Status Effect Interactions

- **Rule 1 Freeze Guard**: Universal `_handleTimeStop()` check at the top of `update()`. If frozen, attack channeling and roar animations pause immediately.
- **Rule 25 VFX Decay**: Sculk vibration rings, soul mist particles, and sonic boom shockwaves decay at the very top of `update()` before the freeze guard, preventing lingering visual artifacts.
- **Boss Stature**: Heavy body mass resists trivial displacement and handles high-inertia wall impacts.

---

## 🔊 Sound & Audio Engineering

- **Deep Cavernous Roar**: Low-frequency resonant roar upon entering Enraged state.
- **Sculk Vibration Click**: Subtle high-frequency echolocation clicks on sound detection.
- **Sonic Boom Detonation**: Heavy sub-bass concussive blast layered with supersonic air-tearing crack.
- **Volume Balancing**: Calibrated in `js/configs/audioVolumeConfig.js`.

---

## 📁 Asset Manifest & Directory Structure

- `Assets/model/warden/warden-hair.png` (Sculk sensor antenna horns)
- `Assets/model/warden/sonic_boom/sonic_boom-b.png` (Sonic boom 12-frame animation strip)
- `js/entities/fighters/WardenFighter.js` (Combat entity & echolocation logic)
- `js/graphics/fighters/wardenSkin.js` (Procedural skin & sculk horns renderer)
- `js/graphics/weapons/wardenWeaponGraphics.js` (Sonic boom & sculk trap renderer)
- `js/configs/characters/wardenConfig.js` (Config source-of-truth)
- `docs/fighters/warden.md` (This documentation file)

---

## 🧪 Verification & Test Coverage Matrix

- Codebase integrity verified via `scripts/verifyCodebase.js`.
- 100% Canvas 2D transform stack depth balance in `scripts/testAllFighters.mjs`.
- Multi-fighter interaction tests in `scripts/testInteractions.mjs`:
  - **Test 115**: The Warden vibration echolocation, anger meter, darkness pulse, sculk sniff, and Sonic Boom verified successfully.

