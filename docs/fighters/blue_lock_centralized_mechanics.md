# Centralized Blue Lock Soccer Mechanics & VFX Architecture

This document serves as the canonical architectural guide and developer manual for building Blue Lock characters in **Circle Mini-Battle** / **Fight of Characters**.

By centralizing the ball kinematics, 3D rolling simulation, arena bounces, bank passes, target collisions, and visual effects into shared systems, all Blue Lock characters share a robust, esports-grade physical foundation while retaining distinct signature styles, theme colors, and special kicking techniques.

---

## 1. Architecture Overview

The system is split cleanly into two core modules following repository separation-of-concerns standards:

```
js/
├── systems/
│   └── soccerBallSystem.js        <-- Universal Ball Creation, Physics, Ricochet, Damage & Deflection
└── graphics/
    └── weapons/
        ├── soccerBallGraphics.js  <-- 3D 16-Bit Telstar Ball, Kick Impacts, Reticles, Shockwaves & Shards
        └── isagiWeaponGraphics.js <-- Backward-compatibility shim (re-exports from soccerBallGraphics.js)
```

### Module Responsibilities

| Module | File | Responsibilities |
|---|---|---|
| **Physics & Combat** | `js/systems/soccerBallSystem.js` | • Single persistent ball entity creation & reset<br>• 3D rolling kinematics & turf friction deceleration<br>• Arena perimeter ricochet & inward bank passes<br>• Hostile entity collisions & Gojo Infinity barrier checks (Rule 1.7)<br>• Sweet-spot distance scaling, damage calculation & stun debuffs<br>• One-Two return bounce passback to kicker<br>• Elastic passive non-kicking fighter circle deflection |
| **Visual Effects & Rendering** | `js/graphics/weapons/soccerBallGraphics.js` | • Truncated icosahedron 3D vertex math & 16-bit pixel rasterizer<br>• Dynamic theme-colored aura trails (Isagi cyan, Rin violet, Bachira amber, etc.)<br>• Metavision / spatial awareness hexagonal aim reticle<br>• Rule 26 compliant concentric supersonic shockwaves (no cobwebs/spokes)<br>• 12-frame pixel art kick impact sprite animation playback<br>• 16-bit impact starburst particle bursts & quantized debris<br>• Ego puzzle piece shard particle simulation |

---

## 2. Core API Reference

### `js/systems/soccerBallSystem.js`

#### `createSoccerBall(kicker, cfg)`
Instantiates the single persistent soccer ball entity for a Blue Lock fighter.
```javascript
import { createSoccerBall } from '../../systems/soccerBallSystem.js';

this.soccerBall = createSoccerBall(this, cfg);
```

#### `resetSoccerBall(ball, kicker, cfg)`
Re-anchors the ball at the fighter's kicking foot and resets all velocities and flags.
```javascript
import { resetSoccerBall } from '../../systems/soccerBallSystem.js';

resetSoccerBall(this.soccerBall, this, cfg);
```

#### `checkFighterCanKickBall(fighter, ball, reachMargin = 16)`
Returns `true` if the fighter circle is within physical kicking reach of the ball.
```javascript
import { checkFighterCanKickBall } from '../../systems/soccerBallSystem.js';

const canKick = checkFighterCanKickBall(this, this.soccerBall);
```

#### `executeSoccerKick(kicker, ball, angle, speed, options)`
Executes an active, lethal kick with forward perimeter repositioning, spin velocity, audio, sparks, 12-frame kick impact spawning, One-Two return bounce probability, and **Kick Accuracy spread calculation**.
```javascript
import { executeSoccerKick } from '../../systems/soccerBallSystem.js';

executeSoccerKick(this, this.soccerBall, kickAngle, kickSpeed, {
  isCrit: this.isFlowStateActive,
  isDirectVolley: false,
  isSuperShot: false,
  themeColor: '#00F0FF',
  bounceBackChance: 0.35,
  rotSpeed: 0.28,
  kickAccuracy: 1.0, // 100% accuracy = 0 spread (Isagi standard)
  maxKickSpread: (18 * Math.PI) / 180 // Maximum dispersion angle when accuracy < 1.0
});
```

#### The "Kick Accuracy" Mechanic
Every Blue Lock character has a `kickAccuracy` stat (0.0 to 1.0, or 0% to 100%):
- **100% Accuracy (`kickAccuracy: 1.0`)**: Every kick travels in a perfectly straight, laser-focused line with **ZERO angular spread** (`spreadAngle = 0`). This is **Yoichi Isagi's signature standard**, reflecting his spatial awareness and direct impact precision.
- **Lower Accuracy (`kickAccuracy < 1.0`)**: Characters with lower precision (e.g. wild power shooters like Barou or chaotic strikers like Shidou) have a `(1.0 - kickAccuracy)` probability of experiencing angular spread deviation up to `maxKickSpread * (1.0 - kickAccuracy)`.
- **Ball Properties**: The ball entity records `ball.kickAccuracy`, `ball.kickAngle`, `ball.finalKickAngle`, and `ball.kickSpreadAngle` across all match states.

#### `executeStrikerSkill(kicker, ball, opponent, arena, cfg, options)`
Universal "STRIKER!" finisher execution for **all Blue Lock characters**. Automatically handles transient dash cancellation, committed target aim-lock, recovery speed slow, hypersonic ball propulsion, concentric supersonic shockwaves (Rule 26), screen shake, heavy impact audio, floating text (`"STRIKER!!"`), and ego shard particles.
```javascript
import { executeStrikerSkill } from '../../systems/soccerBallSystem.js';

executeStrikerSkill(this, this.soccerBall, opponent, arena, cfg, {
  themeColor: this.color,
  shoutText: 'STRIKER!!'
});
```

#### The "Knockback First, Stun Afterwards" Standard
To guarantee intense physical impact and avoid the CC freeze-lock trap (where applying paralyze/stun on frame 1 immediately zeroes out velocity, cancelling the knockback):
1. **Directional Launch (Knockback First)**:
   - On impact, the target is launched backwards along the ball trajectory with high impulse velocity (`kbForce = 20.0`, `kbAngle = Math.atan2(ball.vy, ball.vx)`).
   - Target is put into an incapacitated flight state (`target.knockbackStunTimer = kbDuration`), preventing counter-attacks or directional steering while actively moving.
   - Target enters the pending striker queue: `target._strikerKnockback = { timer: kbDuration, stunDuration, kickerThemeColor }`.
2. **Knockback Flight & Wall Slam**:
   - The enemy slides / flies backwards across the arena with natural turf friction.
   - If the target slams into an arena wall before the timer expires (`hitWall = true`), the knockback is absorbed into the wall with sparks, screen shake, and impact audio (`Assets/Sound Effects/Attacks/heavypunch1.mp3`).
3. **Full Stun Afterwards**:
   - Once knockback flight completes (or on wall impact), the target's physical velocity zeroes out (`target.vx = 0; target.vy = 0`), and the full stun debuff is applied (`target.applyParalyze(stunDuration)`).
   - Floating combat text `"STUNNED!"` pops up in gold (`#FACC15`), giving the striker player a clean window to capitalize on the immobilized defender.

#### `updateSoccerBallPhysics(ball, kicker, primaryOpponent, arena, cfg, stateRef)`
Polymorphic frame update integrating 3D spherical rolling, turf drag, arena ricochets, bank passes, target damage (Gojo Infinity checks), and One-Two rebounds.
```javascript
import { updateSoccerBallPhysics } from '../../systems/soccerBallSystem.js';

updateSoccerBallPhysics(this.soccerBall, this, opponent, arena, cfg, state);
```

#### `resolveBallFighterDeflection(ball, fighter, isShootingOnCooldown)`
Natural elastic deflection when an unkicked ball collides with a fighter circle without dealing damage.
```javascript
import { resolveBallFighterDeflection } from '../../systems/soccerBallSystem.js';

resolveBallFighterDeflection(this.soccerBall, opponent, this.shootCooldown > this.shootCooldownMax - 4);
```

---

## 3. Multiple Blue Lock Characters & The Single Shared Soccer Ball Standard

In authentic soccer and the Blue Lock manga, there is strictly **ONLY ONE SOCCER BALL** in the match. When multiple Blue Lock characters are present in the arena (e.g. Isagi vs Rin, Isagi vs Isagi mirror match, 2v2 Tag Match, or Battle Royale), all Blue Lock fighters share the exact same soccer ball instance:

```javascript
import {
  isBlueLockFighter,
  countBlueLockFighters,
  isPrimaryBlueLockBallController,
  getOrCreateSharedSoccerBall,
  resetSoccerBall
} from '../../systems/soccerBallSystem.js';
```

### 1. Unified Instance Registry (`getOrCreateSharedSoccerBall`)
When a Blue Lock character initializes in their constructor, they call `getOrCreateSharedSoccerBall(this, cfg, state)`:
- If another Blue Lock character in `state.fighters` has already instantiated a soccer ball, the new fighter binds directly to that existing instance.
- Both fighters reference the exact same object (`fighter1.soccerBall === fighter2.soccerBall`).
- In `update()`, fighters call `this._syncSharedSoccerBall()` to ensure any late-joining or dynamically swapped fighters remain synchronized.

### 2. Center Pitch Kick-Off Positioning
- **Multiple Blue Lock Fighters ($\ge 2$)**: When `reset()` or kickoff occurs, the shared soccer ball is placed at the exact center of the arena (`arena.x + arena.width / 2`, `arena.y + arena.height / 2`). Both players sprint forward from their spawn positions to contest kickoff possession.
- **Solo Blue Lock Fighter ($= 1$)**: When a Blue Lock character fights a non-Blue Lock character (e.g. Isagi vs Toji, Gojo, or Target Dummy), the ball spawns directly at the Blue Lock character's feet (`_hasSoccerBall() === true`).

### 3. Primary Controller Election & Physics Deduplication
To prevent multiple Blue Lock characters from advancing ball physics twice per frame (`x += vx` twice) or drawing double-layered sprites:
- `isPrimaryBlueLockBallController(this, state)` determines which fighter is the active simulation driver.
- The primary controller is the first non-dead Blue Lock character in `state.fighters`.
- Only the primary controller executes `updateSoccerBallPhysics` and calls `drawSoccerBallProjectile`.
- If the primary controller is defeated, the surviving Blue Lock partner seamlessly inherits the primary controller role on the next frame.

### 4. Contested Possession & Chemical Reactions
- Whichever Blue Lock character enters kicking reach (`checkFighterCanKickBall(fighter, ball)`) gains physical possession.
- Kicking the ball updates `ball.lastKicker = fighter` and changes `ball.kickerThemeColor` to that character's aura color.
- **Opponents vs Teammates**:
  - Against opponents, a high-speed kick deals damage, hit stun, and knockback.
  - Between teammates (e.g. Isagi passing to Rin in 2v2 mode), friendly fire is suppressed (`isTeammate` check), allowing the teammate to cleanly trap or volley the incoming pass for high-speed one-two combos.

---

## 4. Universal Blue Lock "EGO" Awakening & Potential Buff System

In the Blue Lock series, strikers enter a state of **Ego Awakening** (Flow) by repeatedly asserting their dominance and scoring hits on the field. This mechanic is fully centralized for all Blue Lock characters in `js/systems/soccerBallSystem.js`.

### 1. The EGO Meter
Every Blue Lock character has an Ego meter (`egoMeter`, clamped between `0` and `maxEgoMeter = 100`):
- **Meter Filling on Successful Hits**: Every time a Blue Lock character successfully strikes an enemy with the soccer ball (`applyDamageToTarget` in `updateSoccerBallPhysics`), their Ego meter charges up:
  - Standard Soccer Ball Hit: `+25%` (`cfg.egoGainPerHit || 25`)
  - Spatial Rebound Bank Shot: `+35%` (`cfg.egoGainPerReboundHit || 35`)
  - "STRIKER!" Heavy Finisher Hit: `+50%` (`cfg.egoGainPerStrikerHit || 50`)
- **Visual Feedback**: On hit, floating text pops up indicating meter progression (`EGO 25%`, `EGO 60%`, etc.) in the character's theme color.

### 2. Awakening & Potential Unlocked
Once the meter hits `100%`, **EGO AWAKENED!** triggers automatically:
- **Supersonic Shockwave (Rule 26)**: A theme-colored supersonic concentric shockwave erupts from the striker.
- **Audio & Shake**: Global screen shake (7px) and spirit bomb charge audio (`spiritbombcharge.mp3`).
- **Awakened Duration**: The fighter enters Ego Mode for `egoDuration` frames (default `360 frames = 6.0s`).
- **Visual Aura**: A pulsing theme-colored ethereal flame aura with orbiting procedural Ego shards (puzzle pieces) renders around the striker (`drawBlueLockEgoAura`).
- **Duration Extension**: Landing additional soccer ball hits while Ego is active extends the remaining duration (`+30 frames / 0.5s` per hit up to max).

### 3. Modular Per-Character Potential Buffs (`egoBuffs`)
When Ego is awakened, characters unlock their unique physical or technical potential through modular config multipliers:

| Character | Theme Color | Ego Title | Canonical Ego Potential Buffs | Gameplay Signature |
|---|---|---|---|---|
| **Yoichi Isagi** | Cyan (`#00F0FF`) | `METAVISION FLOW` | `kickSpeedMultiplier: 1.30`<br>`damageMultiplier: 1.25`<br>`cooldownRate: 1.6`<br>`sweetSpotDamageBonus: 8` | Spatial Metavision Master: enhanced direct volley velocity & damage, accelerated spatial cooldown cycling, and precision sweet-spot bonus without speed/crit overlap. |
| **Hyoma Chigiri** | Hot Pink (`#EC4899`) | `44-PANTHER MACH PACE` | `speedMultiplier: 1.60`<br>`damageMultiplier: 1.15`<br>`kickSpeedMultiplier: 1.25`<br>`dodgeChance: 0.25` | 44 Panther Mach Pace: extreme +60% breakaway sprint speed, the fastest runner on the pitch outrunning defenders. |
| **Itoshi Rin** | Deep Cyan (`#00B4D8`) | `BERSERKER DESTRUCTION` | `damageMultiplier: 1.45`<br>`kickSpeedMultiplier: 1.35`<br>`curvedShotRate: 1.6`<br>`armorPenetration: 0.30`<br>`guaranteedCrit: true` | Puppeteer Egoist: lethal shot power, extreme curved trivela ball torque, defense-piercing strikes. |
| **Meguru Bachira** | Amber Gold (`#F59E0B`) | `MONSTER TRANCE DRIBBLER` | `speedMultiplier: 1.30`<br>`dodgeChance: 0.40`<br>`kickSpeedMultiplier: 1.20`<br>`reboundBounceChance: 0.80`<br>`kickAccuracy: 1.0` | Monster Dribbler: erratic footwork with 40% evasion slip and 80% One-Two return bounce chance for continuous passing. |
| **Seishiro Nagi** | Pure White (`#F8FAFC`) | `BLACK HOLE TRAPPER` | `trapKillVelocity: true`<br>`damageMultiplier: 1.35`<br>`kickSpeedMultiplier: 1.40`<br>`sweetSpotBonusMult: 2.0`<br>`cooldownRate: 1.4` | Creative Genius: kills ball velocity instantly on contact, explosive takeoff acceleration, doubled sweet-spot damage. |
| **Barou Shouei** | Crimson Red (`#DC2626`) | `THE KING'S PREDATOR CANNON` | `damageMultiplier: 1.55`<br>`strikerKnockbackMultiplier: 1.60`<br>`defenseMultiplier: 0.80`<br>`kickSpeedMultiplier: 1.45` | The King: highest single-hit power (+55%), catastrophic 1.60x wall-slam knockback, 20% incoming damage poise. |
| **Ryusei Shidou** | Neon Violet (`#A855F7`) | `DRAGON DRIVE FINISHER` | `damageMultiplier: 1.40`<br>`strikerRadiusMultiplier: 1.50`<br>`kickSpeedMultiplier: 1.50`<br>`guaranteedCrit: true`<br>`speedMultiplier: 1.20` | Penalty Box Demon: 50% wider aerial blast radius, extreme hypersonic bicycle kick velocity. |
| **Rensuke Kunigami** | Blaze Orange (`#F97316`) | `WILD CARD POWERHOUSE` | `damageMultiplier: 1.50`<br>`defenseMultiplier: 0.75`<br>`kickSpeedMultiplier: 1.35`<br>`strikerKnockbackMultiplier: 1.40` | Wild Card Cyborg: heavy ambidextrous power strikes and 25% physical tank armor. |
| **Mikage Reo** | Violet (`#8B5CF6`) | `CHAMELEON ALL-ROUNDER` | `speedMultiplier: 1.25`<br>`kickSpeedMultiplier: 1.25`<br>`damageMultiplier: 1.25`<br>`dodgeChance: 0.20`<br>`cooldownRate: 1.6` | 99% Dexterity Chameleon: balanced +25% stat boost and 60% accelerated skill cooldown cycling. |

### 4. HUD Skill Bar Standard (Rule 18)
- Every Blue Lock fighter's Ego bar is registered in `js/graphics/ui/hudSkillProviders.js` under `id: 'ego'`.
- Uses strictly the character's unified `themeColor` (Rule 18).
- Gated by `isSkillEnabled(cfg.enableEgo, true)`.
- Displays dynamic percentage while charging (`EGO (50%)`) and live countdown drain during active Awakening (`EGO AWAKENED (5.2S)`).
- Automatically exempt from dark-mode HUD hiding (`isSkillExceptionInDarkMode`).

### 5. Dynamic HUD Stats & Buff Indicators (`getBlueLockFighterStatsInfo`)
In addition to skill progress bars, every Blue Lock character displays real-time combat stats on their HUD health card (`infoContainer` in `js/graphics/hudManager.js`), which dynamically update whenever active buffs are gained or expired:

| State | HUD Stat Line | Description & Mechanics |
|---|---|---|
| **Base / Idle** | `DMG: <baseDmg>`<br>`SPD: <baseSpd>`<br>`KICK SPD: <baseKickSpd>`<br>`ACCURACY: <accuracy>%` | Clean 4-stat baseline layout showing base strike power, sprint mobility, ball launch velocity, and angular precision. |
| **Flow State** | `KICK SPD: <base> + <boost> ▲ (FLOW)`<br>`Crit Rate: 100% (FLOW 1.85x) ▲`<br>`STATE: FLOW STATE (<secs>S) ▲` | Visual feedback for Metavision Slip: guarantees a 1.85x critical strike and increases ball kinetic speed by 1.50x. |
| **EGO Awakened** | `DMG: <base> + <boost> ▲ (+<%> EGO)`<br>`SPD: <base> + <boost> ▲ (+<%> EGO)`<br>`KICK SPD: <base> + <boost> ▲ (EGO)`<br>`<Buff>: ▲ (EGO)`<br>`EGO: <TITLE> (<secs>S) ▲` | Dynamic stat boosts themed with the character's exact palette (`#00F0FF`, `#EC4899`, `#00B4D8`, etc.), displaying CDR, EVADE, DEF, TRIVELA, or PASSBACK alongside the countdown timer. |

---

## 6. Scaffolding a New Blue Lock Fighter

To scaffold a new Blue Lock character (e.g. Rin Itoshi, Bachira Meguru, Nagi Seishiro, Barou Shouei, Chigiri Hyoma):

### Step 1: Character Configuration (`js/configs/characters/<name>Config.js`)
Define character attributes, signature abilities, and theme colors:
```javascript
export const rinConfig = {
  id: 'rin',
  name: 'ITOSHI RIN',
  title: 'PUPPETEER EGOIST',
  themeColor: '#00B4D8',
  secondaryColor: '#7B2CBF',
  r: 25, // Rule 24: Universal Humanoid Baseline Radius
  baseHp: 380,
  speed: 4.8,

  // Ball Kinematics
  egoShotRadius: 16,
  egoShotSpeed: 16.0,
  egoShotDamage: 28,
  egoShotReboundDamage: 36,
  bounceBackChance: 0.45,

  // Signature Skill: Curved Trivela Shot
  curvedShotSpeed: 18.5,
  curvedShotCurveRate: 0.08,
  curvedShotDamage: 68,
  curvedShotCooldown: 540,

  assets: {
    hair: 'Assets/model/rin/rin-hair.png',
    kickImpact: 'Assets/model/isagi/kick_impact/kick_impact-b.png'
  }
};
```

### Step 2: Fighter Class Implementation (`js/entities/fighters/<Name>Fighter.js`)
Follow standard fighter lifecycle hooks:
```javascript
import { Fighter } from '../fighter.js';
import {
  createSoccerBall,
  resetSoccerBall,
  checkFighterCanKickBall,
  executeSoccerKick,
  updateSoccerBallPhysics,
  resolveBallFighterDeflection
} from '../../systems/soccerBallSystem.js';
import {
  drawSoccerBallProjectile,
  drawMetavisionAimReticle,
  drawKickImpact
} from '../../graphics/weapons/soccerBallGraphics.js';

export class RinFighter extends Fighter {
  constructor(x, y, team = 0) {
    super(x, y, team);
    this.characterId = 'rin';
    this.color = '#00B4D8';
    this.activeKickImpacts = [];
    this.soccerBall = createSoccerBall(this, rinConfig);
  }

  /**
   * Rule 23: Suppress generic bullet shooting.
   */
  shoot(ownerIndex) {
    // Intentionally empty: Character uses physical soccer ball mechanics!
  }

  reset() {
    super.reset();
    resetSoccerBall(this.soccerBall, this, rinConfig);
    this.activeKickImpacts.length = 0;
  }

  _hasSoccerBall() {
    return checkFighterCanKickBall(this, this.soccerBall, 16);
  }

  update(opponent, ownerIndex, arena) {
    // 0. Rule 25: Non-freezing visual effects decay at top of update
    this._updateVisualEffects();

    // 1. Mandatory Rule 1.1 Freeze & TimeStop Guard
    const isFrozen = this._handleTimeStop();
    if (isFrozen || this.isTargetOfAmbush) {
      this.interruptAttacks();
      // Keep ball moving even when kicker is immobilized
      updateSoccerBallPhysics(this.soccerBall, this, opponent, arena, rinConfig);
      return;
    }

    // 2. Update Single Soccer Ball Physics
    updateSoccerBallPhysics(this.soccerBall, this, opponent, arena, rinConfig);

    // 3. Kick Execution when meeting ball
    if (this._hasSoccerBall() && this.shootCooldown <= 0 && opponent && !opponent.isDead) {
      const angle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      executeSoccerKick(this, this.soccerBall, angle, rinConfig.egoShotSpeed, {
        themeColor: this.color,
        bounceBackChance: rinConfig.bounceBackChance
      });
      this.shootCooldown = 45;
    }

    // 4. Rule 1.2: Centralized Movement Physics
    this.applyMovementPhysics(1.0);
    this.resolveWallBounce(arena, opponent);
  }

  draw(ctx, opponent) {
    super.draw(ctx, opponent);

    // Render Kick Impacts
    for (const impact of this.activeKickImpacts) {
      drawKickImpact(ctx, impact.x, impact.y, impact.angle, impact.progress, impact.color);
    }

    // Render Persistent Soccer Ball
    if (this.soccerBall) {
      drawSoccerBallProjectile(ctx, this.soccerBall);
    }

    // Rule 21: Overhead HP and status rendering
    this.drawHealth(ctx);
    this.drawFreezeTimer(ctx);
  }
}
```

---

## 5. Blue Lock Character Design Reference Matrix

| Character | Theme Colors | Signature Mechanics | Implementation Pattern |
|---|---|---|---|
| **Yoichi Isagi** | Cyan (`#00F0FF`) & Neon Emerald (`#00FF88`) | • Metavision Slip Dash<br>• Direct Volley finisher<br>• Flow State critical bonus | Implemented in `IsagiFighter.js` |
| **Rin Itoshi** | Deep Cyan (`#00B4D8`) & Royal Purple (`#7B2CBF`) | • Curved Trivela Shot (curved trajectory via rotational torque)<br>• Puppet-master Spatial Trap (steers opponents into ball path)<br>• Berserker Destroyer Stance | Add `ball.angularTorque` in `updateSoccerBallPhysics` |
| **Bachira Meguru** | Amber Gold (`#F59E0B`) & Charcoal (`#1F2937`) | • Monster Elastic Dribble (ball remains attached during rapid spins)<br>• Scissor Feint Vanish (side teleport leaving defender whiffing)<br>• Rooftop Rabona Pass | Keep `ball.isDribbled = true` while dodging |
| **Nagi Seishiro** | Pure White (`#F8FAFC`) & Platinum Grey (`#94A3B8`) | • Black Trapping (kills ball velocity to exactly 0 upon contact)<br>• 2-Stage Fake Volley Turnaround<br>• Aerial Acrobat Feint | Override `resolveBallFighterDeflection` to catch & instantly kick |
| **Barou Shouei** | Crimson Red (`#DC2626`) & Onyx (`#111827`) | • Villain Chop Dribble (heavy 90-degree lateral cut)<br>• 29-Meter Middle Range Cannon (massive knockback & crater shockwave)<br>• Predator Eye Target Lock | Increase `directVolleyKnockback` to 24+ with camera shake |
| **Chigiri Hyoma** | Magenta Pink (`#EC4899`) & Hot Coral (`#F43F5E`) | • 44-Panther Mach Sprint (extreme speed boost chasing self-passes)<br>• Self-Lob Golden Zone Strike<br>• Breakaway Speed Trails | High `kicker.vx` catching own bank passes |

---

## 6. Architectural Quality Standards

1. **Single Ball Invariance**:
   Never create arrays of soccer balls (`this.soccerBalls = [...]`). Blue Lock fighters operate on a single shared soccer ball per kicker, preserving authentic sport parity and tactical predictability.
2. **Contested Ball Ownership**:
   When multiple Blue Lock characters are active, whoever is within kicking reach of the ball can kick it. Calling `executeSoccerKick` automatically updates `ball.lastKicker` and shifts `ball.kickerThemeColor` to the new kicker.
3. **No Artificial Steering**:
   Characters must navigate the arena using standard physics (`applyMovementPhysics`), colliding naturally with the ball rather than artificially gravitating or magnetized to it.
4. **Mandatory Overhead HP Layer (Rule 21)**:
   Always invoke `this.drawHealth(ctx)` and `this.drawFreezeTimer(ctx)` at the top layer of `draw()`.
5. **Freeze & Particle Decoupling (Rule 25)**:
   Visual effects and shockwave arrays must decay at the top of `update()` before `_handleTimeStop()`, ensuring that effects never freeze mid-air when players are CC'd.
