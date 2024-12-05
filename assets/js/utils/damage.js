import { fixFloat } from "./helpers.js";


const STAB_MODIFIER = 1.3;
const CRIT_MULTIPLIER = 1.5;
const BASE_CRIT_CHANCE = 1 / 24;

class DamageManager {
    constructor(damages) {
        this._damages = damages
    }
    
    on(pokemon) {
        return this._damages.get(pokemon)
    }
    
    
}

class Hit {
    _keys = ["isCritical", "effectiveness", "randomModifier", "damageCount"]
    isCritical = false
    effectiveness = 1
    randomModifier = 0.85
    damageCount = 0
    
    constructor(data) {
        this._keys.forEach(key => {
            if (key in data)
                this[key] = data[key]
        })
    }
}

class Damage {
    constructor(hits = []) {
        this.hits = hits
    }
    
    get totalDamage() {

    }
}

function calculateBaseDamage(pokemon1, move, pokemon2 = null) {
    if (move.isNotMove || move.power === null) {
        return null
    }
    const isSpecial = move.damage_class === "special";
    const attackStat = pokemon1.state.statOf(isSpecial ? "special-attack" : "attack");
    const defenseStat = pokemon2
        ? pokemon2.state.statOf(isSpecial ? "special-defense" : "defense")
        : 70; // Neutral defense if no target

    return (((((2 * pokemon1.level) / 5) + 2) * move.power * ((attackStat * 0.6) / defenseStat)) / 10) + 2;
}

export async function calculateDamage() {
    return {
        1: {totalDamage:99.99},
        2: {totalDamage:99.99}
    }
}
export async function calculateDamageNew(pokemon1, move1, pokemon2, move2) {
    const damage1 = new Damage()
    const damage2 = new Damage()

    if (move2.isNotMove) {
        // No target or second move: calculate base damage only
        let totalDamage = calculateBaseDamage(pokemon1, move1, pokemon2);
        const stab = pokemon1.isTypeOf(move1.type) ? STAB_MODIFIER : 1;
        if(pokemon2) {
            const critChance = BASE_CRIT_CHANCE * (1 + move1.meta.crit_rate);
            const isCritical = Math.random() < critChance
            const criticalMultiplier = isCritical ? CRIT_MULTIPLIER : 1;
            const randomModifier = Math.random() * 0.15 + 0.85;
            const effectiveness = await pokemon2.effectiveness(move1.type);
            totalDamage = totalDamage * effectiveness * stab * criticalMultiplier * randomModifier;
            const hit = new Hit({
                isCritical,
                effectiveness,
                randomModifier
            })
            damage1.hits.push(hit)
        }
        return damages;
    }

    // Calculate type effectiveness for pokemon1's move
    const effectiveness1 = move2 
        ? await move1.effectiveness(move2.type) 
        : pokemon2 
        ? await pokemon2.effectiveness(move1.type)
        : 1;
    const stab1 = pokemon1.isTypeOf(move1.type) ? STAB_MODIFIER : 1;
    const critChance1 = BASE_CRIT_CHANCE * (1 + move1.meta.crit_rate);
    const criticalMultiplier1 = Math.random() < critChance1 ? CRIT_MULTIPLIER : 1;
    const randomModifier1 = Math.random() * 0.15 + 0.85;
    const baseDamage1 = calculateBaseDamage(pokemon1, move1);
    const finalDamage1 = baseDamage1 === null
        ? null
        : fixFloat((baseDamage1 * effectiveness1 * stab1 * criticalMultiplier1 * randomModifier1));

    if (!move2) {
        // If only pokemon1 attacks, return its damage
        damages[1].totalDamage = finalDamage1;
        damages[1].hits = 1;
        return damages
    }

    // Calculate type effectiveness for pokemon2's move
    const effectiveness2 = await move2.effectiveness(move1.type);
    const stab2 = pokemon2.isTypeOf(move2.type) ? STAB_MODIFIER : 1;
    const critChance2 = BASE_CRIT_CHANCE * (1 + move2.meta.crit_rate);
    const criticalMultiplier2 = Math.random() < critChance2 ? CRIT_MULTIPLIER : 1;
    const randomModifier2 = Math.random() * 0.15 + 0.85;
    const baseDamage2 = calculateBaseDamage(pokemon2, move2);
    const finalDamage2 = baseDamage2 === null
        ? null
        : fixFloat(baseDamage2 * effectiveness2 * stab2 * criticalMultiplier2 * randomModifier2);
    
    const pokeEffect1 = await pokemon2.effectiveness(move1.type);
    const pokeEffect2 = await pokemon1.effectiveness(move2.type);
    const remDam1 = ((finalDamage1 / effectiveness1) * pokeEffect1)
    const remDam2 = ((finalDamage2 / effectiveness2) * pokeEffect2)
    const remainingDamage = fixFloat(remDam1 - remDam2)

    if (remainingDamage > 0) {
        damages[1].totalDamage = remainingDamage
        damages[2].totalDamage = 0
    }
    else {
        damages[1].totalDamage = 0
        damages[2].totalDamage = remainingDamage * -1
    }

    damages[1].hits = 1
    damages[2].hits = 1

    return damages
}

function getRandomHits(move) {
  if (move.meta.min_hits === move.meta.max_hits) {
    return move.meta.min_hits;
  }
  if (move.meta.min_hits === null && move.meta.max_hits === null) {
    return 1;
  }
  // Specific probabilities for multi-hit moves like Fury Attack
  if (move.meta.min_hits === 2 && move.meta.max_hits === 5) {
    const probabilities = [2, 3, 4, 5];
    const weights = [3 / 8, 3 / 8, 1 / 8, 1 / 8];
    return weightedRandom(probabilities, weights);
  }
  return Math.floor(Math.random() * (move.meta.max_hits - move.meta.min_hits + 1)) + move.meta.min_hits;
}

function weightedRandom(values, weights) {
  const random = Math.random();
  let cumulativeWeight = 0;

  for (let i = 0; i < values.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return values[i];
    }
  }

  return values[values.length - 1]; // Fallback
}
