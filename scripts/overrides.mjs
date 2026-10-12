/**
 * A GM's (world) or an actor's own replacements for what a moment plays. Pure (tested with `node --test`).
 *
 * Overrides are { [momentKey]: { off?, animation?, sound?, volume? } }:
 *   off        true: the moment plays nothing
 *   animation  replaces the moment's main animation (MAIN_PARTS) - a Sequencer database path (jb2a....) or a file
 *   sound      replaces its sound - a file path, or "none" for silence
 *   volume     0-1, replaces the module's effect volume for this moment
 * The world's come first and an actor's on top (a Ranger's own Morph), each over the preset's look.
 */

/** Which part of a preset an "animation" replaces: the first of these it has. */
export const MAIN_PARTS = ['projectile', 'swing', 'area', 'overlay', 'impact', 'ring', 'beam'];

export const NO_SOUND = 'none';

/** The part of a preset its main animation is. */
export function mainPart(preset) {
  return MAIN_PARTS.find(part => preset?.[part]) ?? 'overlay';
}

/**
 * The preset with overrides applied, in order (later wins), or null when one turns the moment off.
 * @param {Object|null} preset
 * @param {Array<Object|undefined>} overrides   Each the override for this moment (or nothing)
 * @returns {Object|null}
 */
export function applyOverrides(preset, overrides = []) {
  if (!preset) {
    return null;
  }

  const result = { ...preset };
  for (const override of overrides) {
    if (!override) {
      continue;
    }

    if (override.off) {
      return null;
    }

    if (override.animation) {
      result[mainPart(preset)] = override.animation;
    }

    if (override.sound) {
      result.sound = override.sound == NO_SOUND ? [] : [override.sound];
      result.soundIsPath = override.sound != NO_SOUND;
    }

    if (Number.isFinite(override.volume)) {
      result.volume = Math.min(1, Math.max(0, override.volume));
    }
  }

  return result;
}

/**
 * One moment's override from a form row, trimmed - or null when it changes nothing (so the stored object only holds
 * real changes).
 * @param {{on?: Boolean, animation?: String, sound?: String, volume?: String|Number}} row
 */
export function rowToOverride(row = {}) {
  const override = {};
  if (row.on === false) {
    override.off = true;
  }

  const animation = String(row.animation ?? '').trim();
  if (animation) {
    override.animation = animation;
  }

  const sound = String(row.sound ?? '').trim();
  if (sound) {
    override.sound = sound;
  }

  const volume = row.volume === '' || row.volume === null || row.volume === undefined ? NaN : Number(row.volume);
  if (Number.isFinite(volume)) {
    override.volume = Math.min(1, Math.max(0, volume));
  }

  return Object.keys(override).length ? override : null;
}

/**
 * Overrides read back from an exported file: only known moment keys, only the four fields, the right types.
 * @param {*} data       The parsed JSON
 * @param {Set<String>|Array<String>} knownKeys
 * @returns {Object}     A clean overrides object ({} when nothing usable)
 */
export function cleanImport(data, knownKeys) {
  const known = new Set(knownKeys);
  const source = data?.overrides ?? data;
  const clean = {};
  if (!source || typeof source != 'object') {
    return clean;
  }

  for (const [key, value] of Object.entries(source)) {
    if (!known.has(key) || !value || typeof value != 'object') {
      continue;
    }

    const override = rowToOverride({
      on: value.off ? false : true,
      animation: typeof value.animation == 'string' ? value.animation : '',
      sound: typeof value.sound == 'string' ? value.sound : '',
      volume: typeof value.volume == 'number' ? value.volume : '',
    });
    if (override) {
      clean[key] = override;
    }
  }

  return clean;
}

/** Whether a path is a file (rather than a Sequencer database entry like "jb2a.impact.004.blue"). */
export function isFilePath(path) {
  return /[/\\]/.test(String(path ?? '')) || /\.(webm|mp4|webp|png|gif|jpe?g|svg|ogg|mp3|wav|m4a|flac)$/i.test(String(path ?? ''));
}

/** An actor's stored overrides (JSON text, so a save replaces them whole rather than merging) as an object. */
export function parseOverrides(value) {
  if (value && typeof value == 'object') {
    return value;
  }

  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed == 'object' ? parsed : {};
  } catch {
    return {};
  }
}
