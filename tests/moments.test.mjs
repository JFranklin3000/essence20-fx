import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowed, AREA_WINDOW, areaFor, colorShift, eventMoments, lineOf, MAX_TARGETS, rollMoments, signatureMoments, skillMoments, zordMoments } from '../scripts/moments.mjs';

const red = { name: 'Red', uuid: 'Actor.red' };
const putty = { name: 'Putty' };
const goldar = { name: 'Goldar' };

test('a ranged hit, a miss and a melee Critical', () => {
  assert.deepEqual(rollMoments({ actor: red, isAttack: true, damageType: 'laser', targets: [{ actor: putty, hit: true }, { actor: goldar, hit: false }] }).map(m => m.key),
    ['attack.ranged.hit', 'attack.ranged.miss']);
  const [crit] = rollMoments({ actor: red, isAttack: true, isMelee: true, isCrit: true, damageType: 'fire', targets: [{ actor: putty, hit: true }] });
  assert.equal(crit.key, 'attack.melee.critical');
  assert.equal(crit.source, red);
  assert.equal(crit.target, putty);
  assert.equal(crit.damageType, 'fire');
});

test('a Fumble is one moment on the attacker, whatever the targets', () => {
  assert.deepEqual(rollMoments({ actor: red, isAttack: true, isFumble: true, targets: [{ actor: putty, hit: false }] }), [{ key: 'attack.fumble', source: red }]);
});

test('not an attack, or no actor: nothing', () => {
  assert.deepEqual(rollMoments({ actor: red, isAttack: false, targets: [{ actor: putty, hit: true }] }), []);
  assert.deepEqual(rollMoments({ isAttack: true, targets: [{ actor: putty, hit: true }] }), []);
  assert.deepEqual(rollMoments(), []);
});

test('a target row without an actor is skipped, and a crowd is capped', () => {
  assert.deepEqual(rollMoments({ actor: red, isAttack: true, targets: [{ hit: true }, null] }), []);
  const crowd = Array.from({ length: MAX_TARGETS + 4 }, () => ({ actor: putty, hit: true }));
  assert.equal(rollMoments({ actor: red, isAttack: true, targets: crowd }).length, MAX_TARGETS);
});

test('an area roll: the burst, then an impact on each target hit - a spell with an area too', () => {
  const area = { shape: 'cone', actor: red };
  const moments = rollMoments({ actor: red, isAttack: false, damageType: 'cold', targets: [{ actor: putty, hit: true }, { actor: goldar, hit: false }] }, area);
  assert.deepEqual(moments.map(m => m.key), ['area.cone', 'attack.area.hit']);
  assert.equal(moments[0].area, area);
  assert.equal(moments[1].target, putty);
});

test('an area belongs to the next roll by the same actor and item, for a while', () => {
  const item = { uuid: 'Item.blaster' };
  const area = { actor: red, item, at: 1000 };
  assert.ok(areaFor(area, { actor: red, item }, 2000));
  assert.ok(areaFor(area, { actor: { uuid: 'Actor.red' }, item: { uuid: 'Item.blaster' } }, 2000));
  assert.ok(!areaFor(area, { actor: goldar, item }, 2000));
  assert.ok(!areaFor(area, { actor: red, item: { uuid: 'Item.other' } }, 2000));
  assert.ok(!areaFor(area, { actor: red, item }, 1000 + AREA_WINDOW + 1));
  assert.ok(!areaFor(null, { actor: red }, 0));
});

test('damage taken, Defeated and Conditions from the rules events', () => {
  assert.deepEqual(eventMoments({ actor: red, event: 'takesDamage', damage: { amount: 3, damageType: 'fire' } }), [{ key: 'damage.taken', source: red, damageType: 'fire' }]);
  assert.deepEqual(eventMoments({ actor: red, event: 'takesDamage', damage: { amount: 0 } }), []);
  assert.deepEqual(eventMoments({ actor: red, event: 'defeated' }), [{ key: 'damage.defeated', source: red }]);
  assert.deepEqual(eventMoments({ actor: red, event: 'conditionGained', vars: { statuses: ['stunned', 'defeated'] } }).map(m => m.key), ['condition.stunned']);
  assert.deepEqual(eventMoments({ actor: red, event: 'turnStart' }), []);
  assert.deepEqual(eventMoments({ event: 'defeated' }), []);
});

test('the burst limit lets a few through per second and forgets old ones', () => {
  const history = [];
  assert.equal(allowed(history, 5, 0, { max: 6 }), 5);
  assert.equal(allowed(history, 5, 500, { max: 6 }), 1);
  assert.equal(allowed(history, 5, 1600, { max: 6 }), 5);
});

test('Morph carries the Ranger colour; Transform, Energon and the rest', () => {
  const pink = { uuid: 'Actor.pink', system: { color: '#ff69b4' } };
  assert.deepEqual(signatureMoments({ actor: pink, event: 'morph' }), [{ key: 'morph', source: pink, color: '#ff69b4' }]);
  assert.equal(signatureMoments({ actor: pink, event: 'unmorph' })[0].key, 'unmorph');
  assert.deepEqual(signatureMoments({ actor: red, event: 'transform' }), [{ key: 'transform', source: red }]);
  assert.equal(signatureMoments({ actor: red, event: 'resourceSpent', vars: { resource: 'energon' } })[0].key, 'energon.spent');
  assert.equal(signatureMoments({ actor: red, event: 'resourceSpent', vars: { resource: 'darkEnergon' } })[0].key, 'energon.spent');
  assert.deepEqual(signatureMoments({ actor: red, event: 'resourceSpent', vars: { resource: 'health' } }), []);
  assert.deepEqual(signatureMoments({ event: 'morph' }), []);
  // A Foundry Color is a Number whose String() is the hex.
  const colour = Object.assign(new Number(0xff0000), { toString: () => '#ff0000' });
  assert.equal(signatureMoments({ actor: { system: { color: colour } }, event: 'morph' })[0].color, '#ff0000');
});

test('a Megaform forms when its roster grows to 2 or more - not when it shrinks or breaks apart', () => {
  const form = { uuid: 'Actor.megazord' };
  const counts = new Map();
  const formed = n => signatureMoments({ actor: form, event: 'megaformCombined', vars: { participants: n } }, counts).length == 1;
  assert.equal(formed(1), false);
  assert.equal(formed(2), true);
  assert.equal(formed(3), true);
  assert.equal(formed(2), false);
  assert.equal(formed(0), false);
  assert.equal(formed(5), true);
});

test('the Zord hooks: tokens leaving the map play where they stood', () => {
  const zord = { name: 'Tyranno' };
  assert.deepEqual(zordMoments('zordSummoned', { zord, ranger: red }), [{ key: 'zord.summoned', source: red }]);
  assert.deepEqual(zordMoments('zordArrived', { zord }), [{ key: 'zord.arrived', soundOnly: true }]);
  assert.deepEqual(zordMoments('zordRecalled', { zord, zordToken: { x: 100, y: 200, width: 2, height: 2 } }, 100),
    [{ key: 'zord.recalled', at: { x: 200, y: 300, w: 200 } }]);
  assert.deepEqual(zordMoments('zordBoarded', { zord, ranger: red, rangerToken: { x: 0, y: 0 } }), [{ key: 'zord.boarded', at: { x: 50, y: 50, w: 100 } }]);
  assert.deepEqual(zordMoments('zordBoarded', { zord, ranger: red, rangerToken: null }), []);
  assert.equal(zordMoments('zordPlaced', { zord, token: { x: 0, y: 0, width: 3, height: 3 } })[0].at.w, 300);
  assert.deepEqual(zordMoments('megaformSplit', { form: zord }), [{ key: 'megaform.split', source: zord }]);
  assert.deepEqual(zordMoments('somethingElse', {}), []);
});

test('a Ranger colour turns JB2A blue by hue; greys are drained and lightened or darkened', () => {
  assert.equal(colorShift('#0000ff').hue, 30);
  assert.equal(colorShift('#ff0000').hue, 150);
  assert.equal(colorShift('#00ff00').hue, -90);
  assert.equal(colorShift('#3d85ff', 210).hue, 8);
  assert.deepEqual(colorShift('#ffffff'), { saturate: -1, brightness: 1.5 });
  assert.deepEqual(colorShift('#111111'), { saturate: -1, brightness: 0.45 });
  assert.equal(colorShift('not a colour'), null);
  assert.equal(colorShift(null), null);
});

test("an actor's game line is its Role's", () => {
  assert.equal(lineOf({ items: [{ type: 'perk' }, { type: 'role', system: { version: 'myLittlePony' } }] }), 'myLittlePony');
  assert.equal(lineOf({ items: [] }), null);
  assert.equal(lineOf(null), null);
  // No Role: the world's game line.
  globalThis.game = { settings: { get: (scope, key) => (scope == 'essence20' && key == 'gameLine' ? 'welcomeToNightVale' : null) } };
  try {
    assert.equal(lineOf({ items: [] }), 'welcomeToNightVale');
    assert.equal(lineOf({ items: [{ type: 'role', system: { version: 'giJoe' } }] }), 'giJoe');
  } finally {
    delete globalThis.game;
  }
});

test('Spellcasting sparkles in the caster colour, the Weird crackles - not on a Fumble', () => {
  const pony = { uuid: 'Actor.pony', system: { color: '#aa44ff' }, items: [{ type: 'role', system: { version: 'myLittlePony' } }] };
  assert.deepEqual(skillMoments({ actor: pony, skill: 'spellcasting' }), [{ key: 'spell.cast', source: pony, color: '#aa44ff', line: 'myLittlePony' }]);
  assert.equal(skillMoments({ actor: red, skill: 'weird' })[0].key, 'weird.used');
  assert.deepEqual(skillMoments({ actor: red, skill: 'athletics' }), []);
  assert.deepEqual(skillMoments({ actor: red, skill: 'spellcasting', isFumble: true }), []);
});

test("the weapon's style rides along on attack and area moments", () => {
  assert.equal(rollMoments({ actor: red, isAttack: true, style: 'explosive', targets: [{ actor: putty, hit: true }] })[0].style, 'explosive');
  assert.ok(rollMoments({ actor: red, isAttack: true, style: 'explosive', targets: [{ actor: putty, hit: true }] }, { shape: 'circle', actor: red }).every(mo => mo.style == 'explosive'));
});

test('Story Points, help from a teammate, rerolls and Requisitions', () => {
  assert.equal(signatureMoments({ actor: red, event: 'storyPointSpent' })[0].key, 'storyPoint.spent');
  assert.deepEqual(signatureMoments({ actor: putty, event: 'assisted', targets: [red] }), [{ key: 'assist.given', source: putty, line: null }]);
  assert.equal(signatureMoments({ actor: red, event: 'rerolled' })[0].key, 'rerolled');
  assert.deepEqual(zordMoments('requisitionGranted', { member: red, item: {} }), [{ key: 'requisition.granted', source: red }]);
  assert.deepEqual(zordMoments('requisitionGranted', {}), []);
});
