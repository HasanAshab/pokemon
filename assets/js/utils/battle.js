import { EventEmitter, Observable } from "./event.js";
import { Move } from "./models.js";
import { EffectManager } from "./effects.js"
import { Hit } from "./damage.js"
import { fixFloat, weightedRandom } from "./helpers.js"


export class BattleField extends EventEmitter {
    //Possible turns per wave with their weight
    static TURNS_PER_WAVE = [
        [2, 0.2],
        [3, 0.4],
        [4, 0.3],
        [6, 0.1],
    ]

    turnNo = 0
    waveNo = 0

    constructor(pokemon1, pokemon2) {
        super()
        
        this.pokemon1 = pokemon1;
        this.pokemon2 = pokemon2;

        this.pokemon1.state = new BattleState(this, pokemon1)
        this.pokemon2.state = new BattleState(this, pokemon2)

        this._states = new Map([
            [pokemon1, pokemon1.state],
            [pokemon2, pokemon2.state]
        ]);

        this.on("turn", (...args) => {
            if(!this._waveAfterTurns) {
                this._setWaveTurns()
            }
            this.turnNo++
            this._waveAfterTurns--

            this.pokemon1.state.emit("turn", ...args)
            this.pokemon2.state.emit("turn", ...args)
        })
        
        this.on("turn-end", (...args) => {
            !this._waveAfterTurns && this.emit("wave")

            this.pokemon1.state.emit("turn-end", ...args)
            this.pokemon2.state.emit("turn-end", ...args)
            !this.pokemon1.state.usableOffensiveMoves().length
            && !this.pokemon2.state.usableOffensiveMoves().length
            && this.emit("wave")
        })

        this.on("wave", (...args) => {
            this.waveNo++
            this._waveAfterTurns = 0
            this.pokemon1.state.emit("wave", ...args)
            this.pokemon2.state.emit("wave", ...args)
        })
    }

    opponentOf(pokemon) {
        return pokemon.id === this.pokemon1.id ? this.pokemon2 : this.pokemon1;
    }

    state(pokemon) {
        return this._states.get(pokemon);
    }

    turn(senario) {
        this.emit("turn", this, senario)

        const senarioMap = new Map(senario)

        const move1 = senarioMap.get(this.pokemon1)
        const move2 = senarioMap.get(this.pokemon2)
        
        this.pokemon1.state.effects.apply(move2, { on: "self" })
        this.pokemon2.state.effects.apply(move1, { on: "self" })
        
        this.pokemon1.state.effects.apply(move2, {
            on: "target",
            pre: true,
        })
        this.pokemon2.state.effects.apply(move1, {
            on: "target",
            pre: true,
        })

        const canMove1 = this.pokemon1.state.effects.canMove()
        const canMove2 = this.pokemon2.state.effects.canMove()
        
        const attackSelf1 = this.pokemon1.state.effects.attackSelf()
        const attackSelf2 = this.pokemon2.state.effects.attackSelf()

        const dodged1 = move1.name === "$dodge" && this._canDodge(this.pokemon1, this.pokemon2, move2)
        const dodged2 = move2.name === "$dodge" && this._canDodge(this.pokemon2, this.pokemon1, move1)

        const hit1 = new Hit(this.pokemon1, move1, this.pokemon2)
        const hit2 = new Hit(this.pokemon2, move2, this.pokemon1)
        
        canMove2 && this.pokemon1.state.stats.apply("self", move2)
        canMove1 && this.pokemon2.state.stats.apply("self", move1)

        const pokeEffect1 = this.pokemon2.effectiveness(move1.type);
        const pokeEffect2 = this.pokemon1.effectiveness(move2.type);

        const moveEffect1 = move1.effectiveness(move2.type)
        const moveEffect2 = move2.effectiveness(move1.type)

        const damages = new Map([
            [this.pokemon1, 0],
            [this.pokemon2, 0]
        ])

        if (!canMove1) {
            damages.set(this.pokemon1, hit2.damage() * pokeEffect2)
        }
        else if (!canMove2) {
            damages.set(this.pokemon2, hit1.damage() * pokeEffect1)
        }
        else if(!attackSelf1 && attackSelf2) {
            const selfHitDamage = hit2.damage() * this.pokemon2.effectiveness(move2)
            const damage = hit1.damage() * pokeEffect1
            damages.set(this.pokemon2, damage + selfHitDamage)
        }
        else if(attackSelf1 && !attackSelf2) {
            const selfHitDamage = hit1.damage() * this.pokemon1.effectiveness(move1)
            const damage = hit2.damage() * pokeEffect2
            damages.set(this.pokemon1, damage + selfHitDamage)
        }
        else if(attackSelf1 && attackSelf2) {
            const selfHitDamage1 = hit1.damage() * this.pokemon1.effectiveness(move1)
            const selfHitDamage2 = hit2.damage() * this.pokemon2.effectiveness(move2)
            damages.set(this.pokemon1, selfHitDamage1)
            damages.set(this.pokemon2, selfHitDamage2)
        }
        else if(move1.category === "Physical" && move2.category === "Physical" && move1.flags.contact && !move2.flags.contact) {
            const recoil = hit2.damage() * 0.10
            const damage = (hit1.damage() * moveEffect1) - ((hit2.damage() - recoil) * moveEffect2)
            
            damages.set(this.pokemon1, recoil * pokeEffect1)
            damage > 0
                ? damages.set(this.pokemon1, damages.get(this.pokemon1) + (damage * pokeEffect1))
                : damages.set(this.pokemon2, -damage * pokeEffect1);
        }
        else if(move1.category === "Physical" && move2.category === "Physical" && move2.flags.contact && !move1.flags.contact) {
            const recoil = hit1.damage() * 0.10
            const damage = (hit2.damage() * moveEffect2) - ((hit1.damage() - recoil) * moveEffect1)
            
            damages.set(this.pokemon2, recoil * pokeEffect2)
            damage > 0
                ? damages.set(this.pokemon1, damage * pokeEffect1)
                : damages.set(this.pokemon2, damages.get(this.pokemon2) + (-damage * pokeEffect2));
        }
        else if (
            !["None", "Status"].includes(move1.category)
            && !["None", "Status"].includes(move2.category)
            && move1.flags.contact !== move2.flags.contact
        ) {
            move2.flags.contact === 1
                ? damages.set(this.pokemon2, hit1.damage() * pokeEffect1)
                : damages.set(this.pokemon1, hit2.damage() * pokeEffect2)
        }
        else {
            const damage = (hit2.damage() * moveEffect2) - (hit1.damage() * moveEffect1)
            damage > 0
                ? damages.set(this.pokemon1, damage * pokeEffect1)
                : damages.set(this.pokemon2, -damage * pokeEffect2);
        }

        if (damages.get(this.pokemon1) && !dodged1) {
            this.pokemon1.state.decreaseHealth(damages.get(this.pokemon1))
        }
        if (damages.get(this.pokemon2) && !dodged2) {
            this.pokemon2.state.decreaseHealth(damages.get(this.pokemon2))
        }
        if (!attackSelf2 && ((damages.get(this.pokemon1) && !dodged1) || move2.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove1)) {
            this.pokemon1.state.effects.apply(move2, { on: "target" })
            this.pokemon1.state.stats.apply("target", move2)
        }
        if (!attackSelf1 && ((damages.get(this.pokemon2) && !dodged2) || move1.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove2)) {
            this.pokemon2.state.effects.apply(move1, { on: "target" })
            this.pokemon2.state.stats.apply("target", move1)
        }
        if (attackSelf1) {
            this.pokemon1.state.effects.apply(move1, { on: "target" })
            this.pokemon1.state.stats.apply("target", move1)
        }
        if (attackSelf2) {
            this.pokemon2.state.effects.apply(move2, { on: "target" })
            this.pokemon2.state.stats.apply("target", move2)
        }

        if(canMove1 && (move1.category === "Status" || (move1.flags.contact && move2.flags.contact) || !move1.flags.contact)) {
            this.pokemon1.state.emit("used-move", move1) 
        }
        if(canMove2 && (move2.category === "Status" || (move2.flags.contact && move1.flags.contact) || !move2.flags.contact)) {
            this.pokemon2.state.emit("used-move", move2) 
        }
        this.emit("turn-end", this, senario)
    }

    _canDodge(attacker, target, move) {
        if (move.accuracy === null || !target.state.canMove()) {
            return false; // Moves with null accuracy (e.g., Swift) or immobile targets always hit
        }
    
        // Get speed stats
        const attackerSpd = this.state(attacker).stats.get("speed");
        const targetSpd = this.state(target).stats.get("speed");
        const isPhysical = move.category === "Physical";
    
        // Get accuracy and evasion stats
        const attackerAccuracy = this.state(attacker).stats.get("accuracy") || 1; // Default to 1 if not defined
        const targetEvasion = this.state(target).stats.get("evasion") || 1; // Default to 1 if not defined
    
        // Base dodge chance using speed ratio
        const dodgeChance = targetSpd / attackerSpd;
    
        // Accuracy and evasion modifiers
        const accuracyModifier = attackerAccuracy / targetEvasion;
    
        // Simulate hit/miss based on final accuracy and dodge chance
        const maxHitChance = isPhysical ? 10 : 7;
        const minHitChance = isPhysical ? 2.5 : 3.5;
        const randomFactor = (Math.random() * maxHitChance) - minHitChance;
    
        // Calculate final hit chance
        const finalHitChance = move.accuracy * accuracyModifier - randomFactor;
    
        // Return true if target dodges, false if the move hits
        return dodgeChance > finalHitChance;
    }

    _setWaveTurns() {
        const turns = BattleField.TURNS_PER_WAVE.map(tpw => tpw[0])
        const weights = BattleField.TURNS_PER_WAVE.map(tpw => tpw[1])
        return this._waveAfterTurns = weightedRandom(turns, weights)
    }
}


class BattleState extends Observable {
    moves = [
        new Move("staythere"),
        new Move("dodge")
    ]

    constructor(field, pokemon) {
        super()
        this.field = field;
        this.pokemon = pokemon;

        this.retreat = pokemon.meta.retreat;
        this.stats = new StatsManager(this);
        this.effects = new EffectManager(this);
        
        if(pokemon.meta.moves) {
            pokemon.meta.moves.forEach(moveMeta => {
                if (moveMeta.isSelected) {
                    const move = new Move(moveMeta.id)
                    this.moves.push(move)
                }
            })
        }

        this.on("wave", () => {
            this.addWaveRetreat()
        })
        this.on("used-move", move => {
            this.retreat -= move.retreat
            this.reducePP(move.id)
        })
        
        // this.on("turn", () => {
//             this.tempState = {
//                 touched: false,
//                 canMove: true,
//             }
//         })
    }

    addWaveRetreat() {
        this.retreat += this.pokemon.meta.retreat;
    }

    // Health Management
    increaseHealth(amount) {
        const maxHealth = this.stats.get("hp"); // Use calculated HP stat
        const newHp = Math.min(this.stats.get("hp") + amount, maxHealth);
        return this.stats.set("hp", newHp);
    }

    decreaseHealth(amount) {
        return this.stats.set("hp", Math.max(this.stats.get("hp") - amount, 0));
    }

    canUseMove(moveId) {
        const move = this.moves.find(m => m.id === moveId)
        return move.retreat <= this.retreat && (move.pp === null || move.pp > 0)
    }

    usableMoves() {
        return this.moves.filter(m => this.canUseMove(m.id))
    }
    
    usableOffensiveMoves() {
        return this.usableMoves().filter(m => m.isOffensive)
    }

    reducePP(moveId) {
        const move = this.moves.find(m => m.id === moveId)
        if (move.pp !== null) move.pp--
        return move
    }
}


class StatsManager {
    _statChanges = {};

    constructor(state) {
        this.state = state;
        this._stats = Object.assign({}, state.pokemon.stats, state.pokemon.meta.stats);
    }

    get(name) {
        const baseStat = this._stats[name];
        const stage = this._statChanges[name] || 0;
        const multiplier = this._statStageMultiplier(stage);
        return fixFloat(baseStat * multiplier);
    }

    set(name, value) {
        return this._stats[name] = value;
    }

    all() {
        return Object.keys(this._stats).map(stat => this.get(stat));
    }

    apply(on, move) {
        const statChanged = Math.random() < (move.statChanges.chance / 100)
        //if (!statChanged) return

        if(on === "self") {
            const attacker = this.state.field.opponentOf(this.state.pokemon);
            for (const [stat, change] of Object.entries(move.statChanges.self)) {
                attacker.state.stats.applyStatChange(stat, change)
            }
        }
        else if (on === "target") {
            for (const [stat, change] of Object.entries(move.statChanges.target)) {
                this.applyStatChange(stat, change)
            }
        }
    }

    applyStatChange(stat, stages) {
        if (!this._statChanges[stat]) {
            this._statChanges[stat] = 0;
        }

        // Stat stage clamping (-6 to +6)
        const newStage = Math.max(-6, Math.min(6, this._statChanges[stat] + stages));
        this._statChanges[stat] = newStage;
    }

    _statStageMultiplier(stage) {
        if (stage > 0) {
            return (2 + stage) / 2; // Positive stages
        } else if (stage < 0) {
            return 2 / (2 - stage); // Negative stages
        } else {
            return 1; // Neutral stage
        }
    }
}


export async function calculateWinXP(poke1, poke2) {
    const levelMultiplier = (poke2.level / poke1.level) * 5;
    const baseXp = 10
    let typeEffectiveness1 = 1
    let typeEffectiveness2 = 1

    for (const type of poke2.data.types) {
        typeEffectiveness1 *= await poke1.effectiveness(type)
    }
    for (const type of poke1.data.types) {
        typeEffectiveness2 *= await poke2.effectiveness(type)
    }
    
    const typeEffectiveness = typeEffectiveness1 / typeEffectiveness2

    const xp = Math.floor(baseXp * levelMultiplier * typeEffectiveness);
    return xp;
}
