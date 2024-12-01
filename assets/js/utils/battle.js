import { calculateBurnEffect, calculatePoisonEffect } from "./effects.js"
import { fixFloat } from "./helpers.js"


export async function calculateWinXP(poke1, poke2) {
    const levelMultiplier = (poke2.level / poke1.level) * 5;
    const baseXp = 10
    let typeEffectiveness1 = 1
    let typeEffectiveness2 = 1

    for (const type of poke2.data.types) {
        typeEffectiveness1 *= await poke1.effectiveness(type)
    }
    for (const type of poke1.data.types) {
        typeEffectiveness2 *= await poke2.effectiveness(type)
    }
    
    const typeEffectiveness = typeEffectiveness1 / typeEffectiveness2

    const xp = Math.floor(baseXp * levelMultiplier * typeEffectiveness);
    return xp;
}

class Damage {}

export class BattleField {
    constructor(pokemon1, pokemon2) {
        this.pokemon1 = pokemon1;
        this.pokemon2 = pokemon2;

        this._states = new Map([
            [pokemon1, new BattleState(pokemon1)],
            [pokemon2, new BattleState(pokemon2)]
        ]);
    }

    state(pokemon) {
        return this._states.get(pokemon);
    }

    async turn(senario) {
        const damage = await calculateDamage(senario)

        const move1 = senario.get(this.pokemon1)
        const move2 = senario.get(this.pokemon2)

        const dodged1 = this.state(this.pokemon1).canMove() && this.canDodge(this.pokemon1, this.pokemon2, move2)
        const dodged2 = this.state(this.pokemon2).canMove() && this.canDodge(this.pokemon2, this.pokemon1, move1)

        const effects1 = await getEffects(this.pokemon2, this.pokemon1, move2)
        const effects2 = await getEffects(this.pokemon1, this.pokemon2, move1)

        if(
            (move1.name === "$nothing" && move2.name === "$nothing")
            ||
            (move1.name === "$dodge" && move2.name === "$dodge")
            ||
            (move1.name === "$nothing" && move2.name === "$dodge")
            ||
            (move1.name === "$dodge" && move2.name === "$nothing")
        ) {}
        
        else {
            const damages = await calculateDamage(pokemon, move1, this.pokemon2, move2)
            const hurtedPokemon = damages[1].totalDamage > 0
                ? this.pokemon2
                : pokemon
            const hitterPokemon = hurtedPokemon === this.pokemon2
                ? pokemon
                : this.pokemon2
            const move = hitterPokemon === pokemon
                ? move1
                : move2
            const damIndex = hitterPokemon === pokemon
                ? 1
                : 2
            const effects = await getEffects(hitterPokemon, hurtedPokemon, move)
            effects.forEach(effect => hurtedPokemon.state.addEffect(effect))
            applyStatChanges(pokemon, this.pokemon2, move1)
            applyStatChanges(this.pokemon2, pokemon, move2)
        }

        if ((move1.makes_contact && !dodged2) || !move2.makes_contact) {
            applyStatChanges(this.pokemon1, this.pokemon2, move1)
        }
        if ((move2.makes_contact && !dodged1) || !move2.makes_contact) {
            applyStatChanges(this.pokemon2, this.pokemon1, move2)
        }

        this.state(this.pokemon1).decreaseRetreat(move1.retreat)
        this.state(this.pokemon2).decreaseRetreat(move2.retreat)
        
        dodged1 || this.state(this.pokemon1).decreaseHealth(damage.on(this.pokemon1))
        dodged2 || this.state(this.pokemon2).decreaseHealth(damage.on(this.pokemon2))

        if (damage.isHittee(this.pokemon1) && !dodged1) {
            this.state(this.pokemon1).addEffects(effects1)
        }
        if (damage.isHittee(this.pokemon2) && !dodged2) {
            this.state(this.pokemon2).addEffects(effects2)
        }
    }

    canDodge(pokemon1, pokemon2, move) {
        if (move.accuracy === null) {
            // Moves with null accuracy always hit
            return false;
        }
    
        // Get speed stats
        const pokemon1Spd = this.state(pokemon1).statOf("speed");
        const pokemon2Spd = this.state(pokemon2).statOf("speed");
        const isPhysical = move.damage_class === "physical";
    
        // Simulate hit/miss based on final accuracy
        const maxHitChance = isPhysical ? 100 : 50
        const minHitChance = isPhysical ? 25 : 50
        const hitChance = (Math.random() * maxHitChance) - minHitChance; 
        const dodgeChance = (pokemon2Spd - pokemon1Spd);
        return dodgeChance > hitChance;
    }
}


class BattleState {
    constructor(pokemon) {
        this.pokemon = pokemon;
        this.listeners = {
            onHealthChange: [],
            onEffectAdded: [],
            onEffectRemoved: [],
            onStatChange: []
        };
        this.refresh();
    }

    refresh() {
        this._effects = [];
        this._statChanges = {};
        this._stats = { ...this.this.pokemon1.data.stats };
        this.retreat = this.this.pokemon1.meta.retreat
    }
    
    addWaveRetreat() {
        this.retreat += this.this.pokemon1.meta.retreat
    }

    stats() {
        const calculatedStats = {};
        for (const stat in this._stats) {
            const baseStat = this._stats[stat];
            const stage = this._statChanges[stat] || 0;
            const multiplier = this._statStageMultiplier(stage);
            calculatedStats[stat] = fixFloat(baseStat * multiplier);
        }
        return calculatedStats;
    }

    statOf(name) {
        const baseStat = this._stats[name];
        const stage = this._statChanges[name] || 0;
        const multiplier = this._statStageMultiplier(stage);
        return fixFloat(baseStat * multiplier);
    }

    // Health Management
    increaseHealth(amount) {
        const maxHealth = this.statOf("hp"); // Use calculated HP stat
        this._stats.hp = Math.min(this._stats.hp + amount, maxHealth);
        this._trigger("onHealthChange");
    }

    decreaseHealth(amount) {
        this._stats.hp = Math.max(this._stats.hp - amount, 0);
        this._trigger("onHealthChange");
    }

    // Effect Management
    addEffect(effect) {
        if (!this._effects.includes(effect)) {
            this._effects.push(effect);
            this._trigger("onEffectAdded");
        }
    }

    removeEffect(effect) {
        const index = this._effects.indexOf(effect);
        if (index > -1) {
            this._effects.splice(index, 1);
            this._trigger("onEffectRemoved");
        }
    }
    
    decreaseHealthForEffects() {
        let totalDamage = 0;

        this._effects.forEach(effect => {
            if (effect === "burn") {
                totalDamage += calculateBurnEffect(this.pokemon);
            }
            else if (effect === "poison") {
                totalDamage += calculatePoisonEffect(this.pokemon);
            }
        });

        if (totalDamage > 0) {
            this.decreaseHealth(totalDamage);
        }
    }
    
    // Stat Management
    applyStatChange(stat, stages) {
        if (!this._statChanges[stat]) {
            this._statChanges[stat] = 0;
        }

        // Stat stage clamping (-6 to +6)
        const newStage = Math.max(-6, Math.min(6, this._statChanges[stat] + stages));
        const oldStage = this._statChanges[stat];
        this._statChanges[stat] = newStage;

        if (newStage !== oldStage) {
            this._trigger("onStatChange");
        }
    }

    resetStatChanges() {
        this._statChanges = {};
        this._trigger("onStatChange");
    }

    // Listeners
    addListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    removeListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    _trigger(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(this));
        }
    }

    _statStageMultiplier(stage) {
        if (stage > 0) {
            return (2 + stage) / 2; // Positive stages
        } else if (stage < 0) {
            return 2 / (2 - stage); // Negative stages
        } else {
            return 1; // Neutral stage
        }
    }
}

