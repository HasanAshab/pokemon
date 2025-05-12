import { fixFloat } from "./helpers.js";


export class Damage {
    static STAB_MODIFIER = 1.3;
    static CRIT_MULTIPLIER = 1.8;
    static BASE_CRIT_CHANCE = 1 / 24;
    static RAND_MODIFIER_RANGE = [0.85, 0.15]
    
    criticalMultiplier = 1

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
        const critChance = this.attacker.state.stats.get("crit") + (
            Damage.BASE_CRIT_CHANCE
            * (1 + (this.move.critRatio ?? 0))
            * this.attacker.state.damage.critModifier());

        if (Math.random() < critChance) {
            this.criticalMultiplier = Damage.CRIT_MULTIPLIER
        }
        return this.criticalMultiplier
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
                return this.attacker.level * 1.5
        }
        
        let bp = null
        if (this.move.basePowerCallback) {
            if(this.target || this.move.basePowerCallback.length === 1) {
                try {
                    bp = this.move.basePowerCallback(this.attacker, this.target, this.move)
                }
                catch(e) {
                    console.error(e)
                }
            }
        }

        if (!bp) {
            bp = this.move.basePower
        }

        if (!bp) return null

        const gradeModifier = this.move._meta.grade ? 1 + (this.move._meta.grade * 0.1) : 1
        const eventModifier = ("state" in this.attacker ? this.attacker.state.damage.powerModifier(this.move.id) : 1) 

        bp *= eventModifier * gradeModifier
        this.move._bp = bp
        //console.log(this.move.id, ' BP: ', bp)

        const stab = this.attacker.isTypeOf(this.move.type) ? Damage.STAB_MODIFIER : 1
        const isSpecial = this.move.category === "Special";
        const attackStat = "state" in this.attacker 
            ? this.attacker.state.stats.get(isSpecial ? "spa" : "atk")
            : this.attacker.stats[isSpecial ? "spa" : "atk"];
        
        //return stab * bp * attackStat * 0.416;
        return stab * bp * attackStat * 0.65;
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
                * this.attacker.state.damage.modifier()
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
        this.damages = Array.from({ length: this.move.multiHit() }, (_, i) => {
            return new Damage(attacker, move, target)
        })
        move.hits = this.hitCount()
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
    
    toContactDamage(damage) {
        if (!damage) return damage
        const statMap = {
            "Physical": "def",
            "Special": "spd"
        }
        //console.log("here is bug", this.move.category)
        const defStat = this.target.state.stats.get(
            statMap[this.move.category] ?? "def"
        )
        const defModifier = 1 / defStat
        return damage * defModifier
    }
}
