import { MODULE_ID } from "./settings.mjs";

/**
 * Guided tours, under Manage Tours, on the system's own tour engine (Essence20Tour: optional steps, demo actors, windows
 * it opens and closes again, tabs inside a window) with this module's windows added as places a step can point at. A GM
 * is offered "Start here" once per world. On a system without the engine (6.0.4) there are simply no tours.
 *
 * A step's `app` names a window to open first:
 *  - "settings": Configure Settings (with `tab` + `tabGroup: "categories"` for a category).
 *  - "configureFx", "factionEmblems": the GM's windows from this module's settings.
 *  - "sceneConfig": the viewed scene's Scene Configuration, on the tab holding the ambience choice.
 *  - "actorEffects": the Effects window of the system's demo character (or, for a player who can't make one, their own).
 *  - "character" (the system's): the demo character's sheet.
 * Nothing a tour opens is saved: the windows close unsaved when it moves on.
 */

/** The tours in Manage Tours order: [file under tours/, id]. Renaming an id resets everyone's progress on it. */
export const TOURS = [
  ['start-here', 'startHere'],
  ['configure-fx', 'configureFx'],
  ['faction-emblems', 'factionEmblems'],
  ['scene-ambience', 'sceneAmbience'],
  ['my-effects', 'myEffects'],
];

/** The `app` keys a step may use: this module's, and the system's that the tours use. */
export const APP_KEYS = ['settings', 'configureFx', 'factionEmblems', 'sceneConfig', 'actorEffects', 'character'];

/** The world flag that remembers the welcome offer was made. */
const OFFERED = 'toursOffered';

/**
 * The tour class, built on the system's: it's only known once the system's tour engine has loaded.
 * @param {typeof foundry.nue.Tour} Essence20Tour
 */
export function fxTourClass(Essence20Tour) {
  const menuApp = (menu, id) => ({ id, open: async () => new (game.settings.menus.get(`${MODULE_ID}.${menu}`).type)() });

  return class FxTour extends Essence20Tour {
    static STANDALONE_APPS = {
      ...Essence20Tour.STANDALONE_APPS,
      settings: { id: 'settings-config', open: async () => new foundry.applications.settings.SettingsConfig() },
      configureFx: menuApp('configure', 'essence20-fx-config'),
      factionEmblems: menuApp('emblems', 'essence20-fx-emblems'),
    };

    /** The GM's tours need a GM; "my-effects" is for everyone, with a character to show (the system's rule). */
    get canStart() {
      if (!game.ready || game.system?.id != 'essence20') {
        return false;
      }

      if (this.config.restricted && !game.user.isGM) {
        return false;
      }

      if ((this.config.steps ?? []).some(step => step.app == 'sceneConfig') && !canvas?.scene) {
        return false;
      }

      return super.canStart;
    }

    async _ensureApp(key) {
      if (key == 'sceneConfig') {
        return this.#openSceneConfig();
      }

      if (key == 'actorEffects') {
        return this.#openActorEffects();
      }

      return super._ensureApp(key);
    }

    /** The viewed scene's Scene Configuration, on the tab the ambience choice is added to. */
    async #openSceneConfig() {
      const sheet = canvas?.scene?.sheet;
      if (!sheet) {
        return null;
      }

      const weOpened = !sheet.rendered;
      if (weOpened) {
        await sheet.render(true);
        await this._waitForRender(sheet);
      }

      const field = '[name="flags.essence20-fx.ambience"]';
      const tab = sheet.element?.querySelector(field)?.closest('.tab[data-tab]');
      if (tab && !tab.classList.contains('active')) {
        sheet.changeTab(tab.dataset.tab, tab.dataset.group ?? 'sheet');
        await this._frame();
      }

      return this._attachIfDetached(this._track(sheet, weOpened));
    }

    /** The demo character's own Effects window (scripts/config-app.mjs, opened as its header menu does). */
    async #openActorEffects() {
      const sheet = await this._ensureActorSheet(this.constructor.DEMO_APPS.character ?? 'character');
      const actor = sheet?.document;
      if (!actor) {
        return null;
      }

      const id = `essence20-fx-config-${actor.id}`;
      const existing = foundry.applications.instances.get(id);
      if (existing) {
        return this._attachIfDetached(existing);
      }

      const { FxConfig } = await import('./config-app.mjs');
      const app = new FxConfig({ actor });
      await app.render(true);
      await this._waitForRender(app);
      return this._attachIfDetached(this._track(app, true));
    }
  };
}

/** Register the tours (on "setup", like the system's: game.tours exists and i18n is live). */
export async function registerTours() {
  if (game.system?.id != 'essence20') {
    return;
  }

  let Essence20Tour;
  try {
    ({ Essence20Tour } = await import(foundry.utils.getRoute('systems/essence20/module/tours/essence20-tour.mjs')));
  } catch (err) {
    console.info(`${MODULE_ID} | This Essence20 version has no tour engine, so there are no Essence20 FX tours`, err);
    return;
  }

  const FxTour = fxTourClass(Essence20Tour);
  for (const [file, id] of TOURS) {
    try {
      const tour = await FxTour.fromJSON(`modules/${MODULE_ID}/tours/${file}.json`);
      game.tours.register(MODULE_ID, id, tour);
    } catch (err) {
      console.error(`${MODULE_ID} | Failed to register tour "${file}"`, err);
    }
  }
}

/** The first time a GM loads a world with the module on: offer the Start here tour, once per world. */
export async function offerStartHere() {
  if (!game.user.isActiveGM || game.settings.get(MODULE_ID, OFFERED)) {
    return;
  }

  const tour = game.tours.get(`${MODULE_ID}.startHere`);
  if (!tour?.canStart || tour.status == foundry.nue.Tour.STATUS.COMPLETED) {
    return;
  }

  await game.settings.set(MODULE_ID, OFFERED, true);
  const start = await foundry.applications.api.DialogV2.confirm({
    window: { title: 'E20FX.Tours.Offer.Title', icon: 'fa-solid fa-wand-sparkles' },
    content: `<p>${game.i18n.localize('E20FX.Tours.Offer.Content')}</p>`,
    yes: { label: 'E20FX.Tours.Offer.Yes' },
    no: { label: 'E20FX.Tours.Offer.No' },
  });
  if (start) {
    tour.start();
  }
}

export function registerTourHooks() {
  Hooks.once('init', () => {
    game.settings.register(MODULE_ID, OFFERED, { scope: 'world', config: false, type: Boolean, default: false });
  });

  Hooks.once('setup', registerTours);

  Hooks.once('ready', () => {
    // After the system's welcome and other modules' offers have had their turn, and never while a tour is running.
    window.setTimeout(() => {
      if (!foundry.nue.Tour.tourInProgress) {
        offerStartHere().catch(err => console.error(`${MODULE_ID} | Tour offer failed`, err));
      }
    }, 2500);
  });
}
