# Creeper — The Silent Detonator (Minecraft)

**Category:** Gaming & Sandbox Icon (*Minecraft* by Mojang Studios)  
**Character ID:** `creeper`  
**Theme Color:** Foliage Green (`#22C55E`) & Moss Camo (`#15803D`)  
**Secondary Accents:** Charcoal Frown (`#0F172A`), Charged Plasma Cyan (`#38BDF8`), Gunpowder Slate (`#334155`), Manga Ink (`#0E0F14`)  
**Role:** Stealth Ambush Nuker, Volatile Area Denier, Supercharged High-Risk Finisher  

---

## 📖 Lore & Character Philosophy

> *"That's a very nice arena you have there... It would be a shame if something happened to it."*

Born from an accidental coding glitch by Notch in 2009 while attempting to model a pig, the **Creeper** has evolved into one of the most feared and recognizable mascots in all of gaming history. Silent, patient, and camouflaged in the verdant hues of the Minecraft overworld, the Creeper stalks its prey with absolute stealth—only breaking silence with the dread-inducing *"Tssssssss..."* of a burning fuse before unleashing a catastrophic explosion.

In the *Circle Mini-Battle* arena, the **Creeper** brings Minecraft's authentic proximity ambush tension to fast-paced 60 FPS fighting. Rather than being a one-and-done suicide mob, the Creeper possesses a regenerative **Gunpowder Core**: it stalks targets silently, primes its fuse upon entering close proximity while swelling and white-flashing, defuses if the target escapes or knocks it back, and channels celestial wrath to transform into the legendary **Charged Creeper** when struck by lightning.

---

## 🎨 Visual Design & Rendering Standards

### 1. Upright Fighter Body Model (Rule 19 Front POV Standard & Rule 24 Toji Baseline)
Creeper's body model, pixel camouflage grid, iconic frowning face, and four stubby legs adhere strictly to the repository Toji baseline standard (`r = 25`):
- **Zone 1: Minecraft Camo Dome & Iconic Frowning Face (`ry < r * 0.35`)**:
  - Pixelated procedural moss grid with green shades: `#22C55E` (lime), `#16A34A` (mid-tone), `#15803D` (deep moss), `#4ADE80` (bright foliage), and `#14532D` (shadow).
  - **The Iconic Frown Plate**:
    - Two symmetrical $4 \times 4\text{px}$ black square eye recesses (`#0F172A`).
    - Central inverted-U frowning mouth: vertical nose bar connected to down-turned mouth brackets (`#0F172A`).
    - 100% authentic to Minecraft's original $8 \times 8$ head texture mapping.
- **Zone 2: Minecraft Torso Mosaic (`r * 0.35 <= ry < r * 0.72`)**:
  - Vertical pixel columns alternating between grass, dirt-lichen, and dark foliage textures.
  - Subtle central breathing pulse during combat idle.
- **Zone 3: Four Stubby Minecraft Feet (`ry >= r * 0.72`)**:
  - Two front stubby square feet at canonical lower flanks (`±r * 0.65, r * 0.42`), anchored cleanly with dark paw soles (`#0F172A`).
  - Two rear stabilizing feet rendered slightly behind, creating the signature 4-legged creeper stance.
- **Outer 4-Neighbor Ink Outline Shell (Rule 24 & Rule 32)**:
  - Solid dark manga ink outline (`#0E0F14`) rendered using the canonical 4-neighbor boundary test.
  - **Layer 1.5 Vector Stroke**: `ctx.arc(0, 0, r, 0, Math.PI * 2)` with `lineWidth = 2.0` and `strokeStyle = '#0E0F14'`.

### 2. Canonical Hands / Stubby Paws (Rule 20 Standard)
- Creeper has no humanoid arms; its two front stubby feet double as canonical combat extremities positioned symmetrically at `(x: ±r * 0.82, y: +r * 0.38)`.
- Rendered with `drawPixelHand` using `#22C55E` fill and `#0E0F14` black outline (`hideHands: true`).

### 3. Priming Inflation & Accelerating White Flash Animation (Rule 31 Compliant)
- When fuse is active, Creeper expands exponentially ($1.0 \to 1.35\times$ visual scale) while flashing solid white (`#FFFFFF`) with accelerating frequency ($4\text{Hz} \to 24\text{Hz}$).
- Defuses smoothly back down to $1.0\times$ scale if the target escapes or knocks Creeper away.

### 4. Charged Creeper Electric Aura (Rule 11 & Rule 26 Compliant)
- When in **Charged State** (Ultimate), Creeper is enveloped in a dynamic electric plasma shield:
  - Concentric translucent cyan discs (`rgba(56, 189, 248, 0.22)`).
  - Rotating polygonal electric arc bands with zero `ctx.shadowBlur` (Rule 11 compliant).
  - Discrete orbiting spark motes following a continuous power curve.

---

## 🛡️ Baseline Stats

| Attribute | Base Value | Charged State Value | Notes |
| :--- | :--- | :--- | :--- |
| **HP** | `380` | `380` | Resilient explosive combatant |
| **Base Speed** | `4.2` | `5.4` (+`28%`) | Silent stalking pace, surges when charged |
| **Body Radius ($r$)** | `25px` | `25px` | Universal humanoid collision boundary (Rule 24) |
| **Basic Attack** | **None (`0`)** | **None (`0`)** | **Suppressed (Rule 23): Sole offensive mechanic is proximity detonation** |
| **Self-Detonation HP Cost** | **`65 HP`** | **`75 HP`** | **Creeper sacrifices HP on every concussive self-detonation** |
| **Explosion Reach** | `135px` | `250px` ($1.85\times$) | Concussive 360° spherical blast |
| **Explosion Damage** | `95` | `235` ($2.47\times$) | Devastating point-blank nuke with heavy knockback |
| **Proximity Trigger** | `88px` | `88px` | Begins fuse hiss; defuses if target retreats >120px |
| **Ultimate Duration** | — | **`20.0s` (`1200 frames`)** | Charged Creeper lightning transformation |

---

## 💣 Core Combat Mechanics & Skills Breakdown

```
                        ┌──────────────────────────────────────────┐
                        │          CREEPER ARSENAL KIT             │
                        └────────────────────┬─────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
                ┌───────────┐                               ┌───────────┐
                │  PASSIVE  │                               │ ULTIMATE  │
                │  Silent   │                               │  Charged  │
                │  Stalker  │                               │  Creeper  │
                │  & Core   │                               │ Lightning │
                └─────┬─────┘                               └───────────┘
                      │
                      ▼
                ┌───────────┐
                │  SKILL 1  │
                │ "Tssss!"  │
                │ Proximity │
                │   Fuse    │
                └───────────┘
```

### 1. Passive: Silent Stalker & Gunpowder Regeneration
- **Silent Stalking**: Creeper emits zero footstep audio while walking, and moves +15% faster when moving directly toward the enemy's back arc.
- **Gunpowder Regeneration Core**:
  - Creeper does not die upon detonating. Instead, self-detonations expend explosive pressure, dealing massive damage to enemies while recoiling Creeper backward.
  - **Self-Detonation Vitality Cost**: Every time Creeper explodes himself, he loses **65 HP** (75 HP if Charged).
  - **Death Detonation (Final Retaliation)**: If Creeper's HP drops to 0 (either from enemy damage or self-detonation costs), it enters a 0.75-second uninterruptible hyper-flash and unleashes one last colossal retaliatory explosion before dying!

### 2. Skill 1: "Tssssss..." (Proximity Fuse Detonation — Canonical Minecraft Stalking)
- **Cooldown**: `3.0s` (`180 frames`) between detonations
- **Trigger Range**: `88px` (~3.5 Minecraft blocks) | **Defuse Range**: `120px` (~4.8 Minecraft blocks)
- **Fuse Execution**:
  - Upon closing into proximity (`<= 88px`), Creeper automatically halts, coils into tension, begins swelling ($1.0 \to 1.35\times$), and flashes white with escalating cadence.
  - Plays the iconic *"Tssssssss...!"* fuse hiss audio.
  - **Authentic Minecraft Defuse / Abort**: If the opponent knocks Creeper back or flees beyond `120px`, **the fuse defuses**! The hiss stops, the body smoothly deflates back to normal size, and Creeper resumes stalking.
  - If the fuse completes ($0.83\text{s}$ / 50 frames), Creeper unleashes a massive $135\text{px}$ 360° explosion with heavy directional impulse ($18\text{px/f}$ knockback), screen shake, and dirty gray Minecraft smoke clouds.
  - Deals $95$ damage to enemies caught in the blast and costs Creeper $65\text{ HP}$ in recoil vitality.

### 3. Ultimate: Charged Creeper (Lightning Strike Awakening)
- **Initial Cooldown**: `18.0s` (`1080 frames`) | **Cooldown**: `30.0s` (`1800 frames`)
- **Execution**:
  - Creeper raises its head as dark storm clouds gather; a celestial bolt of blue lightning (`thunderstrike.mp3`) blasts directly into its crown!
  - Creeper awakens into **Charged Creeper** for **20 seconds**:
    - Enveloped in the iconic rotating cyan electric plasma matrix (`#38BDF8`).
    - Movement speed increased by $+28\%$.
    - Proximity explosion radius increases to a colossal $250\text{px}$ with supersonic Mach rings (Rule 26) and $235$ damage!
    - Enemies within touching proximity take continuous electric arc shock damage.

---

## 🔊 Audio & Sound FX Integration
1. **Fuse Hiss**: Authentic Minecraft `"Tssssssss...!"` fuse sound on proximity contact (`Assets/Sound Effects/CreeperSFX/Creeper_fuse.ogg`).
2. **Explosion Blasts**: Authentic Minecraft explosion variations (`Assets/Sound Effects/CreeperSFX/Explosion1..4.ogg`).
3. **Hurt Grunts**: Authentic Minecraft Creeper damage grunts on hit (`Assets/Sound Effects/CreeperSFX/Creeper_hurt1..4.ogg`).
4. **Death Hiss / Collapse**: Authentic Minecraft Creeper death sound on match defeat (`Assets/Sound Effects/CreeperSFX/Creeper_death.ogg`), with announcer faah suppression.
5. **Lightning Strike**: Dramatic celestial thunderbolt (`thunderstrike.mp3`) on Charged Creeper Ultimate awakening.

---

## 📋 File Architecture & Scaffolding Checklist
- [x] `js/configs/characters/creeperConfig.js` — Base stats, proximity fuse timings, damage, radii, toggles.
- [x] `js/entities/fighters/CreeperFighter.js` — Class definition extending `Fighter`, SkillManager registration, proximity fuse & defuse state machine, Charged Creeper state machine.
- [x] `js/graphics/fighters/creeperSkin.js` — Upright Minecraft camo pixel body, frowning face, 4 stubby feet, Layer 1.5 black outline, dynamic swelling & accelerating white flash, Charged electric matrix.
- [x] `js/graphics/ui/hudSkillProviders.js` — Rule 18 unified theme color HUD skill bars (`creeper`: Silent Stalker, Detonation/Fuse, Charged Creeper).
- [x] `js/core/config.js` & `js/core/modeConfig.js` — Registration in `FIGHTER_DEFS`, default selection, and character index.
- [x] `scripts/testInteractions.mjs` — Test 104 covering Creeper mechanics (proximity fuse, defuse/abort on range, detonation, Charged Creeper ultimate, Canvas stack depth).
