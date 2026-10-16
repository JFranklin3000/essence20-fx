import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAttackCard, muteAAAttackCards } from '../scripts/aa-bridge.mjs';

/** Foundry's Hooks.events shape: { hook: [{hook, id, fn, once}] }. */
function hooksWith(...fns) {
  return { events: { createChatMessage: fns.map((fn, id) => ({ hook: 'createChatMessage', id, fn, once: false })) } };
}

test("Automated Animations' chat-card listener skips attack cards while Essence20 FX handles attacks", () => {
  const seen = [];
  const other = [];
  // As Automated Animations registers it (its unsupported-system fallback).
  const aa = async msg => {
    seen.push(msg.id);
    checkChatMessage$1(msg);
  };
  const checkChatMessage$1 = () => {};
  const mine = msg => other.push(msg.id);
  const hooks = hooksWith(aa, mine);
  let handling = true;

  assert.equal(muteAAAttackCards(() => handling, hooks), 1);
  assert.equal(muteAAAttackCards(() => handling, hooks), 0, 'wrapped once');

  const attack = { id: 'atk', flags: { essence20: { isAttack: true, itemUuid: 'Actor.a.Item.e' } } };
  const shown = { id: 'info', flags: { essence20: {} } };
  for (const entry of hooks.events.createChatMessage) {
    entry.fn(attack);
    entry.fn(shown);
  }

  assert.deepEqual(seen, ['info']);
  assert.deepEqual(other, ['atk', 'info'], 'other listeners untouched');

  // Combat animations off: Automated Animations animates the attack card itself, as it would without Essence20 FX.
  handling = false;
  hooks.events.createChatMessage[0].fn(attack);
  assert.deepEqual(seen, ['info', 'atk']);
});

test('isAttackCard; no Hooks at all is fine', () => {
  assert.equal(isAttackCard({ flags: { essence20: { isAttack: true } } }), true);
  assert.equal(isAttackCard({ flags: {} }), false);
  assert.equal(isAttackCard(null), false);
  assert.equal(muteAAAttackCards(() => true, {}), 0);
});
