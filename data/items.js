import { deepClone, modObj } from "../assets/js/utils/helpers.js"
import moves from "./moves.js"

function convertMoveToItem(move) {
  const atkStatName = move.flags.contact ? "atk" : "spa"  
  return {
    type: "weapon",
    tokensPercent: {
      [atkStatName]: 40 * move.retreat,
    },
    tokens: modObj(move.tokenChanges, 0.7)
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

function makeArmorSets(id, baseArmorItem) {
  const coverSets = [20, 40, 80]

  return coverSets.reduce((acc, cover, i) => {
    const item = deepClone(baseArmorItem)
    item.covers = cover
    item.tokens = modObj(item.tokens, 1 + ((cover - coverSets[0]) / 100))
    acc[`${id}${i + 1}`] = item
    console.log(item);
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
  ...makeArmorSets("latherarmor", {
      type: "armor",
      stats: {
        def: 30
      },
      tokens: {
        spe: -2
      }
  }),
copperarmor: {
    type: "armor",
    stats: {
      def: 60
    },
    tokens: {
      spe: -4
    }
  },
flintarmor: {
    type: "armor",
    stats: {
      def: 120
    },
    tokens: {
      spe: -8
    }
  },
  tinarmor: {
    type: "armor",
    stats: {
      def: 240
    },
    tokens: {
      spe: -16
    }
  },
 bronzearmor: {
    type: "armor",
    stats: {
      def: 480
    },
    tokens: {
      spe: -32
    }
  },
 ironarmor: {
    type: "armor",
    stats: {
      def: 30
    },
    tokens: {
      spe: -1
    }
  },
 steelarmor: {
    type: "armor",
    stats: {
      def: 45
    },
    tokens: {
      spe: -7
    }
  },
metalarmor: {
    type: "armor",
    stats: {
      def: 30
    },
    tokens: {
      spe: -1
    }
  },
platinumarmor: {
    type: "armor",
    stats: {
      def: 30
    },
    tokens: {
      spe: -1
    }
  },
crystalarmor: {
    type: "armor",
    stats: {
      def: 30
    },
    tokens: {
      spe: -1
    }
  },
auroraarmor: {
    type: "armor",
    stats: {
      def: 30
    },
    tokens: {
      spe: -1
    }
  },
dragonarmor: {
    type: "armor",
    stats: {
      def: 30
    },
    tokens: {
      spe: -1
    }
  },
  bronzelocket1: {
    type: "armor",
    covers: 20,
    stats: {
      spd: 25 
    }
  },
    bronzelocket2: {
    type: "armor",
    covers: 40,
    stats: {
      spd: 25
    }
  },
    bronzelocket3: {
    type: "armor",
    covers: 80,
    stats: {
      spd: 25
    }
  },
    silverlocket1: {
    type: "armor",
    covers: 20,
    stats: {
      spd: 40 
    }
  },
  silverlocket2: {
    type: "armor",
    covers: 40,
    stats: {
      spd: 40
    }
  },
    silverlocket3: {
    type: "armor",
    covers: 80,
    stats: {
      spd: 40
    }
  },
   goldlocket1: {
    type: "armor",
    covers: 20,
    stats: {
      spd: 55 
    }
  },
   goldlocket2: {
    type: "armor",
    covers: 40,
    stats: {
      spd: 55
    }
  },
    goldlocket3: {
    type: "armor",
    covers: 80,
    stats: {
      spd: 55
    }
  },
   crystallocket1: {
    type: "armor",
    covers: 20,
    stats: {
      spd: 70
    }
  },
   crystallocket2: {
    type: "armor",
    covers: 40,
    stats: {
      spd: 70
    }
  },
    crystallocket3: {
    type: "armor",
    covers: 80,
    stats: {
      spd: 70
    }
  },
  "scream-storm": {
    tokensPercent: {
      spe: 25
    }
  },
  "scream-shell": {
    tokensPercent: {
     hp: 30
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
  "gen-nation-wood": {
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
  
  "gen-age-under-18": {
    type: "age_genetics",
    tokensPercent: {}
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

 "gen-body-fit-1": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 0,
      "def": 0,
      "atk": 0,
      "spd": 0,
      "spe": 0
    }
  },
  "gen-body-fit-2": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 5,
      "def": 5,
      "atk": 5,
      "spd": 5,
      "spe": 5
    }
  },
  "gen-body-fit-3": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 10,
      "def": 10,
      "atk": 10,
      "spd": 10,
      "spe": 10
    }
  },
  
  "gen-food-low-1": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 0,
      "def": 3,
      "atk": 3,
      "spd": 3,
      "spe": 3,
      "spa": 3
    },
    "meta": { "budget": 300 }
  },
  "gen-food-low-2": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 1,
      "def": 5,
      "atk": 5,
      "spd": 5,
      "spe": 5,
      "spa": 5
    },
    "meta": { "budget": 700 }
  },
  "gen-food-low-3": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 2,
      "def": 7,
      "atk": 7,
      "spd": 7,
      "spe": 7,
      "spa": 7
    },
    "meta": { "budget": 1000 }
  },
  "gen-food-low-4": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 3,
      "def": 9,
      "atk": 9,
      "spd": 9,
      "spe": 9,
      "spa": 9
    },
    "meta": { "budget": 1500 }
  },
  "gen-food-mid-1": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 6,
      "def": 13,
      "atk": 13,
      "spd": 13,
      "spe": 13,
      "spa": 13
    },
    "meta": { "budget": 2500 }
  },
  "gen-food-mid-2": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 7,
      "def": 16,
      "atk": 16,
      "spd": 16,
      "spe": 16,
      "spa": 16
    },
    "meta": { "budget": 3500 }
  },
  "gen-food-mid-3": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 8,
      "def": 19,
      "atk": 19,
      "spd": 19,
      "spe": 19,
      "spa": 19
    },
    "meta": { "budget": 4500 }
  },
  "gen-food-high-1": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 11,
      "def": 25,
      "atk": 25,
      "spd": 25,
      "spe": 25,
      "spa": 25
    },
    "meta": { "budget": 6000 }
  },
  "gen-food-high-2": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 13,
      "def": 28,
      "atk": 28,
      "spd": 28,
      "spe": 28,
      "spa": 28
    },
    "meta": { "budget": 8000 }
  },
  "gen-food-high-3": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 15,
      "def": 32,
      "atk": 32,
      "spd": 32,
      "spe": 32,
      "spa": 32
    },
    "meta": { "budget": 10000 }
  },
  "gen-food-bulk-1": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 20,
      "def": 40,
      "atk": 33,
      "spd": 28,
      "spe": 22,
      "spa": 28
    },
    "meta": { "budget": 15000 }
  }
}
