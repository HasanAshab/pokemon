import { capitalizeFirstLetter } from "./helpers.js"


export function getEffects(attacker, target, move) {
    return move.effect_names
    const effects = [];
    for (const effectName of move.effect_names) {
        if (Math.random() < (move.effect_chance / 100)) {
            effects.push(effectName)
        }
    }
    return effects;
}

function applyConfusionEffect(pokemon) {
  const isConfused = Math.random() < 0.5; // 50% chance to hurt itself
  if (isConfused) {
    const maxHP = pokemon.statOf("hp");
    const selfDamage = Math.floor(maxHP / 16); // Deal damage to itself
    pokemon.currentHP -= selfDamage;
    return { isConfused, selfDamage };
  }
  return { isConfused, selfDamage: 0 };
}

function isFrozenThisTurn() {
  return Math.random() < 0.8; // 80% chance to stay frozen
}

class Effect {
    events = [
        "turn",
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

    _subscribeTo(event) {
        const listener = this[`on${capitalizeFirstLetter(event)}`]
        if (listener) {
            this._listeners[event] = listener.bind(this)
            this.state.on(event, this._listeners[event])
        }
    }
    
    _unsubscribeTo(event) {
        const listener = this[`on${capitalizeFirstLetter(event)}`]
        if (listener) {
            this.state.removeListener(event, this._listeners[event])
        }
    }
}

class ExpirableEffect extends Effect {
    lifetime = { turns: null, waves: null }

    onTurn() {
        this.lifetime.turns && this.lifetime.turns--
    }

    onWave() {
        this.lifetime.waves && this.lifetime.waves--
    }

    isExpired() {
        return !this.lifetime.turns && !this.lifetime.waves
    }
}

class BurnEffect extends Effect {
    static effectName = "burn"

    onWave() {
        this.state.decreaseHealth(this._calculateEffectDamage())
    }
    
    _calculateEffectDamage() {
        const maxHP = this.state.statOf("hp");
        const effectDamage = Math.floor(maxHP / 8); // 1/8th HP loss
        return effectDamage;
    }
}

class PoisonEffect extends Effect {
    static effectName = "poison"

    onWave() {
        this.state.decreaseHealth(this._calculateEffectDamage())
    }
    
    _calculateEffectDamage() {
        const maxHP = this.state.statOf("hp");
        const poisonDamage = Math.floor(maxHP / 8); // 1/8th HP loss
        return poisonDamage;
    }
}

class FlinchEffect extends ExpirableEffect {
    static effectName = "flinch"
    lifetime = { turns: 0 }

    onTurn(battleField) {
        super.onTurn(battleField)
        this.state._canMoveAfter.turn = battleField.turnNo
    }
}

class ParalyzeEffect extends Effect {
    static effectName = "paralyze"

    setup() {
        super.setup()

        const speedStat = this.state.statOf("speed");
        this.state._stats.speed = Math.floor(speedStat / 2); // Speed halved
    }

    teardown() {
        super.teardown()

        const speedStat = this.state.statOf("speed");
        this.state._stats.speed = Math.floor(speedStat * 2)
    }

    onTurn(battleField) {
        const canNotMove = Math.random() < 0.25;
        if (canNotMove) {
            this.state._canMoveAfter.turn = battleField.turnNo
        }
    }
}

export const EFFECTS = [
    BurnEffect,
    PoisonEffect,
    FlinchEffect,
    ParalyzeEffect,
]


export class EffectManager {
    _effects = []

    constructor(state) {
        this.state = state;

        this.state.on("turn", this.removeExpired.bind(this))
        this.state.on("wave", this.removeExpired.bind(this))
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
            const EffectClass = EFFECTS.find(Effect => Effect.effectName === effectName)
            const effect = new EffectClass(this.state)
            effect.setup()
            this._effects.push(effect)
        })
    }
    
    remove(...effects) {
        effects.forEach(effectName => {
            const effect = this.get(effectName)
            effect.teardown()
            this._effects.splice(this._effects.indexOf(effect), 1)
        })
    }

    removeExpired() {
        const expiredEffects = this.expired().map(effect => effect.constructor.effectName)
        this.remove(...expiredEffects)
    }
}

