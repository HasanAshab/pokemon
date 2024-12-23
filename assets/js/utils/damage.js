import { fixFloat, weightedRandom } from "./helpers.js";


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
    
    isCritical() {
        return this.criticalMultiplier > 1
    }

    _setCriticalMultiplier() {
        const critChance = Damage.BASE_CRIT_CHANCE * (1 + (this.move.critRatio ?? 1));
        const isCritical = Math.random() < critChance
        return this.criticalMultiplier = isCritical ? Damage.CRIT_MULTIPLIER : 1
    }

    _setRandomModifier() {
        const [min, max] = Damage.RAND_MODIFIER_RANGE
        return this.randomModifier = Math.random() * max + min;
    }
    
    _calculateBase() {
        if (this.move.damage) {
            if (typeof this.move.damage === "number") 
                return this.move.damage
            if (this.move.damage === "level")
                return this.attacker.level * 2
        }
        
        let bp = this.move.basePower
        if (this.move.basePowerCallback) {
            if(this.target || this.move.basePowerCallback.length === 1)
                bp = this.move.basePowerCallback(this.attacker, this.target, this.move)
        }
        
        if (!bp) return null

        const stab = this.attacker.isTypeOf(this.move.type) ? Damage.STAB_MODIFIER : 1;
        const isSpecial = this.move.category === "Special";
        const attackStat = "state" in this.attacker 
            ? this.attacker.state.stats.get(isSpecial ? "spa" : "atk")
            : this.attacker.stats[isSpecial ? "spa" : "atk"];

        const defenseStat = this.target
            ? this.target.state.stats.get(isSpecial ? "spd" : "def")
            : 70; // Neutral defense if no target
        return stab * ((((((2 * this.attacker.level) / 7) + 2) * (bp * 1.05) * (attackStat / defenseStat)) / 10) + 2);
    }

    _calculate() {
        this.count = this._calculateBase();
        if (!this.target || this.move.damage) {
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

export class Hit {
    constructor(attacker, move, target = null) {
        this.attacker = attacker
        this.target = target
        this.move = move
        this.damages = Array.from({ length: this._randomHits() }, (_, i) => {
            move.hit++
            return new Damage(attacker, move, target)
        })
    }

    damage() {
        return this.damages.reduce((acc, damage) => {
            return acc + damage.count
        }, 0)
    }
    
    hitCount() {
        return this.damages.length
    }
    
    criticalCount() {
        return this.damages.reduce((acc, damage) => {
            return damage.isCritical() ? acc + 1 : acc
        }, 0)
    }
    
    isMultiHit() {
        return this.hitCount() > 1
    }

    _randomHits() {
        if(!this.move.multihit)
            return 1
        if (!Array.isArray(this.move.multihit))
            return this.move.multihit;
        // Specific probabilities for multi-hit moves like Fury Attack
        if (this.move.multihit[0] === 2 && this.move.multihit[1] === 5) {
            const probabilities = [2, 3, 4, 5];
            const weights = [3 / 8, 3 / 8, 1 / 8, 1 / 8];
            return weightedRandom(probabilities, weights);
        }
        return Math.floor(Math.random() * (this.move.multihit[1] - this.move.multihit[0] + 1)) + this.move.multihit[0];
    }
}
