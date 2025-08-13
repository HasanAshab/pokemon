import { capitalizeFirstLetter, camelize, weightedRandom } from "./helpers.js"
import { Move } from "./models.js"


class Effect {
    static immuneTo = []

    static isImmune(pokemon) {
        const abilityTrigger = pokemon.abilities.isEnabled() && pokemon.abilities.isImmune(this.effectName)
        return abilityTrigger || pokemon.types.some(t => this.immuneTo.includes(t))
    }

    static isPre() {
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
            || (!opponent.abilities.isActive("mayangan:selfish-scar") && opponent.abilities.isActive("mayangan:golden-eye"))
        const atkMod = shouldReverse ? 2 : 0.5        
        this.state.stats.chainModify("atk", atkMod);
    }

    onTurn() {
        this.state.decreaseHealth(this._calculateEffectDamage(), true)
    }
    
    _calculateEffectDamage() {
        const maxHP = this.state.pokemon.stats.hp;
        const effectDamage = Math.floor(maxHP / 16); // 1/16th HP loss
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
        const poisonDamage = Math.floor(maxHP / 8); // 1/8th HP loss
        return poisonDamage;
    }
}

class AquaRingEffect extends Effect {
    static effectName = "aquaring"

    onTurn() {
        this._increaseHealth()
    }
    
    onWave() {
        this._increaseHealth()
    }
    
    _increaseHealth() {
        const hp = Math.floor(this.state.pokemon.stats.hp / 16)
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
          || (!opponent.abilities.isActive("mayangan:selfish-scar") && opponent.abilities.isActive("mayangan:golden-eye"))
        
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
        this.state.decreaseHealth(this._calculateEffectDamage())
    }
    
    onScene(move, senario) {
        if (this.source && this.source.flags.contact) {
            move.flags.contact && senario.set(this.state.pokemon, new Move("staythere"))
        }
        else {
            move.flags.contact && senario.set(this.state.pokemon, new Move("staythere"))
        }
    }
    
    onOpponentScene(move, senario) {
        const opponent = this.state.battle.opponentOf(this.state.pokemon)

        if (this.source && this.source.flags.contact) {
            !move.flags.contact && senario.set(opponent, new Move("staythere"))
        }
        else {
            move.flags.contact && senario.set(opponent, new Move("staythere"))
        }
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


export const EFFECTS = makeEffectsMap([
    BurnEffect,
    PoisonEffect,
    AquaRingEffect,
    SleepEffect,
    FreezeEffect,
    FlinchEffect,
    ParalyzeEffect,
    ConfusionEffect,
    LeechSeedEffect,
    StallEffect,
    PartiallyTrappedEffect,
    DoubleTeamEffect,
    ShadowCloneEffect,
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
                        : effect.chance
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