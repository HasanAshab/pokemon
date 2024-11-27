import db from "./utils/db.js"
import { Pokemon, Move } from "./utils/models.js"


async function t() {
const ember = await Move.make("ember")
const growl = await Move.make("growl")

const charmander = await Pokemon.make("charmander", {
    xp: 10 * 100,
    nature: "calm"
})
console.log(charmander)
const charmander2 = await Pokemon.make("charmander", {
    xp: 12 * 100,
    nature: "calm"
})
const bulbasaur = await Pokemon.make("bulbasaur", {
    xp: 10 * 100,
    nature: "calm"
})


console.log("charmander damage without any target", await calculateDamage(charmander, ember))
console.log("charmander thrown ember on bulbasaur", await calculateDamage(charmander, ember, bulbasaur))
console.log("charmander thrown ember on charmander", await calculateDamage(charmander, ember, charmander))
console.log("2 charmander thrown ember on each others", await calculateDamage(charmander, ember, charmander2, growl))


console.log(applyStatChanges(charmander, bulbasaur, growl))


}

setTimeout(t, 1000)


const STAB_MODIFIER = 1.3;
const CRIT_MULTIPLIER = 1.5;
const BASE_CRIT_CHANCE = 1 / 24; // 4.17% base critical hit chance
const MAX_STAGE = 6; // Max stat stage
const MIN_STAGE = -6;

function applyStatChanges(attacker, defender, move) {
    const { stat_changes } = move.meta;

    // Initialize stat stages if not already present
    attacker.stages = attacker.stages || {};
    defender.stages = defender.stages || {};

    // Apply changes to defender's stat stages
    if (stat_changes.target) {
        for (const [stat, change] of Object.entries(stat_changes.target)) {
            defender.stages[stat] = defender.stages[stat] || 0;
            defender.stages[stat] = Math.max(
                MIN_STAGE,
                Math.min(MAX_STAGE, defender.stages[stat] + change)
            );
        }
    }

    // Apply changes to attacker's stat stages
    if (stat_changes.self) {
        for (const [stat, change] of Object.entries(stat_changes.self)) {
            attacker.stages[stat] = attacker.stages[stat] || 0;
            attacker.stages[stat] = Math.max(
                MIN_STAGE,
                Math.min(MAX_STAGE, attacker.stages[stat] + change)
            );
        }
    }
}

function calculateModifiedStat(baseStat, stage) {
    const stageMultiplier = stage > 0
        ? (2 + stage) / 2 // Positive stage
        : 2 / (2 - stage); // Negative stage
    return Math.floor(baseStat * stageMultiplier);
}


function getEffects(attacker, target, move) {
    const effects = {};
    for (const effectName of move.effect_names) {
        effects[effectName] = Math.random() < (move.effect_chance / 100);
    }
    return effects;
}

function applyPoisonEffect(pokemon) {
  const maxHP = pokemon.statOf("hp");
  const poisonDamage = Math.floor(maxHP / 8); // 1/8th HP loss
  pokemon.currentHP -= poisonDamage;
  return poisonDamage;
}

function applyBurnEffect(pokemon) {
  const maxHP = pokemon.statOf("hp");
  const burnDamage = Math.floor(maxHP / 18); // 1/8th HP loss
  pokemon.currentHP -= burnDamage;
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

function handleStatusEffects(pokemon, status, turnCount = 0) {
  switch (status) {
    case "poisoned":
      return applyPoisonEffect(pokemon);
    case "burned":
      return applyBurnEffect(pokemon);
    case "paralyzed":
      return applyParalysisEffect(pokemon);
    case "frozen":
      return isFrozenThisTurn();
    case "sleep":
      return turnCount > 0;
    case "flinched":
      return;
    case "confused":
      return applyConfusionEffect(pokemon);
    default:
      return null;
  }
}



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
    const attackStat = pokemon1.statOf(isSpecial ? "special-attack" : "attack");
    const defenseStat = pokemon2
        ? pokemon2.statOf(isSpecial ? "special-defense" : "defense")
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


function canDodge(pokemon1, move, pokemon2) {
    if (move.accuracy === null) {
        // Moves with null accuracy always hit
        return false;
    }

    // Get speed stats
    const pokemon1Spd = pokemon1.statOf("speed");
    const pokemon2Spd = pokemon2.statOf("speed");
    const isPhysical = move.damage_class === "physical";

    // Simulate hit/miss based on final accuracy
    const maxHitChance = isPhysical ? 100 : 50
    const minHitChance = isPhysical ? 25 : 50
    const hitChance = (Math.random() * maxHitChance) - minHitChance; 
    const dodgeChance = (pokemon2Spd - pokemon1Spd);
    return dodgeChance > hitChance;
}

async function calculateWinXP(poke1, poke2) {
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
