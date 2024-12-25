import { EventEmitter, Observable } from "./event.js";
import { Move } from "./models.js";
import { EffectManager } from "./effects.js"
import { Hit } from "./damage.js"
import { fixFloat, weightedRandom } from "./helpers.js"


export class BattleField extends EventEmitter {
    //Possible turns per wave with their weight
    static TURNS_PER_WAVE = [
        [2, 0.2],
        [3, 0.45],
        [4, 0.3],
        [6, 0.05],
    ]

    turnNo = 0
    waveNo = 0
    
    context = new BattleContext({
        veryClose: false
    })

    constructor(pokemon1, pokemon2) {
        super()
        
        this.pokemon1 = pokemon1;
        this.pokemon2 = pokemon2;

        if(!this.pokemon1.state) {
            this.pokemon1.state = new BattleState(this, pokemon1)
        }
        if(!this.pokemon2.state) {
            this.pokemon2.state = new BattleState(this, pokemon2)
        }

        this._states = new Map([
            [pokemon1, pokemon1.state],
            [pokemon2, pokemon2.state]
        ]);

        this._prompts = new Map([
            [pokemon1, new BattlePrompt()],
            [pokemon2, new BattlePrompt()]
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
        
        this.on("turn-end", () => {
            !this._waveAfterTurns && this.emit("wave")
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

    prompt(pokemon) {
        return this._prompts.get(pokemon);
    }

    async turn(senario) {
        if(this.context.get("veryClose")) {
            senario.forEach((move, p) => {
                console.log(move)
                !move.flags.contact && senario.set(p, new Move("staythere"))
            })
        }

        this.emit("turn", this, senario)

        const move1 = senario.get(this.pokemon1)
        const move2 = senario.get(this.pokemon2)
        
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


        const usedDodge1 = move1.id === "dodge"
        const usedDodge2 = move2.id === "dodge"
        let dodged1 = usedDodge1 && this._canDodge(this.pokemon2, this.pokemon1, move2)
        let dodged2 = usedDodge2 && this._canDodge(this.pokemon1, this.pokemon2, move1)

        const hit1 = new Hit(this.pokemon1, move1, this.pokemon2)
        const hit2 = new Hit(this.pokemon2, move2, this.pokemon1)
        
        canMove2 && this.pokemon1.state.stats.apply("self", move2)
        canMove1 && this.pokemon2.state.stats.apply("self", move1)

        const pokeEffect1 = this.pokemon2.effectiveness(move1);
        const pokeEffect2 = this.pokemon1.effectiveness(move2);

        const moveEffect1 = move1.effectiveness(move2)
        const moveEffect2 = move2.effectiveness(move1)

        const damages = new Map([
            [this.pokemon1, 0],
            [this.pokemon2, 0]
        ])
        
        const instantDamages = new Map([
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
        else if(move1.priority !== move2.priority) {
            damages.set(this.pokemon1, hit2.damage() * pokeEffect2)
            damages.set(this.pokemon2, hit1.damage() * pokeEffect1)
        }
        else if(move1.category === "Physical" && move2.category === "Physical" && move1.flags.contact && !move2.flags.contact) {
            const thornsDamage = hit2.damage() * 0.10
            const damage = ((hit2.damage() - thornsDamage) * moveEffect2) - (hit1.damage() * moveEffect1)
            instantDamages.set(this.pokemon1, thornsDamage * pokeEffect1)

            if (damage > 0) {
                const wantDodge = await this.prompt(this.pokemon1).ask("dodge")
                if (wantDodge) {
                    dodged1 = this._canDodge(this.pokemon2, this.pokemon1, move2)
                    this.pokemon1.state.emit("used-move", new Move("dodge"))
                }
                damages.set(this.pokemon1, damage * pokeEffect1)
            }
            else {
                const wantDodge = await this.prompt(this.pokemon2).ask("dodge")
                if (wantDodge) {
                    dodged2 = this._canDodge(this.pokemon1, this.pokemon2, move1)
                    this.pokemon2.state.emit("used-move", new Move("dodge"))
                }
                damages.set(this.pokemon2, -damage * pokeEffect2);
            }
        }
        else if(move1.category === "Physical" && move2.category === "Physical" && move2.flags.contact && !move1.flags.contact) {
            const thornsDamage = hit1.damage() * 0.10
            const damage = (hit2.damage() * moveEffect2) - ((hit1.damage() - thornsDamage) * moveEffect1)
            instantDamages.set(this.pokemon2, thornsDamage * pokeEffect2)
            
            if (damage > 0) {
                const wantDodge = await this.prompt(this.pokemon1).ask("dodge")
                if (wantDodge) {
                    dodged1 = this._canDodge(this.pokemon2, this.pokemon1, move2)
                    this.pokemon1.state.emit("used-move", new Move("dodge"))
                }
                damages.set(this.pokemon1, damage * pokeEffect1)
            }
            else {
                const wantDodge = await this.prompt(this.pokemon2).ask("dodge")
                if (wantDodge) {
                    dodged2 = this._canDodge(this.pokemon1, this.pokemon2, move1)
                    this.pokemon2.state.emit("used-move", new Move("dodge"))
                }
                damages.set(this.pokemon2, -damage * pokeEffect2);
            }
        }
        else if (
            !["None", "Status"].includes(move1.category)
            && !["None", "Status"].includes(move2.category)
            && move1.flags.contact !== move2.flags.contact
        ) {
            if (move2.flags.contact) {
                const wantDodge = await this.prompt(this.pokemon2).ask("dodge")
                if (wantDodge) {
                    dodged2 = this._canDodge(this.pokemon1, this.pokemon2, move1)
                    this.pokemon2.state.emit("used-move", new Move("dodge"))
                }
                dodged2 
                    ? instantDamages.set(this.pokemon1, hit2.damage() * pokeEffect2)
                    : damages.set(this.pokemon2, hit1.damage() * pokeEffect1)
            }
            else {
                const wantDodge = await this.prompt(this.pokemon1).ask("dodge")
                if (wantDodge) {
                    dodged1 = this._canDodge(this.pokemon2, this.pokemon1, move2)
                    this.pokemon1.state.emit("used-move", new Move("dodge"))
                }
                dodged1
                    ? instantDamages.set(this.pokemon2, hit1.damage() * pokeEffect1)
                    : damages.set(this.pokemon1, hit2.damage() * pokeEffect2)
            }
        }
        else {
            const damage = (hit2.damage() * moveEffect2) - (hit1.damage() * moveEffect1)
            if (damage > 0 ) {
                const wantDodge = !usedDodge1 && move1.id !== "staythere" && await this.prompt(this.pokemon1).ask("dodge")
                if (wantDodge) {
                    dodged1 = this._canDodge(this.pokemon2, this.pokemon1, move2)
                    this.pokemon1.state.emit("used-move", new Move("dodge"))
                }
                damages.set(this.pokemon1, damage * pokeEffect2)
            }
            else {
                const wantDodge = !usedDodge2 && move2.id !== "staythere" && await this.prompt(this.pokemon2).ask("dodge")
                if (wantDodge) {
                    dodged2 = this._canDodge(this.pokemon1, this.pokemon2, move1)
                    this.pokemon2.state.emit("used-move", new Move("dodge"))
                }
                damages.set(this.pokemon2, -damage * pokeEffect1)
            }
        }
        
        const instD1 = instantDamages.get(this.pokemon1)
        const instD2 = instantDamages.get(this.pokemon2)
        const d1 = damages.get(this.pokemon1)
        const d2 = damages.get(this.pokemon2)

        this.pokemon1.state.decreaseHealth(instD1)
        this.pokemon2.state.decreaseHealth(instD2)
        
        if(move2.priority > move1.priority) {
            if (d1 && !dodged1) {
                this.pokemon1.state.decreaseHealth(d1)
                move2.drain && this.pokemon2.state.increaseHealth(d1 * move2.drainRate())
            }
            if (d2 && !dodged2) {
                this.pokemon2.state.decreaseHealth(d2)
                move1.drain && this.pokemon1.state.increaseHealth(d2 * move1.drainRate())
            }
        }
        else {
            if (d2 && !dodged2) {
                this.pokemon2.state.decreaseHealth(d2)
                move1.drain && this.pokemon1.state.increaseHealth(move1.drainDamage(d2))
                move1.recoil && this.pokemon1.state.decreaseHealth(move1.recoilDamage(d2))
            }
            if (d1 && !dodged1) {
                this.pokemon1.state.decreaseHealth(d1)
                move2.drain && this.pokemon2.state.increaseHealth(d1 * move2.drainRate())
            }
        }

        if (!attackSelf2 && canMove2 && ((d1 && !dodged1) || move2.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove1)) {
            this.pokemon1.state.effects.apply(move2, { on: "target" })
            this.pokemon1.state.stats.apply("target", move2)
        }
        if (!attackSelf1 && canMove1 && ((d2 && !dodged2) || move1.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove2)) {
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
        
        const veryClose = (move1.flags.contact && (d2 || instD2)) || (move2.flags.contact && (d1 || instD1))
        this.context.set("veryClose", veryClose)
        
        this.emit("turn-end", this, hit1, hit2)
        this.pokemon1.state.emit("turn-end", this, hit1)
        this.pokemon1.state.emit("turn-end", this, hit2)
    }

    _canDodge(attacker, target, move) {
        if (move.accuracy === true || !target.state.effects.canMove()) {
            return false;
        }
    
        // Get speed stats
        const attackerSpd = attacker.state.stats.get("spe");
        const targetSpd = target.state.stats.get("spe");

        // Get accuracy and evasion stats
        const attackerAccuracy = attacker.state.stats.get("accuracy")
        const targetEvasion = target.state.stats.get("evasion")

        // Base dodge chance using a modified speed ratio
        const speedRatio = targetSpd / attackerSpd;
        const dodgeChance = Math.max(0.05, Math.min(speedRatio * 0.3, 0.5)); // Clamp between 5% and 50%
    
        // Accuracy and evasion modifiers
        const accuracyModifier = attackerAccuracy / targetEvasion;
    
        // Calculate final hit chance
        const finalHitChance = move.accuracy * accuracyModifier * (1 - dodgeChance);
    
        // Simulate random factor for dodge mechanics
        const randomFactor = Math.random() * 100;

        // Return true if target dodges, false if the move hits
        const dodged = randomFactor > finalHitChance;
        dodged && target.state.emit("dodged", move)
        
        return dodged 
    }

    _setWaveTurns() {
        const turns = BattleField.TURNS_PER_WAVE.map(tpw => tpw[0])
        const weights = BattleField.TURNS_PER_WAVE.map(tpw => tpw[1])
        return this._waveAfterTurns = weightedRandom(turns, weights)
    }
}

class BattleContext extends Observable {
    constructor(context) {
        super()
        this._context = context
    }

    get(key) {
        return this._context[key]
    }

    set(key, value) {
        this._context[key] = value
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
            const opponent = this.field.opponentOf(this.pokemon)
            move.onAfterMove(this.pokemon, opponent, move)

            this.retreat -= move.retreat
            this.reducePP(move.id)
        })
    }

    addWaveRetreat() {
        this.retreat += this.pokemon.meta.retreat;
    }

    // Health Management
    increaseHealth(amount) {
        const maxHealth = this.pokemon.maxhp; // Use calculated HP stat
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
    static BATTLE_STATS = {
        "accuracy": 1,
        "evasion": 1
    }
    
    _statChanges = {};

    constructor(state) {
        this.state = state
        this._stats = Object.assign({}, StatsManager.BATTLE_STATS, this.state.pokemon.stats, this.state.pokemon.meta.stats);
        this.prev = new PrevStatsManager(state, this)
    }
    
    get(name) {
        const baseStat = this._stats[name];
        const stage = this._statChanges[name] || 0;
        const multiplier = this._statStageMultiplier(stage);
        return fixFloat(baseStat * multiplier);
    }

    set(name, value) {
        this.prev.remember(name)
        return this._stats[name] = value;
    }

    all() {
        return Object.keys(this._stats).reduce((acc, stat) => {
            acc[stat] = this.get(stat)
            return acc
        }, {});
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

class PrevStatsManager {
    constructor(state, statsManager) {
        this.state = state
        this.stats = statsManager
        this.refresh()

        this.state.on("turn", () => {
            this.refresh()
        })
        this.state.on("wave", () => {
            this.refresh()
        })
    }
    
    refresh() {
        this._stats = Object.assign({}, this.stats.all());
    }

    get(name) {
        return this._stats[name];
    }

    remember(name) {
        this._stats[name] = this.stats.get(name)
    }

    all() {
        return this._stats;
    }
}


class BattlePrompt {
    _repliers = {};

    async ask(tag) {
        const replier = this._repliers[tag]
        if (!replier) throw new Error(`No replier for tag ${tag}`)
        return await replier()
    }

    reply(tag, cb) {
        this._repliers[tag] = cb
        return this
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
