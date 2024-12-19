import { capitalizeFirstLetter, camelize, weightedRandom } from "./helpers.js"



function isFrozenThisTurn() {
  return Math.random() < 0.8; // 80% chance to stay frozen
}

class Effect {
    static isPre() {
        return false
    }
    
    events = [
        "turn",
        "turn-end",
        "wave",
    ]
    _listeners = {}

    constructor(state) {
        this.state = state;
    }
    
    setup() {
        this.events.forEach(event => {
            this._subscribeTo(event)
        })
    }

    teardown() {
        this.events.forEach(event => {
            this._unsubscribeTo(event)
        })
    }
    
    remove() {
        return this.state.effects.remove(this.constructor.effectName)
    }

    _subscribeTo(event) {
        const listener = this[`on${camelize(capitalizeFirstLetter(event))}`]
        if (listener) {
            this._listeners[event] = listener.bind(this)
            this.state.on(event, this._listeners[event])
        }
    }
    
    _unsubscribeTo(event) {
        const listener = this[`on${camelize(capitalizeFirstLetter(event))}`]
        if (listener) {
            this.state.removeListener(event, this._listeners[event])
        }
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

    onWave() {
        this.state.decreaseHealth(this._calculateEffectDamage())
    }
    
    _calculateEffectDamage() {
        const maxHP = this.state.pokemon.stats.hp;
        const effectDamage = Math.floor(maxHP / 16); // 1/16th HP loss
        return effectDamage;
    }
}

class PoisonEffect extends Effect {
    static effectName = "psn"

    onWave() {
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
        this.state.status.canMove = false
    }

    teardown() {
        super.teardown()
        this.state.status.canMove = true
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
        this.state.status.canMove = false
    }

    teardown() {
        super.teardown()
        this.state.status.canMove = true
    }
}

class ParalyzeEffect extends Effect {
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
        if (canNotMove) {
            this.state.status.canMove = false
        }
    }

    onTurnEnd() {
        this.state.status.canMove = true
    }
}

class ConfusionEffect extends Effect {
    static effectName = "confusion"

    onTurn() {
        const attackSelf = Math.random() < 0.5;
        if (attackSelf) {
            this.state.status.attackSelf = true
        }
    }

    onTurnEnd() {
        this.state.status.attackSelf = false
    }
}

export const EFFECTS = makeEffectsMap([
    BurnEffect,
    PoisonEffect,
    SleepEffect,
    FlinchEffect,
    ParalyzeEffect,
    ConfusionEffect
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
    
    add(...effects) {
        effects.filter(effectName => !this.includes(effectName)).forEach(effectName => {
            const EffectClass = EFFECTS[effectName]
            if(!EffectClass) return // Effect not implemented yet
            const effect = new EffectClass(this.state)
            effect.setup()
            this._effects.push(effect)
        })
    }
    
    remove(...effects) {
        effects.forEach(effectName => {
            const effect = this.get(effectName)
            effect.teardown()
            this._removeEffectObj(effectName)
        })
    }

    removeExpired() {
        const expiredEffects = this.expired().map(effect => effect.constructor.effectName)
        this.remove(...expiredEffects)
    }

    apply(move, { on, pre = false }) {
        if (on === "self") {
            const attacker = this.state.field.opponentOf(this.state.pokemon)
            move.effects.self
                .filter(effect => EFFECTS[effect.name]?.isPre() === pre)
                .forEach(effect => {
                    if (Math.random() < (effect.chance / 100)) {
                        attacker.state.effects.add(effect.name)
                    }
                })
        }
        else if(on === "target") {
            move.effects.target
                .filter(effect => EFFECTS[effect.name]?.isPre() === pre)
                .forEach(effect => {
                    if (true || Math.random() < (effect.chance / 100)) {
                        this.add(effect.name)
                    }
                })
        }
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