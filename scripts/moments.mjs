/**
 * What happened -> the "moments" to play. Pure: no Foundry globals, so it is tested with `node --test`.
 * A moment is { key, source, target?, damageType?, area? }: key names a preset (presets.mjs); source/target are actors;
 * area is an essence20.areaPlaced payload.
 */

/** At most this many targets get their own projectile and impact; the rest of a bigger crowd get none. */
export const MAX_TARGETS = 8;

/** How long a placed area waits for its roll (ms). */
export const AREA_WINDOW = 120000;

/**
 * Whether an area placed earlier belongs to this roll: the same actor and item, placed within AREA_WINDOW.
 * @param {Object|null} area   { actor, item, at } (at: Date.now() when placed)
 * @param {Object} roll
 * @param {Number} now
 */
export function areaFor(area, roll, now) {
  const same = (a, b) => a === b || (!!a?.uuid && a.uuid === b?.uuid);
  return !!area && same(area.actor, roll.actor) && (!area.item || !roll.item || same(area.item, roll.item)) && now - area.at <= AREA_WINDOW;
}

/**
 * A finished roll (the system's essence20.rollResolved hook) -> its moments: one per target, a Fumble on the attacker,
 * or - when an area was placed for it - the area's burst plus an impact on each target hit.
 * Attacks, and any roll with an area (a spell's or Power's too); another Skill Test against a target plays nothing.
 * @param {Object} roll    The hook's payload.
 * @param {Object} [area]  The essence20.areaPlaced payload placed for this roll, if any.
 * @returns {Array<Object>}
 */
export function rollMoments(roll = {}, area = null) {
  const { actor, isAttack, isMelee, isCrit, isFumble, damageType = null, style = null, targets = [] } = roll;
  if (!actor || (!isAttack && !area)) {
    return [];
  }

  if (isFumble) {
    return [{ key: 'attack.fumble', source: actor }];
  }

  const rows = targets.filter(entry => entry?.actor);
  if (area) {
    return [
      { key: `area.${area.shape}`, source: actor, damageType, style, area },
      ...rows.filter(row => row.hit).map(({ actor: target }) => ({ key: isCrit ? 'attack.area.critical' : 'attack.area.hit', source: actor, target, damageType, style })),
    ];
  }

  const reach = isMelee ? 'melee' : 'ranged';
  return rows.slice(0, MAX_TARGETS).map(({ actor: target, hit }) => ({
    key: `attack.${reach}.${!hit ? 'miss' : isCrit ? 'critical' : 'hit'}`,
    source: actor,
    target,
    damageType,
    style,
  }));
}

/** The world's game line (the system's gameLine setting; "" for all lines), or null - outside Foundry, always null. */
function worldLine() {
  try {
    return globalThis.game?.settings?.get?.('essence20', 'gameLine') || null;
  } catch {
    return null;
  }
}

/**
 * The game line an actor plays in: its Role's (system.version: giJoe, myLittlePony...), else the world's (so a pony
 * table's NPCs get the pony look too), else null.
 */
export function lineOf(actor) {
  return actor?.items?.find?.(item => item?.type == 'role')?.system?.version ?? worldLine();
}

/**
 * An actor's effect colour as hex text: its own FX colour (set in its Configure FX window), else its sheet colour
 * (system.color is a Foundry Color, a Number).
 */
export const colorOf = actor => actor?.flags?.['essence20-fx']?.color || (actor?.system?.color ? String(actor.system.color) : null);

/**
 * A roll with one of the "any" Skills -> its flourish on the roller: Spellcasting's sparkles (in their colour), the
 * Weird's static. Played alongside the attack's own moments when the roll was an attack.
 * @param {Object} roll   The essence20.rollResolved payload.
 */
export function skillMoments({ actor, skill, isFumble } = {}) {
  if (!actor || isFumble) {
    return [];
  }

  const key = { spellcasting: 'spell.cast', weird: 'weird.used' }[skill];
  return key ? [{ key, source: actor, color: colorOf(actor), line: lineOf(actor) }] : [];
}

/**
 * A rules event (the system's essence20.event hook) -> its moments: damage taken, Defeated, a Condition arriving.
 * @param {Object} payload   { actor, event, damage, vars }
 * @returns {Array<Object>}
 */
export function eventMoments({ actor, event, damage, vars } = {}) {
  if (!actor) {
    return [];
  }

  switch (event) {
  case 'takesDamage':
    return Number(damage?.amount) > 0 ? [{ key: 'damage.taken', source: actor, damageType: damage.damageType ?? null }] : [];
  case 'defeated':
    return [{ key: 'damage.defeated', source: actor }];
  case 'conditionGained':
    // Defeated has its own moment; the rest are looked up in CONDITIONS (an unknown one plays nothing).
    return (vars?.statuses ?? []).filter(status => status != 'defeated').map(status => ({ key: `condition.${status}`, source: actor }));
  default:
    return [];
  }
}

/** Where a token was, for a moment played as it leaves the map: its centre and width (canvas pixels). */
const spot = token => (token ? { x: token.x + token.width / 2, y: token.y + token.height / 2, w: token.width } : null);

/** A TokenDocument's size in pixels, from its grid units. */
const tokenSpot = (doc, grid = 100) => (doc ? spot({ x: doc.x, y: doc.y, width: (doc.width ?? 1) * grid, height: (doc.height ?? 1) * grid }) : null);

/**
 * Signature rules events -> moments: Morph / Unmorph (in the Ranger's own colour), Transform / back to Bot Mode,
 * Energon spent, and a Megaform forming. `counts` remembers each Megaform's size (by uuid), so a roster that grew
 * reads as forming and one that shrank (breaking apart, a member leaving) doesn't.
 * @param {Object} payload   The essence20.event payload.
 * @param {Map} [counts]
 * @returns {Array<Object>}
 */
export function signatureMoments({ actor, event, vars } = {}, counts = new Map()) {
  if (!actor) {
    return [];
  }

  switch (event) {
  case 'morph':
  case 'unmorph':
    // system.color is a Foundry Color (a Number) - Sequencer's tint wants the hex string.
    return [{ key: event, source: actor, color: colorOf(actor) }];
  case 'transform':
  case 'untransform':
    return [{ key: event, source: actor }];
  case 'resourceSpent':
    return ['energon', 'darkEnergon'].includes(vars?.resource) ? [{ key: 'energon.spent', source: actor }] : [];
  case 'storyPointSpent':
    return [{ key: 'storyPoint.spent', source: actor, line: lineOf(actor) }];
  // The one helped (the event fires on them, with the helper as its target).
  case 'assisted':
    return [{ key: 'assist.given', source: actor, line: lineOf(actor) }];
  case 'rerolled':
    return [{ key: 'rerolled', source: actor, line: lineOf(actor) }];
  case 'megaformCombined': {
    const now = Number(vars?.participants) || 0;
    const before = counts.get(actor.uuid);
    counts.set(actor.uuid, now);
    return now >= 2 && (before === undefined || now > before) ? [{ key: 'megaform.formed', source: actor }] : [];
  }
  default:
    return [];
  }
}

/**
 * The Zord and Megaform hooks (essence20.zordSummoned, zordArrived...) -> moments. A Zord leaving the map, or a Ranger
 * climbing in, plays where their token was (`at`) - the token is gone by the time Sequencer draws.
 * @param {String} hook      The hook's name after "essence20."
 * @param {Object} payload
 * @param {Number} [grid]    The scene's grid size (px), for a TokenDocument's footprint.
 * @returns {Array<Object>}
 */
export function zordMoments(hook, payload = {}, grid = 100) {
  const { zord, ranger, form } = payload;
  switch (hook) {
  case 'zordSummoned':
    return ranger ? [{ key: 'zord.summoned', source: ranger }] : [];
  case 'zordArrived':
    return [{ key: 'zord.arrived', soundOnly: true }];
  case 'zordPlaced':
    return zord ? [{ key: 'zord.placed', source: zord, at: tokenSpot(payload.token, grid) }] : [];
  case 'zordBoarded':
    return payload.rangerToken ? [{ key: 'zord.boarded', at: tokenSpot(payload.rangerToken, grid) }] : [];
  case 'zordDisembarked':
    return ranger ? [{ key: 'zord.disembarked', source: ranger }] : [];
  case 'zordRecalled':
    return payload.zordToken ? [{ key: 'zord.recalled', at: tokenSpot(payload.zordToken, grid) }] : [];
  case 'megaformSplit':
    return form ? [{ key: 'megaform.split', source: form }] : [];
  case 'requisitionGranted':
    return payload.member ? [{ key: 'requisition.granted', source: payload.member }] : [];
  default:
    return [];
  }
}

/**
 * How to turn JB2A's blue art into a colour (a Ranger's): a hue rotation from blue, or - for white, black, silver and
 * other greys, which have no hue to turn to - drained of colour and lightened or darkened.
 * @param {String} hex        '#rrggbb'
 * @param {Number} [baseHue]  The art's own hue (JB2A's blues sit near 210)
 * @returns {Object|null}     ColorMatrix filter values, or null for no change
 */
export function colorShift(hex, baseHue = 210) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? '').trim());
  if (!match) {
    return null;
  }

  const [r, g, b] = [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const chroma = max - min;
  if (chroma < 0.15) {
    return { saturate: -1, brightness: lightness > 0.5 ? 1.5 : 0.45 };
  }

  let hue = max == r ? ((g - b) / chroma) % 6 : max == g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
  hue = (hue * 60 + 360) % 360;
  const turn = Math.round(((hue - baseHue + 540) % 360) - 180);
  return { hue: turn };
}

/**
 * The burst limit: at most `max` moments in any `windowMs`, oldest first; the rest are dropped.
 * @param {Number[]} history   When earlier moments played (ms) - updated in place.
 * @param {Number} count       How many want to play now.
 * @param {Number} now
 * @returns {Number}           How many may.
 */
export function allowed(history, count, now, { max = 12, windowMs = 1000 } = {}) {
  while (history.length && now - history[0] > windowMs) {
    history.shift();
  }

  const room = Math.max(0, Math.min(count, max - history.length));
  for (let i = 0; i < room; i++) {
    history.push(now);
  }

  return room;
}

/**
 * Whether a token's movement (Foundry v14's moveToken) was a teleport: any waypoint of it that teleports - Foundry's own
 * Blink and Displace movement actions, and the system's rules moves that jump rather than walk (a Wrist Communicator,
 * a Perk's moveTo with animate: false).
 * @param {Object} movement   The moveToken hook's movement data.
 * @returns {Boolean}
 */
export function isTeleportMovement(movement) {
  const waypoints = [...(movement?.passed?.waypoints ?? []), ...(movement?.pending?.waypoints ?? [])];
  return waypoints.some(waypoint => waypoint?.teleport || ['blink', 'displace'].includes(waypoint?.action));
}

/**
 * The teleport moment: from where the token left to where it landed, in the actor's colour and game line's look.
 * Not drawn on the token (which has already moved), but at the two points; hidden tokens play for the GM only.
 * @param {Object} options
 * @param {Actor} options.actor
 * @param {{x, y}} options.from   Where the token's centre was.
 * @param {{x, y}} options.to     Where it is now.
 * @param {Number} options.width  The token's width in pixels.
 * @param {Boolean} [options.hidden]
 * @returns {Object[]}
 */
export function teleportMoments({ actor, from, to, width, hidden = false }) {
  if (!from || !to || (from.x == to.x && from.y == to.y)) {
    return [];
  }

  // A transforming actor with no Role (a Cybertronian Threat) still steps through a bridge.
  const line = actor?.items?.find?.(item => item?.type == 'role') ? lineOf(actor) : (actor?.system?.canTransform ? 'transformers' : lineOf(actor));
  return [{ key: 'teleport', from, at: { x: to.x, y: to.y, w: width }, color: colorOf(actor), line, hidden, actor }];
}
