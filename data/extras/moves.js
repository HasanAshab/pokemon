import { canDodge } from "../../assets/js/utils/helpers.js"

export default {
    staythere: {
      num: 100001,
      accuracy: true,
      basePower: 0,
      category: "None",
      name: "Stay There",
      pp: null,
      priority: 0,
      flags: {offensive: 0},
      secondary: null,
      target: "normal",
      type: "Normal",
      retreat: 0,
    },
    sagemode: {
      num: 100002,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Sage Mode",
      pp: 1,
      priority: 2,
      secondary: null,
      target: "self",
      type: "Normal",
      retreat: 6,
      flags: {},
      onBeforeMove(attacker) {
        attacker.toSageMode()
      }
    },
    sageofsixpaths: {
      num: 100032,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Sage of Six Paths",
      pp: 1,
      priority: 2,
      secondary: null,
      target: "self",
      type: "Normal",
      retreat: 12,
      flags: {},
      onBeforeMove(attacker) {
        attacker.toSageMode(true)
      }
    },
    dodge: {
      num: 100003,
      accuracy: true,
      basePower: 0,
      category: "None",
      name: "Dodge",
      pp: null,
      priority: 0,
      flags: { offensive: 0 },
      secondary: null,
      target: "normal",
      type: "Normal",
      isOffensive: false,
      retreat: 1,
      onBeforeMove(attacker, defender, move) {
        this._dodgeMatrix = Array.from({ length: move.hits }, (_, i) => {
            return attacker.state.flags.autoDodge || canDodge(defender, attacker, move)
        })

        if (attacker.state.flags.autoDodge) {
          attacker.state.flags.autoDodge = 0
        }
        
        move.hit.damages = move.hit.damages.filter((_, i) => !this._dodgeMatrix[i])
      },
    },
    block: {
      num: 100014,
      accuracy: true,
      basePower: 0,
      category: "Physical",
      name: "Block",
      pp: null,
      priority: 0,
      flags: { offensive: 0 },
      secondary: null,
      onBeforeMove(attacker, defender, move) {
        attacker.state.damage.chainAddBlock(0.5)
      },
      target: "normal",
      type: "Normal",
      isOffensive: false,
      retreat: 1,
    },
    doubleteam: {
      num: 104,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Double Team",
      pp: 15,
      priority: 1,
      flags: { snatch: 1, metronome: 1 },
      secondary: null,
      target: "self",
      type: "Normal",
      contestType: "Cool",
      effects: {
        self: [{
          name: "doubleteam",
          chance: 100,
          isVolatile: true 
        }],
        target: []
      },
      retreat: 5,
    },
    shadowclone: {
      num: 1000001,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Shadow Clone",
      pp: 15,
      priority: 1,
      flags: { snatch: 1, metronome: 1 },
      secondary: null,
      target: "self",
      type: "Dark",
      contestType: "Cool",
      effects: {
        self: [{
          name: "shadowclone",
          chance: 100,
          isVolatile: true 
        }],
        target: []
      },
      retreat: 0
    },

    focusenergy: {
      num: 116,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Focus Energy",
      pp: 30,
      priority: 0,
      flags: { snatch: 1, metronome: 1 },
      statChanges: {
        chance: 100,
        self: {
          crit: 2
        },
        target: {}
      },
      secondary: null,
      target: "self",
      type: "Normal",
      zMove: { boost: { accuracy: 1 } },
      contestType: "Cool"
    },
    substitute: {
      num: 164,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Substitute",
      pp: 10,
      priority: 0,
      flags: { snatch: 1, nonsky: 1, metronome: 1 },
      stallingMove: true,
      onBeforeMove(target) {
        target.state.decreaseHealth(target.maxhp / 4, true)
      },
      secondary: null,
      target: "self",
      type: "Normal",
      zMove: { effect: "clearnegativeboost" },
      contestType: "Cute"
    },
    laserfocus: {
      num: 673,
      accuracy: true,
      basePower: 0,
      category: "Status",
      isNonstandard: "Past",
      name: "Laser Focus",
      pp: 30,
      priority: 0,
      onAfterMove(pokemon) {
        const statCh = pokemon.state.stats._statChanges
        const oldCrit = statCh.crit ?? 0
        const turnNo = pokemon.state.battle.turnNo

        statCh.crit = 6
        pokemon.state.on('turn-end', () => {
          if (pokemon.state.battle.turnNo === turnNo + 1) {
            statCh.crit = oldCrit
          }
        })
      },
      flags: { snatch: 1, metronome: 1 },
      secondary: null,
      target: "self",
      type: "Normal",
      zMove: { boost: { atk: 1 } },
      contestType: "Cool",
      retreat: 2
    },
    takeweapon: {
      num: 100015,
      accuracy: true,
      basePower: 0,
      category: "Physical",
      name: "Take Weapon",
      pp: null,
      priority: 0,
      flags: { offensive: 0, contact: 1 },
      secondary: null,
      target: "normal",
      type: "Normal",
      isOffensive: false,
      retreat: 1.5,
      effects: {
        self: [{
          name: "stall",
          chance: 70,
          isVolatile: true 
        }],
        target: []
      },
      onTryMove(attacker, defender, move) {
        if (!move.flags.weapon) return false;
      
        const chance = 0.65 + (attacker.level - defender.level) / (2 * (attacker.level + defender.level));
        const rand = Math.random()

        if (rand > chance) return false
        
        if (move.flags.contact) {
          move = defender.state.removeMove(move.id)
          attacker.state.addMoveForced(move)
        }
        else {
          move = defender.state.moves.find(m => m.id === move.id)
          if (attacker.state.hasMove(move.id)) {
            attacker.state.increasePP(move.id)
          }
          else {
            const newMove = new move.constructor(move.id)
            newMove.pp = 1
            newMove._meta = move._meta
            attacker.state.addMoveForced(newMove)
          }
        }
        
        return true
      },
    },
    chakrablade: {
      num: 100000,
      accuracy: 100,
      multihit:[2,5],
      basePower: 20,
      category: "Physical",
      name: "Chakra Blade",
      pp: 15 * 3,
      priority: 0,
      flags: {
        contact: 1, 
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 1
      },
      critRatio: 1,
      secondary: null,
      target: "normal",
      type: "Rock",
      contestType: "Tough",
      tokenChanges: {
        spe: -3
      }
    },

kunai: {
      num: 100001,
      accuracy: 100,
      basePower: 50,
      category: "Physical",
      name: "Kunai",
      pp: 30 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
      secondary: null,
      target: "normal",
      type: "Rock",
      contestType: "Tough",
      tokenChanges: {
        spe: -6
      }
},

ninjastar: {
      num: 100002,
      accuracy: 100,
      basePower: 15,
      category: "Physical",
      name: "Ninja Star",
      pp: 15 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1},
      secondary: null,
      target: "normal",
      type: "Rock",
      contestType: "Tough",
      tokenChanges: {
        spe: -6
      },
      multihit: [2 ,5],
    },
 
bamboo: {
      num: 100003,
      accuracy: 60,
      basePower: 70,
      category: "Physical",
      name: "Bamboo",
      pp: 25 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1},
      secondary: null,
      target: "normal",
      type: "Normal",
      contestType: "Tough",
      tokenChanges: {
        spe: -30
      }
    },   
ninjablade: {
      num: 100004,
      accuracy: 100,
      basePower: 70,
      category: "Physical",
      name: "Ninja Blade",
      pp: 30 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1},
      secondary: null,
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      tokenChanges: {
        spe: -12
      }
    },
   
kohgastar: {
      num: 100005,
      accuracy: 100,
      basePower: 70,
      category: "Physical",
      name: "Kohga Star",
      pp: 15 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1},
      secondary: null,
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      tokenChanges: {
        spe: -10
      }
    },

sword: {
      num: 100006,
      accuracy: 70,
      basePower: 90,
      category: "Physical",
      name: "sword",
      pp: 25 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon:1 },
      secondary: null,
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      tokenChanges: {
        spe: -30
      },
    },


katana: {
      num: 100007,
      accuracy: 80,
      basePower: 100,
      category: "Physical",
      name: "Katana",
      pp: 25 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 , weapon: 1},
      critRatio: 2,
      secondary: null,
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      tokenChanges: {
        spe: -30
      },
      koRatio:1
    },
Shuriken: {
      num: 100008,
      accuracy: 60,
      basePower: 130,
      category: "Physical",
      name: "Shuriken",
      pp: 2 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1 },
      statChanges:{
        self:{
          atk:-1
        },
        target:{}
      },
      critRatio: 2,
      secondary: null,
      target: "normal",
      type: "Rock",
      contestType: "Tough",
      tokenChanges: {
        spe: -45
      }
    },
 longsword: {
      num: 100009,
      accuracy: 60,
      basePower: 130,
      category: "Physical",
      name: "Katana",
      pp: 15 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 , weapon: 1},
      critRatio: 2,
      secondary: null,
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      statChanges:{
        self:{
          atk:-1
        },
        target:{}
      },
      tokenChanges: {
        spe: -50
      }
    },
 ninechaku:{
      num: 100010,
      accuracy: 100,
      multihit:[2,5],
      basePower: 20,
      category: "Physical",
      name: "Nine Chaku",
      pp: 15 * 3,
      priority: 1,
      flags: {
        contact: 1, 
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 1
      },
      secondary: null,
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      tokenChanges: {
        spe: -6
      }
    },
  ninechakublade:{
      num: 100011,
      accuracy: 100,
      multihit:[2,5],
      basePower: 35,
      category: "Physical",
      name: "Nine Chaku(Blade)",
      pp: 15 * 3,
      priority: 0,
      flags: {
        contact: 1, 
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 1
      },
      secondary: null,
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      recoil: [10, 100],
      tokenChanges: {
        spe: -6
      }
    },
  dirt: {
      num: 100012,
      accuracy: 100,
      basePower: 20,
      category: "Physical",
      name: "Dirt",
      pp: 15 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1},
      secondary: {
        chance: 80,
        status: "psn"
      },
      target: "normal",
      type: "Poison",
      contestType: "Tough",
      tokenChanges: {
        spe: -3
      }
    },
   ninjaclaw:{
      num: 100013,
      accuracy: 100,
      multihit:2,
      basePower: 45,
      category: "Physical",
      name: "Ninja Claw",
      pp: 20 * 3,
      priority: 0,
      flags: {
        contact: 1, 
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 1
      },
      secondary: {
        chance: 20,
        status: "psn"
      },
      target: "normal",
      type: "Poison",
      contestType: "Tough",
      tokenChanges: {
        spe: -10
      },
      koRatio:1
    },
    punch: {
      num: 100016,
      accuracy: 100,
      basePower: 20,
      category: "Physical",
      name: "Punch",
      pp: 50 * 3,
      priority: 0,
      flags: {
        contact: 1, 
        protect: 1,
        mirror: 1, 
        metronome: 1
      },
      critRatio: 1,
      secondary: null,
      target: "normal",
      type: "Normal",
      contestType: "Tough",
    },
    kick: {
      num: 100016,
      accuracy: 70,
      basePower: 40,
      category: "Physical",
      name: "Kick",
      pp: 50 * 3,
      priority: 0,
      flags: {
        contact: 1, 
        protect: 1,
        mirror: 1, 
        metronome: 1,
      },
      critRatio: 1,
      secondary: null,
      target: "normal",
      type: "Normal",
      contestType: "Tough",
    },
  rasengan: {
      num: 100017,
      accuracy: 80,
      basePower: 90,
      category: "Physical",
      name: "Rasengan",
      pp: 15 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, contact: 1 },
      secondary: null,
      target: "normal",
      type: "Flying",
      contestType: "Cool"
    },
  rasenshuriken: {
      num: 100018,
      accuracy: 60,
      basePower: 130,
      category: "Physical",
      name: "Rasen Shuriken",
      pp: 2 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      statChanges:{
        self:{
          atk:-2
        },
        target:{}
      },
      critRatio: 1,
      secondary: null,
      target: "normal",
      type: "Rock",
      type: "Flying",
      contestType: "Cool"
    },
  chiduri: {
      num: 100019,
      accuracy: 60,
      basePower: 50,
      category: "Physical",
      name: "Chiduri",
      pp: 15 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 },
      target: "normal",
      type: "Electric",
      koRatio: 3
    },
   firesoul: {
      num: 100020,
      accuracy: true,
      multihit:[2,10],
      basePower: 20,
      category: "Special",
      name: "Fire Soul",
      pp: 5 * 3,
      priority: 0,
      flags: {
        
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 0
      },
      secondary: null,
      target: "normal",
      type: "Fire",
      contestType: "Tough",
    },
   watersoul: {
      num: 100021,
      accuracy: true,
      multihit:[2,10],
      basePower: 20,
      category: "Special",
      name: "Water Soul",
      pp: 5 * 3,
      priority: 0,
      flags: {
        
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 0
      },
      secondary: null,
      target: "normal",
      type: "Water",
      contestType: "Tough",
    },
   leafsoul: {
      num: 100022,
      accuracy: true,
      multihit:[2,10],
      basePower: 20,
      category: "Special",
      name: "Leaf Soul",
      pp: 5 * 3,
      priority: 0,
      flags: {
        
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 0
      },
      secondary: null,
      target: "normal",
      type: "Grass",
      contestType: "Tough",
    },
   dragonsoul: {
      num: 100023,
      accuracy: true,
      multihit:[2,10],
      basePower: 20,
      category: "Special",
      name: "Dragon Soul",
      pp: 5 * 3,
      priority: 0,
      flags: {
        
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 0
      },
      secondary: null,
      target: "normal",
      type: "Dragon",
      contestType: "Tough",
    },
   phantomsoul: {
      num: 100024,
      accuracy: true,
      multihit:[2,10],
      basePower: 20,
      category: "Special",
      name: "Phantom Soul",
      pp: 5 * 3,
      priority: 0,
      flags: {
        
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 0
      },
      secondary: null,
      target: "normal",
      type: "Ghost",
      contestType: "Tough",
    },
   fairysoul: {
      num: 100025,
      accuracy: true,
      multihit:[2,10],
      basePower: 20,
      category: "Special",
      name: "Fairy Soul",
      pp: 5 * 3,
      priority: 0,
      flags: {
        
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 0
      },
      secondary: null,
      target: "normal",
      type: "Fairy",
      contestType: "Tough",
    },
   shadowsoul: {
      num: 100026,
      accuracy: true,
      multihit:[2,10],
      basePower: 20,
      category: "Special",
      name: "Shadow Soul",
      pp: 5 * 3,
      priority: 0,
      flags: {
        
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 0
      },
      secondary: null,
      target: "normal",
      type: "Dark",
      contestType: "Tough",
    },
    furysmoke: {
      num: 100027,
      accuracy: 100,
      basePower: 20,
      category: "Special",
      name: "Fury Smoke",
      pp: 5 * 3,
      priority: 0,
      flags: {
        protect: 1,
        mirror: 1, 
        metronome: 1 ,
        weapon: 0
      },
      secondary: null,
      statChanges:{
        self:{
        },
        target:{
          accuracy:-1,

        }
      },
       target: "normal",
      type: "Fire",
    },
  "$susanosword": {
    num: 100028,
    accuracy: 100,
    basePower: 120,
    basePowerCallback(pokemon, target, move) {
      const minPower = move.basePower;
      const maxPower = 400;
      const level = pokemon.level;
      
      // Calculate power scaling from minPower (at level 1) to maxPower (at level 100)
      const scaledPower = minPower + (maxPower - minPower) * (level / 100);
      
      // Round to nearest multiple of 5 and enforce minimum
      return Math.max(minPower, Math.round(scaledPower / 5) * 5);
    },
    category: "Special",
    name: "Susano Sword",
    pp: null,
    priority: 0,
    flags: {
      protect: 1,
      mirror: 1,
      metronome: 1,
      contact: 1
    },
    secondary: null,
    target: "normal",
    type: "Normal",
    contestType: "Tough"
  },
  "$voidbomb": {
    num: 100031,
    accuracy: 100,
    basePower: 100,
    basePowerCallback(pokemon, target, move) {
      const minPower = move.basePower;
      const maxPower = 250;
      const level = pokemon.level;

      // Calculate power scaling from minPower (at level 1) to maxPower (at level 100)
      const scaledPower = minPower + (maxPower - minPower) * (level / 100);

      // Round to nearest multiple of 5 and enforce minimum
      return Math.max(minPower, Math.round(scaledPower / 5) * 5);
    },
    category: "Special",
    name: "Void Bomb",
    pp: 7 * 3,
    priority: 0,
    flags: {
      protect: 1,
      mirror: 1,
      metronome: 1,
    },
    critRatio: 2,
    secondary: null,
    target: "normal",
    type: "Normal",
    retreat: 0,
  },
  nakku: {
    num: 100029,
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: "Nakku",
    pp: 2 * 3,
    priority: 1,
    flags: {
      protect: 1,
      mirror: 1,
      metronome: 1,
      contact: 1
    },
    secondary: {
      chance: 100,
      status: "confusion"
    },
    target: "normal",
    type: "Normal",
    contestType: "Tough",
    retreat: 0
  },
  heit: {
    num: 100030,
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: "Heit",
    pp: 2 * 3,
    priority: 1,
    flags: {},
    secondary: {
      chance: 100,
      status: "flinch"
    },
    target: "normal",
    type: "Normal",
    contestType: "Tough",
    retreat: 0
  },
  soulstick: {
    num: 100032,
    accuracy: 100,
    basePower: 40,
    category: "Special",
    name: "Soul Stick",
    pp: null,
    priority: 1,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 },
    secondary: null,
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    retreat: 4.5
  }
}