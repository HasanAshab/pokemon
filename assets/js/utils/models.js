import pokemons from "../../../data/pokemons.js"
import moves from "../../../data/moves.js"
import typeChart from "../../../data/types.js"
import natures from "../../../data/natures.js"


export class Pokemon {
    static XP_PER_LEVEL = 100;

    static calculateLevel(xp) {
        return Math.floor(xp / Pokemon.XP_PER_LEVEL) + 1;
    }

    static natureModifierFor(statName, nature) {
        if (!nature || !natures[nature]) return 1; // Neutral nature
        const natureEffects = natures[nature];
        if (natureEffects.plus === statName) return 1.1; // Boosted stat
        if (natureEffects.minus === statName) return 0.9; // Reduced stat
        return 1; // No effect
    }

    constructor(id, meta) {
        this.id = id;
        this.meta = meta;
        this._pokemon = pokemons[id];
        this.stats = this._calculateTotalStat(); 
    }

    get types() {
        return this._pokemon.types
    }

    get level() {
        const xp = this.meta.xp;
        return Pokemon.calculateLevel(xp); // Level starts at 1
    }

    isTypeOf(type) {
        return this.types.includes(type);
    }

    getWeight() {
        return this._pokemon.weightkg * 10;
    }

    effectiveness(type) {
        if (!type) return 1
        let effectiveness = 1;
        this.types.forEach(tType => {
            if (typeChart[type] && typeChart[type][tType]) {
                effectiveness *= typeChart[type][tType];
            }
        });
        return effectiveness;
    }

    _calculateLevelStat() {
        const stats = {};

        Object.keys(this._pokemon.baseStats).forEach(statName => {
          const baseStat = this._pokemon.baseStats[statName];
          const ev = 0; // Effort values from `efforts`
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
      
        Object.keys(this._pokemon.baseStats).forEach(statName => {
          const baseStat = this._pokemon.baseStats[statName];
          const natureModifier = Pokemon.natureModifierFor(statName, this.meta.nature);
          // Apply nature modifier
          natureStats[statName] = Math.floor(baseStat * natureModifier) - baseStat;
        });
      
        return natureStats;
      }

      _calculateTokenStat() {
        const tokenStats = {};
      
        Object.keys(this._pokemon.baseStats).forEach(statName => {
          const baseStat = this._pokemon.baseStats[statName];
          const tokenModifier = Math.pow(1.05, this.meta.token_used[statName]);
          // Apply token modifier
          tokenStats[statName] = Math.floor(baseStat * tokenModifier) - baseStat;
        });
        return tokenStats;
      }
      
      _calculateTotalStat() {
        const baseStats = this._pokemon.baseStats;
        const levelStats = this._calculateLevelStat();
        const natureStats = this._calculateNatureStat();
        const tokenStats = this._calculateTokenStat();
        const totalStats = {};
        Object.keys(baseStats).forEach(statName => {
          totalStats[statName] =
            baseStats[statName] + levelStats[statName] + natureStats[statName] + tokenStats[statName];
        });
      
        return totalStats;
      }
}

export class Move {
    constructor(id) {
        this.id = id;
        this._move = moves[id];
        Object.assign(this, this._move)
    }

    effectiveness(type) {
        if (!this.type) return 1
        return typeChart[this.type][type] || 1
    }
}
