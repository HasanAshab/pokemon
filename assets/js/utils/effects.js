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

export class EffectManager {
    static effectsMap = {
        "burn": BurnEffect,
        //"poison": PoisonEffect,
        "paralyze": ParalyzeEffect,
    }

    _effects = []

    constructor(state) {
        this.state = state;
    }

    add(...effects) {
        for (const effectName of effects) {
            const Effect = EffectManager.effectsMap[effectName]
            const effect = new Effect(this.state)
            effect.setup()
            this._effects.push(effect)
        }
    }
    
    remove(...effects) {
        for (const effectName of effects) {
            this._effects.filter(effect => effect instanceof EffectManager.effectsMap[effectName])
                .forEach(effect => {
                effect.teardown()
                this._effects.splice(this._effects.indexOf(effect), 1)
            })
        }
    }
}

