# Choso — The Death Painting Eldest Brother

**Category:** Anime & Jujutsu Sorcerers  
**Theme Color:** Deep Crimson Blood (`#A31D1D` / `#8B0000`)  
**Secondary Accents:** Laser Core Radiant White-Pink (`#FF2A55` / `#FFFFFF`), Cursed Violet Shroud (`#6B1736` / `#4A0E2E`), Robe Charcoal Plum (`#261B2E`)  
**Role:** Sanguine Tactician, Arena Carpet Zoner, Convergence Burst Finisher

---

## 📖 Lore & Character Philosophy

Choso (脹相) is the eldest of the nine **Cursed Womb: Death Paintings** (*Jusō Taiten*), an incarnated hybrid born from the unholy union of a human woman, a cursed spirit, and the blood of the vile sorcerer Noritoshi Kamo (Kenjaku). Stern, melancholic, and fiercely devoted, Choso lives for a single absolute purpose: **the protection and love of his younger brothers**. 

*"I will stand at the front to protect them. Even if it makes me pathetic, even if I look ridiculous... an older brother has to lead the way for his little brothers!"*

When Choso discovers that Yuji Itadori shares the same bloodline, his paternal and brotherly instinct awakens with unstoppable conviction. In the *Circle Mini-Battle* arena, Choso wields the supreme zenith of **Blood Manipulation (*Sekiketsusōju — 赤血操術*)**. 

Unlike mortal Kamo clan sorcerers who risk fatal hypovolemic shock if they bleed excessively, Choso’s half-curse physiology allows him to **convert cursed energy directly into fresh blood**. He possesses an inexhaustible, infinite blood supply. Taking advantage of this biological miracle, Choso saturates the arena with his poisonous blood—and with a terrifying application of **Convergence (*Shuren*)**, hyper-pressurizes every stray blood droplet in the environment until it ignites, **transmuting scattered blood particles into a coordinated, multi-angle barrage of lethal, piercing laser beams!**

---

## 🎨 Visual Design & Rendering Standards

### 1. Upright Fighter Body Model (Rule 19 Front POV Standard & Rule 24 Toji Baseline)
Choso's fighter model, facial silhouette, hair knots, and traditional Noritoshi robes strictly adhere to the front-profile camera orientation standard:
- **Head & Face Dome (`-Y` to `Y ~ 0`, Rule 3.2 Faceless Minimalist Aesthetic)**:
  - Clean fair/pale skin base dome (`#F2D7C3`) with side shadow contour (`#D8B298`).
  - **Zero Facial Features**: Strict prohibition of eyes, pupils, sclera, irises, nose bridge, or mouth.
  - **Iconic Blood Bridge Strip**: A prominent horizontal rectangular dark blood-scab band (`#5C131D` core with `#7F1D2B` edge) painted across the nose bridge and cheeks from `-r * 0.45` to `+r * 0.45` at `y = -r * 0.04` to `+r * 0.08`.
  - Bleak, cold expression communicated purely through posture and the horizontal blood stripe.
- **Hair Asset & High Twin Tufts (Rule 22 Standard)**:
  - External dedicated asset: `Assets/model/choso/choso-hair.png`.
  - Signature dark espresso / midnight-plum messy hair with two distinctive high-tied twin tufts/pigtails angling upward and outward at 45° from the crown apex (`drawY = -r * 1.35`).
  - Sharp jagged forehead bangs terminating at `y = -r * 0.22`, cleanly framing the upper skin dome.
- **Attire & Robes (`+Y`)**:
  - High cream-white under-kimono scarf collar tightly wrapped around the neck (`r * 0.28 <= ry < r * 0.42`).
  - Sleeveless dusty-lavender / deep plum-charcoal martial arts tabard tunic (`#2E2236`) spanning full circle width (`r * 0.42 <= ry < r * 0.65`).
  - Wide dark burgundy/black obi belt sash tightly bound at `y = +r * 0.65` to `+r * 0.78` with a forward knot fold.
  - Deep slate-black baggy hakama trousers (`#1A1622`) flowing downward to `+r * 1.05`.
- **Default Symmetrical Hands, Dynamic Arm Linkages & Hand Animation Kinematics (Rule 20 & Rule 30 Standard)**:
  - **Left Hand Baseline**: `(x: -r * 0.82, y: +r * 0.38)` with `handRadius = getHandSize(r * 0.30)`.
  - **Right Hand Baseline**: `(x: +r * 0.82, y: +r * 0.38)` with `handRadius = getHandSize(r * 0.30)`.
  - **Dynamic Arm Linkage (`_drawChosoArmLinkage`)**: Connects shoulders `(±r * 0.65, r * 0.22)` directly to hands with natural 2-segment elbow flexion based on extension distance. Renders the outer `#0E0F14` ink border, plum-charcoal martial arts sleeve fabric (`#2E2236`, shadow `#1D1422`, crest highlight `#3F2F4A`), pale athletic forearms (`#EAD2C2`, crest highlight `#F4E4D7`), cream sleeve cuffs (`#EEE5D3`), and deltoid rim caps (`#221828`).
  - **Single Source of Truth Hand Guarantee (Rule 20)**: Exactly ONE pair of hands (`drawPixelHand`) rendered on screen across all combat states. Weapon hilts, singularities, and needles anchor directly to the canonical hands with zero duplicate hands.
  - **Smooth Windup & Ability Hand Animations**:
    - **Convergence (Ultimate)**: Sanguine spray lift (`retaliationSprayTimer`, arms sweep up-out to `±r * 0.98, -r * 0.10`) $\to$ cosine inward prayer glide (`laserMatrixTimer`, hands smoothly glide inward from flanks to chest center `0, r * 0.22`) $\to$ optical diode telegraph hold (`laserTelegraphTimer`, interlocking prayer clasp with high-frequency micro-tremor vibration & pulsing crimson/white diode in palms) $\to$ post-discharge smooth recovery glide back to flanks.
    - **Piercing Blood (Skill 3)**: Forward nozzle thrust ($p < 0.35$, hands travel forward to `+r * 0.72`) $\to$ tight aperture nozzle clamp ($0.35 \le p < 0.80$, thumbs and index fingers pressed together forming circular nozzle ring at `+r * 0.80, 0`) $\to$ Mach 3 compression tension tremor ($p \ge 0.80$, high-frequency vibration) $\to$ supersonic beam discharge & instant kinetic recoil kickback (hands jar back to `+r * 0.20, ±r * 0.22`) $\to$ decelerating power ease recovery back to default resting flanks.
    - **Supernova (Skill 2)**: Commanding gravitational hold windup (`supernovaWindupMax = 24`, arms sweep outward and upward to `±r * 1.04, -r * 0.15` in authoritative posture with pulsing concentric cursed energy rings around open palms) $\to$ concussive outward/downward detonation snap (`supernovaDetonationTimer = 14`, hands thrust to `±r * 1.12, +r * 0.18` with impact lock) $\to$ decelerating return to resting flanks.
    - **Slicing Exorcist / Chakram (Skill 1)**: Asymmetrical coiling windup (`chakramThrowTimer = 16`, right throwing arm coils back across chest to `-r * 0.25, +r * 0.44` with spinning miniature chakram in palm, while left arm raises in tactical front guard `-r * 0.78, -r * 0.08`) $\to$ hypersonic whip strike (right arm whips forward across the body to `+r * 1.15, -r * 0.05`, launching the chakram) $\to$ follow-through settle back to default hands.
    - **Sanguine Darts (Primary)**: Needle coil back (`dartThrowTimer = 12`, right hand pulls back to `+r * 0.65, +r * 0.44` with razor blood needle glint) $\to$ sharp needle flick forward (`+r * 1.05, +r * 0.12`) $\to$ spring recoil settle back to default flanks.
    - **Blood Edge (Melee)**: 5-phase cleave kinematics (Rule 30: Lift/coil $\to$ apex hold $\to$ hypersonic whip strike $\to$ impact lock $\to$ recovery settle) with a razor-sharp single-edged coagulated blood dagger (`#990000` base, `#FF2A55` edge, `#FFFFFF` spine glint) anchored directly in the right hand.
  - Full compatibility with `state.showSkinOnly`.

### 2. Discrete Pixel Art Rasterization ($P = 2.0\text{px}$) & Offscreen Cache (Rule 3.5 & Rule 24)
- Rasterizes the complete body circle onto an axis-aligned in-memory canvas (`_cachedChosoCanvas`) via `_renderChosoPixelBodyToCanvas(destCtx, r)`.
- Re-rasterizes ONLY when fighter radius `r` changes.
- Blits during rotated gameplay frames using a single `ctx.drawImage(_cachedChosoCanvas, -size / 2, -size / 2)` with `ctx.imageSmoothingEnabled = false;`.
- Strict 4-neighbor attached boundary shell test with solid dark manga ink outline (`#0E0F14`) and zero floating stray pixels.

### 3. Damage Blood Particles & Sanguine Particle Architecture
- Whenever Choso takes damage in combat, arterial blood particles spray violently out of his wounds (`spawnBloodEffect` into `state.bloodEffects`):
  - Every blood particle erupting from Choso is tagged (`isChosoBlood: true`, `sourceEntity: choso`) and tracked via the `onBloodParticleSpawned(particleData)` engine hook and stored in `this.bloodNodes`.
  - While airborne, droplets follow true fluid ballistic gravity arcs and arena wall/floor bounces.
  - Up to **32 concurrent blood droplets** can saturate the arena simultaneously.
  - Sanguine particles decay naturally over their lifespan (~8.0s / `480 frames`) if unconsumed.
- **Strict Enemy Blood Isolation Standard**:
  - Choso **strictly manipulates his own blood**. Blood particles shed by enemies when damaged by Choso's attacks are strictly filtered out by `isEnemyBlood()` and **never captured** into `this.bloodNodes`.
  - Enemy blood droplets never contribute to Choso's Sanguine Resonance damage multiplier, cannot be ignited into laser diodes, and decay according to standard arena physics.
- **Used Particle Consumption & Natural Expiration Lifecycle**:
  - **Natural Expiration**: When an unconsumed blood particle's lifespan reaches 0 (`node.lifespan <= 0`), it is cleanly eradicated from the arena (`_clearBloodNode(node, false)`), removing it from `state.bloodEffects`, destroying its PIXI sprite, and emitting subtle dissolution sparks.
  - **Shift Queue Cleanup**: When the 32-droplet cap is reached, oldest nodes shifted off the queue are cleanly cleared from `state.bloodEffects` and memory to prevent orphaned background particles.
  - **Used Particle Consumption**: Whenever blood particles are seized and used as the physical origin or ammunition for any offensive ability, they are **cleanly consumed and cleared from the arena** upon completion of the attack via `_clearBloodNode()`.

### 4. Crimson Laser Transmutation Visuals (Unique Signature Aesthetic)
- When Choso activates **Blood Manipulation: Convergence**:
  - **Phase 1 — Gravitational Singularity Lock**: All active blood particles in the arena instantly stop all velocity (`vx = 0, vy = 0`), floating weightlessly.
  - **Phase 2 — Photonic Ionization**: Each blood droplet pulses violently, blooming into a blinding miniature crimson-white laser diode ring (`#FF2A55` outer halo, `#FFFFFF` pure core) with an expanding 2-stage compression ripple (Rule 26 compliant, no cobwebs or starburst spokes).
  - **Phase 3 — Optical Needle Telegraph**: Hair-thin target lock-on laser guidance beams (`0.75px`, `rgba(255, 42, 85, 0.65)`) snap from every blood node directly toward the opponent's center coordinate.
  - **Phase 4 — Supersonic Beam Discharge**: Every blood droplet simultaneously fires a high-intensity, continuous laser beam (`thickness: 4.5px`, white-hot core with radiant crimson-violet bloom) that lasts for 18 frames, cutting straight through the target with immense multi-hit concussive force!

### 5. Manga Action Speed Lines & Piercing Blood Shockwaves (Rules 16 & 26)
- **Speed Lines (Rule 16)**: 4-point filled needle polygons trailing strictly behind Choso during *Piercing Blood* recoil and *Flowing Red Scale* sprints.
  - 4-slot theme palette: Deep Blood Ink (`#3B0D14`), Cursed Crimson (`#A31D1D`), Laser Rose (`#FF2A55`), White Core (`#FFFFFF`).
- **Clean Concentric Shockwaves (Rule 26)**:
  - *Piercing Blood* muzzle blast: 3 staggered concentric compression discs popping out sequentially ($t_0 = 0.00, t_1 = 0.12, t_2 = 0.24$) along decelerating power curves.
  - Zero radial spokes, zero cobweb nets, zero spinning ticks.

---

## 🛡️ Baseline Stats

| Attribute | Base Value | Flowing Red Scale Active | Notes |
| :--- | :--- | :--- | :--- |
| **HP** | `420` | `420` | High-durability Death Painting constitution |
| **Base Speed** | `2.45` | `3.18` (`+30%`) | Measured, tactical zoner spacing |
| **Body Radius** | `25px` | `25px` | Rule 24 Standard Humanoid Baseline |
| **Melee Reach** | `70px` | `75px` | 130° Frontal Arc Coagulated Blood Daggers |
| **Blood Droplet Cap** | `32 Nodes` | `32 Nodes` | Maximum lingering blood nodes in arena |
| **Blood Node Lifetime** | `12.0s` (`720f`) | `12.0s` | Refreshed upon new skill emissions |
| **Laser Beam Range** | Full Arena (`900px`) | Full Arena (`900px`) | Infinite range hitscan-velocity trajectory |
| **Laser Piercing Power** | `100% Piercing` | `100% Piercing` | Passes through summons, clones & multiple bodies |

---

## ⚡ Passives & Inherent Mechanics

### 1. 🩸 Innate Technique: Infinite Sanguine Generation & Resonance (*Mugen Ketsuryū*)
Unlike ordinary humans who suffer lethal blood loss and anemia from Blood Manipulation, Choso's half-curse biology enables **endless hematopoiesis**:
* **Cursed Energy to Blood Conversion & Natural Expiration**:
  - Whenever Choso takes damage from enemy attacks, he bleeds violently—spawning interactive Blood Droplet Nodes that scatter into the arena.
  - Droplets follow natural fluid ballistics and land on the arena floor, where they **expire naturally** over their lifespan (~8.0s / floor decay).
* **Unexpired Blood Damage Scaling (Sanguine Resonance)**:
  - **Dynamic Damage Scaling**: Every active blood particle in the arena that **has not yet expired** supercharges Choso's cursed energy output, increasing the damage dealt by ALL of his abilities by **+4% per unexpired blood particle** (up to +125% bonus / 2.25x damage cap!).
  - When Choso takes multiple rapid hits in succession, unexpired blood pools heavily in the arena, causing his retaliatory counterattacks (Convergence, Piercing Blood, Supernova, Chakrams, and Sanguine Darts) to hit with devastating amplified damage!
  - As blood particles expire naturally, this damage boost gracefully decays back to base level (1.0x).
* **Poisonous Death Painting Blood (*Yūdokuketsu*)**:
  - Stepping on or colliding with a Blood Droplet Node applies **1 stack of Blood Poison** for 4.0s (capped at 5 stacks).
  - Each stack slows movement speed by **5%** and deals **3 True Damage / sec**.

---

### 2. 🔴 Flowing Red Scale: Stack (*Sekirin Ketsurui: Chō — 赤鱗躍動・載*)
By manipulating his internal blood composition, Choso accelerates his pulse, body temperature, and erythrocyte oxygen delivery:
* **Activation Threshold**:
  - Automatically activates when HP drops below **60%**, or when manually triggered during high-combo chains.
* **Combat Doping Buffs**:
  - Movement speed increased by **+30%** (`2.45 → 3.18`).
  - Basic attack recovery speed improved by **+25%**.
  - All blood abilities spawn **double the quantity of Blood Droplet Nodes**.
  - Renders red capillary vascular markings glowing under his skin and eyes.

---

## ⚔️ Abilities & Moveset (On-Hit Sanguine Retaliation Standard)

> [!IMPORTANT]
> **Blood Particle Attack Origin & Used Particle Consumption Standard**:
> All of Choso's offensive attacks and abilities trigger **when he gets hit** in combat. Taking damage erupts fresh arterial blood particles into the arena. These blood particles immediately become the **physical source and firing origin** of his offensive attacks, and are **cleanly cleared up** upon completing their firing lifecycle:
> - **Convergence (Ultimate)**: Every blood droplet in the arena ignites into an optical laser focus diode and discharges high-intensity piercing laser beams directly from each blood droplet. Upon completion of the laser discharge (`dischargeTimer <= 0`), all used blood focus nodes are cleanly dissolved and cleared from the arena.
> - **Piercing Blood (Skill 3)**: A blood particle condenses under extreme hydraulic pressure and fires the supersonic Mach 3 beam directly from the blood droplet. When the beam sequence finishes, the origin blood droplet is dissolved and cleared up.
> - **Supernova (Skill 2)**: Blood particles swell with orbiting compressed spheres and detonate in 360° fragmentation bursts directly from the blood droplets. The source blood nodes are immediately cleared upon detonation.
> - **Slicing Exorcist (Skill 1)**: A blood droplet condenses into a razor-sharp rotating blood chakram that launches directly from the droplet, cleanly consuming the source node upon launch.
> - **Sanguine Darts (Primary)**: Spawned blood droplets shoot high-velocity piercing blood needles directly from each droplet into the attacker, after which the fired droplets are cleared from the battlefield.
>
> **Natural Expiration vs Ability Consumption**: Blood particles that are NOT consumed by retaliatory abilities expire naturally over their ~8.0s lifespan. While unexpired blood particles persist, Choso gains up to **+125% (+4% per node)** bonus damage on his ready abilities. Once consumed by an ability, the particle is cleared, dynamically adjusting the resonance multiplier.

### 🗡️ Primary Attack: Sanguine Darts (*Ketsueki no Ya*)
* **Type**: High-Velocity Retaliatory Blood Needle Barrage (Fires directly from spawned blood particles)
* **Cooldown**: `36 frames` (~0.60s)
* **Damage**: `18 Piercing Damage per Dart`
* **Mechanics**:
  - Triggers on hit when higher-tier skills are on cooldown. Fresh blood particles erupt from Choso's wound.
  - Each spawned blood droplet instantly crystallizes and fires a supersonic blood needle dart directly from `(node.x, node.y)` into the attacker.
* **Basic Projectile Suppression (Rule 23)**:
  - Overrides default `shoot(ownerIndex)` to suppress generic circular bullets.

---

### 🩸 Skill 1: Slicing Exorcist / Blood Chakram (*Karisō — 刈祓*)
* **Type**: High-Velocity Bouncing Blood Chakram (Launches directly from a spawned blood droplet)
* **Cooldown**: `6.0 seconds` (`360 frames`)
* **Damage**: `38 Slashing Damage` (multi-hits up to 2 times for `76 Damage`)
* **Lifespan**: `90 frames` (1.5 seconds)
* **Mechanics**:
  - Triggers on hit when Skill 1 is ready. Blood particles erupt from the wound.
  - A spawned blood droplet condenses into a rotating, circular disc blade of spinning razor-sharp blood and launches forward from `(node.x, node.y)`.
  - The Chakram slices through enemies with continuous shredding hitstun, bouncing off arena boundary walls up to **3 times**.
  - **Droplet Trail**: Every 6 frames of travel, the chakram flings off droplets of blood, seeding the battlefield with Blood Droplet Nodes.

---

### 💥 Skill 2: Supernova (*Chōshinsei — 超新星*)
* **Type**: 360° Omnidirectional Fragmentation Detonations (Detonates directly from blood droplets)
* **Cooldown**: `9.0 seconds` (`540 frames`)
* **Damage**: `14 Damage per Shrapnel Pellet` (Spawns 12 pellets in a radial starburst per blood node)
* **Mechanics**:
  - Triggers on hit when Skill 2 is ready. Blood particles erupt from the wound.
  - Blood droplets swell and compress into high-pressure orbs orbiting around each blood node.
  - With a sudden concussive release, the blood droplets detonate in 360° explosive fragmentation rings directly from `(node.x, node.y)`!
  - Enemies caught in the blast are knocked back with heavy physical hit-pause.

---

### 🔴⚡ UNIQUE SIGNATURE SKILL: Blood Manipulation: Convergence
* **Type**: Arena-Wide Particle-to-Laser Conversion & Hitscan Piercing Crossfire
* **Cooldown**: `14.0 seconds` (`840 frames`)
* **Cast Time**: `16 frames` (Tense Convergence Clasp Stance)
* **Laser Damage**: `14 True Piercing Damage per Active Blood Node`
* **Mechanics**:
  - **Step 1 — On-Hit Retaliation**: When Choso is hit with Ultimate ready, he erupts 14–18 blood particles fanning out into mid-air behind him away from the attacker.
  - **Step 2 — Diode Ignition**: Every blood droplet in the arena abruptly halts and crystallizes into a radiant crimson-white optical focus diode.
  - **Step 3 — Razor-Thin Lock Telegraph**: Guidance laser lines project from EVERY active blood node directly toward the opponent.
  - **Step 4 — Supersonic Laser Discharge**: Every blood droplet simultaneously discharges continuous piercing laser beams from `(node.x, node.y)` cutting straight through the target!

---

### 🩸⚡ SKILL 3: Piercing Blood (*Teisō / Fuga — 穿血・真収斂*)
* **Type**: Cinematic Supersonic Pressure Cannon (Fires directly from a mid-air blood droplet!)
* **Cooldown**: `15.0 seconds` (`900 frames`)
* **Total Damage**: `125 True Piercing Damage`
* **Recoil Force**: `16 px/frame` backward momentum
* **Cinematic Execution Sequence**:
  1. **Phase 1 — Singularity Compression (Frames 1–30)**:
     - Triggers on hit when Skill 3 is ready. Blood particles spray from Choso.
     - A leading blood droplet freezes in mid-air and compresses violently down to a white-hot singularity with concentric compression shockwaves (Rule 26).
  2. **Phase 2 — Mach 3 Piercing Release (Frames 31–66)**:
     - The blood droplet fires a devastating Mach 3 supersonic beam of hyper-pressurized blood directly from `(node.x, node.y)` through the target.
     - Diameter: `26px` with white-hot laser core (`#FFFFFF`) and burning crimson sheath (`#FF1E44`).
  3. **Phase 3 — Sanguine Vapor Fallout**:
     - Leaves a vapor trail of fresh blood droplet nodes along its line of fire.

---

## 📊 HUD Skill Layout & Visual Theme

All HUD skill progress bars and card accents strictly use Choso's unified **Deep Crimson Blood** theme color (`#A31D1D`) adhering to **Rule 18 / Rule 2.8**:

```
┌─────────────────────────────────────────────────────────────┐
│ CHOSO (DEATH PAINTING ELDEST)                 HP: 420 / 420 │
│ [█████████████████████████████████████████████████████████] │
│                                                             │
│ [Skill 1: Slicing Exorcist]    [  READY  ] #A31D1D (Blood)  │
│ [Skill 2: Supernova]           [  READY  ] #A31D1D (Blood)  │
│ [Skill 3: Piercing Blood]      [  READY  ] #A31D1D (Blood)  │
│ [Ultimate: Convergence]        [  READY  ] #FF2A55 (Laser)  │
│ [Active Blood Nodes in Arena: ◆◆◆◆◆◆◆◆◆◇ (18/32)]           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Matchup Dynamics & JJK Synergies

| Opponent | Lore & Mechanical Matchup Dynamic |
| :--- | :--- |
| **vs Yuji Itadori** | **"My Little Brother!" Resonance**: Choso feels a deep, instinctual soul resonance with Yuji. Choso's blood poison does not harm Yuji. If Yuji and Choso are paired on the same team, both gain **+15% Attack Power** and Choso prioritizes body-blocking projectiles targeting Yuji. |
| **vs Naoya Zenin** | **Sanguine Counter to Projection Sorcery**: True to their Shibuya/Itadori Extermination arc duel, Naoya's supersonic 24 FPS speed is crippled by Choso's blood-carpeted arena! Stepping on Choso's blood floor applies poison and viscosity friction, reducing Naoya's movement speed and disrupting his predetermined 24-frame paths. |
| **vs Satoru Gojo** | **Limitless Barrier Physics (Rule 1.7)**: Gojo's Infinity halts standard blood droplets, chakrams, and physical slashes. However, Choso's **Convergence** fires high-frequency photonic energy from 20+ simultaneous angles, testing the spatial barrier, while *Piercing Blood* requires Gojo's full barrier concentration. |
| **vs Mahito** | **Poison to Cursed Spirits**: Mahito cannot manipulate Choso's soul without touching him, while Choso's cursed blood is inherently toxic to cursed spirits, dealing +25% bonus poison tick damage to Mahito. |
| **vs Toji Fushiguro** | **Zenin / Heavenly Restriction Clash**: Toji's high-speed dashes can evade *Piercing Blood* narrow trajectories; however, Choso's 360° *Supernova* and omnidirectional *Laser Matrix* create unavoidable area coverage that Toji cannot slip through without taking chip damage. |

---

## 🔊 Sound Design & Audio Mapping

| Combat Event | Sound Effect Path | Volume / Playback | Rationale |
| :--- | :--- | :--- | :--- |
| **Blood Dagger Slash (Melee)** | `Assets/Sound Effects/Attacks/attack_fleshhit.mp3` layered with `attack_swordswing.mp3` | `1.00 Vol` / `1.10x` | Visceral, wet cutting slap adhering to Rule 30 audio standards |
| **Blood Dart Flick** | `Assets/Sound Effects/Attacks/dagger_throw.mp3` | `0.85 Vol` / `1.20x` | Sharp, high-pressure liquid flick |
| **Chakram Whirring Flight** | `Assets/Sound Effects/Skills/blade_spin.mp3` | `0.90 Vol` / `1.05x` | Rapid rotary buzz of high-speed fluid disc |
| **Supernova Blast** | `Assets/Sound Effects/Attacks/heavy_explosion.mp3` | `1.15 Vol` / `1.15x` | Concussive multi-shrapnel shotgun detonation |
| **Convergence Prayer Clasp** | `Assets/Sound Effects/Skills/enhance.mp3` | `1.10 Vol` / `0.90x` | Sudden low-pass vacuum whoosh signaling tension |
| **Laser Diode Ignition** | `Assets/Sound Effects/Skills/spark_charge.mp3` | `0.95 Vol` / `1.30x` | High-frequency optical hum as droplets turn to laser diodes |
| **Crimson Laser Discharge** | `Assets/Sound Effects/Attacks/laser_fire.mp3` | `1.25 Vol` / `1.15x` | Crackling, piercing supersonic photonic burst |
| **Piercing Blood Muzzle Blast** | `Assets/Sound Effects/Attacks/cannon_fire.mp3` | `1.35 Vol` / `1.00x` | Colossal Mach 3 supersonic hydraulic cannon boom |

---

## 📁 Source Code & Component Map (Target Implementation)

When implementing Choso into the game engine, code must be cleanly compartmentalized across the following modular architecture:

| System / Component | Target File Path | Primary Responsibilities |
| :--- | :--- | :--- |
| **Fighter Entity & Combat Engine** | [`js/entities/fighters/ChosoFighter.js`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/js/entities/fighters/ChosoFighter.js) | Subclasses `Fighter`. Implements `update()`, freeze guards (Rule 1.1), 5-phase attacks (Rule 30), blood droplet entity manager, and laser transmutation state machine. |
| **Fighter Configuration** | [`js/configs/characters/chosoConfig.js`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/js/configs/characters/chosoConfig.js) | Contains HP, speed, radius (`25px`), damage coefficients, cooldowns, blood droplet life, laser parameters, and asset references. |
| **Skin & Hair Pixel Art Renderer** | [`js/graphics/fighters/chosoSkin.js`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/js/graphics/fighters/chosoSkin.js) | Rule 24 Toji baseline standard, offscreen canvas cache, faceless skin dome, blood bridge strip, Noritoshi robes, Rule 20 symmetrical hands, and Rule 22 hair model import. |
| **Blood VFX & Laser Renderer** | [`js/graphics/weapons/chosoBloodGraphics.js`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/js/graphics/weapons/chosoBloodGraphics.js) | Renders blood droplet nodes, coagulated daggers, Chakram disc, Supernova fragmentation, needle telegraphs, and photonic laser beam ribbons. |
| **Fighter Registry Integration** | [`js/entities/fighterFactory.js`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/js/entities/fighterFactory.js) | Registers `'choso'` character ID, constructor bindings, and asset preloads. |
| **Selection Card & UI Registry** | [`js/ui/fighterSelection.js`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/js/ui/fighterSelection.js) | Adds Choso's character selection card, preview sprite hook, thumbnail icon, and sound triggers. |

---

## 🛠️ Code & Systems Compliance Checklist

Before committing any implementation code for Choso, verify full compliance against all repository rules:

- [x] **Rule 1.1 (TimeStop & Freeze Guards)**: Update loop strictly evaluates `_handleTimeStop()` and halts movement/cooldowns during time-stop or ambush stasis.
- [x] **Rule 1.2 (Centralized Physics)**: Delegates movement and boundary resolution to `super.update()` / `resolveWallBounce()`.
- [x] **Rule 1.4 (Continuous 360° Aiming)**: *Piercing Blood* and *Laser Matrix* snapshot cast angle at initiation, locking facing direction during fire.
- [x] **Rule 1.5 (Attacker vs Target Freeze)**: Time-pause during *Piercing Blood* or *Laser Matrix* locks the target, NEVER Choso himself.
- [x] **Rule 1.6 (Frontal Arc AOE)**: Blood Edge melee slashes cover a 130° frontal arc, checking both `state.fighters` and `state.illusions`.
- [x] **Rule 1.7 (Gojo Infinity Barrier)**: Standard blood particles halt at Infinity; high-intensity lasers apply pressure without bypassing unless lore-permitted.
- [x] **Rule 1.8 & Rule 23 (Basic Projectile Suppression)**: Explicitly overrides `shoot(ownerIndex)` with dedicated blood skills to prevent generic bullet spawning.
- [x] **Rule 1.9 & Rule 25 (Non-Freezing Active VFX Decay)**: Active blood droplets and laser beam arrays decay at the top of `update()` before `_handleTimeStop()`.
- [x] **Rule 2.2 & Rule 11 (Prohibition of shadowBlur)**: Laser glow and blood auras rendered using concentric alpha steps with zero Canvas `shadowBlur`.
- [x] **Rule 2.4 (Canvas Transform Stack Integrity)**: Every `ctx.save()` is matched by an exact `ctx.restore()`.
- [x] **Rule 2.5 & Rule 16 (Manga Speed Lines)**: 4-point filled needle polygons trailing behind Choso during high-speed actions.
- [x] **Rule 2.6 & Rule 15 (Crescent Slash Eraser Wipe)**: Blood dagger crescent sweeps cleanly erase from tail to tip during recovery.
- [x] **Rule 2.8 & Rule 18 (HUD Theme Consistency)**: Unified `#A31D1D` crimson blood theme across all HUD bars.
- [x] **Rule 2.9 & Rule 21 (Overhead Health Drawing)**: Custom `draw()` pipeline explicitly calls `this.drawHealth(ctx)` and `this.drawFreezeTimer(ctx)` on top layer.
- [x] **Rule 2.11 & Rule 26 (Clean Concentric Shockwaves)**: Sequential water-ripple compression rings with zero spiderweb spoke meshes.
- [x] **Rule 2.12 & Rule 27 (Lifesteal / Regen Feedback)**: No floating combat text in arena; all HP recovery routed strictly to healthbar pulse.
- [x] **Rule 3.1 & Rule 19 (Upright Front POV)**: Head at `-Y`, robes at `+Y`, with Y-axis mirroring on leftward aim.
- [x] **Rule 3.2 (Faceless Minimalist Standard)**: Zero eyes, pupils, or mouth; character defined by blood bridge mark, hair tufts, and robes.
- [x] **Rule 3.5 & Rule 24 (Discrete Pixel Art & Toji Reference Standard)**: $P = 2.0\text{px}$ discrete grid, offscreen canvas cache, `r = 25px` universal standard humanoid scale.
- [x] **Rule 3.6 & Rule 20 (Canonical Hand Positioning)**: Symmetrical flank placement `(±r * 0.82, r * 0.38)` with `handRadius = r * 0.30` and Convergence clasp transition.
- [x] **Rule 22 (Hair & Head Asset Import)**: Dedicated `Assets/model/choso/choso-hair.png` asset eagerly cached via module loader.
- [x] **Rule 30 (5-Phase Melee Combat & Physical Force)**: 5 distinct phases for Blood Edge melee combo with impact lock, stationary clamp, micro-tremor, and layered slap audio.
