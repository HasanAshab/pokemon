export const camelize = s => s.replace(/-./g, x=>x[1].toUpperCase())

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function toTitleCase(str) {
  return str.replace("-", " ").replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

export function getParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

export function getPokemonsMeta(name) {
    const pokemons_meta = JSON.parse(localStorage.getItem("pokemons-meta"))
    if (!name) return pokemons_meta
    return pokemons_meta[name]
}

export function setPokemonMeta(name, value) {
    const pokemonsMeta = getPokemonsMeta()
    pokemonsMeta[name] = value
    localStorage.setItem("pokemons-meta", JSON.stringify(pokemonsMeta))
}

export function delayedFunc(func, delay) {
    return (...args) => setTimeout(() => func(...args), delay)
}

export function fixFloat(damage) {
    return damage === null
        ? null
        : parseFloat(damage.toFixed(2));
}

export function weightedRandom(values, weights) {
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

export function getDamageDangerLevel(pokemon, damage) {
    const maxHP = pokemon.maxhp;
    const damagePercentage = (damage / maxHP) * 100;

    if (damagePercentage < 10) {
        return `<span style="color: #00FF00;">Very Low</span>`; // Green
    } else if (damagePercentage < 20) {
        return `<span style="color: #7FFF00;">Low</span>`; // Lime Green
    } else if (damagePercentage < 30) {
        return `<span style="color: #FFD700;">Medium</span>`; // Gold
    } else if (damagePercentage < 60) {
        return `<span style="color: #FFA500;">High</span>`; // Orange
    } else if (damagePercentage <= 75) {
        return `<span style="color: #FF4500;">Very High</span>`; // Orange Red
    } else if (damagePercentage > 95) {
        return `<span style="color: #FF0000;">Overkill</span>`; // Red
    }
}

export function logUniqueMethodKeys(obj) {
  const uniqueMethodKeys = new Set();

  for (const key in obj) {
    const innerObj = obj[key];
    for (const prop in innerObj) {
      if (typeof innerObj[prop] === 'function') {
        uniqueMethodKeys.add(prop);
      }
    }
  }

  console.log([...uniqueMethodKeys]);
}


export async function getMoveLearnset(pokemon, options = {}) {
    const { default: moveLearnset } = await import(`../../../data/learnsets/${pokemon}.js`);
    const {
        level,
        power,
        category,
        priority,
        types,
        effects,
        limit = 5
    } = options;

    return moveLearnset
        .filter(ml => {
            const matchesLevel = level === undefined ? true : ml.required_level <= level;
            const matchesPower = !power ? true : 
                ml.power !== null && ml.power >= power.min && ml.power <= power.max;
            const matchesCategory = !category ? true : ml.category === category;
            const matchesPriority = priority === undefined ? true : ml.priority === priority;
            const matchesTypes = !types?.length ? true : types.includes(ml.type);
            const matchesEffects = true//!effects?.length ? true : effects.includes(ml.effect);

            return matchesLevel &&
                   matchesPower &&
                   matchesCategory &&
                   matchesPriority &&
                   matchesTypes &&
                   matchesEffects;
        })
        .toSorted((a, b) => {
            if (a.source === "level" && b.source !== "level") return -1;
            if (a.source !== "level" && b.source === "level") return 1;
            return b.required_level - a.required_level;
        })
        .slice(0, limit);
}

export function canDodge(attacker, defender, move) {
    if (move.accuracy === true || !defender.state.effects.canMove()) {
        return false;
    }

    // Get speed stats
    const attackerSpd = attacker.state.stats.get("spe");
    const defenderSpd = defender.state.stats.get("spe");
    
    // Get accuracy and evasion stats
    const attackerAccuracy = attacker.state.stats.get("accuracy")
    const defenderEvasion = defender.state.stats.get("evasion")

    // Base dodge chance using a modified speed ratio
    const speedRatio = defenderSpd / attackerSpd;
    const dodgeChance = Math.max(0.05, Math.min(speedRatio * 0.3, 0.7)); // Clamp between 5% and 70%

    // Accuracy and evasion modifiers
    const accuracyModifier = attackerAccuracy / defenderEvasion;

    // Calculate final hit chance
    const finalHitChance = move.accuracy * accuracyModifier * (1 - dodgeChance) * 0.70;
    console.log(defender.id, Math.round(finalHitChance))

    // Simulate random factor for dodge mechanics
    const randomFactor = Math.random() * 100;

    // Return true if defender dodges, false if the move hits
    const dodged = randomFactor > finalHitChance;

    return dodged
}

export function rankStats(pokemon) {
    const statsArray = Object.entries(pokemon.stats); // Convert stats object to array of [statName, statValue]
    
    // Sort the array in descending order of stat values
    statsArray.sort((a, b) => b[1] - a[1]);

    // Create a ranked object
    const result = {};
    statsArray.forEach(([statName], index) => {
        result[statName] = index + 1; // Assign rank starting from 1
    });

    return result;
}

export function flagsToObj(flags) {
    const obj = {};
    flags.split(' ').forEach(pair => {
        const [key, value] = pair.split('=');
        if (value === undefined) return; // Skip malformed entries
        obj[key] = isNaN(value) ? value : Number(value); // Auto-detect numbers
    });
    return obj;
}

// Converts object to simplified string
export function objToFlags(obj) {
    return Object.entries(obj)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
}
