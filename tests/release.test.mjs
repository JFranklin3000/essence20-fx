import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allSoundFiles } from '../scripts/presets.mjs';

/**
 * The release zip lists its folders by name (.github/workflows/release.yml). Everything Foundry loads has to be in one
 * of them and on disk, or a release installs broken - the same trap the system's own release once fell into.
 */

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'module.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'release.yml'), 'utf8');
const zipped = /zip -r module\.zip (.+)/.exec(workflow)[1].trim().split(/\s+/);

const shipped = file => zipped.some(entry => file == entry || file.startsWith(`${entry}/`));

/** Every file Foundry or the scripts load: the manifest's, the templates the scripts name, the sounds. */
function loadedFiles() {
  const files = ['module.json', 'LICENSE', ...(manifest.esmodules ?? []), ...(manifest.styles ?? []), ...(manifest.languages ?? []).map(lang => lang.path)];
  for (const script of fs.readdirSync(path.join(root, 'scripts'))) {
    const text = fs.readFileSync(path.join(root, 'scripts', script), 'utf8');
    files.push(`scripts/${script}`);
    for (const [, file] of text.matchAll(/modules\/\$\{MODULE_ID\}\/([\w/.-]+\.(?:hbs|css))/g)) {
      files.push(file);
    }

    for (const [, file] of text.matchAll(/from "\.\/([\w.-]+\.mjs)"/g)) {
      files.push(`scripts/${file}`);
    }
  }

  return [...new Set([...files, ...allSoundFiles().map(sound => `sounds/${sound}`), 'sounds/CREDITS.md'])];
}

test('everything the module loads is in the release zip and on disk', () => {
  for (const file of loadedFiles()) {
    assert.ok(shipped(file), `${file} is not in the release zip (${zipped.join(' ')})`);
    assert.ok(fs.existsSync(path.join(root, file)), `${file} is missing`);
  }
});

test('the manifest is ready to publish', () => {
  assert.equal(manifest.id, 'essence20-fx');
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(manifest.manifest.endsWith('/releases/latest/download/module.json'));
  assert.ok(manifest.download.endsWith(`/releases/download/${manifest.version}/module.zip`));
  assert.deepEqual(manifest.relationships.requires.map(r => r.id), ['sequencer']);
  assert.ok(manifest.relationships.systems.some(s => s.id == 'essence20'));
  assert.ok(Number(manifest.compatibility.minimum) >= 14);
});

test('every bundled sound is credited, and only CC0 packs are', () => {
  const credits = fs.readFileSync(path.join(root, 'sounds', 'CREDITS.md'), 'utf8');
  const folders = fs.readdirSync(path.join(root, 'sounds'), { withFileTypes: true }).filter(entry => entry.isDirectory() && entry.name != 'licenses');
  for (const folder of folders) {
    assert.ok(credits.includes(`\`${folder.name}/\``), `sounds/${folder.name}/ is not in CREDITS.md`);
  }

  for (const license of fs.readdirSync(path.join(root, 'sounds', 'licenses'))) {
    assert.match(fs.readFileSync(path.join(root, 'sounds', 'licenses', license), 'utf8'), /CC0/, license);
  }
});

// Foundry refuses a settings menu that isn't an Application - and the throw stops every menu registered after it.
test('every settings menu type is an Application class', () => {
  const scripts = fs.readdirSync(path.join(root, 'scripts')).map(file => fs.readFileSync(path.join(root, 'scripts', file), 'utf8')).join('\n');
  const init = fs.readFileSync(path.join(root, 'scripts', 'init.mjs'), 'utf8');
  const types = [...init.matchAll(/registerMenu\([^)]*?type:\s*(\w+)/gs)].map(match => match[1]);
  assert.ok(types.length >= 3);
  for (const type of types) {
    assert.match(scripts, new RegExp(`class ${type} extends [\\w.()]*(ApplicationV2|FormApplication|HandlebarsApplicationMixin)`), `${type} must extend ApplicationV2`);
  }
});
