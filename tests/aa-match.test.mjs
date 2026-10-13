import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aaWouldAnimate, autorecMatch, rinse } from '../scripts/aa-match.mjs';

const menus = {
  range: [{ label: 'Laser' }, { label: 'Laser Rifle' }, { label: 'Bow', advanced: { excludedTerms: ['rainbow'] } }],
  melee: [{ label: 'Sword' }, { label: 'Blade', advanced: { exactMatch: true } }],
  aefx: [{ label: 'Lightspeed' }],
};

test("its rinse: spaces out, lower case", () => {
  assert.equal(rinse('Blade Blaster  Effect'), 'bladeblastereffect');
});

test('the longest label contained in the name wins; exact-match labels only match the whole name', () => {
  assert.equal(autorecMatch(menus, ['Heavy Laser Rifle Effect']).label, 'Laser Rifle');
  assert.equal(autorecMatch(menus, ['Lightspeed Rescue Laser Effect']).label, 'Laser');
  assert.equal(autorecMatch(menus, ['Blade Blaster']), null);
  assert.equal(autorecMatch(menus, ['Blade']).label, 'Blade');
  assert.equal(autorecMatch(menus, ['Crossbow']).label, 'Bow');
  assert.equal(autorecMatch(menus, ['Rainbow Bow']), null);
  assert.equal(autorecMatch(menus, ['Lightspeed thing']), null);
});

test("names are tried in order - the weapon effect's, then its weapon's", () => {
  assert.equal(autorecMatch(menus, ['Power Effect', 'Blade Sword']).label, 'Sword');
  assert.equal(autorecMatch(menus, ['', undefined, 'Sword']).label, 'Sword');
  assert.equal(autorecMatch({}, ['Sword']), null);
});

test("the item's own settings come first, then its menus unless they're turned off", () => {
  assert.equal(aaWouldAnimate({ flags: { isCustomized: true }, names: ['Nothing'] }), true);
  assert.equal(aaWouldAnimate({ flags: { killAnim: true, isCustomized: true }, names: ['Sword'], menus }), false);
  assert.equal(aaWouldAnimate({ flags: { isEnabled: false }, names: ['Sword'], menus }), false);
  assert.equal(aaWouldAnimate({ names: ['Sword'], menus }), true);
  assert.equal(aaWouldAnimate({ names: ['Sword'], menus, autorecDisabled: true }), false);
  assert.equal(aaWouldAnimate({ names: ['Mystery'], menus }), false);
  assert.equal(aaWouldAnimate(), false);
});
