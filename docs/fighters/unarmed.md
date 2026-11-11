# Unarmed — The Legendary Weaponless Sphere (Earclacks Fighting)

**Category:** Gaming / Web Fighting (*Earclacks Fighting* Series)  
**Character ID:** `unarmed`  
**Theme Color:** Neutral Grey Sphere (`#CFCFCF`) & Muted Steel Silver (`#71717A`)  
**Secondary Accents:** Super Unarmed Pure White (`#FFFFFF`), Super Outline Light Grey (`#D4D4D8`), Concussive Ink Outline (`#000000` / `#0E0F14`), Damage Text Silver-White (`#E4E4E7`)  
**Role:** Kinetic Physics Brawler, Permanent Velocity Scaling Juggernaut, Unparriable Body Striker  

---

## 📖 Lore & Character Philosophy

> *"Speed increases whenever it bumps into unmoving objects, such as walls. Damage scales directly depending on its current speed."*  
> — [Official Earclacks Fighting Wiki](https://earclacks-fighting.fandom.com/wiki/Unarmed)

Originating as the iconic default physics ball from the viral *Earclacks Fighting* simulation, **Unarmed** represents combat distilled to its purest physical essence: no weapons, no firearms, no magic incantations—only mass, velocity, and unrelenting kinetic momentum.

Unlike humanoid swordsmen or armed combatants who wield blades and pistols, **Unarmed is a pure handless sphere**. It strikes opponents directly with its entire body, rendering its attacks **completely unparriable** by weapons, katanas, or shields. The arena walls are not boundaries to Unarmed—they are high-tension springs. By continuously ricocheting off arena boundaries, Unarmed charges its kinetic potential, permanently gaining speed and impact damage with every hit landed until it transforms into the catastrophic, blinding-white **Super Unarmed** overdrive.

---

## 🎨 Visual Design & Rendering Architecture

### 1. Official Earclacks Physics Ball Aesthetic
Unarmed faithfully recreates the minimalist geometric aesthetic of the *Earclacks Fighting* wiki canon:
- **Neutral Grey Sphere Base**: Rendered as a solid circular body (`#CFCFCF`) with a bold jet-black outer boundary stroke (`#000000`, $2\text{px}$ line weight) via [`drawUnarmedPixelBody`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/js/graphics/fighters/unarmedSkin.js#L87-L100).
- **Centered In-Sphere HP Overlay**: In place of faceless skin zones, Unarmed displays a prominent centered black HP number directly inside the sphere (`drawUnarmedCenterHpOverlay`), scaling its live HP relative to the 100-point Earclacks scale so health remains legible during rapid high-speed motion.
- **Weaponless & Handless Standard (Rule 20 Special Architecture)**:
  - Declares `hideHands = true` and `hideWeapon = true` across all states.
  - Zero detached hands or floating fists are rendered; character collision occurs directly through its circular perimeter.

### 2. Super Unarmed Overdrive Transformation
When activating its Ultimate, Unarmed ascends into its official wiki **Super Unarmed** form:
- **Pure White Sphere Core (`#FFFFFF`)**: Replaces the neutral grey body with an unblemished, brilliant white orb.
- **Light Grey Outline (`#D4D4D8`)**: The dark ink stroke transitions into a radiant silver-grey boundary.
- **Unstoppable Kinetic Mass**: In Super Form, Unarmed punches cleanly through opponent rebound vectors without being deflected backward, conserving forward momentum.

### 3. Ghost Afterimage Trails & Concentric Shockwaves
- **High-Speed Afterimage Trails**: Spawns fading monochrome ghost silhouettes (`#A1A1AA` in normal form, `#FFFFFF` with $0.48$ alpha in Super Form) that follow its velocity vector whenever traveling at high speeds.
- **Clean Concentric Shockwaves (Rule 26 Compliant)**:
  - **Wall Ricochets**: Spawns expanding silver compression rings (`#D4D4D8`) at boundary contact points.
  - **Kinetic Collisions**: Emits supersonic white shockwaves (`#F4F4F5` / `#FFFFFF`) and spark clusters on enemy impacts.

### 4. Hair & Customization Support (Rule 22)
- Eagerly initializes module-level image caching for `Assets/model/unarmed/Unarmed-hair.png` via `_getUnarmedHairImage()`.
- Supports full Skin Studio customization (`widthScale`, `heightScale`, `angleOffset`, `flipX`, `flipY`) via `_drawUnarmedHair()`.

---

## 📊 Baseline Stats & Attributes

| Attribute | Base Value | Scaled / Max Potential | Combat & Gameplay Notes |
| :--- | :--- | :--- | :--- |
| **HP** | `1100` | `1100` | Substantial brawler health pool built for continuous body collisions |
| **Base Speed** | `5.0 px/frame` | **Uncapped** (`+1.0 / hit`) | Increases permanently with every hit connected; zero hard speed ceiling |
| **Body Radius ($r$)** | `25px` | `25px` | Universal humanoid collision baseline ([Rule 24 Standard](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/AGENTS.md)) |
| **Collision Damage** | `30 base` | **$30 + \Delta v + \text{Stacks}$** | Directly scales with current kinetic velocity and accumulated momentum |
| **Parry Interaction** | **Unparriable** | **Unparriable** | Body collisions bypass weapon parries, shield deflections, and blade blocks |
| **Wall Ricochet** | `1.0` multiplier | Natural Specular | Conserves speed on wall impacts with billiard cushion dispersion |
| **Bump Stun** | **Hit-Gated Ultimate** | `1.50s` (`90 frames`) | Hit requirement charges Super Unarmed; next bump deals **2X damage** & long stun |
| **Evade Chance** | `5%` base | **`45%` (Max 20 Stacks)** | Gains `+2%` stacking evasion on each hit; triggers supersonic evade dash |
| **Super Unarmed** | `5 Hits Req` | `4.0s Duration` | Super Form: $18.0\text{ speed}$, $+60\%$ base, **2X damage** on empowered bump |
| **Shoot Suppression** | Blank `shoot()` | Blank `shoot()` | Overrides default `Fighter.shoot()` to suppress generic bullets ([Rule 23](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/AGENTS.md)) |

---

## ⚔️ Core Combat Mechanics & Skill Matrix

```
                      ┌──────────────────────────────────────────┐
                      │          UNARMED COMBAT ARSENAL          │
                      └────────────────────┬─────────────────────┘
                                           │
     ┌───────────────────────┬─────────────┴─────────────┬───────────────────────┐
     ▼                       ▼                           ▼                       ▼
┌───────────┐         ┌─────────────┐             ┌─────────────┐         ┌─────────────┐
│  PASSIVE  │         │BASIC ATTACK │             │   SKILL 1   │         │  ULTIMATE   │
│ Momentum  │         │Kinetic Bump │             │Kinetic Surge│         │Super Unarmed│
│ & Evade   │         │(Wall Rebound│             │ (Supersonic │         │ (White Ball │
│  Scaling  │         │ Requirement)│             │ Directional)│         │  Overdrive) │
└───────────┘         └─────────────┘             └─────────────┘         └─────────────┘
```

---

### 🛡️ Passive: Permanent Momentum & Kinetic Evade

#### 1. Momentum Scaling (Earclacks Standard)
Every time Unarmed successfully lands a primed collision hit that **actually inflicts damage on an entity** (fighters, minions, summons, or plant enemies):
* **Damage Verification Rule:** Momentum and speed scaling trigger **strictly upon inflicting actual damage**. Collisions against invulnerable entities, i-frames, dodges, or impenetrable barriers (such as Gojo's *Limitless Infinity*) deal zero damage and grant **zero momentum stacks** and **zero speed scaling**.
* **Permanent Speed Scaling:** Permanently increases base movement speed by **`+1.00 px/frame`** (`speedPerHit: 1.00`).
* **Permanent Damage Scaling:** Permanently adds **`+1.0 Damage`** (`damagePerHit: 1.0`) per stack to all subsequent kinetic bumps.
* **Uncapped Potential:** Speed and momentum stacks possess no terminal ceiling (`maxTerminalVelocity: null`, `maxMomentumStacks: null`), allowing skilled play to turn Unarmed into a hypersonic blur.

#### 2. Stacking Kinetic Evade
* Starts with a baseline **5% evasion chance**.
* Each landed collision hit adds **`+2%` evasion chance** (up to a **45% cap** at 20 stacks).
* When evasion triggers:
  * Floats cyan text: **`EVADE!`**
  * Emits electric sparks and a heavy dash whoosh (`dash_heavy`).
  * Teleports instantaneously away from incoming projectile lines while preserving momentum.

---

### 💥 Basic Attack: Kinetic Bump (Kinetic Body Slam)

Unarmed does not swing fists or weapons; its body is the weapon.

* **Continuous Kinetic Bump Damage (`requireWallBounceForDamage: false`)**:
  * Unarmed deals kinetic bump damage directly upon colliding with enemies without needing to rebounce off an arena wall first.
  * Consecutive bumps after recovery frames (`collisionCooldown`) deal full kinetic impact damage continuously, building momentum stacks and speed without requiring wall-rebound cycling.
  * **Config Toggle Support:** If `requireWallBounceForDamage: true` is explicitly enabled in `unarmedConfig.js`, Unarmed reverts to requiring an arena wall rebounce before dealing damage.
  * **Kinetic Collision Damage:**
    $$\text{Damage} = \text{baseDmg (30)} + (\text{currentSpeed} - \text{baseSpeed}) \times 1.0 + (\text{momentumStacks} \times 1.0)$$
* **Concussive Impact Audio:** Triggers the heavyweight punch impact sound:
  `Assets/Sound Effects/Attacks/heavypunch3.mp3` (`unarmed_enemy_bump`).
* **True 2D Elastic Physics:** Resolves realistic sphere-on-sphere momentum transfer along normal and tangential contact angles.
* **Mutual Hit Slow:** Applies a brief movement slowdown on impact ($0.35\times$ speed for $14\text{ frames}$) for tactile hitstop feel.
* **Ultimate-Gated Concussive Bump Stun & 2X Damage:**
  * Unarmed's stun mechanic is integrated directly into his **Ultimate: Super Unarmed**.
  * Landing hits on enemies builds up charges toward Super Unarmed (`superUnarmedHitsRequired: 5`).
  * When the hit requirement is met, Unarmed ascends into **Super Unarmed** form, priming the empowered **Super Bump**.
  * The **NEXT bump** against an enemy delivers **`2X Current Damage`** (`superBumpDamageMultiplier: 2.0`), inflicts a **`1.50s Long Stun`** (`superBumpStunDuration: 90 frames` via `paralyzeTimer`), and triggers floating text **`SUPER STUN!`** (`#FACC15`) and **`2X DAMAGE!`** (`#EF4444`).
  * Legacy random bump stun remains configurable via `enableBumpStun` (`0.25` chance, `45 frames`).

---

### 💨 Skill 1: Kinetic Surge

* **Type:** Directional Supersonic Boost
* **Cooldown:** `280 frames` (~`4.6 seconds`)
* **Duration:** `18 frames` (~`0.30 seconds`)
* **Speed:** `16.0 px/frame`
* **Mechanics:**
  * Instantly rockets Unarmed along its aiming vector at supersonic speed.
  * Immediately awards **`+2 Momentum Stacks`** upon cast.
  * Plays concussive sonic blast SFX (`groundSmash.mp3`) and radiates a $70\text{px}$ concentric shockwave.

---

### ⚡ Ultimate: Super Unarmed (Official Earclacks Overdrive & Empowered Super Bump)

* **Type:** Hit-Gated Transformation & Empowered 2X Stun Finisher
* **Requirement:** `5 Hits Connected` (`superUnarmedHitsRequired: 5`)
* **Cooldown Fallback:** `600 frames` (`10.0 seconds`)
* **Duration:** `240 frames` (`4.0 seconds`)
* **Top Speed:** `18.0 px/frame`
* **Mechanics:**
  * **Hit Requirement & Activation:** Connecting 5 damaging hits against enemies primes Super Unarmed.
  * **Empowered Super Bump:** The next body collision against an opponent inflicts **`2X to Current Damage`** and applies a **`1.50s Concussive Stun`** (`90 frames` of paralysis/time-stop).
  * **Overdrive Transformation:** The sphere turns pure white (`#FFFFFF`) with a light silver outline (`#D4D4D8`).
  * **Instant Prime:** Enters the form with instant wall-rebound priming (`hasWallRebounded = true`).
  * **Bonus Damage:** Boosts all collision damage by **`+60%`** (`superUnarmedDamageMult: 1.6`).
  * **Unstoppable Penetrating Mass:** Overrides standard normal elastic rebound; instead of bouncing away backward from the target, Super Unarmed punches cleanly through opponent defenses with minimal friction.
  * **Activation Audio:** Plays `heavypunch3.mp3` alongside heavy arena screen shake, golden/white spark bursts, and a $95\text{px}$ white shockwave detonation.

---

## 🎵 Sound Design & Audio Architecture

| Action / Trigger | Sound Asset Path | Audio Config ID | Volume | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Enemy Bump (Impact)** | `Assets/Sound Effects/Attacks/heavypunch3.mp3` | `unarmed_enemy_bump` / `heavypunch3` | `1.00` | Heavy concussive punch impact on damaging collisions |
| **Unprimed Deflection** | `Assets/Sound Effects/Attacks/heavypunch3.mp3` | `unarmed_enemy_bump` | `0.60` | Cushioned deflection when bumping before wall rebound |
| **Wall Ricochet** | `Assets/Sound Effects/UnarmedSFX/unarmed_wall_bump.mp3` | `unarmed_wall_bump` / `unarmed_wallbounce` | `0.90` | Official Earclacks hollow rubber/steel wall thud |
| **Kinetic Surge** | `Assets/Sound Effects/Attacks/groundSmash.mp3` | `attack_groundsmash` | `0.85` | Deep sonic detonation on directional dash cast |
| **Super Unarmed** | `Assets/Sound Effects/Attacks/heavypunch3.mp3` | `attack_heavypunch3` | `1.00` | Concussive crack on Super Form activation |
| **Kinetic Evade** | `Assets/Sound Effects/Skills/dash5.mp3` | `dash_heavy` | `0.60` | Instantaneous lightning dash slip |

---

## ⚔️ Matchup Dynamics & Synergies

### 🗡️ vs Parry Masters (Yuta, Toji, Nanami, Knight)
* **Matchup Advantage:** Total parry immunity. Because Unarmed possesses no weapon blade or projectile entity, parry stances (like Yuta's Katana Parry or Knight's Shield) cannot parry its body bumps.

### 🌌 vs Domain Expansions (Sukuna, Gojo, Mahito)
* **Matchup Dynamic:** Inside enclosed barriers, Unarmed has shorter distances between walls, allowing it to bounce and re-prime damage rapidly. High evasion stacks grant increased survivability against continuous domain hazards.

### 🛡️ vs Heavy Tanks & Bosses (Saitama, PEKKA, Escanor)
* **Matchup Dynamic:** High initial HP pool ($1100$) allows Unarmed to trade early blows while accumulating permanent momentum. As speed scales past $12.0\text{ px/f}$, damage ramps up exponentially to match boss HP pools.

### 💣 vs Tactical Zoners (Bomber Man, CJ, Crazy Dave)
* **Matchup Dynamic:** Unarmed must navigate through planted bomb grids and plant obstacles. Kinetic Surge allows it to burst past trap corridors and slam directly into the summoner.

---

## 💡 Tactical Combat Tips

1. **Relentless Kinetic Pressure:** Unarmed deals direct kinetic damage on every bump without needing to bounce off a wall first. Keep continuous pressure on opponents, chaining elastic collisions to build momentum stacks.
2. **Bank On Tangent Billiard Angles:** Natural specular reflection with cushion dispersion allows Unarmed to slingshot around projectiles and strike opponents from unpredictable lateral flanks.
3. **Save Kinetic Surge for Recovery:** Use Kinetic Surge not only for offense, but to instantly re-align trajectory towards a wall or escape dangerous ground hazards.
4. **Time Super Unarmed for Enclosed Exchanges:** Activate Super Unarmed when the opponent is pinned near a corner to deliver multiple unstoppable high-speed bounces in rapid succession.

