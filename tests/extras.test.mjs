import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEFAULT_SLOTS, factionKey, matchFolder, pickEmblem } from '../scripts/emblem-match.mjs';
import { AMBIENT, ambientKey, ambientName, wantedAmbient } from '../scripts/ambient-state.mjs';
import { COLORSETS, colorsetFor, customColorset, emblemD20Labels } from '../scripts/dice-sets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const jb2aScript = path.join(here, '..', '..', 'JB2A_DnD5e', 'scripts', 'jb2a_sequencer.js');

test('faction names match however they are written', () => {
  assert.equal(factionKey('Autobots'), 'autobot');
  assert.equal(factionKey('AUTOBOT'), 'autobot');
  assert.equal(factionKey('G.I. Joe'), 'gijoe');
  assert.equal(factionKey('gi-joe.webp'), 'gijoe');
  assert.equal(factionKey('Cobra!'), 'cobra');
  assert.equal(factionKey('Decepticons'), 'decepticon');
  assert.equal(factionKey('Bus'), 'bus');
  assert.deepEqual(DEFAULT_SLOTS, ['Autobot', 'Decepticon', 'G.I. Joe', 'Cobra']);
});

test("an actor's emblem: its own choice, then its Faction item, then its folder - only slots with an image", () => {
  const slots = [{ name: 'Autobot', img: 'a.webp' }, { name: 'Cobra', img: 'c.webp' }, { name: 'Decepticon', img: '' }];
  assert.equal(pickEmblem(slots, { factionNames: ['Autobots'] }).img, 'a.webp');
  assert.equal(pickEmblem(slots, { override: 'Cobra', factionNames: ['Autobots'] }).img, 'c.webp');
  assert.equal(pickEmblem(slots, { override: 'none', factionNames: ['Autobots'] }), null);
  assert.equal(pickEmblem(slots, { folderNames: ['Vipers', 'Cobra'] }).img, 'c.webp');
  assert.equal(pickEmblem(slots, { factionNames: ['Decepticons'] }), null);
  assert.equal(pickEmblem(slots, {}), null);
});

test("a folder's files fill the slots named for them", () => {
  const { slots, unmatched } = matchFolder([{ name: 'Autobot', img: '' }, { name: 'G.I. Joe', img: 'old.png' }], ['art/autobots.webp', 'art/GI%20Joe.png', 'art/zarana.png']);
  assert.equal(slots[0].img, 'art/autobots.webp');
  assert.equal(slots[1].img, 'art/GI%20Joe.png');
  assert.deepEqual(unmatched, ['art/zarana.png']);
});

test('ambient effects follow the state, each kind switched on its own', () => {
  const all = { states: true, conditions: true, active: true, emblems: true };
  const ranger = { type: 'playerCharacter', system: { isMorphed: true }, statuses: new Set(['stunned', 'cover']) };
  assert.deepEqual(wantedAmbient(ranger, { show: all }), ['morphed', 'condition.stunned']);
  assert.deepEqual(wantedAmbient(ranger, { show: { conditions: true } }), ['condition.stunned']);
  assert.deepEqual(wantedAmbient(ranger, { active: true, emblem: { img: 'x.webp' }, show: all }), ['active', 'morphed', 'condition.stunned', 'emblem']);
  assert.deepEqual(wantedAmbient(ranger, { active: true, show: { states: true } }), ['morphed']);
  const downed = { type: 'npc', system: {}, statuses: new Set(['defeated', 'stunned']) };
  assert.deepEqual(wantedAmbient(downed, { show: all }), ['defeated']);
  assert.deepEqual(wantedAmbient({ type: 'zord', system: {}, statuses: [] }, { show: all }), ['zord']);
  const form = actors => ({ type: 'megaform', system: { actors }, statuses: new Set() });
  assert.deepEqual(wantedAmbient(form({ a: { uuid: 'x' }, b: { uuid: 'y' } }), { show: all }), ['megaform']);
  assert.deepEqual(wantedAmbient(form({ a: { uuid: 'x' }, b: null }), { show: all }), []);
  assert.deepEqual(wantedAmbient(ranger, { emblem: { img: '' }, show: all }), ['morphed', 'condition.stunned']);
  assert.deepEqual(wantedAmbient(null, { show: all }), []);
});

test('ambient names round-trip, and only ours', () => {
  assert.equal(ambientKey(ambientName('condition.stunned', 'tok1'), 'tok1'), 'condition.stunned');
  assert.equal(ambientKey(ambientName('morphed', 'tok1'), 'tok2'), null);
  assert.equal(ambientKey('someone-elses-effect', 'tok1'), null);
});

test("dice: a Ranger's own colour, a faction's, a line's - or the player's own choice", () => {
  assert.equal(colorsetFor({ line: 'powerRangers', color: '#FF2200' }).name, 'e20-actor-ff2200');
  assert.equal(colorsetFor({ line: 'powerRangers', color: '#b5b1b1' }), null);
  assert.equal(colorsetFor({ line: 'transformers', faction: 'autobot', color: '#ff2200' }), 'e20-autobot');
  assert.equal(colorsetFor({ faction: 'gijoe' }), 'e20-joe');
  assert.equal(colorsetFor({ line: 'myLittlePony' }), 'e20-pony');
  assert.equal(colorsetFor({ line: 'giJoe' }), null);
  assert.equal(customColorset('#ABCDEF').background, '#abcdef');
  assert.equal(new Set(COLORSETS.map(set => set.name)).size, COLORSETS.length);
  assert.ok(COLORSETS.every(set => set.name.startsWith('e20-') && set.category == 'Essence20'));
  const labels = emblemD20Labels('emblems/cobra.webp');
  assert.equal(labels.length, 20);
  assert.equal(labels[0], '1');
  assert.equal(labels[19], 'emblems/cobra.webp');
});

test('every ambient animation is in the free JB2A database', { skip: !fs.existsSync(jb2aScript) && 'JB2A_DnD5e not installed' }, async () => {
  const { jb2aFreeDatabase, freeDatabase } = await import(pathToFileURL(jb2aScript).href);
  await jb2aFreeDatabase('modules');
  const exists = dbPath => dbPath.split('.').slice(1).reduce((node, part) => node?.[part], freeDatabase) !== undefined;
  assert.deepEqual(Object.values(AMBIENT).map(look => look.file).filter(Boolean).filter(file => !exists(file)), []);
});

test('scene ambience: copies scale with the scene, land inside it, and land the same way every time', async () => {
  const { AMBIENCES, MAX_PER_LAYER, ambiencePlan } = await import('../scripts/scene-ambience-plan.mjs');
  const rect = { x: 100, y: 200, width: 3000, height: 2000 };
  const plan = ambiencePlan('battlefield', rect, 'scene1');
  assert.equal(plan.length, 6 + 4);
  assert.ok(plan.every(spot => spot.x >= 100 && spot.x <= 3100 && spot.y >= 200 && spot.y <= 2200));
  assert.deepEqual(ambiencePlan('battlefield', rect, 'scene1'), plan);
  assert.notDeepEqual(ambiencePlan('battlefield', rect, 'scene2'), plan);
  assert.equal(ambiencePlan('fog', { x: 0, y: 0, width: 100, height: 100 }, 's').length, 1);
  assert.equal(ambiencePlan('energon', { x: 0, y: 0, width: 50000, height: 50000 }, 's').length, MAX_PER_LAYER);
  assert.ok(ambiencePlan('nightvale', rect, 's').some(spot => spot.tint) && ambiencePlan('nightvale', rect, 's').some(spot => spot.shift));
  assert.deepEqual(ambiencePlan('nope', rect, 's'), []);
  assert.deepEqual(ambiencePlan('fog', { x: 0, y: 0, width: 0, height: 0 }, 's'), []);
  const lang = JSON.parse(fs.readFileSync(path.join(here, '..', 'languages', 'en.json'), 'utf8'));
  for (const key of Object.keys(AMBIENCES)) {
    assert.ok(lang.E20FX.SceneAmbience.Looks[key], `label for ${key}`);
  }
});

test('every scene ambience animation is in the free JB2A database', { skip: !fs.existsSync(jb2aScript) && 'JB2A_DnD5e not installed' }, async () => {
  const { AMBIENCES } = await import('../scripts/scene-ambience-plan.mjs');
  const { jb2aFreeDatabase, freeDatabase } = await import(pathToFileURL(jb2aScript).href);
  await jb2aFreeDatabase('modules');
  const exists = dbPath => dbPath.split('.').slice(1).reduce((node, part) => node?.[part], freeDatabase) !== undefined;
  assert.deepEqual(Object.values(AMBIENCES).flat().map(layer => layer.file).filter(file => !exists(file)), []);
});
