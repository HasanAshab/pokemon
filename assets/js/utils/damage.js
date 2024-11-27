const STAB_MODIFIER = 1.3;
const CRIT_MULTIPLIER = 1.5;
const BASE_CRIT_CHANCE = 1 / 24;

function fixDamage(damage) {
    return damage === null
        ? null
        : parseFloat(damage.toFixed(2));
}

function calculateBaseDamage(pokemon1, move, pokemon2 = null) {
    if (move.power === null) {
        return null
    }
    const isSpecial = move.damage_class === "special";
    const attackStat = pokemon1.state.statOf(isSpecial ? "special-attack" : "attack");
    const defenseStat = pokemon2
        ? pokemon2.state.statOf(isSpecial ? "special-defense" : "defense")
        : 70; // Neutral defense if no target

    return (((((2 * pokemon1.level) / 5) + 2) * move.power * (attackStat / defenseStat)) / 10) + 2;
}

export async function calculateDamage(pokemon1, move1, pokemon2 = null, move2 = null) {
    const result = {
        1: {
            totalDamage: 0,
            hits: 0
        },
        2: {
            totalDamage: 0,
            hits: 0
        },
    }
    if (!pokemon2 && !move2) {
        // No target or second move: calculate base damage only
        result[1].totalDamage = fixDamage(calculateBaseDamage(pokemon1, move1));
        result[1].hits = 1;
        return result
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
        : fixDamage((baseDamage1 * effectiveness1 * stab1 * criticalMultiplier1 * randomModifier1));

    if (!move2) {
        // If only pokemon1 attacks, return its damage
        result[1].totalDamage = finalDamage1;
        result[1].hits = 1;
        return result
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
        : fixDamage(baseDamage2 * effectiveness2 * stab2 * criticalMultiplier2 * randomModifier2);
    
    const pokeEffect1 = await pokemon2.effectiveness(move1.type);
    const pokeEffect2 = await pokemon1.effectiveness(move2.type);
    const remDam1 = ((finalDamage1 / effectiveness1) * pokeEffect1)
    const remDam2 = ((finalDamage2 / effectiveness2) * pokeEffect2)
    const remainingDamage = fixDamage(remDam1 - remDam2)

    if (remainingDamage > 0) {
        result[1].totalDamage = remainingDamage
        result[2].totalDamage = 0
    }
    else {
        result[1].totalDamage = 0
        result[2].totalDamage = remainingDamage * -1
    }

    result[1].hits = 1
    result[2].hits = 1

    return result
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
