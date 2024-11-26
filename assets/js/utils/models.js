import db from "./db.js"


export class Pokemon {
    constructor(name, meta, data) {
        this.name = name
        this.meta = meta
        this.data = data
    }
    static async make(name, meta) {
        const data = await db.pokemons.get(name)
        return new this(name, meta, data)
    }
    
    isTypeOf(type) {
        return this.data.types.includes(type)
    }
    
    statOf(name) {
        return this.data.stats[name];
    }
    
    effortOf(name) {
        return this.data.efforts[name];
    }
    
    effectiveness(type) {
      let effectiveness = 1;
      this.data.types.forEach(tType => {
        if (types[type] && types[type][tType]) {
          effectiveness *= types[type][tType];
        }
      });
      return effectiveness
    }
    
}
