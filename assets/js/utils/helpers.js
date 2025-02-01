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


export async function getMoveLearnset(pokemon, level, limit = 5) {
    const { default: moveLearnset } = await import(`../../../data/learnsets/${pokemon}.js`);
    return moveLearnset
        .filter(ml => ml.required_level <= level)
        .toSorted((a, b) => {
            if (a.source === "level" && b.source !== "level") return -1; // "level" comes first
            if (a.source !== "level" && b.source === "level") return 1;  // "tm" goes below "level"
            return b.required_level - a.required_level;                  // Sort by level otherwise
        })
        .slice(0, limit);
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
