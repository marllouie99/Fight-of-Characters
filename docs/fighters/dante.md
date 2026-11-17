# Dante (`dante` / ID 80)

> **Source**: Jump Force MUGEN V14 (`PROTOZOARK And Arthur` — Devil May Cry Dante)
> **Grade**: `SS` | **Category**: `Anime` | **Theme Color**: `#EF4444`

## Overview
Dante fights as a hybrid greatsword-and-firearm brawler using **Rebellion** for heavy crimson frontal arcs, **Ebony & Ivory** for mobile gunfire bursts, and **Kalina Ann**, **Doppelganger**, and **Devil Trigger (Jackpot! + Crimson Tornado)** for arena pressure.

## Combat Kit & MUGEN Fidelity
- **Basic Attacks (`Rebellion & Ebony/Ivory` — MUGEN `Statedef 200/300/400/685`)**:
  - 3-hit `135°` crimson slash arc combo (`dante-slash-arc.png` from `Anim 4005/4007`) paired with Ebony & Ivory rapid gunfire at mid/long range (`shoot()` cleanly suppressed per Rule 23).
- **Skill 1 — Round Trip (`Statedef 1000/1005`)**:
  - Hurls spinning **Rebellion** (`dante-round-trip.png`) toward enemies, slicing repeatedly while pulling targets slightly inward before returning to Dante's hand.
- **Skill 2 — Drive (`Statedef 1200/1220`)**:
  - Unleashes a piercing crimson crescent wave (`dante-drive-wave.png`) across the arena.
- **Skill 3 — Doppelganger (`Statedef 1300 / Helper 1350`)**:
  - Summons a Devil-Trigger-tinted shadow clone that independently pursues and slashes hostile targets.
- **Skill 4 — Kalina Ann (`Statedef 1400/1450/1470`)**:
  - Fires an explosive guard-breaking rocket (`dante-rocket.png` -> `dante-explosion.png` + concentric Rule 26 ripple shockwaves); upgrades to dual Demon Cannon rockets in Devil Trigger.
- **Ultimate — Devil Trigger & Jackpot! (`Statedef 3500/3600/3670` & `Statedef 3000/3041`)**:
  - Transforms with `+32%` speed, `+25%` damage, `15%` damage reduction, subtle DT health regeneration (`Rule 27`), swirling **Crimson Vortex Tornado** (`dante-dt-tornado.png`), crimson DT aura (`dante-dt-aura.png`), and **Jackpot!** twin Ebony & Ivory finisher beams (`dante-jackpot-beam.png`).

## Assets
- **Hair**: `Assets/model/dante/Dante-hair.png` (`Rule 22`)
- **VFX**: `Assets/effects/dante/` (`8` extracted & crimson-calibrated MUGEN strips)
- **SFX**: `Assets/Sound Effects/DanteSFX/` (`12` normalized `.ogg` sounds extracted from `snd.snd`)
