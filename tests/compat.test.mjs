import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WATCHED, actorEvents, isLegacySystem, naturalTwenty, rollFromCard } from '../scripts/compat-core.mjs';

test('6.0.4 and older are legacy; 6.0.5, later and development copies are not', () => {
  assert.equal(isLegacySystem('6.0.4'), true);
  assert.equal(isLegacySystem('6.0.4-beta'), true);
  assert.equal(isLegacySystem('5.9.9'), true);
  assert.equal(isLegacySystem('6.0.5'), false);
  assert.equal(isLegacySystem('6.0.5-beta'), false);
  assert.equal(isLegacySystem('6.1.0'), false);
  assert.equal(isLegacySystem('7.0.0'), false);
  assert.equal(isLegacySystem('This is auto replaced'), false);
  assert.equal(isLegacySystem(undefined), false);
});

test("a 6.0.4 roll card becomes the roll the hook would have announced", () => {
  const red = { name: 'Red' };
  const putty = { name: 'Putty' };
  const blaster = { type: 'weaponEffect', system: { damageType: 'laser', classification: { style: 'energy' } } };
  const targets = { 'Scene.s.Token.t': putty };
  const roll = rollFromCard({ skill: 'targeting', checkResults: [{ targetUuid: 'Scene.s.Token.t', success: true }, { targetUuid: 'gone', success: false }], isFumble: false },
    { actor: red, item: blaster, targetOf: uuid => targets[uuid] ?? null, natural20: true });
  assert.deepEqual(roll, { actor: red, item: blaster, skill: 'targeting', isAttack: true, isMelee: false, style: 'energy', damageType: 'laser', isCrit: true, isFumble: false, targets: [{ actor: putty, hit: true }] });
  const swing = rollFromCard({ checkResults: [], isMeleeAttack: true, isFumble: true }, { actor: red, item: { type: 'weaponEffect', system: {} }, natural20: true });
  assert.equal(swing.isMelee, true);
  assert.equal(swing.isFumble, true);
  assert.equal(swing.isCrit, false);
  assert.equal(rollFromCard({ skill: 'spellcasting' }, { actor: red }).skill, 'spellcasting');
  assert.equal(rollFromCard({ skill: 'spellcasting' }, { actor: red }).isAttack, false);
  assert.equal(rollFromCard({}, { actor: red }), null);
  assert.equal(rollFromCard(null, { actor: red }), null);
  assert.equal(rollFromCard({ skill: 'athletics' }, {}), null);
});

test("a natural 20 on the kept d20", () => {
  assert.equal(naturalTwenty({ dice: [{ faces: 20, results: [{ result: 20, active: true }] }] }), true);
  assert.equal(naturalTwenty({ dice: [{ faces: 20, results: [{ result: 20, active: false }, { result: 7, active: true }] }] }), false);
  assert.equal(naturalTwenty({ dice: [{ faces: 6, results: [{ result: 20 }] }] }), false);
  assert.equal(naturalTwenty(null), false);
});

test("an actor update becomes the events 6.0.5 would have fired", () => {
  const values = { 'system.isMorphed': true, [WATCHED.energon]: 3, [WATCHED.health]: 6, [WATCHED.stun]: 2 };
  const touched = new Set(Object.keys(values));
  const events = actorEvents({
    has: path => touched.has(path), now: path => values[path],
    before: { [WATCHED.energon]: 5, [WATCHED.health]: 10, [WATCHED.stun]: 0 }, type: 'playerCharacter',
  });
  assert.deepEqual(events, [
    { event: 'morph' },
    { event: 'resourceSpent', vars: { resource: 'energon', spent: 2 } },
    { event: 'takesDamage', damage: { amount: 4, damageType: null } },
    { event: 'takesDamage', damage: { amount: 2, damageType: 'stun' } },
  ]);
  // Healing, gaining Energon, and untouched values say nothing.
  assert.deepEqual(actorEvents({ has: () => true, now: () => 10, before: { [WATCHED.health]: 5, [WATCHED.energon]: 1 }, type: 'npc' })
    .filter(e => e.event != 'morph' && e.event != 'transform'), []);
  assert.deepEqual(actorEvents({ has: path => path == 'system.isTransformed', now: () => false, type: 'playerCharacter' }), [{ event: 'untransform' }]);
  assert.deepEqual(actorEvents({ has: path => path == 'system.actors', now: () => null, type: 'megaform', participants: 3 }), [{ event: 'megaformCombined', vars: { participants: 3 } }]);
  assert.deepEqual(actorEvents({ has: path => path == 'system.actors', now: () => null, type: 'zord' }), []);
});
