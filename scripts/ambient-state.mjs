/**
 * Ambient effects: what a token should be wearing right now. Pure (tested with `node --test`); scripts/ambient.mjs
 * puts them on and takes them off.
 *
 * Each is a lasting, looping effect named for its state, so the state ending ends exactly it.
 */

/** The look of each ambient state (Sequencer paths, or an emblem image). */
export const AMBIENT = {
  active: { file: 'jb2a.token_border.circle.static.blue.001', below: true, scale: 1.5, opacity: 0.8 },
  morphed: { file: 'jb2a.energy_field.02.below.blue', below: true, scale: 1.6, opacity: 0.5, recolor: true },
  megaform: { file: 'jb2a.markers.light.loop.blue', below: true, scale: 1.4, opacity: 0.6 },
  zord: { file: 'jb2a.fumes.04.loop.grey', below: true, scale: 1.3, opacity: 0.35 },
  defeated: { file: 'jb2a.smoke.plumes_loop.01.grey', scale: 0.9, opacity: 0.5 },
  'condition.stunned': { file: 'jb2a.dizzy_stars.200px.blueorange', scale: 1, opacity: 0.9 },
  'condition.poisoned': { file: 'jb2a.markers.poison.dark_green.02', scale: 1.2, opacity: 0.7 },
  'condition.frightened': { file: 'jb2a.markers.fear.dark_purple.02', scale: 1.2, opacity: 0.7 },
  'condition.deafened': { file: 'jb2a.markers.mute.dark_red.02', scale: 1.2, opacity: 0.7 },
  'condition.grappled': { file: 'jb2a.markers.chain.standard.loop.02.red', scale: 1.3, opacity: 0.7 },
  'condition.restrained': { file: 'jb2a.markers.chain.standard.loop.02.red', scale: 1.3, opacity: 0.7 },
  'condition.immobilized': { file: 'jb2a.markers.chain.standard.loop.02.red', scale: 1.3, opacity: 0.7 },
  emblem: { below: true, scale: 1.35, opacity: 0.7 },
};

/**
 * The ambient states a token should show.
 * @param {Object} actor    { type, system: { isMorphed, actors }, statuses: Set }
 * @param {Object} [options]
 * @param {Boolean} [options.active]     It's this token's turn
 * @param {Object} [options.emblem]      Its faction emblem slot ({ img, tint }), if any
 * @param {Object} [options.show]        Which kinds are switched on: { states, conditions, active, emblems }
 * @returns {Array<String>}  AMBIENT keys
 */
export function wantedAmbient(actor, { active = false, emblem = null, show = {} } = {}) {
  if (!actor) {
    return [];
  }

  const wanted = [];
  const statuses = actor.statuses instanceof Set ? actor.statuses : new Set(actor.statuses ?? []);
  if (show.active && active) {
    wanted.push('active');
  }

  if (show.states) {
    if (actor.system?.isMorphed) {
      wanted.push('morphed');
    }

    if (actor.type == 'megaform' && Object.values(actor.system?.actors ?? {}).filter(entry => entry?.uuid).length >= 2) {
      wanted.push('megaform');
    }

    if (actor.type == 'zord') {
      wanted.push('zord');
    }

    if (statuses.has('defeated')) {
      wanted.push('defeated');
    }
  }

  if (show.conditions && !statuses.has('defeated')) {
    for (const status of statuses) {
      if (AMBIENT[`condition.${status}`]) {
        wanted.push(`condition.${status}`);
      }
    }
  }

  if (show.emblems && emblem?.img) {
    wanted.push('emblem');
  }

  return wanted;
}

/** The name an ambient effect carries on a token - what ends it later. */
export const ambientName = (key, tokenId) => `e20fx-amb-${key}-${tokenId}`;

/** The key back out of a name (null for anything that isn't one of ours). */
export function ambientKey(name, tokenId) {
  const match = new RegExp(`^e20fx-amb-(.+)-${tokenId}$`).exec(String(name ?? ''));
  return match ? match[1] : null;
}
