import { setting } from "./settings.mjs";
import { AUTOREC_MENUS, aaWouldAnimate } from "./aa-match.mjs";
import { tokenOf } from "./play.mjs";

/**
 * The Automated Animations bridge (optional - only when that module is active). Automated Animations has no Essence20
 * support of its own - its generic chat-card fallback can't tell hits from misses, and is muted for attack cards
 * (muteAAAttackCards) - so this hands it each finished attack - the attacker's token, the item,
 * every target and which were hit - and Essence20 FX leaves that attack to it. Which attacks go is the GM's
 * "Attack animations by" setting: Essence20 FX only, Automated Animations for every attack, or Automated Animations
 * when it has an animation for the item (its own item settings, or a name its Automatic Recognition knows) and
 * Essence20 FX otherwise. Everything that isn't an attack stays with Essence20 FX.
 */

export const AA_ID = 'autoanimations';

export const aaActive = () => !!game.modules.get(AA_ID)?.active && !!globalThis.AutomatedAnimations?.playAnimation;

/** The item's weapon, for a weapon effect (Automated Animations' name matching tries it after the effect's own name). */
function weaponOf(item) {
  const parentId = item?.getFlag?.('essence20', 'parentId');
  const id = parentId ? String(parentId).split('.').pop() : null;
  return id ? item.actor?.items?.get(id) ?? null : null;
}

/** The names Automated Animations should try, in order. */
function namesOf(item) {
  return [item?.name, weaponOf(item)?.name].filter(Boolean);
}

function aaSetting(key, fallback) {
  try {
    return game.settings.get(AA_ID, key);
  } catch {
    return fallback;
  }
}

/** Whether Automated Animations would animate this item (aa-match.mjs, with its settings read live). */
export function aaHasAnimation(item) {
  if (!item) {
    return false;
  }

  const menus = Object.fromEntries(AUTOREC_MENUS.map(key => [key, aaSetting(`aaAutorec-${key}`, [])]));
  return aaWouldAnimate({ flags: item.flags?.[AA_ID] ?? {}, names: namesOf(item), menus, autorecDisabled: !!aaSetting('disableAutoRec', false) });
}

/**
 * Whether this roll's attack goes to Automated Animations (by the setting, and what it can animate). Areas stay with
 * Essence20 FX: it has the placed shape, which Automated Animations isn't handed.
 */
export function attackGoesToAA(roll, area) {
  if (!aaActive() || !roll?.isAttack || !roll.item || area || roll.isFumble) {
    return false;
  }

  const mode = setting('attackAnimator');
  return mode == 'aa' || (mode == 'aaFirst' && aaHasAnimation(roll.item));
}

/** An Essence20 attack roll's chat card (the system stamps isAttack and the effect's itemUuid on it). */
export const isAttackCard = message => !!message?.flags?.essence20?.isAttack;

const MUTED = Symbol('e20fx-muted');

/**
 * Automated Animations does see our rolls after all: for a system it has no support for, it animates every chat card it
 * can find an item and a speaker token on (its createChatMessage fallback), and an attack card names its weapon effect.
 * With this bridge handing it the same attack, every attack played twice. While Essence20 FX handles attacks
 * (`handles()`), its chat-card listener skips attack cards - the bridge gives it the targets and hits instead, and
 * Essence20 FX plays the rest. Other cards (an item shown in chat) are left to it. Safe to call again.
 * @param {Function} handles   Whether Essence20 FX is handling attacks right now.
 * @param {Object} [hooks]     Foundry's Hooks (tests pass their own).
 * @returns {Number}   How many listeners were wrapped this call.
 */
export function muteAAAttackCards(handles, hooks = globalThis.Hooks) {
  let wrapped = 0;
  for (const entry of hooks?.events?.createChatMessage ?? []) {
    const fn = entry?.fn;
    if (typeof fn != 'function' || fn[MUTED] || !/checkChatMessage/.test(String(fn))) {
      continue;
    }

    entry.fn = Object.assign(function(message, ...rest) {
      return isAttackCard(message) && handles() ? undefined : fn.call(this, message, ...rest);
    }, { [MUTED]: true });
    wrapped++;
  }

  return wrapped;
}

/**
 * Hand an attack to Automated Animations: the attacker's token, the item, all targets, the ones hit - misses animate
 * as misses.
 * @returns {Boolean}   Whether it was handed over (false when the attacker isn't on the map).
 */
export function playWithAA(roll) {
  const source = tokenOf(roll.actor);
  if (!source) {
    return false;
  }

  const rows = (roll.targets ?? []).map(row => ({ token: tokenOf(row?.actor), hit: !!row?.hit })).filter(row => row.token);
  const weapon = weaponOf(roll.item);
  globalThis.AutomatedAnimations.playAnimation(source, roll.item, {
    targets: rows.map(row => row.token),
    hitTargets: rows.filter(row => row.hit).map(row => row.token),
    playOnMiss: true,
    ...(weapon ? { extraNames: [weapon.name] } : {}),
  });
  return true;
}
