import db from "./db.js"
import { toTitleCase } from "./helpers.js"


export class Pokemon {
    static XP_PER_LEVEL = 100;
    static NATURE_MODIFIERS = {
        "adamant": { increase: "attack", decrease: "special-attack" },
        "bashful": { increase: null, decrease: null },
        "bold": { increase: "defense", decrease: "attack" },
        "brave": { increase: "attack", decrease: "speed" },
        "calm": { increase: "special-defense", decrease: "attack" },
        "careful": { increase: "special-defense", decrease: "special-attack" },
        "docile": { increase: null, decrease: null },
        "gentle": { increase: "special-defense", decrease: "defense" },
        "hasty": { increase: "speed", decrease: "defense" },
        "impish": { increase: "defense", decrease: "special-attack" },
        "jolly": { increase: "speed", decrease: "special-attack" },
        "lax": { increase: "defense", decrease: "special-defense" },
        "lonely": { increase: "attack", decrease: "defense" },
        "mild": { increase: "special-attack", decrease: "defense" },
        "modest": { increase: "special-attack", decrease: "attack" },
        "naive": { increase: "speed", decrease: "special-defense" },
        "naughty": { increase: "attack", decrease: "special-defense" },
        "quiet": { increase: "special-attack", decrease: "speed" },
        "quirky": { increase: null, decrease: null },
        "rash": { increase: "special-attack", decrease: "special-defense" },
        "relaxed": { increase: "defense", decrease: "speed" },
        "sassy": { increase: "special-defense", decrease: "speed" },
        "serious": { increase: null, decrease: null },
        "timid": { increase: "speed", decrease: "attack" },
    };

    static async make(name, meta) {
        const data = await db.pokemons.get(name);
        return new this(name, data, meta);
    }

    static calculateLevel(xp) {
        return Math.floor(xp / Pokemon.XP_PER_LEVEL) + 1;
    }

    constructor(name, data, meta) {
        this.name = name;
        this.data = data;
        this.meta = meta;
        this.data.stats = this._calculateTotalStat()
    }

    isTypeOf(type) {
        return this.data.types.includes(type);
    }

    statOf(name) {
        return this.data.stats[name];
    }

    effortOf(name) {
        return this.data.efforts[name];
    }

    async effectiveness(type) {
        const types = await db.types.all()
        let effectiveness = 1;
        this.data.types.forEach(tType => {
            if (types[type] && types[type][tType]) {
                effectiveness *= types[type][tType];
            }
        });
        return effectiveness;
    }

    get level() {
        const xp = this.meta.xp;
        return Pokemon.calculateLevel(xp); // Level starts at 1
    }
    
    static getNatureModifier(statName, nature) {
      if (!nature || !Pokemon.NATURE_MODIFIERS[nature]) return 1; // Neutral nature
      const natureEffects = Pokemon.NATURE_MODIFIERS[nature];
      if (natureEffects.increase === statName) return 1.1; // Boosted stat
      if (natureEffects.decrease === statName) return 0.9; // Reduced stat
      return 1; // No effect
    }

    _calculateLevelStat() {
      const stats = {};
    
      Object.keys(this.data.stats).forEach(statName => {
        const baseStat = this.statOf(statName);
        const ev = this.data.efforts[statName] || 0; // Effort values from `efforts`
        const iv = 35; // Default IV value
    
        if (statName === "hp") {
          // HP calculation
          stats[statName] = Math.floor(
            ((20 * baseStat + iv + Math.floor(ev / 4)) * this.level) / 100 + this.level + 10
          );
        } else {
          // Other stat calculations
          stats[statName] = Math.floor(
            ((2 * baseStat + iv + Math.floor(ev / 4)) * this.level) / 100 + 5
          );
        }
      });
      return stats;
    }
    
    _calculateNatureStat() {
      const natureStats = {};
    
      Object.keys(this.data.stats).forEach(statName => {
        const baseStat = this.statOf(statName);
        const natureModifier = Pokemon.getNatureModifier(statName, this.meta.nature);
        // Apply nature modifier
        natureStats[statName] = Math.floor(baseStat * natureModifier) - baseStat;
      });
    
      return natureStats;
    }
    
    _calculateTotalStat() {
      const baseStats = this.data.stats;
      const levelStats = this._calculateLevelStat();
      const natureStats = this._calculateNatureStat();
      const totalStats = {};
      Object.keys(baseStats).forEach(statName => {
        totalStats[statName] =
          baseStats[statName] + levelStats[statName] + natureStats[statName];
      });
    
      return totalStats;
    }

}

export class Move {
    static async make(name) {
        const data = await db.moves.get(name);
        return new this(name, data);
    }

    constructor(name, data) {
        this.name = name;
        this._data = data;
        Object.assign(this, data)
    }
    
    get display() {
        return toTitleCase(this.name.replace("$", ""))
    }
    
    get isNotMove() {
        return this.damage_class === "none"
    }

    async effectiveness(type) {
        const typeMap = await db.types.get(this.type)
        return typeMap[type] || 1
    }
}
