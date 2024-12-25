import pokemons from "../../../data/pokemons.js"
import moves from "../../../data/moves.js"
import typeChart from "../../../data/types.js"
import natures from "../../../data/natures.js"
import movesText from "../../../data/moves_text.js"


class PSPokemon {
    get maxhp() {
        return this.stats.hp
    }
    
    get hp() {
        return this.state?.stats.get("hp") ?? null
    }

    getWeight() {
        return this._pokemon.weightkg * 10;
    }
}

export class Pokemon extends PSPokemon {
    static XP_PER_LEVEL = 100;
    static TOKEN_PER_LEVEL = 2
    static TOKEN_MODIFIERS = {
        hp: 1.06,
        spe: 1.009, 
        default: 1.05 // Default modifier for all other stats
    };

    static calculateLevel(xp) {
        return Math.floor(xp / Pokemon.XP_PER_LEVEL) + 1;
    }

    static fromBase64(base64) {
        const { id, meta } = JSON.parse(atob(base64));
        return new this(id, meta);
    }

    static natureModifierFor(statName, nature) {
        if (!nature || !natures[nature]) return 1; // Neutral nature
        const natureEffects = natures[nature];
        if (natureEffects.plus === statName) return 1.1; // Boosted stat
        if (natureEffects.minus === statName) return 0.9; // Reduced stat
        return 1; // No effect
    }

    constructor(id, meta) {
        super()

        this.id = id;
        this.meta = meta;
        this._pokemon = pokemons[id];
        this.stats = this._calculateTotalStat();
    }

    get name() {
        return this._pokemon.name
    }

    get types() {
        return this._pokemon.types
    }

    get level() {
        const xp = this.meta.xp;
        return Pokemon.calculateLevel(xp); // Level starts at 1
    }

    get isFainted() {        
        const hp = "state" in this
            ? this.state.stats.get("hp")
            : this.meta.stats?.hp;
        return hp === 0
    }

    isTypeOf(type) {
        return this.types.includes(type);
    }

    effectiveness(type) {
        if (type instanceof Move) {
            if(type.damage) return 1
            type = type.type
        }

        if (!type) return 1
        let effectiveness = 1;
        this.types.forEach(tType => {
            if (typeChart[type] && typeChart[type][tType]) {
                effectiveness *= typeChart[type][tType];
            }
        });
        return effectiveness;
    }

    toBase64() {
        return btoa(JSON.stringify({ id: this.id, meta: this.meta }));
    }

    tokensUsed() {
        return Object.keys(this.meta.token_used)
            .reduce((acc,stat) => acc + this.meta.token_used[stat], 0)
    }
    
    tokensRemaining() {
        return (this.level * Pokemon.TOKEN_PER_LEVEL) - this.tokensUsed()
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
              ((8 * baseStat + iv + Math.floor(ev / 4)) * this.level) / 100 + this.level + 10
            );
          }
          else if (statName === "spe") {
              stats[statName] = this.level * 0.25
          }
          else {
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

            // Use the dynamic token modifier, fallback to default if not specified
            const tokenModifier = Math.pow(
                Pokemon.TOKEN_MODIFIERS[statName] || Pokemon.TOKEN_MODIFIERS.default,
                this.meta.token_used[statName] ?? 0
            );

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
        this.hit = 0
        this._move = moves[id];
        Object.assign(this, this._move)
    }

    effectiveness(type) {
        if (type instanceof Move) {
            if(type.damage) return 1
            type = type.type
        }
        if (!this.type) return 1
        return typeChart[this.type][type] || 1
    }
    
    description(short = false) {
        const desc = movesText[this.id]
        const key = short ? "shortDesc" : "desc"
        return desc[key] ?? desc.shortDesc
    }
    
    healRate() {
        return this.heal[0] / this.heal[1]
    }

    drainRate() {
        return this.drain[0] / this.drain[1]
    }
    
    recoilRate() {
        return this.recoil[0] / this.recoil[1]
    }

    drainDamage(damage) {
        return Math.max(1, damage * this.drainRate())
    }

    recoilDamage(damage) {
        return Math.max(1, damage * this.recoilRate())
    }
}
