import { WATCHED, actorEvents, isLegacySystem, naturalTwenty, rollFromCard } from "./compat-core.mjs";

/**
 * The Essence20 6.0.4 fallback (compat-core.mjs): on a system older than 6.0.5 - which has no essence20.* hooks - the
 * same moments are rebuilt from 6.0.4's roll cards and document changes and handed to the same handlers. On 6.0.5 and
 * later it stays out of the way, so nothing plays twice. Each listener only acts for the client that made the change,
 * as the hooks do.
 */

export const legacy = () => game.system?.id == 'essence20' && isLegacySystem(game.system.version);

/** A token's or an actor's uuid -> its actor. */
function actorOf(uuid) {
  const doc = globalThis.fromUuidSync?.(uuid, { strict: false }) ?? null;
  return doc?.documentName == 'Actor' ? doc : doc?.actor ?? null;
}

/**
 * @param {Object} handlers
 * @param {Function} handlers.onRoll    Takes an essence20.rollResolved payload
 * @param {Function} handlers.onEvent   Takes an essence20.event payload
 */
export function registerCompat({ onRoll, onEvent }) {
  Hooks.on('createChatMessage', (message, options, userId) => {
    if (!legacy() || userId != game.user.id) {
      return;
    }

    const flags = message.flags?.essence20;
    const actor = ChatMessage.getSpeakerActor(message.speaker);
    const item = flags?.itemUuid ? globalThis.fromUuidSync?.(flags.itemUuid, { strict: false }) ?? null : null;
    const roll = rollFromCard(flags, { actor, item, targetOf: actorOf, natural20: naturalTwenty(message.rolls?.[0]) });
    if (roll) {
      onRoll(roll);
    }
  });

  // The values the update changes, taken before it lands (preUpdateActor runs on the updating client).
  Hooks.on('preUpdateActor', (actor, changed, options) => {
    if (legacy()) {
      options.e20fxBefore = Object.fromEntries(Object.values(WATCHED).map(path => [path, foundry.utils.getProperty(actor, path)]));
    }
  });

  Hooks.on('updateActor', (actor, changed, options, userId) => {
    if (!legacy() || userId != game.user.id) {
      return;
    }

    const participants = Object.values(actor.system?.actors ?? {}).filter(entry => entry?.uuid).length;
    const events = actorEvents({
      has: path => foundry.utils.hasProperty(changed, path),
      now: path => foundry.utils.getProperty(actor, path),
      before: options.e20fxBefore ?? {},
      type: actor.type,
      participants,
    });
    for (const event of events) {
      onEvent({ actor, targets: [], ...event });
    }
  });

  // A Condition arriving; Defeated is its own moment.
  Hooks.on('createActiveEffect', (effect, options, userId) => {
    const actor = effect.parent;
    if (!legacy() || userId != game.user.id || actor?.documentName != 'Actor' || !effect.statuses?.size) {
      return;
    }

    const statuses = [...effect.statuses];
    onEvent({ actor, event: 'conditionGained', vars: { statuses } });
    if (statuses.includes('defeated')) {
      onEvent({ actor, event: 'defeated', vars: {} });
    }
  });

  // 6.0.4 already announces a Story Point spend.
  Hooks.on('essence20.storyPointSpent', (actor, amount) => {
    if (legacy() && actor && amount > 0) {
      onEvent({ actor, event: 'storyPointSpent', vars: {} });
    }
  });
}
