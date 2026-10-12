import { setting } from "./settings.mjs";
import { COLORSETS, colorsetFor, emblemD20Labels } from "./dice-sets.mjs";
import { emblemSlots } from "./emblems.mjs";
import { factionKey } from "./emblem-match.mjs";
import { colorOf, lineOf } from "./moments.mjs";

/**
 * Dice So Nice presets - only when Dice So Nice is active (it calls diceSoNiceReady; without it nothing here runs).
 * The colour sets show up in every player's own Dice So Nice picker; with "Dice in my character's colours" on, a
 * character's rolls use theirs. With "Emblems on dice" on, each faction emblem gets a d20 whose 20 is the emblem.
 */

let dice3d = null;

/** Hand Dice So Nice the colour sets and emblem dice. */
export function registerDice(api) {
  dice3d = api;
  for (const colorset of COLORSETS) {
    api.addColorset(colorset, 'default');
  }

  if (setting('emblemsOnDice')) {
    for (const slot of emblemSlots().filter(candidate => candidate.img)) {
      const id = `e20fx-${factionKey(slot.name)}`;
      api.addSystem({ id, name: `Essence20: ${slot.name}` }, 'default');
      api.addDicePreset({ type: 'd20', labels: emblemD20Labels(slot.img), system: id });
    }
  }
}

/** The colour set a roll's speaker should use, added to Dice So Nice first when it's made on the fly. */
function colorsetName(actor) {
  const faction = (actor?.items ?? []).find(item => item.type == 'faction')?.name;
  const choice = colorsetFor({ line: lineOf(actor), faction: faction ? factionKey(faction) : null, color: colorOf(actor) });
  if (choice && typeof choice == 'object') {
    // Dice So Nice records the set straight away (the font load it then awaits is only for custom fonts).
    dice3d?.addColorset(choice, 'no');
    return choice.name;
  }

  return choice;
}

export function registerDiceHooks() {
  Hooks.once('diceSoNiceReady', registerDice);

  // A character's rolls in their colours: each die's appearance, before Dice So Nice draws it.
  Hooks.on('diceSoNiceRollStart', (messageId, context) => {
    if (!dice3d || !setting('diceAutoColour')) {
      return;
    }

    const message = game.messages.get(messageId);
    const actor = message ? ChatMessage.getSpeakerActor(message.speaker) : null;
    const name = actor ? colorsetName(actor) : null;
    if (!name) {
      return;
    }

    for (const die of context?.roll?.dice ?? []) {
      die.options.appearance = { ...(die.options.appearance ?? {}), colorset: name };
    }
  });
}

