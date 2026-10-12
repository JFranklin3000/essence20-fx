import { setting } from "./settings.mjs";
import { emblemFor } from "./emblems.mjs";

/**
 * The faction emblem on a character's roll cards in chat, beside the speaker's name. Each client draws it for itself
 * as it renders the card, so nothing is written to the message; a video emblem is left off (an image only).
 */
export function addCardEmblem(message, element) {
  if (game.system?.id != 'essence20' || !setting('enabled') || !setting('emblemOnCards') || !message?.rolls?.length) {
    return;
  }

  const root = element instanceof HTMLElement ? element : element?.[0];
  const sender = root?.querySelector('.message-sender') ?? root?.querySelector('.message-header');
  if (!sender || sender.querySelector('.e20fx-card-emblem')) {
    return;
  }

  const actor = ChatMessage.getSpeakerActor(message.speaker);
  const emblem = actor ? emblemFor(actor) : null;
  if (!emblem?.img || /\.(webm|mp4)$/i.test(emblem.img)) {
    return;
  }

  const img = document.createElement('img');
  img.className = 'e20fx-card-emblem';
  img.src = emblem.img;
  img.alt = emblem.name ?? '';
  img.title = emblem.name ?? '';
  sender.prepend(img);
}

export function registerChatEmblem() {
  Hooks.on('renderChatMessageHTML', addCardEmblem);
}
