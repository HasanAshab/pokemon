import { EventEmitter, Observable } from "./event.js";
import { Move } from "./models.js";
import { EffectManager, getEffects } from "./effects.js"
import { applyStatChanges } from "./stats.js"
import { calculateDamage } from "./damage.js"
import { fixFloat } from "./helpers.js"


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
        })
        
        this.on("wave", (...args) => {
            this.waveNo++
            this.pokemon1.state.emit("wave", ...args)
            this.pokemon2.state.emit("wave", ...args)
        })

    }

    state(pokemon) {
        return this._states.get(pokemon);
    }

    async turn(senario) {
        this.emit("turn", this, senario)

        const senarioMap = new Map(senario)

        const move1 = senarioMap.get(this.pokemon1)
        const move2 = senarioMap.get(this.pokemon2)

        const effects1 = getEffects(this.pokemon2, this.pokemon1, move2)
        const effects2 = getEffects(this.pokemon1, this.pokemon2, move1)        
        
        const isFlinched1 = this._isFlinched(this.pokemon2, this.pokemon1, move2)
        const isFlinched2 = this._isFlinched(this.pokemon1, this.pokemon2, move1)
        console.log("char", isFlinched1)
        console.log("bulba", isFlinched2)
        
        this.pokemon1.state.isFlinched = isFlinched1
        this.pokemon2.state.isFlinched = isFlinched2
        
        const canMove1 = this.state(this.pokemon1).canMove()
        const canMove2 = this.state(this.pokemon2).canMove()

        const dodged1 = move1.name === "$dodge" && this._canDodge(this.pokemon1, this.pokemon2, move2)
        const dodged2 = move2.name === "$dodge" && this._canDodge(this.pokemon2, this.pokemon1, move1)

        const damages = await calculateDamage(this.pokemon1, move1, this.pokemon2, move2)

        if (move1.damage_class === "status") {
            this.state(this.pokemon2).effects.add(...effects2)
        }
        if (move2.damage_class === "status") {
            this.state(this.pokemon1).effects.add(...effects1)
        }
        if (await damages.isHittee(this.pokemon1) && !dodged1) {
            this.state(this.pokemon1).decreaseHealth(await damages.on(this.pokemon1))
            this.state(this.pokemon1).effects.add(...effects1)
        }
        if (await damages.isHittee(this.pokemon2) && !dodged2) {
            this.state(this.pokemon2).decreaseHealth(await damages.on(this.pokemon2))
            this.state(this.pokemon2).effects.add(...effects2)
        }
        if ((move1.makes_contact && !dodged2) || !move1.makes_contact || !canMove2) {
            applyStatChanges(this.pokemon1, this.pokemon2, move1)
        }
        if ((move2.makes_contact && !dodged1) || !move2.makes_contact || !canMove1) {
            applyStatChanges(this.pokemon2, this.pokemon1, move2)
        }
        
        this.pokemon1.state.isFlinched = false
        this.pokemon2.state.isFlinched = false

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
        const attackerSpd = this.state(attacker).statOf("speed");
        const targetSpd = this.state(target).statOf("speed");
        const isPhysical = move.damage_class === "physical";
    
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

    _statChanges = {};
    _canMove = true

    constructor(battleField, pokemon) {
        super()
        this.battleField = pokemon;
        this.pokemon = pokemon;

        this._stats = pokemon.stats.all();
        this.retreat = pokemon.meta.retreat;
        this.effects = new EffectManager(this);
        
        if(pokemon.meta.moves) {
            pokemon.meta.moves.forEach(moveMeta => {
                if (moveMeta.isSelected) {
                    const move = new Move(moveMeta.name)
                    this.moves.push(move)
                }
            })
        }

        this.on("wave", () => {
            this.addWaveRetreat()
        })
        this.on("move-used", move => {
            this.retreat -= move.retreat
            this.reducePP(move.name)
        })
    }

    addWaveRetreat() {
        this.retreat += this.pokemon.meta.retreat;
    }

    stats() {
        const calculatedStats = {};
        for (const stat in this._stats) {
            const baseStat = this._stats[stat];
            const stage = this._statChanges[stat] || 0;
            const multiplier = this._statStageMultiplier(stage);
            calculatedStats[stat] = fixFloat(baseStat * multiplier);
        }
        return calculatedStats;
    }

    statOf(name) {
        const baseStat = this._stats[name];
        const stage = this._statChanges[name] || 0;
        const multiplier = this._statStageMultiplier(stage);
        return fixFloat(baseStat * multiplier);
    }

    // Health Management
    increaseHealth(amount) {
        const maxHealth = this.statOf("hp"); // Use calculated HP stat
        this._stats.hp = Math.min(this._stats.hp + amount, maxHealth);
    }

    decreaseHealth(amount) {
        this._stats.hp = Math.max(this._stats.hp - amount, 0);
    }

    // Stat Management
    applyStatChange(stat, stages) {
        if (!this._statChanges[stat]) {
            this._statChanges[stat] = 0;
        }

        // Stat stage clamping (-6 to +6)
        const newStage = Math.max(-6, Math.min(6, this._statChanges[stat] + stages));
        this._statChanges[stat] = newStage;
    }

    canUseMove(moveName) {
        const move = this.moves.find(m => m.name === moveName)
        return move.retreat <= this.retreat && (move.pp === null || move.pp > 0)
    }

    reducePP(moveName) {
        const move = this.moves.find(m => m.name === moveName)
        if (move.pp !== null) move.pp--
        return move
    }

    resetStatChanges() {
        this._statChanges = {};
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

    canMove() {
        return !this.isFlinched && this._canMove
    }
}
