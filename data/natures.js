import process from './processors/nature.js'


const NATURES = {
    none: {
      name: "Neutral",
    },
    tai: {
      name: "Tai",
      plus: "atk",
      minus: "spa"
    },
    nin: {
      name: "Nin",
      plus: "spa",
      minus: "atk"
    }
  }
  
export default process(NATURES);
