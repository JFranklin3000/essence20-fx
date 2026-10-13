import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { allAnimationPaths, allSoundFiles, CONDITIONS, DAMAGE, GENERIC, LINES, MOMENTS, PATREON, presetFor, STYLES } from '../scripts/presets.mjs';
import { areaEnd, areaPlacement } from '../scripts/play.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sounds = path.join(here, '..', 'sounds');
const jb2aScript = path.join(here, '..', '..', 'JB2A_DnD5e', 'scripts', 'jb2a_sequencer.js');

test('presetFor copies the preset, and applies Patreon swaps only when asked', () => {
  const preset = presetFor('attack.ranged.hit');
  preset.impact = 'changed';
  assert.notEqual(GENERIC['attack.ranged.hit'].impact, 'changed');
  assert.equal(presetFor('no.such.moment'), null);

  PATREON['attack.ranged.hit'] = { impact: 'jb2a.patreon.thing' };
  try {
    assert.equal(presetFor('attack.ranged.hit', { patreon: true }).impact, 'jb2a.patreon.thing');
    assert.equal(presetFor('attack.ranged.hit').impact, GENERIC['attack.ranged.hit'].impact);
  } finally {
    delete PATREON['attack.ranged.hit'];
  }
});

test('a damage type changes the look of its style only, and keeps the Critical label', () => {
  assert.equal(presetFor('attack.ranged.hit', { damageType: 'fire' }).projectile, DAMAGE.fire.ranged.projectile);
  assert.equal(presetFor('attack.melee.hit', { damageType: 'fire' }).swing, GENERIC['attack.melee.hit'].swing);
  assert.equal(presetFor('attack.melee.hit', { damageType: 'fire' }).impact, DAMAGE.fire.melee.impact);
  assert.equal(presetFor('attack.ranged.critical', { damageType: 'cold' }).overlay, GENERIC['attack.ranged.critical'].overlay);
  assert.equal(presetFor('attack.ranged.hit', { damageType: 'laser' }).projectile, GENERIC['attack.ranged.hit'].projectile);
  assert.equal(presetFor('attack.ranged.hit', { damageType: 'nonsense' }).projectile, GENERIC['attack.ranged.hit'].projectile);
});

test('areas, damage flashes and Conditions', () => {
  assert.equal(presetFor('area.cone', { damageType: 'cold' }).area, DAMAGE.cold.area.cone);
  assert.equal(presetFor('area.cone', { damageType: 'psychic' }).area, GENERIC['area.cone'].area);
  assert.equal(presetFor('damage.taken', { damageType: 'fire' }).flash, DAMAGE.fire.flash);
  assert.equal(presetFor('damage.taken').flash, GENERIC['damage.taken'].flash);
  assert.equal(presetFor('condition.stunned').overlay, CONDITIONS.stunned.overlay);
  assert.equal(presetFor('condition.cover'), null);
});

test('weapon styles: bullets under the damage type, explosives over it', () => {
  assert.equal(presetFor('attack.ranged.hit', { style: 'projectile' }).projectile, STYLES.projectile.ranged.projectile);
  assert.equal(presetFor('attack.ranged.hit', { style: 'projectile', damageType: 'fire' }).projectile, DAMAGE.fire.ranged.projectile);
  assert.equal(presetFor('attack.ranged.hit', { style: 'explosive', damageType: 'fire' }).impact, STYLES.explosive.ranged.impact);
  assert.equal(presetFor('attack.ranged.hit', { style: 'energy' }).projectile, GENERIC['attack.ranged.hit'].projectile);
  assert.equal(presetFor('area.circle', { style: 'explosive', damageType: 'fire' }).area, STYLES.explosive.area.circle);
  assert.equal(presetFor('area.cone', { style: 'explosive', damageType: 'fire' }).area, DAMAGE.fire.area.cone);
  assert.equal(presetFor('attack.area.hit', { style: 'explosive' }).circle, undefined);
  assert.equal(presetFor('attack.melee.hit', { style: 'explosive' }).swing, GENERIC['attack.melee.hit'].swing);
});

test("a game line's own look replaces the shared one for its actors", () => {
  assert.equal(presetFor('assist.given', { line: 'myLittlePony' }).overlay, LINES.myLittlePony['assist.given'].overlay);
  assert.equal(presetFor('assist.given', { line: 'giJoe' }).overlay, MOMENTS['assist.given'].overlay);
  assert.equal(presetFor('assist.given').overlay, MOMENTS['assist.given'].overlay);
  assert.equal(presetFor('rerolled', { line: 'welcomeToNightVale' }).overlay, LINES.welcomeToNightVale.rerolled.overlay);
});

test('where an area burst goes', () => {
  const end = areaEnd({ x: 100, y: 100, rotation: 90 }, 300);
  assert.ok(Math.abs(end.x - 100) < 1e-9 && Math.abs(end.y - 400) < 1e-9);
  assert.deepEqual(areaPlacement({ shape: 'circle', shapeData: { x: 50, y: 60, radius: 200 } }), { at: { x: 50, y: 60 }, size: 400 });
  assert.deepEqual(areaPlacement({ shape: 'line', shapeData: { x: 0, y: 0, length: 500, rotation: 0 } }), { at: { x: 0, y: 0 }, to: { x: 500, y: 0 } });
  assert.deepEqual(areaPlacement({ shape: 'emanation', shapeData: { radius: 100 } }, { w: 100, h: 200, center: { x: 5, y: 6 } }), { at: { x: 5, y: 6 }, size: 400 });
  assert.equal(areaPlacement({ shape: 'emanation', shapeData: { radius: 100 } }), null);
  assert.equal(areaPlacement({ shape: 'circle', shapeData: {} }), null);
});

test('every preset sound is a file in sounds/', () => {
  for (const file of allSoundFiles()) {
    assert.ok(fs.existsSync(path.join(sounds, file)), `sounds/${file}`);
  }
});

// Needs the free JB2A module installed beside this one (modules/JB2A_DnD5e) - skipped otherwise.
test('every preset animation is in the free JB2A database', { skip: !fs.existsSync(jb2aScript) && 'JB2A_DnD5e not installed' }, async () => {
  const { jb2aFreeDatabase, freeDatabase } = await import(pathToFileURL(jb2aScript).href);
  await jb2aFreeDatabase('modules');
  const exists = dbPath => dbPath.split('.').slice(1).reduce((node, part) => node?.[part], freeDatabase) !== undefined;
  const missing = allAnimationPaths().filter(dbPath => !exists(dbPath));
  assert.deepEqual(missing, []);
});

test("teleports: a generic flash there and here, a Ranger's streak in their colour, a Cybertronian's bridge", () => {
  const generic = presetFor('teleport');
  assert.ok(generic.depart && generic.overlay && !generic.streak);
  const ranger = presetFor('teleport', { line: 'powerRangers' });
  assert.equal(ranger.streak, 'jb2a.teleport.01.blue');
  assert.equal(ranger.recolor, true);
  assert.match(presetFor('teleport', { line: 'transformers' }).depart, /portals/);
  assert.ok(presetFor('teleport', { line: 'myLittlePony' }).depart);
  assert.equal(presetFor('teleport', { line: 'giJoe' }).depart, generic.depart);
  assert.ok(allAnimationPaths().includes('jb2a.teleport.01.blue'));
  assert.ok(allAnimationPaths().includes('jb2a.portals.horizontal.ring.bright_yellow'));
});
