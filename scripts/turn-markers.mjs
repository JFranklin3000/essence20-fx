import { MODULE_ID, setting } from "./settings.mjs";
import { emblemFor } from "./emblems.mjs";
import { markerUpdate } from "./emblem-images.mjs";

/**
 * Faction turn markers: each token's Foundry turn marker (the image under the active token) set to its faction's
 * marker image. Written to the token documents, so it runs on the active GM's client only (players can't change other
 * people's tokens) - and only on tokens whose marker is still the default or the one this module set (emblem-images.mjs
 * #markerUpdate): a marker chosen by hand is never replaced.
 */

const FLAG = 'marker';

const isGm = () => game.user.isActiveGM && game.system?.id == 'essence20';

/** The update for one token, or null. */
function updateFor(tokenDoc) {
  const on = setting('enabled') && setting('emblemTurnMarkers');
  const src = on ? emblemFor(tokenDoc.actor)?.marker || null : null;
  const change = markerUpdate(tokenDoc.turnMarker, tokenDoc.getFlag(MODULE_ID, FLAG) ?? null, src, CONFIG.Combat.settings?.turnMarker ?? {}, CONST.TOKEN_TURN_MARKER_MODES);
  return change ? { _id: tokenDoc.id, turnMarker: change.turnMarker, [`flags.${MODULE_ID}.${FLAG}`]: change.flag } : null;
}

/** Bring these tokens' turn markers in line with their factions (grouped by scene, one write per scene). */
export async function syncMarkers(tokenDocs) {
  if (!isGm()) {
    return;
  }

  const byScene = new Map();
  for (const doc of tokenDocs) {
    const update = doc?.actor ? updateFor(doc) : null;
    if (update) {
      byScene.set(doc.parent, [...(byScene.get(doc.parent) ?? []), update]);
    }
  }

  for (const [scene, updates] of byScene) {
    await scene.updateEmbeddedDocuments('Token', updates);
  }
}

/** Every token in every scene. */
export const syncAllMarkers = () => syncMarkers(game.scenes.contents.flatMap(scene => scene.tokens.contents));

/** An actor's tokens, in any scene (a linked actor's, or the unlinked token it lives in). */
function tokensOf(actor) {
  if (actor?.isToken) {
    return actor.token ? [actor.token] : [];
  }

  return game.scenes.contents.flatMap(scene => scene.tokens.filter(token => token.actorLink && token.actorId == actor?.id));
}

export function registerTurnMarkers() {
  Hooks.once('ready', () => syncAllMarkers());
  Hooks.on('createToken', doc => syncMarkers([doc]));
  for (const hook of ['createItem', 'deleteItem', 'updateItem']) {
    Hooks.on(hook, item => (item.type == 'faction' && item.parent ? syncMarkers(tokensOf(item.parent)) : null));
  }

  Hooks.on('updateActor', (actor, changed) => {
    if (changed.flags?.[MODULE_ID]?.faction !== undefined || changed.folder !== undefined) {
      syncMarkers(tokensOf(actor));
    }
  });
  Hooks.on('updateSetting', changed => {
    if (['emblems', 'emblemTurnMarkers', 'enabled'].some(key => changed.key == `${MODULE_ID}.${key}`)) {
      syncAllMarkers();
    }
  });
}
