# Isagi Yoichi — The Egoist Striker (Blue Lock)

**Category:** Anime & Sports Icons (*Blue Lock* by Muneyuki Kaneshiro & Yusuke Nomura)  
**Character ID:** `isagi`  
**Fighter Grade:** `A`  
**Title:** `Heart of Blue Lock`  
**Boss Title:** `The Egoist Striker`  
**Theme Color:** Electric Ego Cyan (`#00F0FF`)  
**Secondary Accents:** Athletic Navy Bodysuit (`#242E42` / `#111827`), Metavision Flow Green (`#00FF88` / `#22C55E`), Clean White Jersey Trim (`#FFFFFF`), Manga Ink Outline (`#0E0F14`)  
**Role:** Spatial Tactician, Kinetic Ricochet Specialist, Bank Shot Sniper & Hypersonic Volley Finisher  

---

## 📖 Lore & Character Philosophy

> *"I will devour you. To win, I'll become the monster that destroys your reality!"*

Yoichi Isagi (潔 世一) entered the ruthless **Blue Lock** project as an unranked, self-sacrificing high school forward burdened by regret. In the Saitama prefectural finals, he passed the ball to an open teammate instead of shooting, resulting in a missed shot that destroyed his team's dream of reaching Nationals. That failure forged an obsession within him: to awaken his dormant **Ego** and transform from a passive team player into the world's most ruthlessly decisive striker.

Under the radical tutelage of Jinpachi Ego, Isagi discovered his true genius: **Spatial Awareness (*空間認識能力*)**. While other forwards rely on raw physical speed, freakish stature, or dribbling flair, Isagi perceives the soccer pitch not as random chaos, but as an interlocking, dynamic **jigsaw puzzle**. Every opponent's line of sight, physical blind spot, momentum vector, and psychological state are puzzle pieces waiting to be assembled into the sole equation that results in a goal.

Upon evolving into **Metavision (*超越視界 - メタ・ビジョン*)**, Isagi continuously gathers visual input across his peripheral vision, mentally mapping every entity on the pitch in real time to predict their next actions seconds before they unfold. 

In the *Circle Mini-Battle* arena, Isagi brings Blue Lock's authentic kinetic soccer mechanics into fast-paced 60 FPS combat. Operating under a strict **Single Persistent Soccer Ball Standard**, Isagi does not fire generic bullets or magic blasts; he shares the arena with a single, high-fidelity 3D soccer ball. Moving 100% naturally via standard circle fighter physics, Isagi waits for the ball and his body to naturally converge—intercepting loose balls with **Metavision Slip**, executing lightning-fast **One-Two Wall Bank Passes**, and burying opponents into the arena walls with his signature, un-trapped finishing strike: the **Direct Volley**!

---

## 🎨 Visual Design & Rendering Standards

```
                      ┌─────────────────────────────────┐
                      │    ISAGI YOICHI BODY ZONING     │
                      └────────────────┬────────────────┘
                                       │
     ry < r * 0.28   ┌─────────────────┴─────────────────┐  Clean Fair Skin Dome
                     │ Zone 1: Pure Face & Cheeks Dome   │  (#FFF0DE / #E8BD9B)
                     └─────────────────┬─────────────────┘  Metavision Puzzle Eyes
                                       │
 r*0.28 <= ry < r*0.68 ┌───────────────┴─────────────────┐  High Collar (#141720)
                     │ Zone 2: Blue Lock #11 Jersey Suit │  Cyan Piping (#00F0FF)
                     └─────────────────┬─────────────────┘  White #11 Motif (#FFFFFF)
                                       │
 r*0.68 <= ry < r*0.78 ┌───────────────┴─────────────────┐  Athletic Waistband (#182030)
                     │ Zone 3: Waistband & Center Clip   │  Cyan Center Buckle (#00F0FF)
                     └─────────────────┬─────────────────┘
                                       │
     ry >= r * 0.78  ┌─────────────────┴─────────────────┐  Dark Slate Shorts (#28354A)
                     │ Zone 4: Athletic Compression Shorts│ Fly Seam & Cyan Trim (#00F0FF)
                     └───────────────────────────────────┘
```

### 1. Upright Fighter Body Model (Rule 19 Front POV Standard & Rule 24 Toji Baseline)
Isagi's fighter model, facial silhouette, jersey layers, and proportion zoning adhere strictly to the repository Toji baseline standard (`r = 25`):
- **Zone 1: Pure Face & Cheeks Dome (`ry < r * 0.28`)**:
  - Clean fair anime skin tone base (`#FFF0DE`) with subtle side cheek shadow contouring (`#E8BD9B`).
  - Zero baked-in facial expressions or baked hair in the procedural body circle.
  - Sits cleanly beneath the Layer 2 hair overlay.
- **Zone 2: Blue Lock Jersey & Athletic Bodysuit (`r * 0.28 <= ry < r * 0.68`)**:
  - **High Collar Rim (`#141720`)**: A sleek high-neck collar rim enclosing the throat at `ry < r * 0.34`.
  - **Electric Cyan Piping Stripes (`#00F0FF`)**: Dual vertical neon cyan accent stripes framing both shoulders and torso flanks from `-r * 0.78` to `-r * 0.62` and `+r * 0.62` to `+r * 0.78`.
  - **The Iconic "#11" Jersey Motif Plate**: Symmetrical crisp white jersey digit bars (`#FFFFFF`) cleanly centered across the chest plate at `ry = r * 0.44` to `r * 0.58`.
  - **Navy Compression Bodysuit Fabric (`#242E42`)**: Rich athletic dark navy suit maintaining strict luminance separation ($Y \ge 24$) against the `#0E0F14` outer ink border, guaranteeing a crisp 1-pixel boundary.
- **Zone 3: Waistband & Center Clip (`r * 0.68 <= ry < r * 0.78`)**:
  - Dark athletic compression waistband (`#182030`) fitted with a luminous electric cyan center waist buckle clip (`#00F0FF`).
- **Zone 4: Athletic Shorts (`ry >= r * 0.78`)**:
  - Dark slate athletic shorts (`#28354A`, $Y \ge 24$) with a solid `#0E0F14` center fly seam and electric cyan outer trim piping (`#00F0FF`).
- **Outer Manga Ink Outline Shell (Rule 24 & Rule 32)**:
  - Exact 4-neighbor boundary test filled with solid dark manga ink outline (`#0E0F14`).
  - Axis-aligned offscreen canvas buffer caching (`_cachedIsagiBodyCanvas`) at $P = 2.0\text{px}$ discrete pixel resolution, blitting via `ctx.drawImage` with `imageSmoothingEnabled = false`.

### 2. Hair Asset & Head Silhouette (Rule 22 & Rule 24 Standard)
- **Asset Path**: `Assets/model/isagi/isagi-hair.png`.
- **Eager Loader & Cache**: Managed by `_getIsagiHairImage()` with proactive module-level initialization.
- **Bounding Box Calibration**: Calibrated from the true visible pixel art bounding box ($809 \times 748\text{px}$ on $1024 \times 1024$ canvas).
- **Volume & Placement**:
  - Width: $r \times 3.05$ (~$76\text{px}$).
  - Height: $r \times 2.25$ (~$56\text{px}$).
  - Crown Apex Anchor: `drawY = -r * 1.35`, framing the upper head circle seamlessly with full anime volume matching Toji and Gojo standards.
- **Skin Studio Customization**: Full support for real-time scale, offsets, rotation, and flipping via `state.skinCustomizations.isagi`.

### 3. Canonical Default Hands (Rule 20 Standard)
- Both fists are rendered symmetrically at the lower-left and lower-right flanks of the central body circle in local coordinate space:
  - **Left Hand**: `(x: -r * 0.82, y: +r * 0.38)` with `handRadius = getHandSize(r * 0.30)`.
  - **Right Hand**: `(x: +r * 0.82, y: +r * 0.38)` with `handRadius = getHandSize(r * 0.30)`.
- Rendered on the **front layer** using `drawPixelHand` with `#FFF0DE` skin fill and `#0E0F14` outer stroke.
- **Single Source of Truth Hand Guarantee**: Zero floating, disconnected, or duplicate hands are ever instantiated.

### 4. Metavision Puzzle Eyes & Flow State Glint
- When **Flow State** or **Direct Volley** is engaged, Isagi's pupils ignite with radiant circular puzzle-eye reflections:
  - Cyan core (`#00F0FF`) during standard Flow State; Emerald Green core (`#00FF88`) during Direct Volley.
  - Symmetrical pupil anchors at `y = -r * 0.05` and `x = ±r * 0.32`.
  - Soft concentric outer glow discs (`rgba(0, 240, 255, 0.30)`) drawn with zero `ctx.shadowBlur` (Rule 11 compliant).

### 5. Metavision Ghost Afterimages
- During the tactical dash of **Metavision Slip**, Isagi leaves behind translucent ghost afterimages (`drawIsagiGhostSkin`):
  - Retain 100% upright silhouette, hair, and jersey piping.
  - Fade progressively from $\alpha = 0.55 \to 0$ over $12\text{ frames}$, visually communicating hypersonic spatial repositioning.

### 6. 16-Bit 3D Telstar Soccer Ball Rasterizer
- True 3D truncated icosahedron unit-sphere model:
  - **12 Black Pentagons**: Rendered with `#0F1116` / `#090E1A` leather and 3D half-space normal bounds.
  - **20 White Hexagons**: Rendered with `#FFFFFF` / `#E2E8F0` leather shading based on top-left lighting vectors.
  - **90 Bresenham Seam Stitching Edges**: Discrete 1-pixel seam lines connecting all pentagonal and hexagonal leather patches.
- **Full 3-Axis Spherical Rolling**: Pitch, yaw, and roll matrices update continuously via `stepSoccerBall3DRotation`, accurately rolling the ball across the arena floor according to velocity.

### 7. 12-Frame Kick Impact Sprite & Stepped 16-Bit Enemy Hit Bursts (Rule 25 & Rule 31)
- **Kick Impact Animation**: Dedicated 12-frame sprite animation loaded from `Assets/model/isagi/kick_impact/kick_impact-b.png`. Displays dynamic muzzle/kick flashes upon striking the ball.
- **Stepped 16-Bit Enemy Hit Burst**: When the soccer ball collides with an enemy target, spawns a 3-phase retro arcade impact:
  1. Stepped starburst flash ($p < 0.5$) with black manga ink borders.
  2. Expanding 16-bit stepped pixel shock diamond ($p: 0.1 \to 0.85$).
  3. Discrete square pixel spark debris with drop shadows.

### 8. Clean Concentric Shockwaves (Rule 26 Compliant)
- Direct Volley releases a clean expanding concentric shockwave ring (`maxR = 90px`).
- Smooth, continuous circular wave disc with zero radial connecting spokes, starburst needles, or cobweb patterns.

---

## 🛡️ Baseline Stats

| Attribute | Base Value | Flow State Value | Notes |
| :--- | :--- | :--- | :--- |
| **HP** | `420` | `420` | Resilient, athletic tournament forward |
| **Base Speed** | `5.2` | `5.2` | Agile pitch navigation |
| **Move Speed** | `5.9` | `5.9` | Maximum straight-line sprinting velocity |
| **Body Radius ($r$)** | `25px` | `25px` | Universal humanoid collision boundary (Rule 24) |
| **Basic Projectile** | **Suppressed (`0`)** | **Suppressed (`0`)** | **Rule 23: Default `shoot()` suppressed in favor of physical ball kicks** |
| **Soccer Ball Radius** | `16px` | `16px` | Prominent arcade ball visibility and physical collision |
| **Ego Shot Damage** | `24` (Direct) | `32` (Crit: `1.35x`) | High-velocity direct strike |
| **Bank Volley Damage** | `32` (+33% bonus) | `43` (Crit: `1.35x`) | Bonus kinetic energy off wall rebound |
| **Ego Shot Velocity** | `14.5 px/f` | `21.75 px/f` (+50%) | High travel speed, surging in Flow State |
| **Attack Cadence** | `34 frames` (~`0.57s`) | `0 frames` (Instant) | Cooldown resets immediately upon interception or pass return |
| **Kick Follow-Through Slow** | `18 frames` at `18%` speed | `18 frames` at `18%` speed | Brief recovery slowdown on Isagi when launching a kick |
| **Metavision Slip CD** | `8.0s` (`480 frames`) | — | Tactical blind-spot repositioning dash |
| **Metavision Dash Dist** | `210px` | — | Dashing intercept distance toward the loose ball |
| **Invulnerability Window** | `14 frames` (~`0.23s`) | — | Evades all non-guaranteed attacks and continuous laser beams |
| **Flow State Duration** | `3.0s` (`180 frames`) | — | Buff window: +50% ball speed, +35% guaranteed crit |
| **Direct Volley CD** | `18.0s` (`1080 frames`) | — | Signature game-winning volley finisher |
| **Direct Volley Damage** | `75` | `101` (Flow Crit) | Colossal finishing blast damage |
| **Direct Volley Velocity** | `24.0 px/f` | `36.0 px/f` | Supersonic travel velocity |
| **Direct Volley Knockback** | `18.0 px/f` | `18.0 px/f` | Launches opponents violently across the pitch |
| **Direct Volley Stun** | `100 frames` (~`1.67s`) | `100 frames` | Paralyzes and hit-stuns opponent on wall/impact |
| **One-Two Return Chance** | `50%` | `50%` | Probability ball rebounds directly back to Isagi |
| **Sweet Spot Distance** | `180px` | `180px` | Awards +6 bonus damage & refunds 1.5s (90f) Metavision CD |

---

## ⚽ Core Combat Mechanics & Skills Breakdown

```
                            ┌──────────────────────────────────────────┐
                            │        ISAGI YOICHI ARSENAL KIT          │
                            └────────────────────┬─────────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
                 ┌─────────────┐                                   ┌─────────────┐
                 │   PASSIVE   │                                   │  ULTIMATE   │
                 │   Spatial   │                                   │   Direct    │
                 │  Awareness  │                                   │   Volley    │
                 │  & One-Two  │                                   │  Finisher   │
                 └──────┬──────┘                                   └─────────────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
  ┌─────────────┐               ┌─────────────┐
  │   PRIMARY   │               │   SKILL 1   │
  │  Ego Shot   │               │ Metavision  │
  │ (Ball Kick) │               │    Slip     │
  └─────────────┘               └─────────────┘
```

### 1. The Single Persistent Soccer Ball Architecture
Unlike typical fighters that spawn transient projectiles into a shared array, Isagi is anchored to a **Single Persistent Soccer Ball Standard**:
- **Singular Ball Guarantee**: Exactly **ONE** persistent soccer ball exists on the pitch at all times.
- **Natural Physics Movement**: Isagi moves, maneuvers, and bounces 100% naturally using the engine's standard circle fighter physics. **He never artificially steers, homes, or magnetically chases the ball.**
- **Physical Contact Gating**: Isagi can **ONLY attack when he and the ball naturally meet** as both entities navigate the pitch!
- **Elastic Deflection When Idle**: If Isagi and the ball collide while his kick is on cooldown or disabled, the ball elastically deflects off his body circle without dealing damage.
- **Lethality Guarantee**: The soccer ball is lethal **ONLY** when actively propelled by Isagi's kick (at speed $\ge 3.0$). Passive rolling balls or inert ricochets cannot harm fighters.

---

### 2. Passive: Spatial Awareness & One-Two Rebound
- **Bank Shot Bonus**:
  - The soccer ball ricochets off arena walls with clean restitution ($0.95$).
  - When the ball rebounds off a wall before striking an opponent, it deals **$32\text{ damage}$** (+33% kinetic boost over direct shots).
- **Sweet Spot Bonus**:
  - If the ball travels $\ge 180\text{px}$ from its kicking origin before impacting a target, it triggers Isagi's spatial sweet spot:
    - Deals **$+6\text{ bonus damage}$**.
    - Refunds **$1.5\text{s}$ ($90\text{ frames}$)** from Metavision Slip's cooldown!
    - Spawns floating combat text: `DIRECT SHOT!`.
- **One-Two Wall & Enemy Bank Pass**:
  - When kicking the ball, there is an innate **$50\%\text{ chance}$** (`bounceBackToIsagiChance = 0.50`) for the ball to rebound directly back toward Isagi upon hitting a wall or opponent!
  - When a return pass triggers:
    - The ball heads straight for Isagi at high velocity ($8.5\text{--}12.3\text{ px/f}$).
    - Floating text announces: `ONE-TWO!` or `BANK PASS!`.
    - Isagi's `shootCooldown` is **immediately primed to 0**, enabling him to strike the returning ball in stride for continuous rapid-fire volleys!
- **Gojo Limitless Infinity Interaction (Rule 1.7)**:
  - If the soccer ball strikes Satoru Gojo while Limitless Infinity is active, the kick force is spent on the invisible barrier. The ball elastically bounces back or away without piercing the neutral infinity space.

---

### 3. Primary Attack: Ego Shot (Soccer Ball Kinetic Drive)
- **Cooldown**: `34 frames` (~`0.57s`) | **Damage**: `24` (Direct) / `32` (Rebound) | **Speed**: `14.5 px/f`
- **Execution**:
  - Automatically triggers when Isagi and the ball meet while `shootCooldown <= 0`.
  - Isagi aims committedly toward the opponent (`gunAngle = targetAngle`), drives his foot into the ball, and unleashes a high-velocity line-drive shot.
  - Spawns an authentic **12-frame kick impact sprite** at the contact point along with cyan puzzle embers and sparks.
  - **Kick Follow-Through Slowdown**: Upon kicking, Isagi undergoes a brief physical recovery window ($18\text{ frames}$ at $18\%$ speed), preventing unnatural gliding while kicking.
  - On enemy impact, spawns a stepped 16-bit arcade hit burst and knocks the target backward.

---

### 4. Skill 1: Metavision Slip (Tactical Interception & Flow State)
- **Cooldown**: `8.0s` (`480 frames`) | **Dash Distance**: `210px` | **Invulnerability**: `14 frames` (~`0.23s`)
- **Proximity Gating**:
  - Skill 1 activates **ONLY when Isagi is within $160\text{px}$ of a loose soccer ball** (and outside immediate kick reach).
  - Rather than aimlessly dodging into empty space, Isagi reads the pitch, identifies the ball's trajectory, and sprints directly to intercept it!
- **Execution & Invulnerability**:
  - Isagi dashes hypersonicly toward the loose ball over $10\text{--}30\text{ frames}$, leaving ghost afterimages along his path.
  - Grants **$14\text{ frames}$ of absolute invulnerability**: evades incoming projectiles (`SLIP!` floating text) and phases cleanly through continuous laser beams (`dodgeBeam`).
- **Flow State Activation**:
  - Intercepting the ball awakens Isagi's **Flow State** for **$3.0\text{s}$ ($180\text{ frames}$)**:
    - Glowing cyan puzzle-eye pupils illuminate on his face.
    - `shootCooldown` immediately resets to **0**, allowing an instant kick upon meeting the ball.
    - **+50% Ball Velocity**: Incoming kick launches at **$21.75\text{ px/f}$**.
    - **+35% Guaranteed Critical Damage**: Next shot deals $1.35\times$ critical damage!

---

### 5. Ultimate: Direct Volley (Signature Game-Winning Finisher)
- **Initial Cooldown**: `6.0s` (`360 frames`) | **Cooldown**: `18.0s` (`1080 frames`)
- **Damage**: `75` (Base) / `101` (Flow State Crit) | **Speed**: `24.0 px/f` | **Knockback**: `18.0 px/f`
- **Execution (Zero Trap Delay)**:
  - *"I won't trap it... A direct volley, in stride!"*
  - When Direct Volley is off cooldown and Isagi meets the ball, he does not pause or wind up (`directVolleyWindup = 0`). He instantly volleys the ball at hypersonic speed!
  - The soccer ball turns into a blazing cyan comet enveloped in an intense Flow aura disc.
  - Isagi experiences a brief heavy follow-through recovery ($24\text{ frames}$ at $12\%$ speed).
- **Concussive Impact & Debuffs**:
  - **Supersonic Concentric Shockwave**: Releases a $90\text{px}$ clean concentric shockwave ring (Rule 26 compliant) at the kick point.
  - **Screen Shake & Audio**: Triggers an $8\text{px}$ global screen shake and plays heavy impact audio (`heavypunch1.mp3` & `heavypunch2.mp3`).
  - **Colossal Blast Knockback**: Launches the target violently backward ($18\text{ px/f}$) into arena walls.
  - **Stun & Paralyze Debuff**: Applies a devastating **$100\text{-frame}$ (~$1.67\text{s}$) Stun / Paralyze debuff** to the victim (`STUNNED!` floating text).
  - Can bounce back via One-Two pass to immediately set up a follow-up strike!

---

## 🎮 HUD Skill Providers & Dark Mode Standards (Rule 18)

Isagi's HUD skill bar provider in `js/graphics/ui/hudSkillProviders.js` strictly adheres to all repository UI rules:

```javascript
// Unified Theme Color Standard (Rule 18)
const themeColor = f.color || cfg.themeColor || '#00F0FF';

// Skill 1: Metavision Slip (Gated by enableMetavision)
skills.push({
  id: 'metavision',
  pct: f.isFlowStateActive ? ((f.flowStateTimer / 180) * 100) : ((1 - cdTimer / cdMax) * 100),
  ready: f.isFlowStateActive || cdTimer <= 0,
  color: themeColor,
  label: f.isFlowStateActive ? `FLOW STATE (${(f.flowStateTimer / 60).toFixed(1)}S)` : 'METAVISION'
});

// Skill 2: Direct Volley (Gated by enableDirectVolley & Registered Signature)
skills.push({
  id: 'direct_volley',
  pct: cdTimer <= 0 ? 100 : ((1 - cdTimer / cdMax) * 100),
  ready: cdTimer <= 0,
  color: themeColor,
  label: cdTimer <= 0 ? 'DIRECT VOLLEY' : `DIRECT VOLLEY (${(cdTimer / 60).toFixed(1)}S)`,
  isSignature: true,
  signature: true,
  isUltimate: true
});
```

- **Unified Character Palette**: Both skill bars strictly reference `themeColor = '#00F0FF'`. No mismatched ad-hoc colors.
- **Mandatory Toggle Gating**: Gated cleanly via `isSkillEnabled(cfg.enableMetavision)` and `isSkillEnabled(cfg.enableDirectVolley)`.
- **Clean Label Standard**: Zero redundant `(READY)` or `(ACTIVE)` suffixes. Dynamic countdowns appear strictly during recharge or Flow State drain.
- **Dark Mode / Signature Filter**: Registered in `signatureMap.isagi` (`['direct_volley', 'directvolley', 'DIRECT VOLLEY', 'metavision', 'METAVISION']`) so skills remain visible under Dark Mode HUD filters.

---

## ⚔️ Matchup Dynamics & Synergies

```
                                  ┌───────────────────────────┐
                                  │   MATCHUP RADAR: ISAGI    │
                                  └─────────────┬─────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
  [FAVORABLE MATCHUPS]                  [SKILL MATCHUPS]                      [CHALLENGING MATCHUPS]
  • Heavy Tanks (PEKKA, Mahoraga)       • Zoners (Megumin, Uryu)              • Ultra-Speed Rushdown (Toji, Naoya)
  • Predictable Linear Fighters         • Mid-Range Duelists (Tanjiro, Maki)  • Absolute Barriers (Gojo Infinity)
  • Swarm / Minion Spawners             • Counter Fighters (Saitama)          • Constant Displacement Pulls
```

### 1. Favorable Matchups
- **Slow Heavy Tanks (PEKKA, Berserker, Escanor)**:
  - Big body collision radii make them prime targets for Bank Shots and Direct Volleys.
  - Isagi's $5.2$ base speed and $210\text{px}$ Metavision dash easily out-maneuvers lumbering juggernauts.
  - The $100\text{-frame}$ stun on Direct Volley completely neutralizes heavy windup attacks.
- **Swarm & Minion Summoners (Eye of Cthulhu, Crazy Dave)**:
  - The 1-Ball physical ricochet bounces through multiple clustered summons in a single kick, clearing crowds while generating One-Two pass returns.

### 2. Skill Matchups
- **Zoners & Ranged Snipers (Uryu Ishida, Megumin, Sharpshooter)**:
  - Isagi can use Metavision Slip's $14\text{-frame}$ invulnerability window to slip right through incoming arrow barrages and explosion casts while closing the gap to the ball.
  - In wide arenas, Isagi's bank shots can angle around defensive barriers to strike zoners from unexpected blind spots.

### 3. Challenging Matchups
- **Hypersonic Close-Range Assassins (Toji Fushiguro, Naoya Zen'in)**:
  - Rapid blitz rushdowns can corner Isagi before he naturally meets the soccer ball.
  - Requires disciplined use of Metavision Slip to escape corner traps and position behind the assassin.
- **Limitless Infinity (Satoru Gojo)**:
  - Gojo's Limitless barrier completely stops the soccer ball in its tracks, expending the kick without damage.
  - Isagi must rely on Bank Passes to bait Infinity downtime or strike Gojo while Infinity is recharging.

---

## 💡 Tips & Playstyle Mastery

1. **Master the Bank Shot Angle**:
   - Never just kick directly at an alert opponent; bank shots off arena walls grant **+33% damage ($32\text{ HP}$)** and activate the **$+6\text{ Sweet Spot bonus}$**.
2. **Chain the One-Two Return**:
   - When a bank pass triggers, do not dodge away! Maintain position along the return vector; Isagi's `shootCooldown` is reset to 0, allowing an immediate double-volley that will decimate enemy HP bars.
3. **Save Metavision for Ball Recovery**:
   - Metavision Slip triggers when you are within $160\text{px}$ of the ball. Use this to instantly recover loose balls, enter Flow State, and fire an unstoppable $21.75\text{ px/f}$ critical missile!
4. **Direct Volley as a Wall Finisher**:
   - Direct Volley packs $18.0\text{ px/f}$ knockback. Aiming an opponent into a nearby wall guarantees wall-splat damage while they are immobilized by the $100\text{-frame}$ stun debuff.

