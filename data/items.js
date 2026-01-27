import { calcObj, deepClone, modObj } from "../assets/js/utils/helpers.js"
import moves from "./moves.js"

function convertMoveToItem(move) {
  const atkStatName = move.flags.contact ? "atk" : "spa"  
  return {
    type: "weapon",
    tokensPercent: {
      [atkStatName]: 10 * move.retreat,
    },
    tokens: modObj(move.tokenChanges, 1.3),
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
    item.type = "armor"
    item.covers = cover
    item.tokens = item.tokens 
      ? modObj(item.tokens, 1 + ((cover - coverSets[0]) / 100))
      : {}
    acc[`${id}${i + 1}`] = item
    return acc
  }, {})
}


const items = {
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
  ...makeArmorSets("copperarmor", {
    type: "armor",
    stats: {
      def: 60
    },
    tokens: {
      spe: -4
    }
  }),
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
  ...makeArmorSets("bronzelocket", {
    type: "armor",
    stats: {
      spd: 25
    }
  }),
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
      "hp": 20,
      "def": 6,
      "atk": 14,
      "spa": 14,
      "spd": 6,
      "spe": 20
    }
  },
  "gen-age-(25-29:40-49)": {
    type: "age_genetics",
    tokensPercent: {
      "hp": 50,
      "def": 18,
      "atk": 35,
      "spa": 35,
      "spd": 18,
      "spe": 50
    }
  },
  "gen-age-prime": {
    type: "age_genetics",
    tokensPercent: {
      "hp": 90,
      "def": 60,
      "atk": 85,
      "spa": 85,
      "spd": 60,
      "spe": 95
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
      "spe": -3
    }
  },
  "gen-body-fat": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 10,
      "def": 5,
      "atk": 5,
      "spd": -5,
      "spa": -5,
      "spe": -10
    }
  },
  "gen-body-thik": {
    type: "body_genetics",
    tokensPercent: {
      "hp": -10,
      "def": -5,
      "atk": -5,
      "spd": 5,
      "spa": 5,
      "spe": 10
    }
  },

 "gen-body-med": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 0,
      "def": 0,
      "atk": 0,
      "spd": 0,
      "spe": 0,
      "spa": 0
    }
  },
  "gen-body-fit-1": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 15,
      "def": 15,
      "atk": 15,
      "spd": 15,
      "spe": 15,
      "spa": 15
    }
  },
  "gen-body-fit-2": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 30,
      "def": 30,
      "atk": 30,
      "spd": 30,
      "spe": 30,
      "spa": 30

    } 
  },
  "gen-body-fit-3": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 45,
      "def": 45,
      "atk": 45,
      "spd": 45,
      "spe": 45,
      "spa": 45
    }
  },
  "gen-body-athletic-1": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 65,
      "def": 65,
      "atk": 65,
      "spd": 65,
      "spe": 65,
      "spa": 65
    }
  },
  "gen-body-athletic-2": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 85,
      "def": 85,
      "atk": 85,
      "spd": 85,
      "spe": 85,
      "spa": 85
    }
  },
  "gen-body-athletic-3": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 105,
      "def": 105,
      "atk": 105,
      "spd": 105,
      "spe": 105,
      "spa": 105
    }
  },
  "gen-body-athletic-4": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 125,
      "def": 125,
      "atk": 125,
      "spd": 125,
      "spe": 125,
      "spa": 125
    }
  },
  "gen-body-muscular-1": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 150,
      "def": 150,
      "atk": 150,
      "spd": 150,
      "spe": 125,
      "spa": 150
    }
  },
  "gen-body-muscular-2": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 175,
      "def": 175,
      "atk": 175,
      "spd": 175,
      "spe": 125,
      "spa": 175
    }
  },
  "gen-body-muscular-3": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 200,
      "def": 200,
      "atk": 200,
      "spd": 200,
      "spe": 125,
      "spa": 200
    }
  },
  "gen-body-bulk-1": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 300,
      "def": 300,
      "atk": 300,
      "spd": 200,
      "spe": 70,
      "spa": 200
    }
  },
  "gen-body-bulk-2": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 400,
      "def": 400,
      "atk": 400,
      "spd": 200,
      "spe": 40,
      "spa": 200
    }
  },
  "gen-body-bulk-3": {
    type: "body_genetics",
    tokensPercent: {
      "hp": 550,
      "def": 550,
      "atk": 550,
      "spd": 200,
      "spe": 5,
      "spa": 200
    }
  },

  "gen-food-low-1": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 0,
      "def": 9,
      "atk": 9,
      "spd": 9,
      "spe": 9,
      "spa": 9
    },
  },
  "gen-food-low-2": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 3,
      "def": 15,
      "atk": 15,
      "spd": 15,
      "spe": 15,
      "spa": 15
    },
  },
  "gen-food-low-3": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 6,
      "def": 21,
      "atk": 21,
      "spd": 21,
      "spe": 21,
      "spa": 21
    },
  },
  "gen-food-low-4": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 9,
      "def": 27,
      "atk": 27,
      "spd": 27,
      "spe": 27,
      "spa": 27
    },
  },
  "gen-food-mid-1": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 36,
      "def": 65,
      "atk": 65,
      "spd": 65,
      "spe": 65,
      "spa": 65
    },
  },
  "gen-food-mid-2": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 42,
      "def": 85,
      "atk": 85,
      "spd": 85,
      "spe": 85,
      "spa": 85
    },
  },
  "gen-food-mid-3": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 60,
      "def": 105,
      "atk": 105,
      "spd": 105,
      "spe": 105,
      "spa": 105
    },
  },
  "gen-food-high-1": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 90,
      "def": 145,
      "atk": 145,
      "spd": 145,
      "spe": 145,
      "spa": 145
    },
  },

  "gen-food-high-2": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 110,
      "def": 175,
      "atk": 175,
      "spd": 175,
      "spe": 175,
      "spa": 175
    },
  },
  "gen-food-high-3": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 130,
      "def": 205,
      "atk": 205,
      "spd": 205,
      "spe": 205,
      "spa": 205
    },
  },
  "gen-food-bulk-1": {
    "type": "food_genetics",
    "tokensPercent": {
      "hp": 180,
      "def": 255,
      "atk": 255,
      "spd": 255,
      "spe": 255,
      "spa": 255
    },
  }
}


function calcScoreOfWeaponItem(itemId) {
  const item = items[itemId]  
  const tokensPercentTotal = calcObj(item.tokensPercent)
  const tokensTotal = calcObj(item.tokens)
  const score = (15 * tokensPercentTotal) + tokensTotal
  return score
}

function calcScoreOfArmorItem(itemId) {
  const item = items[itemId]
  if (!item.stats) return 0  
  const totalStats = calcObj(item.stats) + (item.tokens ? calcObj(item.tokens) : 0)
  const score = totalStats * item.covers
  return score
}

function calcScoreOfGeneticsItem(itemId) {
  const item = items[itemId]  
  const tokensPercentTotal = calcObj(item.tokensPercent)
  const score = 15 * tokensPercentTotal
  return score
}

function getDefaultPriceOfItem(itemId) {
  const item = items[itemId]
  let price = 0
  if (!item || !item.type) {
    return price
  }

  if (item.meta?.budget) {
    return item.meta.budget
  }

  if (item.type === "weapon") {
    const BASE_SCORE = calcScoreOfWeaponItem("kunai:rock")
    const BASE_PRICE = 200
    const score = calcScoreOfWeaponItem(itemId)
    price = (score / BASE_SCORE) * BASE_PRICE
  }

  else if (item.type === "armor") {
    const BASE_SCORE = calcScoreOfArmorItem("latherarmor1")
    const BASE_PRICE = 200
    const score = calcScoreOfArmorItem(itemId)
    price = (score / BASE_SCORE) * BASE_PRICE
  }

  else if (item.type.endsWith("_genetics")) {
    const BASE_SCORE = calcScoreOfWeaponItem("kunai:rock")
    const BASE_PRICE = 200
    const score = calcScoreOfGeneticsItem(itemId)
    price = (score / BASE_SCORE) * BASE_PRICE
  }

  return Math.max(0, Math.round(price))
}

for (const id in items) {
  if (!items[id].meta) {
    items[id].meta = {}
  }
  items[id].meta.budget = getDefaultPriceOfItem(id)
}

export default items