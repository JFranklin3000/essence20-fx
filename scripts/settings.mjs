export const MODULE_ID = 'essence20-fx';
export const SOUNDS = `modules/${MODULE_ID}/sounds/`;

/** An on/off switch for one kind of effect - the world's (the GM's) unless said otherwise. */
function toggle(key, { initial = true, scope = 'world' } = {}) {
  game.settings.register(MODULE_ID, key, {
    name: `E20FX.Settings.${key[0].toUpperCase()}${key.slice(1)}.Name`,
    hint: `E20FX.Settings.${key[0].toUpperCase()}${key.slice(1)}.Hint`,
    scope,
    config: true,
    type: Boolean,
    default: initial,
  });
}

/**
 * World settings (the GM's): everything on/off, each kind on/off, volume. Client: Reduced motion, kept as a flag on the
 * user too - effects are sent from whoever acted, and their client has to know who doesn't want the animations.
 * Muting effects or sounds outright is Sequencer's own client settings.
 */
export function registerSettings() {
  toggle('enabled');
  toggle('combat');
  toggle('damage');
  toggle('conditions');
  toggle('signature');
  toggle('extras');
  toggle('ambient');
  toggle('ambientActive', { initial: false });
  toggle('emblemsUnderTokens');
  toggle('emblemFlash');
  toggle('emblemsOnDice', { initial: false });
  toggle('diceAutoColour', { initial: false, scope: 'client' });
  toggle('sceneAmbience');

  // Automated Animations: give the Essence20 entries this module's sounds; whether a GM has been offered them yet.
  toggle('autorecSounds');
  game.settings.register(MODULE_ID, 'autorecOffered', { scope: 'world', config: false, type: Boolean, default: false });

  // With Automated Animations active: who animates attacks (scripts/aa-bridge.mjs).
  game.settings.register(MODULE_ID, 'attackAnimator', {
    name: 'E20FX.Settings.AttackAnimator.Name',
    hint: 'E20FX.Settings.AttackAnimator.Hint',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      fx: 'E20FX.Settings.AttackAnimator.Fx',
      aaFirst: 'E20FX.Settings.AttackAnimator.AaFirst',
      aa: 'E20FX.Settings.AttackAnimator.Aa',
    },
    default: 'aaFirst',
  });
  toggle('emblemOnCards');

  // The GM's faction emblem images (scripts/emblems.mjs), edited in Faction Emblems.
  game.settings.register(MODULE_ID, 'emblems', { scope: 'world', config: false, type: Array, default: [] });

  // The GM's changes to what each moment plays (scripts/overrides.mjs), edited in Configure FX.
  game.settings.register(MODULE_ID, 'overrides', { scope: 'world', config: false, type: Object, default: {} });

  game.settings.register(MODULE_ID, 'volume', {
    name: 'E20FX.Settings.Volume.Name',
    hint: 'E20FX.Settings.Volume.Hint',
    scope: 'world',
    config: true,
    type: Number,
    range: { min: 0, max: 1, step: 0.05 },
    default: 0.6,
  });

  game.settings.register(MODULE_ID, 'reducedMotion', {
    name: 'E20FX.Settings.ReducedMotion.Name',
    hint: 'E20FX.Settings.ReducedMotion.Hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: syncReducedMotion,
  });
}

/** Keep the user flag in step with the client setting (on ready, and when it changes). */
export async function syncReducedMotion(value = setting('reducedMotion')) {
  if (!!game.user.getFlag(MODULE_ID, 'reducedMotion') != !!value) {
    await game.user.setFlag(MODULE_ID, 'reducedMotion', !!value);
  }
}

export const setting = key => game.settings.get(MODULE_ID, key);
