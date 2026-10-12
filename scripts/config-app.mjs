import { MODULE_ID, SOUNDS, setting } from "./settings.mjs";
import { allMomentKeys, momentGroups, presetFor } from "./presets.mjs";
import { cleanImport, mainPart, parseOverrides, rowToOverride } from "./overrides.mjs";
import { colorOf } from "./moments.mjs";
import { playMoment, tokenOf } from "./play.mjs";
import { emblemSlots } from "./emblems.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Form field names can't hold the dots in a moment key. */
const fieldKey = key => key.replaceAll('.', '__');

/** An actor's own overrides (kept as JSON text, so a save replaces them whole rather than merging). */
export const actorOverrides = actor => parseOverrides(actor?.getFlag?.(MODULE_ID, 'overrides'));

/** The label for a moment: a Condition's own name, else this module's. */
function momentLabel(key) {
  if (key.startsWith('condition.')) {
    const status = CONFIG.statusEffects.find(effect => effect.id == key.slice('condition.'.length));
    return status ? game.i18n.localize(status.name ?? status.label) : key;
  }

  return game.i18n.localize(`E20FX.Moment.${key.replaceAll('.', '-')}`);
}

/**
 * Configure FX: one row per moment - on/off, its animation, its sound, its volume - with Preview and Reset, and
 * export / import of the lot. For the world (the GM, from the module settings) or one actor (its sheet's header: a
 * Ranger's own Morph, say), which plays over the world's.
 */
export class FxConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({ actor = null, ...options } = {}) {
    // One window per actor (and one for the world).
    super({ id: actor ? `essence20-fx-config-${actor.id}` : 'essence20-fx-config', ...options });
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    id: 'essence20-fx-config',
    tag: 'form',
    classes: ['essence20-fx-config'],
    window: { title: 'E20FX.Config.Title', icon: 'fa-solid fa-wand-sparkles', resizable: true },
    position: { width: 860, height: 720 },
    form: { handler: FxConfig.#onSubmit, closeOnSubmit: true },
    actions: {
      preview: FxConfig.#onPreview,
      reset: FxConfig.#onReset,
      pickAnimation: FxConfig.#onPick,
      pickSound: FxConfig.#onPick,
      exportOverrides: FxConfig.#onExport,
      importOverrides: FxConfig.#onImport,
    },
  };

  static PARTS = { form: { template: `modules/${MODULE_ID}/templates/config.hbs`, scrollable: ['.e20fx-rows'] } };

  get title() {
    const base = game.i18n.localize('E20FX.Config.Title');
    return this.actor ? `${base}: ${this.actor.name}` : base;
  }

  /** The overrides this window edits. */
  get overrides() {
    return this.actor ? actorOverrides(this.actor) : (setting('overrides') ?? {});
  }

  async _prepareContext() {
    const overrides = this.overrides;
    const groups = momentGroups().map(group => ({
      label: game.i18n.localize(`E20FX.Config.Group.${group.id}`),
      rows: group.keys.map(key => {
        const preset = presetFor(key) ?? {};
        const override = overrides[key] ?? {};
        return {
          key,
          field: fieldKey(key),
          label: momentLabel(key),
          on: !override.off,
          animation: override.animation ?? '',
          animationDefault: preset[mainPart(preset)] ?? '',
          sound: override.sound ?? '',
          soundDefault: preset.sound?.[0] ? `${SOUNDS}${preset.sound[0]}` : '',
          volume: override.volume ?? '',
          changed: !!overrides[key],
        };
      }),
    }));
    return {
      groups,
      actor: this.actor,
      color: this.actor?.getFlag(MODULE_ID, 'color') ?? '',
      colorDefault: this.actor?.system?.color ? String(this.actor.system.color) : '',
      // Which faction emblem the actor wears: worked out (its Faction item, its folder), none, or one picked.
      faction: this.actor?.getFlag(MODULE_ID, 'faction') ?? '',
      factions: {
        '': game.i18n.localize('E20FX.Config.FactionAuto'),
        none: game.i18n.localize('E20FX.Config.FactionNone'),
        ...Object.fromEntries(emblemSlots().filter(slot => slot.name).map(slot => [slot.name, slot.name])),
      },
    };
  }

  /** A row's values as they stand in the form (saved or not). */
  #row(key) {
    const field = fieldKey(key);
    const value = name => this.element.querySelector(`[name="rows.${field}.${name}"]`);
    return { on: value('on')?.checked ?? true, animation: value('animation')?.value, sound: value('sound')?.value, volume: value('volume')?.value };
  }

  /** Every row of the form, as stored overrides. */
  #formOverrides() {
    return Object.fromEntries(allMomentKeys().map(key => [key, rowToOverride(this.#row(key))]).filter(([, override]) => override));
  }

  static async #onSubmit() {
    const overrides = this.#formOverrides();
    if (this.actor) {
      const color = this.element.querySelector('[name="color"]')?.value?.trim() ?? '';
      const faction = this.element.querySelector('[name="faction"]')?.value ?? '';
      await this.actor.update({ [`flags.${MODULE_ID}.overrides`]: JSON.stringify(overrides), [`flags.${MODULE_ID}.color`]: color, [`flags.${MODULE_ID}.faction`]: faction });
    } else {
      await game.settings.set(MODULE_ID, 'overrides', overrides);
    }

    ui.notifications.info(game.i18n.localize('E20FX.Config.Saved'));
  }

  /**
   * Preview a row on this client only, as it stands in the form: on the actor (this window's, else the selected token),
   * at the targeted token for an attack.
   */
  static #onPreview(event, button) {
    const key = button.dataset.key;
    const actor = this.actor ?? canvas.tokens?.controlled?.[0]?.actor ?? null;
    const source = tokenOf(actor);
    if (!source) {
      return ui.notifications.warn(game.i18n.localize('E20FX.Config.PreviewNeedsToken'));
    }

    const target = [...(game.user.targets ?? [])].find(token => token.actor && token.actor !== actor)?.actor ?? null;
    const needsTarget = key.startsWith('attack.') && key != 'attack.fumble';
    if (needsTarget && !target) {
      return ui.notifications.warn(game.i18n.localize('E20FX.Config.PreviewNeedsTarget'));
    }

    const at = { x: source.center.x, y: source.center.y, w: source.w };
    const shape = key.startsWith('area.') ? key.slice('area.'.length) : null;
    const area = shape ? { shape, shapeData: { type: shape, x: source.center.x, y: source.center.y, radius: source.w * 2.5, length: source.w * 5, rotation: 0 } } : null;
    const color = this.element.querySelector('[name="color"]')?.value?.trim() || colorOf(actor);
    const moment = {
      key, source: actor, target: needsTarget ? target : null, area, color,
      at: ['zord.boarded', 'zord.recalled'].includes(key) ? at : undefined,
      soundOnly: key == 'zord.arrived',
    };
    const override = rowToOverride(this.#row(key));
    playMoment(moment, { preview: true, override: override?.off ? { ...override, off: false } : override });
  }

  /** Clear a row back to the preset (saved on Save). */
  static #onReset(event, button) {
    const field = fieldKey(button.dataset.key);
    for (const input of this.element.querySelectorAll(`[name^="rows.${field}."]`)) {
      if (input.type == 'checkbox') {
        input.checked = true;
      } else {
        input.value = '';
      }
    }
  }

  /** A file browser for a row's animation or sound. */
  static #onPick(event, button) {
    const isSound = button.dataset.action == 'pickSound';
    const input = this.element.querySelector(`[name="rows.${fieldKey(button.dataset.key)}.${isSound ? 'sound' : 'animation'}"]`);
    const FilePicker = foundry.applications.apps.FilePicker.implementation;
    new FilePicker({ type: isSound ? 'audio' : 'imagevideo', current: input?.value || '', callback: path => { if (input) input.value = path; } }).render(true);
  }

  /** Save the stored overrides (not unsaved edits) as a JSON file another table can import. */
  static #onExport() {
    const data = { module: MODULE_ID, version: game.modules.get(MODULE_ID)?.version ?? '', overrides: this.overrides };
    const name = this.actor ? `essence20-fx-${this.actor.name.slugify()}.json` : 'essence20-fx.json';
    foundry.utils.saveDataToFile(JSON.stringify(data, null, 2), 'application/json', name);
  }

  /** Read an exported file into the form (Save keeps it). */
  static #onImport() {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = '.json,application/json';
    picker.addEventListener('change', async () => {
      const file = picker.files?.[0];
      if (!file) {
        return;
      }

      let overrides;
      try {
        overrides = cleanImport(JSON.parse(await foundry.utils.readTextFromFile(file)), allMomentKeys());
      } catch {
        return ui.notifications.error(game.i18n.localize('E20FX.Config.ImportBad'));
      }

      for (const key of allMomentKeys()) {
        const field = fieldKey(key);
        const override = overrides[key] ?? {};
        const set = (name, value) => {
          const input = this.element.querySelector(`[name="rows.${field}.${name}"]`);
          if (input?.type == 'checkbox') input.checked = value;
          else if (input) input.value = value ?? '';
        };
        set('on', !override.off);
        set('animation', override.animation);
        set('sound', override.sound);
        set('volume', override.volume);
      }

      ui.notifications.info(game.i18n.format('E20FX.Config.Imported', { count: Object.keys(overrides).length }));
    });
    picker.click();
  }
}
