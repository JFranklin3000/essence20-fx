/**
 * Automatic Recognition entries for Automated Animations, for the words Essence20 weapon names use (Blaster, Laser,
 * Rifle, Blade, Bludgeon, Grenade, Launcher...) - counted across the system's 475 weapons and 828 weapon effects.
 * Pure (tested with `node --test`); scripts/aa-autorec-install.mjs merges them into its menus.
 *
 * Each entry is one of its own default entries (TEMPLATES, captured from Automated Animations 7.1.7) with a label, an
 * animation from its catalogue (dbSection.menuType.animation.variant.color) and, where one fits, one of this module's
 * CC0 sounds. Its matching takes the longest label contained in an item's name, so "Laser Sword" beats "Laser", and
 * "Blaster" beats "Blade" for a Blade Blaster.
 */

export const TEMPLATES = {
  "range": {
    "label": "",
    "soundOnly": {
      "sound": {
        "delay": 0,
        "enable": false,
        "startTime": 0,
        "volume": 0.75
      }
    },
    "menu": "range",
    "metaData": {},
    "primary": {
      "video": {
        "dbSection": "range",
        "menuType": "weapon",
        "animation": "bolt",
        "variant": "physical",
        "color": "orange",
        "enableCustom": false,
        "customPath": ""
      },
      "sound": {
        "enable": false,
        "delay": 0,
        "repeat": 1,
        "repeatDelay": 250,
        "startTime": 0,
        "volume": 0.75
      },
      "options": {
        "contrast": 0,
        "delay": 0,
        "elevation": 1000,
        "isReturning": false,
        "isWait": false,
        "onlyX": false,
        "opacity": 1,
        "repeat": 1,
        "repeatDelay": 500,
        "saturate": 0,
        "tint": false,
        "tintColor": "#FFFFFF",
        "zIndex": 1
      }
    },
    "secondary": {
      "enable": false,
      "video": {
        "dbSection": "static",
        "menuType": "spell",
        "animation": "curewounds",
        "variant": "01",
        "color": "blue",
        "enableCustom": false,
        "customPath": ""
      },
      "sound": {
        "enable": false,
        "delay": 0,
        "repeat": 1,
        "repeatDelay": 250,
        "startTime": 0,
        "volume": 0.75
      },
      "options": {
        "addTokenWidth": false,
        "anchor": "0.5",
        "contrast": 0,
        "delay": 0,
        "elevation": 1000,
        "fadeIn": 250,
        "fadeOut": 500,
        "isMasked": false,
        "isRadius": true,
        "isWait": false,
        "opacity": 1,
        "repeat": 1,
        "repeatDelay": 250,
        "saturate": 0,
        "size": 1.5,
        "tint": false,
        "tintColor": "#FFFFFF",
        "zIndex": 1
      }
    },
    "levels3d": {
      "type": "sprite",
      "data": {
        "color01": "#FFFFFF",
        "color02": "#FFFFFF",
        "spritePath": "modules/canvas3dcompendium/assets/Tiles/RPG%20Items/Arrow.glb",
        "rotationY": 0,
        "rotationX": 90,
        "speed": 10,
        "scale": 0.5
      },
      "sound": {
        "enable": false
      },
      "secondary": {
        "enable": false,
        "data": {
          "color01": "#FFFFFF",
          "color02": "#FFFFFF"
        }
      },
      "tokens": {
        "enable": true,
        "source": true,
        "target": true,
        "sourceType": "bow",
        "sourcePlay": "start",
        "targetType": "shake",
        "targetPlay": "end"
      },
      "enable": false
    },
    "macro": {
      "enable": false
    },
    "source": {
      "enable": false,
      "video": {
        "dbSection": "static",
        "menuType": "spell",
        "animation": "curewounds",
        "variant": "01",
        "color": "blue",
        "enableCustom": false,
        "customPath": ""
      },
      "sound": {
        "enable": false,
        "delay": 0,
        "repeat": 1,
        "repeatDelay": 250,
        "startTime": 0,
        "volume": 0.75
      },
      "options": {
        "addTokenWidth": false,
        "anchor": "0.5",
        "contrast": 0,
        "delay": 0,
        "elevation": 1000,
        "fadeIn": 250,
        "fadeOut": 500,
        "isMasked": false,
        "isRadius": false,
        "isWait": true,
        "opacity": 1,
        "repeat": 1,
        "repeatDelay": 250,
        "saturate": 0,
        "size": 1,
        "tint": false,
        "tintColor": "#FFFFFF",
        "zIndex": 1
      }
    },
    "target": {
      "enable": false,
      "video": {
        "dbSection": "static",
        "menuType": "spell",
        "animation": "curewounds",
        "variant": "01",
        "color": "blue",
        "enableCustom": false,
        "customPath": ""
      },
      "sound": {
        "enable": false,
        "delay": 0,
        "repeat": 1,
        "repeatDelay": 250,
        "startTime": 0,
        "volume": 0.75
      },
      "options": {
        "addTokenWidth": false,
        "anchor": "0.5",
        "contrast": 0,
        "delay": 0,
        "elevation": 1000,
        "fadeIn": 250,
        "fadeOut": 500,
        "isMasked": false,
        "isRadius": false,
        "opacity": 1,
        "persistent": false,
        "repeat": 1,
        "repeatDelay": 250,
        "saturate": 0,
        "size": 1,
        "tint": false,
        "tintColor": "#FFFFFF",
        "unbindAlpha": false,
        "unbindVisibility": false,
        "zIndex": 1
      }
    }
  },
  "melee": {
    "label": "",
    "soundOnly": {
      "sound": {
        "delay": 0,
        "enable": false,
        "startTime": 0,
        "volume": 0.75
      }
    },
    "menu": "melee",
    "metaData": {},
    "primary": {
      "video": {
        "dbSection": "melee",
        "menuType": "weapon",
        "animation": "sword",
        "variant": "01",
        "color": "white",
        "enableCustom": false,
        "customPath": ""
      },
      "sound": {
        "enable": false,
        "delay": 0,
        "repeat": 1,
        "repeatDelay": 250,
        "startTime": 0,
        "volume": 0.75
      },
      "options": {
        "contrast": 0,
        "delay": 0,
        "elevation": 1000,
        "isWait": false,
        "opacity": 1,
        "repeat": 1,
        "repeatDelay": 500,
        "saturate": 0,
        "size": 1,
        "tint": false,
        "tintColor": "#FFFFFF",
        "zIndex": 1
      }
    },
    "secondary": {
      "enable": false,
      "video": {
        "dbSection": "static",
        "menuType": "spell",
        "animation": "curewounds",
        "variant": "01",
        "color": "blue",
        "enableCustom": false,
        "customPath": ""
      },
      "sound": {
        "enable": false,
        "delay": 0,
        "repeat": 1,
        "repeatDelay": 250,
        "startTime": 0,
        "volume": 0.75
      },
      "options": {
        "addTokenWidth": false,
        "anchor": "0.5",
        "contrast": 0,
        "delay": 0,
        "elevation": 1000,
        "fadeIn": 250,
        "fadeOut": 500,
        "isMasked": false,
        "isRadius": true,
        "isWait": false,
        "opacity": 1,
        "repeat": 1,
        "repeatDelay": 250,
        "saturate": 0,
        "size": 1.5,
        "tint": false,
        "tintColor": "#FFFFFF",
        "zIndex": 1
      }
    },
    "levels3d": {
      "type": "sprite",
      "data": {
        "color01": "#FFFFFF",
        "color02": "#FFFFFF",
        "spritePath": "modules/canvas3dcompendium/assets/Tiles/RPG%20Items/Sword.glb",
        "rotateTowards": true,
        "speed": 2,
        "scale": 0.4,
        "rotationY": 90
      },
      "sound": {
        "enable": false
      },
      "secondary": {
        "enable": false,
        "data": {
          "color01": "#FFFFFF",
          "color02": "#FFFFFF"
        }
      },
      "tokens": {
        "enable": true,
        "source": false,
        "target": true,
        "sourceType": "twirl",
        "sourcePlay": "start",
        "targetType": "shake",
        "targetPlay": "end"
      },
      "enable": false
    },
    "macro": {
      "enable": false
    },
    "meleeSwitch": {
      "video": {
        "dbSection": "range",
        "menuType": "weapon",
        "animation": "arrow",
        "variant": "regular",
        "color": "regular"
      },
      "sound": {
        "enable": false,
        "delay": 0,
        "repeat": 1,
        "repeatDelay": 250,
        "startTime": 0,
        "volume": 0.75
      },
      "options": {
        "detect": "automatic",
        "range": 2,
        "returning": false,
        "switchType": "on"
      }
    },
    "source": {
      "enable": false,
      "video": {
        "dbSection": "static",
        "menuType": "spell",
        "animation": "curewounds",
        "variant": "01",
        "color": "blue",
        "enableCustom": false,
        "customPath": ""
      },
      "sound": {
        "enable": false,
        "delay": 0,
        "repeat": 1,
        "repeatDelay": 250,
        "startTime": 0,
        "volume": 0.75
      },
      "options": {
        "addTokenWidth": false,
        "anchor": "0.5",
        "contrast": 0,
        "delay": 0,
        "elevation": 1000,
        "fadeIn": 250,
        "fadeOut": 500,
        "isMasked": false,
        "isRadius": false,
        "isWait": true,
        "opacity": 1,
        "repeat": 1,
        "repeatDelay": 250,
        "saturate": 0,
        "size": 1,
        "tint": false,
        "tintColor": "#FFFFFF",
        "zIndex": 1
      }
    },
    "target": {
      "enable": false,
      "video": {
        "dbSection": "static",
        "menuType": "spell",
        "animation": "curewounds",
        "variant": "01",
        "color": "blue",
        "enableCustom": false,
        "customPath": ""
      },
      "sound": {
        "enable": false,
        "delay": 0,
        "repeat": 1,
        "repeatDelay": 250,
        "startTime": 0,
        "volume": 0.75
      },
      "options": {
        "addTokenWidth": false,
        "anchor": "0.5",
        "contrast": 0,
        "delay": 0,
        "elevation": 1000,
        "fadeIn": 250,
        "fadeOut": 500,
        "isMasked": false,
        "isRadius": false,
        "opacity": 1,
        "persistent": false,
        "repeat": 1,
        "repeatDelay": 250,
        "saturate": 0,
        "size": 1,
        "tint": false,
        "tintColor": "#FFFFFF",
        "unbindAlpha": false,
        "unbindVisibility": false,
        "zIndex": 1
      }
    }
  }
};

/** [label, menu, "section.type.animation.variant.color", sound under sounds/ or null, words that rule it out?] */
export const ENTRIES = [
  // Energy weapons
  ['Laser', 'range', 'range.weapon.lasershot.01.blue', 'scifi/laserSmall_000.ogg'],
  ['Blaster', 'range', 'range.weapon.lasershot.01.red', 'scifi/laserSmall_001.ogg'],
  ['Cannon', 'range', 'range.weapon.lasershot.01.orange', 'scifi/laserLarge_000.ogg'],
  ['Ray', 'range', 'range.generic.energybeam.01.blue', 'digital/phaserUp1.ogg', ['array', 'spray', 'stingray', 'xray']],
  ['Blast', 'range', 'range.generic.energybeam.01.blue', 'digital/phaserUp1.ogg'],
  ['Silverizer', 'range', 'range.weapon.lasershot.01.blue', 'scifi/laserSmall_002.ogg'],
  ['Stinger', 'range', 'range.weapon.lasershot.01.green', 'scifi/laserSmall_003.ogg'],
  ['Slinger', 'range', 'range.weapon.lasershot.01.green', 'scifi/laserSmall_004.ogg'],
  ['Striker', 'range', 'range.weapon.lasershot.01.orange', 'scifi/laserLarge_001.ogg'],
  ['Beam', 'range', 'range.generic.energybeam.02.blue', 'digital/phaserUp2.ogg'],
  ['Particle', 'range', 'range.generic.energybeam.03.blue', 'digital/phaserUp3.ogg'],
  ['Quasar', 'range', 'range.generic.energystrand.01.purple', 'digital/phaseJump1.ogg'],
  ['Antimatter', 'range', 'range.spell.eldritchblast.01.purple', 'digital/spaceTrash1.ogg'],
  ['Lightning', 'range', 'range.spell.chainlightning.primary.blue', 'digital/zap1.ogg'],
  ['Thunder', 'range', 'range.spell.chainlightning.primary.blue', 'digital/zap2.ogg'],
  ['Stunner', 'range', 'range.spell.witchbolt.01.blue', 'digital/zapThreeToneDown.ogg'],
  ['Freeze', 'range', 'range.spell.rayoffrost.01.blue', 'impact/impactGlass_heavy_000.ogg'],
  ['Cryo', 'range', 'range.spell.rayoffrost.01.blue', 'impact/impactGlass_heavy_000.ogg'],
  ['Flechette', 'range', 'range.generic.iceshard.01.blue', 'impact/impactGlass_heavy_000.ogg'],
  ['Spray', 'range', 'range.spell.disintegrate.01.green', 'scifi/slime_000.ogg'],
  // Guns
  ['Rifle', 'range', 'range.weapon.bullet.1.orange', 'scifi/impactMetal_000.ogg'],
  ['Pistol', 'range', 'range.weapon.bullet.2.orange', 'scifi/impactMetal_001.ogg'],
  ['Gun', 'range', 'range.weapon.bullet.1.orange', 'scifi/impactMetal_000.ogg'],
  ['Shotgun', 'range', 'range.weapon.bullet.3.blue', 'scifi/impactMetal_001.ogg'],
  ['Sniper', 'range', 'range.weapon.snipe.01.blue', 'scifi/impactMetal_000.ogg'],
  ['Rail', 'range', 'range.weapon.snipe.01.blue', 'scifi/laserLarge_002.ogg', ['trail']],
  ['Ranged Weapon', 'range', 'range.weapon.bullet.1.orange', 'scifi/impactMetal_000.ogg'],
  // Explosives and heavy weapons
  ['Grenade', 'range', 'range.weapon.bomb.01.black', 'scifi/explosionCrunch_000.ogg'],
  ['Dynamite', 'range', 'range.weapon.bomb.01.black', 'scifi/explosionCrunch_001.ogg'],
  ['Launcher', 'range', 'range.weapon.missile.01.blue', 'scifi/lowFrequency_explosion_000.ogg'],
  ['Missile', 'range', 'range.weapon.missile.02.white', 'scifi/lowFrequency_explosion_001.ogg'],
  ['Rocket', 'range', 'range.weapon.missile.03.white', 'scifi/lowFrequency_explosion_000.ogg'],
  ['Artillery', 'range', 'range.weapon.cannonball.01.black', 'scifi/explosionCrunch_002.ogg'],
  // Blades
  ['Blade', 'melee', 'melee.weapon.sword.01.white', 'rpg/drawKnife1.ogg'],
  ['Saber', 'melee', 'melee.weapon.lasersword.01.blue', 'scifi/forceField_000.ogg'],
  ['Laser Sword', 'melee', 'melee.weapon.lasersword.02.blue', 'scifi/forceField_001.ogg'],
  ['Energized', 'melee', 'melee.weapon.lasersword.01.blue', 'scifi/forceField_002.ogg'],
  ['Axe', 'melee', 'melee.weapon.greataxe.01.white', 'rpg/chop.ogg'],
  ['Glaive', 'melee', 'melee.weapon.glaive.01.white', 'rpg/drawKnife2.ogg'],
  ['Lance', 'melee', 'melee.weapon.spear.01.white', 'rpg/drawKnife3.ogg'],
  ['Spike', 'melee', 'melee.weapon.spear.01.white', 'rpg/drawKnife3.ogg'],
  ['Claymore', 'melee', 'melee.weapon.greatsword.01.white', 'rpg/drawKnife1.ogg'],
  ['Cutter', 'melee', 'melee.generic.slashing.01.orange', 'rpg/knifeSlice.ogg'],
  ['Melee Weapon', 'melee', 'melee.generic.slashing.02.orange', 'rpg/drawKnife2.ogg'],
  ['Claw', 'melee', 'melee.creature.claw.01.red', 'impact/impactSoft_heavy_000.ogg'],
  ['Bite', 'melee', 'melee.creature.bite.01.red', 'impact/impactSoft_heavy_001.ogg'],
  // Blunt
  ['Bludgeon', 'melee', 'melee.weapon.club.01.white', 'impact/impactPunch_heavy_000.ogg'],
  ['Hammer', 'melee', 'melee.weapon.warhammer.01.white', 'impact/impactMetal_heavy_000.ogg'],
  ['Staff', 'melee', 'melee.weapon.greatclub.01.white', 'impact/impactWood_heavy_000.ogg'],
  ['Tool', 'melee', 'melee.weapon.wrench.01.white', 'impact/impactMetal_light_000.ogg'],
  ['Drill', 'melee', 'melee.weapon.wrench.01.white', 'impact/impactMetal_light_001.ogg'],
  ['Kick', 'melee', 'melee.weapon.unarmedstrike.physical.blue', 'impact/impactPunch_medium_002.ogg'],
  ['Unarmed', 'melee', 'melee.weapon.unarmedstrike.physical.blue', 'impact/impactPunch_medium_000.ogg'],
  ['Martial Arts', 'melee', 'melee.weapon.unarmedstrike.physical.blue', 'impact/impactPunch_medium_001.ogg'],
  ['Gauntlet', 'melee', 'melee.weapon.unarmedstrike.magical.blue', 'impact/impactPunch_heavy_001.ogg'],
  ['Ram', 'melee', 'melee.weapon.unarmedstrike.physical.blue', 'impact/impactPunch_heavy_002.ogg'],
];

/** Where this module's sounds live, as Foundry serves them. */
const SOUNDS = 'modules/essence20-fx/sounds/';

/**
 * The entries as an Automated Animations menu (what its AutorecManager.mergeMenus takes).
 * @param {Number} version   Its Autorec menu version (game.settings.get('autoanimations', 'aaAutorec').version)
 * @param {Object} [options]
 * @param {Boolean} [options.sounds]   Give entries this module's sounds (default true)
 * @param {Function} [options.newId]   Makes an id per entry (its own merge replaces it anyway)
 * @returns {{melee: Array, range: Array, version: Number}}
 */
export function buildAutorecMenu(version, { sounds = true, newId = () => '' } = {}) {
  const menu = { melee: [], range: [], version };
  for (const [label, kind, video, sound, excluded] of ENTRIES) {
    const entry = structuredClone(TEMPLATES[kind]);
    const [dbSection, menuType, animation, variant, color] = video.split('.');
    entry.id = newId();
    entry.label = label;
    entry.menu = kind;
    entry.metaData = { name: 'Essence20 FX', moduleVersion: 1 };
    entry.primary.video = { ...entry.primary.video, dbSection, menuType, animation, variant, color };
    if (excluded?.length) {
      entry.advanced = { exactMatch: false, excludedTerms: excluded };
    }

    if (sounds && sound) {
      entry.primary.sound = { ...entry.primary.sound, enable: true, file: `${SOUNDS}${sound}`, volume: 0.6 };
    }

    menu[kind].push(entry);
  }

  return menu;
}
