import { fixFloat } from "./helpers.js";


const STAB_MODIFIER = 1.3;
const CRIT_MULTIPLIER = 1.5;
const BASE_CRIT_CHANCE = 1 / 24;

class Hit {
    isCritical = false
    effectiveness = 1
    randomModifier = 0.85
    damageCount = 0
    
    constructor(data) {
        Object.assign(this, data)
    }
}

class Damage {
    constructor(move, hits = []) {
        this.move = move
        this.hits = hits
    }
    
    totalDamage() {
        const damage = this.hits.reduce((total, hit) => {
            return total + hit.damageCount
        }, 0)

        return fixFloat(damage)
    }
    
    totalEffectiveness() {
        return this.hits.reduce((total, hit) => {
            return total + hit.effectiveness
        }, 0)
    }

    avgEffectiveness() {
        if (!this.hits.length) return 1
        return this.totalEffectiveness() / this.hits.length
    }
}

class DamageManager {
    constructor(damages) {
        this.pokemon1 = damages[0][0]
        this.pokemon2 = damages[1][0]
        this._damages = new Map(damages)
    }
    
    async on(pokemon) {
        if (!this._cache) {
            const pokemon2 = this.opponentOf(pokemon)
            const damage1 = this._damages.get(pokemon)
            const damage2 = this._damages.get(pokemon2)
            
            const totalDamage1 = damage1.totalDamage()
            const totalDamage2 = damage2.totalDamage()
            
            const effectiveness1 = damage2.avgEffectiveness()
            const effectiveness2 = damage1.avgEffectiveness()
            const pokeEffect1 = await pokemon2.effectiveness(damage1.move.type);
            const pokeEffect2 = await pokemon.effectiveness(damage2.move.type);

            const remDam1 = ((totalDamage1 / effectiveness1) * pokeEffect1) 
            const remDam2 = ((totalDamage2 / effectiveness2) * pokeEffect2)
            
            let remainingDamage;
            if ((damage1.move.damage_class !== "status" && damage2.move.damage_class !== "status") && damage1.move.makes_contact !== damage2.move.makes_contact) {
                remainingDamage = damage2.move.makes_contact === false ? fixFloat(remDam2) : -fixFloat(remDam1)
            }
            else {
                remainingDamage = fixFloat(remDam2 - remDam1)
            }
            this._cache = [pokemon, remainingDamage]
        }
        const damage = this._cache[0] === pokemon ? this._cache[1] : -this._cache[1]
        return damage
    }
    
    opponentOf(pokemon) {
        return pokemon === this.pokemon1
            ? this.pokemon2
            : this.pokemon1
    }

    async isHittee(pokemon) {
        const damage = await this.on(pokemon)
        return damage > 0
    }
}

export function calculateBaseDamage(pokemon1, move, pokemon2 = null) {
    if (move.isNotMove || move.power === null) {
        return null
    }
    const stab = pokemon1.isTypeOf(move.type) ? STAB_MODIFIER : 1;
    const isSpecial = move.damage_class === "special";
    const attackStat = "state" in pokemon1 
        ? pokemon1.state.statOf(isSpecial ? "special-attack" : "attack")
        : pokemon1.statOf(isSpecial ? "special-attack" : "attack");

    const defenseStat = pokemon2
        ? pokemon2.state.statOf(isSpecial ? "special-defense" : "defense")
        : 70; // Neutral defense if no target
    return stab * ((((((2 * pokemon1.level) / 5) + 2) * move.power * ((attackStat * 0.6) / defenseStat)) / 10) + 2);
}

export async function calculateDamage(pokemon1, move1, pokemon2, move2) {
    const damage1 = new Damage(move1)
    const damage2 = new Damage(move2)
    const damages = new DamageManager([
        [pokemon1, damage1],
        [pokemon2, damage2],
    ])

    const hitData1 = {}

    // Calculate type effectiveness for pokemon1's move
    hitData1.effectiveness = move2 
        ? await move1.effectiveness(move2.type) 
        : pokemon2 
        ? await pokemon2.effectiveness(move1.type)
        : 1;
    const critChance1 = BASE_CRIT_CHANCE * (1 + move1.meta.crit_rate);
    hitData1.isCritical = Math.random() < critChance1
    const criticalMultiplier1 = hitData1.isCritical ? CRIT_MULTIPLIER : 1;
    hitData1.randomModifier = Math.random() * 0.15 + 0.85;
    hitData1.damageCount = calculateBaseDamage(pokemon1, move1);

    if (hitData1.damageCount !== null) {
        hitData1.damageCount = (
              hitData1.damageCount
            * hitData1.effectiveness
            * hitData1.randomModifier
            * criticalMultiplier1
        )
    }
    const hit1 = new Hit(hitData1)
    damage1.hits.push(hit1)

    if (!move2) {
        // If only pokemon1 attacks, return its damage
        return damages
    }
    
    const hitData2 = {}
    // Calculate type effectiveness for pokemon2's move
    hitData2.effectiveness = await move2.effectiveness(move1.type);
    const critChance2 = BASE_CRIT_CHANCE * (1 + move2.meta.crit_rate);
    hitData2.isCritical = Math.random() < critChance2
    const criticalMultiplier2 = hitData2.isCritical ? CRIT_MULTIPLIER : 1;
    hitData2.randomModifier = Math.random() * 0.15 + 0.85;
    hitData2.damageCount = calculateBaseDamage(pokemon2, move2);

    if (hitData2.damageCount !== null) {
        hitData2.damageCount = (
              hitData2.damageCount
            * hitData2.effectiveness
            * hitData2.randomModifier
            * criticalMultiplier2
        )
    }
    
    const hit2 = new Hit(hitData2)
    damage2.hits.push(hit2)

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
