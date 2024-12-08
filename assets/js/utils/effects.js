import { capitalizeFirstLetter } from "./helpers.js"


export function getEffects(attacker, target, move) {
    const effects = [];
    for (const effectName of move.effect_names) {
        if (Math.random() < (move.effect_chance / 100)) {
            effects.push(effectName)
        }
    }
    return effects;
}

function calculatePoisonEffect(pokemon) {
  const maxHP = pokemon.statOf("hp");
  const poisonDamage = Math.floor(maxHP / 8); // 1/8th HP loss
  return poisonDamage;
}

function applyParalysisEffect(pokemon) {
  const speedStat = pokemon.statOf("speed");
  speedStat.base_stat = Math.floor(speedStat.base_stat / 2); // Speed halved
  return Math.random() < 0.25; // 25% chance to skip turn
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

class BurnEffect extends Effect {
    static effectName = "burn"

    onWave() {
        this.state.decreaseHealth(this._calculateEffectDamage())
    }
    
    _calculateEffectDamage() {
        const maxHP = this.state.statOf("hp");
        const effectDamage = Math.floor(maxHP / 18); // 1/8th HP loss
        return effectDamage;
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

    onTurn() {
        const canNotMove = Math.random() < 0.25;
        this.state._canMove.enabled = !canNotMove
    }
}

export const EFFECTS = [
    BurnEffect,
    ParalyzeEffect,
]


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
}

