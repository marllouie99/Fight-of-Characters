# Roaring Knight (`roaring_knight`)

> **Archetype:** Gaming / S-Tier Swordmaster Boss (*Deltarune Chapter 3*)  
> **Signature Kit:** Rotating Slash Phase 1 Basic Attack, Tracking Sword (Phase 1), Star Burst (+ Orbiting Stars), Blade Corridor, Snowflake Matrix, Rotating Slash (Phase 3 Finisher) & Full-Screen Roaring  
> **Standards Enforced:** Rule 1, Rule 11, Rule 18, Rule 20, Rule 21, Rule 22, Rule 23, Rule 24, Rule 25, Rule 26, Rule 30, Rule 32, Rule 33, Rule 35.

---

## 1. Visual & Skin Architecture
- **Circle Body (`js/graphics/fighters/roaringKnightSkin.js`)**: Pre-baked 1:1 offscreen buffer (`P = 2.0`, Rule 24 Toji/Gojo standard, scaled `r = 25` base -> `30` via `super(def)`).
  - **Zone 1 (Helmet Faceplate & Visor Dome)**: Dark slate-obsidian plating (`#1B1E2B`) with highlighted metallic brow rim (`#32384D`) and a razor-sharp crescent white eye visor (`#F8FAFC`).
  - **Zone 2 (Upper Thorax & Ribcage Armor)**: Stepped obsidian chestplate (`#161822`) with luminous white rib-plate core slash and shoulder pauldrons (`Y >= 24` luminance inside `#0E0F14` 4-neighbor ink border).
  - **Zone 3 (Waist Belt & Mantle Clasp)**: Silver clasp highlight (`#94A3B8`) and crimson core accent (`#EF4444`).
  - **Zone 4 (Greaves & Shadow Mantle Hem)**: Articulated obsidian leg plating (`#1F2433`).
- **Layer 2 Horned Crown (`Assets/model/roaring_knight/RoaringKnight-hair.png`)**: Swept forked Deltarune antler crown anchored to the top of the faceplate via `_drawRoaringKnightHair`.
- **Canonical Weapon Grip (Rule 20)**: Black Knife (`Assets/model/roaring_knight/BlackKnife.png`) anchored strictly to the canonical main-hand position with single-source `drawPixelHand` knuckles over the hilt and dynamic shoulder-to-wrist arm linkage during swings. Zero loose floating fists on neutral idle.

## 2. Configuration & Balance (`js/configs/characters/roaringKnightConfig.js`)
- **Base Stats**: `hp: 460`, `r: 28` (`radius: 28`), `speed: 4.9`, `grade: 'S'`, unified HUD `themeColor: '#18181B'`.
- **Config Toggles (`isSkillEnabled`)**: `enableShadowMantle`, `enableBlackKnife`, `enableFallingSwords`, `enableStarBurst`, `enableStarOrbit`, `enableBladeCorridor`, `enableSnowflakeMatrix`, `enableRoaringSwoon`, `enableGapingMawRift`, `enableDesperationRoaring`.

## 3. Passive: Shadow Mantle Dash (`Shadow Step`)
- Executes angled evasive/gap-closer dashes (`shadowStepCooldown: 135f`) leaving crisp obsidian/white-outlined afterimage trails (`afterImageMinSpeed: 4.4`, `afterImageInterval: 4f`), avoiding mobile GPU overload via velocity/frame gating (Rule 35).

## 4. Basic Attack: Dash -> Stop + Attack Animation -> Rotating Slash Phase 1 (`[1, 2, 2, 3, 3, 4]`, Black Knife Held)
- Suppresses default generic bullets via empty `shoot(ownerIndex)` override (Rule 23).
- Triggers from mid-range (`basicAttackReach: 175`, `basicAttackCooldown: 78f`) while keeping **Black Knife held in hand**; outside active swings, uses natural ballistic arena movement and elastic wall/fighter rebouncing via base `Fighter.applyMovementPhysics()` + `resolveWallBounce()`.
- Cycles evenly spaced intersecting rotating lines across consecutive casts: **`1 -> 2 -> 2 -> 3 -> 3 -> 4`**:
  - **1. Dash First (`up to 9f`, `10.5 px/f`)**: Dashes rapidly into striking range (or angles a crisp flanking step when already close), spawning Shadow Mantle afterimages.
  - **2. Stop Movement + Black Knife Swing Animation (`22f`, `vx = vy = 0`)**: Stops movement completely, then plays and completes the Black Knife swing (`Windup 8f -> Hold 2f -> White-Outlined Crescent Strike 7f + cut SFX -> Settle 5f`) **before** Phase 1 Rotating Slash begins.
  - **3. Free Movement + Rotating Slash Phase 1 Aim (`18f`)**: The moment the Black Knife swing finishes, movement and steering unlock immediately (`isMeleeSwinging = false`, `isStationarySkillActive() = false`) while `(boardCx, boardCy)` remains anchored right **in front of Roaring Knight** (`r * 2.4` along `aimDir`), flashing `KnightCircle`, looping `snd_knight_rotatingslash_line.wav`, and rotating lines (`0.145 -> 0.022 rad/f`) from steel-grey to crimson red (`#FF1024`) with a shrinking black inner core.
  - **4. Phase 1 Board Cuts (`1`–`4f`)**: Stops `snd_knight_rotatingslash_line.wav`, plays `snd_knight_cut.wav` + `Assets/Sound Effects/Attacks/explosion.mp3`, and fires each line in staggered order as `mode: 'phase1'` arena-clipped cuts (`RoaringknightSlash` exponential decay) with center diamond marks and kinetic wall-exit shards while the Knight keeps moving freely.
  - Applies `24` damage (`7.5` knockback, `8f` hitstun) gated once per cast (`damagedTargets` `Set`) so 2/3/4-line asterisks never deal stacked multi-hit burst damage.

## 5. Skill 1: Tracking Sword Phase 1 (`Tracking Sword`)
- Summons **10** `FallingSword.png` blades sequentially from non-repeating cardinal or intercardinal perimeter directions (`recentDirs` 3-slot anti-repeat window, `k * 45°`, `snd_knight_fallingsword.ogg` + crisp `snd_knight_teleport.wav` `1.30x` cue), aimed straight through the opponent's center.
- Each blade fades in smoothly during `'track'` (`28f -> 10f`), **locks coordinates while blending steel-grey -> crimson red (`#FF2E4D`) and pulling back visually (`pullBackPx: 0 -> 10px`)** (`'red_freeze'`, `26f -> 12f`), emits an expanding **crimson `sword_afterimage_grow` burst** as it flashes **solid pure white** (`'white_flash'`, `6f -> 4f`), then fires across the arena with `snd_knight_cut2.wav` (`1.28x+`) leaving a dense **28-step crimson ghost-sword streak** followed by an arena-clipped **diamond-tapered white board slash** (`14` damage along the cut line, zero hitstun stunlock).
- Both telegraph duration and spawn stagger progressively speed up across the 10-sword barrage (~`1.0s` initially down to ~`0.43s` by sword 10).

## 6. Skill 2: STARS — Phase 1 & Phase 3 (`Star Burst` & Orbiting Star Shield)
- Projects a crisp **black-bordered white hairline beam** with twin jittered wind strips (`intro`, `12f`) from the Knight's pointing hand, snaps open via an ease-out lavender-white flash (`open_flash` `4f`) into a shimmering translucent **purple cone** (`cone` `40f`) with inward-pulling additive wind streaks, gradient violet shift, and horizontal scanline flicker while streaming `10` growing six-pointed `StarBullet.png` stars (`radius: 7 -> 21`).
- At the end of the stream, the cone snaps shut (`flash_close` `4f`) into a collapsing **black-bordered white outro line** that narrows and fragments cleanly (`outro` `16f`) while all emitted stars pause with friction (`6f`), **accelerate backward along the reverse pull axis** (`50f`), and **lerp grey-to-crimson with a pulsing additive rim and 6 tapered triangular beams (`_drawStarTriBeam`)** (`22f + stagger`) before blooming white (`finalBloat`) and popping (`star_detonate_flash`). Also summons `4` orbiting 4-pointed white star blades (`54f`).
- **Phase 1 Pattern**: Fires `6` flickering radial star-point beams (`24°, 90°, 156°, 204°, 270°, 336°`), then explodes into `6` decelerating `StarChild.png` shards (`9` damage each, pulsing additive glint + smooth final-12f alpha fade), where **`3` of the `6` shards travel shorter and expire faster** (`2.0 px/f`, `22f`) while the alternating `3` drift further (`3.2 px/f`, `40f`).
- **Phase 3 Pattern (`starPhaseMode`)**: Tightens `6` crimson beams exponentially (`66° -> 5°` spread) toward vertical before exploding into **`2` opposite shards** (`starPhase3ChildCount: 2`) that decelerate to a hover, then **one at a time (`starPhase3StaggerFrames: 4`)** turn crimson red (`isPhase3Crimson`), aim straight at the opponent (`10f`), and launch rapidly (`10.8 px/f`, `12` damage).

## 7. Skill 3: Blade Corridor (Sword Tunnel / Carousel Ring)
- Alternates between:
  - **Sword Tunnel**: Sweeps `5` staggered parallel sword walls across the arena (`9.2 px/frame`, `11` damage per blade) with a drifting safe corridor (`±46px`).
  - **Carousel Ring**: Summons a pulsing, revolving ring of `FallingSword` blades around the arena center with clear open gaps before launching outward.

## 8. Skill 4: Snowflake Slash (`Snowflake Matrix` + / X Revolving Cuts)
- Tracks target over `18f` (`snd_knight_rotatingslash_line.wav`), **commits & locks crimson `+` / `X` trajectory lines (`12f`)**, then fires 4 arena-spanning white piercing beams (`22f`, `snd_knight_beam.wav` + `snd_knight_laser.wav`, `24` damage) that revolve continuously (`snowflakeMatrixRotSpeed: 0.045`) across the arena (Rule 17 cooldown-gated sweep hits with zero hitstun).

## 9. Ultimate & Final Phase: Rotating Slash (Phase 3 Finisher) & Full-Screen Roaring
- Signature move registered in `signatureMap` (`roaring_knight`, UI label `ROTATING SLASH`).
- **Part 1 — Rotating Red Line Wind-Up (`60f`)**:
  - The Knight warps/centers onto `(boardCx, boardCy)` with authentic DELTARUNE `rotating_slash.rs` audio (`snd_knight_puff.wav` + `snd_knight_teleport.wav` at `0.5x` pitch + `snd_knight_drawpower.wav` + `snd_knight_rotatingslash_line.wav`, stopped cleanly on slash transition).
  - Renders the additive black-core-to-crimson radial flash (`obj_knight_circle`), a grey-to-crimson gradient aiming ribbon (`rgb(145,145,152) -> rgb(255,16,36)`) with shrinking black inner core, decelerating `~305°` (`5.32 rad`) clockwise sweep, and twin staggered perpendicular pulse lines (`line2`/`line3`) before locking on `-45°` (`/`) as `Assets/model/roaring_knight/KnightBattleFlurry.png` starts at `80%`.
- **Part 2 — Rapid Centered Rotating Slashes (`24` cuts, `5f` cadence, `16f` outro)**:
  - Each cut fires with `snd_knight_cut.wav`/`snd_knight_cut2.wav` layered with punchy impact burst (`explosion.mp3`), drawing exponentially decaying pointed triangle slices (`0.812/f`, crimson → salmon → white), swept bowtie wedges (`prevAngle -> angle`), center black-in-red diamond flash marks, outward-flying wall-exit debris needles, and lingering dashed white scratch scars across `2–3` overlapping cuts while the 3-frame `KnightBattleFlurry.png` sprite animates over the canonical Circle Roaring Knight body.
- **Final Phase Attack (`Full-Screen Roaring`)**: Once per match when HP falls to `<= 35%`, unleashes an immediate **Final Roaring** barrage firing a `3`-star Starstorm spread alongside crisscrossing Gaping Maw Void Rifts.

## 10. Audio Integration (`Assets/Sound Effects/RoaringKnightSFX/`)
- Registered in `js/configs/audioConfig.js`, `js/soundEffects/basicAttackSounds.js` (`id: 73` & `'roaring_knight'`), and `js/soundEffects/skillSounds.js`.
- Uses authentic Deltarune Chapter 3 knight cuts, falling swords, star explosion, metal hits, roar, boxbreak, wide slash, rotating slash line, beam, laser, and dark fountain SFX.

## 11. HUD & Skin Studio Integration
- **HUD (`js/graphics/ui/hudSkillProviders.js`)**: Unified `themeColor` (`#18181B` light / `#F8FAFC` dark), strict `isSkillEnabled` gating across all 6 bars (`shadow_mantle`, `falling_swords`, `star_burst`, `blade_corridor`, `snowflake_matrix`, `roaring_swoon` displayed as `ROTATING SLASH`), clean idle labels (no `(READY)`), dynamic timer countdowns, and `signatureMap` dark-mode registration.
- **Skin Studio (`js/graphics/ui/SkinStudioScreen.js`)**, **Card Element (`js/configs/cardElementConfig.js` -> `dark`)**, and **`js/configs/skinCustomizationsDatabase.js`**.

## 12. Verification & Edge-Case Guards
- Rule 1 freeze guard + Rule 25 top-of-update VFX decay ensure projectiles/slashes/afterimages never freeze in mid-air during time stops.
- All Canvas 2D contexts maintain exact `0` transform stack depth (`save`/`restore` parity), verified in `scripts/testInteractions.mjs` Test 172 and `npm run verify`.

## 13. STARS Skill SFX Mapping (Deltarune Chapter 3)
- **Cast Windup (`intro`) & Closing Outro Line (`flash_close`)**: `snd_knight_drawpower.wav` (`drawPower`, pitched at `1.30x`) layered with `snd_knight_pulse.wav` / `pulse2` on cast, and `snd_knight_beam.wav` (`1.35x`) on close.
- **Purple Star Cone Emission (`open_flash` / `cone`)**: `snd_knight_puff.wav` (`puff`) layered with low-pitched `snd_knight_beam.wav` (`0.62x` cone-open whoosh) plus rate-limited crisp `snd_knight_pulse.wav` star-spawn pings (`1.55x+`).
- **Reverse Pull-Back (`reverse`)**: `snd_knight_stretch.wav` (`stretch`) triggers once per salvo as stars pull backwards.
- **Crimson Flare (`red_lock`) & Shatter Burst (`_detonateStarBurst`)**: `snd_knight_star_explosion_close.wav` (`starExplosion`) cues its deep charge rumble (`0.72x` pitch, `offset = 0.45s`) on `red_lock` and snaps directly onto the `1.02s` crystal shatter peak on burst alongside alternating `explosion.mp3` (`cutExplosion`) punch.
- **Phase 3 Homing Shards (`aim` -> `shoot`)**: Throttled high-pitch lock ping (`beam`) on crimson lock-on and rapid `snd_knight_laser.wav` (`laser`) shots on staggered launches.
