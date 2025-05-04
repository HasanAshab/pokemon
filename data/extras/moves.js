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
    swordsmash: {
      num: 100004,
      accuracy: 100,
      basePower: 70,
      category: "Physical",
      name: "Sword Smash",
      pp: 15,
      priority: 1,
      flags: { contact: 1 },
      secondary: null,
      target: "normal",
      type: "Steel",
      contestType: "Cool",
      critRatio: 2,
      effects: {
        self: [{
          name: "flinch",
          chance: 10,
          isVolatile: true 
        }],
        target: []
      },
    },
    rushout: {
      num: 100005,
      accuracy: 100,
      basePower: 30,
      category: "Physical",
      name: "Rush Out",
      pp: 20,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 },
      secondary: {
        chance: 100,
        self: {
          boosts: {
            spe: 1.5
          }
        }
      },
      target: "allAdjacentFoes",
      type: "Steel",
      contestType: "Cool"
    },
    thunderblade: {
      num: 100006,
      accuracy: 100,
      basePower: 50,
      category: "Physical",
      name: "Thunder Blade",
      pp: 25,
      critRatio: 2,
      priority: 0,
      flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 },
      target: "normal",
      type: "Electric",
      contestType: "Cool"
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
      secondary: null,
      target: "self",
      type: "Normal",
      zMove: { boost: { accuracy: 1 } },
      contestType: "Cool",
      retreat: 2,
    },

}