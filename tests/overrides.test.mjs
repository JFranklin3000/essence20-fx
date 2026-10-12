import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyOverrides, cleanImport, isFilePath, mainPart, NO_SOUND, parseOverrides, rowToOverride } from '../scripts/overrides.mjs';
import { allMomentKeys, momentGroups, presetFor } from '../scripts/presets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

test("an animation replaces the preset's main part", () => {
  assert.equal(mainPart({ projectile: 'a', impact: 'b' }), 'projectile');
  assert.equal(mainPart({ impact: 'b', overlay: 'c' }), 'overlay');
  assert.equal(mainPart({ sound: ['x'] }), 'overlay');
  const preset = { projectile: 'jb2a.lasershot.blue', impact: 'jb2a.impact.004.blue', sound: ['scifi/laser.ogg'] };
  const result = applyOverrides(preset, [{ animation: 'jb2a.bullet.01.orange' }]);
  assert.equal(result.projectile, 'jb2a.bullet.01.orange');
  assert.equal(result.impact, preset.impact);
  assert.equal(preset.projectile, 'jb2a.lasershot.blue');
});

test("sounds, silence, volume, off - and an actor's override over the GM's", () => {
  const preset = { overlay: 'x', sound: ['digital/powerUp1.ogg'] };
  const sound = applyOverrides(preset, [{ sound: 'worlds/mine/morph.ogg', volume: 0.3 }]);
  assert.deepEqual(sound.sound, ['worlds/mine/morph.ogg']);
  assert.equal(sound.soundIsPath, true);
  assert.equal(sound.volume, 0.3);
  assert.deepEqual(applyOverrides(preset, [{ sound: NO_SOUND }]).sound, []);
  assert.equal(applyOverrides(preset, [{ off: true }]), null);
  assert.equal(applyOverrides(preset, [{ animation: 'gm' }, { animation: 'mine' }]).overlay, 'mine');
  assert.equal(applyOverrides(preset, [undefined, null]).overlay, 'x');
  assert.equal(applyOverrides(null, [{ animation: 'x' }]), null);
  assert.equal(applyOverrides(preset, [{ volume: 4 }]).volume, 1);
});

test('a form row becomes an override only when it changes something', () => {
  assert.equal(rowToOverride({ on: true, animation: ' ', sound: '', volume: '' }), null);
  assert.deepEqual(rowToOverride({ on: false }), { off: true });
  assert.deepEqual(rowToOverride({ on: true, animation: ' jb2a.x ', sound: 'a.ogg', volume: '0.5' }), { animation: 'jb2a.x', sound: 'a.ogg', volume: 0.5 });
  assert.deepEqual(rowToOverride({ volume: '-2' }), { volume: 0 });
});

test('an import keeps only known moments and the four fields', () => {
  const data = { module: 'essence20-fx', overrides: {
    'attack.ranged.hit': { animation: 'jb2a.x', evil: '<script>' },
    'not.a.moment': { animation: 'y' },
    morph: { off: true },
    unmorph: 'nonsense',
    transform: { volume: '0.5' },
  } };
  assert.deepEqual(cleanImport(data, ['attack.ranged.hit', 'morph', 'unmorph', 'transform']), { 'attack.ranged.hit': { animation: 'jb2a.x' }, morph: { off: true } });
  assert.deepEqual(cleanImport({ morph: { sound: 'a.ogg' } }, ['morph']), { morph: { sound: 'a.ogg' } });
  assert.deepEqual(cleanImport(null, ['morph']), {});
  assert.deepEqual(cleanImport('text', ['morph']), {});
});

test('file paths vs Sequencer database paths; stored actor overrides', () => {
  assert.ok(isFilePath('worlds/mine/boom.webm'));
  assert.ok(isFilePath('boom.webm'));
  assert.ok(!isFilePath('jb2a.impact.004.blue'));
  assert.deepEqual(parseOverrides('{"morph":{"off":true}}'), { morph: { off: true } });
  assert.deepEqual(parseOverrides('not json'), {});
  assert.deepEqual(parseOverrides(undefined), {});
  assert.deepEqual(parseOverrides({ morph: {} }), { morph: {} });
});

test('every moment in Configure FX has a preset and (outside Conditions) a label', () => {
  const lang = JSON.parse(fs.readFileSync(path.join(here, '..', 'languages', 'en.json'), 'utf8'));
  const keys = allMomentKeys();
  assert.equal(new Set(keys).size, keys.length);
  for (const key of keys) {
    assert.ok(presetFor(key), `preset for ${key}`);
    if (!key.startsWith('condition.')) {
      assert.ok(lang.E20FX.Moment[key.replaceAll('.', '-')], `label for ${key}`);
    }
  }

  for (const group of momentGroups()) {
    assert.ok(lang.E20FX.Config.Group[group.id], `group label ${group.id}`);
  }
});
