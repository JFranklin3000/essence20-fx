/**
 * Moment key -> what plays. Pure (tested with `node --test`).
 *
 * A preset's parts, each optional:
 *   projectile  Sequencer database path, played from the source and stretched to the target (`.missed()` on a miss)
 *   swing       Sequencer path, from the source stretched to the target (a melee swing)
 *   impact      Sequencer path, played on the target
 *   overlay     Sequencer path, played over the target (or the source when there is no target)
 *   area        Sequencer path, played over an area's shape (areas: circle / emanation sized to it, cone / line stretched
 *               from the apex along its direction)
 *   flash       a colour: the token itself flashes it and shakes (damage taken)
 *   sound       file(s) under the module's sounds/ folder - an array picks one at random
 *   delay       ms between the projectile/swing and the impact
 *
 * Animations name the free JB2A pack (JB2A_DnD5e). PATREON lists the swaps used when jb2a_patreon is active - only
 * where its variant is better; anything not listed stays on the free path.
 */

const range = (prefix, count, pad = 3) => Array.from({ length: count }, (_, i) => `${prefix}${String(i).padStart(pad, '0')}.ogg`);

export const GENERIC = {
  'attack.ranged.hit': {
    projectile: 'jb2a.lasershot.blue',
    impact: 'jb2a.impact.004.blue',
    sound: range('scifi/laserSmall_', 5),
    delay: 350,
  },
  'attack.ranged.critical': {
    projectile: 'jb2a.lasershot.red',
    impact: 'jb2a.explosion.02.blue',
    overlay: 'jb2a.ui.critical.red',
    sound: range('scifi/laserLarge_', 3),
    delay: 350,
  },
  'attack.ranged.miss': {
    projectile: 'jb2a.lasershot.blue',
    sound: range('scifi/laserRetro_', 3),
  },
  'attack.melee.hit': {
    swing: 'jb2a.melee_generic.slash.01.orange',
    impact: 'jb2a.impact.005.orange',
    sound: range('impact/impactPunch_medium_', 3),
    delay: 300,
  },
  'attack.melee.critical': {
    swing: 'jb2a.melee_generic.slash.01.orange',
    impact: 'jb2a.impact.ground_crack.orange.01',
    overlay: 'jb2a.ui.critical.red',
    sound: range('impact/impactPunch_heavy_', 3),
    delay: 300,
  },
  'attack.melee.miss': {
    swing: 'jb2a.melee_generic.slash.01.orange',
    overlay: 'jb2a.ui.miss.white',
    sound: ['rpg/cloth1.ogg'],
    delay: 300,
  },
  'attack.fumble': {
    overlay: 'jb2a.ui.critical_miss.red',
    sound: ['interface/error_001.ogg'],
  },

  // An area attack's burst; its targets' impacts come from attack.area.hit.
  'area.circle': { area: 'jb2a.explosion.01.orange', sound: range('scifi/explosionCrunch_', 5) },
  'area.emanation': { area: 'jb2a.explosion.01.orange', sound: range('scifi/explosionCrunch_', 5) },
  'area.cone': { area: 'jb2a.breath_weapons02.burst.cone.fire.orange.01', sound: range('scifi/thrusterFire_', 2) },
  'area.line': { area: 'jb2a.breath_weapons02.burst.line.fire.orange.01', sound: range('scifi/thrusterFire_', 2) },
  'attack.area.hit': { impact: 'jb2a.impact.005.orange', delay: 400 },
  'attack.area.critical': { impact: 'jb2a.impact.ground_crack.orange.01', overlay: 'jb2a.ui.critical.red', delay: 400 },

  // Damage taken: the token flashes red and shakes (the damage type's own colour when it has one - DAMAGE below).
  'damage.taken': { flash: '#ff3030' },
  'damage.defeated': {
    impact: 'jb2a.smoke.puff.centered.grey',
    overlay: 'jb2a.icon.skull.purple',
    sound: ['digital/lowDown.ogg'],
  },
};

/**
 * Each damage type's look: per attack style (ranged / melee) and for areas (by shape), plus its flash colour. Only the
 * parts given replace the generic preset's. The system's types (CONFIG.E20.damageTypes); laser is the generic look.
 */
export const DAMAGE = {
  fire: {
    ranged: { projectile: 'jb2a.fire_bolt.orange', impact: 'jb2a.impact.fire.01.orange', sound: range('scifi/thrusterFire_', 2) },
    melee: { impact: 'jb2a.impact.fire.01.orange' },
    area: { circle: 'jb2a.fireball.explosion.orange', emanation: 'jb2a.fireball.explosion.orange', cone: 'jb2a.breath_weapons.fire.cone.orange.01', line: 'jb2a.breath_weapons.fire.line.orange' },
    flash: '#ff7a1a',
  },
  cold: {
    ranged: { projectile: 'jb2a.ray_of_frost.blue', impact: 'jb2a.impact.frost.white.01', sound: ['impact/impactGlass_heavy_000.ogg'] },
    melee: { impact: 'jb2a.impact.frost.white.01' },
    area: { circle: 'jb2a.explosion.02.blue', emanation: 'jb2a.explosion.02.blue', cone: 'jb2a.breath_weapons.cold.cone.blue' },
    flash: '#8fd3ff',
  },
  electric: {
    ranged: { projectile: 'jb2a.chain_lightning.primary.blue', impact: 'jb2a.static_electricity.01.blue', sound: ['digital/zap1.ogg', 'digital/zap2.ogg'] },
    melee: { impact: 'jb2a.static_electricity.01.blue' },
    area: { circle: 'jb2a.explosion.04.blue', emanation: 'jb2a.explosion.04.blue', line: 'jb2a.breath_weapons.lightning.line.blue' },
    flash: '#9ad0ff',
  },
  emp: {
    ranged: { projectile: 'jb2a.witch_bolt.blue', impact: 'jb2a.static_electricity.02.blue', sound: ['digital/phaserDown2.ogg'] },
    melee: { impact: 'jb2a.static_electricity.02.blue' },
    area: { circle: 'jb2a.explosion.04.blue', emanation: 'jb2a.explosion.04.blue', line: 'jb2a.breath_weapons.lightning.line.blue' },
    flash: '#66ccff',
  },
  acid: {
    ranged: { projectile: 'jb2a.disintegrate.green', impact: 'jb2a.toll_the_dead.green.shockwave', sound: ['scifi/slime_000.ogg'] },
    melee: { impact: 'jb2a.toll_the_dead.green.shockwave' },
    area: { circle: 'jb2a.toll_the_dead.green.shockwave', emanation: 'jb2a.toll_the_dead.green.shockwave', cone: 'jb2a.breath_weapons.poison.cone.green', line: 'jb2a.breath_weapons.acid.line.green' },
    flash: '#7cff3a',
  },
  poison: {
    ranged: { projectile: 'jb2a.disintegrate.green', impact: 'jb2a.icon.poison.dark_green', sound: ['scifi/slime_000.ogg'] },
    melee: { impact: 'jb2a.icon.poison.dark_green' },
    area: { circle: 'jb2a.toll_the_dead.green.shockwave', emanation: 'jb2a.toll_the_dead.green.shockwave', cone: 'jb2a.breath_weapons.poison.cone.green' },
    flash: '#4caf50',
  },
  sonic: {
    ranged: { projectile: 'jb2a.energy_beam.normal.bluepink.02', impact: 'jb2a.soundwave.01.blue', sound: ['digital/phaserDown1.ogg'] },
    melee: { impact: 'jb2a.soundwave.01.blue' },
    area: { circle: 'jb2a.shatter.blue', emanation: 'jb2a.shatter.blue' },
    flash: '#c0a0ff',
  },
  psychic: {
    ranged: { projectile: 'jb2a.energy_strands.range.standard.purple.01', impact: 'jb2a.icon.horror.purple', sound: ['digital/phaseJump1.ogg'] },
    melee: { impact: 'jb2a.icon.horror.purple' },
    flash: '#b04cff',
  },
  void: {
    ranged: { projectile: 'jb2a.eldritch_blast.purple', impact: 'jb2a.particle_burst.01.circle.bluepurple', sound: ['digital/spaceTrash1.ogg'] },
    melee: { impact: 'jb2a.particle_burst.01.circle.bluepurple' },
    flash: '#5a2d82',
  },
  blindingBlast: {
    ranged: { impact: 'jb2a.explosion.03.blueyellow', sound: ['digital/powerUp1.ogg'] },
    melee: { impact: 'jb2a.explosion.03.blueyellow' },
    flash: '#ffffff',
  },
  stun: {
    ranged: { impact: 'jb2a.dizzy_stars.200px.blueorange', sound: ['digital/zapThreeToneDown.ogg'] },
    melee: { impact: 'jb2a.dizzy_stars.200px.blueorange' },
    flash: '#ffd54a',
  },
  // Kinetic weapons: bullets and blades (the generic laser stays for the energy types).
  sharp: {
    ranged: { projectile: 'jb2a.bullet.02.orange', impact: 'jb2a.impact.007.orange', sound: range('scifi/impactMetal_', 2) },
  },
  blunt: {
    ranged: { projectile: 'jb2a.bullet.01.orange', impact: 'jb2a.impact.007.orange', sound: range('scifi/impactMetal_', 2) },
    melee: { swing: 'jb2a.club.melee.01.white', sound: range('impact/impactPunch_heavy_', 3) },
  },
};

/**
 * Signature moments (Power Rangers, Transformers). Extra parts:
 *   ring     a Sequencer path played around the token, tinted to the moment's colour (a Ranger's own)
 *   recolor  true: the overlay is hue-shifted to the moment's colour (JB2A's blue art turned Red, Pink, Gold...)
 *   baseHue  the overlay art's own hue when it isn't JB2A's usual blue (210), so the shift lands on the right colour
 *   beam     a Sequencer path stretched from each part of a Megaform to the Megaform
 *   depart   a teleport's flash where the token left (recoloured with the overlay)
 *   streak   a Sequencer path stretched from where a teleporting token left to where it lands (recoloured too)
 *   scale    how big the impact / overlay is next to the token (default 1.5 / 1.2)
 */
export const SIGNATURE = {
  morph: {
    overlay: 'jb2a.energy_strands.complete.blue.01',
    ring: 'jb2a.extras.tmfx.border.circle.inpulse.01.normal',
    recolor: true,
    sound: ['digital/powerUp1.ogg', 'digital/powerUp2.ogg', 'digital/powerUp3.ogg', 'digital/powerUp4.ogg'],
  },
  unmorph: { overlay: 'jb2a.misty_step.02.blue', recolor: true, sound: ['digital/phaserDown1.ogg'] },
  transform: {
    impact: 'jb2a.impact.011.blue',
    ring: 'jb2a.extras.tmfx.border.circle.inpulse.02.normal',
    sound: ['scifi/doorOpen_000.ogg', 'scifi/doorOpen_001.ogg'],
  },
  untransform: {
    impact: 'jb2a.impact.011.blue',
    ring: 'jb2a.extras.tmfx.border.circle.inpulse.02.normal',
    sound: ['scifi/doorClose_000.ogg', 'scifi/doorClose_001.ogg'],
  },
  'energon.spent': { overlay: 'jb2a.swirling_sparkles.01.blue', sound: ['digital/pepSound1.ogg'] },
  'zord.summoned': { overlay: 'jb2a.markers_scifi.001.complete.001.blue', sound: ['interface/confirmation_001.ogg'] },
  'zord.arrived': { sound: ['scifi/spaceEngineLarge_000.ogg'] },
  'zord.placed': {
    impact: 'jb2a.impact.ground_crack.orange.01',
    overlay: 'jb2a.smoke.puff.centered.grey',
    scale: 2,
    sound: ['scifi/lowFrequency_explosion_000.ogg', 'scifi/lowFrequency_explosion_001.ogg'],
  },
  'zord.boarded': { overlay: 'jb2a.misty_step.01.blue', sound: ['digital/phaseJump1.ogg'] },
  'zord.disembarked': { overlay: 'jb2a.misty_step.02.blue', sound: ['digital/phaseJump2.ogg'] },
  'zord.recalled': { overlay: 'jb2a.teleport.01.blue', scale: 2, sound: ['digital/phaserUp3.ogg'] },
  'megaform.formed': {
    beam: 'jb2a.energy_beam.normal.blue.01',
    impact: 'jb2a.markers.light.complete.blue',
    scale: 2.5,
    delay: 600,
    sound: ['scifi/forceField_001.ogg', 'scifi/forceField_002.ogg'],
  },
  'megaform.split': { impact: 'jb2a.explosion.04.blue', scale: 2.5, sound: range('scifi/explosionCrunch_', 5) },
  // Separating on purpose (the sheet's Separate): beams out to each member, no explosion.
  'megaform.separated': {
    beam: 'jb2a.energy_beam.normal.blue.01',
    impact: 'jb2a.markers.light.complete.blue',
    scale: 2,
    sound: ['scifi/forceField_002.ogg'],
  },
  // Any token's teleport (Foundry's Blink / Displace, a Wrist Communicator, a Perk's moveTo): gone here, there.
  teleport: { depart: 'jb2a.misty_step.01.blue', overlay: 'jb2a.misty_step.02.blue', delay: 350, sound: ['digital/phaseJump1.ogg'] },
};

/**
 * Every game line: Story Points, Spellcasting and the Weird, help from a teammate, a reroll, a Requisition. A game
 * line's own look (LINES below) replaces these for actors of that line.
 */
export const MOMENTS = {
  'storyPoint.spent': { overlay: 'jb2a.twinkling_stars.points07.orange', sound: ['interface/bong_001.ogg'] },
  'spell.cast': { overlay: 'jb2a.fairies.outward_burst.01.bluepurple', recolor: true, baseHue: 255, scale: 1.8, sound: ['digital/threeTone1.ogg'] },
  'weird.used': {
    overlay: 'jb2a.eyes.01.dark_green.single',
    impact: 'jb2a.static_electricity.03.blue',
    sound: ['scifi/computerNoise_000.ogg', 'scifi/computerNoise_001.ogg'],
  },
  'assist.given': { overlay: 'jb2a.ui.chevrons3.yellow', sound: ['interface/confirmation_002.ogg'] },
  rerolled: { overlay: 'jb2a.twinkling_stars.points05.white', sound: ['interface/maximize_001.ogg'] },
  'requisition.granted': {
    overlay: 'jb2a.markers_scifi.002.complete.001.blue',
    impact: 'jb2a.smoke.puff.centered.grey',
    sound: ['impact/impactWood_heavy_000.ogg'],
  },
};

/** A game line's own look for a moment (the actor's Role says which line: system.version). */
export const LINES = {
  // A Ranger teleports as a streak of their own colour across the map.
  powerRangers: {
    teleport: { depart: 'jb2a.misty_step.01.blue', streak: 'jb2a.teleport.01.blue', overlay: 'jb2a.misty_step.02.blue', recolor: true, delay: 450, sound: ['digital/phaserUp3.ogg'] },
  },
  // A Cybertronian steps through a bridge: a portal opens at both ends.
  transformers: {
    teleport: { depart: 'jb2a.portals.horizontal.ring.bright_yellow', overlay: 'jb2a.portals.horizontal.ring.bright_yellow', scale: 1.6, delay: 500, sound: ['scifi/forceField_001.ogg'] },
  },
  myLittlePony: {
    teleport: { depart: 'jb2a.twinkling_stars.points07.white', overlay: 'jb2a.twinkling_stars.points07.white', impact: 'jb2a.misty_step.02.blue', delay: 300, sound: ['interface/pluck_001.ogg'] },
    'assist.given': { overlay: 'jb2a.icon.heart.pink', impact: 'jb2a.butterflies.outward_burst.01.bluepurple', sound: ['interface/pluck_001.ogg'] },
    rerolled: { overlay: 'jb2a.firework.02.orangeyellow.01', sound: ['interface/maximize_001.ogg'] },
    'storyPoint.spent': { overlay: 'jb2a.twinkling_stars.points07.white', impact: 'jb2a.butterflies.outward_burst.01.bluepurple', sound: ['interface/bong_001.ogg'] },
  },
  welcomeToNightVale: {
    'storyPoint.spent': { overlay: 'jb2a.eyes.01.dark_green.single', sound: ['scifi/computerNoise_001.ogg'] },
    rerolled: { overlay: 'jb2a.static_electricity.03.blue', sound: ['interface/glitch_002.ogg'] },
  },
};

/**
 * A weapon's style (E20.weaponStyles) over the generic attack: bullets for projectile weapons, a thrown bomb and an
 * explosion for explosives. Projectile goes under the damage type's look (a flamethrower stays fire); explosive goes
 * over it (a fire grenade still explodes).
 */
export const STYLES = {
  projectile: {
    ranged: { projectile: 'jb2a.bullet.01.orange', impact: 'jb2a.impact.007.orange', sound: range('scifi/impactMetal_', 2) },
  },
  explosive: {
    ranged: { projectile: 'jb2a.throwable.throw.bomb.01.black', impact: 'jb2a.explosion.01.orange', scale: 2, delay: 700, sound: range('scifi/lowFrequency_explosion_', 2) },
    area: { circle: 'jb2a.explosion.08.orange', emanation: 'jb2a.explosion.08.orange' },
  },
};

/** A Condition arriving on a token (the system's status ids). */
export const CONDITIONS = {
  stunned: { overlay: 'jb2a.dizzy_stars.200px.blueorange', sound: ['digital/zapThreeToneDown.ogg'] },
  frightened: { overlay: 'jb2a.icon.fear.dark_purple', sound: ['interface/question_001.ogg'] },
  poisoned: { overlay: 'jb2a.icon.poison.dark_green', sound: ['scifi/slime_000.ogg'] },
  prone: { overlay: 'jb2a.smoke.puff.centered.grey', sound: ['impact/impactSoft_medium_000.ogg'] },
  unconscious: { overlay: 'jb2a.icon.stun.purple', sound: ['interface/drop_001.ogg'] },
  asleep: { overlay: 'jb2a.icon.stun.purple', sound: ['interface/drop_001.ogg'] },
  deafened: { overlay: 'jb2a.icon.mute.dark_red', sound: ['interface/drop_001.ogg'] },
  grappled: { overlay: 'jb2a.markers.chain.standard.complete.02.red', sound: ['rpg/metalLatch.ogg'] },
  restrained: { overlay: 'jb2a.markers.chain.standard.complete.02.red', sound: ['rpg/metalLatch.ogg'] },
  immobilized: { overlay: 'jb2a.markers.chain.standard.complete.02.red', sound: ['rpg/metalLatch.ogg'] },
  armorStripped: { overlay: 'jb2a.icon.shield_cracked.purple', sound: ['impact/impactMetal_heavy_000.ogg'] },
  defending: { overlay: 'jb2a.icon.shield.green', sound: ['scifi/forceField_000.ogg'] },
  invisible: { overlay: 'jb2a.misty_step.01.blue', sound: ['digital/phaseJump2.ogg'] },
  jammed: { overlay: 'jb2a.static_electricity.03.blue', sound: ['interface/glitch_001.ogg'] },
};

/** Patreon-only swaps, by moment key and part. Empty until a Patreon pack is on hand to pick from. */
export const PATREON = {};

/**
 * The preset for a moment: the generic one, with its damage type's look over it and the Patreon swaps when that pack
 * is active. `condition.<id>` keys read CONDITIONS.
 * @param {String} key
 * @param {{damageType?: String, patreon?: Boolean}} [options]
 * @returns {Object|null}
 */
export function presetFor(key, { damageType = null, style = null, line = null, patreon = false } = {}) {
  const base = key.startsWith('condition.') ? CONDITIONS[key.slice('condition.'.length)] : GENERIC[key] ?? SIGNATURE[key] ?? MOMENTS[key];
  if (!base) {
    return null;
  }

  const preset = { ...base, ...(line ? LINES[line]?.[key] : null) };
  const look = damageType ? DAMAGE[damageType] : null;
  const weapon = style ? STYLES[style] : null;
  const [kind, part] = key.split('.');
  if (kind == 'attack' && ['ranged', 'melee'].includes(part)) {
    // Under the damage type: the weapon's plain style. Over it: an explosive's bang.
    const layers = style == 'explosive' ? [look, weapon] : [weapon, look];
    for (const layer of layers) {
      Object.assign(preset, layer?.[part] ?? {});
    }
  } else if (kind == 'area') {
    const layers = style == 'explosive' ? [look, weapon] : [weapon, look];
    for (const layer of layers) {
      if (layer?.area?.[part]) {
        preset.area = layer.area[part];
      }
    }
  } else if (look?.flash && key == 'damage.taken') {
    preset.flash = look.flash;
  }

  return patreon && PATREON[key] ? { ...preset, ...PATREON[key] } : preset;
}

/** Every Sequencer path a preset can play - for the database check in tests. */
export function allAnimationPaths() {
  const parts = preset => ['projectile', 'swing', 'impact', 'overlay', 'area', 'ring', 'beam', 'depart', 'streak'].map(part => preset[part]).filter(Boolean);
  return [
    ...Object.values(GENERIC).flatMap(parts),
    ...Object.values(SIGNATURE).flatMap(parts),
    ...Object.values(MOMENTS).flatMap(parts),
    ...Object.values(LINES).flatMap(line => Object.values(line).flatMap(parts)),
    ...Object.values(STYLES).flatMap(look => [...parts(look.ranged ?? {}), ...parts(look.melee ?? {}), ...Object.values(look.area ?? {})]),
    ...Object.values(CONDITIONS).flatMap(parts),
    ...Object.values(DAMAGE).flatMap(look => [...parts(look.ranged ?? {}), ...parts(look.melee ?? {}), ...Object.values(look.area ?? {})]),
  ];
}

/** Every sound file a preset can play - for the file check in tests. */
export function allSoundFiles() {
  return [...new Set([
    ...Object.values(GENERIC), ...Object.values(CONDITIONS), ...Object.values(SIGNATURE), ...Object.values(MOMENTS),
    ...Object.values(LINES).flatMap(line => Object.values(line)),
    ...Object.values({ ...DAMAGE, ...STYLES }).flatMap(look => [look.ranged ?? {}, look.melee ?? {}]),
  ].flatMap(preset => preset.sound ?? []))];
}

/**
 * Every moment a GM can change, grouped as the Configure FX window lists them. Conditions follow CONDITIONS.
 * @returns {Array<{id: String, keys: String[]}>}
 */
export function momentGroups() {
  return [
    { id: 'attacks', keys: ['attack.ranged.hit', 'attack.ranged.critical', 'attack.ranged.miss', 'attack.melee.hit', 'attack.melee.critical', 'attack.melee.miss', 'attack.fumble'] },
    { id: 'areas', keys: ['area.circle', 'area.emanation', 'area.cone', 'area.line', 'attack.area.hit', 'attack.area.critical'] },
    { id: 'damage', keys: ['damage.taken', 'damage.defeated'] },
    { id: 'conditions', keys: Object.keys(CONDITIONS).map(id => `condition.${id}`) },
    { id: 'signature', keys: Object.keys(SIGNATURE) },
    { id: 'extras', keys: Object.keys(MOMENTS) },
  ];
}

/** Every moment key there is. */
export function allMomentKeys() {
  return momentGroups().flatMap(group => group.keys);
}
