import { MODULE_ID, registerSettings, setting, syncReducedMotion } from "./settings.mjs";
import { areaFor, eventMoments, rollMoments, signatureMoments, skillMoments, zordMoments } from "./moments.mjs";
import { playMoments } from "./play.mjs";
import { FxConfig } from "./config-app.mjs";
import { FactionEmblems } from "./emblems-app.mjs";
import { registerAmbient } from "./ambient.mjs";
import { registerDiceHooks } from "./dice.mjs";
import { registerSceneAmbience } from "./scene-ambience.mjs";
import { registerChatEmblem } from "./chat-emblem.mjs";
import { aaHasAnimation, attackGoesToAA, playWithAA } from "./aa-bridge.mjs";
import { AutorecInstaller, installAutorec, offerAutorecOnce } from "./aa-autorec-install.mjs";

// The windows' stylesheet, attached here as well as listed in module.json: a module.json change only takes effect when
// the world restarts, and without it the windows can't scroll.
if (!document.querySelector(`link[href*="${MODULE_ID}/styles/config.css"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `modules/${MODULE_ID}/styles/config.css`;
  document.head.append(link);
}

registerAmbient();
registerDiceHooks();
registerSceneAmbience();
registerChatEmblem();
offerAutorecOnce();

/**
 * Essence20 FX: listens to the system's essence20.* hooks (its docs/ARCHITECTURE.md, "Hooks for modules") and plays
 * animations and sounds through Sequencer. The hooks fire on the client that made the thing happen, and Sequencer
 * broadcasts - so nothing here plays effects received from other clients.
 */

Hooks.once('init', () => {
  registerSettings();
  game.settings.registerMenu(MODULE_ID, 'configure', {
    name: 'E20FX.Config.Title',
    label: 'E20FX.Config.Open',
    hint: 'E20FX.Config.Hint',
    icon: 'fa-solid fa-wand-sparkles',
    type: FxConfig,
    restricted: true,
  });
  game.settings.registerMenu(MODULE_ID, 'autorec', {
    name: 'E20FX.Autorec.Title',
    label: 'E20FX.Autorec.Open',
    hint: 'E20FX.Autorec.Hint',
    icon: 'fa-solid fa-wand-magic-sparkles',
    type: AutorecInstaller,
    restricted: true,
  });
  game.settings.registerMenu(MODULE_ID, 'emblems', {
    name: 'E20FX.Emblems.Title',
    label: 'E20FX.Emblems.Open',
    hint: 'E20FX.Emblems.Hint',
    icon: 'fa-solid fa-shield-halved',
    type: FactionEmblems,
    restricted: true,
  });
});

// An actor's own effects, from its sheet's header menu - for whoever owns it (a player's Ranger's Morph, say).
Hooks.on('getHeaderControlsApplicationV2', (app, controls) => {
  const actor = app.document;
  if (actor?.documentName != 'Actor' || !actor.isOwner || game.system?.id != 'essence20') {
    return;
  }

  controls.push({
    icon: 'fa-solid fa-wand-sparkles',
    label: 'E20FX.Config.ActorButton',
    action: 'essence20FxConfigure',
    onClick: () => new FxConfig({ actor }).render(true),
  });
});

/** Sequencer is required; without JB2A the sounds still play and the animations are skipped. Said once, to a GM. */
Hooks.once('ready', () => {
  syncReducedMotion();
  if (!game.user.isGM) {
    return;
  }

  if (!game.modules.get('sequencer')?.active) {
    ui.notifications.warn(game.i18n.localize('E20FX.NeedsSequencer'));
  } else if (!game.modules.get('JB2A_DnD5e')?.active && !game.modules.get('jb2a_patreon')?.active) {
    ui.notifications.info(game.i18n.localize('E20FX.NoJB2A'));
  }
});

const on = kind => game.system?.id == 'essence20' && !!globalThis.Sequence && setting('enabled') && setting(kind);

// An area is placed before its roll: kept until that roll comes in (moments.mjs#areaFor).
let lastArea = null;
Hooks.on('essence20.areaPlaced', area => {
  lastArea = { ...area, at: Date.now() };
});

Hooks.on('essence20.rollResolved', roll => {
  const area = areaFor(lastArea, roll, Date.now()) ? lastArea : null;
  if (area) {
    lastArea = null;
  }

  // An attack Automated Animations will animate goes to it (aa-bridge.mjs); the rest play here.
  if (on('combat') && !(attackGoesToAA(roll, area) && playWithAA(roll))) {
    playMoments(rollMoments(roll, area));
  }

  if (on('extras')) {
    playMoments(skillMoments(roll));
  }
});

const EVENT_KINDS = { takesDamage: 'damage', defeated: 'damage', conditionGained: 'conditions' };
const SIGNATURE_EVENTS = ['morph', 'unmorph', 'transform', 'untransform', 'resourceSpent', 'megaformCombined'];
const EXTRA_EVENTS = ['storyPointSpent', 'assisted', 'rerolled'];
// Each Megaform's size when last seen, so a roster that grew plays as forming (moments.mjs#signatureMoments).
const megaformSizes = new Map();
Hooks.on('essence20.event', payload => {
  const kind = EVENT_KINDS[payload?.event];
  if (kind && on(kind)) {
    playMoments(eventMoments(payload));
  }

  if ((SIGNATURE_EVENTS.includes(payload?.event) && on('signature')) || (EXTRA_EVENTS.includes(payload?.event) && on('extras'))) {
    playMoments(signatureMoments(payload, megaformSizes));
  }
});

// Zords arriving, boarding and leaving; Megaforms breaking apart (forming is the megaformCombined event above).
const EXTRA_HOOKS = ['requisitionGranted'];
for (const hook of ['zordSummoned', 'zordArrived', 'zordPlaced', 'zordBoarded', 'zordDisembarked', 'zordRecalled', 'megaformSplit', ...EXTRA_HOOKS]) {
  Hooks.on(`essence20.${hook}`, payload => {
    if (on(EXTRA_HOOKS.includes(hook) ? 'extras' : 'signature')) {
      playMoments(zordMoments(hook, payload, canvas?.grid?.size ?? 100));
    }
  });
}

globalThis[MODULE_ID] = { rollMoments, eventMoments, signatureMoments, skillMoments, zordMoments, playMoments, aaHasAnimation, installAutorec };
