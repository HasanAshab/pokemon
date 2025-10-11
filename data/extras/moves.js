import { canDodge, modObj, sumObj } from "../../assets/js/utils/helpers.js"
import typeChart from "../default/types.js"
import entities from "../default/entities.js"


function FieldAddingMove(type, name) {
  return {
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: name,
    pp: 5 * 3,
    priority: 0,
    flags: {
      protect: 1,
      mirror: 1,
      metronome: 1,
    },
    secondary: null,
    target: "normal",
    type: type,
    contestType: "Cool",
    onHit(pokemon) {
      const lifetimeTurns = ((pokemon.state.moves.find(m => m.name === name)._meta.grade || 0) + 1) * 2       
      battle.addField(type, { turns: lifetimeTurns })
    }
  }
}

function FieldRemovingMove(type, name) {
  return {
    accuracy: 50,
    basePower: 0,
    category: "Status",
    name: name,
    pp: 5 * 3,
    priority: 0,
    flags: {
      protect: 1,
      mirror: 1,
      metronome: 1,
    },
    secondary: null,
    target: "normal",
    type: type,
    contestType: "Cool",
    onHit(pokemon) {
      pokemon.state.battle.removeField(type)
    } 
  }
}

function EntitySageMove(id) {
    function calcRetreat(pokemon) {
      const totalBaseStats = Object.values(pokemon.baseStats).reduce((a, b) => a + b)
      const X1 = 198, Y1 = 5
      const X2 = 700, Y2 = 100
      const result = Y1 * Math.pow(Y2 / Y1, (totalBaseStats - X1) / (X2 - X1))  
      return Math.round(result + 3)
    }
  
    const entity = entities[id]
    return {
        accuracy: true,
        basePower: 0,
        category: "Status",
        name: `${entity.name} Sage`,
        pp: 1,
        priority: 0,
        flags: { summon: 1 },
        target: "self",
        type: entity.types[0],
        retreat: calcRetreat(entity),
        async onAfterMove(pokemon) {
            const entity = await pokemon.state.summon(id)
            
            const STATS_INHERIT_PERCENTAGE = 10
            const SAGE_MAPING = {
              "hp": "spe",
              "spe": "hp",
              "atk": "spa",
              "def": "spd",
              "spa": "atk",
              "spd": "def"
            }
            this._stats = {}
            for (const stat in entity.stats) {
              this._stats[stat] = Math.round(entity.stats[SAGE_MAPING[stat]] * STATS_INHERIT_PERCENTAGE / 100)
            }
            
            pokemon.tokens = sumObj(pokemon.tokens, this._stats)
            pokemon.state.increaseHealth(this._stats.hp)
            
            entity.state.on('fainted', () => {
                pokemon.tokens = sumObj(pokemon.tokens, modObj(this._stats, -1))
                pokemon.state.decreaseHealth(this._stats.hp, true)
            })
        }
    }
}

function makeFieldMoves() {
    const types = Object.keys(typeChart)
    const fieldMoves = {}
    types.forEach(type => {
        fieldMoves[`field:${type}`] = FieldAddingMove(type, `${type} Field`)
        fieldMoves[`field-rm:${type}`] = FieldRemovingMove(type, `Remove ${type} Field`)
    })
    return fieldMoves
}

function makeEntitySageMoves() {
    const moves = {}
    for (const entityId of Object.keys(entities)) {
        const isMega = entityId.endsWith('mega') || 
            entityId.endsWith('megax') || 
            entityId.endsWith('megay')
        if (!isMega) continue
        const id = `sage:${entityId}`
        moves[id] = EntitySageMove(entityId)
    }
    return moves
}


export default {
    ...makeFieldMoves(),
    ...makeEntitySageMoves(),
    staythere: {
      num: 100001,
      accuracy: true,
      basePower: 0,
      category: "None",
      name: "Stay There",
      pp: null,
      priority: 0,
      flags: {offensive: 0, noeffect: 1},
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
      effects: {
        self: [{
          name: "sage",
          chance: 100,
          isVolatile: true 
        }],
        target: []
      },
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
      flags: { offensive: 0, noeffect: 1 },
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
      flags: { offensive: 0, noeffect: 1 },
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
      retreat: 1
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
      retreat: 3.5
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
      multihit: [2,5],
      basePower: 15,
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
      secondary: {
        chance: 4,
        status: "bleed"
      },
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
       secondary: {
        chance: 10,
        status: "bleed"
      },
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
      secondary: {
        chance: 4,
        status: "bleed"
      },
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
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, shield: 1 },
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
      secondary: {
        chance: 10,
        status: "bleed"
      },
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
      secondary: {
        chance: 8,
        status: "bleed"
      },
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
      secondary: {
        chance: 10,
        status: "bleed"
      },
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      tokenChanges: {
        spe: -20
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
      secondary: {
        chance: 10,
        status: "bleed"
      },
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      tokenChanges: {
        spe: -25
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
        chance: 100,
        self: { atk:-1 },
        target: {}
      },
      critRatio: 2,
      secondary: {
        chance: 10,
        status: "bleed"
      },
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
      basePower: 140,
      category: "Physical",
      name: "Long Sword",
      pp: 15 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 , weapon: 1},
      critRatio: 2,
      secondary: {
        chance: 30,
        status: "bleed"
      },
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      statChanges:{
        chance: 100,
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
      multihit:[1,4],
      basePower: 0,
      basePowerCallback(pokemon, target) {
        let ratio = Math.floor(pokemon.getStat("spe") / target.getStat("spe"))
        if (!isFinite(ratio)) ratio = 0
        const bp = [10, 20, 30, 40, 50][Math.min(ratio, 4)]
        this.debug("BP: " + bp)
        return bp
      },
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
        spe: -8
      }
    },
  ninechakublade:{
      num: 100011,
      accuracy: 100,
      multihit:[1,4],
      basePower: 0,
      basePowerCallback(pokemon, target) {
        let ratio = Math.floor(pokemon.getStat("spe") / target.getStat("spe"))
        if (!isFinite(ratio)) ratio = 0
        const bp = [17, 27, 37, 47, 57][Math.min(ratio, 4)]
        this.debug("BP: " + bp)
        return bp
      },
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
      secondary: {
        chance: 10,
        status: "bleed"
      },
      target: "normal",
      type: "Steel",
      contestType: "Tough",
      recoil: [2, 100],
      tokenChanges: {
        spe: -10
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
        chance: 15,
        status: "bleed"
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
      accuracy: 100,
      basePower: 50,
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
      accuracy: 70,
      basePower: 130,
      category: "Physical",
      name: "Rasen Shuriken",
      pp: 3 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      statChanges:{
        chance: 100,
        self: {
          atk:-2
        },
        target:{}
      },
      secondary: null,
      target: "normal",
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
        chance: 100,
        self:{},
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
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    secondary: null,
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    retreat: 4.5
  },
  jungletrap: {
      num: 100033,
      accuracy: 65,
      basePower: 30,
      category: "Physical",
      name: "Jungle Trap",
      pp: 8 * 3,
      priority: 0,
      flags: { contact: 0, protect: 1, mirror: 1, metronome: 1 },
      volatileStatus: "partiallytrapped",
      secondary: null,
      target: "allAdjacentFoes",
      type: "Grass",
      contestType: "Tough"
    },
  chakraabsorb: {
      num: 100035,
      accuracy: 50,
      basePower: 1,
      category: "Special",
      name: "Chakra Absorb",
      pp: 6 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 },
      onBeforeMove(user, opponent, move) {
        const chakraAmmount = (user.state.stats.get('spa') / opponent.state.stats.get('spd')) * opponent.meta.retreat * 0.2
        opponent.state.retreat -= chakraAmmount
        user.state.retreat += chakraAmmount
      },
      statChanges: {
        chance: 100,
        self: {},
        target: { spd: -1 }
      },
      type: "Normal",
      target: "normal",
      retreat: 3
    },
    kunaishurikin: {
      num: 100034,
      accuracy: true,
      basePower: 70,
      category: "Physical",
      name: "Kunai Shurikin",
      pp: 3 * 3,
      priority: 0,
      flags: { contact: 0,  protect: 1, weapon: 1},
      secondary: {
        chance: 10,
        status: "bleed"
      },
      target: "normal",
      type: "Normal",
    },
    moltressrage: {
      num: 100035,
      accuracy: 100,
      basePower: 30,
      multihit:[2,5],
      category: "Special",
      name: "Moltress Rage",
      pp: 15,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      secondary: {
        chance: 10,
        status: "brn"
      },
      target: "normal",
      type: "Fire",
      contestType: "Beautiful"
    },
    waterdragon: {
      num: 100036,
      accuracy: 100,
      basePower: 100,
      category: "Special",
      name: "Water Dragon",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
       secondary: {
      chance: 50,
      status: "flinch"
    },
      target: "normal",
      type: "Water",
      contestType: "Beautiful"
    },
    electrodragon: {
      num: 100037,
      accuracy: 100,
      basePower: 100,
      category: "Special",
      name: "Electro Dragon",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      secondary: {
      chance: 50,
      status: "flinch"
    },
      target: "normal",
      type: "Electric",
      contestType: "Beautiful"
    },

    bluesharks: {
      num: 100038,
      accuracy: 100,
      basePower: 20,
         multihit:4,
      category: "Special",
      name: "Blue Sharks",
      pp: 6 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      critRatio: 2,
      target: "normal",
      type: "Water",
      contestType: "Beautiful"
    },
    dracometeor: {
      num: 434,
      accuracy: 50,
      basePower: 30,
      category: "Special",
      name: "Draco Meteor",
      multihit:[5,10],
      pp: 5,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      self: {
        boosts: {
          spa: -2
        }
      },
      secondary: null,
      target: "normal",
      type: "Dragon",
      contestType: "Beautiful"
    },
    paperbomb: {
      num: 100039,
      accuracy: 50,
      basePower: 1,
      category: "Physical",
      name: "Paper Bomb",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, contact: 1 },
      target: "normal",
      effects: {
        self: [],
        target: [{
          name: "paperbomb",
          chance: 100,
          isVolatile: true
        }]
      },
      type: "Normal",
      contestType: "Tough"
    },
    revengersoul: {
      num: 100040,
      accuracy: 100,
      basePower: 0,
      basePowerCallback(pokemon) {
        const ratio = Math.max(Math.floor((pokemon.hp * 48) / pokemon.maxhp), 1)
        let bp
        if (ratio < 2) {
          bp = 150
        } else if (ratio < 5) {
          bp = 100
        } else if (ratio < 10) {
          bp = 80
        } else if (ratio < 17) {
          bp = 40
        } else if (ratio < 33) {
          bp = 20
        } else {
          bp = 10
        }
        this.debug("BP: " + bp)
        return bp
      },
      multihit:[2,5],
      category: "Special",
      name: "Revenger Soul",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, contact: 1 },
      secondary: {
        chance: 20,
        status: "flinch"
      },
      target: "normal",
      type: "Ghost",
      contestType: "Beautiful"
    },
   magmabomb: {
      num: 100041,
      accuracy: 100,
      basePower: 300,
      category: "Special",
      name: "Magma Bomb",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      secondary: null,
      target: "normal",
      type: "Fire",
      contestType: "Beautiful"
    },
    cactuspunch: {
      num: 100042,
      accuracy: 100,
      basePower: 70,
      category: "Physical",
      name: "Cactus Punch",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, contact: 1 },
      secondary: {
        chance: 50,
        status: "flinch"
      },
      target: "normal",
      type: "Grass",
      contestType: "Tough"
    },
  cyclekick: {
      num: 100043,
      accuracy: 100,
      basePower: 30,
      category: "Physical",
      name: "Cycle Kick",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, contact: 1 },
      secondary: null,
      target: "foeSide",
      type: "Fighting",
      contestType: "Tough"
    },
    seismicwave: {
      num: 100044,
      accuracy: 100,
      basePower: 100,
      category: "Physical",
      name: "Seismic Wave",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      secondary: null,
      target: "allAdjacent",
      type: "Fighting",
      contestType: "Tough"
    },

  "$paperbomb:explode": {
    num: 100045,
    accuracy: true,
    basePower: 100,
    category: "Physical",
    name: "Paper Bomb (Explode)",
    pp: null,
    priority: 0,
    flags: {
      protect: 1,
      mirror: 1,
      metronome: 1,
      contact: 1
    },
    critRatio: 2,
    target: "normal",
    type: "Normal",
    retreat: 0,
  },
    snakegang: {
      num: 100046,
      accuracy: 100,
      basePower: 20,
      multihit: [2, 5],
      category: "Physical",
      name: "Snake Gang",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      secondary: {
        chance: 10,
        status: "psn"
      },
      target: "normal",
      type: "Poison",
      contestType: "Tough" 
    },
    snakegangbang: {
      num: 100047,
      accuracy: 100,
      basePower: 20,
      multihit: [5, 15],
      category: "Physical",
      name: "Snake Gang Bang",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1 },
      secondary: {
        chance: 10,
        status: "psn"
      },
      target: "normal",
      type: "Poison",
      contestType: "Tough" 
    },
    auragloves: {
      num: 100048,
      accuracy: 100,
      basePower: 10,
      category: "Physical",
      name: "Aura Gloves",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, combo:1,contact:1 },
      target: "normal",
      type: "Fighting",
      contestType: "Tough" 
     },
     ancientmode:{
      num: 100049,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Ancient Mode",
      pp: 3 * 3,
      priority: 0,
      secondary: null,
      target: "self",
      type: "Dragon",
      retreat: 4,
      flags: {},
      effects: {
        self: [{
          name: "ancientmode",
          chance: 100,
        }],
        target: []
      }
     },
   lightningkunai:{
      num: 100050,
      accuracy: 100,
      basePower: 50,
      category: "Physical",
      name: "Lightning Kunai",
      pp: 10 * 3,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
     secondary: {
        chance: 100,
        status: "par"
      },
      recoil: [5,100],
      target: "normal",
      type: "Electric",
      contestType: "Tough",
      tokenChanges: {
        spe: -6
      },
   },
      lightningninjastar: {
      num: 100051,
      accuracy: 100,
      basePower: 15,
      category: "Physical",
      name: "Lightning Ninja Star",
      pp: 5 * 3,
      priority: 0,
      flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1},
     secondary: {
        chance: 3,
        status: "par"
      },
      target: "normal",
      type: "Electric",
      contestType: "Tough",
      tokenChanges: {
        spe: -6
      },
      recoil: [5,100],
      multihit: [2 ,5],
    },

    suicideblast: {
       num: 100052,
      accuracy: 100,
      basePower: 100,
      category: "Physical",
      name: "Suicide Blast",
      pp: 5,
      priority: 1,
      flags: { protect: 1, mirror: 1, metronome: 1, noparentalbond: 1 ,contact: 1},
      selfdestruct: "always",
      secondary: null,
      target: "normal",
      type: "Normal",
      contestType: "Beautiful"
    },

    naturehealing: {
      num: 100053,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Nature Healing",
      pp: 1 * 3,
      priority: 0,
      secondary: null,
      target: "self",
      type: "Grass",
      flags: {},
      effects: {
        self: [{
          name: "naturehealing",
          chance: 100,
        }],
        target: []
      }
    },
    
    healingpalm: {
      num: 100054,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Healing Palm",
      pp: 20 * 3,
      priority: 0,
      target: "normal",
      type: "Fairy",
      flags: {contact: 1},
      healTarget: [1, 7],
      retreat:1
    },
    healingcircle: {
      capacity: 3,
      num: 100055,
      accuracy: 85,
      basePower: 0,
      category: "Status",
      name: "Healing Circle",
      pp: 5 * 3,
      priority: 0,
      target: "allySide",
      type: "Fairy",
      flags: {},
      heal: [1, 10],
    },
    leaftrap: {
      num: 100056,
      accuracy: 65,
      basePower: 10,
      category: "Physical",
      name: "Leaf Trap",
      pp: 14 * 3,
      priority: 0,
      flags: { contact: 0, protect: 1, mirror: 1, metronome: 1 },
      volatileStatus: "partiallytrapped",
      secondary: null,
      target: "normal",
      type: "Grass",
      contestType: "Tough"
    },
    helpinghand: {
      num: 270,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Helping Hand",
      pp: 20,
      priority: 5,
      flags: { bypasssub: 1, noassist: 1, failcopycat: 1 },
      volatileStatus: "helpinghand",
      target: "normal",
      type: "Normal",
      onHit(pokemon, opponent) {
        const per = 0.15
        const stats = {
          atk: pokemon.stats.atk * per,
          spa: pokemon.stats.spa * per,
        }
        opponent.tokens = sumObj(opponent.tokens, stats)
        
        opponent.state.once('used-move', () => {
          opponent.tokens = sumObj(opponent.tokens, modObj(stats, -1))
        })
      }
    },
      freeze: {
      num: 100057,
      accuracy: 100,
      basePower: 0,
      category: "Status",
      name: "Freeze",
      pp: 15,
      priority: 0,
      flags: { snatch: 1, metronome: 1 },
      secondary: {
        chance: 100,
        status: "frz"
      },

      target: "normal",
      type: "Ice",
      contestType: "Cool",
      
    },
    
}

