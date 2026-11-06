# Ender Dragon — Ruler of The End

**Category:** Boss / Monster / Minecraft  
**Identifier:** `ender_dragon`  
**Color Theme:** Obsidian Charcoal (`#18181B`) / Void Magenta (`#C026D3`) / Acid Breath Purple (`#A21CAF`) / End Light White (`#F5D0FE`)  
**Role:** Flying Void Boss, Aerial Kinematics Rushdown, Lingering Acid Zoning  

---

## Lore / Background

*"The End is Near..."*

Dwelling at the apex of the desolate End dimension, the Ender Dragon is the sovereign titanic draconic leviathan born from ancient void energy and bedrock magic. Encased in midnight obsidian scales with glowing amethyst eyes, she commands the airspace with colossal flapping wings capable of batting opponents across the void. From her jaws spews lethal purple Dragon's Breath—an acidic vapor that coats the battlefield in lingering hazardous residue. When threatened, the dragon ascends to the center perch, channeling dark void lightning and unleashing expansive cataclysmic shockwaves that warp the fabric of reality.

---

## Visual Design & Asset Mapping

The Ender Dragon employs the authentic Circle Mini-Battle upright minimalist circle fighter standard combined with high-frame draconic wings animation:

```
               [ ANIMATED WINGS LAYER ]                  [ OBSIDIAN CIRCLE BODY ]
          (Dragon-wings-sprite-sheet.png)               (Upright Faceless Minimalist)
                   ╭────────────╮                              ╭────────────╮
                ╭──│  /\    /\  │──╮                        ╭──│  /\    /\  │──╮
              <<===│ (  WINGS ) │===>>                    <<===│ ( VOID CORE ) │===>>
                ╰──│   \____/   │──╯                        ╰──│   \____/   │──╯
                   ╰────────────╯                              ╰────────────╯
             Assets/model/Sprites/Dragon-wings-*            Upright Obsidian & Amethyst
```

### Visual Assets & Layering Architecture
- **Animated Dragon Wings Sheet (`Assets/model/Sprites/Dragon-wings-sprite-sheet.png`)**:
  - Image Dimensions: `1536 x 1024 px` containing a **6-frame 2x3 animation grid** (`512 x 512 px` per cell).
  - Clean alpha transparency with an open center matching the circle fighter body.
  - Flaps continuously behind the circle body in 6 fluid animation phases:
    - **Frame 0 [R0C0]**: Peak upstroke.
    - **Frame 1 [R0C1]**: Mid downstroke.
    - **Frame 2 [R0C2]**: Full downstroke bottom.
    - **Frame 3 [R1C0]**: Bottom rising.
    - **Frame 4 [R1C1]**: Mid upstroke.
    - **Frame 5 [R1C2]**: Cresting upstroke.
- **Upright Minimalist Circle Body (Radius $r = 36\text{px}$)**:
  - **Swept-Back Twin Dragon Horns**: Obsidian draconic horns extending at the crown ($-Y$) with glowing amethyst tips (`#D946EF`, `#F5D0FE`).
  - **Metallic Silver Dorsal Spine Ridges**: Stepped central spine plates (`#A1A1AA`, `#E4E4E7`).
  - **Faceless Minimalist Amethyst Brow Visor**: Radiant purple eye slits (`#D946EF`, `#F5D0FE`) adhering strictly to Rule 19 (no pupils, sclera, or mouth).
  - **Ender Heart Crystal Core**: Pulsating void crystal core on the lower chest ($+Y$).
  - **Layering Order**: Back Hand Claws $\to$ Animated Wings Sheet $\to$ Obsidian Circle Body $\to$ Front Hand Guard $\to$ Status Overlays.
- **Disintegration Death Sequences (`Assets/model/Sprites/Ender-dragon-Disintegration-Sequence.png` & `Sequence2.png`)**:
  - Image Dimensions: `1536 x 1024 px` each (2x3 grid, 6 frames each).
  - Authentic Minecraft death animation: The dragon halts in mid-air, ascends, and emits piercing shafts of purple/white radiant light through its torso and wings before exploding into void soul particles.

---

## Baseline Stats

| Attribute | Fighter Mode (1v1 / Standard) | Boss Mode (Raid Boss) | Notes |
|---|---|---|---|
| **Health (HP)** | 520 HP | 1,200 HP | High durability draconic health pool |
| **Movement Speed** | 4.4 px/frame | 5.2 px/frame | Smooth aerial acceleration with inertia |
| **Collision Radius ($r$)** | 36 px | 48 px | Scaled up for Boss Mode encounter |
| **Knockback Resistance** | 100% Poise Immunity | 100% Poise Immunity | Immune to normal flinch and bullet knockback |
| **Terrain Navigation** | Intangible (`isGhostTerrain`) | Intangible (`isGhostTerrain`) | Flies effortlessly through walls and arena obstacles |
| **Attack Archetype** | Aerial Rushdown & Acid Zoning | Aerial Raid Boss | High kinetic displacement and lingering hazards |

---

## Combat Mechanics & Abilities

### Passive: Void Levitation & Unyielding Poise
- **Terrain Intangibility**:
  - As a flying draconic leviathan, the Ender Dragon completely ignores all solid blocks, obstacles, and interior arena walls (`this.isGhostTerrain = true`), drifting and swooping freely across all arenas.
- **Unyielding Boss Poise**:
  - 100% immune to being flinched, stunned, or pushed back by standard bullet strikes, explosions, and melee combos (`knockbackVx = 0, knockbackVy = 0`).
  - **Vulnerability Exception**: Remains susceptible to gravitational black holes and continuous suction beams (e.g. Gojo's *Hollow Purple* / *Lapse Blue*, Escanor's *Cruel Sun*, Yuta's *Pure Love Beam*).
- **Unified Dynamic Flight**:
  - Employs a dedicated 6-frame flapping animation cycle using `Assets/model/Sprites/Ender-dragon-model-sprite-sheet.png` for all movement in any direction.
  - Dynamically flips horizontally with `ctx.scale(-1, 1)` when facing/moving left and applies subtle clamped banking tilt ($\pm 12^\circ$), guaranteeing the dragon is never rendered upside down.

---

### Passive: 4 Corner End Crystals (Bedrock Pedestals, Healing Tether & Backlash Damage)
- **4 Arena Corner Spawns**:
  - In non-boss fighter matches (1v1, 2v2, Tag Match, FFA), when the Ender Dragon enters the battlefield, exactly **4 End Crystals** (`EndCrystalEntity`) spawn in the 4 corners of the arena (top-left, top-right, bottom-left, bottom-right with calibrated wall clearance; diagonal perimeters for circular arenas).
- **60-Frame 3D Minecraft End Crystal Animation (`Assets/model/enderDragon/end_crystal/`)**:
  - Model rendering uses a dedicated 60-frame animation sequence (`end_crystal-1.png` through `end_crystal-60.png`) and master 10×6 spritesheet (`end_crystal-b.png`, $2560 \times 1536\text{px}$) extracted from the canonical 3D Minecraft End Crystal model.
  - Features prominent scaling (`crystalDrawSize: 140px`, ~61×94px visible beacon footprint) and a calm, majestic rotation cadence (`crystalAnimTicks: 3`, ~3.0s per full 360° rotation) across 60 discrete angles showcasing the rotating outer glass protective cages, inner tumbling magenta rune cube, and native 3D bedrock plate with burning fire.
  - Ground contact shadow ellipse provides clean floor anchoring without intrusive flat procedural boxes.
  - Crystals remain completely stationary on their pedestals, ignoring knockback, velocity changes, and circle-circle pushback.
- **Authentic Minecraft End Crystal Beam (`end_crystal_beam.png`) (`crystalTetherReach = 340px`)**:
  - Whenever the Ender Dragon flies within reach of an End Crystal (`340px`), the crystal projects the 100% authentic vanilla Minecraft End Crystal beam: a rigid, straight energy conduit featuring the authentic `end_crystal_beam.png` black-and-white pixel noise static texture streaming from the crystal core directly to the dragon.
  - Employs dual-layer cylindrical 3D rotation parallax (an 18px outer beam scrolling at 3.2 px/frame and a 12px inner core scrolling at 5.0 px/frame with a 64px phase offset), crisp dark pixel boundaries, and an ambient translucent void amethyst corona wash.
  - Origin anchors directly into the center of the spinning magenta rune cube (`crystal.y - 63px`).
  - While tethered, each active crystal restores `+6 HP` every 45 frames (~0.75s) (`crystalHealAmount: 6`, `crystalHealInterval: 45`), pulsing the top HUD health card via `this._healthBarHealTimer = 16`. Multiple crystals within range tether and heal cumulatively.
- **Crystal Destruction & Backlash Detonation (`crystalBacklashDamage = 60 HP`)**:
  - Opponents can target and destroy the crystals (`60 HP`).
  - When destroyed, the crystal detonates with a violent radial void explosion, inflicting **60 BACKLASH damage** directly to the Ender Dragon, triggering camera shake, an enrage reaction, and an infuriated draconic roar.
- **Seamless Game Flow & HUD Isolation**:
  - Crystals declare `isEndCrystal: true`, ensuring they are excluded from match win/draw determinations, camera bounding boxes, and HUD fighter health cards.

---

### Skill 1: Dragon's Breath (360° Void Acid Sweep) (`dragonsBreath`)
- **Cooldown**: 480 frames (~8.0s)
- **Mechanics**:
  - **Movement Halt & Anchoring**: When activating the skill, the Ender Dragon immediately stops all movement (`vx = 0, vy = 0`) and locks firmly in place, immune to flinch, pull, and knockback throughout the channel.
  - **360° Sweeping Breath Rotation**: Over a 72-frame (~1.2s) duration, the Ender Dragon smoothly sweeps its aim in a full 360-degree rotation ($2\pi$ radians) surrounding itself completely.
  - **Continuous Breath Stream & Lingering Acid Ring**: Every 2 frames as it rotates, the dragon's snout discharges expanding Minecraft Dragon's Breath stream puffs traveling outward (`8.0 px/frame`, 190px reach) dealing 12 contact damage. Upon impact or max distance, each stream deploys lingering Minecraft Area Effect Clouds (65px radius, 180 frames duration, 6 damage per 15-frame tick with 25% slow), forming an imposing 360° protective ring of void acid around the dragon.
  - **Post-Breath Settle & Recovery Frames**: Once the 360° rotation completes, active breath stream discharge ends (`isBreathingFire = false`) and the Ender Dragon pauses for 24 recovery frames (~0.4s) settling its maw with cooling void embers while remaining completely stationary (`vx = 0, vy = 0`).
  - **Resume Movement**: Once the recovery frames conclude, the Ender Dragon resumes active flight patrol, launching forward in its facing direction with thrust velocity, wing flap audio, and wind gust sparks.

---

### Skill 2: Wing Buffet / Kinetic Swoop (`wingBuffet`)
- **Cooldown**: 540 frames (~9.0s)
- **Mechanics**:
  - The Ender Dragon violently beats her wings, generating a sonic shockwave, and accelerates into a ferocious high-velocity swoop dash (`18.5 px/frame` for 18 frames).
  - Opponents caught in the dragon's frontal collision arc (120° arc, 80px reach) take 38 kinetic damage and are launched with massive knockback impulse (`20.0 px/frame`).
  - Provides brief super-armor during the flight rush.

---

### Skill 3 / Ultimate: Void Cataclysm & Perch (`voidCataclysm`)
- **Cooldown**: 1,100 frames (~18.3s)
- **Mechanics**:
  - The Ender Dragon halts in mid-air, ascending slightly into a perching stance for a 70-frame channeling window.
  - Purple void lightning arcs across her obsidian wings while ambient floor light darkens.
  - **The Roar**: At frame 40, she emits the legendary Ender Dragon roar, triggering a 12px camera trauma screen shake.
  - **Void Burst**: Releases an expansive 360° radial shockwave (220px radius) dealing 65 damage and launching all nearby enemies away.
  - Simultaneously discharges 6 homing void fireballs in an outward spiral that curve toward surviving opponents.

---

### Skill 4: Off-Screen Telegraphed Divebomb Strafe (`divebombStrafe`)
- **Cooldown**: 600 frames (~10.0s)
- **Mechanics**:
  - The Ender Dragon disengages and accelerates beyond the arena perimeter into the outer void airspace.
  - **Telegraph Corridor Carpet**: Projects an ominous red danger corridor warning across the arena floor pointing along committed dive direction (55 frames / ~0.91s telegraph; width defined by `divebombCorridorWidth: 70`).
  - **Supersonic Divebomb**: At frame 0, launches forward at hyper-velocity (`24.5 px/frame`), trailing amethyst afterimages and lingering acid pools along the strike corridor.
  - **Hitbox Based on Corridor Width**: Physical collision width is governed directly by `divebombCorridorWidth: 70` (with half-width `divebombHitboxRadius: 35`). Sidestepping opponents outside this corridor cleanly evade the strike. Entities directly within the flight corridor are impacted with 45 kinetic damage, screen shake, and purple sparks, smoothly pushed forward without positional snapping.
  - **Slow Debuff**: Enemies struck by the divebomb suffer a heavy **1.5s slow debuff** (`divebombSlowDuration: 90`, `divebombSlowMultiplier: 0.40`), reducing their movement speed by 60% with visual `SLOWED!` amethyst feedback.
  - **Wall Slam Detonation**: If a victim is driven into the arena perimeter wall, the dragon detonates a massive Wall Slam shockwave dealing full impact damage, rebounding the enemy safely inward into the arena without clipping out of bounds.
  - **Chained 360° Dragon's Breath Finisher (`enableDivebombBreathCombo`)**: Upon completing the strafe and banking back toward the impact zone, the Ender Dragon immediately anchors itself at the wall-slammed enemy and executes the **360° Dragon's Breath Void Acid Sweep**, trapping the slowed victims in a circular ring of lingering acid clouds before catching its breath and resuming patrol flight.

---

## Special Fighter Interactions & Lore Counters

| Opponent | Interaction Behavior |
|---|---|
| **Satoru Gojo** | The Dragon's physical swoops and fireballs halt upon contact with **Limitless Infinity**. However, the lingering Dragon Breath acid cloud bypasses standard collision by damaging entities standing within the ambient vapor volume! |
| **Lord Escanor** | When the dragon swoops into Escanor during **Solar Poise**, Escanor remains rooted while the dragon's kinetic force deflects off his golden frame. |
| **Toji Fushiguro** | **Inverted Spear of Heaven (ISOH)** slices through Dragon Fireballs, nullifying the projectile before it can deploy its lingering acid cloud. |
| **Ryomen Sukuna** | Sukuna's **Dismantle** slices through the dragon's massive hitbox; during *Malevolent Shrine*, the dragon's flight speed is slightly slowed by the unrelenting rain of slashes. |
| **Zenitsu Agatsuma** | **Thunderclap and Flash** can pierce through the dragon mid-swoop, triggering an electric clash impact. |

---

## Audio & SFX Configuration

All sound effects, audio paths, and playback volumes are strictly configured in [`enderDragonConfig.js`](file:///c:/Users/asus/OneDrive/Desktop/Circle%20Mini-Battle/js/configs/characters/enderDragonConfig.js):

| Key | File Path | Default Vol | Usage / Event |
|---|---|---|---|
| `fireball` | `Assets/Sound Effects/EnderdragonSFX/Ghast_fireball4.ogg` | `0.85` | Authentic Dragon Fireball launch |
| `fireballImpact` | `Assets/Sound Effects/EnderdragonSFX/Explosion1.ogg` | `0.90` | Fireball detonation & acid pool deployment |
| `wingFlap` | `Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap2.ogg` | `0.70` | Wing flap acoustic sweep (primary) |
| `wingFlap2` | `Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap5.ogg` | `0.70` | Wing flap acoustic sweep (alternate) |
| `swoop` | `Assets/Sound Effects/EnderdragonSFX/Ender_dragon_flap5.ogg` | `0.90` | Wing Buffet high-speed rushdown |
| `swoopHit` | `Assets/Sound Effects/EnderdragonSFX/Explosion3.ogg` | `0.95` | Heavy kinetic collision on opponent |
| `acidTick` | `Assets/Sound Effects/Attacks/fleshhit.mp3` | `0.50` | Lingering Dragon Breath acid tick |
| `cataclysmCharge` | `Assets/Sound Effects/EnderdragonSFX/Explosion2.ogg` | `0.85` | Void Cataclysm charging arc |
| `disintegration` | `Assets/Sound Effects/EnderdragonSFX/Ender_dragon_death.ogg` | `1.00` | Defeat sequence void beam explosion |
| `death` | `Assets/Sound Effects/EnderdragonSFX/Ender_dragon_death.ogg` | `1.00` | Authentic Minecraft Ender Dragon death screech |
| `hurt1..4` | `Assets/Sound Effects/EnderdragonSFX/Ender_dragon_hurt1..4.ogg` | `0.85` | Authentic Minecraft dragon hurt grunts |
| `explosion1..4` | `Assets/Sound Effects/EnderdragonSFX/Explosion1..4.ogg` | `0.90` | Authentic Minecraft explosion blast variations |
| `xpPickup` | `Assets/Sound Effects/EnderdragonSFX/Successful_hit.ogg` | `0.90` | Authentic Minecraft experience orb pickup chime |

---

## Technical & Architecture Standards

1. **Config-Driven Architecture**: All stats, timers, reach limits, cooldowns, sound paths, and volumes derive from `js/configs/characters/enderDragonConfig.js` and `js/configs/bosses/enderDragonBossConfig.js`.
2. **Transform Stack Integrity**: All PNG rendering in `js/graphics/fighters/enderDragonSkin.js` strictly encapsulates `ctx.save()` and `ctx.restore()` ensuring canvas stack depth is strictly 0.
3. **Zero `shadowBlur`**: Void amethyst energy fields and acid vapors are rendered using layered semi-transparent concentric arcs and gradient meshes.
4. **Committed 360° Aim**: Dragon's Breath and Wing Buffet commit to target angle upon initiation and disable tracking during execution.
