/**
 * Whether Automated Animations (theripper93's v14 module, id "autoanimations") has an animation for an item - so the
 * bridge can hand it the attacks it will animate and keep the rest. Pure (tested with `node --test`).
 *
 * Mirrors its own lookup (src/system-handlers/findAnimation.js, src/aa-classes/aaAutorecFunctions.js in 7.1.x):
 *  - the item's own settings (flags.autoanimations): turned off -> no; customised -> yes;
 *  - else, unless its global Automatic Recognition is disabled, its menus: an exact-match entry whose label is the
 *    name, else the longest label contained in the name (spaces removed, lower case), minus excluded terms.
 */

/** Its Automatic Recognition menus the item search reads (not the Active Effect one). */
export const AUTOREC_MENUS = ['melee', 'range', 'ontoken', 'templatefx', 'aura', 'preset'];

/** Its rinse: spaces out, lower case. */
export const rinse = name => String(name ?? '').replace(/\s+/g, '').toLowerCase();

/**
 * The first Automatic Recognition entry matching any of the names (in order), or null.
 * @param {Object<String, Array>} menus   { melee: [...], range: [...], ... } - each entry { label, advanced? }
 * @param {String[]} names
 */
export function autorecMatch(menus, names) {
  const entries = AUTOREC_MENUS.flatMap(key => (Array.isArray(menus?.[key]) ? menus[key] : [])).filter(entry => entry?.label);
  const sorted = [...entries].sort((a, b) => rinse(b.label).length - rinse(a.label).length);
  const exact = sorted.filter(entry => entry.advanced?.exactMatch);
  const best = sorted.filter(entry => !entry.advanced?.exactMatch);
  for (const name of names.filter(Boolean)) {
    const rinsed = rinse(name);
    const found = exact.find(entry => entry.label === name)
      ?? best.find(entry => rinsed.includes(rinse(entry.label)) && !(entry.advanced?.excludedTerms ?? []).some(term => rinsed.includes(rinse(term))));
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Whether Automated Animations would animate this item.
 * @param {Object} options
 * @param {Object} [options.flags]            The item's flags.autoanimations
 * @param {String[]} options.names            The names to try, in order (the item's, then its weapon's)
 * @param {Object} [options.menus]            Its Automatic Recognition menus
 * @param {Boolean} [options.autorecDisabled] Its "disable Automatic Recognition" setting
 */
export function aaWouldAnimate({ flags = {}, names = [], menus = {}, autorecDisabled = false } = {}) {
  if (flags?.killAnim || flags?.isEnabled === false) {
    return false;
  }

  if (flags?.isCustomized) {
    return true;
  }

  return !autorecDisabled && !!autorecMatch(menus, names);
}
