import { MODULE_ID, setting } from "./settings.mjs";
import { AMBIENT, ambientKey, ambientName, wantedAmbient } from "./ambient-state.mjs";
import { colorOf, colorShift } from "./moments.mjs";
import { emblemFor } from "./emblems.mjs";
import { isFilePath } from "./overrides.mjs";

/**
 * Ambient effects: lasting, looping effects a token wears while a state lasts - a Morphed Ranger's aura, Stunned stars,
 * a Zord's dust, the active combatant's ring, its faction badge (ambient-state.mjs says which). Each client keeps its
 * own (played locally, never saved to the scene), so each viewer's Reduced motion and sight of hidden tokens apply, and
 * nothing needs a GM to write anything.
 */

const ready = () => game.system?.id == 'essence20' && !!globalThis.Sequencer && setting('enabled');

/** Whether Sequencer can play this: a file, or a database path it knows. */
function known(path) {
  try {
    return !!path && (isFilePath(path) || Sequencer.Database.entryExists(path));
  } catch {
    return false;
  }
}

/** Whether it's this token's turn in a running combat on this scene. */
function isActive(token) {
  const combat = game.combat;
  return !!combat?.started && combat.combatant?.tokenId == token.id && (!combat.scene || combat.scene.id == canvas.scene?.id);
}

/** Put one ambient effect on a token. */
function start(token, key, emblem) {
  const look = AMBIENT[key];
  const file = key == 'badge' ? emblem?.img : look?.file;
  if (!look || !known(file)) {
    return;
  }

  const sequence = new Sequence({ moduleName: MODULE_ID, softFail: true });
  // A corner badge sits inside the token's corner; everything else is centred on it.
  const attach = look.corner ? { bindVisibility: true, align: look.corner, edge: 'inner' } : { bindVisibility: true };
  const effect = sequence.effect().file(file).attachTo(token, attach).scaleToObject(look.scale ?? 1).opacity(look.opacity ?? 1)
    .persist().locally().name(ambientName(key, token.id)).fadeIn(400).fadeOut(400);
  if (look.below) {
    effect.belowTokens();
  }

  const shift = look.recolor ? colorShift(colorOf(token.actor)) : null;
  if (shift) {
    effect.filter('ColorMatrix', shift);
  }

  if (key == 'badge' && /^#[0-9a-f]{6}$/i.test(emblem?.tint ?? '')) {
    effect.tint(emblem.tint);
  }

  sequence.play();
}

/** Bring one token's ambient effects in line with its state. */
export function syncToken(token) {
  if (!globalThis.Sequencer || !token?.actor || !canvas?.ready || token.document?.parent !== canvas.scene) {
    return;
  }

  const visible = !token.document.hidden || game.user.isGM;
  const on = ready() && visible && !game.user.getFlag(MODULE_ID, 'reducedMotion');
  const show = on ? { states: setting('ambient'), conditions: setting('ambient'), active: setting('ambientActive'), badges: setting('emblemBadge') } : {};
  const emblem = show.badges ? emblemFor(token.actor) : null;
  const wanted = new Set(wantedAmbient(token.actor, { active: isActive(token), emblem, show }));

  const current = Sequencer.EffectManager.getEffects({ object: token }).filter(effect => ambientKey(effect.data?.name, token.id));
  const have = new Set();
  for (const effect of current) {
    const key = ambientKey(effect.data.name, token.id);
    if (wanted.has(key)) {
      have.add(key);
    } else {
      Sequencer.EffectManager.endEffects({ name: effect.data.name, object: token });
    }
  }

  for (const key of wanted) {
    if (!have.has(key)) {
      start(token, key, emblem);
    }
  }
}

/** Every token on the scene. */
export function syncAll() {
  for (const token of canvas?.tokens?.placeables ?? []) {
    syncToken(token);
  }
}

/** Take every ambient effect off (then syncAll puts back what's wanted - used when an emblem's image changes). */
export function clearAll() {
  for (const token of canvas?.tokens?.placeables ?? []) {
    for (const effect of Sequencer.EffectManager.getEffects({ object: token }).filter(e => ambientKey(e.data?.name, token.id))) {
      Sequencer.EffectManager.endEffects({ name: effect.data.name, object: token });
    }
  }
}

const syncActor = actor => actor?.getActiveTokens?.(false)?.forEach(syncToken);

/** Wire the hooks: anything that can change a token's state re-checks it. */
export function registerAmbient() {
  Hooks.on('canvasReady', () => setTimeout(syncAll, 500));
  Hooks.on('createToken', doc => setTimeout(() => syncToken(doc.object), 300));
  Hooks.on('updateToken', (doc, changed) => {
    if ('hidden' in changed) {
      syncToken(doc.object);
    }
  });
  Hooks.on('updateActor', syncActor);
  Hooks.on('createActiveEffect', effect => syncActor(effect.parent));
  Hooks.on('deleteActiveEffect', effect => syncActor(effect.parent));
  Hooks.on('createItem', item => (item.type == 'faction' ? syncActor(item.parent) : null));
  Hooks.on('deleteItem', item => (item.type == 'faction' ? syncActor(item.parent) : null));
  for (const hook of ['updateCombat', 'deleteCombat', 'combatStart']) {
    Hooks.on(hook, () => syncAll());
  }

  Hooks.on('updateSetting', setting => {
    if (setting.key?.startsWith(`${MODULE_ID}.`)) {
      clearAll();
      syncAll();
    }
  });
  Hooks.on('updateUser', (user, changed) => {
    if (user.isSelf && changed.flags?.[MODULE_ID]) {
      clearAll();
      syncAll();
    }
  });
}
