import { MODULE_ID, setting } from "./settings.mjs";
import { DEFAULT_SLOTS, pickEmblem } from "./emblem-match.mjs";

/** The GM's emblem slots ({ name, img, tint }). */
export function emblemSlots() {
  const slots = setting('emblems');
  return Array.isArray(slots) && slots.length ? slots : DEFAULT_SLOTS.map(name => ({ name, img: '', tint: '' }));
}

/** An actor's emblem slot (emblem-match.mjs#pickEmblem), or null. */
export function emblemFor(actor) {
  if (!actor) {
    return null;
  }

  const folderNames = [];
  for (let folder = actor.folder; folder; folder = folder.folder) {
    folderNames.push(folder.name);
  }

  return pickEmblem(emblemSlots(), {
    override: actor.getFlag?.(MODULE_ID, 'faction') ?? '',
    factionNames: (actor.items ?? []).filter(item => item.type == 'faction').map(item => item.name),
    folderNames,
  });
}
