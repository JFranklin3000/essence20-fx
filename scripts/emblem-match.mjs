/**
 * Faction emblems: which of the GM's emblem images an actor gets. Pure (tested with `node --test`).
 *
 * The module ships no emblems - the Autobot, Decepticon, G.I. Joe and Cobra symbols are Hasbro's - so a GM supplies
 * their own images, one per "slot" ({ name, img, tint }). An actor's slot is, in order: its own choice (flags), its
 * Faction item's name (characters carry one), a folder it sits in ("Cobra" for an NPC folder), else none.
 */

/** The slots a new world starts with, empty until the GM gives them images. */
export const DEFAULT_SLOTS = ['Autobot', 'Decepticon', 'G.I. Joe', 'Cobra'];

/**
 * A faction's name reduced for matching: lower case, letters and digits only, a plural "s" dropped -
 * "Autobots" and "autobot" and "AUTOBOT" match, as do "G.I. Joe" and "gi-joe.webp".
 * @param {String} name
 */
export function factionKey(name) {
  const key = String(name ?? '').toLowerCase().replace(/\.[a-z0-9]{2,4}$/, '').replace(/[^a-z0-9]/g, '');
  return key.length > 3 && key.endsWith('s') ? key.slice(0, -1) : key;
}

/**
 * The emblem slot for an actor, or null.
 * @param {Array<{name, img}>} slots
 * @param {{override?: String, factionNames?: String[], folderNames?: String[]}} actorInfo
 * @returns {Object|null}   The slot (only one with an image counts)
 */
export function pickEmblem(slots = [], { override = '', factionNames = [], folderNames = [] } = {}) {
  const byKey = new Map(slots.filter(slot => slot?.img).map(slot => [factionKey(slot.name), slot]));
  if (override === 'none') {
    return null;
  }

  for (const name of [override, ...factionNames, ...folderNames]) {
    const slot = name ? byKey.get(factionKey(name)) : null;
    if (slot) {
      return slot;
    }
  }

  return null;
}

/**
 * Files from a folder matched to slots by name ("autobot.webp" -> Autobot). Returns the slots with their new images
 * and which files matched nothing.
 * @param {Array<{name, img}>} slots
 * @param {String[]} files   Full paths
 */
export function matchFolder(slots = [], files = []) {
  const unmatched = [];
  const next = slots.map(slot => ({ ...slot }));
  for (const file of files) {
    const base = String(file).split('/').pop();
    const slot = next.find(candidate => factionKey(candidate.name) == factionKey(decodeURIComponent(base)));
    if (slot) {
      slot.img = file;
    } else {
      unmatched.push(file);
    }
  }

  return { slots: next, unmatched };
}
