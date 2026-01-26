import { canDodge, capitalizeFirstLetter, deepClone, modObj, sumObj } from "../../assets/js/utils/helpers.js"
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


function makeMultiMaterialWeaponMoves(id, baseWeaponMove) {
  const materialsData = [
    {
      name: "rock",
      type: "Rock",
      powerMod: 1,
      effectChanceMod: 1,
      tokenChangeMod: 1,
    },
    {
      name: "copper",
      type: "Rock",
      powerMod: 1.15,
      effectChanceMod: 1.1,
      tokenChangeMod: 1.1,
    },
    {
      name: "tin",
      type: "Steel",
      powerMod: 1.15,
      effectChanceMod: 1.1,
      tokenChangeMod: 1.1,
    },
    {
      name: "bronze",
      type: "Steel",
      powerMod: 1.3,
      effectChanceMod: 1.2,
      tokenChangeMod: 1.2,
    },
    {
      name: "iron",
      type: "Steel",
      powerMod: 1.3,
      effectChanceMod: 1.2,
      tokenChangeMod: 1.2,
    },
    {
      name: "steel",
      type: "Steel",
      powerMod: 1.3,
      effectChanceMod: 1.2,
      tokenChangeMod: 1.2,
    },
    {
      name: "steel:refined",
      type: "Steel",
      powerMod: 1.3,
      effectChanceMod: 1.2,
      tokenChangeMod: 1.2,
    },
    {
      name: "steel:crucible",
      type: "Steel",
      powerMod: 1.3,
      effectChanceMod: 1.2,
      tokenChangeMod: 1.2,
    },
  ]

  const moves = {}
  for (const data of materialsData) {
    const move = deepClone(baseWeaponMove)
    move.name = `${capitalizeFirstLetter(id)} (${capitalizeFirstLetter(data.name)})`
    move.type = data.type
    move.basePower = Math.round(data.powerMod * baseWeaponMove.basePower)
    
    move.effects.self.forEach(effect => {
      effect.chance = Math.round(data.effectChanceMod * effect.chance)
    })
    move.effects.target.forEach(effect => {
      effect.chance = Math.round(data.effectChanceMod * effect.chance)
    })

    for (const stat in move.tokenChanges) {
      move.tokenChanges[stat] = Math.round(data.tokenChangeMod * move.tokenChanges[stat])
    }


    moves[`${id}:${data.name}`] = move
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
    flags: { offensive: 0, noeffect: 1 },
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
    retreatBonus: 4,
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
    retreatBonus: 11,
    flags: {},
    onBeforeMove(attacker) {
      attacker.toSageMode(true)
    }
  },
  megaevolve: {
    num: 9999999,
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: "Mega Evolve",
    pp: 1,
    priority: 2,
    secondary: null,
    target: "self",
    type: "Normal",
    retreat: 6,
    flags: {},
    onBeforeMove(attacker) {
      attacker.megaEvolve()
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
    retreatBonus: 3,
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
    stallingChance: 80,
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
          return pokemon.state.removeListener('turn-end', "expire-laserfocus")
        }
      }, "expire-laserfocus")
    },
    flags: { snatch: 1, metronome: 1 },
    secondary: null,
    target: "self",
    type: "Normal",
    zMove: { boost: { atk: 1 } },
    contestType: "Cool",
    retreatBonus: 2
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
    retreatBonus: 0.5,
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
    multihit: [2, 5],
    basePower: 12,
    category: "Physical",
    name: "Chakra Blade",
    pp: 15 * 3,
    priority: 0,
    flags: {
      contact: 1,
      protect: 1,
      mirror: 1,
      metronome: 1,
      weapon: 1
    },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 1,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Rock",
    contestType: "Tough",
    tokenChanges: {
      spe: -6
    }
  },

  ...makeMultiMaterialWeaponMoves('kunai', {
    num: 100001,
    accuracy: 100,
    basePower: 40,
    category: "Physical",
    pp: 30 * 3,
    priority: 0,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 2,
        isVolatile: true
      }]
    },
    target: "normal",
    tokenChanges: {
      spe: -6
    }
  }),

  ninjastar: {
    num: 100002,
    accuracy: 100,
    basePower: 12,
    category: "Physical",
    name: "Ninja Star",
    pp: 15 * 3,
    priority: 0,
    flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 1,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Rock",
    contestType: "Tough",
    tokenChanges: {
      spe: -6
    },
    multihit: [2, 5],
  },

  bamboo: {
    num: 100003,
    accuracy: 70,
    basePower: 60,
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
      spe: -10
    }
  },
  ninjablade: {
    num: 100004,
    accuracy: 90,
    basePower: 50,
    category: "Physical",
    name: "Ninja Blade",
    pp: 15 * 3,
    priority: 0,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 3,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    tokenChanges: {
      spe: -8
    },
  },

  kohgastar: {
    num: 100005,
    accuracy: 85,
    basePower: 14,
    category: "Physical",
    name: "Kohga Star",
    pp: 15 * 3,
    priority: 0,
    flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 2,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    tokenChanges: {
      spe: -8
    },
    multihit: [2, 5],
  },

  sword: {
    num: 100006,
    accuracy: 80,
    basePower: 70,
    category: "Physical",
    name: "Sword",
    pp: 25 * 3,
    priority: 0,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 5,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    tokenChanges: {
      spe: -14
    },
  },


  katana: {
    num: 100007,
    accuracy: 95,
    basePower: 110,
    category: "Physical",
    name: "Katana",
    pp: 25 * 3,
    priority: 0,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    critRatio: 2,
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 30,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    tokenChanges: {
      spe: -25
    }
  },

  shuriken: {
    num: 100008,
    accuracy: 70,
    basePower: 100,
    category: "Physical",
    name: "Shuriken",
    pp: 2 * 3,
    isOneTime: true,
    priority: 0,
    flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    statChanges: {
      chance: 100,
      self: { atk: -0.5 },
      target: {}
    },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 15,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Rock",
    contestType: "Tough",
    tokenChanges: {
      spe: -25
    }

  },

  longsword: {
    num: 100009,
    accuracy: 70,
    basePower: 100,
    category: "Physical",
    name: "Long Sword",
    pp: 15 * 3,
    priority: 0,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 13,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    statChanges: {
      chance: 100,
      self: {
        atk: -0.5
      },
      target: {}
    },
    tokenChanges: {
      spe: -25
    }
  },

  ninechaku: {
    num: 100010,
    accuracy: 100,
    multihit: [2, 5],
    basePower: 18,
    category: "Physical",
    name: "Nine Chaku",
    pp: 15 * 3,
    priority: 0,
    flags: {
      contact: 1,
      protect: 1,
      mirror: 1,
      metronome: 1,
      weapon: 1
    },
    secondary: null,
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    tokenChanges: {
      spe: -10
    }
  },
  ninechakublade: {
    num: 100011,
    accuracy: 100,
    multihit: [2, 5],
    basePower: 25,
    category: "Physical",
    name: "Nine Chaku (Blade)",
    pp: 15 * 3,
    priority: 0,
    flags: {
      contact: 1,
      protect: 1,
      mirror: 1,
      metronome: 1,
      weapon: 1
    },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 10,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    recoil: [2, 100],
    tokenChanges: {
      spe: -10
    }
  },
  dart: {
    num: 100012,
    accuracy: 100,
    basePower: 20,
    category: "Physical",
    name: "Dart",
    pp: 15 * 3,
    priority: 0,
    flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    secondary: {
      chance: 80,
      status: "psn"
    },
    target: "normal",
    type: "Poison",
    contestType: "Tough",
    tokenChanges: {
      spe: -1
    }
  },
  ninjaclawsmall: {
    num: 100013,
    accuracy: 100,
    basePower: 30,
    category: "Physical",
    name: "Ninja Claw (Small)",
    pp: 15 * 3,
    priority: 0,
    flags: {
      contact: 1,
      protect: 1,
      mirror: 1,
      metronome: 1,
      weapon: 1
    },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 3,
        isVolatile: true
      }]
    },
    target: "foeSide",
    capacity: 2,
    type: "Steel",
    contestType: "Tough",
    tokenChanges: {
      spe: -10
    }
  },
  ninjaclaw: {
    num: 100013,
    accuracy: 100,
    basePower: 45,
    category: "Physical",
    name: "Ninja Claw",
    pp: 15 * 3,
    priority: 0,
    flags: {
      contact: 1,
      protect: 1,
      mirror: 1,
      metronome: 1,
      weapon: 1
    },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 30,
        isVolatile: true
      }]
    },
    target: "foeSide",
    capacity: 2,
    type: "Steel",
    contestType: "Tough",
    tokenChanges: {
      spe: -17
    },
    koRatio: 1
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
    statChanges: {
      chance: 100,
      self: {
        atk: -2
      },
      target: {}
    },
    secondary: null,
    target: "normal",
    type: "Flying",
    contestType: "Cool"
  },
  chiduri: {
    num: 100019,
    accuracy: 70,
    basePower: 50,
    category: "Physical",
    name: "Chiduri",
    pp: 15 * 3,
    priority: 0,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 },
    target: "normal",
    type: "Electric",
    koRatio: 0.7
  },
  firesoul: {
    num: 100020,
    accuracy: true,
    multihit: [2, 10],
    basePower: 20,
    category: "Special",
    name: "Fire Soul",
    pp: 5 * 3,
    priority: 0,
    flags: {

      protect: 1,
      mirror: 1,
      metronome: 1,
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
    multihit: [2, 10],
    basePower: 20,
    category: "Special",
    name: "Water Soul",
    pp: 5 * 3,
    priority: 0,
    flags: {

      protect: 1,
      mirror: 1,
      metronome: 1,
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
    multihit: [2, 10],
    basePower: 20,
    category: "Special",
    name: "Leaf Soul",
    pp: 5 * 3,
    priority: 0,
    flags: {

      protect: 1,
      mirror: 1,
      metronome: 1,
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
    multihit: [2, 10],
    basePower: 20,
    category: "Special",
    name: "Dragon Soul",
    pp: 5 * 3,
    priority: 0,
    flags: {

      protect: 1,
      mirror: 1,
      metronome: 1,
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
    multihit: [2, 10],
    basePower: 20,
    category: "Special",
    name: "Phantom Soul",
    pp: 5 * 3,
    priority: 0,
    flags: {

      protect: 1,
      mirror: 1,
      metronome: 1,
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
    multihit: [2, 10],
    basePower: 20,
    category: "Special",
    name: "Fairy Soul",
    pp: 5 * 3,
    priority: 0,
    flags: {

      protect: 1,
      mirror: 1,
      metronome: 1,
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
    multihit: [2, 10],
    basePower: 20,
    category: "Special",
    name: "Shadow Soul",
    pp: 5 * 3,
    priority: 0,
    flags: {
      protect: 1,
      mirror: 1,
      metronome: 1,
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
      metronome: 1,
      weapon: 0
    },
    secondary: null,
    statChanges: {
      chance: 100,
      self: {},
      target: {
        accuracy: -1,
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
      contact: 1,
      shield: 1,
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
    retreatBonus: 2
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
    pp: 12 * 3,
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
    retreat: 1
  },
  kunaishurikin: {
    num: 100034,
    accuracy: true,
    basePower: 70,
    category: "Physical",
    name: "Kunai Shurikin",
    pp: 3 * 3,
    priority: 0,
    flags: { contact: 0, protect: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 10,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Normal",
  },
  moltressrage: {
    num: 100035,
    accuracy: 100,
    basePower: 30,
    multihit: [2, 5],
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
    multihit: 4,
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
    multihit: [5, 10],
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
    multihit: [2, 5],
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
    basePower: 85,
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
    flags: { protect: 1, mirror: 1, metronome: 1, combo: 1, contact: 1 },
    target: "normal",
    type: "Fighting",
    contestType: "Tough"
  },
  ancientmode: {
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
    retreatBonus: 3,
    flags: {},
    effects: {
      self: [{
        name: "ancientmode",
        chance: 100,
      }],
      target: []
    }
  },
  lightningkunai: {
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
    recoil: [5, 100],
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
    flags: { protect: 1, mirror: 1, metronome: 1, weapon: 1 },
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
    recoil: [5, 100],
    multihit: [2, 5],
  },

  suicideblast: {
    num: 100052,
    accuracy: 100,
    basePower: 100,
    category: "Physical",
    name: "Suicide Blast",
    pp: 5,
    priority: 1,
    flags: { protect: 1, mirror: 1, metronome: 1, noparentalbond: 1, contact: 1 },
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
    flags: { contact: 1 },
    healTarget: [1, 7],
    retreatBonus: 0.5
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
        atk: pokemon.state.stats.get("atk") * per,
        spa: pokemon.state.stats.get("spa") * per,
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
  fireball: {
    num: 100057,
    accuracy: 70,
    basePower: 60,
    category: "Special",
    name: "Fireball",
    pp: 5 * 3,
    priority: 0,
    flags: {
      protect: 1,
      mirror: 1,
      metronome: 1,
      weapon: 0
    },
    secondary: null,
    target: "normal",
    type: "Fire",
  },
  tailwind: {
    num: 366,
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: "Tailwind",
    pp: 15,
    priority: 0,
    flags: { snatch: 1, metronome: 1, wind: 1 },
    target: "allySide",
    type: "Flying",
    retreat: 3,
    onHit(pokemon, opponent) {
      const expiry = pokemon.state.battle.turnNo + 2

      opponent.state.on('scene-end', () => {
        if (pokemon.state.battle.turnNo === expiry) {
          delete pokemon.state._data.tailwind
          return opponent.state.removeListener('scene-end', "expire-tailwind")
        }

        if (!pokemon.state._data.tailwind?.selfSpeedBoosted) {
          pokemon.state.stats.chainModify("spe", 2)
          pokemon.state._data.tailwind = { selfSpeedBoosted: true }
          opponent.state.once("turn-end", () => {
            pokemon.state._data.tailwind.selfSpeedBoosted = false
          })
        }

        opponent.state.stats.chainModify("spe", 2)
      }, "expire-tailwind")
    },
    canUse(pokemon) {
      return !pokemon.state._data.tailwind
    }
  },
  watershuriken: {
    num: 594,
    accuracy: 100,
    basePower: 15,
    category: "Special",
    name: "Water Shuriken",
    pp: 20,
    priority: 0,
    flags: { protect: 1, mirror: 1, metronome: 1 },
    multihit: [2, 5],
    secondary: null,
    target: "normal",
    type: "Water",
    contestType: "Cool"
  },
  bondshuriken: {
    num: 100059,
    accuracy: 100,
    basePower: 70,
    category: "Special",
    name: "Bond Shuriken",
    pp: null,
    priority: 0,
    flags: { protect: 1, mirror: 1, metronome: 1 },
    secondary: null,
    target: "normal",
    type: "Water",
    contestType: "Cool"
  },
  openinnergate: {
    num: 100058,
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: "Open Inner Gate",
    pp: 1,
    priority: 0,
    flags: {},
    effects: {
      self: [{
        name: "innergate",
        chance: 100,
        isVolatile: true
      }],
      target: []
    },
    target: "self",
    type: "Fighting",
  },
  dualblade: {
    num: 100060,
    accuracy: 100,
    basePower: 40,
    multihit: [2],
    category: "Physical",
    name: "Dual Blade",
    pp: 15 * 3,
    priority: 0,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 5,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    tokenChanges: {
      spe: -15
    }
  },
  dualbladefoeSide: {
    num: 100061,
    accuracy: 100,
    basePower: 40,
    category: "Physical",
    name: "Dual Blade (Foe Side)",
    pp: 15 * 3,
    priority: 0,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 5,
        isVolatile: true
      }]
    },
    capacity: 2,
    target: "foeSide",
    type: "Steel",
    contestType: "Tough",
  
  },
  neddle:{
    num: 100062,
    accuracy: 100,
    basePower: 1,
    category: "Physical",
    name: "Neddle",
    pp: 10 * 3,
    priority: 0,
    flags: { snatch: 1, metronome: 1, weapon: 1 },
    effects: {
      self: [],
      target: [{
        name: "bleed",
        chance: 85,
        isVolatile: true
      }]
    },
    target: "normal",
    type: "Steel",
    contestType: "Cool",
    tokenChanges: {
      spe: -1
    }
  },
  heavystaff:{
    num: 100063,
    accuracy: 100,
    basePower: 70,
    category: "Physical",
    name: "Heavy Staff",
    pp: 10 * 3,
    priority: 0,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, shield: 1 },
    target: "normal",
    type: "Steel",
    contestType: "Cool",
    tokenChanges: {
      spe: -15
    },
    retreatBonus: 1,
    onTryMove(pokemon, target) {
      const expiresAt = pokemon.state.battle.turnNo + 1
      const listenerName = `pokemon::${pokemon.name}::move::heavystaff::retreat-absorb`
      target.state.on("contacted", () => {
        const moveId = target.state._data.movesHistory[0]
        const move = target.state.moves.find(m => m.id === moveId)        
        
        target.state.retreat -= Math.round(move.retreat * .5)
        const weaponDropChance = move.flags.weapon ? 15 : 0

        if (Math.random() * 100 < weaponDropChance) {
          target.state.removeMove(moveId)
        }

        if (pokemon.state.battle.turnNo >= expiresAt) {
          target.state.removeListener("contacted", listenerName)
        }
      }, listenerName)
      return true
    }
  },
  ropedart: {
    num: 100064,
    accuracy: 70,
    basePower: 5,
    category: "Physical",
    name: "Rope Dart",
    pp: 15 * 3,
    priority: 1,
    flags: {
      contact: 1,
      protect: 1,
      mirror: 1,
      metronome: 1,
      weapon: 1
    },
    target: "normal",
    type: "Steel",
    contestType: "Tough",
    tokenChanges: {
      spe: -1
    }
  },
  grab: {
    num: 100065,
    accuracy: true,
    basePower: 0,
    category: "Physical",
    name: "Grab",
    pp: null,
    priority: 0,
    flags: { offensive: 0, contact: 1 },
    secondary: null,
    target: "normal",
    type: "Normal",
    isOffensive: false,
    retreatBonus: 0.5,
    effects: {
      self: [{
        name: "stall",
        chance: 70,
        isVolatile: true
      }],
      target: []
    },
    onTryMove(attacker, defender, move) {
      if (!(move.flags.contact || !move.flags.offensive)) return false;

      const chance = 0.65 + (attacker.level - defender.level) / (2 * (attacker.level + defender.level));
      const rand = Math.random()
      if (rand > chance) return false

      defender.state.effects.add(attacker, "grabbed")
      return true
    },
  },

  "$artilleryprojectile": {
    num: 100066,
    accuracy: 80,
    basePower: 5,
    multihit: 10,
    category: "Physical",
    name: "Artillery Projectile",
    pp: null,
    priority: 0,
    flags: { contact: 1 },
    target: "normal",
    type: "Normal",
    contestType: "Tough",
  }
}

