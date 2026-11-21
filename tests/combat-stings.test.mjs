import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HEAL_PATHS, combatEndMoments, combatMoments, healMoments } from '../scripts/moments.mjs';
import { COMBAT, allMomentKeys, momentGroups, presetFor } from '../scripts/presets.mjs';

const actor = { name: 'Red', items: [] };
/** An update from `before` to `after` (only the paths in `after` were touched). */
const change = (before, after) => ({
  actor,
  before,
  has: path => path in after,
  now: path => after[path],
});

test('Health going up heals; going down, or not touched, does not', () => {
  assert.deepEqual(healMoments(change({ [HEAL_PATHS.health]: 2 }, { [HEAL_PATHS.health]: 4 })).map(m => m.key), ['heal.health']);
  assert.deepEqual(healMoments(change({ [HEAL_PATHS.health]: 4 }, { [HEAL_PATHS.health]: 2 })), []);
  assert.deepEqual(healMoments(change({ [HEAL_PATHS.health]: 4 }, {})), []);
  assert.equal(healMoments(change({ [HEAL_PATHS.health]: 2 }, { [HEAL_PATHS.health]: 4 }))[0].source, actor);
});

test('Stun going down is recovery; both together play both', () => {
  assert.deepEqual(healMoments(change({ [HEAL_PATHS.stun]: 3 }, { [HEAL_PATHS.stun]: 0 })).map(m => m.key), ['heal.stun']);
  assert.deepEqual(healMoments(change({ [HEAL_PATHS.stun]: 0 }, { [HEAL_PATHS.stun]: 2 })), []);
  const both = healMoments(change({ [HEAL_PATHS.health]: 1, [HEAL_PATHS.stun]: 2 }, { [HEAL_PATHS.health]: 3, [HEAL_PATHS.stun]: 0 }));
  assert.deepEqual(both.map(m => m.key), ['heal.health', 'heal.stun']);
});

test("a new maximum, a Morph or a Transform moving Health isn't healing; nor is a value with nothing before it", () => {
  for (const path of ['system.health.max', 'system.isMorphed', 'system.isTransformed']) {
    assert.deepEqual(healMoments(change({ [HEAL_PATHS.health]: 2 }, { [HEAL_PATHS.health]: 4, [path]: 1 })), [], path);
  }

  assert.deepEqual(healMoments(change({}, { [HEAL_PATHS.health]: 4 })), []);
  assert.deepEqual(healMoments({ actor: null, has: () => true, now: () => 1 }), []);
});

const red = { name: 'Red', actor, defeated: false, color: '#c62828' };

test('combat starting: Combat! then the first turn, for its owners', () => {
  const moments = combatMoments({ previous: { round: 0 }, current: { round: 1, turn: 0, combatantId: 'a' }, combatant: red, owners: ['u1'] });
  assert.deepEqual(moments.map(m => m.key), ['combat.start', 'combat.turn']);
  assert.ok(moments.every(m => m.screen));
  assert.deepEqual(moments[1].users, ['u1']);
  assert.deepEqual(moments[1].text, { key: 'E20FX.Combat.Turn', data: { name: 'Red' } });
  assert.ok(moments[1].delay > 0, 'the turn waits for the start banner');
  assert.equal(moments[1].color, '#c62828');
});

test("combat starting as Foundry v14 reports it (the same state before and after) is a start", () => {
  const state = { round: 1, turn: 0, combatantId: 'a', tokenId: 't' };
  const moments = combatMoments({ previous: { ...state }, current: { ...state }, combatant: red, owners: ['u1'] });
  assert.deepEqual(moments.map(m => m.key), ['combat.start', 'combat.turn']);
});

test('a new round, and a plain turn', () => {
  const round = combatMoments({ previous: { round: 1, turn: 3, combatantId: 'd' }, current: { round: 2, turn: 0, combatantId: 'a' }, combatant: red, owners: ['u1'] });
  assert.deepEqual(round.map(m => m.key), ['combat.round', 'combat.turn']);
  assert.deepEqual(round[0].text, { key: 'E20FX.Combat.Round', data: { round: 2 } });

  const turn = combatMoments({ previous: { round: 2, turn: 0, combatantId: 'a' }, current: { round: 2, turn: 1, combatantId: 'b' }, combatant: red, owners: ['u1'] });
  assert.deepEqual(turn.map(m => m.key), ['combat.turn']);
  assert.equal(turn[0].delay, 0);
});

test('no "Your turn" for an NPC, a Defeated combatant, or nobody up; nothing before combat starts', () => {
  const step = { previous: { round: 2, turn: 0, combatantId: 'a' }, current: { round: 2, turn: 1, combatantId: 'b' } };
  assert.deepEqual(combatMoments({ ...step, combatant: red, owners: [] }), []);
  assert.deepEqual(combatMoments({ ...step, combatant: { ...red, defeated: true }, owners: ['u1'] }), []);
  assert.deepEqual(combatMoments({ ...step, combatant: null, owners: ['u1'] }), []);
  assert.deepEqual(combatMoments({ previous: { round: 0 }, current: { round: 0 } }), []);
});

test('stepping back a round plays the turn but no round banner', () => {
  const back = combatMoments({ previous: { round: 3, turn: 0, combatantId: 'a' }, current: { round: 2, turn: 4, combatantId: 'e' }, combatant: red, owners: ['u1'] });
  assert.deepEqual(back.map(m => m.key), ['combat.turn']);
});

test('combat ending plays only for a combat that had started', () => {
  assert.deepEqual(combatEndMoments({ started: true }).map(m => m.key), ['combat.end']);
  assert.deepEqual(combatEndMoments({ started: false }), []);
});

test('the new moments have presets and are listed in Configure FX', () => {
  for (const key of ['heal.health', 'heal.stun', ...Object.keys(COMBAT)]) {
    assert.ok(presetFor(key), key);
    assert.ok(allMomentKeys().includes(key), key);
  }

  assert.deepEqual(momentGroups().find(group => group.id == 'combat').keys, Object.keys(COMBAT));
  for (const key of Object.keys(COMBAT)) {
    assert.ok(presetFor(key).banner?.size > 0, `${key} has a banner`);
  }

  assert.equal(presetFor('heal.health', { line: 'transformers' }).overlay, 'jb2a.healing_generic.400px.blue');
});
