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
    static async init(pokemon1, pokemon2) {
        pokemon1.state = await BattleState.prepare(pokemon1)
        pokemon2.state = await BattleState.prepare(pokemon2)

        const states = new Map([
            [pokemon1, pokemon1.state],
            [pokemon2, pokemon2.state]
        ]);
        return new this(pokemon1, pokemon2, states)
    }
    
    constructor(pokemon1, pokemon2, states) {
        super()
        
        this.pokemon1 = pokemon1;
        this.pokemon2 = pokemon2;

        this._states = states

        this.on("wave", (...args) => {
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

        const damages = await calculateDamage(this.pokemon1, move1, this.pokemon2, move2)

        const canMove1 = this.state(this.pokemon1).canMove()
        const canMove2 = this.state(this.pokemon2).canMove()

        const dodged1 = move1.name === "$dodge" && canMove1 && this.canDodge(this.pokemon1, this.pokemon2, move2)
        const dodged2 = move2.name === "$dodge" && canMove2 && this.canDodge(this.pokemon2, this.pokemon1, move1)

        const effects1 = await getEffects(this.pokemon2, this.pokemon1, move2)
        const effects2 = await getEffects(this.pokemon1, this.pokemon2, move1)
/*
        if(
            (move1.name === "$nothing" && move2.name === "$nothing")
            ||
            (move1.name === "$dodge" && move2.name === "$dodge")
            ||
            (move1.name === "$nothing" && move2.name === "$dodge")
            ||
            (move1.name === "$dodge" && move2.name === "$nothing")
        ) {}
*/        
        if ((move1.makes_contact && !dodged2) || !move2.makes_contact || !canMove2) {
            applyStatChanges(this.pokemon1, this.pokemon2, move1)
        }
        if ((move2.makes_contact && !dodged1) || !move2.makes_contact || !canMove1) {
            applyStatChanges(this.pokemon2, this.pokemon1, move2)
        }

        this.state(this.pokemon1).emit("move-used", move1) 
        this.state(this.pokemon2).emit("move-used", move2) 

        if (damages.isHittee(this.pokemon1) && canMove2 && !dodged1) {
            this.state(this.pokemon1).decreaseHealth(await damages.on(this.pokemon1))
            this.state(this.pokemon1).effects.add(...effects1)
        }
        if (damages.isHittee(this.pokemon2) && canMove1 && !dodged2) {
            this.state(this.pokemon2).decreaseHealth(await damages.on(this.pokemon2))
            this.state(this.pokemon2).effects.add(...effects2)
        }
    }

    canDodge(pokemon1, pokemon2, move) {
        if (move.accuracy === null) {
            // Moves with null accuracy always hit
            return false;
        }
    
        // Get speed stats
        const pokemon1Spd = this.state(pokemon1).statOf("speed");
        const pokemon2Spd = this.state(pokemon2).statOf("speed");
        const isPhysical = move.damage_class === "physical";
    
        // Simulate hit/miss based on final accuracy
        const maxHitChance = isPhysical ? 10 : 7
        const minHitChance = isPhysical ? 2.5 : 3.5
        const hitChance = (Math.random() * maxHitChance) - minHitChance; 
        const dodgeChance = (pokemon2Spd / pokemon1Spd);
        console.log(dodgeChance > hitChance)
        return dodgeChance > hitChance;
    }
}


class BattleState extends Observable {
    static UNIVERSAL_MOVES = [
        {
            name: "$nothing",
            isSelected: true,
        },
        {
            name: "$dodge",
            isSelected: true,
        }
    ]
    
    static async prepare(pokemon) {
        const moves = []
        if(pokemon.meta.moves) {
            const movesMeta = pokemon.meta.moves.filter(moveMeta => moveMeta.isSelected)
            movesMeta.unshift(...BattleState.UNIVERSAL_MOVES)
            for (const moveMeta of movesMeta) {
                const move = await Move.make(moveMeta.name)
                moves.push(move)
            }
        }
        return new this(pokemon, moves)
    }
    
    constructor(pokemon, moves) {
        super()
        this.pokemon = pokemon;
        this.moves = moves;
        this.refresh();
        
        this.on("wave", () => {
            this.addWaveRetreat()
        })
        this.on("move-used", move => {
            this.retreat -= move.retreat
            this.reducePP(move.name)
        })
    }

    refresh() {
        this._statChanges = {};
        this._stats = { ...this.pokemon.data.stats };
        this._canMove = { enabled: true, afterTurn: 0 };
        this.retreat = this.pokemon.meta.retreat;
        this.effects = new EffectManager(this);
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
        move.pp--;
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
        return this._canMove.enabled
    }
}
