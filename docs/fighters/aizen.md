# Sōsuke Aizen (`aizen`)

## 1. Header & Metadata
- **category**: `Anime`
- **characterId**: `aizen`
- **grade**: `SS`
- **themeColor**: `#8B5CF6`
- **role**: `Transcendent Shinigami / Kidō & Illusion Duelist`

## 2. Lore & Character Philosophy
> *"Since when were you under the impression that I wasn't using Kyōka Suigetsu?"*

Sōsuke Aizen is a master strategist of Kidō, swordsmanship, and Complete Hypnosis. In **Circle Mini-Battle**, he begins in Base Shinigami state and ascends mid-battle through **Hōgyoku Fusion** and **Final Form (Transcendence)**, upgrading his speed, Reiatsu output, Kidō projectiles, and **Hadō #90: Kurohitsugi** into **Ultra Fragor (Big Bang Explosion)**.

## 3. Visual Design & Rendering Standards
- **Pre-Baked Pixel Body (`aizenSkin.js`)**: Uses 1:1 offscreen `<canvas>` caching keyed by `(radius, formLevel)` (`Form 0: Hueco Mundo White Coat`, `Form 1: Hōgyoku Fusion Chrysalis`, `Form 2: Final Form Obsidian Carapace`) adhering strictly to Rule 24 Zone 1–4 proportions, zero hands on neutral body, and crisp `2.0px` `#0E0F14` manga ink outline (Rule 32).
- **Layer 2 Hair Overlay (Rule 22)**: `Assets/model/aizen/Aizen-hair.png` (`1024×1024`, calibrated to `visW: 860, visH: 800, centerX: 512, topY: 112`) renders Aizen's swept-back chestnut hair + signature loose forehead lock (with third-eye diamond crest in Final Form), customizable via `SkinStudioScreen`.
- **Zanpakutō & VFX Renderer**: `js/graphics/weapons/aizenWeaponGraphics.js` combines extracted MUGEN VFX strips (`Assets/effects/aizen/*.png`) with 60 FPS procedural Canvas 2D rendering, pre-baked offscreen radial glow quads (Rule 35), zero `shadowBlur` (Rule 11), double-tapered crescent slashes (Rule 15), 4-point needle speed lines (Rule 16), and sequential water-ripple shockwaves (Rule 26).

```text
         . - ~ - .
      /  [Swept Hair] \
     |  (Faceless Dome)|  <-- Zone 1: #FEDBC0 / #F6EFEA / #F3E8FF (ny < 0.30)
     |  | Coat / Core ||  <-- Zone 2: White Coat / Hōgyoku Orb / Carapace
     |  [  Obi / Sash ]|  <-- Zone 3: Violet/Crimson Obi (0.64 <= ny < 0.78)
      \  [Hakama Pleat]/---[Kyōka Suigetsu Blade] (Rule 20 Right Hand Anchor)
         ' - _ - '
```

## 4. Core Combat Mechanics & Passive Traits
- **Rule 23 Basic Projectile Suppression**: `shoot(ownerIndex)` is overridden to prevent generic bullet projectiles.
- **Base Stats**: `hp: 260`, `speed: 6.0`, `r: 25` (scaled via `super(def)`), `swordDamage: 16`.
- **Passive — Hōgyoku Evolution**: Gains gauge passively and on blade/Kidō hits; evolves at `<= 65%` HP (or 100% gauge) into **Hōgyoku Fusion** (`+20%` speed & damage, `+18` HP, Reiatsu Crush pulse) and at `<= 32%` HP into **Final Form** (`+35%` speed & damage, `+24` HP, transcendent wings & Fragor upgrades).

## 5. Dedicated Combat Skills Breakdown
- **Basic Attack — Kyōka Suigetsu (5-Phase Melee)**: `76px` reach, `135°` frontal arc (all `state.fighters` & `state.illusions`), `16` base damage, `lift (6f) -> hold (2f) -> strike (6f) -> impactLock (5f) -> recovery (9f)` with layered `fleshhit.mp3` + `aizen-hit-slash.wav`.
- **Skill 1 — Kyōka Suigetsu Counter**: `34f` illusion parry stance (`300f` cooldown). Intercepts non-guaranteed hits, shatters into mirror shards (`aizen-kyoka-shatter.png`), Shunpos behind the attacker (`this.aim(attacker)`), and inflicts `28` damage + `42f` hit-stun.
- **Skill 2 — Hadō #63: Raikōhō / Multi-Orbs / Fragor**: `220f` cooldown, committed 360° `skillCastAngle` lock (`14f` windup). Fires Raikōhō lightning sphere (`26` damage) in Base, 3 homing Hōgyoku Orbs (`14` each) in Hōgyoku Form, and a homing **Fragor** sphere (`42` damage, `105px` blast) in Final Form.
- **Skill 3 — Bakudō #81: Danku + Shunpo**: `340f` cooldown. Deploys a `75f` hexagonal Kido wall that intercepts arena projectiles and mitigates frontal hits by `65%`, paired with a Shunpo dash.
- **Ultimate — Hadō #90: Kurohitsugi / Ultra Fragor**: `600f` cooldown. Traps target in a rising pitch-black gravity coffin (`26f` rise, `42f` spear crush, `24f` shatter) dealing `52` (Base), `68` (Perfect Kurohitsugi), or `84` (Big Bang Explosion / Ultra Fragor in Final Form).

## 6. HUD Skill Configuration & Data Provider Gating
- Provider `aizen(f)` in `js/graphics/ui/hudSkillProviders.js` uses unified `themeColor` (`#8B5CF6`), gates every entry via `isSkillEnabled`, omits redundant status suffixes, and registers `kurohitsugi` / `ULTRA FRAGOR` in `isSkillExceptionInDarkMode()`.

## 7. Physics & Status Effect Interactions
- `_updateVisualEffects(arenaObj)` executes at the very top of `update()` before `this._handleTimeStop()` (Rule 25).
- Target stasis is applied strictly to enemy targets via `target.applyTimeStop(...)` during Kurohitsugi (Rule 1.5).

## 8. Sound & Audio Engineering
- Curated MUGEN SFX and voicelines stored under `Assets/Sound Effects/AizenSFX/` and mapped in `js/configs/audioConfig.js`, `js/soundEffects/basicAttackSounds.js`, `js/soundEffects/skillSounds.js`, and `js/systems/soundSystem.js`.

## 9. Asset Manifest & Directory Structure
- `Assets/model/aizen/`: `Aizen-hair.png`
- `Assets/effects/aizen/`: `aizen-kyoka-shatter.png`, `aizen-raikoho-lightning.png`, `aizen-kurohitsugi-coffin.png`, `aizen-reiatsu-pillar.png`, `aizen-fragor-burst.png`
- `Assets/Sound Effects/AizenSFX/`: 17 combat SFX `.wav` files + 4 `*-voiceline.wav` clips

## 10. Verification & Test Coverage Matrix
- Verified via `npm run verify` (`verifyCodebase.js`, `testAllFighters.mjs`, `testTagMatch.mjs`, `testInteractions.mjs`, and `benchmarkCombat.mjs`).
