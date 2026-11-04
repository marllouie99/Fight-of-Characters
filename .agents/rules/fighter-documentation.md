---
description: Mandatory creation and maintenance of fighter documentation markdown files in docs/fighters/<characterId>.md whenever creating or updating characters (Rule 33).
alwaysApply: true
---

# Mandatory Fighter Documentation Markdown File Standard (Rule 33)

Whenever creating, scaffolding, designing, or implementing a new fighter character:

- **MANDATORY INSTRUCTION — ALWAYS INCLUDE THE FIGHTER MD FILE**: Whenever the user asks to create, scaffold, or implement a new fighter character, the agent **MUST ALWAYS** create and include the character's dedicated documentation markdown file located at `docs/fighters/<characterId>.md`.
  - **STRICT PROHIBITION**: Scaffolding, implementing, or committing a new fighter without creating its corresponding `docs/fighters/<characterId>.md` file is strictly prohibited.

## Mandatory 10-Section Documentation Structure

Every fighter document in `docs/fighters/<characterId>.md` MUST follow this standardized format:

1. **Header & Metadata**:
   - `# <Display Name> — <Subtitle / Title>`
   - Metadata bullet list: **Category**, **Character ID** (`characterId`), **Fighter Grade** (`B`, `A`, `S`, `SS`, `SSR`), **Title**, **Boss Title**, **Theme Color** (`#HEX`), **Secondary Accents**, **Role / Archetype**.

2. **📖 Lore & Character Philosophy**:
   - Iconic quote block (`> *"<Quote>"*`).
   - Lore context, fighting spirit, and how the character translates into the 60 FPS circular arena.

3. **🎨 Visual Design & Rendering Standards**:
   - ASCII zoning diagram visualizing the 4 proportional body zones.
   - **Rule 24 Body Zoning**: Zone 1 (Face Dome `ry < 0.28r`), Zone 2 (Upper Torso/Shirt/Robes `0.28r <= ry < 0.68r`), Zone 3 (Waistband/Belt `0.68r <= ry < 0.78r`), Zone 4 (Trousers/Lower Garment `ry >= 0.78r`).
   - **Rule 22 Hair Asset Integration**: Asset path (`Assets/model/<characterId>/<Name>-hair.png`), bounding box calibration, crown offsets, nearest-neighbor scaling.
   - **Rule 32 Universal Black Outline**: 4-neighbor boundary test and 2.0px `#0E0F14` outer ink outline contract.
   - **Rule 20 Hand Positioning**: Symmetrical lower-flank hands at `(±r * 0.82, +r * 0.38)` and weapon hilt anchoring.

4. **⚔️ Core Combat Mechanics & Passive Traits**:
   - Passive ability rules, meters, resources, movement physics, and Rule 23 generic projectile suppression (`shoot(ownerIndex)` override).

5. **💥 Dedicated Combat Skills Breakdown**:
   - Detailed breakdown for **Basic Attack**, **Skill 1**, **Skill 2**, and **Ultimate / Signature**:
     - Name, Cooldown, Damage, Hitbox / Arc reach, Frame lifecycles (5-phase melee kinematics per Rule 30 if weapon/brawler).
     - Visual effect descriptions (Rule 26 clean concentric shockwaves, Rule 31 uncropped visual effects).

6. **📊 HUD Skill Configuration & Data Provider Gating**:
   - Registration in `js/graphics/ui/hudSkillProviders.js`.
   - Rule 18 compliance: unified `themeColor`, `isSkillEnabled(cfg.enable[Skill])` toggle gating, zero redundant parenthetical status suffixes, and dark mode / signature registration.

7. **🛡️ Physics & Status Effect Interactions**:
   - Rule 1 freeze guard (`_handleTimeStop()`), Rule 25 top-of-update visual effect decay before freeze checks, knockback handling, wall bounce physics, and domain/stasis immunities.

8. **🔊 Sound & Audio Engineering**:
   - SFX manifest, Web Audio synthesizer calls, volume calibration in `js/configs/audioVolumeConfig.js`, and layered impact audio.

9. **📁 Asset Manifest & Directory Structure**:
   - Directory tree showing character hair (`Assets/model/<characterId>/<Name>-hair.png`), 12-frame animations (`Assets/model/<characterId>/<effectName>/`), weapon graphics, and audio files.

10. **🧪 Verification & Test Coverage Matrix**:
    - Test assertions in `scripts/testInteractions.mjs` and verification via `npm run verify`.

## Existing Fighters Backlog Maintenance
Whenever working on, refactoring, or tuning a fighter that currently lacks a `docs/fighters/<characterId>.md` file, the agent must proactively author and commit the missing documentation file.

