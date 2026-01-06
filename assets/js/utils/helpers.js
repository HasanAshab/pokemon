export const sumObj = (obj1, obj2) => {
  const obj = Object.assign({}, obj2)
  for (const key in obj1) {
    obj[key] = obj1[key] + (obj2[key] || 0)
  }
  return obj
}
  
export const modObj = (obj, mod) => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = obj[key] * mod
    return acc
  }, {})
}

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

export function sliceObj(obj, start, end) {
    return Object.fromEntries(
        Object.entries(obj).slice(start, end)
    )
}

export function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array
}


export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

export function getPokemonsMeta(name) {
    let pokemons_meta = JSON.parse(localStorage.getItem("pokemons-meta") || "{}")
    pokemons_meta = Object.keys(pokemons_meta).reduce((acc, name) => {
      const meta = pokemons_meta[name]
      meta.name = name
      acc[name] = meta
      return acc
    }, {})
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


export function weightedRandomV2(choices, weights) {
  if (choices.length !== weights.length) {
    throw new Error('choices and weights must have the same length');
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const rand = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (let i = 0; i < choices.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) {
      return choices[i];
    }
  }

  // fallback (should never hit unless floating point issue)
  return choices[choices.length - 1];
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

export function calcLevelStat(statName, baseStat, level) {
    if (level === 0) return 0
    const ev = 0; // Effort values from `efforts`
    const iv = 35; // Default IV value

    if (statName === "hp") {
      // HP calculation
      return Math.floor(
        ((8 * baseStat + iv + Math.floor(ev / 4)) * level) / 100 + level + 10
      );
    }
    else if (statName === "spe") {
        return level * 0.25
    }
    else {
      // Other stat calculations
      return Math.floor(
        ((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100 + 5
      );
    }
}


export function queryMoves(query, moves = MOVES) {
    const {
        power,
        category,
        priority,
        contact,
        types,
        effects,
    } = query;
    const matchedMoves = {}
    
    for(const id in moves) {
        const move = moves[id]
        const matchesPower = !power ? true : 
            move.basePower !== null && move.basePower >= power.min && move.basePower <= power.max;
        const matchesCategory = !category ? true : move.category === category;
        const matchesPriority = priority === undefined ? true : move.priority === priority;
        const matchesContact = contact === undefined ? true : move.flags.contact === contact;
        const matchesTypes = !types?.length ? true : types.includes(move.type);
        const matchesEffects = true//!effects?.length ? true : effects.includes(move.effects);
    
        const matched = matchesPower &&
               matchesCategory &&
               matchesPriority &&
               matchesContact &&
               matchesTypes &&
               matchesEffects;
        if (matched) {
            matchedMoves[id] = move
        }
    }
    
    return matchedMoves
}

export async function getMoveLearnset(pokemon, options = {}) {
    const { default: MOVES } = await import("../../../data/moves.js");
    const { default: moveLearnset } = await import(`../../../data/learnsets/${pokemon}.js`);
    const {
        level,
        limit = 5,
        ...query
    } = options;

    const moves = moveLearnset
        .filter(ml => level === undefined ? true : ml.required_level <= level)
        .toSorted((a, b) => {
            if (a.source === "level" && b.source !== "level") return -1;
            if (a.source !== "level" && b.source === "level") return 1;
            return b.required_level - a.required_level;
        })
        .reduce((obj, ml) => {
            obj[ml.name] = MOVES[ml.name]
            return obj
        }, {})
    const matchedMoves = queryMoves(query, moves)
    return Object.keys(sliceObj(matchedMoves, 0, limit))
}

// getMoveLearnset("charizard", {
//     level: 36,
//     limit: 4,
//     power: {
//         min: 50,
//         max: 1000,
//     }
// }).then(console.log)

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
    const speedRatio = Math.abs(defenderSpd / attackerSpd);
    const dodgeChance = Math.max(0.05, Math.min(speedRatio * 0.3, 0.85)); // Clamp between 5% and 85%

    // Accuracy and evasion modifiers
    const accuracyModifier = attackerAccuracy / defenderEvasion;

    // Calculate final hit chance
    const finalHitChance = move.accuracy * accuracyModifier * (1 - dodgeChance) * 0.75;

    // Simulate random factor for dodge mechanics
    const randomFactor = Math.random() * 100;

    // Return true if defender dodges, false if the move hits
    const dodged = randomFactor > finalHitChance;
    console.log(defender.name, Math.round(finalHitChance), dodged)
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