import { MODULE_ID } from "./settings.mjs";
import { matchFolder } from "./emblem-match.mjs";
import { emblemSlots } from "./emblems.mjs";
import { IMAGE_SPECS, imageAdvice } from "./emblem-images.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** An image's or video's natural size, or null when it can't be loaded. */
function measure(src) {
  return new Promise(resolve => {
    if (!src) {
      resolve(null);
      return;
    }

    if (/\.(webm|mp4)$/i.test(src)) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
      video.onerror = () => resolve(null);
      video.src = src;
      return;
    }

    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Faction Emblems: the GM's own images per faction (the module ships none - they're Hasbro's). Each faction has an
 * emblem (the badge on its tokens' corner, the flash on a Morph or Transform, roll cards, dice) and a turn marker (the
 * image under its token on its turn). Each image shows a preview drawn the way it will appear, and a note on its size
 * (emblem-images.mjs#imageAdvice). Import folder matches a folder's files to the rows by name.
 */
export class FactionEmblems extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'essence20-fx-emblems',
    tag: 'form',
    classes: ['essence20-fx-config', 'essence20-fx-emblems'],
    window: { title: 'E20FX.Emblems.Title', icon: 'fa-solid fa-shield-halved', resizable: true },
    position: { width: 760, height: 720 },
    form: { handler: FactionEmblems.#onSubmit, closeOnSubmit: true },
    actions: {
      browse: FactionEmblems.#onBrowse,
      addSlot: FactionEmblems.#onAdd,
      removeSlot: FactionEmblems.#onRemove,
      importFolder: FactionEmblems.#onImportFolder,
    },
  };

  static PARTS = { form: { template: `modules/${MODULE_ID}/templates/emblems.hbs`, scrollable: ['.e20fx-emblem-list'] } };

  /** Rows being edited (kept between re-renders until saved). */
  #slots = null;

  async _prepareContext() {
    this.#slots ??= emblemSlots().map(slot => ({ marker: '', ...slot }));
    const spec = kind => ({ ...IMAGE_SPECS[kind], idealText: IMAGE_SPECS[kind].ideal.join('-') });
    return { slots: this.#slots.map((slot, index) => ({ ...slot, index })), badgeSpec: spec('badge'), markerSpec: spec('marker') };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    // Inputs only - the browse buttons beside them carry data-field too.
    for (const input of this.element.querySelectorAll('input[data-field=img], input[data-field=marker]')) {
      input.addEventListener('change', () => this.#refresh(input));
      this.#refresh(input);
    }
  }

  /** A field's preview and size note, from the image it names now. */
  async #refresh(input) {
    const row = input.closest('.e20fx-emblem-row');
    const kind = input.dataset.field == 'marker' ? 'marker' : 'badge';
    const src = input.value.trim();
    for (const img of row.querySelectorAll(`[data-preview=${kind}]`)) {
      img.src = src || '';
      img.hidden = !src;
    }

    const note = row.querySelector(`[data-advice=${kind}]`);
    if (!note) {
      return;
    }

    if (!src) {
      note.textContent = '';
      note.className = 'e20fx-advice';
      return;
    }

    const size = await measure(src);
    if (!size) {
      note.textContent = game.i18n.localize('E20FX.Emblems.Advice.cantLoad');
      note.className = 'e20fx-advice warn';
      return;
    }

    const spec = IMAGE_SPECS[kind];
    const advice = imageAdvice(kind, size.width, size.height, src);
    const data = { width: size.width, height: size.height, min: spec.min, max: spec.max, ideal: spec.ideal.join('-') };
    // "Not square" means something different for each: Foundry stretches a turn marker; a badge keeps its shape.
    const format = key => game.i18n.format(`E20FX.Emblems.Advice.${key == 'notSquare' ? `${kind}NotSquare` : key}`, data);
    note.textContent = `${game.i18n.format('E20FX.Emblems.Advice.size', data)} ${advice.map(format).join(' ')}`;
    note.className = `e20fx-advice ${advice.includes('good') ? 'good' : 'warn'}`;
  }

  /** Read the form's rows back into #slots. */
  #read() {
    this.#slots = [...this.element.querySelectorAll('.e20fx-emblem-row')].map(row => ({
      name: row.querySelector('input[data-field=name]').value.trim(),
      img: row.querySelector('input[data-field=img]').value.trim(),
      marker: row.querySelector('input[data-field=marker]').value.trim(),
      tint: row.querySelector('input[data-field=tint]').value.trim(),
    }));
    return this.#slots;
  }

  static async #onSubmit() {
    await game.settings.set(MODULE_ID, 'emblems', this.#read().filter(slot => slot.name));
    ui.notifications.info(game.i18n.localize('E20FX.Emblems.Saved'));
  }

  static #onBrowse(event, button) {
    const input = button.closest('.e20fx-emblem-row').querySelector(`input[data-field=${button.dataset.field}]`);
    const FilePicker = foundry.applications.apps.FilePicker.implementation;
    new FilePicker({
      type: 'imagevideo',
      current: input.value,
      callback: path => {
        input.value = path;
        this.#refresh(input);
      },
    }).render(true);
  }

  static #onAdd() {
    this.#read().push({ name: '', img: '', marker: '', tint: '' });
    this.render();
  }

  static #onRemove(event, button) {
    this.#read().splice(Number(button.dataset.index), 1);
    this.render();
  }

  /** Pick a folder; its images fill the rows whose names they carry ("cobra.png" emblem, "cobra-marker.png" marker). */
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
