import { MODULE_ID, setting } from "./settings.mjs";
import { buildAutorecMenu } from "./aa-autorec.mjs";
import { AA_ID, aaActive } from "./aa-bridge.mjs";

/**
 * Adds the Essence20 weapon entries (aa-autorec.mjs) to Automated Animations' Automatic Recognition menus, through its
 * own AutorecManager.mergeMenus - which only adds an entry whose label the menu doesn't have yet, so a GM's own entries
 * (and any they've changed) are never replaced. Run from the module settings, or once when the GM is first offered it.
 */

const { DialogV2 } = foundry.applications.api;

/** How many entries Automated Animations' melee and ranged menus hold. */
const menuSize = () => ['melee', 'range'].reduce((sum, key) => sum + (game.settings.get(AA_ID, `aaAutorec-${key}`)?.length ?? 0), 0);

/** Merge the entries in; returns how many were new. */
export async function installAutorec() {
  const manager = globalThis.AutomatedAnimations?.AutorecManager;
  if (!aaActive() || !manager?.mergeMenus) {
    ui.notifications.warn(game.i18n.localize('E20FX.Autorec.NeedsAA'));
    return 0;
  }

  const before = menuSize();
  const version = game.settings.get(AA_ID, 'aaAutorec')?.version;
  const menu = { ontoken: [], templatefx: [], aura: [], preset: [], aefx: [], ...buildAutorecMenu(version, { sounds: setting('autorecSounds') }) };
  await manager.mergeMenus(menu, { melee: true, range: true });
  const added = menuSize() - before;
  ui.notifications.info(game.i18n.format('E20FX.Autorec.Added', { count: added }));
  return added;
}

/** Ask first, then merge. */
export async function confirmAndInstall() {
  const ok = await DialogV2.confirm({
    window: { title: game.i18n.localize('E20FX.Autorec.Title') },
    content: `<p>${game.i18n.localize('E20FX.Autorec.Confirm')}</p>`,
  });
  if (ok) {
    await installAutorec();
  }

  return ok;
}

/** The settings-menu entry: Foundry opens a menu by rendering it, so rendering asks and merges. */
export class AutorecInstaller {
  render() {
    confirmAndInstall();
    return this;
  }
}

/** Offer it once to a GM, the first time Automated Animations is active alongside this module. */
export function offerAutorecOnce() {
  Hooks.once('ready', async () => {
    if (!game.user.isActiveGM || !aaActive() || setting('autorecOffered')) {
      return;
    }

    await game.settings.set(MODULE_ID, 'autorecOffered', true);
    await confirmAndInstall();
  });
}
