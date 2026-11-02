# Son Goku — The Legendary Super Saiyan (Kakarot)

**Category:** Anime & Dragon Ball  
**Theme Color:** Turtle School Orange (`#FF6B00` / `#FF7A00`) & Deep Indigo (`#1A237E`) with Super Saiyan Gold (`#FFD700` / `#FFE082`)  
**Role:** Adaptive Saiyan Brawler, Ki Burst Striker, Hyper-Mobility Martial Artist  

---

## 📖 Lore & Character Philosophy

Born on Planet Vegeta as Kakarot and sent to Earth as an infant, Son Goku was raised by Grandpa Gohan and trained under Master Roshi in the revered Turtle School (*Kame House*). Pure-hearted, cheerful, and driven by an insatiable hunger to break past any ceiling, Goku lives for the thrill of facing powerful opponents and testing his limits.

Throughout his journey, Goku has shattered mortal boundaries—pioneering the Kaioken, unlocking the legendary Super Saiyan prophecy on Namek, mastering Instant Transmission (*Shunkan Ido*), and reaching divine zeniths.

In the *Circle Mini-Battle* arena, Goku's combat identity is built directly upon the philosophy that **his Basic Attack IS a complete Dragon Ball Hybrid Martial Arts Engine**: close-quarters hand-to-hand flurries seamlessly culminating in a **spring-damped backstep and follow-up Ki Blast Barrage (*Renzoku Ki Dān*)**! Goku does not shoot generic vanilla bullets (`shoot(ownerIndex)` is completely suppressed per Rule 23). Instead, triggering basic attack executes an authentic Dragon Ball sequence: Z-Vanish gap-closers, gut punches, rising dragon knees, double-fist sledgehammers, a tactical backstep leap, and an immediate suppressive Ki barrage!

This core martial arts engine is further elevated by the mighty **Super Saiyan Transformation (Stats Multiplier Buff)**, **Kaioken Burst**, and the autonomous **Z-Vanish Afterimage Dodge Mechanic (Saitama & Sans Standard)**.

---

## 👊 Basic Attack: Hybrid Martial Arts & Follow-Up Ki Barrage Engine

Goku's primary offensive action is an authentic, multi-phase **Dragon Ball Melee $\rightarrow$ Ki Barrage Pipeline**:

```
  [BASIC ATTACK TRIGGERED]
             │
   (Distance ≤ 150px)
             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 1. Z-VANISH GAP-CLOSER                                 │
  │    Flash-step to 45px melee striking reach             │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. CQC MELEE MODE DURATION (120 FRAMES / 2.0S DURATION) │
  │    • Relentless Punch-Teleport-Punch flurry across     │
  │      8 surround angles around the target                │
  │    • Gut Strikes (18 dmg) & Rising Knees (22 dmg)       │
  │    • High Dragon Hooks (24 dmg) & Knife Chops (20 dmg) │
  │    • Terminal Finisher: Overhead Sledgehammer Slam      │
  │      (34 dmg, floor crater & wall ricochet)             │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. BACKSTEP VAULT & FOLLOW-UP KI BLAST BARRAGE         │
  │    • Springs backward ≥ 120px to establish spacing     │
  │    • Braces palms & fires 6 rapid golden Ki spheres    │
  │      (8 dmg each = 48 dmg) into ricocheting target     │
  └────────────────────────────────────────────────────────┘
```

### 1. Phase 1: Z-Vanish Gap-Closer (Instant Step-In)
* When basic attack is triggered while an enemy is within **`150px`** (`meleeGapCloseRange`), Goku instantly performs a high-speed Z-Vanish flash-step (`_teleportToMeleeAngle`), vanishing with a subtle pop/chirp and blinking directly into striking distance (`45px–60px`) to initiate the combo.
* Leaves a fading golden afterimage behind at his origin point.
* Initializes the authentic **`120-frame` Melee Mode Duration** (`initialMeleeDuration: 120`, ~2.0s duration).

### 2. Phase 2: Continuous 120-Frame CQC Melee Flurry (8 Distinct Surround Angles)
Once in melee reach, Goku locks the enemy into a continuous **`120-frame` Melee Mode Duration** (~2.0 seconds at 60 FPS, identical to Gojo and Sukuna's melee engines):
* **Punch-Teleport-Punch Pipeline**:
  * Before **EVERY SINGLE PUNCH**, Goku vanishes and blinks across 8 distinct surround angles (`-153°, -99°, -45°, 0°, +45°, +99°, +153°, 180°`), creating an iconic blinding multi-directional surround assault.
  * Every strike leaves stepped ghost afterimages along his trajectory with authentic punch SFX and hit sparks.
* **Continuous Multi-Strike Flurry (Throughout 120 Frames)**:
  * Over the 120-frame duration, Goku delivers **~8 to 11 vanishing strikes** (accelerating to **~11 to 12 strikes** in Super Saiyan):
    * **Gut Strikes**: Snapping straight right fist into the solar plexus (`18` base damage, `23` in Super Saiyan, 6-frame hit-pause).
    * **Rising Dragon Knees**: Upward knee strike lifting target off-balance (`22` base damage, `29` in Super Saiyan, 8-frame hit-pause).
    * **High Dragon Hooks**: Hook strike connecting against the jaw (`24` base damage, `31` in Super Saiyan, 8-frame hit-pause).
    * **Knife-Hand Chops**: Precise descending chop (`20` base damage, `26` in Super Saiyan, 7-frame hit-pause).
* **Terminal Finisher Slam (Triggered on Duration Expiration)**:
  * When `meleeModeDurationTimer <= 0`, Goku teleports directly above the enemy to unleash the **Two-Handed Overhead Sledgehammer Finisher Slam** (`34` base damage, `44` in Super Saiyan).
  * Detonates a 45px radial shockwave (`#FFD700`), shakes the arena (`3.8` screen rumble), and launches the enemy flying into a high-speed **wall ricochet**!
* **Attack Cadence**: `14 frames` between strikes in base form, accelerating to **`11 frames`** in Super Saiyan.

### 3. Phase 3: Backstep Vault & Follow-Up Ki Blast Barrage (*Renzoku Ki Dān — 連続気弾*)
* Immediately following the Sledgehammer Finisher Slam, Goku executes a spring-damped aerial backstep vault, creating **$\ge 120\text{px}$** of breathing room.
* While the enemy is rebounding off the arena wall, Goku plants his stance, thrusts both palms forward, and unloads a **rapid-fire volley of 6 golden Ki blasts**:
  * **Projectile Specs**: Speed `16 px/frame`, radius `7px`, golden core with bright amber corona (`#FFD700` / `#FFA000`).
  * **Damage**: Each blast deals **`8` damage** (`11` in Super Saiyan), totaling **`48` follow-up damage** (`66` in Super Saiyan).
  * **Detonation**: Each blast creates a crisp 25px circular plasma pop on target or wall impact, bombarding the target with smoke and explosive sparks!
* **Reset Cadence & Separation**: `180 frames` (~3.0s) separation cooldown (`meleeModeSeparationCooldown`) after the barrage completes before initiating the next melee mode engagement, allowing full ranged spacing and skill casting.

### 4. ⚡ High-Speed Brawler Clash System (Dragon Ball Fist Clash)
* If the target is **also basic attacking or in Melee Mode** within proximity (e.g. Vegeta, Gojo, Sukuna), both fighters trigger a **High-Speed Melee Clash** during Phase 2!
* Rather than trading static damage, fists blur in supersonic machine-gun exchanges with mutual hit-pauses, concentric clash shockwaves (`spawnMeleeClashShockwave`), golden Ki sparks, and rapid punch audio (`attack_fleshhit`).
* Throttled by `meleeClashCooldown: 25 frames` to maintain clean visual performance.

---

## 🔥 Super Saiyan Transformation (*Sūpā Saiya-jin — 超サイヤ人*)

Goku breaks through his mortal limiter to awaken the legendary golden Super Saiyan form.

### 1. Multiplier Stats Buff
Super Saiyan acts as an authentic **Combat Multiplier**:
* **Attack Damage Multiplier**: **`1.30×` (+30% Damage)** applied across all basic melee strikes, follow-up Ki blasts, skills, and Kamehameha ticks.
* **Movement Speed Multiplier**: **`1.35×` (+35% Base Speed)**, rocketing Goku's agility from `5.6` to **`7.56 px/frame`** for lightning-fast repositioning.
* **Attack Speed Boost**: Basic Attack CQC cadence accelerates from `14 frames` $\rightarrow$ **`11 frames`** per strike (+20% strike rate).
* **Damage Reduction**: **`15% Flat Damage Reduction`** mitigating all incoming melee and projectile damage.
* **Dodge Reflex Amplification**: Boosts Z-Vanish Dodge Chance from **`85%` $\rightarrow$ `95%`**.
* **Kamehameha Overdrive**: Super Kamehameha beam width expands from `85px` to **`110px`**, with doubled tick rate and increased screen rumble.

### 2. Transformation Activation & Lifecycle
* **Trigger Condition**: Automatically activates when Goku's health drops below **`35% HP`** (*Zenkai Awakening*), OR upon channeling full Ki.
* **Awakening Eruption**:
  * Goku pauses for 24 frames, lets out an iconic roaring battle cry, and detonates an arena-wide **golden Ki shockwave** (80px radius, 20 damage, heavy radial knockback).
  * Cleanses all active crowd control, stuns, and slows (`interruptAttacks(false)`).
* **Active Duration**: Lasts for **`15.0 seconds`** (`900 frames`) or until match conclusion.
* **Healthbar-Only Feedback (Rule 27)**: No floating text clutter; displays an electric golden healthbar pulse (`_healthBarHealTimer = 16`) and glowing HUD card border.

### 3. Visual & Audio Transformation Standards
* **Super Saiyan Hair Model (Rule 22 & 24)**:
  * Hair asset (`Assets/model/goku/Goku-hair.png`) dynamically shifts from natural Saiyan black (`#0E0F14`) to brilliant glowing golden-blonde (`#FFD700` / `#FFE082`).
  * Hair spikes gain glowing outer rim strokes and subtle vertical flame highlights.
* **Surging Flame Ki Aura**:
  * Multi-layer upward-surging golden Ki flames (`#FFD700` outer flame, `#FFF9C4` white core) pulsing continuously around the body circle.
  * Super Saiyan 2 electric blue sparks and ionization filaments flashing intermittently (Rule 25 compliant non-freezing particle decay).
* **Audio Layering**: Deep resonance Super Saiyan aura hum + electric crackle loops.

---

## 💨 Z-Vanish Afterimage Dodge Mechanic (*Saitama & Sans Standard*)

Modeled directly on the proven high-performance dodge engines of **Saitama** (`Caped Baldy Reflexes`) and **Sans** (`Teleport Dodge`), Goku possesses autonomous martial reflexes that allow him to vanish and sidestep incoming attacks:

### 1. Evasion System Specifications
* **Master Toggle**: `enableDodge: true`
* **Baseline Dodge Chance**: **`0.85` (85% Probability)** to autonomously dodge incoming enemy melee strikes, bullets, and basic projectiles.
* **Super Saiyan Dodge Chance**: **`0.95` (95% Probability)** while in Super Saiyan state.
* **Domain Hazard Dodge Chance**: **`0.80` (80% Probability)** against spatial slice hazards in Domain Expansions (e.g. Sukuna's Malevolent Shrine).
* **Super-Beam Dodge Chance**: **`0.90` (90% Probability)** against lethal super-beams (Hollow Purple, Pure Love Beam, Nameless Destroyer).
* **Dodge Distance**: **`120px`** instant sidestep flash-step.
* **Dodge Cooldown**: **`4 frames`** (~0.06s) minimum delay between consecutive dodges.
* **Shotgun Grace Window**: **`16 frames`** grace period where subsequent projectiles in a shotgun volley/spread are automatically dodged.

### 2. Dual-Mode Dodge Architecture: Neutral Sidestep vs CQC Vanish Counter
* **Neutral / Ranged Dodge (Distance > 85px)**:
  * When attacked at range, executes a standard **`120px`** perpendicular sidestep flash-step.
* **CQC Vanish Slip & Counter-Attack (Melee Mode / Distance ≤ 85px)**:
  * If attacked while engaging in Melee Mode (`basicComboPhase === 2` or `1`) or within close range:
    1. **Zero Damage Negation**: 100% damage negated with `'MISS'` floating feedback.
    2. **Point-Blank Flank/Rear Re-Anchor**: Leaves 2 golden afterimages and vanishes directly to the enemy's blind flank or rear at striking distance (`~58px`).
    3. **Attacker Whiff Delay**: Imposes a 6-frame recovery penalty on the attacker (`teleportChaseDelayTimer = 6`), making their strike swing into thin air.
    4. **Instant Counter-Strike**: Immediately resets `meleePunchCooldown = 0`, instantaneously retaliating with the next blow of his Turtle School flurry without breaking combo momentum.

### 3. Afterimage Presentation & Feedback
* **Afterimage Silhouettes (`Zanzōken`)**:
  * Spawns **`2` ghost afterimage silhouettes** per dodge (`dodgeAfterimageCount: 2`).
  * Afterimages fade smoothly over **`18 frames`** with base opacity `0.40`.
* **Floating Dodge Text**:
  * Displays a clean, bold **`MISS`** floating text in bright golden-amber (`#FFE082`) above Goku's head, floating upward and fading out over 20 frames.
* **Attacker Chase Delay (`attackerTeleportChaseDelayFrames: 6`)**:
  * When dodging teleporting chasers (e.g. Gojo or Sukuna flank-steps), applies a 6-frame momentary disorientation delay to the attacker, preventing immediate sticky re-teleports.
* **Audio Cue**: Signature high-frequency vanish pop/chirp (`skill_dash3`).

---

## 🎨 Visual Design & Rendering Standards

### 1. Upright Fighter Body Model (Rule 19 Front POV Standard)
Goku’s procedural body model and proportions strictly follow the **Canonical Toji Baseline Standard (Rule 24)** at `r: 25, radius: 25`:
- **Zone 1: Pure Face Dome (`ry < r * 0.28`)**:
  - Clean fair/tan anime skin tone (`#FFE0BD` base, `#F2C49B` side contour).
  - **Faceless Minimalist Standard (Rule 19)**: Strictly zero baked eyes, pupils, nose, or mouth. Pure circular anime dome.
- **Zone 2: Turtle School Dogi Torso (`r * 0.28 <= ry < r * 0.64`)**:
  - Iconic vibrant orange outer dogi (`#FF6B00` / `#E65100`) over deep navy-blue undershirt and collar cut (`#1A237E` / `#0D47A1`).
  - Circular white martial arts kanji crest backing (`#FFFFFF`) with dark charcoal calligraphy on the left chest.
- **Zone 3: Martial Sash & Belt (`r * 0.64 <= ry < r * 0.78`)**:
  - Deep indigo-navy martial cloth sash (`#1A237E`) wrapped around the waist with hanging knot ribbons on the side.
- **Zone 4: Dogi Trousers & Boot Wraps (`ry >= r * 0.78`)**:
  - Baggy orange martial trousers (`#FF6B00`) meeting dark blue boot wraps with red lace trim.
  - Maintained interior fabric luminance separation ($Y \ge 24$) against outer black borders.

### 2. Hair Asset & Crown Calibration (Rules 22 & 24)
- **Asset Path**: `Assets/model/goku/Goku-hair.png`
- **Silhouette**: Iconic, gravity-defying Saiyan hair with distinct sweeping crescents and jagged bangs framing the brow.
- **Layering**: Rendered on Layer 2 (`_drawGokuHair(ctx, r, facingLeft)`) above the procedural body dome.
- **Crown Apex Anchor**: `drawY = -r * 1.30` to `-r * 1.40`, scaled to `targetHairWidth = r * 2.90` and `targetHairHeight = r * 2.25`.
- **Eager Image Caching**: Module-level image cache `_getGokuHairImage()` initialized on load with `ctx.imageSmoothingEnabled = false;`.

### 3. Symmetrical Hands & Weapon Stance (Rule 20)
- **Symmetrical Lower-Flank Placement**:
  - Left Hand: `(x: -r * 0.82, y: +r * 0.38)`
  - Right Hand: `(x: +r * 0.82, y: +r * 0.38)`
- **Hand Radius**: `handRadius = r * 0.30` rendered via `drawPixelHand` with skin tone (`#FFE0BD`) and dark wristbands (`#1A237E`).
- **Single Source of Truth**: Fists always anchor at canonical wrists. During martial punches, Ki blasts, and beam casting, hands extend dynamically via kinematic offset vectors rather than detaching into floating or duplicate hands.

### 4. Ink Outline & Visual Effects Hygiene (Rules 11, 26, 31, 32)
- **Manga Ink Outline**: Crisp 2.0px stroke (`#0E0F14`) around circular body and fists.
- **Zero shadowBlur**: Electric Ki sparks and fiery Saiyan auras are drawn using concentric polygonal alpha gradients, strictly avoiding CPU `ctx.shadowBlur`.
- **Clean Concentric Shockwaves (Rule 26)**: Kamehameha detonations and Ki blast impacts expand as sequential water-ripple wavefront discs with soft translucent interior washes, completely prohibiting radial cobweb/spoke meshes.
- **Uncropped Visual Effects (Rule 31)**: All Ki blast sprites, beam heads, and charging auras maintain generous 20–30px transparent padding to eliminate rectangular box clipping.

---

## 🛡️ Baseline Stats

| Attribute | Base Value | Super Saiyan Multiplier | Super Saiyan Value |
| :--- | :--- | :--- | :--- |
| **HP** | `380` | — | `380` (Preserved) |
| **Base Speed** | `5.6` | `1.35×` | **`7.56`** |
| **Attack Damage** | `1.00×` | `1.30×` | **`+30% Bonus Damage`** |
| **Basic Attack Cadence** | `14 frames` | `1.27×` (Faster) | **`11 frames` (~0.18s)** |
| **Damage Reduction**| `0%` | `+15%` | **`15% Flat Mitigation`** |
| **Dodge Chance** | `85%` | `+10%` | **`95% Auto-Evasion`** |
| **Body Radius** | `25px` | — | `25px` (Rule 24 standard) |
| **Melee Reach** | `68px` | `1.10×` | **`75px`** |
| **Melee Gap-Close Range**| `150px` | — | `150px` (Z-Vanish reach) |
| **Follow-Up Ki Count** | `6 blasts` | — | `6 blasts` (Speed `16 px/f`) |
| **Crit Chance** | `15%` | `+10%` | **`25%`** |
| **Crit Damage** | `1.75×` | `+0.25×` | **`2.00×`** |

---

## ⚔️ Active Skills & Special Moves

### 💥 Skill 1: Dragon Hammer & Z-Burst Combo (*Ryūken Senkō — 龍拳閃光*)
* **Type**: High-Speed Instant Transmission Gap-Closer & 4-Hit Aerial Execution
* **Cooldown**: `7.0s` (`420 frames`)
* **HUD Toggle**: Gated by `isSkillEnabled(cfg.enableDragonHammer, true)`
* **Mechanics**:
  * Goku vanishes and instantly blinks directly in front of the target.
  * Hits target with rapid 4-hit flurry over 36 frames (`12 + 12 + 14 + 28` base damage; multiplied by `1.30×` in Super Saiyan).
  * **No Attacker Freeze (Rule 1.5)**: Hit-pause is applied strictly to the target, never freezing Goku's update loop.
  * **Finisher**: Final hit is an explosive spinning high roundhouse kick that launches the enemy into a high-speed **wall ricochet**, afflicting them with a 1.2s 30% movement slow upon impact.

---

### 🔴 Skill 2: Kaioken Burst & Heavy Dragon Strike (*Kaiōken — 界王拳*)
* **Type**: High-Torque Guard-Piercing Dash & Crimson Aura Dragon Strike
* **Cooldown**: `6.5s` (`390 frames`)
* **HUD Toggle**: Gated by `isSkillEnabled(cfg.enableKaiokenStrike, true)`
* **Mechanics**:
  * Goku shouts *"KAIOKEN!"*, igniting an intense crimson-red flame aura (`#FF1744` / `#D50000`) over his body for 40 frames.
  * Blitzes forward **`200px`** in 14 frames, leaving trailing red-and-gold manga speed lines.
  * **Guard Pierce**: Deals **`45` heavy physical damage** (`58` in Super Saiyan) and instantly shatters enemy barriers/armor shields (bypassing block and damage reduction).
  * Afflicts the target with a 1.0s heavy hit-stun and launches them backward into arena walls.

---

### 🌊 Ultimate: Super Kamehameha (*Chō Kamehameha — 超かめはめ波*)
* **Type**: Committed 360° Omnidirectional Cataclysmic Ki Energy Cannon
* **Cooldown**: `30.0s` (`1800 frames`)
* **HUD Toggle**: Gated by `isSkillEnabled(cfg.enableKamehameha, true)`, registered with `isSignature: true`
* **Execution Phases**:
  * **Phase 1 — Chanted Stance & Ionization Charge (60 frames / 1.0s)**:
    * Goku plants both feet and draws his cupped hands to his hip: *"KA... ME... HA... ME..."*.
    * Locks aim angle (`this.skillCastAngle = angle`) with committed aim clamping.
    * In Super Saiyan, massive golden Ki flares and electric arcs surge from his feet into the ceiling.
  * **Phase 2 — The Release ("HA!") (48 frames / 0.8s)**:
    * Goku thrusts both palms forward: *"HA!"*.
    * Unleashes a colossal laser cannon beam: `85px` wide in base form, amplified to **`110px` wide** in Super Saiyan!
    * **Damage**: Base `170` damage (8 hits of 15 + 50 blast); amplified to **`221` total damage** in Super Saiyan.
    * **Recoil**: Tremendous physical backward recoil (`this.vx -= Math.cos(angle) * 3.8`).
    * **Screen Rumble**: High-intensity global screen shake (`triggerGlobalScreenShake(4.5, 18)`).
  * **Phase 3 — Impact Detonation**:
    * Bursts into a titanic 120px concentric blue shockwave wash with dispersing supersonic rings (Rule 26).

---

## 🥊 Special Interactions Table

| Opponent / Technique | Interaction Behavior |
| :--- | :--- |
| **Saitama (Dodge Clash)** | Both fighters possess elite dodge engines (`enableDodge: true`). Clashing at close quarters triggers rapid alternating afterimage sidesteps (`'MISS'` popping over both fighters) before a clean hit connects! |
| **Sans (Evasion Duel)** | Goku's Z-Vanish dodge directly rivals Sans's teleport evasion. Goku's follow-up Ki blast barrage forces Sans to rapidly burn through dodge stamina, while Goku evades Sans's bone throws and Gaster Blasters! |
| **Gojo (Melee Mode Clash)** | When both Gojo and Goku engage in basic attack melee flurries at close range, Limitless Infinity is dropped (per Gojo's Rule) and both martial artists enter an intense, supersonic hand-to-hand brawler clash with alternating blue/golden shockwaves! |
| **Sukuna (Melee Mode Clash)** | Clashing basic attacks with Sukuna triggers a vicious CQC brawl: Goku's Dragon Fist punches clash against Sukuna's cursed martial strikes with blood sparks and concussive shockwaves. |
| **Vegeta (Saiyan Prince Rivalry)** | **Mutual Melee Clash**: When both Goku and Vegeta basic attack simultaneously at close range, they engage in the legendary Dragon Ball rapid fist flurry clash. Clashing Kamehameha against Final Flash creates an arena-splitting Ki Beam Struggle! |
| **Mahoraga (Wheel Adaptation)** | Repeated hits from the follow-up Ki Blast Barrage will cause Mahoraga's wheel to spin. Goku must rely on the physical gut punches and sledgehammer hits of his basic attack to bypass Ki energy adaptation. |
| **Toji (Heavenly Restriction)** | If Toji attempts an ambush, Goku's Z-Vanish Dodge (85% chance) allows him to dodge Toji's initial Inverted Spear stab and retaliate with an instant counter flurry! |

---

## ⚙️ Configuration & Parameter Specifications (`gokuConfig.js`)

```javascript
// Goku Basic Attack: Hybrid Martial Arts & Follow-Up Ki Barrage Engine
enableBasicMelee: true,             // Master toggle for Melee Mode Basic Attack
meleeReach: 68,                     // Frontal arc strike reach in pixels (75 in Super Saiyan)
meleeGapCloseRange: 150,            // Distance within which basic attack executes Z-Vanish step-in
meleePunchDamage: 18,               // Hit 1 damage (23 in Super Saiyan)
meleeKneeDamage: 22,                // Hit 2 damage (29 in Super Saiyan)
meleeFinisherDamage: 32,            // Hit 3 finisher damage (42 in Super Saiyan)
meleePunchCooldown: 14,             // Cadence between strikes in frames (11 in Super Saiyan)
meleePunchAnimDuration: 10,         // Extension & retraction frame duration
meleeTeleportAngle: 1.75,           // Flank pivot angle between combo hits
meleeClashCooldown: 25,             // Minimum frames between clash shockwaves
meleeBackstepDistance: 120,         // Distance vaulted backward after Hit 3 (pixels)
enableFollowUpKiBarrage: true,      // Master toggle for follow-up Ki Blast Barrage
followUpKiCount: 6,                 // Number of Ki blasts fired in follow-up barrage
followUpKiDamage: 8,                // Damage per Ki blast in follow-up barrage (11 in Super Saiyan)
followUpKiSpeed: 16,                // Projectile speed of follow-up Ki blasts (px/frame)
followUpKiRadius: 7,                // Radius of follow-up Ki blast spheres (pixels)
basicAttackResetCooldown: 40,       // Reset delay in frames before initiating next basic combo

// Goku Skill 2: Kaioken Burst & Heavy Dragon Strike
enableKaiokenStrike: true,          // Master toggle for Kaioken Strike
kaiokenCooldown: 390,               // Cooldown in frames (6.5s at 60fps)
kaiokenDamage: 45,                  // Burst physical damage (58 in Super Saiyan)
kaiokenDashDistance: 200,           // Dash distance in pixels
kaiokenDashFrames: 14,              // Dash speed in frames

// Goku Super Saiyan Transformation (Stats Multiplier Buff)
enableSuperSaiyan: true,            // Master toggle for Super Saiyan Transformation
superSaiyanHpThreshold: 0.35,       // Health threshold to trigger transformation (35% HP)
superSaiyanDuration: 900,           // Duration of transformation in frames (15.0s at 60fps)
superSaiyanDmgMultiplier: 1.30,     // Damage multiplier (+30% attack power)
superSaiyanSpeedMultiplier: 1.35,   // Movement speed multiplier (+35% speed)
superSaiyanDamageReduction: 0.15,   // Flat incoming damage reduction (15%)
superSaiyanDodgeChance: 0.95,       // Evasion probability while in Super Saiyan (95%)

// Goku Z-Vanish Afterimage Dodge System (Saitama & Sans Standard)
enableDodge: true,                  // Master toggle for autonomous Z-Vanish evasion
dodgeChance: 0.85,                  // Base evasion probability against incoming attacks (85%)
domainDodgeChance: 0.80,            // Evasion probability against Domain spatial slices (80%)
beamDodgeChance: 0.90,              // Evasion probability against lethal super-beams (90%)
dodgeDistance: 120,                 // Flash-step jump distance in pixels
dodgeCooldown: 4,                   // Minimum frames between consecutive dodge teleports
shotgunDodgeGraceWindow: 16,        // Grace window where projectile volley pellets are auto-evaded
dodgeAfterimageCount: 2,            // Number of fading ghost afterimages spawned per dodge
dodgeAfterimageDuration: 18,        // Lifespan of afterimages in frames
dodgeAfterimageAlpha: 0.40,         // Opacity of afterimage ghosts
dodgeText: 'MISS',                  // Floating combat text displayed on dodge
dodgeTextColor: '#FFE082',          // Gold-amber text color
attackerTeleportChaseDelayFrames: 5,// Momentary disorientation delay for teleporting chasers
```

---

## 🎮 HUD & UI Integration (Rule 18)

* **Unified Character Theme Color**: All HUD skill progress bars strictly use Turtle School Gold-Orange (`#FF7A00`).
* **Config Toggle Gating**:
  * Basic Melee: `isSkillEnabled(cfg.enableBasicMelee, true)`
  * Super Saiyan: `isSkillEnabled(cfg.enableSuperSaiyan, true)`
  * Dodge Reflex: `isSkillEnabled(cfg.enableDodge, true)`
  * Skill 1: `isSkillEnabled(cfg.enableDragonHammer, true)`
  * Skill 2: `isSkillEnabled(cfg.enableKaiokenStrike, true)`
  * Ultimate: `isSkillEnabled(cfg.enableKamehameha, true)`
* **Clean Label Standard**:
  * Skill 1: `DRAGON HAMMER`
  * Skill 2: `KAIOKEN STRIKE`
  * Ultimate: `SUPER KAMEHAMEHA`
  * Transformation Card: Glows in pulsing golden CSS class `hud-super-saiyan-active` during transformation.
* **Zero DOM Queries**: Declarative data structures only returned in `hudSkillProviders.js`.

---

## 🧠 AI Combat Behavior Notes

* **Hybrid Combo Chain**: When in range, AI initiates basic attack: steps in with Z-Vanish, pummels the target with the 3-hit flurry, vaults back, and immediately bombards the wall-bounced enemy with the follow-up Ki Blast Barrage.
* **Kaioken Guard Shatter**: Deploys Skill 2 (Kaioken Strike) when the enemy deploys defensive shields or approaches with armor to instantly shatter their defenses.
* **Super Saiyan Overdrive**: Upon activating Super Saiyan at low HP, AI aggression increases to 100%, exploiting the accelerated 11f melee cadence and +30% damage multiplier to relentlessly pursue and crush the opponent.
* **Ultimate Timing**: Executes Super Kamehameha immediately when the opponent is wall-bounced from the Hit 3 sledgehammer finisher.
