---
name: mugen-moveset-integrator
description: Scan, trace, extract, and port MUGEN character movesets (.cmd, .cns, .air, .sff, .snd, .act) into Circle Mini-Battle fighters with script-faithful mechanics, blend-accurate VFX/SFX extraction, engine anti-regression guards, and verification tests. Activate whenever integrating, upgrading, or auditing a fighter or Pokémon/companion using MUGEN source files or Jump Force Mugen archives.
---

# MUGEN Moveset, VFX & SFX Integrator (`mugen-moveset-integrator`)

Follow this end-to-end workflow whenever adding, upgrading, or auditing a fighter's skills, animations, VFX, or SFX from MUGEN character folders or archives (such as `Jump Force Mugen V14`).

**Core Mandate**: Never guess what a move looks like or does from sprite sizes alone. ALWAYS trace the actual `.cmd` -> `.cns` -> `.air` -> `.sff`/`.snd` script chain first, port the true mechanic (beam vs projectile vs counter vs domain/coffin vs transformation), convert additive/subtractive MUGEN blends properly, and verify every skill executes in live simulation.

---

## 1. Ephemeral Unpack (Rule 0.1 Hygiene)

- **NEVER** extract raw `.sff`, `.snd`, `.cns`, `.air`, or preview sheets inside the repository root or `scripts/`.
- Extract MUGEN archives strictly into `<appDataDir>/brain/<conversation-id>/scratch/<char_folder>/` (using WinRAR/UnRAR or archive CLI).
- Store all extraction/inspection scripts and contact-sheet previews in that scratch directory.

---

## 2. Script-First Moveset Audit (`.cmd` -> `.cns` -> `.air`)

Before extracting a single sprite or writing combat code, run a Node trace script against the character's files to map **every move**:

1. **Command Map (`.cmd` & `Zz-MOVESET.txt`)**: List every Special, Super, Counter, Barrier, Transformation, and Combo trigger and its entry `Statedef`.
2. **State Logic Trace (`.cns` / `Especials.cns` / `Supers.cns` / form `.cns`)**:
   - Inspect `SuperPause`, `VelSet`, `ChangeAnim`, `Helper`, `Explod`, `PlaySnd`, `HitDef`, `AngleDraw`, `Trans`, `PalFX`, `EnvShake`, and `BGPalFX`.
   - Record **gameplay behavior** faithfully:
     - Is the move a **sustained directional beam/wave** (e.g. Aizen Hadō #63 Raikōhō `Statedef 1200 -> 1250/1260` using `AngleDraw`/`G8004`), or a homing/spread **projectile orb** (e.g. Hōgyoku Multi-Balls `Statedef 25100/11625`), or a **multi-node AOE blast** (Final Form `Statedef 27200`), or a **parry counter + Shunpo ambush cut** (`Statedef 1100 -> 1101`)?
     - Do transformed states (`Form >= 1`, `Form >= 2`) swap out skills or ultimates completely (e.g. Base/Hōgyoku `Kurohitsugi` vs Final Form `Big Bang Explosion` `Statedef 3200–3265`)?
3. **Animation & Blend Map (`.air`)**:
   - Resolve every `anim = <id>` from `.cns` to `[Begin Action <id>]` in `.air` to get the exact **SFF `(Group, Index)`** sequence, frame order, and `A`/`S`/`AS*D*` blend flags (`trans`). Do **NOT** assume `Action ID === Sprite Group`.

---

## 3. Blend-Accurate `.sff` VFX Extraction & Visual Verification

Decode SFF v1/v2 PCX sprites respecting `samePal` palette chaining and index `0` MUGEN transparency, then render **contact sheets on a dark checkerboard** and inspect them visually with `read_file` before placing anything into `Assets/`.

### Blend Mode Conversion Rules
- **`trans = default / none` (`cleanDarkEdge`)**: Keep MUGEN indexed colors; softly feather near-black fringe (`max(r,g,b) < 42`) only if opaque dark matte fringes appear.
- **`trans = A / Add / AddAlpha` (Glowing energy, lightning, beams, explosions, shatter flashes)**:
  - Lift black matte smoothly to alpha using luminance (`luma = (maxC - threshold) / (255 - threshold)`), `alpha = Math.round(Math.pow(luma, 0.85..1.35) * 255)`, and un-premultiply color (`rgb * 255 / maxC`) so glow plumes vanish cleanly without rectangular boxes.
  - Apply form-appropriate tint curves *before* un-premultiplying when MUGEN relies on `PalFX` tinting (e.g. Night Slash violet `add 120,0,180`).
- **`trans = S / Sub` (Subtractive dark voids — e.g. Kurohitsugi Black Coffin `G15615`, Dark Vortex `G1096`)**:
  - **CRITICAL**: MUGEN `trans=S` sprites store bright white masks in `.sff` to subtract light in-engine. Exporting them directly produces invisible solid-white boxes!
  - Convert mask luminance into deep obsidian/indigo void colors (`rgb ~ [14, 8, 30]`) with boosted violet/crimson outer edge rim contrast so dark monoliths/vortices pop cleanly in both Normal and Dark Mode.
- **Directional Orientation & Rule 31 Padding**:
  - For beam/wave strips (e.g. `G8004`), check firing direction in the sprite; mirror horizontally if needed so the palm/emitter origin sits at the left edge and bolts shoot rightward (`+X` along `gunAngle`).
  - Use a symmetric shared bounding box across all frames of a strip/sequence (or consistent axis centering) with `10–20px` transparent padding (zero non-zero alpha pixels touching edges per Rule 31), and target compact mobile-safe cell sizes (`128×128` for bursts/orbs, `224×160` for wide beams per Rule 35).

---

## 4. Clean `.snd` SFX Extraction & Audio Registration

- Map `PlaySnd value = S<grp>,<idx>` directly to `.cns` attack windup, release, hit, counter, dash/smoke, and transformation events.
- Decode RIFF WAV entries from `.snd`, check duration, sample rate, and peak amplitude, then convert via `ffmpeg-static`:
  - Trim silence and peak-limit (`-af "silenceremove=start_periods=1:start_threshold=-55dB,alimiter=limit=0.92"`), encode to `.ogg` (`-c:a libvorbis -q:a 5`), and verify `-6` to `-16 dB` mean volume parity with existing SFX.
- Register every sound key cleanly in:
  - `js/configs/characters/<name>Config.js` (`sounds` + normalized `soundVolumes` in `[0.0, 5.0]`),
  - `js/soundEffects/basicAttackSounds.js` and `js/soundEffects/skillSounds.js` if applicable.
- Observe Rule 36: keep commercial builds safe from unlicensed studio BGM/ripped voice tracks where `COMMERCIAL_MODE` applies.

---

## 5. Circle Mini-Battle Engine & Anti-Regression Guards

When wiring extracted moves into `js/entities/fighters/<Name>Fighter.js` and `js/graphics/weapons/<name>WeaponGraphics.js`:

1. **Team Hostility Index Guard (`_isHostile`)**:
   - `state.getFighterTeam(fighterIndex)` takes an **integer index** in `state.fighters`, **NEVER** a `Fighter` object, and returns `null` in standard 1v1 duels!
   - Always resolve indices cleanly and handle illusions/companions:
     ```javascript
     _isHostile(target) {
       if (!target || target === this || target.hp <= 0 || target.isDead || target.dead) return false;
       if (typeof state !== 'undefined' && typeof state.getFighterTeam === 'function' && Array.isArray(state.fighters)) {
         const myIdx = state.fighters.indexOf(this);
         const targetSubject = (target.owner && !state.fighters.includes(target)) ? target.owner : target;
         if (targetSubject === this) return false;
         const targetIdx = state.fighters.indexOf(targetSubject);
         if (myIdx !== -1 && targetIdx !== -1) {
           const myTeam = state.getFighterTeam(myIdx);
           const targetTeam = state.getFighterTeam(targetIdx);
           if (myTeam !== null && targetTeam !== null) return myTeam !== targetTeam;
         }
       }
       return true;
     }
     ```
2. **Never Shadow `Fighter.prototype._tickCooldowns()`**:
   - Base `Fighter.update()` calls `this._tickCooldowns()`, which drives `this.skillManager.update()` (`*Cooldown` keys) and base status timers.
   - Naming a subclass method `_tickCooldowns` both breaks `SkillManager` and double/quadruple-decrements cooldowns. Name subclass active-timer helpers `_tick<Name>Timers(cfg)` and only tick stance/windup timers (`windupTimer`, `stanceTimer`), leaving `*Cooldown` fields to `SkillManager`.
3. **Match Lifecycle & `wrapFighterDraw` Safety**:
   - Implement `reset()` calling `super.reset(); this._init<Name>State(this._cfg());`.
   - Set `this.usesCustomHands = true;` in the constructor whenever `draw()` draws projectiles or small circles (`radius 3.5–12px`) so `wrapFighterDraw` in `fighterFactory.js` does not replace orb strokes with `drawPixelHand`.
   - Preserve `this.drawHealth(ctx)` and `this.drawFreezeTimer(ctx)` at the end of `draw()` (Rule 21), and `shoot(ownerIndex) {}` suppression if melee/skill-based (Rule 23).
4. **360° Arena Adaptation & Rule 25 / Rule 35 Compliance**:
   - Clamp beams to arena walls dynamically using `gunAngle` / `skillCastAngle` (continuous 360° targeting per Rule 1.4, not hardcoded MUGEN left/right `±X` offsets).
   - Decay all `activeVisualEffects` and independent projectiles at the very top of `update()` **before** `_handleTimeStop()` (Rule 25).
   - Zero `ctx.shadowBlur`, zero per-frame `createRadialGradient` inside high-frequency render loops (use pre-baked offscreen glow quads), and preserve `0` Canvas stack depth across all early returns.
   - Do not overwrite user custom damage/HP/cooldown balance values in `js/configs/characters/` (Rule 0.5).

---

## 6. Mandatory Testing & Verification (`npm run verify`)

1. Add or update deterministic runtime tests in `scripts/testInteractions.mjs` verifying:
   - `_isHostile` works in both 1v1 (`getFighterTeam() === null`) and multi-team modes (`getFighterTeam(idx)`),
   - Cooldowns tick by strictly `1` per frame when unfrozen,
   - **Every mapped MUGEN skill & form variant** executes, spawns its expected state/VFX, and deals damage,
   - Rule 25 non-freezing VFX decay under `applyTimeStop`,
   - Exact disk existence of every registered VFX/SFX path and `0` Canvas stack depth across all draw phases.
2. Run `npm run verify` and confirm exit code `0` across Asset Integrity, Audio Normalization/Completeness, Runtime Interactions, and Mobile 60 FPS Performance Budget Gate.
