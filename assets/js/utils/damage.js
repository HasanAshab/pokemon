import { fixFloat } from "./helpers.js";


export class Damage {
    static STAB_MODIFIER = 1.3;
    static CRIT_MULTIPLIER = 1.5;
    static BASE_CRIT_CHANCE = 1 / 24;
    static RAND_MODIFIER_RANGE = [0.85, 0.15]
    
    constructor(attacker, move, target = null) {
        this.attacker = attacker
        this.target = target
        this.move = move
        
        this._calculate()
        this.count = fixFloat(this.count)
    }
    
    get isCritical() {
        return this.criticalMultiplier > 1
    }

    _setCriticalMultiplier() {
        const critChance = Damage.BASE_CRIT_CHANCE * (1 + this.move.critRatio);
        const isCritical = Math.random() < critChance
        return this.criticalMultiplier = isCritical ? Damage.CRIT_MULTIPLIER : 1
    }

    _setRandomModifier() {
        const min = Damage.RAND_MODIFIER_RANGE[0]
        const max = Damage.RAND_MODIFIER_RANGE[1]
        return this.randomModifier = Math.random() * max + min;
    }
    
    _calculateBase(){
        if (!this.move.basePower) {
            return null
        }
        const stab = this.attacker.isTypeOf(this.move.type) ? Damage.STAB_MODIFIER : 1;
        const isSpecial = this.move.category === "Special";
        const attackStat = "state" in this.attacker 
            ? this.attacker.state.stats.get(isSpecial ? "spa" : "atk")
            : this.attacker.stats[isSpecial ? "spa" : "atk"];
    
        const defenseStat = this.target
            ? this.target.state.stats.get(isSpecial ? "spd" : "def")
            : 70; // Neutral defense if no target
        return stab * ((((((2 * this.attacker.level) / 7) + 2) * this.move.basePower * ((attackStat * 0.6) / defenseStat)) / 10) + 2);
    }

    _calculate() {
        this.count = this._calculateBase();
        if (!this.target) {
            return this.count
        }
        
        this._setCriticalMultiplier()
        this._setRandomModifier()

        if (this.count !== null) {
            this.count = (
                  this.count
                * this.randomModifier
                * this.criticalMultiplier
            )
        }
        return this.count
    }
}

class DamageManager {
    constructor(damages) {
        this.pokemon1 = damages[0][0]
        this.pokemon2 = damages[1][0]
        this._damages = new Map(damages)
    }
    
    on(pokemon) {
        if (!this._cache) {
            const pokemon2 = this.opponentOf(pokemon)
            const damage1 = this._damages.get(pokemon)
            const damage2 = this._damages.get(pokemon2)

            const effectiveness1 = damage1.avgEffectiveness()
            const effectiveness2 = damage2.avgEffectiveness()
            
            const pokeEffect1 = pokemon2.effectiveness(damage1.move.type);
            const pokeEffect2 = pokemon.effectiveness(damage2.move.type);
            
            const totalDamage1 = damage1.totalDamage()
            const totalDamage2 = damage2.totalDamage()

            let remainingDamage;
            
            if (!pokemon.state.canMove()) {
                remainingDamage = totalDamage2 * pokeEffect2
            }
            else if (!pokemon2.state.canMove()) {
                remainingDamage = -(totalDamage1 * pokeEffect1)
            }
            else if (
                !["none", "status"].includes(damage1.move.damage_class)
                && !["none", "status"].includes(damage2.move.damage_class)
                && damage1.move.makes_contact !== damage2.move.makes_contact
            ) {
                remainingDamage = damage2.move.makes_contact === false ? totalDamage2 * pokeEffect2 : -totalDamage1 * pokeEffect1
            }
            else {
                const remDam1 = totalDamage1 * effectiveness1
                const remDam2 = totalDamage2 * effectiveness2
                remainingDamage = remDam2 - remDam1
                
                if (remainingDamage > 0) {
                    remainingDamage = (remainingDamage / effectiveness2) * pokeEffect2
                }
                else {
                    remainingDamage = (remainingDamage / effectiveness1) * pokeEffect1
                }
            }

            remainingDamage = fixFloat(remainingDamage)
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


function getRandomHits(move) {
  if (!Array.isArray(move.multihit)) {
    return move.multihit;
  }
  if (!move.multihit) {
    return 1;
  }
  // Specific probabilities for multi-hit moves like Fury Attack
  if (move.multihit[0] === 2 && move.multihit[1] === 5) {
    const probabilities = [2, 3, 4, 5];
    const weights = [3 / 8, 3 / 8, 1 / 8, 1 / 8];
    return weightedRandom(probabilities, weights);
  }
  return Math.floor(Math.random() * (move.multihit[1] - move.multihit[0] + 1)) + move.multihit[0];
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


