import { Hit } from "./damage.js"
import { capitalizeFirstLetter, camelize, weightedRandom, modObj, sumObj } from "./helpers.js"
import { Move } from "./models.js"


class Effect {
    static immuneTo = []

    static isImmune(pokemon) {
        const abilityTrigger = pokemon.abilities.isEnabled() && pokemon.abilities.isImmune(this.effectName)
        const typeTrigger = (pokemon.isHuman ? pokemon._beastTypes : pokemon.types)
          .some(t => this.immuneTo.includes(t))
        const effectTrigger = pokemon.state.effects.givesImmunity(this.effectName)
        return abilityTrigger || typeTrigger || effectTrigger
    }

    static isPre() {
        return false
    }

    givesImmunity(effectName) {
        return false
    }

    status = {
        canMove: true,
        attackSelf: false,
    }
    
    events = [
        "turn",
        "turn-end",
        "wave",
        "scene",
        "scene-end",
        "used-move",
        "contacted",
    ]
    _listeners = {
        self: {},
        opponent: {},
    }

    constructor(state, source) {
        this.state = state;
        this.source = source;
    }

    setup() {
        this.events.forEach(event => {
            this._subscribeTo(event)
            this._subscribeToOpponent(event)
        })
    }

    teardown() {
        this.events.forEach(event => {
            this._unsubscribeTo(event)
            this._unsubscribeToOpponent(event)
        })
    }

    remove() {
        return this.state.effects.remove(this.constructor.effectName)
    }
    
    canMove() {
        return this.status.canMove
    }

    attackSelf() {
        return this.status.attackSelf
    }
    
    displayMeta() {
        return ""
    }

    canUseMove(move) {
        return true
    }

    canOpponentUseMove(move) {
        return true
    }

    _subscribeTo(event) {
        const listener = this[`on${camelize(capitalizeFirstLetter(event))}`]
        if (listener) {
            this._listeners.self[event] = listener.bind(this)
            this.state.on(event, this._listeners.self[event])
        }
    }
    
    _unsubscribeTo(event) {
        const listener = this._listeners.self[event]
        listener && this.state.removeListener(event, listener)
    }
    
    _subscribeToOpponent(event) {
        const opponent = this.state.battle.opponentOf(this.state.pokemon)
        const listener = this[`onOpponent${camelize(capitalizeFirstLetter(event))}`]
        if (listener) {
            this._listeners.opponent[event] = listener.bind(this)
            opponent.state.on(event, this._listeners.opponent[event])
        }
    }
    
    _unsubscribeToOpponent(event) {
        const opponent = this.state.battle.opponentOf(this.state.pokemon)
        const listener = this._listeners.opponent[event]
        listener && opponent.state.removeListener(event, listener)
    }
}

class ExpirableEffect extends Effect {
    lifetime = { turns: null, waves: null }
    
    setup() {
        super.setup()
        this.lifetime.turns && this.lifetime.turns--
    }
    
    onTurn() {
        if(this.isExpired()) {
            this.remove()
        }
    }

    onTurnEnd() {
        this.lifetime.turns && this.lifetime.turns--
    }

    onWave() {
        this.lifetime.waves && this.lifetime.waves--
        if(this.isExpired()) {
            this.remove()
        }
    }
    
    isExpired() {
        return [null, undefined, 0].includes(this.lifetime.turns)
            && [null, undefined, 0].includes(this.lifetime.waves)
    }
}

class BurnEffect extends Effect {
    static immuneTo = ["Fire"]
    static effectName = "brn"
    
    onScene() {
        const opponent = this.state.battle.opponentOf(this.state.pokemon)
        const shouldReverse = this.state.pokemon.abilities.isActive("mayangan:silver-eye")
            || (!opponent.abilities.isActive("mayangan:selfish-scar:golden") && opponent.abilities.isActive("mayangan:golden-eye"))
        const atkMod = shouldReverse ? 2 : 0.5
        this.state.stats.chainModify("atk", atkMod);
    }

    onTurn() {
        this.state.decreaseHealthNonContact(this._calculateEffectDamage(), "Physical")
    }
    
    _calculateEffectDamage() {
        const effectDamage = Math.floor(this.state.pokemon.maxhp / 16); // 1/16th HP loss
        return effectDamage;
    }
}

class PoisonEffect extends Effect {
    static immuneTo = ["Poison", "Steel"]
    static effectName = "psn"

    onTurn() {
        this.state.decreaseHealth(this._calculateEffectDamage(), true)
    }

    _calculateEffectDamage() {
        const maxHP = this.state.pokemon.stats.hp;
        const poisonDamage = Math.floor(this.state.pokemon.maxhp / 8); // 1/8th HP loss
        return poisonDamage;
    }
}

class AquaRingEffect extends Effect {
    static effectName = "aquaring"

    onScene() {
        this._increaseHealth()
    }
    
    onWave() {
        this._increaseHealth()
    }
    
    _increaseHealth() {
      const effectType = "Water" 
       const isFieldActive = this.state.battle.fields.filter(f => f.type === effectType).length > 0
       const hp = Math.floor(this.state.pokemon.maxhp * (isFieldActive ? 0.13 : 0.03))
       this.state.increaseHealth(hp)
    }
}
class NatureHealingEffect extends Effect {
    static effectName = "naturehealing"

    onScene() {
        this._increaseHealth() 
    }
    
    onWave() {
        this._increaseHealth()
    }
    
    _increaseHealth() {
      const effectType = "Grass" 
       const isFieldActive = this.state.battle.fields.filter(f => f.type === effectType).length > 0
       const hp = Math.floor(this.state.pokemon.maxhp * (isFieldActive ? 0.13 : 0.03))       
       this.state.increaseHealth(hp)
    }
}

class SleepEffect extends ExpirableEffect {
    static effectName = "slp"
    static PRE_CHANCE = 0.30

    static isPre() {
        return Math.random() < SleepEffect.PRE_CHANCE
    }

    setup() {
        super.setup()
        const sleepingTurns = weightedRandom([1, 2, 3, 4], [0.10, 0.30, 0.50, 0.10])
        this.lifetime.turns = sleepingTurns
        this.status.canMove = false
    }

    teardown() {
        super.teardown()
        this.status.canMove = true
    }
}
class  TailWindEffect extends ExpirableEffect {
    static effectName = "tailwind"
    lifetime = { turns: 2 }

    onScene(){
      console.log(this.state.pokemon.name);
      
        this.state.stats.chainModify("spe", 2);
    }
    
}

class FreezeEffect extends ExpirableEffect {
    static immuneTo = ["Ice"]
    static effectName = "frz"
    static THAW_CHANCE = 0.10
    
    _thawChance = FreezeEffect.THAW_CHANCE
    
    setup() {
        super.setup()
        this.status.canMove = false
    }

    teardown() {
        super.teardown()
        this.status.canMove = true
    }
    
    onTurnEnd() {
        this._thawChance += FreezeEffect.THAW_CHANCE
    }
    
    onOpponentUsedMove(move) {
        const thawsTarget = move.thawsTarget || move.type === "Fire"
        if (thawsTarget) {
            this._thawChance = 1
        }
    }
    
    isExpired() {
        return Math.random() < this._thawChance
    }
    
    displayMeta() {
        const frozenPart = Math.round((1 - this._thawChance) * 100)
        return `(${frozenPart}%)`
    }
}

class FlinchEffect extends ExpirableEffect {
    static effectName = "flinch"
    
    static isPre() {
        return true
    }

    lifetime = {
        turns: 1
    }

    setup() {
        super.setup()
        this.status.canMove = false
    }

    teardown() {
        super.teardown()
        this.status.canMove = true
    }
}

class ParalyzeEffect extends Effect {
    static immuneTo = ["Electric", "Ground"]
    static effectName = "par"

    onScene() {
        const opponent = this.state.battle.opponentOf(this.state.pokemon)
        const shouldReverse = this.state.pokemon.abilities.isActive("mayangan:silver-eye")
          || (!opponent.abilities.isActive("mayangan:selfish-scar:golden") && opponent.abilities.isActive("mayangan:golden-eye"))
        
        const speMod = shouldReverse ? 2 : 0.5
        this.state.stats.chainModify("spe", speMod);
    }

    onTurn() {
        this.status.canMove = Math.random() > 0.25
    }

    onTurnEnd() {
        this.status.canMove = true
    }
    
    displayMeta() {
        return !this.status.canMove ? '🔴' : '⚪'
    }
}

class ConfusionEffect extends ExpirableEffect {
    static effectName = "confusion"
    static ATK_SELF_CHANCE = 0.33
    
    setup() {
        super.setup()
        const lifetime = weightedRandom([2, 3, 4, 5], [0.30, 0.50, 0.20, 0.05])
        this.lifetime.turns = lifetime
    }

    onTurn() {
        super.onTurn(...arguments)
        this.status.attackSelf = Math.random() < ConfusionEffect.ATK_SELF_CHANCE
    }

    onTurnEnd() {
        super.onTurnEnd(...arguments)
        this.status.attackSelf = false
    }
    
    teardown() {
        super.teardown()
        this.status.attackSelf = false
    }
    
    displayMeta() {
        return this.status.attackSelf ? '🔴' : '⚪'
    }
}

class LeechSeedEffect extends Effect {
    static immuneTo = ["Grass"]
    static effectName = "leechseed"

    onWave() {
        const opponent = this.state.battle.opponentOf(this.state.pokemon)
        const loosedHp = opponent.stats.hp / 8

        this.state.decreaseHealth(loosedHp, true)
        opponent.state.increaseHealth(loosedHp)
    }
}

class StallEffect extends ExpirableEffect {
    static effectName = "stall"

    static isPre() {
        return true
    }

    lifetime = { turns: 1 }
    
    setup() {
        super.setup()
        this.state.freeze()
    }

    teardown() {
        super.teardown()
        this.state.unfreeze()
    }
}

class PartiallyTrappedEffect extends ExpirableEffect {
    static effectName = "partiallytrapped"

    setup() {
        super.setup()
        const lifetime = weightedRandom([2, 3, 4, 5], [0.20, 0.40, 0.30, 0.10])
        this.lifetime.turns = lifetime
    }

    onTurn() {
        super.onTurn(...arguments)
        this.state.decreaseHealthNonContact(this._calculateEffectDamage(), "Physical")
    }

    canUseMove(move) {
      return !move.flags.contact
    }

    canOpponentUseMove(move) {
      return (this.source && this.source.flags.contact && move.flags.contact)
        || (!this.source?.flags.contact && !move.flags.contact)
    }

    _calculateEffectDamage() {
        const maxHP = this.state.pokemon.stats.hp;
        const trappedDamage = Math.floor(maxHP / 8); // 1/8th HP loss
        return trappedDamage;
    }
}

class DoubleTeamEffect extends ExpirableEffect {
    static effectName = "doubleteam"

    static isPre() {
        return true
    }

    lifetime = { waves: 1 }
    meta = {}

    setup() {
        super.setup()
        this.state.manCount = this._calculateDTManCount()
    }

    teardown() {
        super.teardown()
        this.state.manCount = 1
        this.state.unfreeze()
    }

    onScene(move, senario) {
        move = this._modifyMove(move)
        senario.set(this.state.pokemon, move)

        // Double Team Defence Devided To Each
        const modifier = 1 / this.state.manCount
        this.state.stats.chainModify("def", modifier)
        this.state.stats.chainModify("spd", modifier)
    }

    onSceneEnd() {
        this.meta = {}
        this.state.unfreeze()
    }
    
    onOpponentScene(move) {
        this.meta.totalManHittee = this._totalManHittee(move)
    }

    onContacted(contactor) {
        const isMainManHittee = this.meta.totalManHittee === this.state.manCount
            || contactor === this.state.pokemon

        if (isMainManHittee) {
            return this.remove()
        }

        this.state.manCount -= this.meta.totalManHittee
        this.state.freeze()
    }

    displayMeta() {
        return this.meta.totalManHittee 
            ? `(-${this.meta.totalManHittee})`
            : ''
    }

    _calculateDTManCount() {
        return Math.round(
            this.state.stats.get("spe") * this.state.pokemon.level * (0.06 * 0.17)
        )
    }

    _modifyMove(move) {
        const contactModifier = move.flags.contact ? 0.4 : 1
        move.basePower = move.basePower / (this.state.manCount * contactModifier)
        move.multihit = Array.from({ length: this.state.manCount }).reduce((acc, i) => {
            return acc + move.multiHit()
        }, 0)
        return move
    }
    
    _totalManHittee(move) {
        const isMainManHittee = manCount => Math.random() < ((1 / manCount) * 1.5)
        const manCount = this.state.manCount
        if (move.target.startsWith("allAdjacent")) {
            for (let i = 0; i < manCount; i++) {
                if (!isMainManHittee(manCount - i)) {
                    move.basePower = move.basePower / 2
                }
            }
            return manCount
        }
        for (let i = 0; i < move.hit; i++) {
            if (isMainManHittee(manCount - i)) {
                return manCount
            }
        }
        return Math.min(manCount, move.hits)
    }
}


class ShadowCloneEffect extends Effect {
    static effectName = "shadowclone"
    static COST_PER_CLONE = 2
    meta = {}

    setup() {
        super.setup()
        this.state.manCount = this._calculateManCount() + 1
        this.state.retreat -= (this.state.manCount - 1)  * this.constructor.COST_PER_CLONE
    }

    teardown() {      
        super.teardown()
        this.state.manCount = 1
        this.state.unfreeze()
    }

    onSceneEnd() {
        this.meta = {}
        this.state.unfreeze()
        if (this.state.manCount === 1) {
            return this.remove()
        }
    }

    displayMeta() {
        return this.meta.totalManHittee 
            ? `(-${this.meta.totalManHittee})`
            : ''
    }

    _calculateManCount() {
        const maxChakra = Math.floor(this.state.retreat * 0.5)
        const count = Math.floor(maxChakra / this.constructor.COST_PER_CLONE)
        return count
    }
}

class SageModeEffect extends ExpirableEffect {
    static effectName = "sage"

    setup() {
        super.setup()
        const sageTurns = weightedRandom([5, 7, 12], [0.20, 0.50, 0.30])

        this.lifetime.turns = sageTurns
        this.state.pokemon.toSageMode()
    }

    teardown() {
        super.teardown()
        this.state.pokemon.exitSageMode()
    }
}

class PaperBombEffect extends Effect {
    static effectName = "paperbomb"

    setup() {
        super.setup()
        this._cachedArmors = this.state.armor._items.map(armor => armor.id)
    }

    onUsedMove(move) {
        const lowMovement = this.state.pokemon.level 
        const midMovement = lowMovement * 2
        const armorRemoved = this._cachedArmors.some(id => !this.state.armor._items.some(armor => armor.id === id))
        
        let explodeChance
        if (move._bp > midMovement) {
            explodeChance = 50
        }
        else if (move._bp > lowMovement) {
            explodeChance = 20
        }
        else {
            explodeChance = 2
        }

        if (armorRemoved) {
            explodeChance += 30
        }
        
        if (Math.random() * 100 < explodeChance) {
            this._explode()
            this.remove()
        }

        armorRemoved && this.remove()
    }
  
    _explode() {
        const opponent = this.state.battle.opponentOf(this.state.pokemon)
        const move = new Move("$paperbomb:explode")
        const hit = new Hit(opponent, move, this.state.pokemon)        
        this.state.decreaseHealth(hit.contactDamage())
    }
}


class BleedEffect extends Effect {
    static effectName = "bleed"
    static immuneTo = ["steel"]
    _lastMovement = null

    onUsedMove(move) {
        const lowMovement = this.state.pokemon.level 
        const midMovement = lowMovement * 2        
        if (move._bp > midMovement) {
            this._lastMovement = "HIGH"
        }
        else if (move._bp > lowMovement) {
            this._lastMovement = "MID"
        }
        else {
            this._lastMovement = "LOW" 
        }
    }

    onSceneEnd() {
        const map = {
          "LOW": 0.02,
          "MID": 0.04,
          "HIGH": 0.1
        }
        const damageRate = map[this._lastMovement ?? "LOW"]
        this.state.decreaseHealth(this.state.pokemon.maxhp * damageRate)
        this._lastMovement = null
    }
}


class MammothSkinEffect extends Effect {
    static effectName = "mammothskin"
    _givesImmunityToEffects = ["bleed"]

    givesImmunity(effectName) {
        return this._givesImmunityToEffects.includes(effectName)
    }

    onScene(move) {
        if (this._move) {
            this._move.flags = this._oldFlags
        }

        this._move = move
        this._oldFlags = structuredClone(this._move.flags)
        this._move.flags.shield = 1
    }
}


class AreaSplashEffect extends Effect {
    static effectName = "areasplash"

    _oldMovesData = {}
    
    setup() {
        super.setup()
        this.state.moves.forEach(move => {
            if (move.target === "self") return
            if (!move.flags.offensive) return
            if (move.flags.weapon) return

            this._oldMovesData[move.id] = {
                target: move.target,
                basePower: move.basePower,
                capacity: move.capacity
            }

            if (move.capacity > 1) {
                return move.capacity = Math.round(move.capacity * 1.3) 
            }

            move.basePower = Math.round(move.basePower * 0.66668)
            move.capacity = move.category === "Status" ? 2 : Math.max(Math.round(move.basePower / 10), 2)
            
            if (move.healTarget)
                move.target = "allySide"
            else {
              const mapping = {
                "normal": "foeSide",
              }
              move.target = mapping[move.target] || move.target              
            }
        })
    }

    teardown() {
        super.teardown()
        this.state.moves.forEach(move => {
            if (move.id in this._oldMovesData) {
                const data = this._oldMovesData[move.id]
                move.target = data.target
                move.basePower = data.basePower
                move.capacity = data.capacity
            }
        })
    }
}

class AncientModeEffect extends ExpirableEffect {
    static effectName = "ancientmode"
    _addedEffects = []

    setup() {
        super.setup()

        if (this.state.pokemon.abilities.isActive("mayangan:silver-eye")) {
            this.state.effects.add(this.source, "mammothskin")
            this._addedEffects.push("mammothskin")
        }

        if (this.state.pokemon.abilities.isActive("mayangan:golden-eye")) {
            this.state.effects.add(this.source, "areasplash")
            this._addedEffects.push("areasplash")
        }

        const grade = this.state.moves.find(move => move.id === "ancientmode")._meta.grade || 0
        const gradeStatBonusPercent = (grade * 8) / 100

        this.lifetime.turns = 3 + Math.floor(grade * 1.5)
        
        this.state.pokemon._beastTypes.push("Dragon")
        this._stats = {
            hp: 0,
            atk: 0,
            spe: 0
        }

        const boostStat = this.state.pokemon.stats.spe * 0.3

        this._stats.spe -= boostStat
        this._stats.hp = boostStat / 2  
        this._stats.atk = boostStat / 2
        this._stats.hp += this.state.pokemon.stats.hp * gradeStatBonusPercent
        this._stats.atk += this.state.pokemon.stats.atk * gradeStatBonusPercent
        this.state.moves.forEach(move => {
            if (move.tokenChanges?.spe && move.tokenChanges?.spe < 0) {
                this._stats.spe += Math.abs(move.tokenChanges.spe)
            }
        })

        this.state.pokemon.tokens = sumObj(this.state.pokemon.tokens, this._stats)
        this.state.increaseHealth(this._stats.hp)
    }

    teardown() {
        super.teardown()
        this.state.pokemon._beastTypes = this.state.pokemon._beastTypes.filter(t => t !== "Dragon")
        this.state.pokemon.tokens = sumObj(this.state.pokemon.tokens, modObj(this._stats, -1))
        this.state.decreaseHealth(this._stats.hp, true)

        this._addedEffects.forEach(effect => {
            this.state.effects.remove(effect)
        })
    }

    displayMeta() {
      const totalStatBoosted = this._stats.hp + this._stats.atk
        return `(${Math.floor(totalStatBoosted / 10)}.inch) - ${this.lifetime.turns}`
    }
}

export const EFFECTS = makeEffectsMap([
    BurnEffect,
    PoisonEffect,
    AquaRingEffect,
    NatureHealingEffect,
    SleepEffect,
    TailWindEffect,
    FreezeEffect,
    FlinchEffect,
    ParalyzeEffect,
    ConfusionEffect,
    LeechSeedEffect,
    StallEffect,
    PartiallyTrappedEffect,
    DoubleTeamEffect,
    ShadowCloneEffect,
    SageModeEffect,
    PaperBombEffect,
    BleedEffect,
    MammothSkinEffect,
    AreaSplashEffect,
    AncientModeEffect
])


export class EffectManager {
    _effects = [];
    _freezed = false;

    constructor(state) {
        this.state = state;
    }
    
    all() {
        return this._effects
    }
    
    names() {
        return this._effects.map(effect => effect.constructor.effectName)
    }
  
    get(effectName) {
        return this._effects.find(effect => {
            return effect.constructor.effectName === effectName
        })
    }

    has(effectName) {
        return !!this.get(effectName)
    }

    expired() {
        return this._effects.filter(effect => effect instanceof ExpirableEffect && effect.isExpired())
    }
    
    add(source, effectName) {      
        if (this._freezed) return null
        const EffectClass = EFFECTS[effectName]
        const isImmune = EffectClass?.isImmune(this.state.pokemon)
        if (EffectClass && !isImmune && !this.has(effectName)) {
            const effect = new EffectClass(this.state, source)
            effect.setup()
            this._effects.push(effect)
            return effect
        }
        return null
    }
    
    remove(effectName) {
        const effect = this.get(effectName)
        effect.teardown()
        this._removeEffectObj(effectName)
        return effect
    }

    givesImmunity(effectName) {
        return this._effects.some(effect => effect.givesImmunity(effectName))
    }

    canUseMove(move) {
        return this._effects.every(effect => effect.canUseMove(move))
    }

    canOpponentUseMove(move) {
        return this._effects.every(effect => effect.canOpponentUseMove(move))
    }
    
    toJSON() {
        return this.names()
    }

    sync(...effectNames) {
        this.names().forEach(e => !effectNames.includes(e) && this.remove(e))
        effectNames.forEach(e => {
            this.add(null, e)
        })
    }

    apply(move, { on, pre = false }) {
        if (this.state._data.armorUsed) return

        const abilitiesMap = {
          "brn": "blueflame",
          "par": "purplethunder"
        }
        const attacker = this.state.battle.opponentOf(this.state.pokemon)
        if (on === "self") {
            move.effects.self
                .forEach(effect => {
                    if (Math.random() < (effect.chance / 100)) {
                        attacker.state.effects.add(move, effect.name)
                    }
                })
        }
        else if(on === "target") {            
            move.effects.target
                .filter(effect => EFFECTS[effect.name]?.isPre() === pre)
                .forEach(effect => {
                    const chance = attacker.abilities.isActive(abilitiesMap[effect.name])
                        ? 100
                        : effect.chance * move.hits
                    
                    if (Math.random() < (chance / 100)) {                      
                        this.add(move, effect.name)
                    }
                })
        }
    }
    
    canMove() {
        return this._effects.every(e => e.canMove())
    }
    
    attackSelf() {
        return this._effects.some(e => e.attackSelf())
    }
    
    freeze() {
        this._freezed = true
    }
    
    unfreeze() {
        this._freezed = false
    }

    _removeEffectObj(effectName) {
        let index = -1
        for (let i = 0; i < this._effects.length; i++) {
            if (this._effects[i].constructor.effectName === effectName) {
                index = i;
                break;
            }
        }
        this._effects.splice(index, 1)
    }
}

function makeEffectsMap(effectsClass) {
    return effectsClass.reduce((map, e) => {
        map[e.effectName] = e
        return map
    }, {})
}