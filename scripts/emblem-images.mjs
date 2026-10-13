/**
 * Faction emblem images: what size they should be, and when a token's turn marker is ours to set. Pure (tested with
 * `node --test`).
 *
 * Two images per faction:
 *  - the emblem (a badge on the token's corner, the flash on a Morph or Transform, roll cards, dice): small and square;
 *  - the turn marker (Foundry v14's own marker under the active token): Foundry draws it square at 1.5x the token, under
 *    the token - so the middle two thirds is hidden and only the outer band shows - and spins it by default. Foundry's
 *    own markers are 512 x 512.
 */

/** The sizes each kind of image should be (pixels). */
export const IMAGE_SPECS = {
  badge: { ideal: [128, 256], min: 64, max: 512 },
  marker: { ideal: [512, 512], min: 256, max: 1024 },
};

/**
 * What to tell the GM about an image they picked.
 * @param {'badge'|'marker'} kind
 * @param {Number} width    The image's natural width (px)
 * @param {Number} height
 * @param {String} [src]     Its path - a JPEG can't be transparent, so it shows as a box
 * @returns {Array<String>}  Advice keys: 'notSquare', 'tooSmall', 'tooBig', 'opaque' - or ['good'] when it's right
 */
export function imageAdvice(kind, width, height, src = '') {
  const spec = IMAGE_SPECS[kind];
  if (!spec || !(width > 0) || !(height > 0)) {
    return [];
  }

  const advice = [];
  if (Math.abs(width - height) > Math.max(width, height) * 0.02) {
    advice.push('notSquare');
  }

  const side = Math.min(width, height);
  if (side < spec.min) {
    advice.push('tooSmall');
  } else if (Math.max(width, height) > spec.max) {
    advice.push('tooBig');
  }

  if (/\.jpe?g$/i.test(String(src))) {
    advice.push('opaque');
  }

  return advice.length ? advice : ['good'];
}

/** Foundry's CONST.TOKEN_TURN_MARKER_MODES (passed in, so this file needs no Foundry). */
export const MARKER_MODES = { DISABLED: 0, DEFAULT: 1, CUSTOM: 2 };

/**
 * What to write to a token's turn marker for its faction's marker image - or null to leave it alone. A token is only
 * ours to change while its marker is still the default, or the one this module set (recorded in a flag): a marker
 * someone chose by hand, or one turned off, is never touched.
 * @param {{mode, src}} current    The token's turnMarker now
 * @param {String|null} ours        The marker this module last set on it (flags.essence20-fx.marker), if any
 * @param {String|null} src         Its faction's marker image now ('' or null for none)
 * @param {{animation, disposition}} defaults   The world's turn marker settings (CONFIG.Combat.settings.turnMarker)
 * @param {Object} [modes]
 * @returns {{turnMarker: Object, flag: String|null}|null}
 */
export function markerUpdate(current, ours, src, defaults = {}, modes = MARKER_MODES) {
  const isOurs = !!ours && current?.mode == modes.CUSTOM && current?.src == ours;
  const isFree = current?.mode == modes.DEFAULT || isOurs;
  if (!isFree) {
    return null;
  }

  if (src) {
    if (isOurs && current.src == src) {
      return null;
    }

    // A token's own marker settings replace the world's whole, so carry the world's animation and colouring over.
    return { turnMarker: { mode: modes.CUSTOM, src, animation: defaults.animation ?? null, disposition: !!defaults.disposition }, flag: src };
  }

  return isOurs ? { turnMarker: { mode: modes.DEFAULT }, flag: null } : null;
}
