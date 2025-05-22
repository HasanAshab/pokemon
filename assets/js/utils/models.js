import pokemons from "../../../data/pokemons.js"
import moves from "../../../data/moves.js"
import abilities from "../../../data/abilities.js"
import items from "../../../data/items.js"
import typeChart from "../../../data/types.js"
import natures from "../../../data/natures.js"
import movesText from "../../../data/moves_text.js"
import { weightedRandom } from "./helpers.js";


class PSPokemon {
    get maxhp() {
        return this.stats.hp
    }
    
    get baseMaxhp() {
        return this.maxhp
    }
    
    get hp() {
        return this.state.stats.get("hp") ?? null
    }

    hasAbility(ability) {
        return this.abilities.has(ability)
    }

    getWeight() {
        return this._pokemon.weightkg * 10;
    }

    addVolatile(name) {
        this.state.effects.add(name)
    }
    
    hasType(...args) {
        return this.isTypeOf(...args)
    }
    
    getStat(name) {
        return this.state.stats.get(name)
    }
    
    trySetStatus(effect, target) {
        this.state.effects.add(null, effect)
        target && console.log(`${this.name}: ${target.name}'s ability caused ${effect}`)
    }
}

export class Pokemon extends PSPokemon {
    static XP_PER_LEVEL = 100;
    static TOKEN_PER_LEVEL = 2

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

    constructor(id, meta = {}, tag = null) {
        super()
        this.id = id;
        this.meta = Object.assign({
          nature: 'calm',
        }, meta);
        
        this.meta.token_used = Object.assign({
          "hp":0,
          "spe":0,
          "atk":0,
          "def":0,
          "spa":0,
          "spd":0
        }, meta.token_used)

        
        
        this._pokemon = pokemons[id];
        this._tag = tag;
        this.tokens = this.meta.token_used
        this.items = new ItemManager(this)
        this.abilities = new AbilityManager(this)
    }
    
    get megaId() {
        return this.id + this.meta.mega.suffix
    }

    get name() {
        return this.meta.name ?? this._pokemon.name
    }

    get types() {
        return [ ... new Set([ ...this._pokemon.types, ...(this.meta.types ?? [])]) ]
    }

    get level() {
        const xp = this.meta.xp ?? 0;        
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
        if (type.damage) return 1
        type = type.type
      }
      
      if (this.types.some(tType => typeChart[type]?.[tType] === 0.25))
        return 0
      return 1
      
      // no effects ...

        if (!type) return 1
        let effectiveness = 1;
        this.types.forEach(tType => {
            if (typeChart[type] && typeChart[type][tType]) {
                effectiveness *= typeChart[type][tType];
            }
        });
        return effectiveness;
    }
    
    getSTAB(move) {
        return this.isTypeOf(move.type) ? 1.4 : 1;
    }
    
    cp() {
      let total = 0
      for (const stat in this.stats) {
        const statValue = this.stats[stat]
        total += statValue
      }
      return Math.round(total)
    }
    
    hasMegaForm() {
        return this.megaId in pokemons
    }
    
    isMegaForm() {
        return this._pokemon === pokemons[this.megaId]
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
    
    megaEvolve() {
        if (!this.hasMegaForm()) return false
        this._pokemon = pokemons[this.megaId];
        if ("state" in this) {
            this.state.stats.refresh()
        }
        return true
    }
    
    megaDevolve() {
        if (!this.isMegaForm()) return false
        this._pokemon = pokemons[this.id];
        if ("state" in this) {
            this.state.stats.refresh()
        }
        return true
    }
    
    movesMeta() {
        return this.isMegaForm() 
            ? this.meta.mega.moves
            : this.meta.moves
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
            tokenStats[statName] = this.tokens[statName]
        });
        return tokenStats;
    }      
    get stats() {
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
    hits = 1
    succeed = true

    constructor(id) {
        this.id = id;
        this._move = moves[id];
        Object.assign(this, this._move)
    }
    
    get isNeverFails() {
        return this.accuracy === true || this.category === "Status" || !this.flags.twoturn
    }
    
    exists() {
      return !!this._move
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
        if (!desc) return "No description available"
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

    try(user, target, move) {
        let succeed = this.isNeverFails
        try {
            succeed = this.onTryMove(user, target, move) !== null
        }
        finally {
            if (succeed) return true
            // Calculate the effective accuracy
            const effectiveAccuracy = this.accuracy * user.state.stats.get("accuracy");
    
            // Generate a random number between 0 and 100
            const randomChance = Math.random() * 100;
    
            // Check if the move succeeds
            return randomChance <= effectiveAccuracy;
        }
    }
    
    multiHit() {
        if(!this.multihit)
            return 1
        if (!Array.isArray(this.multihit))
            return this.multihit;
        // Specific probabilities for multi-hit moves like Fury Attack
        if (this.multihit[0] === 2 && this.multihit[1] === 5) {
            const probabilities = [2, 3, 4, 5];
            const weights = [3 / 8, 3 / 8, 1 / 8, 1 / 8];
            return weightedRandom(probabilities, weights);
        }
        return Math.floor(Math.random() * (this.multihit[1] - this.multihit[0] + 1)) + this.multihit[0];
    }
}

class Ability {
    constructor(name, isHidden, manager) {
        this.name = name
        this.isHidden = isHidden
        this.manager = manager
        this.pokemon = manager.pokemon
        this._ability = abilities[this.id]
    }
    
    get id() {
        return this.name.toLowerCase().replace(/\s+/g, '');
    }
    
    isImmune(effect) {
        const status = { id: effect }
        if ("onTryAddVolatile" in this._ability) {
          return this._ability.onTryAddVolatile(status, this.manager.pokemon) === null
        }
        return false
    }

    setDamageModifier(move) {
        const handlers = {
          "Physical": "onModifyAtk",
          "Special": "onModifySpA"
        }
        const ctx = {
            chainModify: (modifier) => {              
                this.pokemon.state.damage.chainModify(modifier)
            },
            debug: console.log
        }        
        const opponent = this.pokemon.state.battle.opponentOf(this.pokemon)
        this._ability[handlers[move.category]]?.call(ctx, null, this.pokemon, opponent, move)
    }

    _subscribeListeners() {
        if (!this.pokemon.state)
            throw new Error("Pokemon state is null")

        this.pokemon.state.on('start', () => {
            try {
                this._ability.onStart?.(this.manager.pokemon)
            }
            catch (e) {
              console.log(e)
            }
        })

        this.pokemon.state.on('scene', move => {
            try {
              this.setDamageModifier(move)
            }
            catch (e) {
              console.log(e)
            }
        })
        
        this.pokemon.state.on('turn', battle => {
            try {
              this._ability.onTurn?.(this.manager.pokemon, battle)
            }
            catch (e) {
              console.log(e)
            }
        })
        
        this.pokemon.state.on('using-move', move => {
            try {
              this._ability.onModifyMove?.(move)
            }
            catch (e) {
              console.log(e)
            }
        })

        this.pokemon.state.on('contacted', contactor => {
            try {
                const ctx = {
                    checkMoveMakesContact: () => true,
                    randomChance(numerator, denominator) {
                        return Math.floor(Math.random() * denominator) < numerator;
                    },
                    damage: (amount) => {
                        contactor.state.decreaseHealth(amount)
                        console.log(`${contactor.name}: ${this.pokemon.name}'s ability caused ${amount} damage`)
                    }
                }
                this._ability.onDamagingHit?.call(
                    ctx,
                    null,
                    this.pokemon,
                    contactor,
                    null
                )
            }
            catch (e) {
              console.log(e)
            }
        })   
    }
}

class AbilityManager {
    constructor(pokemon) {
        this.pokemon = pokemon
        this._rawAbilities = { ... pokemon._pokemon.abilities, ...(pokemon.meta.abilities || []) };                
        this._setAbilities(this._rawAbilities)
    }

    names() {
      return this._abilities.map(ab => ab.name)
    }
    
    has(name) {
        return this._abilities.includes(name)
    }
    
    isEnabled() {
        return true // its always enabled
        return this.pokemon.level >= 36
    }

    isImmune(effect) {
        return this._abilities.some(ability => ability.isImmune(effect))
    }
    
    onTryBoost() {
        return this._abilities.forEach(ability => ability._ability.onTryBoost?.(...arguments))
    }

    activate() {      
        this._abilities.forEach(ability => ability._subscribeListeners())
    }
    
    _setAbilities(abilities) {
      this._abilities = []
        for (const [key, name] of Object.entries(abilities)) {
          const isHidden = key === 'H'
          const ability = new Ability(name, isHidden, this)
          this._abilities.push(ability)
        }
    }
}

class Item {
    static exists(id) {
      return id in items
    }
  
    constructor(id, manager) {
        this.id = id
        this.manager = manager
        this.pokemon = manager.pokemon
        this._item = items[this.id]
        Object.assign(this, this._item)
        this._apply()
    }
    
    _apply() {
        if ("tokens" in  this._item) {
            for (const key in this._item.tokens) {
                this.pokemon.tokens[key] += this._item.tokens[key]
            }
        }
    }
}

class ItemManager {
    constructor(pokemon) {
        this.pokemon = pokemon
        this._items = (pokemon.meta.items || []).filter(id => {
            if (Item.exists(id)) return true
            console.log(`${pokemon.name} has invalid item: ${id}`)
            return false
        }).map(id => {
            return new Item(id, this)
        })
    }
    
    names() {
      return this._items.map(item => item.id)
    }
}

