import db from "./db.js"

async function t() {
   try{ 
const charmander = await db.pokemons.get("charizard")
const bulbasaur = await db.pokemons.get("bulbasaur")
const ember = await db.moves.get("ember")

console.log("bulba", calculateDamage(charmander, bulbasaur, ember, {}))
console.log("char", calculateDamage(charmander, charmander, ember, {}))
}
catch(e) {console.log(e)}
}
setTimeout(t, 1000)





const types = await db.types.all()
const STAB_MODIFIER = 1.2;
const CRIT_MULTIPLIER = 1.5;
const BASE_CRIT_CHANCE = 1 / 24; // 4.17% base critical hit chance

function getStat(pokemon, name) {
  return pokemon.stats[name];
}

function calculateBaseDamage(attacker, target, move, effects) {
  const isSpecial = move.damage_class.name === "special";
  const attackStat = getStat(attacker, isSpecial ? "special-attack" : "attack");
  const defenseStat = getStat(target, isSpecial ? "special-defense" : "defense");
  if (!isSpecial && effects.burn) {
    const hasGuts = pokemon.abilities.some(a => a.name === "guts");
    return hasGuts ? attackStat : Math.floor(attackStat / 2);
  }
  return Math.floor(((2 * 50 / 5 + 2) * move.power * attackStat) / defenseStat / 50) + 2;
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

function getEffects(attacker, target, move) {
  //todo
}

function applyPoisonEffect(pokemon) {
  const maxHP = getStat(pokemon, "hp");
  const poisonDamage = Math.floor(maxHP / 8); // 1/8th HP loss
  pokemon.currentHP -= poisonDamage;
  return poisonDamage;
}

function applyBurnEffect(pokemon) {
  const maxHP = getStat(pokemon, "hp");
  const burnDamage = Math.floor(maxHP / 18); // 1/8th HP loss
  pokemon.currentHP -= burnDamage;
  return burnDamage;
}

function applyParalysisEffect(pokemon) {
  const speedStat = getStat(pokemon, "speed");
  speedStat.base_stat = Math.floor(speedStat.base_stat / 2); // Speed halved
  return Math.random() < 0.25; // 25% chance to skip turn
}

function applyConfusionEffect(pokemon) {
  const isConfused = Math.random() < 0.5; // 50% chance to hurt itself
  if (isConfused) {
    const maxHP = getStat(pokemon, "hp");
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

function calculateDamage(attacker, target, move, effects) {
  const moveType = move.type;

  // Calculate type effectiveness
  let effectiveness = 1;
  target.types.forEach(tType => {
    if (types[moveType] && types[moveType][tType]) {
      effectiveness *= types[moveType][tType];
    }
  });
console.log(effectiveness)
  // Calculate STAB
  const stab = attacker.types.includes(moveType) ? STAB_MODIFIER : 1;

  // Determine critical hit chance
  const critChance = BASE_CRIT_CHANCE * (1 + move.meta.crit_rate)

  // Determine if the move is a critical hit
  const criticalMultiplier = Math.random() < critChance ? CRIT_MULTIPLIER : 1;

  // Add randomness to damage
  const randomModifier = Math.random() * 0.15 + 0.85;

  // Calculate base damage
  const baseDamage = calculateBaseDamage(attacker, target, move, effects);
  
  // Calculate final damage
  return Math.floor(baseDamage * effectiveness * stab * criticalMultiplier * randomModifier);
}
function calculateMultiHitDamage(attacker, target, move) {
  const hits = getRandomHits(move);
  let totalDamage = 0;

  for (let i = 0; i < hits; i++) {
    totalDamage += calculateDamage(attacker, target, move);
  }

  return { totalDamage, hits };
}

function canDodge(attacker, target, move) {
    if (move.accuracy === null) {
        // Moves with null accuracy always hit
        return false;
    }

    // Get speed stats
    const attackerSpd = getStat(attacker, "speed");
    const targetSpd = getStat(target, "speed");
    const isPhysical = move.damage_class.name === "physical";

    // Simulate hit/miss based on final accuracy
    const maxHitChance = isPhysical ? 100 : 50
    const minHitChance = isPhysical ? 25 : 50
    const hitChance = (Math.random() * maxHitChance) - minHitChance; 
    const dodgeChance = (targetSpd - attackerSpd);
    return dodgeChance > hitChance;
}


const NATURE_MODIFIERS = {
  "adamant": { increase: "attack", decrease: "special-attack" },
  "bashful": { increase: null, decrease: null },
  "bold": { increase: "defense", decrease: "attack" },
  "brave": { increase: "attack", decrease: "speed" },
  "calm": { increase: "special-defense", decrease: "attack" },
  "careful": { increase: "special-defense", decrease: "special-attack" },
  "docile": { increase: null, decrease: null },
  "gentle": { increase: "special-defense", decrease: "defense" },
  "hasty": { increase: "speed", decrease: "defense" },
  "impish": { increase: "defense", decrease: "special-attack" },
  "jolly": { increase: "speed", decrease: "special-attack" },
  "lax": { increase: "defense", decrease: "special-defense" },
  "lonely": { increase: "attack", decrease: "defense" },
  "mild": { increase: "special-attack", decrease: "defense" },
  "modest": { increase: "special-attack", decrease: "attack" },
  "naive": { increase: "speed", decrease: "special-defense" },
  "naughty": { increase: "attack", decrease: "special-defense" },
  "quiet": { increase: "special-attack", decrease: "speed" },
  "quirky": { increase: null, decrease: null },
  "rash": { increase: "special-attack", decrease: "special-defense" },
  "relaxed": { increase: "defense", decrease: "speed" },
  "sassy": { increase: "special-defense", decrease: "speed" },
  "serious": { increase: null, decrease: null },
  "timid": { increase: "speed", decrease: "attack" },
};

function getNatureModifier(statName, nature) {
  if (!nature || !NATURE_MODIFIERS[nature]) return 1; // Neutral nature
  const natureEffects = NATURE_MODIFIERS[nature];
  if (natureEffects.increase === statName) return 1.1; // Boosted stat
  if (natureEffects.decrease === statName) return 0.9; // Reduced stat
  return 1; // No effect
}

function calculateLevelStat(pokemon, level) {
  const stats = {};

  Object.keys(pokemon.stats).forEach(statName => {
    const baseStat = pokemon.stats[statName];
    const ev = pokemon.efforts[statName] || 0; // Effort values from `efforts`
    const iv = 31; // Default IV value

    if (statName === "hp") {
      // HP calculation
      stats[statName] = Math.floor(
        ((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100 + level + 10
      );
    } else {
      // Other stat calculations
      stats[statName] = Math.floor(
        ((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100 + 5
      );
    }
  });

  return stats;
}

function calculateNatureStat(pokemon, nature) {
  const natureStats = {};

  Object.keys(pokemon.stats).forEach(statName => {
    const baseStat = pokemon.stats[statName];
    const natureModifier = getNatureModifier(statName, nature);

    // Apply nature modifier
    natureStats[statName] = Math.floor(baseStat * natureModifier);
  });

  return natureStats;
}

function calculateTotalStat(pokemon, nature, level) {
  const baseStats = pokemon.stats;
  const levelStats = calculateLevelStat(pokemon, level);
  const natureStats = calculateNatureStat(pokemon, nature);

  const totalStats = {};
  Object.keys(baseStats).forEach(statName => {
    totalStats[statName] =
      baseStats[statName] + levelStats[statName] + natureStats[statName];
  });

  return totalStats;
}

