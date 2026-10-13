/**
 * The Essence20 6.0.4 fallback: what the system's essence20.* hooks (6.0.5 and later) would have said, rebuilt from what
 * 6.0.4 already leaves behind - its roll cards' flags, and ordinary actor and Active Effect changes. Pure (tested with
 * `node --test`); scripts/compat.mjs listens and hands the results to the same handlers the hooks feed.
 *
 * Not available on 6.0.4, so it stays silent there: area bursts, Zords and Megaforms breaking apart, Requisitions,
 * rerolls, help from a teammate.
 */

/** The first Essence20 version with the hooks. */
export const HOOKS_SINCE = [6, 0, 5];

/**
 * Whether this system version predates the hooks. Anything that isn't a plain version number (a development copy's
 * "This is auto replaced") is treated as current.
 * @param {String} version
 */
export function isLegacySystem(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(version ?? ''));
  if (!match) {
    return false;
  }

  const parts = match.slice(1).map(Number);
  for (let i = 0; i < 3; i++) {
    if (parts[i] != HOOKS_SINCE[i]) {
      return parts[i] < HOOKS_SINCE[i];
    }
  }

  return false;
}

/**
 * A 6.0.4 roll card -> the essence20.rollResolved payload.
 * @param {Object} flags            The card's flags.essence20
 * @param {Object} found
 * @param {Actor} found.actor       The speaker
 * @param {Item} [found.item]       The rolled item (from flags.itemUuid)
 * @param {Function} found.targetOf uuid -> the target's actor (a token's or an actor's uuid)
 * @param {Boolean} [found.natural20]  The d20 came up 20 (a Critical Success)
 * @returns {Object|null}
 */
export function rollFromCard(flags, { actor, item = null, targetOf = () => null, natural20 = false } = {}) {
  if (!flags || !actor || (!Array.isArray(flags.checkResults) && !flags.skill)) {
    return null;
  }

  const isAttack = !!(flags.isAttack ?? (item?.type == 'weaponEffect'));
  const style = flags.attackStyle ?? item?.system?.classification?.style ?? null;
  const isMelee = !!(flags.isMelee ?? flags.isMeleeAttack ?? (style == 'melee'));
  const targets = (flags.checkResults ?? [])
    .filter(row => row?.targetUuid)
    .map(row => ({ actor: targetOf(row.targetUuid), hit: !!row.success }))
    .filter(row => row.actor);
  return {
    actor, item, skill: flags.skill ?? '', isAttack, isMelee, style,
    damageType: item?.system?.damageType ?? null,
    isCrit: !!natural20 && !flags.isFumble,
    isFumble: !!flags.isFumble,
    targets,
  };
}

/** Whether a roll's d20 came up a natural 20 (its kept result). */
export function naturalTwenty(roll) {
  const d20 = (roll?.dice ?? []).find(term => term?.faces == 20);
  return !!d20?.results?.some(result => result.active !== false && !result.discarded && result.result == 20);
}

/** The values the actor fallback compares before and after an update. */
export const WATCHED = {
  energon: 'system.energon.normal.value',
  darkEnergon: 'system.energon.dark.value',
  health: 'system.health.value',
  stun: 'system.stun.value',
};

/**
 * An actor update -> the essence20.event payloads 6.0.5 would have fired: Morph / Transform, Energon spent, damage taken
 * (Health down, or Stun up), a Megaform's roster changing.
 * @param {Object} change
 * @param {Function} change.has     path -> whether the update touched it
 * @param {Function} change.now     path -> its value after
 * @param {Object} change.before    { [path]: value before } for WATCHED paths
 * @param {String} change.type      The actor's type
 * @param {Number} [change.participants]  A Megaform's roster size after
 * @returns {Array<{event, vars?, damage?}>}
 */
export function actorEvents({ has, now, before = {}, type, participants = 0 }) {
  const events = [];
  if (has('system.isMorphed')) {
    events.push({ event: now('system.isMorphed') ? 'morph' : 'unmorph' });
  }

  if (has('system.isTransformed')) {
    events.push({ event: now('system.isTransformed') ? 'transform' : 'untransform' });
  }

  for (const resource of ['energon', 'darkEnergon']) {
    const path = WATCHED[resource];
    if (has(path) && Number(now(path)) < Number(before[path])) {
      events.push({ event: 'resourceSpent', vars: { resource, spent: Number(before[path]) - Number(now(path)) } });
    }
  }

  const health = WATCHED.health;
  if (has(health) && Number(now(health)) < Number(before[health])) {
    events.push({ event: 'takesDamage', damage: { amount: Number(before[health]) - Number(now(health)), damageType: null } });
  }

  const stun = WATCHED.stun;
  if (has(stun) && Number(now(stun)) > Number(before[stun])) {
    events.push({ event: 'takesDamage', damage: { amount: Number(now(stun)) - Number(before[stun]), damageType: 'stun' } });
  }

  if (type == 'megaform' && has('system.actors')) {
    events.push({ event: 'megaformCombined', vars: { participants } });
  }

  return events;
}
