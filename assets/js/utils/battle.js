import { EventEmitter } from "./event.js";
import { Move } from "./models.js";
import { EffectManager } from "./effects.js"
import { makeField } from "./fields.js"
import { Hit } from "./damage.js"
import { fixFloat, weightedRandom } from "./helpers.js"


class BaseBattle extends EventEmitter {
    scenePerTurn = 1
    //Possible turns per wave with their weight
    turnsPerWave = [
        [2, 0.2],
        [3, 0.45],
        [4, 0.3],
        [6, 0.05],
    ]
    turnNo = 0
    waveNo = 0
    ctx = {
        veryClose: false
    }
    _states = new Map()

    constructor(team1, team2, fieldTypes = []) {
        super()
        const that = this
        this._turnAfterScenes = this.scenePerTurn
        this.team1 = this.filterTeam(team1)
        this.team2 = this.filterTeam(team2)
        this._all = [...this.team1, ...this.team2]
        this.fields = fieldTypes.map(f => makeField(this, f))
        
        this._all.forEach(p => {
            if (!p.state) {
                p.state = new BattleState(this, p)
            }
            this._states.set(p, p.state)
        })
        this._prompts = new Map(
            this._all.map(p => [p, new BattlePrompt()])
        );
        
        this.on("scene", () => {
            this._turnAfterScenes--
            !this._turnAfterScenes && this.emit("turn", this)
        })

        this.on("scene-end", () => {
            if (!this._turnAfterScenes) {
                this.emit("turn-end", this)
                this._turnAfterScenes = this.scenePerTurn
            }
        })

        this.on("turn", (...args) => {
            console.log("new turn!")
            if (!this._waveAfterTurns) {
                this._setWaveTurns()
            }

            this.turnNo++
            this._waveAfterTurns--
        })
        
        this.on("turn-end", () => {
            this.needNewWave() && this.emit("wave")
        })

        this.on("wave", (...args) => {
            this.waveNo++
            this._waveAfterTurns = 0
        })
        
        this.on(["turn", "turn-end", "wave"], function(...args) {
            that.groundedPokemons().forEach(p => {
                p.state.emit(this._event, ...args)
            })
        })
        this.on(["scene", "scene-end"], function(map) {
            that.groundedPokemons().filter(p => map.has(p)).forEach(p => {
                p.state.emit(this._event, map.get(p), map)
            })
        })
    }
    
    opponentOf(pokemon) {
        return pokemon._tag === this.pokemon1._tag  ? this.pokemon2 : this.pokemon1;
    }

    state(pokemon) {
        return this._states.get(pokemon);
    }

    prompt(pokemon) {
        return this._prompts.get(pokemon);
    }
    
    filterTeam(team) {
        return team
    }
    
    actives() {
        return [this.pokemon1, this.pokemon2]
    }

    activate(pokemon) {
        if (this.team1.includes(pokemon)) {
            this.pokemon1 = pokemon
        }
        else if (this.team2.includes(pokemon)) {
            this.pokemon2 = pokemon
        }
    }
    
    canUseMove(pokemon, moveId) {
        const move = pokemon.state.moves.find(m => m.id === moveId)
        return move.retreat <= pokemon.state.retreat && (move.pp === null || move.pp > 0)
    }

    async run_New(senario) {
        let move1 = senario.get(this.pokemon1)
        let move2 = senario.get(this.pokemon2)
    
        // TEMP: move power management
        move1.basePower *= this.pokemon1.state.stats._statChanges["pow"] || 1
        move2.basePower *= this.pokemon2.state.stats._statChanges["pow"] || 1
        
        // ctx effects
        if(this.ctx.veryClose && move1.flags.contact !== move2.flags.contact) {
            if(move1.flags.contact) {
                senario.set(this.pokemon2, new Move("staythere"))
            }
            else {
                senario.set(this.pokemon1, new Move("staythere"))
            }
        }
        
        // move failure
        this._checkFailure(this.pokemon1, senario)
        this._checkFailure(this.pokemon2, senario)

        this.emit("scene", senario)

        move1 = senario.get(this.pokemon1)
        move2 = senario.get(this.pokemon2)

        this.pokemon1.state.emit("used-move", move1)
        this.pokemon2.state.emit("used-move", move2)

        const canMove1 = this.pokemon1.state.effects.canMove()
        const canMove2 = this.pokemon2.state.effects.canMove()
        
        const attackSelf1 = this.pokemon1.state.effects.attackSelf()
        const attackSelf2 = this.pokemon2.state.effects.attackSelf()

        const hit1 = new Hit(this.pokemon1, move1, this.pokemon2)
        const hit2 = new Hit(this.pokemon2, move2, this.pokemon1)
        
        const usedDodge1 = move1.id === "dodge"
        const usedDodge2 = move2.id === "dodge"

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
                    
                    //this._checkFailure(this.pokemon1, senario)

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
            if (damage > 0) {
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

        const instD1 = hit2.toContactDamage(instantDamages.get(this.pokemon1))
        const instD2 = hit1.toContactDamage(instantDamages.get(this.pokemon2))

        const d1 = "damage" in move2
            ? hit2.damage()
            : hit2.toContactDamage(damages.get(this.pokemon1))
        
        const d2 = "damage" in move1
            ? hit1.damage()
            : hit1.toContactDamage(damages.get(this.pokemon2))

        if (!attackSelf2 && canMove2 && ((d1 && !dodged1) || move2.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove1)) {
            this.pokemon1.state.emit("contacted", this.pokemon2)
            this.pokemon1.state.effects.apply(move2, { on: "target" })
            this.pokemon1.state.stats.apply("target", move2)
        }
        if (!attackSelf1 && canMove1 && ((d2 && !dodged2) || move1.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove2)) {
            this.pokemon2.state.emit("contacted", this.pokemon1)
            this.pokemon2.state.effects.apply(move1, { on: "target" })
            this.pokemon2.state.stats.apply("target", move1)
        }
        if (attackSelf1) {
            this.pokemon1.state.emit("contacted", this.pokemon1)
            this.pokemon1.state.effects.apply(move1, { on: "target" })
            this.pokemon1.state.stats.apply("target", move1)
        }
        if (attackSelf2) {
            this.pokemon2.state.emit("contacted", this.pokemon2)
            this.pokemon2.state.effects.apply(move2, { on: "target" })
            this.pokemon2.state.stats.apply("target", move2)
        }
        
        this.pokemon1.state.decreaseHealth(instD1)
        this.pokemon2.state.decreaseHealth(instD2)

        if(move2.priority > move1.priority) {
            if (d1 && !dodged1) {
                this.pokemon1.state.decreaseHealth(d1)
                move2.drain && this.pokemon2.state.increaseHealth(move2.drainDamage(d1))
                move2.recoil && this.pokemon2.state.decreaseHealth(move2.recoilDamage(d1))
            }
            if (d2 && !dodged2) {
                this.pokemon2.state.decreaseHealth(d2)
                move1.drain && this.pokemon1.state.increaseHealth(move1.drainDamage(d2))
                move1.recoil && this.pokemon1.state.decreaseHealth(move1.recoilDamage(d2))
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
                move2.drain && this.pokemon2.state.increaseHealth(move2.drainDamage(d1))
                move2.recoil && this.pokemon2.state.decreaseHealth(move2.recoilDamage(d1))
            }
        }

        if(move1.category === "Status" || d2 || instD2) {
            this.pokemon1.state.emit("hitted-move", move1) 
        }
        if(move2.category === "Status" || d1 || instD1) {
            this.pokemon2.state.emit("hitted-move", move2) 
        }

        if ((move1.flags.contact && (d2 || instD2)) || (move2.flags.contact && (d1 || instD1))) {
            this.ctx.veryClose = true
        }

        const hitsMap = new Map([
            [this.pokemon1, hit1], 
            [this.pokemon2, hit2]
        ])
        this.emit("scene-end", hitsMap)
    }
    
    async run(senario) {
        let move1 = senario.get(this.pokemon1)
        let move2 = senario.get(this.pokemon2)
    
        // TEMP: move power management
        move1.basePower *= this.pokemon1.state.stats._statChanges["pow"] || 1
        move2.basePower *= this.pokemon2.state.stats._statChanges["pow"] || 1
        
        // ctx effects
        if(this.ctx.veryClose && move1.flags.contact !== move2.flags.contact) {
            if(move1.flags.contact) {
                senario.set(this.pokemon2, new Move("staythere"))
            }
            else {
                senario.set(this.pokemon1, new Move("staythere"))
            }
        }
        
        // move failure
        this._checkFailure(this.pokemon1, senario)
        this._checkFailure(this.pokemon2, senario)

        this.emit("scene", senario)

        move1 = senario.get(this.pokemon1)
        move2 = senario.get(this.pokemon2)

        this.pokemon1.state.emit("used-move", move1)
        this.pokemon2.state.emit("used-move", move2)

        const canMove1 = this.pokemon1.state.effects.canMove()
        const canMove2 = this.pokemon2.state.effects.canMove()
        
        const attackSelf1 = this.pokemon1.state.effects.attackSelf()
        const attackSelf2 = this.pokemon2.state.effects.attackSelf()

        const hit1 = new Hit(this.pokemon1, move1, this.pokemon2)
        const hit2 = new Hit(this.pokemon2, move2, this.pokemon1)
        
        const usedDodge1 = move1.id === "dodge"
        const usedDodge2 = move2.id === "dodge"
        let dodged1 = usedDodge1 && this._canDodge(this.pokemon2, this.pokemon1, move2)
        let dodged2 = usedDodge2 && this._canDodge(this.pokemon1, this.pokemon2, move1)

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
            if (damage > 0) {
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

        const instD1 = hit2.toContactDamage(instantDamages.get(this.pokemon1))
        const instD2 = hit1.toContactDamage(instantDamages.get(this.pokemon2))

        const d1 = "damage" in move2
            ? hit2.damage()
            : hit2.toContactDamage(damages.get(this.pokemon1))
        
        const d2 = "damage" in move1
            ? hit1.damage()
            : hit1.toContactDamage(damages.get(this.pokemon2))

        if (!attackSelf2 && canMove2 && ((d1 && !dodged1) || move2.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove1)) {
            this.pokemon1.state.emit("contacted", this.pokemon2)
            this.pokemon1.state.effects.apply(move2, { on: "target" })
            this.pokemon1.state.stats.apply("target", move2)
        }
        if (!attackSelf1 && canMove1 && ((d2 && !dodged2) || move1.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove2)) {
            this.pokemon2.state.emit("contacted", this.pokemon1)
            this.pokemon2.state.effects.apply(move1, { on: "target" })
            this.pokemon2.state.stats.apply("target", move1)
        }
        if (attackSelf1) {
            this.pokemon1.state.emit("contacted", this.pokemon1)
            this.pokemon1.state.effects.apply(move1, { on: "target" })
            this.pokemon1.state.stats.apply("target", move1)
        }
        if (attackSelf2) {
            this.pokemon2.state.emit("contacted", this.pokemon2)
            this.pokemon2.state.effects.apply(move2, { on: "target" })
            this.pokemon2.state.stats.apply("target", move2)
        }
        
        this.pokemon1.state.decreaseHealth(instD1)
        this.pokemon2.state.decreaseHealth(instD2)

        if(move2.priority > move1.priority) {
            if (d1 && !dodged1) {
                this.pokemon1.state.decreaseHealth(d1)
                move2.drain && this.pokemon2.state.increaseHealth(move2.drainDamage(d1))
                move2.recoil && this.pokemon2.state.decreaseHealth(move2.recoilDamage(d1))
            }
            if (d2 && !dodged2) {
                this.pokemon2.state.decreaseHealth(d2)
                move1.drain && this.pokemon1.state.increaseHealth(move1.drainDamage(d2))
                move1.recoil && this.pokemon1.state.decreaseHealth(move1.recoilDamage(d2))
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
                move2.drain && this.pokemon2.state.increaseHealth(move2.drainDamage(d1))
                move2.recoil && this.pokemon2.state.decreaseHealth(move2.recoilDamage(d1))
            }
        }

        if(move1.category === "Status" || d2 || instD2) {
            this.pokemon1.state.emit("hitted-move", move1) 
        }
        if(move2.category === "Status" || d1 || instD1) {
            this.pokemon2.state.emit("hitted-move", move2) 
        }

        if ((move1.flags.contact && (d2 || instD2)) || (move2.flags.contact && (d1 || instD1))) {
            this.ctx.veryClose = true
        }

        const hitsMap = new Map([
            [this.pokemon1, hit1], 
            [this.pokemon2, hit2]
        ])
        this.emit("scene-end", hitsMap)
    }
    
    _checkFailure(pokemon, senario) {
        const move = senario.get(pokemon)
        if (move.try(pokemon)) return
        pokemon.state.emit("used-move", move)
        senario.set(pokemon, new Move("staythere"))
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
        const dodgeChance = Math.max(0.05, Math.min(speedRatio * 0.3, 0.7)); // Clamp between 5% and 70%
    
        // Accuracy and evasion modifiers
        const accuracyModifier = attackerAccuracy / targetEvasion;
    
        // Calculate final hit chance
        const finalHitChance = move.accuracy * accuracyModifier * (1 - dodgeChance) * 0.70;
        console.log(target.id, finalHitChance)
    
        // Simulate random factor for dodge mechanics
        const randomFactor = Math.random() * 100;

        // Return true if target dodges, false if the move hits
        const dodged = randomFactor > finalHitChance;
        dodged && target.state.emit("dodged", move)
        
        return dodged 
    }

    _setWaveTurns() {
        const turns = this.turnsPerWave.map(tpw => tpw[0])
        const weights = this.turnsPerWave.map(tpw => tpw[1])
        return this._waveAfterTurns = weightedRandom(turns, weights)
    }
}

class SingleBattle extends BaseBattle {
    needNewWave() {
        return !this._waveAfterTurns ||
            (!this.pokemon1.state.usableOffensiveMoves().length && !this.pokemon2.state.usableOffensiveMoves().length)
    }
    
    groundedPokemons() {
        return this.actives()
    }
}

class MultiBattle extends BaseBattle {
    constructor(...args) {
        super(...args)
        
        const avgPokePerSide = Math.round(this._all.length / 2)
        
        this.scenePerTurn = this.scenePerTurn * avgPokePerSide
        this.turnsPerWave = this.turnsPerWave.map(([turns, prob]) => {
            return [turns * avgPokePerSide, prob]
        })
    }
    
    filterTeam(team) {
        return team.filter(p => p.meta.isSelectedForMultiBattle === undefined || p.meta.isSelectedForMultiBattle === true)
    }

    needNewWave() {
        return !this._waveAfterTurns || this._all.every(p => !p.state.usableOffensiveMoves().length)
    }
    
    groundedPokemons() {
        return this._all
    }
}

class BattleState extends EventEmitter {
    _manCount = 1
    moves = [
        new Move("staythere"),
        new Move("dodge")
    ]

    constructor(battle, pokemon) {
        super()
        const that = this

        this.battle = battle;
        this.pokemon = pokemon;

        this.retreat = pokemon.meta.retreat;
        this.stats = new StatsManager(this);
        this.effects = new EffectManager(this);
        this.damage = new DamageManager(this);
        
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
            this.manCount = 1
        })

        this.on("used-move", move => {
            const opponent = this.battle.opponentOf(this.pokemon)
            this.retreat -= move.retreat
            this.reducePP(move.id)
            
            opponent.state.effects.apply(move, { on: "self" })
            opponent.state.effects.apply(move, {
                on: "target",
                pre: true,
            })
        })
        
        this.on("hitted-move", move => {
            const opponent = this.battle.opponentOf(this.pokemon)

            move.onHit?.(this.pokemon)
            move.onAfterMove(this.pokemon, opponent, move)
        })
    }
    
    get manCount() {
        return this._manCount
    }

    set manCount(value) {
        this._manCount = Math.max(1, value)
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

    usableMoves() {
        return this.moves.filter(m => this.battle.canUseMove(this.pokemon, m.id))
    }

    usableOffensiveMoves() {
        return this.usableMoves().filter(m => m.flags.offensive)
    }

    reducePP(moveId) {
        const move = this.moves.find(m => m.id === moveId)
        if (move.pp !== null) move.pp--
        return move
    }
    
    freeze() {
        this.stats.freeze()
        this.effects.freeze()
    }
    
    unfreeze() {
        console.log("yeah")
        this.stats.unfreeze()
        this.effects.unfreeze()
    }
}

class StatsManager {
    //bug must be in _statChanges
    static BATTLE_STATS = {
        "Bug": {
            "accuracy": 3,
            "evasion": 1,
        },
        "__default__": {
            "accuracy": 1,
            "evasion": 1,
        }
    };
    _statChanges = {};
    _modifiers = {};
    _freezed = false;
    
    static getBattleStats(pokemon) {
        let btStats = pokemon.types.reduce((stats, type) => {
            const typeStats = StatsManager.BATTLE_STATS[type] ?? {}
            Object.entries(typeStats).forEach(([name, value]) => {
                if (name in stats) 
                    stats[name] += typeStats[name]
                else
                    stats[name] = typeStats[name]
            })
            return stats
        }, {})
        
        if (!Object.keys(btStats).length)
            btStats = StatsManager.BATTLE_STATS.__default__
        
        return btStats
    }

    constructor(state) {
        this.state = state
        const battleTimeStats = StatsManager.getBattleStats(this.state.pokemon)
        this._stats = Object.assign({}, this.state.pokemon.stats, battleTimeStats, this.state.pokemon.meta.stats);
        this.prev = new PrevStatsManager(state, this)
        
        this.state.on("scene", () => {
            this._modifiers = {}
        })
        this.state.on("wave", () => {
            this._modifiers = {}
        })
    }
    
    get(name) {
        const baseStat = this._stats[name] ?? 1;
        const stage = this._statChanges[name] ?? 0;
        const finalStat = baseStat
            * this._statStageMultiplier(name, stage)
            * this.modifier(name)
        return fixFloat(finalStat);
    }

    set(name, value) {
        if (this._freezed) return null
        this.prev.remember(name)
        this._stats[name] = value;
        if (name === "hp" && value === 0) {
            this.state.emit("fainted")
        }
        return value
    }
    
    chainModify(name, modifier) {
        if (!this._modifiers[name]) 
            this._modifiers[name] = []
        this._modifiers[name].push(modifier)
    }

    all() {
        return Object.keys(this._stats).reduce((acc, stat) => {
            acc[stat] = this.get(stat)
            return acc
        }, {});
    }

    apply(on, move) {
        const statChanged = Math.random() < (move.statChanges.chance / 100)
        if (!statChanged) return

        if(on === "self") {
            const attacker = this.state.battle.opponentOf(this.state.pokemon);
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
        if (this._freezed) return null
        if (!this._statChanges[stat]) {
            this._statChanges[stat] = 0;
        }

        // Stat stage clamping (-6 to +6)
        const newStage = Math.max(-6, Math.min(6, this._statChanges[stat] + stages));
        this._statChanges[stat] = newStage;
    }
    
    modifier(name) {
        return this._modifiers[name]?.reduce((acc, m) => acc * m, 1) ?? 1
    }
    
    freeze() {
        this._freezed = true
    }
    
    unfreeze() {
        this._freezed = false
    }

    _statStageMultiplier(name, stage) {
        const handler = this[`_${name}StageMultiplier`]
        if(handler) {
            return handler.call(this, stage)
        } else if (stage > 0) {
            return (2 + stage) / 2; // Positive stages
        } else if (stage < 0) {
            return 2 / (2 - stage); // Negative stages
        } else {
            return 1; // Neutral stage
        }
    }
    
    _critStageMultiplier(stage) {
        return stage * (1 / 6)
    }
}

class PrevStatsManager {
    constructor(state, statsManager) {
        this.state = state
        this.stats = statsManager
        this.refresh()

        this.state.on("scene", () => {
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

class DamageManager {
    _modifiers = []
    _critModifiers = []
    
    constructor(state) {
        this.state = state
        
        this.state.on("scene", () => {
            this._modifiers = []
            this._critModifiers = []
        })
        this.state.on("wave", () => {
            this._modifiers = []
            this._critModifiers = []
        })
    }
    
    modifier() {
        return this._modifiers.reduce((acc, m) => acc * m, 1)
    }
    
    critModifier() {
        return this._critModifiers.reduce((acc, m) => acc * m, 1)
    }
    
    chainModify(modifier) {
        this._modifiers.push(modifier)
    }

    chainModifyCrit(modifier) {
        this._critModifiers.push(modifier)
    }
}


export const BATTLE_SYSTEMS = {
    "single": SingleBattle,
    "multiple": MultiBattle,
}