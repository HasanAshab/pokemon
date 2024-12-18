import { EventEmitter, Observable } from "./event.js";
import { Move } from "./models.js";
import { EffectManager } from "./effects.js"
import { Damage } from "./damage.js"
import { fixFloat } from "./helpers.js"


export class BattleField extends EventEmitter {
    turnNo = 1
    waveNo = 1

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
            this.pokemon1.state.emit("turn", ...args)
            this.pokemon2.state.emit("turn", ...args)
        })
        
        this.on("turn-end", (...args) => {
            this.turnNo++
            this.pokemon1.state.emit("turn-end", ...args)
            this.pokemon2.state.emit("turn-end", ...args)
            
            !this.pokemon1.state.usableOffensiveMoves().length
            && !this.pokemon2.state.usableOffensiveMoves().length
            && this.emit("wave")
        })
        
        this.on("wave", (...args) => {
            this.waveNo++
            this.pokemon1.state.emit("wave", ...args)
            this.pokemon2.state.emit("wave", ...args)
        })

    }

    opponentOf(pokemon) {
        return pokemon === this.pokemon1 ? this.pokemon2 : this.pokemon1;
    }

    state(pokemon) {
        return this._states.get(pokemon);
    }


    turn(senario) {
        this.emit("turn", this, senario)

        const senarioMap = new Map(senario)

        const move1 = senarioMap.get(this.pokemon1)
        const move2 = senarioMap.get(this.pokemon2)
        
        this.pokemon1.state.effects.apply("self", move2)
        this.pokemon2.state.effects.apply("self", move1)
        
        this.pokemon1.state.stats.apply("self", move2)
        this.pokemon2.state.stats.apply("self", move1)

        
        const canMove1 = this.pokemon1.state.canMove()
        const canMove2 = this.pokemon2.state.canMove()

        const dodged1 = move1.name === "$dodge" && this._canDodge(this.pokemon1, this.pokemon2, move2)
        const dodged2 = move2.name === "$dodge" && this._canDodge(this.pokemon2, this.pokemon1, move1)


        const damage1 = new Damage(this.pokemon1, move1, this.pokemon2)
        const damage2 = new Damage(this.pokemon2, move2, this.pokemon1)
        
        const pokeEffect1 = this.pokemon2.effectiveness(move1.type);
        const pokeEffect2 = this.pokemon1.effectiveness(move2.type);
            
        const moveEffect1 = move1.effectiveness(move2.type)
        const moveEffect2 = move2.effectiveness(move1.type)
            
        let damage
        if (!canMove1) {
            damage = damage1.count * pokeEffect2
        }
        else if (!canMove2) {
            damage = -(damage1.count * pokeEffect1)
        }
        else if (
            !["None", "Status"].includes(move1.category)
            && !["None", "Status"].includes(move1.category)
            && move1.flags.contact !== move2.flags.contact
        ) {
            damage = move1.flags.contact === 1 ? damage2.count * pokeEffect2 : -damage1.count * pokeEffect1
        }
        else {
            damage = (damage2.count * moveEffect2) - (damage1.count * moveEffect1)
            const pokeEffect = damage > 0 ? pokeEffect2 : pokeEffect1
            damage = damage * pokeEffect
        }
        
        const hittee = damage > 0 ? this.pokemon1 : this.pokemon2
        damage = Math.abs(damage)
        

        if (hittee === this.pokemon1 && !dodged1) {
            this.pokemon1.state.decreaseHealth(damage)
            this.pokemon1.state.effects.apply("target", move2)
        }
        if (hittee === this.pokemon2 && !dodged2) {
            this.pokemon2.state.decreaseHealth(damage)
            this.pokemon2.state.effects.apply("target", move1)
        }
        
        //todo hittee o dekh
        if (move1.category === "Status" || !dodged2 || !canMove2) {
            this.pokemon1.state.stats.apply("target", move2)
        }
        if (move2.category === "Status" || !dodged1 || !canMove1) {
            this.pokemon2.state.stats.apply("target", move1)
        }

        canMove1 && this.state(this.pokemon1).emit("move-used", move1) 
        canMove2 && this.state(this.pokemon2).emit("move-used", move2) 
        this.emit("turn-end", this, senario)
    }

    _canDodge(attacker, target, move) {
        if (move.accuracy === null || !target.state.canMove()) {
            // Moves with null accuracy always hit
            return false;
        }
    
        // Get speed stats
        const attackerSpd = this.state(attacker).stats.get("speed");
        const targetSpd = this.state(target).stats.get("speed");
        const isPhysical = move.category === "Physical";
    
        // Simulate hit/miss based on final accuracy
        const maxHitChance = isPhysical ? 10 : 7
        const minHitChance = isPhysical ? 2.5 : 3.5
        const hitChance = (Math.random() * maxHitChance) - minHitChance; 
        const dodgeChance = (targetSpd / attackerSpd);
        return dodgeChance > hitChance;
    }
    
    _isFlinched(attacker, target, move) {
        if(!move?.meta?.flinch_chance) return false
        return Math.random() < (move.meta.flinch_chance / 100)
    }
}


class BattleState extends Observable {
    moves = [
        new Move("stay-there"),
        new Move("dodge")
    ]

    _canMove = true

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
        this.on("move-used", move => {
            this.retreat -= move.retreat
            this.reducePP(move.id)
        })
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

    canMove() {
        return !this.isFlinched && this._canMove
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
        if (!statChanged) return
        
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
