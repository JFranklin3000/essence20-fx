import { MODULE_ID, SOUNDS, setting } from "./settings.mjs";
import { allowed, colorShift } from "./moments.mjs";
import { presetFor } from "./presets.mjs";
import { applyOverrides, isFilePath, parseOverrides } from "./overrides.mjs";
import { emblemFor } from "./emblems.mjs";

/** Moments where the actor's faction emblem flashes up over it. */
const EMBLEM_MOMENTS = ['morph', 'transform', 'untransform', 'megaform.formed'];

/**
 * Plays moments with Sequencer. Called on the client that made the thing happen; Sequencer sends the effects and sounds
 * to every other client, so each plays once for the table. Who gets what:
 *  - a token involved is hidden: only GMs;
 *  - a user with Reduced motion on (their user flag, so this client can see it): the sounds, not the animations.
 * A viewer can also turn either off entirely in Sequencer's own client settings.
 */

/** An actor's token on the scene being viewed, or null. */
export function tokenOf(actor) {
  if (!actor || !canvas?.ready) {
    return null;
  }

  const token = actor.isToken ? actor.token?.object : actor.getActiveTokens?.(false)?.[0];
  return token?.document?.parent === canvas.scene ? token : null;
}

const jb2aPatreon = () => !!game.modules.get('jb2a_patreon')?.active;

/** Whether Sequencer can play this: a file, or a database path it knows (a JB2A pack may not be installed). */
function known(path) {
  try {
    return !!path && (isFilePath(path) || Sequencer.Database.entryExists(path));
  } catch {
    return false;
  }
}

/** The users who see the animations and hear the sounds: { sight: ids|null, sound: ids|null } (null = everyone). */
function audience(tokens, hidden = false) {
  const users = game.users.filter(user => user.active);
  const secret = hidden || tokens.some(token => token?.document?.hidden);
  const hearing = secret ? users.filter(user => user.isGM) : users;
  const seeing = hearing.filter(user => !user.getFlag?.(MODULE_ID, 'reducedMotion'));
  const ids = list => (list.length == users.length ? null : list.map(user => user.id));
  return { sight: ids(seeing), sound: ids(hearing) };
}

/**
 * Where a token is, as a point: its centre, worked out from its document. A Token's own x / y (what Sequencer reads
 * from a token) stay 0 until Foundry has drawn it in place - a token out of view, or not yet refreshed - which put
 * effects in the scene's top-left corner. One-off effects are placed by point instead; lasting ones (ambient.mjs)
 * stay attached to the token, which follows it once it's drawn.
 */
export const pointOf = token => ({ x: token.center.x, y: token.center.y });

/** The far end of a cone or line: from its apex along its rotation (degrees clockwise from east), `length` pixels. */
export function areaEnd({ x, y, rotation = 0 }, length) {
  const radians = (Number(rotation) || 0) * Math.PI / 180;
  return { x: x + length * Math.cos(radians), y: y + length * Math.sin(radians) };
}

/**
 * Where an area's burst goes: { at, to? } (stretched from at to to) or { at, size } (sized to it), or null when it can't
 * be placed. A circle or emanation is sized to it; a cone or line is stretched from its apex along its direction.
 */
export function areaPlacement(area, sourceToken = null) {
  const data = area?.shapeData ?? {};
  const x = Number(data.x);
  const y = Number(data.y);
  switch (area?.shape) {
  case 'cone':
  case 'line':
    return Number.isFinite(x) ? { at: { x, y }, to: areaEnd(data, Number(area.shape == 'cone' ? data.radius : data.length) || 0) } : null;
  case 'emanation':
    return sourceToken ? { at: pointOf(sourceToken), size: Number(data.radius) * 2 + Math.max(sourceToken.w, sourceToken.h) } : null;
  default:
    return Number.isFinite(x) && Number(data.radius) > 0 ? { at: { x, y }, size: Number(data.radius) * 2 } : null;
  }
}

/** A Megaform's parts' tokens on this scene (its roster - system.actors). */
function partTokens(form) {
  return Object.values(form?.system?.actors ?? {}).map(entry => tokenOf(globalThis.fromUuidSync?.(entry?.uuid, { strict: false }))).filter(Boolean);
}

/** The GM's override for a moment, then its source actor's own (overrides.mjs). */
function overridesFor(moment) {
  // A moment played at a point rather than on a token (a teleport) names its actor separately.
  return [setting('overrides')?.[moment.key], parseOverrides((moment.source ?? moment.actor)?.getFlag?.(MODULE_ID, 'overrides'))[moment.key]];
}

/**
 * Play one moment: { key, source, target?, damageType?, area?, at?, from?, color?, hidden?, soundOnly? } (moments.mjs).
 * `from` is where a teleporting token left (the preset's depart and streak); `hidden` plays it for the GM only. `at` is where a
 * token was ({x, y, w}) for one that is leaving the map; `soundOnly` plays just the sound, with no token needed.
 * @param {Object} [options]
 * @param {Boolean} [options.preview]   Play on this client only (the Configure FX window's Preview)
 * @param {Object} [options.override]   An unsaved override on top of the stored ones (the row being edited)
 * @returns {Boolean}   Whether anything was played.
 */
export function playMoment(moment, { preview = false, override = null } = {}) {
  const look = presetFor(moment.key, { damageType: moment.damageType, style: moment.style, line: moment.line, patreon: jb2aPatreon() });
  const preset = applyOverrides(look, [...overridesFor(moment), override]);
  const source = tokenOf(moment.source);
  const target = moment.target ? tokenOf(moment.target) : null;
  // An area can be away from every token (a circle placed out in the open) - it only needs a scene; a token leaving the
  // map plays where it was.
  if (!preset || (!source && !moment.area && !moment.at && !moment.soundOnly) || (moment.target && !target)) {
    return false;
  }

  const { sight, sound } = preview ? { sight: null, sound: null } : audience([source, target], !!moment.hidden);
  const sequence = new Sequence({ moduleName: MODULE_ID, softFail: true });
  const seen = section => (preview ? section.locally() : sight ? section.forUsers(sight) : section);
  const missed = moment.key.endsWith('.miss');
  const delay = preset.delay ?? 0;

  if (sight?.length !== 0 && !moment.soundOnly) {
    if (target && known(preset.projectile)) {
      const effect = seen(sequence.effect().file(preset.projectile).atLocation(pointOf(source)).stretchTo(pointOf(target)));
      if (missed) {
        effect.missed();
      }
    }

    if (target && known(preset.swing)) {
      seen(sequence.effect().file(preset.swing).atLocation(pointOf(source)).stretchTo(pointOf(target)));
    }

    const place = moment.area && known(preset.area) ? areaPlacement(moment.area, source) : null;
    if (place) {
      const effect = sequence.effect().file(preset.area).atLocation(place.at);
      seen(place.to ? effect.stretchTo(place.to) : effect.size(place.size, { gridUnits: false }));
    }

    // A Megaform forming: a beam from each part on the map to it.
    if (source && known(preset.beam)) {
      for (const part of partTokens(moment.source).filter(token => token !== source)) {
        seen(sequence.effect().file(preset.beam).atLocation(pointOf(part)).stretchTo(pointOf(source)));
      }
    }

    // On the target, else the token itself, else where a departing token stood - as a point, sized to that token's width
    // (the height follows the art).
    const onToken = target ?? source;
    const on = onToken ? pointOf(onToken) : moment.at ? { x: moment.at.x, y: moment.at.y } : null;
    const width = onToken?.w ?? moment.at?.w ?? 100;
    const sized = (effect, scale) => effect.size({ width: width * scale }, { gridUnits: false });
    const shift = moment.color ? colorShift(moment.color, preset.baseHue) : null;
    const tinted = effect => (preset.recolor && shift ? effect.filter('ColorMatrix', shift) : effect);

    // A teleport: a flash where the token left, then a streak from there to where it lands.
    if (moment.from && known(preset.depart)) {
      seen(tinted(sized(sequence.effect().file(preset.depart).atLocation({ x: moment.from.x, y: moment.from.y }), preset.scale ?? 1.2)));
    }

    if (moment.from && on && known(preset.streak)) {
      seen(tinted(sequence.effect().file(preset.streak).atLocation({ x: moment.from.x, y: moment.from.y }).stretchTo(on).delay(Math.round(delay / 3))));
    }

    // Joining and separating on the map: beams from where the members stood in to the Megaform, or out to where they land.
    if (on && known(preset.beam)) {
      for (const point of moment.fromPoints ?? []) {
        seen(sequence.effect().file(preset.beam).atLocation({ x: point.x, y: point.y }).stretchTo(on));
      }

      for (const point of moment.toPoints ?? []) {
        seen(sequence.effect().file(preset.beam).atLocation(on).stretchTo({ x: point.x, y: point.y }));
      }
    }

    if (on && known(preset.ring)) {
      const ring = sized(sequence.effect().file(preset.ring).atLocation(on), (preset.scale ?? 1.2) * 1.4);
      seen(moment.color ? ring.tint(moment.color) : ring);
    }

    const emblem = source && EMBLEM_MOMENTS.includes(moment.key) && setting('emblemFlash') ? emblemFor(moment.source) : null;
    if (emblem?.img && known(emblem.img)) {
      const flash = sequence.effect().file(emblem.img).atLocation(pointOf(source)).size({ width: source.w * 1.6 }, { gridUnits: false })
        .fadeIn(200).fadeOut(500).duration(1500).delay(delay);
      seen(/^#[0-9a-f]{6}$/i.test(emblem.tint ?? '') ? flash.tint(emblem.tint) : flash);
    }

    if (on && !missed && known(preset.impact)) {
      seen(sized(sequence.effect().file(preset.impact).atLocation(on), preset.scale ?? 1.5).delay(delay));
    }

    if (on && known(preset.overlay)) {
      seen(tinted(sized(sequence.effect().file(preset.overlay).atLocation(on), preset.scale ?? 1.2).delay(delay)));
    }

    // Damage taken: the token's own image flashes the colour and shakes.
    if (source && preset.flash) {
      seen(sequence.effect().copySprite(source).atLocation(pointOf(source)).size({ width: source.w }, { gridUnits: false }).tint(preset.flash).opacity(0.75)
        .fadeIn(60).fadeOut(240).duration(450)
        .loopProperty('spriteContainer', 'position.x', { from: -0.04, to: 0.04, duration: 50, pingPong: true, gridUnits: true }));
    }
  }

  if (preset.sound?.length && sound?.length !== 0) {
    // A GM's or actor's own sound is a full path; the presets' are under sounds/.
    const files = preset.sound.map(file => (preset.soundIsPath ? file : `${SOUNDS}${file}`));
    const section = sequence.sound().file(files).volume(preset.volume ?? setting('volume'));
    if (preview) {
      section.locally();
    } else if (sound) {
      section.forUsers(sound);
    }
  }

  sequence.play();
  return true;
}

const history = [];

/** Play a list of moments, each on its own (a broken one doesn't stop the rest), within the burst limit. */
export function playMoments(moments) {
  const room = allowed(history, moments.length, Date.now());
  for (const moment of moments.slice(0, room)) {
    try {
      playMoment(moment);
    } catch (err) {
      console.error(`${MODULE_ID} | ${moment?.key} failed`, err);
    }
  }
}
