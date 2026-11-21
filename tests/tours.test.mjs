import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { APP_KEYS, TOURS, fxTourClass, registerTourHooks } = await import('../scripts/tours.mjs');
const { MODULE_ID } = await import('../scripts/settings.mjs');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lang = JSON.parse(fs.readFileSync(path.join(root, 'languages', 'en.json'), 'utf8'));
const localized = key => key.split('.').reduce((node, part) => node?.[part], lang);
const tours = TOURS.map(([file, id]) => ({ file, id, json: JSON.parse(fs.readFileSync(path.join(root, 'tours', `${file}.json`), 'utf8')) }));
const settingsSource = fs.readFileSync(path.join(root, 'scripts', 'settings.mjs'), 'utf8');
const initSource = fs.readFileSync(path.join(root, 'scripts', 'init.mjs'), 'utf8');

test('every tour file is registered, and every registered tour has its file', () => {
  const files = fs.readdirSync(path.join(root, 'tours')).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5));
  assert.deepEqual(files.sort(), TOURS.map(([file]) => file).sort());
});

test("each tour is this module's, with its own id; only the players' tour shows to players", () => {
  for (const { file, id, json } of tours) {
    assert.equal(json.namespace, MODULE_ID, file);
    assert.equal(json.id, id, file);
    assert.equal(json.restricted, id != 'myEffects', `${file}: restricted`);
    assert.ok(json.steps.length >= 3, file);
  }
});

test('every title, description and step text is in languages/en.json', () => {
  for (const { file, json } of tours) {
    for (const key of [json.title, json.description, ...json.steps.flatMap(step => [step.title, step.content])]) {
      assert.equal(typeof localized(key), 'string', `${file}: ${key} is missing from languages/en.json`);
      assert.ok(localized(key).trim(), `${file}: ${key} is empty`);
    }
  }

  for (const key of ['Title', 'Content', 'Yes', 'No']) {
    assert.ok(localized(`E20FX.Tours.Offer.${key}`), `the offer's ${key}`);
  }
});

test('steps are well formed', () => {
  for (const { file, json } of tours) {
    const ids = json.steps.map(step => step.id);
    assert.equal(new Set(ids).size, ids.length, `${file} repeats a step id`);
    assert.ok(!json.steps[0].selector, `${file} should open on an introduction`);
    for (const step of json.steps) {
      if (step.app) {
        assert.ok(APP_KEYS.includes(step.app), `${file}/${step.id}: unknown app "${step.app}"`);
      }

      if (step.tab) {
        assert.equal(step.app, 'settings', `${file}/${step.id}: only Configure Settings has category tabs`);
        assert.equal(step.tabGroup, 'categories', `${file}/${step.id}`);
      }

      assert.ok(!step.optional || step.selector, `${file}/${step.id}: an optional step needs a selector`);
      if (step.tooltipDirection) {
        assert.ok(['UP', 'DOWN', 'LEFT', 'RIGHT', 'CENTER'].includes(step.tooltipDirection), `${file}/${step.id}`);
      }
    }
  }
});

test('every setting and menu a step points at exists', () => {
  for (const { file, json } of tours) {
    for (const step of json.steps) {
      for (const [, key] of (step.selector ?? '').matchAll(/name="essence20-fx\.(\w+)"/g)) {
        assert.match(settingsSource, new RegExp(`(toggle|register)\\((MODULE_ID, )?'${key}'`), `${file}/${step.id}: no setting "${key}"`);
      }

      for (const [, key] of (step.selector ?? '').matchAll(/data-key="essence20-fx\.(\w+)"/g)) {
        assert.ok(initSource.includes(`registerMenu(MODULE_ID, '${key}'`), `${file}/${step.id}: no menu "${key}"`);
      }
    }
  }
});

test('suggested next tours are tours of this module', () => {
  const known = TOURS.map(([, id]) => `${MODULE_ID}.${id}`);
  for (const { file, json } of tours) {
    for (const next of json.suggestedNextTours ?? []) {
      assert.ok(known.includes(next), `${file} suggests ${next}`);
    }
  }
});

test("the module's windows open from their settings menus; the system's own windows still work", async () => {
  const opened = [];
  const menus = new Map([
    [`${MODULE_ID}.configure`, { type: class { constructor() { opened.push('configure'); } } }],
    [`${MODULE_ID}.emblems`, { type: class { constructor() { opened.push('emblems'); } } }],
  ]);
  globalThis.game = { settings: { menus } };

  class Base {
    static STANDALONE_APPS = { statBlockImporter: { id: 'x', open: async () => null } };
  }

  const Tour = fxTourClass(Base);
  assert.ok(Tour.STANDALONE_APPS.statBlockImporter);
  assert.equal(Tour.STANDALONE_APPS.configureFx.id, 'essence20-fx-config');
  assert.equal(Tour.STANDALONE_APPS.factionEmblems.id, 'essence20-fx-emblems');
  assert.equal(Tour.STANDALONE_APPS.settings.id, 'settings-config');
  await Tour.STANDALONE_APPS.configureFx.open();
  await Tour.STANDALONE_APPS.factionEmblems.open();
  assert.deepEqual(opened, ['configure', 'emblems']);
  delete globalThis.game;
});

test('the tours register on setup and the offer setting on init', () => {
  const hooks = [];
  globalThis.Hooks = { once: name => hooks.push(name) };
  registerTourHooks();
  assert.deepEqual(hooks, ['init', 'setup', 'ready']);
  delete globalThis.Hooks;
  assert.ok(initSource.includes('registerTourHooks();'));
});
