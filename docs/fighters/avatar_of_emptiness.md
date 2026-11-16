# Avatar of Emptiness (Terraria: Wrath of the Gods) — Fighter Guide

**Identity & Archetype:** Zoner / Dimension-Shifting Void Sovereign / Crowd Control Stasis  
**Category:** Gaming  
**Theme Color:** `#9D4EDD` (Abyssal Void Amethyst)  
**Secondary Color:** `#00F5D4` (Cryonic Rift Cyan)  
**Accent Colors:** `#FF0055` (Visceral Blood Red), `#06070B` (Obsidian Antishadow), `#FFFFFF` (Singularity White)  
**Iconic Weapon:** **Void Portal Claws & Rift Singularity** (Dimensional Rifts & Spatial Tears)  

---

## 🌌 Lore & Overview

The **Avatar of Emptiness** is the incomprehensible entity and final apocalyptic manifestation originating from *Terraria: Wrath of the Gods* (NoxusBoss). Emerging from a colossal planar rift in spacetime, the Avatar commands the total fabric of reality across three distinct parallel dimensions:

1. **The Dark Universe:** Antimatter waves, antishadow tendrils, and void blots.
2. **The Cryonic Universe:** Absolute zero outbursts, freezing shockwaves, and falling frost columns.
3. **The Visceral Universe:** Blood torrents, violent whirlpool surges, and molten gravity slams.

In the Ramball Fight Simulator arena, the Avatar of Emptiness is an oppressive, dimension-controlling powerhouse. It manipulates gravitational fields, summons portal strikes from beyond the arena boundaries, commands shifting elemental universe attacks, and channels the cataclysmic **"Universal Annihilation"** reality shatter.

---

## 📊 Baseline Stats & Attributes

| Stat | Value | Description |
| :--- | :--- | :--- |
| **HP** | `460` | Massive void health pool fortified by dimensional distortion |
| **Move Speed** | `4.7` | Gliding ethereal hover with spatial warp micro-teleports |
| **Body Radius** | `29px` (`drawR: 42px`) | Imposing antishadow silhouette with radiating rift tendrils |
| **Base Damage** | `17` | Baseline antimatter dart and void needle damage |
| **Base Cooldown** | `34 frames` | Swift dark energy pulsation reload rate |
| **Aiming Mode** | `360° Continuous` | Precision omnidirectional targeting for portals and rift beams |
| **Knockback Resist** | `85%` | Immense mass anchored across multiple dimensions |

---

## 🌑 Core Mechanics & Passive Characteristics

- **Antishadow Void Halo & Tendrils:** Dynamic shadowy tendrils and an orbiting violet-cyan event horizon perpetually writhe behind the Avatar's body, periodically releasing drifting void embers.
- **Dimensional Phase Shift (Passive Matrix):** Shifting between cosmic realms empowers the Avatar's attacks with alternating secondary effects:
  - *Cryonic Shift:* Inflicts brief movement chill on targets.
  - *Visceral Shift:* Boosts knockback and triggers secondary blood spurts.
  - *Dark Shift:* Adds homing antimatter micro-projectiles.
- **Ethereal Void Claws (Rule 20):** Symmetrical shadowy claw palms hover at the lower flanks (`x: ±r * 0.82, y: +r * 0.38`), anchoring planar rifts and tearing spacetime.
- **Committed 360° Cast Lock (Rule 1.4):** When channeling *Universal Annihilation* or opening *Arm Portal Strikes*, the Avatar clamps its facing angle and disables auto-aim drift while applying reverse recoil.

---

## ⚔️ Combat Arsenal & Skill Matrix

### 🌑 Basic Attack: Antimatter Void Blasts
- **Type:** 3-Way Dark Energy Blast Spread
- **Damage:** `15` per blast (`3` blasts total = `45` burst)
- **Speed:** `11.0`
- **Homing Strength:** `0.065` steering curvature
- **Visuals:** Obsidian black spheres enveloped in pulsing violet coronas and cyan chromatic fringes that track enemies and implode upon contact.

---

### ❄️ Skill 1: Cryonic Absolute Zero (Frost Columns & Freeze Wave)
- **Type:** Radial Frost Outburst & Area Freeze
- **Cooldown:** `360 frames` (~6.0 seconds)
- **Duration:** `150 frames` (2.5 seconds)
- **Radius:** `130px` cryogenic frost pulse
- **Damage:** `30`
- **Effect:** Erupts a freezing shockwave outward from the Avatar's core, halting approaching enemies with high deceleration and spawning 3 falling crystalline frost columns along the enemy's trajectory.

---

### 🩸 Skill 2: Visceral Blood Torrent (Gravitational Whirlpool)
- **Type:** Directional Pressure Wave & Pull Vortex
- **Cooldown:** `390 frames` (~6.5 seconds)
- **Reach:** `155px` frontal reach
- **Arc Angle:** `~160°`
- **Damage:** `38`
- **Knockback:** `13.0` inward-to-outward whip impulse
- **Effect:** Summons a roaring visceral blood torrent across a wide frontal cone, sweeping enemy fighters into a localized vortex before blasting them backward with screen-shaking kinetic force.

---

### 🌌 Skill 3: Dark Dimension Portal Strikes (Arm Jut Out)
- **Type:** Spatial Teleport Ambush / Multi-Portal Claw Strike
- **Cooldown:** `480 frames` (~8.0 seconds)
- **Range:** `260px` targeting range
- **Strikes:** `4` successive portal tears
- **Damage:** `12` per portal claw (`48` total)
- **Effect:** Tears open 4 dark dimensional rifts around the target's position in rapid sequence. Giant shadowy arms jut out from each portal, crushing the target from multiple angles.

---

### 💥 Ultimate: Universal Annihilation (Apocalyptic Reality Shatter)
- **Type:** Full-Screen Dimensional Implosion & Beam Burst
- **Cooldown:** `880 frames` (~14.6 seconds)
- **Total Damage:** `150` distributed across rapid tearing ticks
- **Beam / Shatter Width:** `52px` core collision width
- **Execution Phases:**
  1. **Convergence (`50 frames`):** The arena darkens as spacetime distorts inward into a central black singularity; the Avatar hovers with spread claws.
  2. **Active Reality Shatter (`95 frames`):** Uncages a colossal prismatic violet and cyan antimatter death-beam tearing through the screen with continuous `4-frame` damage ticks, heavy screen shake (`7.0`), and severe physical recoil.
  3. **Supernova Collapse (`30 frames`):** The beam finishes with a blinding white-out explosion and dimensional glass shatter sound, dispersing starlight particles across the arena.

---

## 🎨 Aesthetic & Engine Standards Compliance

- **Rule 18 (Unified HUD Theme & Signature Registration):** All HUD skill bars strictly use the character `themeColor` (`#9D4EDD`) gated by `isSkillEnabled` toggles, with `Universal Annihilation` registered in `signatureMap`.
- **Rule 11 & Rule 35 (Pre-Baked Offscreen Core & Radial Glows, Zero `shadowBlur`):** Discrete $P = 2.0\text{px}$ obsidian core baked once into `_coreCanvasCache`, ambient auras/flares blitted from `glowSpriteCache`, zero per-frame `createRadialGradient` or `shadowBlur` calls.
- **Rule 15 & Rule 26 (Tapered Crescents & Sequential Shockwaves):** Visceral Blood Torrent uses double-tapered crescent arcs; Cryonic Zero, Phase 2 Awakening, and Annihilation Collapse use sequential water-ripple wavefronts with zero radial spoke cobwebbing.
- **Rule 21 & Rule 24 (Overhead HP/Freeze & Stack Integrity):** `draw()` explicitly invokes `this.drawHealth(ctx)` and `this.drawFreezeTimer(ctx)` with strictly balanced `ctx.save()` / `ctx.restore()` transform depths (`0`).
- **Rule 1.1 & Rule 25 (Freeze Guard & Non-Freezing VFX Decay):** `_updateVisualDecay()` runs before the `_handleTimeStop()` freeze exit so active shockwaves, Void Blots, Cryonic zones, and Dark Portals decay cleanly even when immobilized.
