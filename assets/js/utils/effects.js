export function getEffects(attacker, target, move) {
    const effects = {};
    for (const effectName of move.effect_names) {
        effects[effectName] = Math.random() < (move.effect_chance / 100);
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
