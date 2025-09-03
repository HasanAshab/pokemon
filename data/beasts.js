export default {
  tails9: {
    num: 1,
    name: "tails9",
    types: ["Normal"],
    baseStats: { hp: 250, atk: 300, def: 150, spa: 200, spd: 70, spe: 30 },
    abilities: {},
    heightm: 5,
    desc:`Massive Energy farm.
    min( 50% ) = lvl / 3 , 
    med( 25% ) = lvl / 1.5 ,
    max( 15%) = lvl
    `
  },
tails1: {
  num: 2,
  name: "tails1",
  types: ["Ground"],
  baseStats: { hp: 50, atk: 15, def: 20, spa: 45, spd: 10, spe: 10 }, // total = 150
  abilities: {},
  heightm: 1.7,
  animeName: "shikagu"
},

tails2: {
  num: 3,
  name: "tails2",
  types: ["Fire"],
  baseStats: { hp: 50, atk: 30, def: 35, spa: 60, spd: 40, spe: 35 }, // total = 250
  abilities: {},
  heightm: 2.2,
  animeName: "matabi"
},
tails3: {
  num: 4,
  name: "tails3",
  types: ["rock"],
  baseStats: { hp: 120, atk: 40, def: 40, spa: 45, spd: 40, spe: 15 }, // total = 300
  abilities: {},
  heightm: 2.4,
  animeName: "isobu"
},

tails5: {
  num: 6,
  name: "tails5",
  types: ["Fairy","Psychic"], 
  baseStats: { hp: 30, atk: 30, def: 20, spa: 55, spd: 35, spe: 85 }, // total = 250
  abilities: {},
  heightm: 2.2,
  animeName: "kokuo"
},
tails8: {
  num: 9,
  name: "tails8",
  types: ["Water", "Dark"], 
  baseStats: { hp: 130, atk: 80, def: 30, spa: 80, spd: 90, spe: 40 },
  abilities: {},
  heightm: 4,
  animeName: "gyuki"
},
tails9: {
  num: 10,
  name: "tails9",
  types: ["Normal"],
  baseStats: { hp: 150, atk: 120, def: 160, spa: 110, spd: 80, spe: 80 }, // total = 700
  abilities: {},
  heightm: 4.5,
  animeName: "kurama"
},
hands1: {
  num: 11,
  name: "hands1",
  types: ["Fighting"], // based on its rocky, grounded appearance
  baseStats: { hp: 40, atk: 50, def: 30, spa: 10, spd: 10, spe: 10 }, // total = 150
  abilities: {},
  heightm: 1.8,
  animeName: "blackTai"
},

hands2: {
  num: 12,
  name: "hands2",
  types: ["Fighting"],
  baseStats: { hp: 70, atk: 85, def: 55, spa: 10, spd: 15, spe: 15 },
  abilities: {},
  heightm: 2.1,
  desc:`Has 30% to repeat user used move if make contact = true.
    it has 3 hands so it can repeat 3 times`
},
 charizard: {
  num: 13,
  name: "charizard",
  types: ["Fire"],
  baseStats: { hp: 40, atk: 35, def: 25, spa: 50, spd: 25, spe: 25 }, // total = 200
  abilities: { 0: "charizardbeast" },
  heightm: 1.7,
  animeName: "charizard"
},

charizardy: {
  num: 14,
  name: "charizardy",
  types: ["Fire", "Flying"],
  baseStats: { hp: 70, atk: 50, def: 50, spa: 120, spd: 30, spe: 80 }, // total = 400
  abilities: {},
  heightm: 1.9,
  animeName: "charizardY"
},
}
