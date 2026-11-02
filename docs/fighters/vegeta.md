# Vegeta — The Saiyan Prince

**Category:** Anime & Dragon Ball  
**Theme Color:** Royal Saiyan Navy (`#1565C0` / `#0D47A1`), Royal Armor Gold (`#FFC107` / `#D4AF37`), and Galick Violet (`#7C4DFF` / `#8A2BE2`)  
**Role:** Aggressive Saiyan Rushdown, Prideful Heavy Blaster, High-Velocity Executioner  

---

## 📖 Lore & Character Philosophy

Vegeta is the proud Prince of the fallen Saiyan race and the ultimate warrior aristocrat. Born to conquer, his entire existence is defined by unrelenting pride, unyielding dedication to combat mastery, and a ferocious drive to surpass all who stand above him—most notably his eternal rival, Kakarot.

Unlike Goku's relaxed and experimental approach to martial arts, Vegeta fights with lethal efficiency, crushing intensity, and tactical ruthlessness. In the *Circle Mini-Battle* arena, Vegeta's combat identity is built directly upon the philosophy that **his Basic Attack IS a complete Dragon Ball Hybrid Martial Arts Engine**: close-quarters hand-to-hand flurries seamlessly culminating in a **spring-damped backstep and follow-up Rapid Ki Volley (*Renzoku Ki Dān*)**! Vegeta does not shoot generic vanilla bullets (`shoot(ownerIndex)` is completely suppressed per Rule 23). Instead, triggering basic attack executes an authentic Dragon Ball sequence: Z-Vanish gap-closers, heavy gut punches, spinning back elbows, overhead axe kicks, a tactical backstep leap, and an immediate suppressive Ki bombardment!

This core martial arts engine is further elevated by his signature **Galick Gun (*Gyārikku Hō*)**, the mighty **Super Saiyan Transformation (Stats Multiplier Buff)**, the regenerating **Royal Battle Armor Carapace**, and the autonomous **Z-Vanish Afterimage Dodge Mechanic (Saitama & Sans Standard)**.

---

## 👊 Basic Attack: Hybrid Martial Arts & Follow-Up Ki Volley Engine

Vegeta's primary offensive action is an authentic, multi-phase **Dragon Ball Melee $\rightarrow$ Ki Volley Pipeline**:

```
  [BASIC ATTACK TRIGGERED]
             │
   (Distance ≤ 150px)
             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 1. Z-VANISH GAP-CLOSER                                 │
  │    Flash-step to 40px melee striking reach             │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. CQC MELEE MODE DURATION (120 FRAMES / 2.0S DURATION) │
  │    • Relentless Punch-Teleport-Punch flurry across     │
  │      8 surround angles around the target                │
  │    • Heavy Gut Strikes (20 dmg) & Elbow Fractures (24)  │
  │    • Royal Roundhouses (26 dmg) & Ridge Hands (22 dmg) │
  │    • Terminal Finisher: High Overhead Axe Kick Slam     │
  │      (36 dmg, floor crater & wall ricochet)             │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. BACKSTEP VAULT & FOLLOW-UP RAPID KI VOLLEY          │
  │    • Springs backward ≥ 120px to establish spacing     │
  │    • Braces palms & unloads 8 rapid violet-gold blasts │
  │      (7 dmg each = 56 dmg) into ricocheting target     │
  └────────────────────────────────────────────────────────┘
```

### 1. Phase 1: Z-Vanish Gap-Closer (Aggressive Rushdown Step-In)
* When basic attack is triggered while an enemy is within **`150px`** (`meleeGapCloseRange`), Vegeta instantly performs a high-speed Z-Vanish flash-step (`_teleportToMeleeAngle`), vanishing with a subtle pop/chirp and blinking directly into striking distance (`40px–55px`) to initiate the combo.
* Leaves a fading royal violet-gold afterimage behind at his origin point.
* Initializes the authentic **`120-frame` Melee Mode Duration** (`initialMeleeDuration: 120`, ~2.0s duration).

### 2. Phase 2: Continuous 120-Frame Royal Saiyan Beatdown (8 Distinct Surround Angles)
Once in melee reach, Vegeta locks the enemy into a continuous **`120-frame` Melee Mode Duration** (~2.0 seconds at 60 FPS, identical to Gojo and Sukuna's melee engines):
* **Punch-Teleport-Punch Pipeline**:
  * Before **EVERY SINGLE PUNCH**, Vegeta vanishes and blinks across 8 distinct surround angles (`-153°, -99°, -45°, 0°, +45°, +99°, +153°, 180°`), creating an aggressive, unescapable flurry.
  * Every strike leaves stepped ghost afterimages along his trajectory with authentic punch SFX and hit sparks.
* **Continuous Multi-Strike Flurry (Throughout 120 Frames)**:
  * Over the 120-frame duration, Vegeta delivers **~8 to 11 vanishing strikes** (accelerating to **~10 to 12 strikes** in Super Saiyan):
    * **Heavy Gut Strikes**: Forward driving straight fist into the opponent's abdomen (`20` base damage, `27` in Super Saiyan, 6-frame hit-pause).
    * **Blindside Elbow Fractures**: High-torque spinning back elbow into their temple (`24` base damage, `32` in Super Saiyan, 8-frame heavy stagger).
    * **Royal Roundhouse Kicks**: High-velocity sweep kick to the torso (`26` base damage, `35` in Super Saiyan, 8-frame hit-pause).
    * **Saiyan Ridge-Hand Strikes**: Bone-crushing hand blade strike (`22` base damage, `29` in Super Saiyan, 7-frame hit-pause).
* **Terminal Finisher Slam (Triggered on Duration Expiration)**:
  * When `meleeModeDurationTimer <= 0`, Vegeta teleports directly overhead to deliver the **Brutal Overhead Heel Axe Kick Finisher** (`36` base damage, `48` in Super Saiyan).
  * Detonates a 45px radial cyan-violet shockwave (`#00E5FF`), shakes the arena (`4.0` screen rumble), and launches the enemy flying into a high-speed **wall ricochet**!
* **Attack Cadence**: `15 frames` between strikes in base form, accelerating to **`12 frames`** in Super Saiyan.

### 3. Phase 3: Backstep Vault & Follow-Up Rapid Ki Volley (*Renzoku Ki Dān — 連続気弾*)
* Immediately following the Axe Kick Finisher Slam, Vegeta executes a spring-damped aerial backstep vault, creating **$\ge 120\text{px}$** of breathing room.
* While the enemy is rebounding off the arena wall, Vegeta plants his stance with a ferocious sneer, thrusts both palms forward repeatedly, and unloads his iconic **manic volley of 8 high-velocity golden-violet Ki blasts**:
  * **Projectile Specs**: Speed `17 px/frame`, radius `7px`, golden-violet core with radiant rim (`#FFD700` / `#7C4DFF`).
  * **Damage**: Each blast deals **`7` damage** (`10` in Super Saiyan), totaling **`56` follow-up damage** (`80` in Super Saiyan).
  * **Detonation**: Each blast creates a crisp 25px circular plasma pop on target or wall impact, blanketing the pinned enemy with smoke and explosive sparks!
* **Reset Cadence & Separation**: `180 frames` (~3.0s) separation cooldown (`meleeModeSeparationCooldown`) after the volley completes before initiating the next melee mode engagement, allowing full ranged spacing and skill casting.

### 4. ⚡ High-Speed Brawler Clash System (Dragon Ball Fist Clash)
* If the target is **also basic attacking or in Melee Mode** within proximity (e.g. Goku, Gojo, Sukuna), both fighters trigger a **High-Speed Melee Clash** during Phase 2!
* Rather than trading static damage, fists blur in supersonic machine-gun exchanges with mutual hit-pauses, concentric clash shockwaves (`spawnMeleeClashShockwave`), royal violet and gold Ki sparks, and heavy impact audio (`attack_fleshhit`).
* Throttled by `meleeClashCooldown: 25 frames` to maintain clean visual performance.

---

## 🔥 Super Saiyan Transformation (*Sūpā Saiya-jin / Super Vegeta — 超サイヤ人*)

Vegeta draws upon his royal Saiyan pride, erupting into a towering golden transformation that shatters enemy defenses.

### 1. Multiplier Stats Buff
Super Saiyan acts as an authentic **Combat Multiplier**:
* **Attack Damage Multiplier**: **`1.35×` (+35% Damage)** applied across all basic melee strikes, follow-up Ki volleys, Galick Gun, Big Bang Attack, and Final Flash (stacks multiplicatively with Royal Saiyan Pride for up to **+70% total damage** at low HP).
* **Movement Speed Multiplier**: **`1.30×` (+30% Base Speed)**, rocketing Vegeta's agility from `5.4` to **`7.02 px/frame`** for aggressive forward rushdown.
* **Attack Speed Boost**: Basic Attack CQC cadence accelerates from `15 frames` $\rightarrow$ **`12 frames`** per strike (+20% strike rate).
* **Armor Hardening & Shield Re-Arm**: **`20% Flat Damage Reduction`**, plus immediately restores his **50 HP Royal Battle Armor shield** to full capacity upon transforming!
* **Dodge Reflex Amplification**: Boosts Z-Vanish Dodge Chance from **`85%` $\rightarrow$ `95%`**.
* **Big Bang Overdrive**: Big Bang plasma blast radius expands from `90px` to **`120px`** with catastrophic wall bounce.
* **Final Flash Overdrive**: Final Flash beam width expands from `90px` to **`115px`**, with continuous screen rumble and obstacle vaporization.

### 2. Transformation Activation & Lifecycle
* **Trigger Condition**: Automatically activates when Vegeta's health drops below **`40% HP`** (*Royal Saiyan Pride Awakening*), OR upon channeling full Ki.
* **Awakening Eruption**:
  * Vegeta arches backward in supreme pride, roaring his iconic battle cry as an arena-wide **royal golden-violet Ki shockwave** detonates (85px radius, 25 damage, heavy wall ricochet).
  * Cleanses all active crowd control, stuns, and slows (`interruptAttacks(false)`).
* **Active Duration**: Lasts for **`15.0 seconds`** (`900 frames`) or until match conclusion.
* **Healthbar-Only Feedback (Rule 27)**: No floating text clutter; displays an electric golden-violet healthbar pulse (`_healthBarHealTimer = 16`) and glowing HUD card border.

### 3. Visual & Audio Transformation Standards
* **Super Saiyan Hair Model (Rule 22 & 24)**:
  * Upward flame hair asset (`Assets/model/vegeta/Vegeta-hair.png`) dynamically shifts from natural Saiyan black (`#0E0F14`) to brilliant glowing electric gold (`#FFE082` / `#FFD700`).
  * Distinct widow's peak crest gains sharp golden highlights and upward flame tips.
* **Surging Royal Flame Ki Aura**:
  * Dual-layer upward-surging flame aura (`#FFD700` outer flame, `#7C4DFF` inner royal violet resonance) pulsing around the body circle.
  * Crackling electric yellow and violet lightning arcs dancing along the arena floor (Rule 25 compliant non-freezing particle decay).
* **Audio Layering**: High-voltage electric aura hum + deep concussive Saiyan pride roar.

---

## 💨 Z-Vanish Afterimage Dodge Mechanic (*Saitama & Sans Standard*)

Modeled directly on the proven high-performance dodge engines of **Saitama** (`Caped Baldy Reflexes`) and **Sans** (`Teleport Dodge`), Vegeta possesses autonomous combat reflexes that allow him to vanish and sidestep incoming attacks:

### 1. Evasion System Specifications
* **Master Toggle**: `enableDodge: true`
* **Baseline Dodge Chance**: **`0.85` (85% Probability)** to autonomously dodge incoming enemy melee strikes, bullets, and basic projectiles.
* **Super Saiyan Dodge Chance**: **`0.95` (95% Probability)** while in Super Saiyan state.
* **Domain Hazard Dodge Chance**: **`0.80` (80% Probability)** against spatial slice hazards in Domain Expansions (e.g. Sukuna's Malevolent Shrine).
* **Super-Beam Dodge Chance**: **`0.90` (90% Probability)** against lethal super-beams (Hollow Purple, Pure Love Beam, Nameless Destroyer).
* **Dodge Distance**: **`115px`** rapid sidestep flash-step.
* **Dodge Cooldown**: **`4 frames`** (~0.06s) minimum delay between consecutive dodges.
* **Shotgun Grace Window**: **`16 frames`** grace period where subsequent projectiles in a shotgun volley/spread are automatically dodged.

### 2. Dual-Mode Dodge Architecture: Neutral Sidestep vs CQC Vanish Counter
* **Neutral / Ranged Dodge (Distance > 85px)**:
  * When attacked at range, executes a rapid **`115px`** perpendicular sidestep flash-step.
* **CQC Vanish Slip & Counter-Attack (Melee Mode / Distance ≤ 85px)**:
  * If attacked while brawling in Melee Mode (`basicComboPhase === 2` or `1`) or within close range:
    1. **Zero Damage Negation**: 100% damage negated with `'MISS'` floating feedback.
    2. **Point-Blank Flank/Rear Re-Anchor**: Leaves 2 cyan/golden afterimages and vanishes directly to the enemy's flank or rear at striking distance (`~56px`).
    3. **Attacker Whiff Delay**: Imposes a 6-frame recovery penalty on the attacker (`teleportChaseDelayTimer = 6`), making their strike swing into thin air.
    4. **Instant Counter-Strike**: Immediately resets `meleePunchCooldown = 0`, instantly retaliating with the next blow of his Royal Saiyan combo without breaking beatdown momentum.

### 3. Afterimage Presentation & Feedback
* **Afterimage Silhouettes (`Zanzōken`)**:
  * Spawns **`2` ghost afterimage silhouettes** per dodge (`dodgeAfterimageCount: 2`).
  * Afterimages fade smoothly over **`18 frames`** with base opacity `0.40`.
* **Floating Dodge Text**:
  * Displays a clean, bold **`MISS`** floating text in electric cyan (`#00E5FF`) above Vegeta's head, floating upward and fading out over 20 frames.
* **Attacker Chase Delay (`attackerTeleportChaseDelayFrames: 6`)**:
  * When dodging teleporting chasers (e.g. Gojo or Sukuna flank-steps), applies a 6-frame momentary disorientation delay to the attacker, preventing immediate sticky re-teleports.
* **Audio Cue**: Signature high-frequency vanish pop/chirp (`skill_dash3`).

---

## 🎨 Visual Design & Rendering Standards

### 1. Upright Fighter Body Model (Rule 19 Front POV Standard)
Vegeta's procedural body model and proportions strictly adhere to the **Canonical Toji Baseline Standard (Rule 24)** at `r: 25, radius: 25`:
- **Zone 1: Pure Face Dome (`ry < r * 0.28`)**:
  - Clean fair/tan anime skin tone (`#FFE0BD` base, `#E2B388` contour).
  - **Faceless Minimalist Standard (Rule 19)**: Strictly zero baked eyes, pupils, mouth, or nose. Pure circular anime dome.
- **Zone 2: Royal Battle Armor Torso (`r * 0.28 <= ry < r * 0.64`)**:
  - Classic white Royal Saiyan battle cuirass (`#FFFFFF` / `#ECEFF1`) with segmented gold-amber shoulder straps/flange guards (`#FFC107` / `#D4AF37`).
  - Dark navy-blue bodysuit lining (`#1565C0` / `#0D1B2A`) framing the neck and flanks.
- **Zone 3: Armor Waistband & Flange Ribbing (`r * 0.64 <= ry < r * 0.78`)**:
  - Segmented armor abdomen plate protecting the midsection with dark indigo seam dividers.
- **Zone 4: Navy Bodysuit & Royal Combat Boots (`ry >= r * 0.78`)**:
  - Form-fitting royal navy tights (`#1565C0`) meeting heavy white battle boots with golden-tan reinforced toe caps (`#FFC107`).
  - Interior fabric luminance separation maintained ($Y \ge 24$) against outer black borders.

### 2. Hair Asset & Crown Calibration (Rules 22 & 24)
- **Asset Path**: `Assets/model/vegeta/Vegeta-hair.png`
- **Silhouette**: Iconic, towering flame-shaped Saiyan hair flaring straight upward with a distinctive widow's peak crest at the forehead.
- **Layering**: Rendered on Layer 2 (`_drawVegetaHair(ctx, r, facingLeft)`) above the procedural body dome.
- **Crown Apex Anchor**: `drawY = -r * 1.35` to `-r * 1.45`, scaled to `targetHairWidth = r * 2.80` and `targetHairHeight = r * 2.35`.
- **Eager Image Caching**: Module-level image cache `_getVegetaHairImage()` initialized on load with `ctx.imageSmoothingEnabled = false;`.

### 3. Symmetrical Hands & Combat Gloves (Rule 20)
- **Symmetrical Lower-Flank Placement**:
  - Left Hand: `(x: -r * 0.82, y: +r * 0.38)`
  - Right Hand: `(x: +r * 0.82, y: +r * 0.38)`
- **Hand Radius**: `handRadius = r * 0.30` rendered via `drawPixelHand` with white royal combat gloves (`#FFFFFF`), charcoal knuckle seams (`#90A4AE`), and navy wrist cuffs (`#1565C0`).
- **Single Source of Truth**: Palms and fists always extend directly from canonical wrist anchors. During Big Bang Attack, Galick Gun, and Final Flash charges, hands move along dynamic kinematic vectors without generating disconnected duplicate hands.

### 4. Ink Outline & Visual Effects Hygiene (Rules 11, 26, 31, 32)
- **Manga Ink Outline**: Crisp 2.0px stroke (`#0E0F14`) around circular body and combat gloves.
- **Zero shadowBlur**: Electric Saiyan lightning sparks and fiery Ki auras are rendered via concentric polygonal alpha gradients, strictly avoiding CPU `ctx.shadowBlur`.
- **Clean Concentric Shockwaves (Rule 26)**: Big Bang detonations and Final Flash beam impacts expand as sequential water-ripple wavefront discs with soft translucent interior washes, completely prohibiting radial cobweb/spoke meshes.
- **Uncropped Visual Effects (Rule 31)**: All Ki volley sprites, Big Bang plasma spheres, and Final Flash charging auras maintain generous 20–30px transparent padding to eliminate rectangular box clipping.

---

## 🛡️ Baseline Stats

| Attribute | Base Value | Super Saiyan Multiplier | Super Saiyan Value |
| :--- | :--- | :--- | :--- |
| **HP** | `390` | — | `390` (Preserved) |
| **Base Speed** | `5.4` | `1.30×` | **`7.02`** |
| **Attack Damage** | `1.00×` | `1.35×` | **`+35% Bonus Damage`** |
| **Basic Attack Cadence** | `15 frames` | `1.25×` (Faster) | **`12 frames` (~0.20s)** |
| **Armor Shield** | `50` | Full Re-Arm | **`50 Restored`** |
| **Damage Reduction**| `0%` | `+20%` | **`20% Flat Mitigation`** |
| **Dodge Chance** | `85%` | `+10%` | **`95% Auto-Evasion`** |
| **Body Radius** | `25px` | — | `25px` (Rule 24 standard) |
| **Melee Reach** | `66px` | `1.10×` | **`73px`** |
| **Melee Gap-Close Range**| `150px` | — | `150px` (Z-Vanish reach) |
| **Follow-Up Ki Count** | `8 blasts` | — | `8 blasts` (Speed `17 px/f`) |
| **Crit Chance** | `18%` | `+10%` | **`28%`** |
| **Crit Damage** | `1.85×` | `+0.25×` | **`2.10×`** |

---

## ⚡ Passives & Inherent Mechanics

### 1. 👑 Royal Saiyan Pride (*Unyielding Prince's Will*)
* **Mechanic**:
  * Vegeta's combat ferocity intensifies as his health declines.
  * For every **10% HP missing below 70%**, Vegeta gains **+5% increased attack power** across all basic attacks, skills, and ultimates (capping at **+35% bonus damage** at low HP).
  * In Super Saiyan, this stacks multiplicatively for up to **+70% total bonus damage**!
  * Takes **20% reduced knockback** when below 50% HP, digging his boots into the arena floor to refuse ground surrender.
  * Uses **Healthbar-Only Feedback (Rule 27)**: Updates top health card glow without cluttering the combat arena with floating text.

---

### 2. 🛡️ Royal Battle Armor Carapace (*Saiyan Elite Defense*)
* **Mechanic**:
  * Vegeta enters the match with an **Armor Shield** of **50 points**.
  * While active, the armor absorbs **20% of all incoming damage** directly into the shield pool before taking health damage.
  * Re-arms instantly upon activating Super Saiyan!
  * If depleted outside Super Saiyan, the shield recharges to full strength after Vegeta avoids taking damage for **6.0 consecutive seconds**.
  * Visual cue: Subtle white-gold hexagonal flash along his armor edges when absorbing blows.

---

## ⚔️ Active Skills & Special Moves

### 💥 Skill 1: Big Bang Attack (*Bigu Ban Atakku — ビッグ・バン・アタック*)
* **Type**: High-Velocity Plasma Orb & Catastrophic Point-Blank Detonation
* **Cooldown**: `7.5s` (`450 frames`)
* **HUD Toggle**: Gated by `isSkillEnabled(cfg.enableBigBang, true)`
* **Mechanics**:
  * Vegeta extends his open right palm directly forward: *"Eat this!"*.
  * Condenses a blazing sphere of golden-cyan plasma (`#00E5FF` core with `#FFD700` rim) at his palm over 24 frames (0.4s).
  * Launches the supersonic plasma missile forward at `18 px/frame`.
  * **Impact Detonation**: On collision with an enemy or arena wall, detonates into a gigantic spherical plasma explosion: `90px` radius in base form, expanded to **`120px` radius** in Super Saiyan!
  * **Damage**: Deals **52 burst damage** (`70` in Super Saiyan) to all enemies caught within the blast radius.
  * **Kinetic Wall Ricochet**: Enemies caught in the blast are launched horizontally at extreme velocity, ricocheting off arena walls with an added 1.2s 30% slow debuff.

---

### 🟣 Skill 2: Galick Gun (*Gyārikku Hō — ギャリック砲*)
* **Type**: High-Velocity Piercing Violet Beam Cannon
* **Cooldown**: `7.0s` (`420 frames`)
* **HUD Toggle**: Gated by `isSkillEnabled(cfg.enableGalickGun, true)`
* **Mechanics**:
  * Vegeta pulls both hands back to his left chest in his signature stance, charging a concentrated sphere of violet/magenta Ki (`#8A2BE2` / `#7C4DFF`).
  * Thrusts both palms forward, shouting *"GALICK GUN... FIRE!"*.
  * Fires a supersonic piercing violet laser cannon beam (`50px` wide in base, expanded to **`75px` wide** in Super Saiyan) traversing the target lane.
  * **Damage**: Deals **55 burst damage** (`74` in Super Saiyan) to all enemies in its trajectory.
  * **Kinetic Impulse**: Punches through enemy defenses and launches enemies backward into arena wall bounces.

---

### ⚡ Ultimate: Final Flash (*Fainaru Furasshu — ファイナルフラッシュ*)
* **Type**: Committed 360° Omnidirectional Cataclysmic Laser Cannon
* **Cooldown**: `32.0s` (`1920 frames`)
* **HUD Toggle**: Gated by `isSkillEnabled(cfg.enableFinalFlash, true)`, registered with `isSignature: true`
* **Execution Phases**:
  * **Phase 1 — Supreme Pride Stance & Lightning Surge (75 frames / 1.25s)**:
    * Vegeta flings both arms wide open to his sides and arches his back, drawing energy from the entire arena: *"FINAL..."*.
    * Locks aim angle (`this.skillCastAngle = angle`) with committed aim clamping.
    * In Super Saiyan, ferocious golden and royal violet lightning bolts dance across the arena floor.
  * **Phase 2 — The Lock & Release ("FLASH!") (48 frames / 0.8s)**:
    * Vegeta brings his palms violently together facing the committed aim line: *"FLASH!"*.
    * Blasts a colossal laser cannon beam: `90px` wide in base form, amplified to **`115px` wide** in Super Saiyan!
    * **Damage**: Deals `9` rapid ticks of `16` damage + `60` final burst (Base: `204` total; amplified to **`275` total damage** in Super Saiyan).
    * **Destruction**: Vaporizes all incoming projectiles in its flight path and pierces through enemy barriers.
    * **Recoil**: Tremendous physical recoil drives Vegeta backward (`this.vx -= Math.cos(angle) * 4.2`).
    * **Screen Shake**: Monumental global screen rumble (`triggerGlobalScreenShake(4.8, 20)`).
  * **Phase 3 — Terminus Shockwave**:
    * Explodes at arena perimeter into a colossal 130px concentric golden shockwave wash with dispersing ionization rings (Rule 26).

---

## 🥊 Special Interactions Table

| Opponent / Technique | Interaction Behavior |
| :--- | :--- |
| **Saitama (Dodge Clash)** | Both fighters possess elite dodge engines (`enableDodge: true`). Clashing at close quarters triggers rapid alternating afterimage sidesteps (`'MISS'` popping over both fighters) before a clean hit connects! |
| **Sans (Evasion Duel)** | Vegeta's Z-Vanish dodge directly rivals Sans's teleport evasion. Vegeta's follow-up Ki volley forces Sans to rapidly burn through dodge stamina, while Vegeta sidesteps Sans's Gaster Blasters! |
| **Gojo (Melee Mode Clash)** | When both Gojo and Vegeta engage in basic attack melee flurries at close range, Gojo's Infinity is lowered, and Vegeta unleashes his crushing Saiyan beatdown punches, triggering an intense, rapid brawler clash! |
| **Sukuna (Melee Mode Clash)** | Clashing basic attacks with Sukuna triggers a brutal brawl: Vegeta's royal armor absorbs incoming slashes while trading explosive punches with Sukuna. |
| **Goku (Saiyan Prince Rivalry)** | **Mutual Melee Clash**: When both Vegeta and Goku basic attack simultaneously at close range, they engage in the legendary Dragon Ball rapid fist flurry clash. Clashing Final Flash against Super Kamehameha triggers an arena-splitting Ki Beam Struggle! |
| **Mahoraga (Wheel Adaptation)** | Repeated hits from the follow-up Rapid Ki Volley will cause Mahoraga's wheel to spin. Vegeta must rely on the heavy physical strikes of his basic attack to bypass Ki energy adaptation, reserving Final Flash or Galick Gun for a decisive finishing blow. |
| **Toji (Heavenly Restriction)** | If Toji attempts an ambush, Vegeta's Z-Vanish Dodge (85% chance) and high knockback resistance prevent him from being pinned, allowing him to counter with point-blank Big Bang Attack or Galick Gun! |

---

## ⚙️ Configuration & Parameter Specifications (`vegetaConfig.js`)

```javascript
// Vegeta Basic Attack: Hybrid Martial Arts & Follow-Up Ki Volley Engine
enableBasicMelee: true,             // Master toggle for Melee Mode Basic Attack
meleeReach: 66,                     // Frontal arc strike reach in pixels (73 in Super Saiyan)
meleeGapCloseRange: 150,            // Distance within which basic attack executes Z-Vanish step-in
meleePunchDamage: 20,               // Hit 1 damage (27 in Super Saiyan)
meleeElbowDamage: 24,               // Hit 2 damage (32 in Super Saiyan)
meleeFinisherDamage: 34,            // Hit 3 finisher damage (46 in Super Saiyan)
meleePunchCooldown: 15,             // Cadence between strikes in frames (12 in Super Saiyan)
meleePunchAnimDuration: 10,         // Extension & retraction frame duration
meleeTeleportAngle: 1.75,           // Flank pivot angle between combo hits
meleeClashCooldown: 25,             // Minimum frames between clash shockwaves
meleeBackstepDistance: 120,         // Distance vaulted backward after Hit 3 (pixels)
enableFollowUpKiVolley: true,       // Master toggle for follow-up Rapid Ki Volley
followUpKiCount: 8,                 // Number of Ki blasts fired in follow-up volley
followUpKiDamage: 7,                // Damage per Ki blast in follow-up volley (10 in Super Saiyan)
followUpKiSpeed: 17,                // Projectile speed of follow-up Ki blasts (px/frame)
followUpKiRadius: 7,                // Radius of follow-up Ki blast spheres (pixels)
basicAttackResetCooldown: 42,       // Reset delay in frames before initiating next basic combo

// Vegeta Skill 2: Galick Gun
enableGalickGun: true,              // Master toggle for Galick Gun
galickGunCooldown: 420,             // Cooldown in frames (7.0s at 60fps)
galickGunDamage: 55,                // Burst beam damage (74 in Super Saiyan)
galickGunWidth: 50,                 // Beam width in pixels (75 in Super Saiyan)

// Vegeta Super Saiyan Transformation (Stats Multiplier Buff)
enableSuperSaiyan: true,            // Master toggle for Super Saiyan Transformation
superSaiyanHpThreshold: 0.40,       // Health threshold to trigger transformation (40% HP)
superSaiyanDuration: 900,           // Duration of transformation in frames (15.0s at 60fps)
superSaiyanDmgMultiplier: 1.35,     // Damage multiplier (+35% attack power)
superSaiyanSpeedMultiplier: 1.30,   // Movement speed multiplier (+30% speed)
superSaiyanDamageReduction: 0.20,   // Flat incoming damage reduction (20%)
superSaiyanDodgeChance: 0.95,       // Evasion probability while in Super Saiyan (95%)

// Vegeta Z-Vanish Afterimage Dodge System (Saitama & Sans Standard)
enableDodge: true,                  // Master toggle for autonomous Z-Vanish evasion
dodgeChance: 0.85,                  // Base evasion probability against incoming attacks (85%)
domainDodgeChance: 0.80,            // Evasion probability against Domain spatial slices (80%)
beamDodgeChance: 0.90,              // Evasion probability against lethal super-beams (90%)
dodgeDistance: 115,                 // Flash-step jump distance in pixels
dodgeCooldown: 4,                   // Minimum frames between consecutive dodge teleports
shotgunDodgeGraceWindow: 16,        // Grace window where projectile volley pellets are auto-evaded
dodgeAfterimageCount: 2,            // Number of fading ghost afterimages spawned per dodge
dodgeAfterimageDuration: 18,        // Lifespan of afterimages in frames
dodgeAfterimageAlpha: 0.40,         // Opacity of afterimage ghosts
dodgeText: 'MISS',                  // Floating combat text displayed on dodge
dodgeTextColor: '#00E5FF',          // Cyan text color
attackerTeleportChaseDelayFrames: 5,// Momentary disorientation delay for teleporting chasers
```

---

## 🎮 HUD & UI Integration (Rule 18)

* **Unified Character Theme Color**: All HUD skill progress bars strictly use Royal Saiyan Blue (`#3D5AFE`).
* **Config Toggle Gating**:
  * Basic Melee: `isSkillEnabled(cfg.enableBasicMelee, true)`
  * Super Saiyan: `isSkillEnabled(cfg.enableSuperSaiyan, true)`
  * Dodge Reflex: `isSkillEnabled(cfg.enableDodge, true)`
  * Skill 1: `isSkillEnabled(cfg.enableBigBang, true)`
  * Skill 2: `isSkillEnabled(cfg.enableGalickGun, true)`
  * Ultimate: `isSkillEnabled(cfg.enableFinalFlash, true)`
* **Clean Label Standard**:
  * Skill 1: `BIG BANG ATTACK`
  * Skill 2: `GALICK GUN`
  * Ultimate: `FINAL FLASH`
  * Transformation Card: Glows in pulsing royal violet-gold CSS class `hud-super-saiyan-active` during transformation.
* **Zero DOM Queries**: Declarative data structures only returned in `hudSkillProviders.js`.

---

## 🧠 AI Combat Behavior Notes

* **Hybrid Combo Chain**: When in range, AI initiates basic attack: steps in with Z-Vanish, pummels the target with the 3-hit beatdown, vaults back, and immediately bombards the wall-bounced enemy with the follow-up Rapid Ki Volley.
* **Galick Gun Sniping**: Deploys Skill 2 (Galick Gun) down the lane when the enemy is recovering from knockback to chain heavy burst damage.
* **Super Saiyan Overdrive**: Upon activating Super Saiyan at low HP, AI aggression increases to 100%, combining the +35% damage multiplier with Royal Saiyan Pride scaling for devastating execution potential.
* **Ultimate Timing**: Unleashes Final Flash when the opponent is cornered, wall-bounced from the Hit 3 axe kick, or locked in skill recovery.
