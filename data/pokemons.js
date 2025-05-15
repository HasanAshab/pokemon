export default {
  student: {
    num: 1,
    name: "Student",
    types: ["Training"],
    genderRatio: {
      M: 0.5,
      F: 0.5
    },
    baseStats: {
      hp: 30,
      atk: 20,
      def: 20,
      spa: 15,
      spd: 15,
      spe: 25
    },
    abilities: {},
    heightm: 1.4,
    weightkg: 40,
    color: "Blue",
    evos: ["Genin"],
    eggGroups: ["Human"]
  },
  genin: {
    num: 2,
    name: "Genin",
    types: ["Shinobi"],
    genderRatio: {
      M: 0.5,
      F: 0.5
    },
    baseStats: {
      hp: 40,
      atk: 35,
      def: 30,
      spa: 30,
      spd: 30,
      spe: 35
    },
    abilities: {},
    heightm: 1.5,
    weightkg: 45,
    color: "Gray",
    prevo: "Academy Student",
    evoLevel: 10,
    evos: ["Chunin"],
    eggGroups: ["Human"]
  },
  chunin: {
    num: 3,
    name: "Chunin",
    types: ["Shinobi"],
    genderRatio: {
      M: 0.5,
      F: 0.5
    },
    baseStats: {
      hp: 55,
      atk: 50,
      def: 45,
      spa: 40,
      spd: 45,
      spe: 50
    },
    abilities: {},
    heightm: 1.6,
    weightkg: 50,
    color: "Brown",
    prevo: "Genin",
    evoLevel: 25,
    evos: ["Jonin"],
    eggGroups: ["Human"]
  },
  jonin: {
    num: 4,
    name: "Jonin",
    types: ["Elite"],
    genderRatio: {
      M: 0.5,
      F: 0.5
    },
    baseStats: {
      hp: 75,
      atk: 70,
      def: 65,
      spa: 60,
      spd: 65,
      spe: 70
    },
    abilities: {},
    heightm: 1.7,
    weightkg: 55,
    color: "Black",
    prevo: "Chunin",
    evoLevel: 40,
    evos: ["Anbu",
      "Kage"],
    eggGroups: ["Human"]
  },
  anbu: {
    num: 5,
    name: "Anbu",
    types: ["Stealth"],
    genderRatio: {
      M: 0.5,
      F: 0.5
    },
    baseStats: {
      hp: 80,
      atk: 85,
      def: 70,
      spa: 60,
      spd: 70,
      spe: 85
    },
    abilities: {},
    heightm: 1.75,
    weightkg: 58,
    color: "Silver",
    prevo: "Jonin",
    evoLevel: 50,
    eggGroups: ["Human"]
  },
  kage: {
    num: 6,
    name: "Kage",
    types: ["Leader"],
    genderRatio: {
      M: 0.5,
      F: 0.5
    },
    baseStats: {
      hp: 95,
      atk: 90,
      def: 85,
      spa: 80,
      spd: 85,
      spe: 75
    },
    abilities: {},
    heightm: 1.8,
    weightkg: 60,
    color: "Gold",
    prevo: "Jonin",
    evoLevel: 60,
    eggGroups: ["Human"]
  }
}