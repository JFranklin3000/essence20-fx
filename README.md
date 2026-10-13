# Essence20 FX

Animations and sounds for the Essence20 system in Foundry VTT v14: attacks in the look of their damage type, Critical
Successes, damage, Defeat, Conditions, Morphing in a Ranger's own colour, Transforming, Zords arriving and Megazords
forming, Spellcasting, Story Points - and lasting effects, faction emblems and Dice So Nice dice.

## Install

In Foundry: **Add-on Modules → Install Module**, and paste this into **Manifest URL**:

```
https://github.com/JFranklin3000/essence20-fx/releases/latest/download/module.json
```

Then turn it on in your world's **Manage Modules**.

**Needs**
- Foundry VTT **v14** and the **Essence20** system **6.0.5** or later (the first with the hooks this module listens to).
- **Sequencer** (required) - plays the effects and sends them to everyone at the table.

**Recommended**
- **JB2A - Free Content** - the animations. Without it, only the sounds play. The JB2A Patreon pack works too.
- **Dice So Nice** - for the Essence20 dice (optional; nothing needs it).
- **Automated Animations** (theripper93's v14 version) - optional: per-item animations and name matching for attacks.

## What it does

- **Attacks:** a shot (ranged) or swing (melee) from the attacker to each target, an impact on a hit, a miss on a miss, a
  bigger impact and a CRITICAL label on a Critical Success, a fumble label on a Fumble - each with a sound, in the look of
  its damage type (fire bolts, frost rays, lightning, acid, sonic waves, psychic strands, void blasts, flashes, dizzy
  stars) and its weapon (bullets for projectile weapons, a thrown bomb and a blast for explosives).
- **Area attacks:** a burst over the placed shape - an explosion (or fireball, frost, shockwave...) for a circle or an
  area around the user, a breath-weapon burst along a cone or line - then an impact on each target hit.
- **Damage:** the token flashes in the damage type's colour and shakes. **Defeated:** a puff of smoke and a skull.
- **Conditions:** a short icon and sound as one arrives - Stunned stars, Frightened, Poisoned, Prone, chains for
  Grappled / Restrained / Immobilized, a cracked shield for Armor Stripped, and more.
- **Power Rangers:** Morphing in the Ranger's own colour, a Zord being called, arriving, landing in a cloud of dust,
  boarding and getting out, Recall for Repairs, a Megazord forming (a beam from each Zord on the map) and breaking apart.
- **Transformers:** Transforming and back to Bot Mode, Energon spent, Combiners forming and breaking apart.
- **Every line:** Story Points (a rising star), Spellcasting (sparkles in the caster's colour), the Weird (an eye and
  radio static), help from a teammate, rerolls, a Requisition arriving (G.I. Joe).
- **My Little Pony:** hearts and butterflies for help from a friend, fireworks for a reroll. **Night Vale:** an eye for
  a Story Point, static for a reroll. A character's line is its Role's, else the world's game line.
- **Lasting effects** while a state lasts: a Morphed Ranger's aura, a Zord's dust, a Megazord's glow, Defeated smoke,
  markers for Stunned, Poisoned, Frightened, Deafened and held, and (off by default) a ring on the active combatant.
- **Scene ambience:** a loop over a whole scene, picked in its Scene Configuration (Environment tab) - Night Vale's
  violet haze and static, Energon motes, sparkles and butterflies, fog, battlefield smoke, wind, fireflies.

Hidden tokens' effects play for GMs only. At most 8 targets per attack get their own effect, and bursts are capped, so
a big fight stays readable.

## Settings

**Configure Settings → Essence20 FX**

| Setting | Who | What |
|---|---|---|
| Play effects | GM | Everything on or off for the table |
| Attack / Damage and Defeat / Condition / Morph, Transform and Zord / Story Point, Spellcasting and teamwork effects | GM | Each kind on or off |
| Lasting effects, Ring on the active combatant | GM | The effects that stay while a state lasts |
| Scene ambience | GM | Play the loop each scene picks |
| Faction emblems under tokens / flash / on roll cards / on dice | GM | Where the emblems show |
| Effect volume | GM | How loud (each player's Interface volume applies on top) |
| Reduced motion | Each player | Hear the sounds, don't see the animations |
| Dice in my character's colours | Each player | With Dice So Nice: a Ranger in their colour, else their faction's or line's |

Each player can also turn effects or sounds off entirely in **Sequencer**'s own settings.

**Configure FX** (GM): every effect in one list - turn it off, give it another animation (a Sequencer database path
like `jb2a.impact.004.blue`, or any video file) or sound (a file, or `none`), set its volume, Preview it on the selected
token, Reset it. **Export** saves your changes as JSON; **Import** reads one in (Save to keep it), so tables can share
their setups.

**A character's own effects:** the **Effects** item in an actor sheet's header menu (for its owner) opens the same list
for that character, played over the GM's - plus an **Effect colour** for Morphing and Spellcasting and a **Faction
emblem** choice.

**Faction Emblems** (GM): the module ships no faction symbols - they belong to Hasbro - but you can use your own image
for each faction (or **Import folder**: files named `autobot.webp`, `cobra.png`...). A character wears its Faction
item's emblem, else its folder's, else the one picked in its Effects window: under its token, flashing up on a Morph, a
Transform or a Megazord forming, beside their name on their roll cards in chat, and optionally on a Dice So Nice d20.

**Automated Animations** (optional): it has no Essence20 support of its own, so Essence20 FX hands it each attack -
the attacker, the item, every target and which were hit (misses animate as misses). **Attack animations by** (GM)
picks who animates attacks: *Essence20 FX only*, *Automated Animations for every attack* (an item it has nothing for
plays nothing), or - the default - *Automated Animations when it has one*: an item set up in its item menu (the
"Automated Animations" button in an item sheet's header), or whose name - or its weapon's - its Automatic Recognition
knows; Essence20 FX's otherwise. Area attacks and everything that isn't an attack stay with Essence20 FX. Its default
Automatic Recognition list is D&D-flavoured (Crossbow, Sword, Fire Bolt...), so this module adds **56 Essence20 entries**
to it - Blaster, Laser, Rifle, Pistol, Gun, Cannon, Grenade, Launcher, Missile, Blade, Saber, Bludgeon, Claw, Bite,
Staff, Lance and more, each with a fitting JB2A animation and one of this module's sounds - recognising about 72% of the
system's compendium weapons. A GM is offered them once; they can be added any time from **Configure Settings →
Essence20 FX → Add Essence20 weapons**. Only names its menus don't have yet are added - your own entries are never
replaced - and you can edit or delete them in its Automatic Recognition menu.

**Dice So Nice:** 21 Essence20 colour sets in every player's Dice So Nice choices - every Ranger colour, Autobot,
Decepticon, Energon, Joe, Cobra, Dreadnok, a pony rainbow, Harmony and Night Vale.

## For developers

The system announces what happens through `essence20.*` hooks (listed in the system's `docs/ARCHITECTURE.md`, "Hooks
for modules"); each fires once, on the client that made it happen, and Sequencer sends the effect to everyone.

- `scripts/moments.mjs` turns a hook's payload into moments; `scripts/presets.mjs` says what each moment plays (by
  damage type, weapon style, game line); `scripts/overrides.mjs` applies the GM's and an actor's changes;
  `scripts/play.mjs` plays it with Sequencer.
- `scripts/aa-bridge.mjs` hands attacks to Automated Animations; `scripts/aa-match.mjs` mirrors its item lookup.
- `scripts/ambient.mjs` keeps the lasting effects (each client its own); `scripts/emblems.mjs` the faction emblems;
  `scripts/dice.mjs` Dice So Nice.
- Tests: `npm test` (Node's own test runner - nothing to install). With JB2A installed beside this module, they also check
  every animation path exists; they always check every sound file, label, and that the release zip holds everything.
- Releases: publish a GitHub release (tag `1.2.3` or `v1.2.3`); `.github/workflows/release.yml` tests, stamps the version
  and download link into `module.json`, zips the module and attaches both. A new top-level folder must be added to its
  zip line - the tests fail until it is.

## License

The code is MIT-licensed (`LICENSE`). The bundled sounds are CC0 (`sounds/CREDITS.md`).

## Credits

- **Sounds:** Kenney (www.kenney.nl), CC0 - see `sounds/CREDITS.md`.
- **Animations:** JB2A - Jules and Ben's Animated Assets (not included; a recommended module).
- **Built on** Sequencer by Wasp (Fantasy Computerworks).

Essence20, Power Rangers, Transformers, G.I. Joe, My Little Pony and Welcome to Night Vale belong to their owners. This
is an unofficial fan module; it ships none of their art, logos or sounds.
