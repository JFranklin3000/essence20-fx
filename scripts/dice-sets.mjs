/**
 * Dice So Nice colour sets, and which one a character's rolls use. Pure (tested with `node --test`); scripts/dice.mjs
 * hands them to Dice So Nice when it's active.
 */

const CATEGORY = 'Essence20';
const set = (name, description, background, foreground, edge, extra = {}) => ({
  name: `e20-${name}`, description, category: CATEGORY, background, foreground, outline: '#000000', edge, texture: 'none', material: 'plastic', ...extra,
});

/** One colour set per Ranger colour, faction and line. */
export const COLORSETS = [
  set('red', 'Power Rangers: Red', '#c81e1e', '#ffffff', '#7a0e0e'),
  set('blue', 'Power Rangers: Blue', '#1f5fd6', '#ffffff', '#0e3480'),
  set('yellow', 'Power Rangers: Yellow', '#f2c614', '#1a1a1a', '#9a7d06'),
  set('black', 'Power Rangers: Black', '#1a1a1a', '#ffffff', '#555555'),
  set('pink', 'Power Rangers: Pink', '#f05aa8', '#ffffff', '#a02a68'),
  set('green', 'Power Rangers: Green', '#1d9a3c', '#ffffff', '#0d5a20'),
  set('white', 'Power Rangers: White', '#f2f2f2', '#1a1a1a', '#b0b0b0'),
  set('gold', 'Power Rangers: Gold', '#d4a017', '#1a1a1a', '#8a6508', { material: 'metal' }),
  set('silver', 'Power Rangers: Silver', '#b8bcc4', '#1a1a1a', '#70747c', { material: 'metal' }),
  set('purple', 'Power Rangers: Purple', '#7a3fc0', '#ffffff', '#45207a'),
  set('orange', 'Power Rangers: Orange', '#f07a14', '#ffffff', '#9a4806'),
  set('autobot', 'Transformers: Autobot', '#b3121b', '#e8e8ec', '#6c6f76', { material: 'metal' }),
  set('decepticon', 'Transformers: Decepticon', '#5b2a86', '#c9ccd3', '#3a3d44', { material: 'metal' }),
  set('energon', 'Transformers: Energon', '#3fe0ff', '#06323d', '#9af2ff', { material: 'glass' }),
  set('joe', 'G.I. Joe: Joe', '#4b5320', '#e6dcb4', '#2c3112'),
  set('cobra', 'G.I. Joe: Cobra', '#1c3f94', '#e01b24', '#0d1f4a'),
  set('dreadnok', 'G.I. Joe: Dreadnok', '#8a3b12', '#141414', '#4a1f08'),
  set('pony', 'My Little Pony: Rainbow', ['#ff6b9a', '#ffb347', '#fff07a', '#7ee081', '#6ec6ff', '#b28dff'], '#ffffff', '#ffffff'),
  set('harmony', 'My Little Pony: Harmony', '#f5d76e', '#ffffff', '#fff7d6', { material: 'metal' }),
  set('nightvale', 'Night Vale: Void', '#2a0a3d', '#b48cff', '#7a3fc0', { material: 'glass' }),
  set('static', 'Night Vale: Static', '#6b6b6b', '#e0e0e0', '#3a3a3a'),
];

/** A faction (factionKey) to its colour set. */
const BY_FACTION = { autobot: 'e20-autobot', decepticon: 'e20-decepticon', gijoe: 'e20-joe', joe: 'e20-joe', cobra: 'e20-cobra', dreadnok: 'e20-dreadnok' };

/** A game line to its colour set, when nothing more specific applies. */
const BY_LINE = { myLittlePony: 'e20-pony', welcomeToNightVale: 'e20-nightvale' };

/** The colour set for a character's own colour - made on the fly, one per colour. */
export function customColorset(hex) {
  const colour = String(hex).toLowerCase();
  return set(`actor-${colour.replace('#', '')}`, `Essence20: ${colour}`, colour, '#ffffff', colour);
}

/**
 * Which colour set a character's dice use: a Ranger in their colour, a faction's, a line's - or null for the player's
 * own Dice So Nice choice.
 * @param {{line?: String, faction?: String, color?: String}} info   faction as factionKey()
 * @returns {String|Object|null}   A set's name, or a custom set to add first ({ name, ... })
 */
export function colorsetFor({ line = null, faction = null, color = null } = {}) {
  if (line == 'powerRangers' && /^#[0-9a-f]{6}$/i.test(color ?? '') && color.toLowerCase() != '#b5b1b1') {
    return customColorset(color);
  }

  return BY_FACTION[faction] ?? BY_LINE[line] ?? null;
}

/** A d20 whose 20 face is an emblem image (Dice So Nice labels can be images). */
export function emblemD20Labels(img) {
  return [...Array.from({ length: 19 }, (_, i) => String(i + 1)), img];
}
