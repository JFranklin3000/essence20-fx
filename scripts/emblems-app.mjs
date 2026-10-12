import { MODULE_ID } from "./settings.mjs";
import { matchFolder } from "./emblem-match.mjs";
import { emblemSlots } from "./emblems.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Faction Emblems: the GM's own image per faction (the module ships none - they're Hasbro's). Rows of name, image and
 * tint; Import folder matches a folder's files to the rows by name.
 */
export class FactionEmblems extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'essence20-fx-emblems',
    tag: 'form',
    classes: ['essence20-fx-config', 'essence20-fx-emblems'],
    window: { title: 'E20FX.Emblems.Title', icon: 'fa-solid fa-shield-halved', resizable: true },
    position: { width: 640, height: 'auto' },
    form: { handler: FactionEmblems.#onSubmit, closeOnSubmit: true },
    actions: {
      browse: FactionEmblems.#onBrowse,
      addSlot: FactionEmblems.#onAdd,
      removeSlot: FactionEmblems.#onRemove,
      importFolder: FactionEmblems.#onImportFolder,
    },
  };

  static PARTS = { form: { template: `modules/${MODULE_ID}/templates/emblems.hbs` } };

  /** Rows being edited (kept between re-renders until saved). */
  #slots = null;

  async _prepareContext() {
    this.#slots ??= emblemSlots().map(slot => ({ ...slot }));
    return { slots: this.#slots.map((slot, index) => ({ ...slot, index })) };
  }

  /** Read the form's rows back into #slots. */
  #read() {
    this.#slots = [...this.element.querySelectorAll('.e20fx-emblem-row')].map(row => ({
      name: row.querySelector('[data-field=name]').value.trim(),
      img: row.querySelector('[data-field=img]').value.trim(),
      tint: row.querySelector('[data-field=tint]').value.trim(),
    }));
    return this.#slots;
  }

  static async #onSubmit() {
    await game.settings.set(MODULE_ID, 'emblems', this.#read().filter(slot => slot.name));
    ui.notifications.info(game.i18n.localize('E20FX.Emblems.Saved'));
  }

  static #onBrowse(event, button) {
    const input = button.closest('.e20fx-emblem-row').querySelector('[data-field=img]');
    const FilePicker = foundry.applications.apps.FilePicker.implementation;
    new FilePicker({ type: 'imagevideo', current: input.value, callback: path => { input.value = path; } }).render(true);
  }

  static #onAdd() {
    this.#read().push({ name: '', img: '', tint: '' });
    this.render();
  }

  static #onRemove(event, button) {
    this.#read().splice(Number(button.dataset.index), 1);
    this.render();
  }

  /** Pick a folder; its images fill the rows whose names they carry ("cobra.png" -> Cobra). */
  static #onImportFolder() {
    const FilePicker = foundry.applications.apps.FilePicker.implementation;
    new FilePicker({
      type: 'folder',
      callback: async (path, picker) => {
        const source = picker?.activeSource ?? 'data';
        const result = await FilePicker.browse(source, path);
        const files = (result?.files ?? []).filter(file => /\.(webp|png|jpe?g|svg|gif|webm)$/i.test(file));
        const { slots, unmatched } = matchFolder(this.#read(), files);
        this.#slots = slots;
        this.render();
        ui.notifications.info(game.i18n.format('E20FX.Emblems.Imported', { count: files.length - unmatched.length, unmatched: unmatched.length }));
      },
    }).render(true);
  }
}
