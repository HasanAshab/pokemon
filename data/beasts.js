export default {

  laimonk: {
    num: 1,
    name: "Laimonk",
    types: ["Fighting"],
   baseStats: { hp: 60, atk: 85, def: 65, spa: 60, spd: 65, spe: 64 }, // 399
    abilities: {},
    heightm: 1.2
  },

  devil: {
    num: 2,
    name: "Devil",
    types: ["Dark"],
     baseStats: { hp: 85, atk: 95, def: 85, spa: 120, spd: 85, spe: 60 }, // 530 
      abilities: {},
    heightm: 1.3
  },

  drago: {
    num: 3,
    name: "Drago",
    types: ["Dragon", "Flying"],
    baseStats: { hp: 95, atk: 120, def: 95, spa: 120, spd: 98, spe: 50 }, // 678
    abilities: {},
    heightm: 1.4
  },

  gobking: {
    num: 4,
    name: "Gobking",
    types: ["Poison"],
    baseStats: { hp: 130, atk: 145, def: 130, spa: 110, spd: 115, spe: 79 },// 809
    abilities: {},
    heightm: 1.5
  },

  elef: {
    num: 5,
    name: "Elef",
    types: ["Normal"],
    baseStats: { hp: 170, atk: 165, def: 160, spa: 140, spd: 135, spe: 75 }, // 985
    abilities: {},
    heightm: 1.8
  },

  dino: {
    num: 6,
    name: "Dino",
    types: ["Dragon", "Dark"],
    baseStats:{ hp: 190, atk: 230, def: 185, spa: 185, spd: 165, spe: 23 }, // 1178
    abilities: {},
    heightm: 2
  },

  knight: {
    num: 7,
    name: "Knight",
    types: ["Steel"],
    baseStats: { hp: 240, atk: 260, def: 290, spa: 170, spd: 290, spe: 136 }, // 1386
    abilities: {},
    heightm: 2.3
  },

  tails1: {
    num: 8,
    name: "tails1( shukaku )",
    types: ["Ground"],
    baseStats: { hp: 362, atk: 265, def: 335, spa: 307, spd: 290, spe: 84 },
    abilities: {},
    heightm: 15.0
  },

  tails2: {
    num: 9,
    name: "tails2( matatabi )",
    types: ["Fire", "Dark"],
    baseStats: { hp: 390, atk: 279, def: 335, spa: 335, spd: 307, spe: 167 },
    abilities: {},
    heightm: 14.0
  },

  tails3: {
    num: 10,
    name: "tails3( isobu )",
    types: ["Rock"],
    baseStats: { hp: 488, atk: 390, def: 460, spa: 349, spd: 209, spe: 125 },
    abilities: {},
    heightm: 12.0
  },

  tails4: {
    num: 11,
    name: "tails4( songoku )",
    types: ["Normal", "Fire", "Fighting"],
    baseStats: { hp: 558, atk: 446, def: 418, spa: 432, spd: 293, spe: 139 },
    abilities: {},
    heightm: 13.0
  },

  tails5: {
    num: 12,
    name: "tails5( kokuo )",
    types: ["Fairy", "Psychic"],
    baseStats: { hp: 586, atk: 349, def: 390, spa: 558, spd: 349, spe: 209 },
    abilities: {},
    heightm: 14.0
  },

  tails6: {
    num: 13,
    name: "tails6( saiken )",
    types: ["Poison", "Bug"],
    baseStats: { hp: 627, atk: 418, def: 488, spa: 558, spd: 349, spe: 209 },
    abilities: {},
    heightm: 15.0
  },

  tails7: {
    num: 14,
    name: "tails7( killerbee )",
    types: ["Bug", "Flying"],
    baseStats: { hp: 669, atk: 488, def: 558, spa: 586, spd: 418, spe: 139 },
    abilities: {},
    heightm: 16.0
  },

  tails8: {
    num: 15,
    name: "tails8( gyuki )",
    types: ["Water", "Dark"],
    baseStats: { hp: 697, atk: 558, def: 627, spa: 627, spd: 418, spe: 139 },
    abilities: {},
    heightm: 17.0
  },

  tails9: {
    num: 16,
    name: "tails9( kurama )",
    types: ["Normal"],
    baseStats: { hp: 697, atk: 697, def: 488, spa: 697, spd: 488, spe: 209 },
    abilities: {},
    heightm: 18.0
  },

  blacktai: {
    num: 17,
    name: "Black Tai",
    types: ["Fighting"],
    baseStats: { hp: 56, atk: 84, def: 63, spa: 21, spd: 42, spe: 14 },
    abilities: {},
    heightm: 1.2
  },

  rocktri: {
    num: 18,
    name: "Rock Tri",
    types: ["Fighting", "Rock"],
    baseStats: { hp: 105, atk: 105, def: 119, spa: 28, spd: 98, spe: 28 },
    abilities: {},
    heightm: 1.4,
    desc: `Has 30% to repeat user used move if make contact = true.
    it has 3 hands so it can repeat 3 times`
  },

  roaringhands: {
    num: 19,
    name: "Roaring Hands",
    types: ["Fighting", "Rock", "Dark"],
    baseStats: { hp: 279, atk: 237, def: 209, spa: 70, spd: 209, spe: 70 },
    abilities: {},
    heightm: 1.6,
    desc: `Has 30% to repeat user used move if make contact = true.
    it has 6 hands so it can repeat 6 times`
  },

  gigazardx: {
    num: 20,
    name: "Gigazard X",
    types: ["Fire", "Dragon"],
    baseStats: { hp: 767, atk: 976, def: 767, spa: 418, spd: 558, spe: 279 },
    abilities: {},
    heightm: 4.5,
    description: "A mutant four-armed titan. Its physical strength is unmatched, allowing it to crush mountains with its bare hands."
  },

  gigazardy: {
    num: 21,
    name: "Gigazard Y",
    types: ["Fire", "Flying"],
    baseStats: { hp: 488, atk: 418, def: 558, spa: 1046, spd: 767, spe: 418 },
    abilities: { 0: "Drought" },
    heightm: 4.2,
    description: "An evolved aerial mutant. It can incinerate entire landscapes with a single blast of special draconic energy."
  }

};
