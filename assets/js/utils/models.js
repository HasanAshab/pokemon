import pokemons from "../../../data/pokemons.js"
import moves from "../../../data/moves.js"
import abilities from "../../../data/abilities.js"
import items from "../../../data/items.js"
import typeChart, { CHART_MAP } from "../../../data/types.js"
import natures from "../../../data/natures.js"
import movesText from "../../../data/moves_text.js"
import { sumObj, modObj, weightedRandom } from "./helpers.js";


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
        return this.abilities.isActive(ability)
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
        target && abilitiesPopupQueue.add(`ability caused ${effect} to opponent`, target._tag)
    }

    getMoveHitData(move) {
        return {
            crit: !!move.hit?.criticalCount(),
        }
    }
}

export class Pokemon extends PSPokemon {
    static XP_PER_LEVEL = 100;
    static TOKEN_PER_LEVEL = 2

    static calculateLevel(xp) {
        return Math.floor(xp / Pokemon.XP_PER_LEVEL) + 1;
    }

    static fromBase64(base64, tag = null) {
        const { id, meta } = JSON.parse(atob(base64));
        return new this(id, meta, tag);
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
          nature: 'serious',
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
        
        const jinchuriki = this.abilities.jinchuriki()
        if (!jinchuriki)
            return 1
    
        if (!type) return 1
        let effectiveness = 1;
        jinchuriki._beast.types.forEach(tType => {
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
    
    clone() {
        return Pokemon.fromBase64(this.toBase64());
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
    
    toSageMode(sixPath = false) {
        const bonusRate = sixPath ? 0.7 : 0.5
        const maping = {
            "hp": "spe",
            "spe": "hp",
            "atk": "spa",
            "def": "spd",
            "spa": "atk",
            "spd": "def"
        }
        let hp = 0
        for (const [stat1, stat2] of Object.entries(maping)) {
            const bonus = this.stats[stat2] * bonusRate
            if (stat1 === "hp") {
                hp = bonus
            }
            this.tokens[stat1] += bonus
        }
        this.state.increaseHealth(hp)
        sixPath && this.state.addMove("$voidbomb")
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
    succeed = true
    effectType = "Move"

    constructor(id) {
        this.id = id;
        this._move = moves[id];        
        this._ref = JSON.parse(JSON.stringify(this._move))
        Object.assign(this, this._move)
    }
    
    get isNeverFails() {
        return this.accuracy === true || this.category === "Status" || !this.flags.twoturn
    }
    get hits() {
        return 'hit' in this ? this.hit.hitCount() : 1
    }

    get retreat() {
        const mod = this._user?.state?.retreatModifier(this) ?? 1
        return this._ref.retreat * mod
    }

    set retreat(value) {
        this._ref.retreat = value
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
        
        let effectiveness = typeChart[this.type][type] ?? 1
        const abilitiesMap = {
          "Fire": "blueflame",
          "Electric": "purplethunder"
        }        

        if (this._user.abilities.isActive(abilitiesMap[this.type]) && effectiveness < 1) {
          effectiveness = effectiveness === CHART_MAP.immune 
            ? CHART_MAP.half
            : 1
        }
        if (this._target.abilities.isActive(abilitiesMap[type]) && effectiveness > 1) {
          effectiveness = 1
        }        
        return effectiveness
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
    static BEAST_STATS_INHERIT_PERCENTAGE = 30

    constructor(name, isHidden, manager) {
        this.name = name
        this._ability = abilities[this.id]
        this._listeners = {}
        this.isHidden = isHidden
        this.manager = manager
        this.pokemon = manager.pokemon
        this.active = this._ability.flags?.autoenable === 1
        
        if (this._ability.type === "beast") {
            const beastMeta = structuredClone(this.pokemon.meta)            
            beastMeta.name = `${this._ability.beastImage} (${this.pokemon.name})`
            beastMeta.token_used = {}
            beastMeta.items = []
            beastMeta.abilities = []
            this._beast = new Pokemon(this._ability.beastImage, beastMeta, this.pokemon._tag)
        }
    }
    
    get id() {
        return this.name.toLowerCase().replace(/\s+/g, '');
    }

    activate() {
        if (this.active) return
        this.active = true
        this.onActivate()
        this._ability.onActivate?.(this.pokemon, this.pokemon.state.battle.opponentOf(this.pokemon), this.pokemon.state.battle)
        this._subscribeListeners()
    }

    deactivate() {
        if (!this.active) return
        this.active = false
        this.onDeactivate()
        this._ability.onDeactivate?.(this.pokemon, this.pokemon.state.battle.opponentOf(this.pokemon))
        this._unsubscribeListeners()
    }

    toggle() {
        if (this.active) {
            this.deactivate()
        } else {
            this.activate()
        }
    }
    
    isImmune(effect) {
        const status = { id: effect }
        if ("onTryAddVolatile" in this._ability) {
          return this._ability.onTryAddVolatile(status, this.manager.pokemon) === null
        }
        return false
    }

    setDamageModifiers(move, opponentMove) {
        const handlers = {
          "Physical": "onModifyAtk",
          "Special": "onModifySpA"
        }
        const oppHandlers = {
          "Physical": "onModifyOpponentAtk",
          "Special": "onModifyOpponentSpA"
        }
        const makeCtx = self => ({
            chainModify: (modifier) => {
                self.state.damage.chainModify(modifier)
            },
        })
        const opponent = this.pokemon.state.battle.opponentOf(this.pokemon)
        this._ability[handlers[move.category]]?.callWithExtraCtx(makeCtx(this.pokemon), null, this.pokemon, opponent, move, opponentMove)
        this._ability[oppHandlers[opponentMove.category]]?.callWithExtraCtx(makeCtx(opponent), null, opponent, this.pokemon, opponentMove, move)
    }

    onActivate() {
      if (this._ability.dependencies) {
          for (const dependency of this._ability.dependencies) {
              if (!this.pokemon.abilities.has(dependency)) {
                abilitiesPopupQueue.add(`${this.id}: requires ${dependency}`, this.pokemon._tag)
                return this.deactivate()
              }
              else this.pokemon.abilities.activate(dependency)
          }
      }

      if (this._beast) {
          this._beastInheritedStats = {}
          this._beastInheritedTypes = []

          for (const stat in this._beast.stats) {
              this._beastInheritedStats[stat] = this._beast.stats[stat] * Ability.BEAST_STATS_INHERIT_PERCENTAGE / 100
          }
          this.pokemon.tokens = sumObj(this.pokemon.tokens, this._beastInheritedStats)
          "hp" in this._beastInheritedStats && this.pokemon.state.increaseHealth(this._beastInheritedStats.hp)

          for (const type of this._beast.types) {
              if (this.pokemon.hasType(type)) continue
              this.pokemon.meta.types.push(type)
              this._beastInheritedTypes.push(type)
          }          
      }
    }

    onDeactivate() {
      this._ability.dependencies?.forEach(dependency => this.pokemon.abilities.deactivate(dependency))
      if (this._beastInheritedStats) {
          "hp" in this._beastInheritedStats && this.pokemon.state.decreaseHealth(this._beastInheritedStats.hp, true)
          this.pokemon.tokens = sumObj(this.pokemon.tokens, modObj(this._beastInheritedStats, -1))
          this.pokemon.meta.types = this.pokemon.meta.types.filter(t => !this._beastInheritedTypes.includes(t))
        }
    }

    _subscribeListeners() {
        if (!this.pokemon.state)
            throw new Error(`${this.pokemon.name} has no state`)

        this._listeners.start = () => {
            try {
                this._ability.onStart?.(this.manager.pokemon)
            }
            catch (e) {
              console.log(e)
            }
        }
        this._listeners["scene-end"] = () => {
            this._ability._shouldDeactivate && this.deactivate()
        }
        this._listeners.wave = () => {
            try {
                this._ability.onWave?.(this.pokemon, this.pokemon.state.battle.opponentOf(this.pokemon), battle)
            }
            catch (e) {
              console.log(e)
            }
        }
        this._listeners.turn = (battle) => {
            try {
              const opponent = this.pokemon.state.battle.opponentOf(this.pokemon)
              this._ability.onTurn?.(this.pokemon, opponent, battle)
            }
            catch (e) {
              console.log(e)
            }
        }
        this._listeners["using-move"] = (move, opponentMove) => {
            try {
              this._ability.onModifyMove?.(move, this.pokemon, this.pokemon.state.battle.opponentOf(this.pokemon))
              this._ability.onModifyOpponentMove?.(opponentMove, this.pokemon, this.pokemon.state.battle.opponentOf(this.pokemon))
              this._ability.onUsingMove?.(move, opponentMove)
              this.setDamageModifiers(move, opponentMove)
            }
            catch (e) {
              console.log(e)
            }
        }
        this._listeners["hittee-move"] = move => {
            try {
              this._ability.onHit?.(this.pokemon, this.pokemon.state.battle.opponentOf(this.pokemon), move)
            }
            catch (e) {
              console.log(e)
            }
        }
        this._listeners["contacted"] = (contactor) => {
            try {
                this._ability.onDamagingHit?.callWithExtraCtx(
                    { _contacted: true },
                    null,
                    this.pokemon,
                    contactor,
                    null
                )
            }
            catch (e) {
              console.log(e)
            }
        }
        Object.keys(this._listeners).forEach(event => {
            this.pokemon.state.on(event, this._listeners[event])
        })
    }

    _unsubscribeListeners() {
        Object.keys(this._listeners).forEach(event => {
            this.pokemon.state.removeListener(event, this._listeners[event])
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

    actives() {
      return this._abilities.filter(ab => ab.active)
    }
    
    has(name) {
        return this._abilities.some(ab => ab.name === name)
    }

    activate(name) {
        this._abilities.find(ab => ab.name === name).activate(name)
    }

    deactivate(name) {
        this._abilities.find(ab => ab.name === name).deactivate(name)
    }

    toggle(name) {
        this._abilities.find(ab => ab.name === name).toggle()
    }
    
    isEnabled() {
        return true // its always enabled
        return this.pokemon.level >= 36
    }

    isActive(nameOrRegex) {
        return this.actives().some(ab => ab.name === nameOrRegex || ab.name.match(nameOrRegex))
    }

    retreatCost() {
        return this.actives().reduce((acc, ability) => acc + ability._ability.retreat, 0)
    }

    canUseMove(move) {
        return this.actives().every(ability => ability._ability.canUseMove?.(move) ?? true)
    }

    isImmune(effect) {
        return this.actives().some(ability => {
          if (ability.isImmune(effect)) {
            abilitiesPopupQueue.add(`${ability.id}: ${effect} avoided`, this.pokemon._tag)
            return true
          }
          return false
        })
    }
    
    jinchuriki() {      
        return this.actives().find(ab => !!ab._beast) ?? null
    }

    hasSixPath() {
        return this.actives().filter(ab => ab._ability.type === "path").length >= 6
    }

    onTryBoost() {
        return this.actives().forEach(ability => ability._ability.onTryBoost?.(...arguments))
    }
    onTryBoostOpponent() {
        return this.actives().forEach(ability => ability._ability.onTryBoostOpponent?.(...arguments))
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

export class Item {
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
        
        if ("tokensPercent" in  this._item) {
            for (const key in this._item.tokensPercent) {
                this.pokemon.tokens[key] += Math.round(this.pokemon.stats[key] * (this._item.tokensPercent[key] / 100))
            }
        }
    }

    _unappply() {
        if ("tokens" in  this._item) {
            for (const key in this._item.tokens) {
                this.pokemon.tokens[key] -= this._item.tokens[key]
            }
        }
        
        if ("tokensPercent" in  this._item) {
            for (const key in this._item.tokensPercent) {
                this.pokemon.tokens[key] -= Math.round(this.pokemon.stats[key] * (this._item.tokensPercent[key] / 100))
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

    remove(id) {
        const item = this._items.find(item => item.id === id)
        item._unappply()
        this._items = this._items.filter(item => item.id !== id)
    }
}

