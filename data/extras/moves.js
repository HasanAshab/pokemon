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
      category: "None",
      name: "Mega Evolve",
      pp: 1,
      priority: 2,
      secondary: null,
      target: "normal",
      type: "Normal",
      retreat: 4,
      flags: {},
      onTryMove(attacker) {
        if (!attacker.megaEvolve())
          return null
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
      retreat: 0.25,
      effects: {
        self: [{
          name: "dodge",
          chance: 100,
          isVolatile: true 
        }],
        target: []
      },
      onTryMove(attacker, defender, move) {
        this._dodgeMatrix = Array.from({ length: move.hits }, (_, i) => {
            return canDodge(attacker, defender, move)
        })
        move.hit.damages = move.hit.damages.filter((_, i) => !this._dodgeMatrix[i])
        if(this._dodgeMatrix.every(d => !d))
            return null
      },
    },
    doubleteam: {
      num: 104,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Double Team",
      pp: 15,
      priority: 0,
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
      retreat: 3,
    },
}