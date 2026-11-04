# Hyoma Chigiri — The Red Panther (Blue Lock)

**Category:** Anime & Sports Icons (*Blue Lock* by Muneyuki Kaneshiro & Yusuke Nomura)  
**Character ID:** `chigiri`  
**Fighter Grade:** `S`  
**Title:** `44-Panther Mach Pace`  
**Boss Title:** `The Red Panther`  
**Theme Color:** Hot Rose Pink (`#EC4899`)  
**Secondary Accents:** Crimson Rose Panther Accent (`#F43F5E`), Blue Lock Bodysuit (`#30426A` / `#111827`), Slate Shorts (`#344666`), Manga Ink Outline (`#0E0F14`)  
**Role:** Pure Speedster, Breakaway Sprinter, Mach Velocity Interceptor & Hypersonic Volley Finisher  

---

## 📖 Lore & Character Philosophy

> *"I don't care about my right leg anymore. If it breaks, let it break. From here on, I'm running to become the best in the world!"*

Hyoma Chigiri (千切 豹馬) entered the **Blue Lock** facility as a fallen track prodigy whose supreme speed had become his greatest trauma. Blessed with superhuman sprinting acceleration and feline agility, he was considered an unstoppable forward until a devastating tear of his right anterior cruciate ligament (ACL) shattered his confidence. Terrified that one wrong step would snap his knee forever, Chigiri voluntarily caged his ego, playing as a timid, passive midfielder content to let his career quietly expire.

During Team Z's desperate battle against Team W, watching Yoichi Isagi fight with unrelenting hunger ignited the dying embers of Chigiri's pride. Refusing to live as a bystander in someone else's dream, Chigiri mentally snapped his own chains: **"The Red Panther" was uncaged**.

In Blue Lock canon, Chigiri possesses an elite 50-meter sprint time of **5.77 seconds**, allowing him to outpace any defender in a straight breakaway footrace. When combined with his weapon—the **Mach Pace Sprint**—he knocks the soccer ball deep into open space, beating everyone to the ball through sheer linear velocity before unleashing his lethal cross or cut-in shot.

In *Circle Mini-Battle*, Chigiri enters the pitch as the fastest humanoid sprinter in the game (`speed = 6.4`). Adhering to the universal **Single Persistent Soccer Ball Standard**, Chigiri does not cast generic magic or shoot vanilla bullets. Instead, he sprints across the pitch to intercept the soccer ball with **Panther Sprint**, gaining an immediate lingering **+40% Speed Surge** on every dash, and awakening his **44-Panther Mach Pace EGO** to blitz opponents at **+60% movement speed** while finishing rounds with the universal Blue Lock **STRIKER!** volley kick.

---

## 🎨 Visual Design & Rendering Standards

```
                      ┌─────────────────────────────────┐
                      │    HYOMA CHIGIRI BODY ZONING    │
                      └────────────────┬────────────────┘
                                       │
     ry < r * 0.28   ┌─────────────────┴─────────────────┐  Clean Fair Skin Face Dome
                     │ Zone 1: Pure Face & Cheeks Dome   │  (#FEDBC0 / #E9B796)
                     └─────────────────┬─────────────────┘  Forehead Highlight (#FFF0E2)
                                       │
 r*0.28 <= ry < r*0.68 ┌───────────────┴─────────────────┐  High Collar (#10141E)
                     │ Zone 2: Blue Lock #44 Jersey Suit │  Shoulder Pads (#3A4D72)
                     └─────────────────┬─────────────────┘  Chest Pectorals (#425A84)
                                       │
 r*0.68 <= ry < r*0.78 ┌───────────────┴─────────────────┐  Athletic Waistband (#1C2536)
                     │ Zone 3: Waistband & Rose Clip     │  Hot Rose Clip (#EC4899)
                     └─────────────────┬─────────────────┘
                                       │
     ry >= r * 0.78  ┌─────────────────┴─────────────────┐  Dark Slate Shorts (#344666)
                     │ Zone 4: Athletic Compression Short│  Rose Hem Trim (#EC4899)
                     └───────────────────────────────────┘
```

### 1. Upright Fighter Body Model (Rule 19 & Rule 24 Toji Baseline Standard)
Chigiri's circular body geometry, proportion zoning, and pixel layers strictly adhere to the repository Canonical Manga Ink Trio baseline (`r = 25`):
- **Zone 1: Pure Face & Cheeks Dome (`ry < r * 0.28` to `0.30r`)**:
  - Clean fair anime skin tone (`#FEDBC0`) with warm cheek contours (`#E9B796`) and soft forehead highlight (`#FFF0E2`).
  - Zero baked-in facial expressions or mouths on the body circle, maintaining clean manga ink aesthetics.
- **Zone 2: Blue Lock #44 Jersey & Compression Bodysuit (`0.28r <= ry < 0.68r`)**:
  - **High Collar Rim (`#10141E`)**: Encloses the throat seamlessly at `ry < r * 0.35`.
  - **Electric Rose Center Notch (`#EC4899`)**: Subtle V-neck collar dip accent.
  - **Shoulder Volume Bands (`#3A4D72`)**: Full-width shoulder highlight pads from `|rx| >= r * 0.52`, guaranteeing the torso maintains full athletic volume beneath the side hair locks without pinched flanks.
  - **Pectoral Highlights (`#425A84`) & Bodysuit Fabric (`#30426A`)**: Blue Lock compression fabric maintaining strict luminance separation ($Y \ge 24$) against the `#0E0F14` outer ink border.
- **Zone 3: Waistband & Cinch (`0.68r <= ry < 0.78r`)**:
  - Dark athletic waistband (`#1C2536`) with upper highlight (`#32425E`) and a luminous Hot Rose Blue Lock center geometric clip (`#EC4899`).
- **Zone 4: Athletic Shorts (`ry >= 0.78r`)**:
  - Slate athletic shorts (`#344666`) with center fly seam (`#1E283A`), deep pleat shadow folds (`#26344A`), and continuous Hot Rose hem trim (`#EC4899`) along `ry >= r * 0.90`.
- **Outer Manga Ink Outline Shell (Rule 24 & Rule 32)**:
  - Exact 4-neighbor boundary test filled with solid dark manga ink outline (`#0E0F14`).
  - Offscreen 1:1 canvas buffer caching (`_cachedChigiriBodyCanvas`) at discrete grid $P = 2.0\text{px}$, blitting via `ctx.drawImage` with `imageSmoothingEnabled = false`.

### 2. Hair Asset Model & Head Silhouette (Rule 22 & Rule 24)
- **Asset Path**: [`Assets/model/chigiri/Chigiri_hair.png`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/Assets/model/chigiri/Chigiri_hair.png).
- **Eager Loader & Cache**: Managed by `_getChigiriHairImage()` with proactive module-level initialization.
- **Bounding Box Calibration**: Measured from true visible non-zero pixel art bounding box:
  - $X: [281, 1222]$ (visible width 942, face opening centered at $X = 772$).
  - $Y: [0, 1023]$ (visible height 1024, crown top apex at $Y = 0$).
- **Volume & Placement**:
  - Target Width: $r \times 2.65$ (~$66.25\text{px}$).
  - Target Height: $r \times 2.45$ (~$61.25\text{px}$).
  - Crown Apex Anchor: `drawY = -r * 1.85`, perfectly aligning the face cavity over Zone 1 Face Dome and exposing the full #44 Blue Lock jersey matching Makima and Isagi standards.
- **Skin Studio Customization**: Full support for real-time scale, offsets, rotation, and flipping via `state.skinCustomizations.chigiri`.

### 3. Canonical Default Hands (Rule 20 Standard)
- Symmetrical lower-flank hand anchors:
  - **Left Hand**: `(x: -r * 0.82, y: +r * 0.38)` with `handRadius = r * 0.30`.
  - **Right Hand**: `(x: +r * 0.82, y: +r * 0.38)` with `handRadius = r * 0.30`.
- Rendered on the **front layer** using `drawChigiriFist` (`drawPixelHand`) with `#FFF0DE` skin fill and `#0E0F14` outer stroke.
- **Rule 24 Neutral Body Standard**: Zero static detached hands glued to the neutral body circle; fists are only rendered during active melee strikes or weapon wielding.

### 4. Aerodynamic Rose Slipstream Trails
- Active during **Panther Sprint**, post-dash **Speed Surge**, and **EGO Awakening**:
  - Procedural rose-pink aerodynamic wind streaks (`#EC4899`, `rgba(236, 72, 153, 0.70)`) trailing behind the head and shoulders.
  - Dynamically modulated via high-resolution performance timestamps (`performance.now()`) to convey supersonic forward momentum.

### 5. Ghost Afterimages
- During Panther Sprint breakaway surges, Chigiri sheds translucent ghost afterimages (`drawChigiriGhostSkin`):
  - Retains full upright silhouette, hair asset, and jersey markings.
  - Smoothly decays from $\alpha = 0.60 \to 0$ over $14\text{ frames}$.

---

## ⚔️ Core Combat Mechanics & Passive Traits

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **HP** | `400` | Baseline athletic striker health pool. |
| **Radius ($r$)** | `25` | Universal Rule 24 humanoid circle radius. |
| **Base Movement Speed** | `6.4` | Fastest humanoid base sprinter in the game. |
| **Aim Angle** | 360° | Continuous omnidirectional targeting towards opponents. |
| **Basic Projectile** | **Suppressed** | Overrides `shoot(ownerIndex)` with blank method (Rule 23). |

### 1. Single Persistent Soccer Ball Standard
- When multiple Blue Lock characters are present in the match (e.g. Isagi vs. Chigiri), they share **exactly ONE persistent soccer ball** on the pitch.
- Chigiri moves 100% naturally via standard circle fighter physics (`applyMovementPhysics` and `resolveWallBounce`).
- Chigiri attacks exclusively by physically kicking the soccer ball when he and the ball naturally converge.
- When not kicking, the soccer ball elastically deflects off his body circle.

### 2. Universal Blue Lock Trait: EGO Awakening ("44-Panther Mach Pace")
- Successfully hitting opponents with the soccer ball fills Chigiri's EGO meter:
  - **Standard Panther Shot Hit**: `+25%` EGO.
  - **Rebound Bank Shot Hit**: `+35%` EGO.
  - **STRIKER! Finisher Impact**: `+50%` EGO.
- Upon reaching `100%`, Chigiri unleashes **"44-PANTHER MACH PACE"**:
  - **Sprint Speed Multiplier**: **+60% movement speed** (`speedMultiplier: 1.60`).
  - **Feline Evasion**: **25% dodge chance** (`dodgeChance: 0.25`, triggers floating `EVADE!`).
  - **Kick Speed Multiplier**: **+25% ball velocity** (`kickSpeedMultiplier: 1.25`).
  - **Damage Multiplier**: **+15% kick damage** (`damageMultiplier: 1.15`).
  - **Duration**: `360 frames` (6.0s duration), extended by `+30 frames` (+0.5s) per ball impact.
  - **Live HUD Stats Update**: Dynamically updates the player card to display:
    ```
    SPD: ▲ (+60% EGO)
    EVADE: 25%
    EGO: 44-PANTHER MACH PACE
    ```

---

## 💥 Dedicated Combat Skills Breakdown

### Basic Attack: Panther Shot (Kinetic Soccer Drive)
- **Master Toggle**: `cfg.enablePantherShot` (`true`).
- **Cooldown**: `32 frames` (~0.53s rapid cadence).
- **Damage**: `22` direct hit, `28` rebound bank shot.
- **Ball Velocity**: `15.0 px/frame`.
- **Max Rebounds**: `1` (bounces once off arena walls).
- **Kick Accuracy**: `94%` straight-line precision.
- **Kick Slow Follow-Through**: Brief `14-frame` recovery slow on Chigiri (`0.25x` movement speed) as he completes his kicking stride.

### Dribble & Mach Breakaway Ball Control
- **Ball Control Archetype**: `Mach Breakaway Speed Dribble`
- **Control Rating**: `90%` base control -> `98%` during Speed Surge -> `100%` during EGO Awakening
- **Mechanic Overview**:
  - When Chigiri intercepts or catches the soccer ball while Panther Shot is on cooldown (`shootCooldown > 0`), he enters the **Mach Dribble State**.
  - **Forward Lead Offset**: Unlike Isagi's tight spatial pocket, Chigiri leads the ball slightly ahead in his sprint stride (`leadDistance: 8px`), pushing the ball forward along his velocity vector.
  - **Dribble Pace Momentum**: Grants a **+15% movement speed boost** (`dribbleSpeedMultiplier: 1.15`) while running with the ball! When combined with Panther Speed Surge (+40%) or EGO Awakening (+60%), Chigiri blitzes across the pitch with unmatched breakaway velocity.
  - **Rapid Micro-Touch Cadence**: Micro-taps the ball every 7 frames, kicking up pink turf sparks and leaving aerodynamic rose afterimage streaks under the ball.
  - **Ball Kick Steal & Bumping Defense**:
    - When an opponent physically bumps into Chigiri or intercepts the ball being pushed in front of his sprint stride, a **Ball Kick Steal** check is rolled (base 50% chance, mitigated by Chigiri's 90% control, or boosted if the tackler dashes in at high speed).
    - If the steal proc succeeds: Chigiri is `DISPOSSESSED!`, suffers a 16-frame stagger (`applyHitStun`), active attacks are interrupted, and a 35-frame shoot cooldown penalty is applied, preventing him from immediately shooting the ball.
    - If the bumper is another Blue Lock striker, they steal possession (either firing an immediate `STEAL & SHOT!` or taking over the dribble). If the bumper is a non-Blue Lock fighter, the ball is kicked loose into open space.
  - **HUD Feedback**: Displays dynamic `DRIBBLE: 90% (MACH DRIBBLE +15% SPD)` in the HUD card stats.

### Skill 1: Panther Sprint (Mach Breakaway Dash & Lingering Speed Surge)
- **Master Toggle**: `cfg.enablePantherSprint` (`true`).
- **Cooldown**: `240 frames` (4.0s).
- **Dash Distance**: `240px` long-distance surge.
- **Execution Frames**: `22 frames`.
- **Invulnerability Window**: `14 frames` of complete damage evasion (`SLIP!`), slipping through linear beams and projectiles.
- **Interception Logic**: When a loose soccer ball is within $180\text{px}$, Chigiri immediately dashes to intercept the ball at Mach speed.
- **Core Mechanic — Lingering Post-Dash Speed Surge & Evade Mechanic**:
  - Every time Chigiri dashes with Panther Sprint, he immediately gains a lingering **+40% speed boost** (`pantherSpeedBuffTimer = 150`, 2.5s duration).
  - **Mach Evade Mechanic**: During this temporary speed surge, Chigiri gains an active **35% evasive dodge chance** (`pantherSprintEvadeChance: 0.35`). When dodging, he negates incoming damage, spawns floating `EVADE!`, plays a crisp dash whoosh SFX, sheds rose-pink ghost afterimages, and executes a reactive micro-juke slip.
  - During this speed surge, Chigiri runs with active rose aerodynamic wind streaks and periodic ghost afterimage trails trailing behind his body.
  - **EGO Synergy**: If EGO Awakening is activated simultaneously, evade chances synergize up to **50% evasion** (`SURGE+EGO`).

### Skill 2: "STRIKER!" (Universal Blue Lock Ultimate / Signature Finisher)
- **Master Toggle**: `cfg.enableStriker` (`true`).
- **Cooldown**: `1080 frames` (18.0s).
- **Windup Delay**: `0 frames` (instant volley strike in stride with zero delay).
- **Finishing Damage**: `72` heavy blast damage.
- **Ball Speed**: `25.0 px/frame` hypersonic velocity (fastest strike in Blue Lock).
- **Knockback Impulse**: `22.0` directional force for `14 frames`.
- **Stun Aftermath**: Upon slamming into an arena wall or completing knockback flight, the target suffers **90 frames (~1.5s) of complete stun** (`STUNNED!`).
- **Screen Shake**: `8px` global camera impulse.

---

## 📊 HUD Skill Configuration & Data Provider Gating

Implemented in [`js/graphics/ui/hudSkillProviders.js`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/js/graphics/ui/hudSkillProviders.js) under `chigiri(f)`:

```javascript
// Rule 18 Unified Character Palette Standard
const themeColor = f.color || cfg.themeColor || '#EC4899';
```

1. **Skill 1: Panther Sprint (`panther_sprint`)**:
   - Gated by `isSkillEnabled(cfg.enablePantherSprint, true)`.
   - Color: strictly references `themeColor` (`#EC4899`).
   - Clean dynamic labels:
     - Post-Dash Speed Surge: `SPEED SURGE (2.5S)` (countdown drain).
     - Cooldown: `PANTHER SPRINT (4.0S)`.
     - Ready: `PANTHER SPRINT` (zero redundant status suffixes).
2. **Skill 2: "STRIKER!" (`striker`)**:
   - Gated by `isSkillEnabled(cfg.enableStriker, true)`.
   - Color: strictly references `themeColor` (`#EC4899`).
   - Labels: `STRIKER!` (Ready) or `STRIKER! (18.0S)` (Cooldown).
   - Declares `isSignature: true, signature: true, isUltimate: true`.
3. **Passive Trait: EGO Awakening (`ego`)**:
   - Gated by `isSkillEnabled(cfg.enableEgo, true)`.
   - Color: strictly references `themeColor` (`#EC4899`).
   - Labels: `EGO (25%)` (charging) or `EGO AWAKENED (6.0S)` (active duration drain).
   - Declares `isSignature: true, signature: true`.
4. **Dark Mode Signature Registration**:
   - Registered under `chigiri` in `signatureMap` inside `isSkillExceptionInDarkMode()` so all signature skills remain visible in Dark Mode HUD.

---

## 🛡️ Physics & Status Effect Interactions

- **Rule 1.1 Freeze & TimeStop Guard**:
  ```javascript
  const isFrozen = this._handleTimeStop();
  if (isFrozen || this.isTargetOfAmbush) {
    this.interruptAttacks();
    if (isPrimaryBlueLockBallController(this, state)) {
      this._updateSoccerBallPhysics(opponent, arena);
    }
    return;
  }
  ```
- **Rule 25 Top-of-Update Non-Freezing Visual Effects Decay**:
  - `_updateVisualEffects()` decays puzzle shards, shockwaves, afterimages, kick impacts, and 16-bit hit bursts **at the very top of `update()` before the freeze guard**, ensuring active effects decay naturally during stasis.
- **Primary Controller Delegation**:
  - If frozen or immobilized, the designated primary Blue Lock controller still steps the shared soccer ball's physics so that an active ball in mid-flight never freezes in thin air.

---

## 🔊 Sound & Audio Engineering

| Action / Event | Sound File Path | Volume | Description |
| :--- | :--- | :--- | :--- |
| **Panther Sprint Dash** | `Assets/Sound Effects/Skills/dash1.mp3` | `0.75` | Crisp aerodynamic wind breakaway whoosh. |
| **Panther Shot Kick** | `Assets/Sound Effects/Attacks/swordswing.mp3` | `0.70` | Sharp cleat impact on soccer ball leather. |
| **STRIKER! Finisher Kick** | `Assets/Sound Effects/Skills/toji-2stseq-2ndweaponAttack.mp3` | `0.85` | Supersonic kinetic explosion on strike. |
| **STRIKER! Enemy Impact** | `Assets/Sound Effects/Attacks/heavypunch1.mp3` | `0.95` | Heavy concussive impact delivering knockback. |
| **EGO Awakening Activation** | `Assets/Sound Effects/Skills/enhance.mp3` | `0.85` | High-frequency aura release sound. |

---

## 📁 Asset Manifest & Directory Structure

```
Circle Mini-Battle/
├── Assets/
│   └── model/
│       └── chigiri/
│           └── chigiri-hair.png                  # Dedicated 32-bit transparent hair asset (Rule 22)
├── js/
│   ├── configs/
│   │   ├── characters/
│   │   │   └── chigiriConfig.js                  # Character attributes, speed, cooldowns & EGO buffs
│   │   └── skinCustomizationsDatabase.js         # Default hair scale (1.00) & offsets
│   ├── entities/
│   │   ├── fighters/
│   │   │   └── ChigiriFighter.js                 # Main fighter entity class
│   │   └── factories/
│   │       └── fighterFactory.js                 # FIGHTER_CLASS_MAP registration
│   ├── graphics/
│   │   ├── fighters/
│   │   │   └── chigiriSkin.js                    # Rule 24 pixel body, hair overlay & speed trails
│   │   └── ui/
│   │       └── hudSkillProviders.js              # Rule 18 HUD skill bars & Dark Mode registration
│   └── systems/
│       └── soccerBallSystem.js                   # Universal Blue Lock registry & EGO Awakening
├── docs/
│   └── fighters/
│       └── chigiri.md                            # Mandatory 10-section documentation (Rule 33)
└── scripts/
    └── testInteractions.mjs                      # Test 129 automated verification
```

---

## 🧪 Verification & Test Coverage Matrix

Validated via **`npm run verify`** with 100% pass rate:
- **Test 126**: Single Shared Soccer Ball standard across multiple Blue Lock characters.
- **Test 127**: Universal Blue Lock EGO Awakening potential buffs and live HUD stats update.
- **Test 129**: Hyoma Chigiri dedicated mechanics:
  1. Instantiation, identity, and **Rule 24 standard $r = 25$ radius**.
  2. Theme color consistency (`#EC4899`) and damage number color matching.
  3. Skill 1 Panther Sprint dash execution and **lingering +40% speed surge** (`pantherSpeedBuffTimer = 150`).
  4. Soccer ball sharing with Isagi (`isagi.soccerBall === chigiri.soccerBall`).
  5. EGO Awakening potential unlock (**+60% speed multiplier**, **25% evasion**).
  6. Skill 2 STRIKER! finisher execution with knockback and stun.
  7. Canvas 2D transform stack depth balance ($0$).
