import { HEAL_PATHS, colorOf, combatEndMoments, combatMoments, healMoments } from "./moments.mjs";
import { playMoments } from "./play.mjs";

/**
 * Healing and combat stings - two things the system doesn't announce, read from Foundry's own documents:
 *  - healing: an actor update that raises Health or lowers Stun, on the client that made it (like the system's hooks);
 *  - combat: Foundry's combatTurnChange, which every client hears - the active GM plays it once for the table (Sequencer
 *    sends it on), and a combat that had started being deleted.
 */

/** Healing, while `isOn('damage')`. */
export function registerHealing(isOn) {
  // The values the update changes, taken before it lands (preUpdateActor runs on the updating client).
  Hooks.on('preUpdateActor', (actor, changed, options) => {
    options.e20fxHeal = Object.fromEntries(Object.values(HEAL_PATHS).map(path => [path, foundry.utils.getProperty(actor, path)]));
  });

  Hooks.on('updateActor', (actor, changed, options, userId) => {
    if (userId != game.user.id || !options.e20fxHeal || !isOn('damage')) {
      return;
    }

    playMoments(healMoments({
      actor,
      has: path => foundry.utils.hasProperty(changed, path),
      now: path => foundry.utils.getProperty(actor, path),
      before: options.e20fxHeal,
    }));
  });
}

/** Whether Foundry's own Combat Theme is playing turn sounds (then the stings stay quiet and only show their words). */
const themePlaying = () => {
  try {
    const theme = game.settings.get('core', 'combatTheme');
    return !!theme && theme != 'none';
  } catch {
    return false;
  }
};

/** Whoever is up, and the active players who own them. */
function upNext(combat) {
  const combatant = combat?.combatant;
  if (!combatant) {
    return { combatant: null, owners: [] };
  }

  const actor = combatant.actor ?? null;
  const owners = game.users.filter(user => user.active && !user.isGM && (actor ? actor.testUserPermission(user, 'OWNER') : combatant.testUserPermission?.(user, 'OWNER'))).map(user => user.id);
  return { combatant: { name: combatant.name, actor, defeated: combatant.isDefeated, color: colorOf(actor) }, owners };
}

/** Combat stings, while `isOn('combatStings')`. */
export function registerCombatStings(isOn) {
  Hooks.on('combatTurnChange', (combat, previous, current) => {
    if (!game.user.isActiveGM || !combat?.active || !isOn('combatStings')) {
      return;
    }

    const silent = themePlaying();
    playMoments(combatMoments({ previous, current, ...upNext(combat) }).map(moment => ({ ...moment, silent })));
  });

  Hooks.on('deleteCombat', combat => {
    if (game.user.isActiveGM && combat?.active && isOn('combatStings')) {
      playMoments(combatEndMoments({ started: combat.started }));
    }
  });
}
