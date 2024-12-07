export function getEffects(attacker, target, move) {
    const effects = [];
    for (const effectName of move.effect_names) {
        if (Math.random() < (move.effect_chance / 100)) {
            effects.push(effectName)
        }
    }
    return effects;
}

export function calculatePoisonEffect(pokemon) {
  const maxHP = pokemon.statOf("hp");
  const poisonDamage = Math.floor(maxHP / 8); // 1/8th HP loss
  return poisonDamage;
}

export function calculateBurnEffect(pokemon) {
  const maxHP = pokemon.statOf("hp");
  const burnDamage = Math.floor(maxHP / 18); // 1/8th HP loss
  return burnDamage;
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

class BurnEffect {
    static effectName = "burn"

    constructor(state) {
        this.state = state;
    }

    setup() {
        this.state.on("wave", this._waveHandler)
    }

    teardown() {
        this.state.removeListener("wave", this._waveHandler)
    }

    _calculateEffectDamage() {
        const maxHP = this.state.statOf("hp");
        const effectDamage = Math.floor(maxHP / 18); // 1/8th HP loss
        return effectDamage;
    }

    _waveHandler() {
        this.state.decreaseHealth(this._calculateEffectDamage())
    }
}

class ParalyzeEffect {
    static effectName = "paralyze"

    constructor(state) {
        this.state = state;
    }

    setup() {
        const speedStat = this.state.statOf("speed");
        this.state._stats.speed = Math.floor(speedStat / 2); // Speed halved
        this.state.on("turn", this._turnHandler)
    }

    teardown() {
        const speedStat = this.state.statOf("speed");
        this.state._stats.speed = Math.floor(speedStat * 2)
        this.state.removeListener("turn", this._turnHandler)
    }

    _turnHandler() {
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
            const Effect = EFFECTS.find(Effect => Effect.effectName === effectName)
            const effect = new Effect(this.state)
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

