import db from "./db.js"
import { calculateBurnEffect, calculatePoisonEffect } from "./effects.js"

class BattleState {
    constructor(pokemon) {
        this.pokemon = pokemon;
        this.listeners = {
            onHealthChange: [],
            onEffectAdded: [],
            onEffectRemoved: [],
            onStatChange: []
        };
        this.refresh();
    }

    refresh() {
        this._effects = [];
        this._statChanges = {};
        this._stats = { ...this.pokemon.data.stats };
        this.retreat = this.pokemon.meta.retreat
    }
    
    addWaveRetreat() {
        this.retreat += this.pokemon.meta.retreat
    }

    stats() {
        const calculatedStats = {};
        for (const stat in this._stats) {
            const baseStat = this.pokemon.data.stats[stat];
            const stage = this._statChanges[stat] || 0;
            const multiplier = this._statStageMultiplier(stage);
            calculatedStats[stat] = Math.floor(baseStat * multiplier);
        }
        return calculatedStats;
    }

    statOf(name) {
        const baseStat = this.pokemon.data.stats[name];
        const stage = this._statChanges[name] || 0;
        const multiplier = this._statStageMultiplier(stage);
        return Math.floor(baseStat * multiplier);
    }

    // Health Management
    increaseHealth(amount) {
        const maxHealth = this.statOf("hp"); // Use calculated HP stat
        this._stats.hp = Math.min(this._stats.hp + amount, maxHealth);
        this._trigger("onHealthChange");
    }

    decreaseHealth(amount) {
        this._stats.hp = Math.max(this._stats.hp - amount, 0);
        this._trigger("onHealthChange");
    }

    // Effect Management
    addEffect(effect) {
        if (!this._effects.includes(effect)) {
            this._effects.push(effect);
            this._trigger("onEffectAdded");
        }
    }

    removeEffect(effect) {
        const index = this._effects.indexOf(effect);
        if (index > -1) {
            this._effects.splice(index, 1);
            this._trigger("onEffectRemoved");
        }
    }
    
    decreaseHealthForEffects() {
        let totalDamage = 0;

        this._effects.forEach(effect => {
            if (effect === "burn") {
                totalDamage += calculateBurnEffect(this.pokemon);
            }
            else if (effect === "poison") {
                totalDamage += calculatePoisonEffect(this.pokemon);
            }
        });

        if (totalDamage > 0) {
            this.decreaseHealth(totalDamage);
        }
    }
    
    // Stat Management
    applyStatChange(stat, stages) {
        if (!this._statChanges[stat]) {
            this._statChanges[stat] = 0;
        }

        // Stat stage clamping (-6 to +6)
        const newStage = Math.max(-6, Math.min(6, this._statChanges[stat] + stages));
        const oldStage = this._statChanges[stat];
        this._statChanges[stat] = newStage;

        if (newStage !== oldStage) {
            this._trigger("onStatChange");
        }
    }

    resetStatChanges() {
        this._statChanges = {};
        this._trigger("onStatChange");
    }

    // Listeners
    addListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    removeListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    _trigger(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(this));
        }
    }

    _statStageMultiplier(stage) {
        if (stage > 0) {
            return (2 + stage) / 2; // Positive stages
        } else if (stage < 0) {
            return 2 / (2 - stage); // Negative stages
        } else {
            return 1; // Neutral stage
        }
    }
}

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
        this.state = new BattleState(this)
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
            ((2 * baseStat + iv + Math.floor(ev / 4)) * this.level) / 100 + this.level + 10
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

    async effectiveness(type) {
        const typeMap = await db.types.get(this.type)
        return typeMap[type] || 1
    }
}
