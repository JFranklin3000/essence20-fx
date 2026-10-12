import { MODULE_ID, setting } from "./settings.mjs";
import { AMBIENCES, ambiencePlan } from "./scene-ambience-plan.mjs";

/**
 * Scene ambience: the loop a GM picks for a scene (Scene Configuration → Environment → "Essence20 FX ambience"), played by
 * each client for itself - so a player's Reduced motion keeps it off their screen - and never saved to the scene beyond
 * the one flag naming the look.
 */

const PREFIX = 'e20fx-scene-';

/** What's playing now: the scene and look, so a re-check with nothing changed does nothing. */
let playing = { sceneId: null, key: null };

function clear() {
  for (const effect of Sequencer.EffectManager.getEffects({ sceneId: canvas.scene?.id }).filter(e => String(e.data?.name ?? '').startsWith(PREFIX))) {
    Sequencer.EffectManager.endEffects({ name: effect.data.name, sceneId: canvas.scene.id });
  }

  playing = { sceneId: null, key: null };
}

/** The look this client should show on the viewed scene, or null. */
function wantedKey() {
  const on = game.system?.id == 'essence20' && setting('enabled') && setting('sceneAmbience') && !game.user.getFlag(MODULE_ID, 'reducedMotion');
  const key = on ? canvas.scene?.getFlag(MODULE_ID, 'ambience') : null;
  return key && AMBIENCES[key] ? key : null;
}

/** Bring the viewed scene's ambience in line with its flag and the settings. */
export function syncScene({ force = false } = {}) {
  if (!globalThis.Sequencer || !canvas?.ready || !canvas.scene) {
    return;
  }

  const key = wantedKey();
  if (!force && playing.sceneId == canvas.scene.id && playing.key == key) {
    return;
  }

  clear();
  if (!key) {
    return;
  }

  const plan = ambiencePlan(key, canvas.dimensions.sceneRect, canvas.scene.id);
  const sequence = new Sequence({ moduleName: MODULE_ID, softFail: true });
  plan.forEach((spot, index) => {
    const effect = sequence.effect().file(spot.file).atLocation({ x: spot.x, y: spot.y }).size(spot.size, { gridUnits: false })
      .opacity(spot.opacity).belowTokens().persist().locally().name(`${PREFIX}${index}`).fadeIn(1500).fadeOut(1500)
      .randomRotation();
    if (spot.shift) {
      effect.filter('ColorMatrix', spot.shift);
    }

    if (spot.tint) {
      effect.tint(spot.tint);
    }
  });
  sequence.play();
  playing = { sceneId: canvas.scene.id, key };
}

/**
 * The GM's choice, in Scene Configuration's Ambience tab: a select saved as flags.essence20-fx.ambience with the
 * rest of the form.
 */
function addSceneField(app, element) {
  const scene = app.document;
  // v14 keeps a scene's sound and atmosphere in its Environment tab (v13's was Ambience); else the Basics tab.
  const tab = ['environment', 'ambience', 'basics'].map(id => element.querySelector(`div.tab[data-tab="${id}"]`)).find(Boolean) ?? element;
  if (!scene || tab.querySelector('[name="flags.essence20-fx.ambience"]')) {
    return;
  }

  const current = scene.getFlag(MODULE_ID, 'ambience') ?? '';
  const options = [['', game.i18n.localize('E20FX.SceneAmbience.None')], ...Object.keys(AMBIENCES).map(key => [key, game.i18n.localize(`E20FX.SceneAmbience.Looks.${key}`)])];
  const group = document.createElement('div');
  group.className = 'form-group';
  const id = `e20fx-ambience-${scene.id}`;
  group.innerHTML = `<label for="${id}">${game.i18n.localize('E20FX.SceneAmbience.Label')}</label>
    <div class="form-fields"><select id="${id}" name="flags.essence20-fx.ambience">${options.map(([value, label]) => `<option value="${value}"${value == current ? ' selected' : ''}>${foundry.utils.escapeHTML(label)}</option>`).join('')}</select></div>
    <p class="hint">${game.i18n.localize('E20FX.SceneAmbience.Hint')}</p>`;
  tab.append(group);
}

export function registerSceneAmbience() {
  Hooks.on('canvasReady', () => {
    playing = { sceneId: null, key: null };
    setTimeout(() => syncScene(), 600);
  });
  Hooks.on('updateScene', (scene, changed) => {
    if (scene.id == canvas.scene?.id && changed.flags?.[MODULE_ID] !== undefined) {
      syncScene();
    }
  });
  Hooks.on('updateSetting', changed => {
    if (changed.key?.startsWith(`${MODULE_ID}.`)) {
      syncScene({ force: true });
    }
  });
  Hooks.on('updateUser', (user, changed) => {
    if (user.isSelf && changed.flags?.[MODULE_ID]) {
      syncScene({ force: true });
    }
  });
  Hooks.on('renderSceneConfig', (app, element) => {
    if (game.user.isGM) {
      addSceneField(app, element instanceof HTMLElement ? element : element?.[0]);
    }
  });
}
