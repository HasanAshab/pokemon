export default {

 laimonk: {
    num: 1,
    name: "Laimonk",
    types: ["Fighting"],
    baseStats: { hp: 50, atk: 70, def: 55, spa: 25, spd: 40, spe: 10 },
    abilities: {},
    heightm: 1.2
  },

devil: {
  num: 2,
  name: "Devil",
  types: ["Dark"],
  baseStats: { hp: 75, atk: 55, def: 85, spa: 80, spd: 35, spe: 20 },
  abilities: {},
  heightm: 1.3
},

drago: {
  num: 3,
  name: "Drago",
  types: ["Dragon", "Flying"],
  baseStats: { hp: 85, atk: 90, def: 80, spa: 75, spd: 80, spe: 60 },
  abilities: {},
  heightm: 1.4
},

gobking: {
  num: 4,
  name: "Gobking",
  types: ["Poison"],
  baseStats: { hp: 105, atk: 130, def: 120, spa: 80, spd: 95, spe: 40 },
  abilities: {},
  heightm: 1.5
},
elef: {
  num: 5,
  name: "Elef",
  types: ["Normal"],
  baseStats: { hp: 130, atk: 140, def: 135, spa: 110, spd: 105, spe: 60 },
  abilities: {},
  heightm: 1.8
},

dino: {
  num: 6,
  name: "Dino",
  types: ["Dragon", "Dark"],
  baseStats: { hp: 160, atk: 180, def: 170, spa: 120, spd: 130, spe: 50 },
  abilities: {},
  heightm: 2
},
knight: {
  num: 7,
  name: "Knight",
  types: ["Steel"],
  baseStats: { hp: 200, atk: 190, def: 220, spa: 150, spd: 180, spe: 60 },
  abilities: {},
  heightm: 2.3
},

tails1: {
  num: 8,
  name: "tails1( shukaku )",
  types: ["Ground"],
  baseStats: { hp: 260, atk: 190, def: 240, spa: 220, spd: 208, spe: 60 },
  abilities: {},
  heightm: 15.0
},

tails2: {
  num: 9,
  name: "tails2( matatabi )",
  types: ["Fire", "Dark"],
  baseStats: { hp: 280, atk: 200, def: 240, spa: 240, spd: 220, spe: 120 },
  abilities: {},
  heightm: 14.0
},
tails3: {
  num: 10,
  name: "tails3( isobu )",
  types: ["Rock"],
  baseStats: { hp: 350, atk: 280, def: 330, spa: 250, spd: 150, spe: 90 },
  abilities: {},
  heightm: 12.0
},

tails4: {
  num: 11,
  name: "tails4( songoku )",
  types: ["Normal", "Fire", "Fighting"],
  baseStats: { hp: 400, atk: 320, def: 300, spa: 310, spd: 210, spe: 100 },
  abilities: {},
  heightm: 13.0
},

tails5: {
  num: 12,
  name: "tails5( kokuo )",
  types: ["Fairy", "Psychic"],
  baseStats: { hp: 420, atk: 250, def: 280, spa: 400, spd: 250, spe: 150 },
  abilities: {},
  heightm: 14.0
},

tails6: {
  num: 13,
  name: "tails6( saiken )",
  types: ["Poison", "Bug"],
  baseStats: { hp: 450, atk: 300, def: 350, spa: 400, spd: 250, spe: 150 },
  abilities: {},
  heightm: 15.0
},

tails7: {
  num: 14,
  name: "tails7( killerbee )",
  types: ["Bug", "Flying"],
  baseStats: { hp: 480, atk: 350, def: 400, spa: 420, spd: 300, spe: 100 },
  abilities: {},
  heightm: 16.0
},

tails8: {
  num: 15,
  name: "tails8( gyuki )",
  types: ["Water", "Dark"],
  baseStats: { hp: 500, atk: 400, def: 450, spa: 450, spd: 300, spe: 100 },
  abilities: {},
  heightm: 17.0
},

tails9: {
  num: 16,
  name: "tails9( kurama )",
  types: ["Normal"],
  baseStats: { hp: 700, atk: 500, def: 550, spa: 500, spd: 350, spe: 150 },
  abilities: {},
  heightm: 18.0
},

  blacktai: {
  num: 17,
  name: "Black Tai",
  types: ["Fighting"], // based on its rocky, grounded appearance
  baseStats: { hp: 40, atk: 60, def: 45, spa: 15, spd: 30, spe: 10  },
  abilities: {},
  heightm: 1.2,
  },


 rocktri: {
  num: 18,
  name: "Rock Tri",
  types: ["Fighting", "Rock"],
  baseStats: {  hp: 75, atk: 75, def: 85, spa: 20, spd: 70, spe: 20  },
  abilities: {},
  heightm: 1.4,
  desc:`Has 30% to repeat user used move if make contact = true.
    it has 3 hands so it can repeat 3 times`
  },
 
roaringhands: {
  num: 19,
  name: "Roaring Hands",
  types: ["Fighting", "Rock", "Dark"],
  baseStats: {  hp: 200, atk: 170, def: 150, spa: 50, spd: 150, spe: 50  },
  abilities: {},
  heightm: 1.6,
  desc:`Has 30% to repeat user used move if make contact = true.
    it has 6 hands so it can repeat 6 times`
  },

gigazardx: {
  num: 20,
  name: "Gigazard X",
  types: ["Fire", "Dragon"],
  baseStats: { 
    hp: 550, 
    atk: 700, 
    def: 550, 
    spa: 300, 
    spd: 400, 
    spe: 200 
  },
  abilities: {  },
  heightm: 4.5,
  description: "A mutant four-armed titan. Its physical strength is unmatched, allowing it to crush mountains with its bare hands."
},

gigazardy: {
  num: 21,
  name: "Gigazard Y",
  types: ["Fire", "Flying"],
  baseStats: { 
    hp: 350, 
    atk: 300, 
    def: 400, 
    spa: 750, 
    spd: 550, 
    spe: 300 
  },
  abilities: { 0: "Drought" },
  heightm: 4.2,
  description: "An evolved aerial mutant. It can incinerate entire landscapes with a single blast of special draconic energy."
}

//   tails9: {
//     num: 1,
//     name: "tails9",
//     types: ["Normal"],
//     baseStats: { hp: 250, atk: 300, def: 150, spa: 200, spd: 70, spe: 30 },
//     abilities: {},
//     heightm: 5,
//     desc:`Massive Energy farm.
//     min( 50% ) = lvl / 3 , 
//     med( 25% ) = lvl / 1.5 ,
//     max( 15%) = lvl
//     `
//   },
// tails1: {
//   num: 2,
//   name: "tails1",
//   types: ["Ground"],
//   baseStats: { hp: 50, atk: 15, def: 20, spa: 45, spd: 10, spe: 10 }, // total = 150
//   abilities: {},
//   heightm: 1.7,
//   animeName: "shikagu"
// },
// tails2: {
//   num: 3,
//   name: "tails2",
//   types: ["Fire"],
//   baseStats: { hp: 50, atk: 30, def: 35, spa: 60, spd: 40, spe: 35 }, // total = 250
//   abilities: {},
//   heightm: 2.2,
//   animeName: "matabi"
// },
// tails3: {
//   num: 4,
//   name: "tails3",
//   types: ["rock"],
//   baseStats: { hp: 120, atk: 40, def: 40, spa: 45, spd: 40, spe: 15 }, // total = 300
//   abilities: {},
//   heightm: 2.4,
//   animeName: "isobu"
// },

// tails5: {
//   num: 6,
//   name: "tails5",
//   types: ["Fairy","Psychic"], 
//   baseStats: { hp: 30, atk: 30, def: 20, spa: 55, spd: 35, spe: 85 }, // total = 250
//   abilities: {},
//   heightm: 2.2,
//   animeName: "kokuo"
// },
// tails8: {
//   num: 9,
//   name: "tails8",
//   types: ["Water", "Dark"], 
//   baseStats: { hp: 130, atk: 80, def: 30, spa: 80, spd: 90, spe: 40 },
//   abilities: {},
//   heightm: 4,
//   animeName: "gyuki"
// },
// tails9: {
//   num: 10,
//   name: "tails9",
//   types: ["Normal"],
//   baseStats: { hp: 150, atk: 120, def: 160, spa: 110, spd: 80, spe: 80 }, // total = 700
//   abilities: {},
//   heightm: 4.5,
//   animeName: "kurama"
// },

// killerbee: {
//   num: 13,
//   name: "killerbee",
//   types: ["Bug"],
//   baseStats: { hp: 10, atk: 10, def: 5, spa: 20, spd: 20, spe: 35 }, // total = 150
//   abilities: {},
//   heightm: 1.8,
//   desc:`summons a swarm of bees that attack the target.`
// },
}

