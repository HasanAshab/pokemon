import moves from "./moves.js"

function convertMoveToItem(move) {
  return {
    type: "weapon",
    tokensPercent: {
      atk: move.basePower,
    }
  }
}

function makeWeaponizedItems() {
  return Object.entries(moves)
    .filter(([id, move]) => move.flags.weapon)
    .reduce((acc, [id, move]) => {      
      acc[id] = convertMoveToItem(move)
           
      return acc
    }, {})
}


export default {
  ...makeWeaponizedItems(),
  $blackbeastlayer: {
    type: "armor",
    covers: 100,
    baseStats: {
      def: 30,
      spd: 30
    },
    tokens: {
      spe: -30
    }
  },

  "$charizardz:darklayer1":{
    type: "armor",
    covers: 25,
    baseStats: {
      def: 80,
      spd: 80
    },
    tokens: {}  
  },
  
   "$charizardz:darklayer2":{
      type: "armor",
    covers: 90,
    baseStats: {
      def: 80,
      spd: 80
    },
    tokens: {}  
  },
  latherarmor1: {
    type: "armor",
    covers: 20,
    stats: {
      def: 15
    },
    tokens: {
      spe: -1
    }
  },
  latherarmor2: {
    type: "armor",
    covers: 40,
    stats: {
      def: 15
    },
    tokens: {
      spe: -4
    }
  },

  latherarmor3: {
    type: "armor",
    covers: 80,
    stats: {
      def: 15
    },
    tokens: {
      spe: -8
    }
  },

  chainarmor1: {
    type: "armor",
    covers: 20,
    stats: {
      def: 25
    },
    tokens: {
      spe: -3
    }
  },

  chainarmor2: {
    type: "armor",
    covers: 40,
    stats: {
      def: 25
    },
    tokens: {
      spe: -7
    }
  },

  chainarmor3: {
    type: "armor",
    covers: 80,
    stats: {
      def: 25
    },
    tokens: {
      spe: -12
    }
  },

  bronzearmor1: {
    type: "armor",
    covers: 20,
    stats: {
      def: 35
    },
    tokens: {
      spe: -5
    }
  },

  bronzearmor2: {
    type: "armor",
    covers: 40,
    stats: {
      def: 35
    },
    tokens: {
      spe: -10
    }
  },

  bronzearmor3: {
    type: "armor",
    covers: 80,
    stats: {
      def: 35
    },
    tokens: {
      spe: -15
    }
  },
  
  steelarmor1: {
    type: "armor",
    covers: 20,
    stats: {
      def: 45
    },
    tokens: {
      spe: -7
    }
  },

  steelarmor2: {
    type: "armor",
    covers: 40,
    stats: {
      def: 45
    },
    tokens: {
      spe: -14
    }
  },

  steelarmor3: {
    type: "armor",
    covers: 80,
    stats: {
      def: 45
    },
    tokens: {
      spe: -20
    }
  },

  ironarmor1: {
    type: "armor",
    covers: 20,
    stats: {
      def: 55
    },
    tokens: {
      spe: -9
    }
  },

  ironarmor2: {
    type: "armor",
    covers: 40,
    stats: {
      def: 55
    },
    tokens: {
      spe: -17
    }
  },

  ironarmor3: {
    type: "armor",
    covers: 80,
    stats: {
      def: 55
    },
    tokens: {
      spe: -25
    }
  },
  locket1: {
    type: "armor",
    covers: 50,
    stats: {
      spd: 20
    }
  },

  "gen-nation-bengal": {
    type: "nation_genetics",
    tokensPercent: {
      "atk": 10,
      "spd": 10,
      "spa": -10,
      "def": -10    
    }
  },
  "gen-nation-ember": {
    type: "nation_genetics",
    tokensPercent: {
      "spa": 10,
      "def": 10,
      "atk": -10,
      "spd": -10
    }
  },
  "gen-nation-grass": {
    type: "nation_genetics",
    tokensPercent: {
      "hp": 20,
      "spe": 20,
      "spa": -10,
      "def": -10,  
      "atk": -10,
      "spd": -10
    }
  },
  "gen-nation-unknown": {
    type: "nation_genetics",
    tokensPercent: {
      "hp": 3,
      "spe": 3,
      "atk": 4,
      "def": 4,
      "spa": 3,
      "spd": 3
    }
  },
  "gen-age-18": {
    type: "age_genetics",
    tokensPercent: {
      "hp": 10,
      "def": 5,
      "atk": 5,
      "spa": 5,
      "spd": 5,
      "spe": 5
    }
  },
  "gen-age-25": {
    type: "age_genetics",
    tokensPercent: {
      "hp": 20,
      "def": 10,
      "atk": 15,
      "spa": 15,
      "spd": 10,
    }
  },
  "gen-age-50": {
    type: "age_genetics",
    tokensPercent: {
      "hp": -3,
      "def": -3,
      "atk": -3,
      "spa": -3,
      "spd": -3, 
    }
  },
  "gen-body-fat": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 10,
      "def": 5,
      "atk": 5,
      "spd": -5,
      "spe": -15
    }
  },
  "gen-body-thik": {
    type: "body_genetics",
    tokensPercent: {
      "hp": -10,
      "def": -5,
      "atk": -5,
      "spd": 5,
      "spe": 15
    }
  },

  "gen-food-low-1": {
    type: "food_genetics",
    tokensPercent: {
      "hp": -50,
      "def": -30,
      "atk": -30,
      "spd": -30,
      "spe": -30,
      "spa": -30
    }
  },
  "gen-food-low-2": {
    type: "food_genetics",
    tokensPercent: {
      "hp": -40,
      "def": -20,
      "atk": -20,
      "spd": -20,
      "spe": -20,
      "spa": -20
    }
  },
  "gen-food-low-3": {
    type: "food_genetics",
    tokensPercent: {
      "hp": -30,
      "def": -10,
      "atk": -10,
      "spd": -10,
      "spe": -10,
      "spa": -10
    }
  },
  "gen-food-low-4": {
    type: "food_genetics",
    tokensPercent: {
      "hp": -20,
      "def": -10,
      "atk": -10,
      "spd": -10,
      "spe": -10,
      "spa": -10
    }
  },
  "gen-food-mid-1": {
    type: "food_genetics",
    tokensPercent: {
      "hp": -10,
      "def": 10,
      "atk": 10,
      "spd": 10,
      "spe": 10,
      "spa": 10
    }
  }
}