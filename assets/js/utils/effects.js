import { capitalizeFirstLetter, camelize, weightedRandom } from "./helpers.js"
import { Move } from "./models.js"


class Effect {
    static immuneTo = []
    
    static isImmune(pokemon) {
        return pokemon.types.some(t => this.immuneTo.includes(t))
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
        "used-move"
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
        const opponent = this.state.field.opponentOf(this.state.pokemon)
        const listener = this[`onOpponent${camelize(capitalizeFirstLetter(event))}`]
        if (listener) {
            this._listeners.opponent[event] = listener.bind(this)
            opponent.state.on(event, this._listeners.opponent[event])
        }
    }
    
    _unsubscribeToOpponent(event) {
        const opponent = this.state.field.opponentOf(this.state.pokemon)
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
    
    setup() {
        super.setup()

        const attackStat = this.state.stats.get("attack");
        this.state.stats.set("attack", Math.floor(attackStat / 2));
    }

    teardown() {
        super.teardown()

        const attackStat = this.state.stats.get("attack");
        this.state.stats.set("attack", Math.floor(attackStat * 2));
    }

    onTurn() {
        this.state.decreaseHealth(this._calculateEffectDamage())
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
        this.state.decreaseHealth(this._calculateEffectDamage())
    }
    
    _calculateEffectDamage() {
        const maxHP = this.state.pokemon.stats.hp;
        const poisonDamage = Math.floor(maxHP / 8); // 1/8th HP loss
        return poisonDamage;
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

    setup() {
        super.setup()

        const speedStat = this.state.stats.get("speed");
        this.state.stats.set("speed", Math.floor(speedStat / 2)); // Speed halved
    }

    teardown() {
        super.teardown()

        const speedStat = this.state.stats.get("speed");
        this.state.stats.set("speed", Math.floor(speedStat * 2));
    }

    onTurn() {
        const canNotMove = Math.random() < 0.25;
        this.status.canMove = !canNotMove
    }

    onTurnEnd() {
        this.status.canMove = true
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
        this.status.attackSelf = Math.random() < ConfusionEffect.ATK_SELF_CHANCE
    }

    onTurnEnd() {
        this.status.attackSelf = false
    }
    
    teardown() {
        super.teardown()
        this.status.attackSelf = false
    }
}

class LeechSeedEffect extends Effect {
    static immuneTo = ["Grass"]
    static effectName = "leechseed"

    onWave() {
        const opponent = this.state.field.opponentOf(this.state.pokemon)
        const loosedHp = opponent.stats.hp / 8

        this.state.decreaseHealth(loosedHp)
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
        this.state.damage.chainModify(0.01)
    }
}

class PartiallyTrappedEffect extends ExpirableEffect {
    static effectName = "partiallytrapped"

    setup() {
        super.setup()
        const lifetime = weightedRandom([2, 3, 4, 5], [0.30, 0.50, 0.20, 0.05])
        this.lifetime.turns = lifetime
    }
    
    onTurn(_, senario) {
        this.state.decreaseHealth(this._calculateEffectDamage())
        
        const opponent = this.state.field.opponentOf(this.state.pokemon)
        const move = senario.get(this.state.pokemon)
        const opponentMove = senario.get(opponent)

        if (this.source.flags.contact) {
            move.flags.contact && senario.set(this.state.pokemon, new Move("staythere"))
            !opponentMove.flags.contact && senario.set(opponent, new Move("staythere"))
        }
        else {
            move.flags.contact && senario.set(this.state.pokemon, new Move("staythere"))
            opponentMove.flags.contact && senario.set(opponent, new Move("staythere"))
        }
    }
    
    _calculateEffectDamage() {
        const maxHP = this.state.pokemon.stats.hp;
        const trappedDamage = Math.floor(maxHP / 8); // 1/8th HP loss
        return trappedDamage;
    }
}

export const EFFECTS = makeEffectsMap([
    BurnEffect,
    PoisonEffect,
    SleepEffect,
    FreezeEffect,
    FlinchEffect,
    ParalyzeEffect,
    ConfusionEffect,
    LeechSeedEffect,
    StallEffect,
    PartiallyTrappedEffect,
])


export class EffectManager {
    _effects = []

    constructor(state) {
        this.state = state;
    }
    
    names() {
        return this._effects.map(effect => effect.constructor.effectName)
    }
  
    get(effectName) {
        return this._effects.find(effect => {
            return effect.constructor.effectName === effectName
        })
    }

    includes(effectName) {
        return !!this.get(effectName)
    }

    expired() {
        return this._effects.filter(effect => effect instanceof ExpirableEffect && effect.isExpired())
    }
    
    add(source, effectName) {
        const EffectClass = EFFECTS[effectName]
        const isImmune = EffectClass?.isImmune(this.state.pokemon)
        if (EffectClass && !isImmune && !this.includes(effectName)) {
            const effect = new EffectClass(this.state, source)
            effect.setup()
            this._effects.push(effect)
            return effect
        }
        return null
    }
    
    remove(...effects) {
        effects.forEach(effectName => {
            const effect = this.get(effectName)
            effect.teardown()
            this._removeEffectObj(effectName)
        })
    }

    apply(move, { on, pre = false }) {
        if (on === "self") {
            const attacker = this.state.field.opponentOf(this.state.pokemon)
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
                    if (Math.random() < (effect.chance / 100)) {
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