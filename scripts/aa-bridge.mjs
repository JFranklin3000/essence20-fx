import { setting } from "./settings.mjs";
import { AUTOREC_MENUS, aaWouldAnimate } from "./aa-match.mjs";
import { tokenOf } from "./play.mjs";

/**
 * The Automated Animations bridge (optional - only when that module is active). Automated Animations has no Essence20
 * support of its own, so it never sees our rolls; this hands it each finished attack - the attacker's token, the item,
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
