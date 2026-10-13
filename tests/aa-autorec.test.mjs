import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENTRIES, TEMPLATES, buildAutorecMenu } from '../scripts/aa-autorec.mjs';
import { autorecMatch, rinse } from '../scripts/aa-match.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const system = path.join(here, '..', '..', '..', 'systems', 'essence20', 'packs');

/** Automated Animations 7.1.7's ranged and melee catalogue, read from its Sequencer database in a live world. */
const CATALOGUE = new Set(['range.weapon.arrow.regular.regular', 'range.weapon.arrow.regular.green', 'range.weapon.arrow.physical.blue',
  'range.weapon.bolt.physical.orange', 'range.weapon.bomb.01.black', 'range.weapon.bullet.1.orange', 'range.weapon.bullet.2.orange',
  'range.weapon.bullet.3.blue', 'range.weapon.cannonball.01.black', 'range.weapon.dagger.01.white', 'range.weapon.flask.01.orange',
  'range.weapon.lasershot.01.blue', 'range.weapon.lasershot.01.green', 'range.weapon.lasershot.01.orange', 'range.weapon.lasershot.01.red',
  'range.weapon.lasersword.01.blue', 'range.weapon.lasersword.02.red', 'range.weapon.snipe.01.blue', 'range.weapon.snowball.01.white',
  'range.weapon.missile.01.blue', 'range.weapon.missile.02.white', 'range.weapon.missile.03.white', 'range.weapon.missile.04.purplepink',
  'range.spell.chainlightning.primary.blue', 'range.spell.chainlightning.secondary.blue', 'range.spell.disintegrate.01.green',
  'range.spell.eldritchblast.01.purple', 'range.spell.fireballbeam.01.orange', 'range.spell.firebolt.01.orange',
  'range.spell.guidingbolt.01.yellowblue', 'range.spell.magicmissile.01.purple', 'range.spell.rayoffrost.01.blue',
  'range.spell.scorchingray.01.orange', 'range.spell.witchbolt.01.blue', 'range.generic.conduit.circle.purpleblue',
  'range.generic.energybeam.01.blue', 'range.generic.energybeam.02.blue', 'range.generic.energybeam.03.blue',
  'range.generic.energystrand.01.purple', 'range.generic.iceshard.01.blue', 'range.generic.leaves.01.greenorange',
  'melee.creature.bite.01.red', 'melee.creature.claw.01.red', 'melee.weapon.club.01.white', 'melee.weapon.dagger.01.white',
  'melee.weapon.falchion.01.white', 'melee.weapon.flurryofblows.magical.blue', 'melee.weapon.flurryofblows.physical.blue',
  'melee.weapon.glaive.01.white', 'melee.weapon.greataxe.01.white', 'melee.weapon.greatclub.01.white', 'melee.weapon.greatsword.01.white',
  'melee.weapon.halberd.01.white', 'melee.weapon.hammer.01.white', 'melee.weapon.handaxe.01.white', 'melee.weapon.lasersword.01.blue',
  'melee.weapon.lasersword.02.blue', 'melee.weapon.mace.01.white', 'melee.weapon.mace.02.white', 'melee.weapon.maul.01.white',
  'melee.weapon.rapier.01.white', 'melee.weapon.scimitar.01.white', 'melee.weapon.shortsword.01.white', 'melee.weapon.spear.fire.white',
  'melee.weapon.spear.01.white', 'melee.weapon.sword.01.white', 'melee.weapon.unarmedstrike.magical.blue',
  'melee.weapon.unarmedstrike.physical.blue', 'melee.weapon.warhammer.01.white', 'melee.weapon.wrench.01.white',
  'melee.generic.slashing.01.orange', 'melee.generic.slashing.02.orange', 'melee.generic.slashing.03.orange']);

/** Automated Animations' own default labels (7.1.7), which its merge keeps. */
const DEFAULT_LABELS = ['Crossbow', 'Bow', 'Disintegrate', 'Eldritch Blast', 'Fire Bolt', 'Guiding Bolt', 'Magic Missile', 'Ray of Frost',
  'Scorching Ray', 'Witch Bolt', 'Dagger', 'Flurry of Blows', 'Greataxe', 'Greatclub', 'Greatsword', 'Handaxe', 'Sword', 'Mace', 'Maul', 'Spear',
  'Rapier', 'Unarmed Strike'];

test('every entry: a unique label, a menu, an animation in its catalogue, a bundled sound', () => {
  const labels = ENTRIES.map(([label]) => rinse(label));
  assert.equal(new Set(labels).size, labels.length);
  for (const [label, kind, video, sound, excluded] of ENTRIES) {
    assert.ok(!excluded || (Array.isArray(excluded) && excluded.every(term => typeof term == 'string')), label);
    assert.ok(['melee', 'range'].includes(kind), label);
    assert.ok(CATALOGUE.has(video), `${label}: ${video}`);
    assert.equal(video.split('.')[0], kind, `${label} is in the ${kind} menu but its animation is ${video}`);
    if (sound) {
      assert.ok(fs.existsSync(path.join(here, '..', 'sounds', sound)), `${label}: sounds/${sound}`);
    }

    assert.ok(!DEFAULT_LABELS.some(existing => rinse(existing) == rinse(label)), `${label} would be skipped - its default has it`);
  }
});

test('the menu: its own template per entry, label, animation, sound, version; nothing shared between entries', () => {
  const menu = buildAutorecMenu(5, { newId: () => 'id' });
  assert.equal(menu.version, 5);
  assert.equal(menu.melee.length + menu.range.length, ENTRIES.length);
  const laser = menu.range.find(entry => entry.label == 'Laser');
  assert.deepEqual(Object.keys(laser).filter(key => key != 'id').sort(), Object.keys(TEMPLATES.range).sort());
  assert.equal(laser.menu, 'range');
  assert.equal(laser.primary.video.animation, 'lasershot');
  assert.equal(laser.primary.video.color, 'blue');
  assert.equal(laser.primary.sound.enable, true);
  assert.equal(laser.primary.sound.file, 'modules/essence20-fx/sounds/scifi/laserSmall_000.ogg');
  assert.equal(laser.levels3d.enable, false);
  laser.primary.video.color = 'changed';
  assert.equal(menu.range.find(entry => entry.label == 'Blaster').primary.video.color, 'red');
  assert.ok(menu.melee.every(entry => entry.meleeSwitch));
  const quiet = buildAutorecMenu(5, { sounds: false });
  assert.ok([...quiet.melee, ...quiet.range].every(entry => !entry.primary.sound.enable));
});

test('longest label wins against real Essence20 names', () => {
  const menu = buildAutorecMenu(5);
  const match = name => autorecMatch(menu, [name])?.label ?? null;
  assert.equal(match('Blade Blaster'), 'Blaster');
  assert.equal(match('Red Ranger Laser Sword Effect'), 'Laser Sword');
  assert.equal(match('Long Laser Rifle'), 'Laser');
  assert.equal(match('Close Combat Heavy Bludgeon'), 'Bludgeon');
  assert.equal(match('Grenade Launcher'), 'Launcher');
  assert.equal(match('Frag Grenade'), 'Grenade');
  assert.equal(match('Power Bow'), null);
  // Short labels that would misfire inside longer words.
  assert.equal(match('Cycler Warhead Array'), null);
  assert.equal(match('Null Ray'), 'Ray');
  assert.equal(match('Tricera Shield'), null);
  assert.equal(match('Piezoelectric Explosives'), null);
  assert.equal(match('Ice Flechettes'), 'Flechette');
});

test('most compendium weapons are recognised, by their own name or their weapon effect', { skip: !fs.existsSync(system) && 'Essence20 system not beside this module' }, () => {
  const menu = buildAutorecMenu(5);
  const defaults = { melee: DEFAULT_LABELS.map(label => ({ label })) };
  const names = [];
  for (const pack of fs.readdirSync(system)) {
    const dir = path.join(system, pack, '_source');
    if (!fs.existsSync(dir)) {
      continue;
    }

    for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.json'))) {
      const doc = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (doc.type == 'weapon') {
        names.push(doc.name);
      }
    }
  }

  const matched = names.filter(name => autorecMatch(menu, [name]) || autorecMatch(defaults, [name]));
  assert.ok(names.length > 400);
  assert.ok(matched.length / names.length > 0.6, `${matched.length} of ${names.length} weapons recognised`);
});
