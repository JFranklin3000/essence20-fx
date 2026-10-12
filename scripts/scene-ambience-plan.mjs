/**
 * Scene ambience: a GM-chosen loop over a whole scene (Night Vale's static, Energon motes, sparkles, battlefield
 * smoke...). Pure (tested with `node --test`); scripts/scene-ambience.mjs plays it.
 *
 * Each look is layers of one looping effect scattered across the scene - how many follows the scene's size - at spots
 * picked from the scene's own id, so every client (and every reload) puts them in the same places.
 */

/**
 * The looks a GM can pick. A layer: file, density (copies per 1000x1000 px), size (px), opacity, and optionally a
 * colour shift (ColorMatrix values) or a tint.
 */
export const AMBIENCES = {
  nightvale: [
    { file: 'jb2a.ambient_fog.001.loop.large.white', density: 0.5, size: 1400, opacity: 0.25, tint: '#6a3fa0' },
    { file: 'jb2a.static_electricity.03.blue', density: 1.5, size: 260, opacity: 0.35, shift: { saturate: -1, brightness: 1.2 } },
  ],
  energon: [
    { file: 'jb2a.fireflies.many.01.green', density: 2, size: 500, opacity: 0.8, shift: { hue: 70 } },
  ],
  sparkles: [
    { file: 'jb2a.fairies.loop.01.bluepurple', density: 1.2, size: 450, opacity: 0.6 },
    { file: 'jb2a.butterflies.loop.01.bluepurple', density: 0.6, size: 300, opacity: 0.8 },
  ],
  fog: [
    { file: 'jb2a.ambient_fog.001.loop.large.white', density: 0.8, size: 1400, opacity: 0.45 },
  ],
  battlefield: [
    { file: 'jb2a.smoke.plumes_loop.01.grey', density: 1, size: 400, opacity: 0.5 },
    { file: 'jb2a.fumes.04.loop.grey', density: 0.6, size: 350, opacity: 0.35 },
  ],
  wind: [
    { file: 'jb2a.wind_lines.01.01.white', density: 1.2, size: 500, opacity: 0.5 },
  ],
  fireflies: [
    { file: 'jb2a.fireflies.many.01.green', density: 1.5, size: 500, opacity: 0.8 },
  ],
};

/** At most this many copies of one layer, however big the scene. */
export const MAX_PER_LAYER = 30;

/** A small seeded random number generator (mulberry32), from a string. */
export function seeded(seed) {
  let state = 0;
  for (const char of String(seed)) {
    state = (Math.imul(state, 31) + char.charCodeAt(0)) | 0;
  }

  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Where each copy of each layer goes.
 * @param {String} key     An AMBIENCES key
 * @param {{x, y, width, height}} rect   The scene's area (canvas.dimensions.sceneRect)
 * @param {String} seed    The scene's id
 * @returns {Array<{file, x, y, size, opacity, shift?, tint?}>}
 */
export function ambiencePlan(key, rect, seed) {
  const layers = AMBIENCES[key];
  if (!layers || !(rect?.width > 0) || !(rect?.height > 0)) {
    return [];
  }

  const random = seeded(`${seed}:${key}`);
  const area = (rect.width * rect.height) / 1e6;
  const placements = [];
  for (const layer of layers) {
    const count = Math.max(1, Math.min(MAX_PER_LAYER, Math.round(area * layer.density)));
    for (let i = 0; i < count; i++) {
      placements.push({
        file: layer.file,
        x: Math.round(rect.x + random() * rect.width),
        y: Math.round(rect.y + random() * rect.height),
        size: layer.size,
        opacity: layer.opacity,
        ...(layer.shift ? { shift: layer.shift } : {}),
        ...(layer.tint ? { tint: layer.tint } : {}),
      });
    }
  }

  return placements;
}
