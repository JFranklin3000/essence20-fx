# Changelog

## Unreleased

- **Fixed:** with Automated Animations active, attacks it has an animation for played twice. Its own chat-card
  listener also animated Essence20 attack cards; it now skips them while Essence20 FX handles attacks, so the bridge
  (which knows the targets and which were hit) is the only route. Other cards it animates as before.
- **Configure FX:** a mute button beside each sound - no sound for that effect (the field reads "none", struck
  through); click again for the default.

## 1.0.0-beta.1 - first beta

The 1.0.0 feature set below, for testing on Essence20 **6.0.4**: with no essence20.* hooks there, the module rebuilds
attacks (hit, miss, Critical, Fumble, by the rolled item's damage type and style), damage, Defeat, Conditions, Morph,
Transform, Energon, Megazords forming and Story Points from 6.0.4's roll cards and character changes, and switches that
off by itself on 6.0.5. Waiting for 6.0.5: area bursts, Zords arriving and leaving, Megazords breaking apart,
Requisitions, rerolls, help from a teammate. Beta channel: releases/download/beta/module.json.

## 1.0.0 - first release

Animations and sounds for the Essence20 system (Foundry VTT v14, Essence20 6.0.5+), built on Sequencer, with JB2A's
free animations and CC0 sounds from Kenney.

- **Attacks:** ranged and melee hits, misses, Critical Successes and Fumbles, in the look of each of the system's damage
  types and weapon styles (projectile, explosive).
- **Area attacks:** a burst over the placed circle, cone, line or area around the user, then an impact on each target hit.
- **Damage, Defeat and Conditions:** a flash and shake in the damage type's colour, smoke and a skull on Defeat, an icon
  and sound for 14 Conditions.
- **Power Rangers:** Morph in the Ranger's own colour, Zords called / arriving / placed / boarded / left / recalled,
  Megazords forming and breaking apart.
- **Transformers:** Transform and Bot Mode, Energon, Combiners.
- **Megazords and Combiners on the map:** forming plays when the Megaform's sheet Join button puts its token where its
  Zords or Transformers stood - a beam from each of them in - and Separate plays beams back out (breaking apart when
  Defeated keeps its explosion). A roster change alone no longer plays "forms" (on 6.0.4, which has no Join, it still
  does). Needs Essence20 6.0.5.
- **Teleports:** any token's teleport (Foundry's Blink and Displace, a Wrist Communicator, a Perk that moves a token
  without walking it) - a Ranger's streak in their own colour across the map, a Cybertronian's bridge portal at both
  ends, a pony's sparkles, a flash there and here for everyone else. Needs Essence20 6.0.5 for the rules' teleports
  (Blink and Displace work on 6.0.4 too).
- **Every line:** Story Points, Spellcasting, the Weird, teamwork, rerolls, Requisitions; My Little Pony and Night Vale
  looks of their own.
- **Lasting effects:** auras, markers and glows while a state lasts; a ring on the active combatant (off by default).
- **Scene ambience:** a GM-picked loop over a whole scene (Night Vale haze, Energon motes, sparkles, fog, smoke, wind,
  fireflies), set in Scene Configuration.
- **Configure FX:** change, mute or turn off any effect, preview it, export and import the lot; a character's own
  effects and colour from its sheet.
- **Faction Emblems:** your own images per faction - an emblem (a badge on the token's corner, a flash on a Morph or
  Transform, roll cards, dice) and a turn marker (Foundry's own marker under the active token) - with previews and a
  size check as you pick them.
- **Automated Animations (optional):** attacks handed to it - every attack, or only those it has an animation for
  (its item settings or Automatic Recognition), with Essence20 FX animating the rest. 56 Automatic Recognition entries
  for Essence20 weapon names (about 72% of the compendium's weapons), offered to the GM once and in the settings.
- **Dice So Nice (optional):** 21 Essence20 colour sets, dice in your character's colours, emblem d20s.
- **Settings:** each kind of effect on or off, volume, and Reduced motion for each player.
