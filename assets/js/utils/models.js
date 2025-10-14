import pokemons from "../../../data/pokemons.js"
import moves from "../../../data/moves.js"
import abilities from "../../../data/abilities.js"
import items from "../../../data/items.js"
import typeChart, { CHART_MAP } from "../../../data/types.js"
import natures from "../../../data/natures.js"
import movesText from "../../../data/moves_text.js"
import { sumObj, modObj, weightedRandom } from "./helpers.js";


const SAGE_MAPING = {
    "hp": "spe",
    "spe": "hp",
    "atk": "spa",
    "def": "spd",
    "spa": "atk",
    "spd": "def"
}


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

    getUndynamaxedHP() {
        return this.hp
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
        if (natureEffects.plus === statName) return 1.2; // Boosted stat
        if (natureEffects.minus === statName) return 0.8; // Reduced stat
        return 1; // No effect
    }

    constructor(id, meta = {}, tag = null) {
        super()
        this.id = id;
        this.meta = Object.assign({
          nature: 'none',
        }, meta);   
     
        // Warning: Token_Used Feature is now Deprecated and removed
        // this.meta.token_used = Object.assign({
        //   "hp":0,
        //   "spe":0,
        //   "atk":0,
        //   "def":0,
        //   "spa":0,
        //   "spd":0
        // }, meta.token_used)
        
        this._pokemon = pokemons[id];
        this._tag = tag;
        this._beastTypes = []
        this.tokens = {
          "hp":0,
          "spe":0,
          "atk":0,
          "def":0,
          "spa":0,
          "spd":0
        }
        
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

    get isHuman() {
        return !["entity", "beast"].includes(this._pokemon.type)
    }

    isTypeOf(type) {
        return this.types.includes(type) || this._beastTypes.includes(type);
    }

    effectiveness(type) {
        if (type instanceof Move) {
          if (type.damage) return 1
          type = type.type
        }
        
        let effectiveness = 1;
        if (!type) return effectiveness
        
        const effectableTypes = this.isHuman 
          ? this._beastTypes
          : this.types

        effectableTypes.forEach(tType => {
            if (typeChart[type] && typeChart[type][tType]) {
                effectiveness *= typeChart[type][tType];
            }
        });        
        
        return effectiveness;
    }
    
    cp() {
      let total = 0
      for (const stat in this.stats) {
        const statValue = this.stats[stat]
        total += statValue
      }
      return Math.round(total)
    }

    baseCP() {
      let total = 0
      for (const stat in this._pokemon.baseStats) {
        const statValue = this._pokemon.baseStats[stat]
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

    canMorph() {
        const morph = this._pokemon.morph
        if (!morph) return false
        const { level = 0, hp = 100 } = morph.requires ?? {}
        return this.level >= level
          && ((this.hp * 100) / this.maxhp) <= hp
    }

    morph() {
        if (!this.canMorph())
            throw new Error(`Cannot morph ${this.name}`)
        const morphId = this._pokemon.morph.to
        const oldMaxHp = this.maxhp
        this._pokemon = pokemons[morphId]
        this.state.increaseHealth(this.maxhp - oldMaxHp)
        this.abilities.reset()
        this.items.reset()
        this.state.armor.reset()
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
        
        let oldMaxHp
        if ("state" in this)
            oldMaxHp = this.maxhp

        this._pokemon = pokemons[this.megaId];        

        if ("state" in this) {
            this.state.increaseHealth(this.maxhp - oldMaxHp)
            this.state.armor.reset()
        }
        this.abilities.reset()
        this.items.reset()
        return true
    }

    toSageMode(sixPath = false) {
        let bonusRate = sixPath ? 0.4 : 0.15

        const sourceMove = this.state.moves.find(m => m.id === (sixPath ? 'sageofsixpaths' : 'sagemode'));
        if (!sourceMove)
          throw new Error(`${this.name} can't be sage.`);

        bonusRate += ((sourceMove._meta.grade || 0) * 5) / 100  

        this._sageBonus = { hp: 0 }
        for (const [stat1, stat2] of Object.entries(SAGE_MAPING)) {
            this._sageBonus[stat1] = this.stats[stat2] * bonusRate
            this.tokens[stat1] += this._sageBonus[stat1]
        }
        this.state.increaseHealth(this._sageBonus.hp)
        sixPath && this.state.addMove("$voidbomb")
    }

    exitSageMode() {
        for (const [stat1, stat2] of Object.entries(SAGE_MAPING)) {
            this.tokens[stat1] -= this._sageBonus[stat1]
        }
        this.state.decreaseHealth(this._sageBonus.hp, true)
        this.state.removeMove("$voidbomb")
    }

    megaDevolve() {
        if (!this.isMegaForm()) return false
        this._pokemon = pokemons[this.id];
        return true
    }

    prevImage() {
        for (const id in pokemons) {
            const pokemon = pokemons[id]
            if (pokemon.evos.includes(this.name))
                return id
        }
        return null
    }
    
    movesMeta() {
        return this.meta.moves
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

    constructor(id, meta = {}) {
        this.id = id;
        this._meta = meta
        this._move = moves[id];
        if (!this._move) {
            console.log(`Invalid move: ${id}`);
            this._move = moves["staythere"];
        }
        this._ref = JSON.parse(JSON.stringify(this._move))
        Object.assign(this, this._move)
        this._reducedCapacity = 0
    }

    get capacity() {
        if (this._move.capacity === Infinity || this._move.capacity === 1)
            return this._move.capacity
        return Math.round(this._move.capacity * Math.pow(1.5, this._meta.grade || 0)) - this._reducedCapacity
    }

    set capacity(value) {
        this._move.capacity = value
    }

    reduceCapacity(value = 1) {
        this._reducedCapacity += value
    }
    
    resetCapacity() {
        this._reducedCapacity = 0
    }
  
    get isNeverFails() {       
        if ('onTryMove' in this || 'onTryImmunity' in this)
            return false
        return this.accuracy === true || this.category !== "Status"
    }
    get hits() {
        return 'hit' in this ? this.hit.hitCount() : 1
    }

    get retreat() {
        const mod = this._user?.state?.retreatModifier(this) ?? 1
        return parseFloat(parseFloat(this._ref.retreat * mod).toFixed(2))
    }

    set retreat(value) {
        this._ref.retreat = value
    }

    effectiveness(type) {
        if (type instanceof Move) {
            if(type.damage || type.flags.noeffect || type.category === "Status") return 1
            type = type.type
        }
        if (!this.type) return 1
        
        let effectiveness = typeChart[this.type][type] ?? 1
        const abilitiesMap = {
          "Fire": "blueflame",
          "Electric": "purplethunder"
        }

        if (!this._user || !this._target) {
          const noProb = ["staythere", "dodge", "block"]
          !noProb.includes(this.id) && console.warn(this.id + ": Move has no user or target. Some features may not work properly.");
          return effectiveness
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
        const key = short ? "shortDesc" : "desc"
        let genMsg = "No description available" 
        if (Array.isArray(this.multihit))
            genMsg = `Hits ${this.multihit[0]} to ${this.multihit[1]} times.`
        else if (this.multihit)
            genMsg = `Hits ${this.multihit} times.`

        const msg = desc?.[key] ?? desc?.shortDesc ?? genMsg
        return msg
    }

    healRate() {
        return this.heal[0] / this.heal[1]
    }
    
    targetHealRate() {
        return this.healTarget[0] / this.healTarget[1]
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

    _try(user, target, move) {
        if (this.isNeverFails)
          return true        

        if (this.onTryMove && this.onTryMove(user, target, move) === null)
          return false
          
        if (this.onTryImmunity?.(user, target) === true)
          return false
        
        if (this.accuracy === true)
          return true
           
        // Calculate the effective accuracy
        const effectiveAccuracy = this.accuracy * user.state.stats.get("accuracy");
        
        // Generate a random number between 0 and 100
        const randomChance = Math.random() * 100;

        // Check if the move succeeds
        return randomChance <= effectiveAccuracy;
    }

    try(user, target, move) {
        const succeed = this._try(user, target, move)
        !succeed && console.log(`${user.name}: ${this.name} failed!`)
        return succeed
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
        this.active = false
        setTimeout(() => {
          if (this._ability.flags?.autoenable === 1 || !this.pokemon.isHuman) { 
              if ('state' in this.pokemon) {
                this.activate()
                this.pokemon.state.once("fainted", () => this.deactivate())
              }
          }
        }, 200)
    }
    
    get id() {
        return this.name.toLowerCase().replace(/\s+/g, '');
    }

    activate() {
        const chakra = this._ability.retreat / 2
        if (this.active || this.pokemon.state.retreat < chakra) 
          return null
        this.pokemon.state.retreat -= chakra
        this.active = true
        this.onActivate()
        this.pokemon.state.foeTeam.forEach(p => {
          this._ability.onActivate?.(this.pokemon, p, this.pokemon.state.battle)
        })
        this._subscribeListeners()
    }

    deactivate() {
        if (!this.active) return
        this.active = false
        this.onDeactivate()
        this.pokemon.state.foeTeam.forEach(p => {
          this._ability.onDeactivate?.(this.pokemon, p, this.pokemon.state.battle)
        })
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

      if (!this._beast && this.pokemon.isHuman) {
          if (this._ability.type === "beast" && this._ability.beastImage !== false) {
              const summoningMove = this.pokemon.state.moves.find(m => m.id === `summon:${this._ability.beastImage}`)
              if (!summoningMove) {
                throw new Error(`Beast summoning move ${this._ability.beastImage} not found`)
              }
              const level = (summoningMove._meta.grade || 0) * 3
              const xp = (level * 100) - 1
              const beastMeta = structuredClone(this.pokemon.meta)  
              beastMeta.xp = xp          
              beastMeta.name = `${this._ability.beastImage} (${this.pokemon.name})`
              beastMeta.token_used = {}
              beastMeta.items = []
              beastMeta.abilities = []              
              this._beast = new Pokemon(this._ability.beastImage, beastMeta, this.pokemon._tag)
          }
      }

      if (this._beast) {
          this._beastInheritedStats = {}
          this._beastInheritedTypes = []
          for (const stat in this._beast.stats) {
              this._beastInheritedStats[stat] = this._beast.stats[stat] * Ability.BEAST_STATS_INHERIT_PERCENTAGE / 100
          }
          this.pokemon.tokens = sumObj(this.pokemon.tokens, this._beastInheritedStats)
          "hp" in this._beast.stats && this.pokemon.state.increaseHealth(this._beast.stats.hp)

          for (const type of this._beast.types) {
              if (this.pokemon.hasType(type)) continue
              this.pokemon.meta.types.push(type)
              this.pokemon._beastTypes.push(type)
              this._beastInheritedTypes.push(type)
          }
      }
    }

    onDeactivate() {
      this._ability.dependencies?.forEach(dependency => this.pokemon.abilities.deactivate(dependency))
      if (this._beast) {
          "hp" in this._beastInheritedStats && this.pokemon.state.decreaseHealth(this._beastInheritedStats.hp, true)
          this.pokemon.tokens = sumObj(this.pokemon.tokens, modObj(this._beastInheritedStats, -1))
          this.pokemon.meta.types = this.pokemon.meta.types.filter(t => !this._beastInheritedTypes.includes(t))
          this.pokemon._beastTypes = this.pokemon._beastTypes.filter(t => !this._beastInheritedTypes.includes(t))
          this._beastInheritedStats = {}
          this._beastInheritedTypes = []
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
            this._ability.onSceneEnd?.(this.pokemon, this.pokemon.state.battle.opponentOf(this.pokemon))
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
        this._listeners.scene = () => {
            this._ability.onScene?.(this.pokemon, this.pokemon.state.battle.opponentOf(this.pokemon))
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
        this._listeners["contacted"] = (contactor, move) => {
            try {
                this._ability.onDamagingHit?.callWithExtraCtx(
                    { _contacted: true },
                    null,
                    this.pokemon,
                    contactor,
                    move
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
        this.reset()
    }

    reset() {
        this._rawAbilitiesSet = new Set([
          ...Object.values(this.pokemon._pokemon.abilities),
          ...(this.pokemon.meta.abilities || [])
        ]);
        this._rawAbilities = { ...Array.from(this._rawAbilitiesSet) };                      
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
        const oldStats = this.pokemon.stats
        if ("tokensPercent" in  this._item) {
            for (const key in this._item.tokensPercent) {              
                this.pokemon.tokens[key] += Math.round(oldStats[key] * (this._item.tokensPercent[key] / 100))
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
        this.reset()
    }

    names() {
      return this._items.map(item => item.id)
    }

    remove(id) {
        const item = this._items.find(item => item.id === id)
        item._unappply()
        this._items = this._items.filter(item => item.id !== id)
    }

    reset() {
      if (this.items)
        this._items.forEach(item => this.remove(item.id))

      this._rawItems = Array.from(
            new Set([
                ...(this.pokemon._pokemon.items || []),
                ...(this.pokemon.meta.items || [])
            ])
        )
        this._items = this._rawItems.filter(id => {
            if (Item.exists(id)) return true
            console.log(`${this.pokemon.name} has invalid item: ${id}`)
            return false
        }).map(id => {
            return new Item(id, this)
        })
    }
}

