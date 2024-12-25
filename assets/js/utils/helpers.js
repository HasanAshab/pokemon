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
