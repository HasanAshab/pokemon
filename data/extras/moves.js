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
    megaevolve: {
      num: 100002,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Mega Evolve",
      pp: 1,
      priority: 2,
      secondary: null,
      target: "normal",
      type: "Normal",
      retreat: 6,
      flags: {},
      onTryMove(attacker) {
        if (!attacker.megaEvolve())
          return null
        //const megaMoves = attacker.meta.mega.moves
        //megaMoves && attacker.state.setMoves(megaMoves)
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
            return canDodge(defender, attacker, move)
        })
        move.hit.damages = move.hit.damages.filter((_, i) => !this._dodgeMatrix[i])
      },
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
      num: 100004,
      accuracy: true,
      basePower: 0,
      category: "Normal",
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
    sword: {
      num: 100000,
      accuracy: 100,
      basePower: 40,
      category: "Physical",
      name: "Sword",
      pp: 35,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, weapon: 1 },
      koChance: 1,
      secondary: null,
      target: "normal",
      type: "Normal",
      contestType: "Tough",
      tokenChanges: {
        spe: -2
      }
    },
}