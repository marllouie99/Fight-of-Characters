# Hajime Kashimo (`kashimo`)

> **"Turn up the volume! Because this is a funeral for the living!"** — *God of Lightning*

## 1. Metadata
- **Category**: Anime (Jujutsu Kaisen)
- **Fighter ID**: `kashimo` (ID `79`)
- **Grade**: `SS`
- **Theme Color**: `#38BDF8` (Electric Cyan) / `#A855F7` (Mythical Beast Amber Violet)
- **Role**: Electrified Brawler / Polearm Duelist & Counter Assassin

## 2. Lore & Character Philosophy
Ported from Jump Force MUGEN (`Kashimo Hajime` + `Hajime` builds), Hajime Kashimo enters Circle Mini-Battle wielding his titanium Nyoi Staff and electrified cursed energy. Every melee exchange charges the opponent with positive/negative ions until Kashimo triggers an unavoidable **Sure-Hit Lightning Discharge**.

## 3. Visual Design & Rendering Standards
- **Rule 24 Body Model (`js/graphics/fighters/kashimoSkin.js`)**: Pre-baked `P = 2.0` offscreen canvas body featuring Zone 1 fair faceless head dome, Zone 2 Jujutsu Kaisen slate-ivory haori robe with cyan lightning trim, Zone 3 dark obi belt with cyan knot, and Zone 4 hakama trousers.
- **Rule 22 Hair Overlay**: Loads `Assets/model/kashimo/Kashimo-hair.png` with nearest-neighbor scaling (`imageSmoothingEnabled = false`) and icy-cyan twin lightning buns.
- **Rule 20 Weapon Anchoring**: Nyoi Staff and single gripping pixel hand (`drawPixelHand`) anchor strictly at the lower-torso flank `(+r * 0.82, +r * 0.38)` with 5-phase melee swing kinematics.
- **Rule 32 Black Ink Outline**: Crisp `2.0px` `#0E0F14` body border plus `drawFighterInkOutline` world-space silhouette pass.

## 4. Core Combat Mechanics & Passive Traits
- **Rule 23 Projectile Suppression**: Overrides `shoot()` so generic bullet projectiles never spawn.
- **Passive — Electrified Cursed Energy (`Static Charge`)**: Each Nyoi Staff / palm hit applies `1` stack (up to `3`). Reaching `3` stacks immediately discharges a **Sure-Hit Lightning Pillar** (`38` damage + stun, bypasses block).
- **Basic Attack — Nyoi Staff & Teleporte Blitz**: Uses MUGEN `Statedef 500` electric blink when closing distance (`110–240px`) and cleaves across a `135°` frontal arc (`92px` reach).

## 5. Active Skills & Ultimate
1. **Skill 1 — Lightning Counter (`LIGHTNING COUNTER`, 6.5s CD)**: Enters a `42f` parry stance (`ReversalDef`). If struck, negates the hit, blinks behind the attacker, and slams for `46` damage + `34f` stun. If untriggered on expiry, lunges forward with **Photon Slicer** (`32` damage).
2. **Skill 2 — Sure-Hit Railgun (`SURE-HIT RAILGUN`, 7.5s CD)**: Channels for `20f` along a committed 360° angle and fires a piercing **Lightning Railgun Beam** (`52` damage + `26` damage **Thunder Pillar** strike).
3. **Ultimate — Mythical Beast Amber & Sphere of Destruction (`MYTHICAL BEAST AMBER`, 27.5s CD or <= 45% HP)**: Awakens Kashimo's `var(3) = 1` amber state for `15s` (`+35%` speed, `+30%` damage, `15%` damage reduction, **all attacks bypass block/shields**), heals `45` HP, and erupts with **Sphere of Destruction** (`58` AoE damage in `115px`).

## 6. MUGEN Extracted Assets
- **Audio (`Assets/Sound Effects/KashimoSFX/`)**: `kashimo-staff-swing.ogg`, `kashimo-lightning-hit.ogg`, `kashimo-teleporte.ogg`, `kashimo-counter-trigger.ogg`, `kashimo-railgun.ogg`, `kashimo-thunder-pillar.ogg`, `kashimo-sphere-boom.ogg`, `kashimo-amber-transform.ogg`.
- **VFX (`Assets/effects/kashimo/`)**: `kashimo-amber-aura.png` (`grp 30511`), `kashimo-lightning-arc.png` (`grp 1503`), `kashimo-railgun-beam.png` (`grp 460`), `kashimo-thunder-pillar.png` (`grp 1994`), `kashimo-shock-ring.png` (`grp 7130`), `kashimo-counter-wave.png` (`grp 1081`), `kashimo-thunder-dome.png` (`grp 712`), `kashimo-p2-shock.png` (`grp 216`).
