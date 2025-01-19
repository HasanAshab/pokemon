import { calculateDTManCount } from "../../../assets/js/utils/helpers.js"

export default {
    staythere: {
      num: 100001,
      accuracy: true,
      basePower: 0,
      category: "None",
      name: "Stay There",
      pp: null,
      priority: 0,
      flags: {},
      secondary: null,
      target: "normal",
      type: "Normal",
      isOffensive: false,
      retreat: 0,
    },
    dodge: {
      num: 100002,
      accuracy: true,
      basePower: 0,
      category: "None",
      name: "Dodge",
      pp: null,
      priority: 0,
      flags: {},
      secondary: null,
      target: "normal",
      type: "Normal",
      isOffensive: false,
      retreat: 0.25
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
      onHit(pokemon) {
        pokemon.state.manCount = calculateDTManCount(pokemon)
      }
    },
}