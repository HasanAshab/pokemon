import { EventEmitter } from "./event.js";
import { Move, Pokemon } from "./models.js";
import { EffectManager } from "./effects.js"
import { makeField } from "./fields.js"
import { Hit } from "./damage.js"
import { fixFloat, weightedRandom, sumObj, modObj, sleep, shuffle } from "./helpers.js"
import move from "../../../data/processors/move.js";


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
    _history = []

    constructor(team1, team2, fieldTypes = []) {      
        super()
        const that = this
        this._turnAfterScenes = this.scenePerTurn
        this.team1 = this.filterTeam(team1)
        this.team2 = this.filterTeam(team2)
        this.pokemon1 = this.team1[0]
        this.pokemon2 = this.team2[0]
        this._all = [...this.team1, ...this.team2]
        this.fields = fieldTypes.map(f => makeField(this, f))

        this._all.forEach(p => {
            if (!p.state) {
                p.state = new BattleState(this, p)
                p.state.emit("start")
            }
            this._states.set(p, p.state)
        })
        this._prompts = new Map(
            this._all.map(p => [p, new BattlePrompt()])
        );
        
        // this.on("scene", () => {
        //     this._history.push(this.toJSON())
        // })

        
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
            if (!this._waveAfterTurns) {
                this._setWaveTurns()
            }

            this.turnNo++
            !this.ctx.waveLocked && this._waveAfterTurns--
        })
        
        this.on("turn-end", () => {
            this.needNewWave() && this.emit("wave")
        })

        this.on("wave", (...args) => {
            this.waveNo++
            this._waveAfterTurns = 0
            this._all
              .filter(p => p.isFainted)
              .forEach(p => this.removePokemon(p))
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

    addPokemon(pokemon) {
        const team = pokemon._tag === "you" ? this.team1 : this.team2
        team.push(pokemon)
        this._all.push(pokemon)
        this._prompts.set(pokemon, new BattlePrompt())
        if (!pokemon.state) {
            pokemon.state = new BattleState(this, pokemon)
            this._states.set(pokemon, pokemon.state)
            pokemon.state.emit("start")
        }
    }

    removePokemon(pokemon) {
        const team = pokemon._tag === "you" ? this.team1 : this.team2
        team.splice(team.indexOf(pokemon), 1)
        this._all.splice(this._all.indexOf(pokemon), 1)
        this._prompts.delete(pokemon)
        this._states.delete(pokemon)
    }

    addField(type) {
        this.fields.push(makeField(this, type))
    }

    removeField(type) {
        const field = this.fields.find(f => f.type === type)
        field.cleanup()
        this.fields = this.fields.filter(f => f !== field)
    }
    
    toJSON() {
        const states = []
        this._states.values().forEach(s => {
            states.push(s.toJSON())
        })
        return {
            turnNo: this.turnNo,
            waveNo: this.waveNo,
            ctx: this.ctx,
            _states: states,
            //_history: this._history,
        }
    }
    
    sync(data) {
        this.turnNo = data.turnNo
        this.waveNo = data.waveNo
        this.ctx = data.ctx
        let i = 0
        this._states.forEach(state => {
            state.sync(data._states[i++])
        })
        //this._history = data._history
    }
    
    undo() {
        const data = this._history.pop()
        this.sync(data)
    }
    redo() {
        const data = this._history.pop()
        this.sync(data)
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
    
    actives() {
        return [this.pokemon1, this.pokemon2]
    }
    
    canUseMove(pokemon, moveId) {
        const move = pokemon.state.moves.find(m => m.id === moveId)
        
        return move.retreat <= pokemon.state.retreat 
          && (move.pp === null || move.pp > 0)
          && pokemon.abilities.canUseMove(move)
          && pokemon.state.effects.canUseMove(move)
          && this.opponentOf(pokemon).state.effects.canOpponentUseMove(move)
    }

    getActive(tag) {
        return tag === this.pokemon1._tag ? this.pokemon1 : this.pokemon2
    }

    activate(pokemon, tag = null) {
        if (tag === "you") {
            this.pokemon1 = pokemon
        }      
        else if (tag === "enemy") {
            this.pokemon2 = pokemon
        }
        else if (this.team1.includes(pokemon)) {
            this.pokemon1 = pokemon
        }
        else if (this.team2.includes(pokemon)) {
            this.pokemon2 = pokemon
        }
    }

    async run(senario, clonemode1 = false, clonemode2 = false, ajmode = false) {              
        const oldVeryClose = this.ctx.veryClose
        if (clonemode1 || clonemode2) {
            this.ctx.waveLocked = true          
            this.ctx.veryClose = false
            clonemode1 && this.pokemon1.state.freeze()
            clonemode2 && this.pokemon2.state.freeze()
        }
        if (ajmode) {
            this.waveLocked = true
        }
        let move1 = senario.get(this.pokemon1)
        let move2 = senario.get(this.pokemon2)
        const isDodged1 = () => move1.id === "dodge" && move1._dodgeMatrix.every(Boolean)
        const isDodged2 = () => move2.id === "dodge" && move2._dodgeMatrix.every(Boolean)

        // ctx effects
        if(this.ctx.veryClose && move1.flags.contact !== move2.flags.contact) {
            if(move1.flags.contact && !move1.id === "dodge") {
                senario.set(this.pokemon2, new Move("staythere"))
            }
            else if (move2.flags.contact && !move1.id === "dodge") {
                senario.set(this.pokemon1, new Move("staythere"))
            }
        }

        // move failure
        this._checkFailure(this.pokemon1, senario)
        this._checkFailure(this.pokemon2, senario)
 
        this.emit("scene", senario)

        // TEMP: move power management
        this.pokemon1.state.damage.chainModifyPower('*', this.pokemon1.state.stats._statChanges["pow"] || 1)
        this.pokemon2.state.damage.chainModifyPower('*', this.pokemon2.state.stats._statChanges["pow"] || 1)

        move1 = senario.get(this.pokemon1)
        move2 = senario.get(this.pokemon2)

        try {
          move1._meta = this.pokemon1.state.moves.find(m => m.id === move1.id)._meta
          move2._meta = this.pokemon2.state.moves.find(m => m.id === move2.id)._meta
          move1._user = this.pokemon1
          move2._user = this.pokemon2
          move1._target = this.pokemon2
          move2._target = this.pokemon1
        }
        catch (e) {
          move1._meta = {}
          move2._meta = {}
        }

        this.pokemon1.state.emit("using-move", move1, move2)
        this.pokemon2.state.emit("using-move", move2, move1)

        move1.hit = new Hit(this.pokemon1, move1, this.pokemon2)
        move2.hit = new Hit(this.pokemon2, move2, this.pokemon1)

        const hit1 = move1.hit
        const hit2 = move2.hit

        move1.onBeforeMove?.(this.pokemon1, this.pokemon2, move2)
        move2.onBeforeMove?.(this.pokemon2, this.pokemon1, move1)

        this.pokemon1.state.emit("used-move", move1, move2)
        this.pokemon2.state.emit("used-move", move2, move1)

        // weapon effects
        if (
          move2.flags.contact
          && move1.flags.contact
          && move1.flags.weapon !== move2.flags.weapon
          && move1.flags.offensive === move2.flags.offensive
          && move1.priority === move2.priority
        ) {
            const bareTypes = ["Normal", "Fighting"]
            const armed = move1.flags.weapon
              ? this.pokemon1
              : this.pokemon2
            const bare = this.opponentOf(armed)
            const clonemode = bare === this.pokemon1 ? clonemode1 : clonemode2
            
            const isDodged = bare === this.pokemon1 ? isDodged1 : isDodged2
            const armedMove = senario.get(armed)
            const bareMove = senario.get(bare)

            if (bareTypes.includes(bareMove.type)) {
                await this._tryDodge(bare, senario, clonemode)
                if (bareMove === move1) {
                  move1 = senario.get(bare)
                }
                else {
                  move2 = senario.get(bare)
                }

                if (!isDodged()) {
                    armed.state.damage.chainModifyPower(armedMove.id, 1.3)
                    senario.set(bare, new Move("staythere"))                    
                    if (
                      !armedMove.flags.bodypart
                      && bareMove.flags.contact === armedMove.flags.contact
                      && !clonemode
                    ) {
                      armed.state.removeMove(armedMove.id)
                    }
                    if (bareMove === move1) {
                      move1 = senario.get(bare)
                    }
                    else {
                      move2 = senario.get(bare)
                    }
                }
            }
            else {
              bareMove.recoil = [3, 10]
            }
        }

        const canMove1 = this.pokemon1.state.effects.canMove()
        const canMove2 = this.pokemon2.state.effects.canMove()

        const attackSelf1 = this.pokemon1.state.attackSelf()
        const attackSelf2 = this.pokemon2.state.attackSelf()

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
        console.log(move1.id, move2.id);
        
        
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
        else if ((["allAdjacent", "foeSide"].includes(move1.target)) !== (["allAdjacent", "foeSide"].includes(move2.target))) {             
            if (["allAdjacent", "foeSide"].includes(move1.target)) {
                await this._tryDodge(this.pokemon2, senario, clonemode2)
                const oldm = move2
                move2 = senario.get(this.pokemon2)
                isDodged2()
                    ? instantDamages.set(this.pokemon1, hit2.damage() * pokeEffect2)
                    : damages.set(this.pokemon2, hit1.damage() * pokeEffect1)
                if (isDodged2())
                    move2 = oldm
            }
            else {
                await this._tryDodge(this.pokemon1, senario, clonemode1)
                const oldm = move1
                move1 = senario.get(this.pokemon1)
                isDodged1()
                    ? instantDamages.set(this.pokemon2, hit1.damage() * pokeEffect1)
                    : damages.set(this.pokemon1, hit2.damage() * pokeEffect2)
                if (isDodged1())
                    move1 = oldm
            }
        }
        else if(move1.category === "Physical" && move2.category === "Physical" && move1.flags.contact && !move2.flags.contact) {            
            const thornsDamage = move1.flags.weapon
                ? hit2.damage() * 0.10
                : 0
            const damage = ((hit2.damage() - thornsDamage) * moveEffect2) - (hit1.damage() * moveEffect1)
            instantDamages.set(this.pokemon1, thornsDamage * pokeEffect1)

            if (damage > 0) {
                await this._tryDodge(this.pokemon1, senario, clonemode1)
                move1 = senario.get(this.pokemon1)
                !isDodged1() && damages.set(this.pokemon1, damage * pokeEffect1)
            }
            else {
                await this._tryDodge(this.pokemon2, senario, clonemode2)
                move2 = senario.get(this.pokemon2)
                !isDodged2() && damages.set(this.pokemon2, -damage * pokeEffect2);
            }
        }
        else if(move1.category === "Physical" && move2.category === "Physical" && move2.flags.contact && !move1.flags.contact) {
            const thornsDamage = move2.flags.weapon
                ? hit1.damage() * 0.10
                : 0
            const damage = (hit2.damage() * moveEffect2) - ((hit1.damage() - thornsDamage) * moveEffect1)
            instantDamages.set(this.pokemon2, thornsDamage * pokeEffect2)
            
            if (damage > 0) {
                await this._tryDodge(this.pokemon1, senario, clonemode1)
                move1 = senario.get(this.pokemon1)
                !isDodged1() && damages.set(this.pokemon1, damage * pokeEffect1)
            }
            else {
                await this._tryDodge(this.pokemon2, senario, clonemode2)
                move2 = senario.get(this.pokemon2)
                !isDodged2() &&damages.set(this.pokemon2, -damage * pokeEffect2);
            }
        }
        else if (
            !["None", "Status"].includes(move1.category)
            && !["None", "Status"].includes(move2.category)
            && move1.flags.contact !== move2.flags.contact
        ) { 
            if (move2.flags.contact) {
                await this._tryDodge(this.pokemon2, senario, clonemode2)
                move2 = senario.get(this.pokemon2)
                isDodged2()
                    ? instantDamages.set(this.pokemon1, hit2.damage() * pokeEffect2)
                    : damages.set(this.pokemon2, hit1.damage() * pokeEffect1)
            }
            else {
                await this._tryDodge(this.pokemon1, senario, clonemode1)
                move1 = senario.get(this.pokemon1)
                isDodged1()
                    ? instantDamages.set(this.pokemon2, hit1.damage() * pokeEffect1)
                    : damages.set(this.pokemon1, hit2.damage() * pokeEffect2)
            }
        }
        else {
            const damage = (hit2.damage() * moveEffect2) - (hit1.damage() * moveEffect1)
            if (damage > 0) {
                await this._tryDodge(this.pokemon1, senario, clonemode1)
                const oldm = move1
                move1 = senario.get(this.pokemon1)
                if (isDodged1())
                    move1 = oldm
                else damages.set(this.pokemon1, damage * pokeEffect2)
            }
            else {
                await this._tryDodge(this.pokemon2, senario, clonemode2)
                const oldm = move2
                move2 = senario.get(this.pokemon2)
                if (isDodged2())
                    move2 = oldm
                else damages.set(this.pokemon2, -damage * pokeEffect1)
            }
        }        

        const instD1 = hit2.toContactDamage(instantDamages.get(this.pokemon1))
        const instD2 = hit1.toContactDamage(instantDamages.get(this.pokemon2))

        let d1 = "damage" in move2 || "damageCallback" in move2
            ? hit2.damage()
            : hit2.toContactDamage(damages.get(this.pokemon1))

        let d2 = "damage" in move1 || "damageCallback" in move1
            ? hit1.damage()
            : hit1.toContactDamage(damages.get(this.pokemon2))

        
        if (ajmode || move2.target !== "allySide") {
            if (!attackSelf2 && canMove2 && !move2.flags.weapon && (d1 || move2.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove1)) {            
                this.pokemon1.state.emit("contacted", this.pokemon2, move2)
                this.pokemon1.state.effects.apply(move2, { on: "target" })            
                this.pokemon1.state.stats.apply("target", move2)
            }
        }
        if (ajmode || move1.target !== "allySide") {
            if (!attackSelf1 && canMove1 && !move1.flags.weapon && (d2 || move1.category === "Status" || (move1.flags.contact && move2.flags.contact) || !canMove2)) {
                this.pokemon2.state.emit("contacted", this.pokemon1, move1)
                this.pokemon2.state.effects.apply(move1, { on: "target" })
                this.pokemon2.state.stats.apply("target", move1)
            }
        }
        if (attackSelf1) {
            this.pokemon1.state.emit("contacted", this.pokemon1, move1)
            this.pokemon1.state.effects.apply(move1, { on: "target" })
            this.pokemon1.state.stats.apply("target", move1)
        }
        if (attackSelf2) {
            this.pokemon2.state.emit("contacted", this.pokemon2, move2)
            this.pokemon2.state.effects.apply(move2, { on: "target" })
            this.pokemon2.state.stats.apply("target", move2)
        }

        this.pokemon1.state.decreaseHealth(instD1)
        this.pokemon2.state.decreaseHealth(instD2)

        // TEMP: block move support
        if (move1.priority === move2.priority) {
            d1 -= d1 * this.pokemon1.state.damage.blockModifier()
            d2 -=  d2 * this.pokemon2.state.damage.blockModifier()            
        }

        if(move2.priority > move1.priority && (clonemode1 || pokeEffect2 > 1 || move2.hit.criticalCount())) {
            d2 = 0
        }
        else if (move1.priority > move2.priority && (clonemode2 || pokeEffect1 > 1 || move1.hit.criticalCount())) {
            d1 = 0
        }
        if (d1) {
            this.pokemon1.state.decreaseHealth(d1, false, clonemode1)
            move2.drain && this.pokemon2.state.increaseHealth(move2.drainDamage(d1), false, clonemode2)
            move2.recoil && this.pokemon2.state.decreaseHealth(move2.recoilDamage(d1), false, clonemode2)
        }
        if (d2) {
            this.pokemon2.state.decreaseHealth(d2, false, clonemode2)
            move1.drain && this.pokemon1.state.increaseHealth(move1.drainDamage(d2), false, clonemode1)
            move1.recoil && this.pokemon1.state.decreaseHealth(move1.recoilDamage(d2), false, clonemode1)
        }

        if(move1.category === "Status" || d2 || instD2) {
            this.pokemon1.state.emit("hitted-move", move1) 
            this.pokemon2.state.emit("hittee-move", move1) 
        }
        if(move2.category === "Status" || d1 || instD1) {
            this.pokemon2.state.emit("hitted-move", move2)
            this.pokemon1.state.emit("hittee-move", move2)
        }

        // if ((move1.flags.contact && (d2 || instD2)) || (move2.flags.contact && (d1 || instD1))) {
        //     this.ctx.veryClose = true
        // }

        const hitsMap = new Map([
            [this.pokemon1, hit1], 
            [this.pokemon2, hit2]
        ])
        this.emit("scene-end", hitsMap)
        
        // Shadow Clone Support
        const sc1 = this.pokemon1.state.effects.has("shadowclone")
        const sc2 = this.pokemon2.state.effects.has("shadowclone")

        if ((sc1 || sc2) && move1.id !== "shadowclone" && move2.id !== "shadowclone" && !(clonemode1 || clonemode2)) {
          this.emit("$counterclonestart", sc1, sc2)

          const autoCM1 = []
          const autoCM2 = []
          const cloneSceneCount = Math.min(this.pokemon2.state.manCount - 1, this.pokemon1.state.manCount - 1)
          if (sc1 && sc2) {
                const cloneMoves1 = []
                const cloneMoves2 = []
                  let chakra = this.pokemon1.state.retreat
                  for (let i = 0; i < cloneSceneCount; i++) {
                      const usableMoves = this.pokemon1.state.moves
                          .filter(m =>
                              m.flags.offensive !== 0
                              && m.target !== "self"
                              && m.category !== "Status"
                              && m.retreat <= move1.retreat
                              && m.retreat <= chakra - new Move("dodge").retreat
                          )
                      const cloneMove = usableMoves[Math.floor(Math.random() * usableMoves.length)]
                      if (!cloneMove) break
                      cloneMoves1.push(cloneMove) 
                      chakra -= cloneMove.retreat
                  }
                  chakra = this.pokemon2.state.retreat
                  for (let i = 0; i < cloneSceneCount; i++) {
                      const usableMoves = this.pokemon2.state.moves
                          .filter(m =>
                              m.flags.offensive !== 0
                              && m.target !== "self"
                              && m.category !== "Status"
                              && m.retreat <= move2.retreat
                              && m.retreat <= chakra - new Move("dodge").retreat
                          )
                      const cloneMove = usableMoves[Math.floor(Math.random() * usableMoves.length)] // ?? new Move("staythere")
                      if (!cloneMove) break
                      cloneMoves2.push(cloneMove) 
                      chakra -= cloneMove.retreat
                  }
                  for (let i = 0; i < Math.max(cloneMoves1.length, cloneMoves2.length); i++) {
                      const m1 = cloneMoves1[i] || new Move("staythere")
                      const m2 = cloneMoves2[i] || new Move("staythere")
                      const cloneScene = new Map([
                          [this.pokemon1, m1],
                          [this.pokemon2, m2]
                      ])
                      await this.run(cloneScene, true, true)
                      autoCM1.push(m1)
                      autoCM2.push(m2)
                  }
              }
              else if (sc1) {
                  let allHitMove = null
                  const oldMove2 = move2
                  const cloneMoves = []
                  let chakra = this.pokemon1.state.retreat
                  for (let i = 0; i < this.pokemon1.state.manCount - 1; i++) {
                      const usableMoves = this.pokemon1.state.moves
                          .filter(m =>
                              m.flags.offensive !== 0
                              && m.target !== "self"
                              && m.retreat <= move1.retreat
                              && m.retreat <= chakra - new Move("dodge").retreat
                          )
                      const cloneMove = usableMoves[Math.floor(Math.random() * usableMoves.length)]
                      if (!cloneMove) break
                      cloneMoves.push(cloneMove) 
                      chakra -= cloneMove.retreat
                  }

                  for (const [i, cloneMove] of cloneMoves.entries()) {
                      const opponentMove = await this.prompt(this.pokemon2).ask("counterclone", cloneMove, allHitMove, i + 1)
                      if (!allHitMove && opponentMove.target.startsWith("allAdjacent")) {
                          allHitMove = opponentMove
                          this.pokemon2.state.retreat -= allHitMove.retreat
                          move2 = allHitMove
                      }
                      if (allHitMove) {
                        this.pokemon2.state.retreat += allHitMove.retreat
                        allHitMove.reduceCapacity()
                        if (allHitMove.capacity <= 0) {
                          allHitMove = null
                          move2 = oldMove2
                        }
                      }

                      const cloneScene = new Map([
                        [this.pokemon1, cloneMove],
                        [this.pokemon2, opponentMove]
                      ])
                      await this.run(cloneScene, true, false)
                  }
              }
              else if (sc2) {
                  let allHitMove = null
                  const oldMove1 = move1
                  const cloneMoves = []
                  let chakra = this.pokemon2.state.retreat
                  for (let i = 0; i < this.pokemon2.state.manCount - 1; i++) {
                      const usableMoves = this.pokemon2.state.moves
                          .filter(m =>
                              m.flags.offensive !== 0
                              && m.target !== "self"
                              && m.retreat <= move2.retreat
                              && m.retreat <= chakra - new Move("dodge").retreat
                          )
                      const cloneMove = usableMoves[Math.floor(Math.random() * usableMoves.length)] // ?? new Move("staythere")
                      if (!cloneMove) break
                      cloneMoves.push(cloneMove) 
                      chakra -= cloneMove.retreat
                  }
                  
                  for (const [i, cloneMove] of cloneMoves.entries()) {
                      const opponentMove = await this.prompt(this.pokemon1).ask("counterclone", cloneMove, allHitMove, i + 1)
                      if (!allHitMove && opponentMove.target.startsWith("allAdjacent")) {                                                                            
                          allHitMove = opponentMove
                          this.pokemon1.state.retreat -= allHitMove.retreat
                          this.pokemon1.state.reducePP(allHitMove.id)

                          move1 = allHitMove
                      }
                      if (allHitMove) {
                        this.pokemon1.state.retreat += allHitMove.retreat
                        this.pokemon1.state.increasePP(allHitMove.id)

                        allHitMove.reduceCapacity()
                        if (allHitMove.capacity <= 0) {
                          allHitMove = null
                          move1 = oldMove1
                        }
                      }
                      
                      const cloneScene = new Map([
                        [this.pokemon2, cloneMove],
                        [this.pokemon1, opponentMove]
                      ])
                      await this.run(cloneScene, false, true)
                  }
              }
          this.emit("$counterclonecomplete", autoCM1, autoCM2)
        }
        if (clonemode1 || clonemode2) {
          this.ctx.waveLocked = false
          this.ctx.veryClose = oldVeryClose
          clonemode1 && this.pokemon1.state.unfreeze()
          clonemode2 && this.pokemon2.state.unfreeze()
        }

        
        // Adjacent Support

        !ajmode && await this._handleStatusCapacity(this.pokemon1, this.pokemon2, move1)
        !ajmode && await this._handleStatusCapacity(this.pokemon2, this.pokemon1, move2)
        

        if (
          ajmode ||
          (move1.category !== "Status" && move2.category !== "Status" && move1.target === "allAdjacent" && move2.target === "allAdjacent") ||
          (move1.category !== "Status" && move2.category !== "Status" && move1.target === "foeSide" && move2.target === "foeSide")
        ) {}
        else {
            if (move1.category !== "Status") {
                move1.capacity--
                if (move1.target === "foeSide")
                    await this._handleFoeSideCapacity(this.pokemon1, move1)   
            }

            if (move2.category !== "Status") {
                move2.capacity--
                if (move2.target === "foeSide")
                    await this._handleFoeSideCapacity(this.pokemon2, move2)   
            }
        }

        return
        const aj1 = move1.target.startsWith("allAdjacent")
        const aj2 = move2.target.startsWith("allAdjacent")

        if (ajmode || (aj1 && aj2) || clonemode1 || clonemode2) {}
        else if (aj1) {          
          const team = shuffle(this.team2.filter(p => p !== this.pokemon2)).slice(0, move1.capacity - 1)          
          for (const p of team) {
            await sleep(3000)
            const counterMove = await this.prompt(p).ask("counteralladjacent", move1)
            const scene = new Map([
              [this.pokemon1, move1],
              [p, counterMove]
            ])
            this.activate(p)
            this.pokemon1.state.retreat += move1.retreat
            this.pokemon1.state.increasePP(move1.id)
            await this.run(scene, false, false, true)
          }
        }
        else if (aj2) {
          const team = shuffle(this.team1.filter(p => p !== this.pokemon1)).slice(0, move2.capacity - 1)
          for (const p of team) {
            await sleep(3000)
            const counterMove = await this.prompt(p).ask("counteralladjacent", move2)
            const scene = new Map([
              [this.pokemon2, move2],
              [p, counterMove]
            ])
            this.activate(p)
            this.pokemon2.state.retreat += move2.retreat
            this.pokemon2.state.increasePP(move2.id)
            await this.run(scene, false, false, true)
          }
        }
    }

    async _handleStatusCapacity(attacker, defender, move) {
        if (move.category !== "Status" || move.capacity !== Infinity) return
        let team
        if (move.target === "foeSide") {
          team = attacker._tag === "you" ? this.team2 : this.team1
        }
        else if (move.target === "allySide") {
          team = attacker._tag === "you" ? this.team1 : this.team2
        }
        else if (move.target === "allAdjacent") {
          team = [...this.team1, ...this.team2]
            .filter(p => p !== attacker)
        }

        for (const p of team.filter(p => p !== defender)) {
          let atk = attacker
          if (attacker === p) {
            atk = attacker.clone()
            atk.state = attacker.state
          }
          const scene = new Map([
            [atk, move],
            [p, new Move("staythere")]
          ])
          const opponentTag = attacker._tag === "you" ? "enemy" : "you"
          const oldActive = this.getActive(opponentTag)
          this.activate(atk, attacker._tag)
          this.activate(p, opponentTag)
          
          await this.run(scene, false, false, true)

          this.activate(oldActive, opponentTag)
          this.activate(attacker, attacker._tag)
          attacker.state.retreat += move.retreat
          attacker.state.increasePP(move.id)
        }
    }

    async _handleFoeSideCapacity(attacker, move) {          
      const opponentTag = attacker._tag === "you" ? "enemy" : "you"      
      const oldActive = this.getActive(opponentTag)
      const oldActiveAtk = this.getActive(attacker._tag)
      while (0 < move.capacity) {            
        const [p, counterMove] = await this.prompt(attacker).ask("adjacent_counter_stack", move)
        this.activate(p, opponentTag)
        this.activate(oldActiveAtk, attacker._tag)

        const scene = new Map([
          [attacker, move],
          [p, counterMove]
        ])
        
        await this.run(scene, false, false, true)
        // await sleep(1500)
        attacker.state.retreat += move.retreat
        attacker.state.increasePP(move.id)
        this.activate(oldActive, opponentTag)
        move.capacity--
      }
      this.activate(oldActiveAtk, attacker._tag)
    }

    _checkFailure(pokemon, senario) {
        const opponent = this.opponentOf(pokemon)
        const move = senario.get(pokemon)
        const opponentMove = senario.get(opponent)
        move.succeed = move.try(pokemon, opponent, opponentMove)
        if (move.succeed) return
        pokemon.state.emit("used-move", move)
        senario.set(pokemon, new Move("staythere"))
    }

    async _tryDodge(pokemon, senario, clonemode = false) {        
        let move = senario.get(pokemon)
        const opponent = this.opponentOf(pokemon)
        const opponentMove = senario.get(opponent)
        
        const wantDodge = !["staythere", "dodge", "block"].includes(move.id) && ((move.flags.weapon !== opponentMove.flags.weapon) || !(move.flags.contact && opponentMove.flags.contact)) 
            && (clonemode || await this.prompt(pokemon).ask("dodge"))
        
        if (wantDodge) {
            move = new Move("dodge")
            senario.set(pokemon, move)
            move.onBeforeMove?.(pokemon, opponent, opponentMove)
            pokemon.state.emit("used-move", move, opponentMove)
        }
    }

    _setWaveTurns() {
        const turns = this.turnsPerWave.map(tpw => tpw[0])
        const weights = this.turnsPerWave.map(tpw => tpw[1])
        return this._waveAfterTurns = weightedRandom(turns, weights)
    }
}

class SingleBattle extends BaseBattle {
    filterTeam(team) {
        return [team[0]]
    }

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
        return team.filter(p => p.meta.isSelectedForMultiBattle === undefined ||p.meta.isSelectedForMultiBattle === true)
    }

    needNewWave() {
        return !this._waveAfterTurns || this._all.every(p => !p.state.usableOffensiveMoves().length)
    }
    
    groundedPokemons() {
        return this._all
    }

    addPokemon(pokemon) {
        pokemon.meta.isSelectedForMultiBattle = true
        super.addPokemon(pokemon)
    }
}

class BattleState extends EventEmitter {
    static SYS_MOVES = [
        "staythere",
        "dodge",
        "block",
    ]
    
    static DEFAULT_MOVES = [
        "punch",
        "kick"
    ]

    flags = {}
    _manCount = 1
    _summonNo = 1
    _data = {
      movesHistory: []
    }
    _retreatModifiers = []


    constructor(battle, pokemon) {
        super()
        this.battle = battle;
        this.pokemon = pokemon;

        this.retreat = pokemon.meta.retreat;
        this.stats = new StatsManager(this);
        this.effects = new EffectManager(this);
        this.damage = new DamageManager(this);
        this.armor = new ArmorManager(this);

        this.on("wave", () => {
            this.addWaveRetreat()
        })

        this.on("used-move", move => {
            const opponent = this.battle.opponentOf(this.pokemon)
                        
            this.retreat -= move.retreat
            this.reducePP(move.id)
            
            if (move.succeed) {
                opponent.state.effects.apply(move, { on: "self" })
                opponent.state.effects.apply(move, {
                    on: "target",
                    pre: true,
                })
            }
        })
        
        this.on("used-move", (move, opponentMove) => {          
            const opponent = this.battle.opponentOf(this.pokemon)
            const moveFailed = !move.succeed || (opponentMove.id === "dodge" && opponentMove._dodgeMatrix?.[0])
            moveFailed && move.onMoveFail?.(opponent, this.pokemon, opponentMove)
        })

        this.on("used-move", (move) => {          
            this._data.movesHistory.push(move.id)
        })
        
        this.on("hitted-move", move => {            
            const opponent = this.battle.opponentOf(this.pokemon)
            move.onHit?.(this.pokemon, opponent)
            move.onAfterMove(this.pokemon, opponent, move)
        })

        this.on("move-added", move => {
            this.pokemon.tokens = sumObj(this.pokemon.tokens, move.tokenChanges)
        })
        this.on("move-removed", move => {
            this.pokemon.tokens = sumObj(modObj(move.tokenChanges, -1), this.pokemon.tokens)
        })

        this.on("turn-end", () => {          
            this.retreat -= this.pokemon.abilities.retreatCost()
        })
        this.setMoves(pokemon.meta.moves || [])
    }

    retreatModifier(move) {
        let mod = 1        
        for (const { mod: m, conditionFn } of this._retreatModifiers) {
            if (conditionFn(move)) {
                mod *= m
            }
        }
        return mod
    }

    chainModifyRetreat(mod, conditionFn) {
        this._retreatModifiers.push({ mod, conditionFn })
    }
    toJSON() {
        return {
            _manCount: this._manCount,
            retreat: this.retreat,
            stats: this.stats.toJSON(),
            effects: this.effects.toJSON(),
            damage: this.damage.toJSON(),
            moves: this.moves.map(move => ({
                id: move.id,
                pp: move.pp
            }))
        }
    }
    
    sync(data) {
        this._manCount = data._manCount
        this.retreat = data.retreat
        this.stats.sync(data.stats);
        this.effects.sync(data.effects);
        this.damage.sync(data.damage);
        data.moves.forEach(moveData => {
            const move = this.moves.find(m => m.id === moveData.id)
            move.pp = moveData.pp
        })
    }

    clone() {
        return new BattleState(this.battle, this.pokemon)
    }
    
    get manCount() {
        return this._manCount
    }

    set manCount(value) {
        this._manCount = Math.max(1, value)
    }

    setMoves(moves) {
        this.moves = []
        BattleState.SYS_MOVES.forEach(m => this.addMove(m))
        this.pokemon.isHuman && BattleState.DEFAULT_MOVES.forEach(m => this.addMove(m))
        "moves" in this.pokemon._pokemon && this.pokemon._pokemon.moves.forEach(m => this.addMove(m))

        moves.filter(moveMeta => !moveMeta.isUnselected)
          .forEach(moveMeta => {
            moveMeta.isDefault = true
            this.addMove(moveMeta.id, moveMeta)
          })
    }

    hasMove(id) {
      return !!this.moves.find(m => m.id === id)
    }
    
    addMove(id, meta = {}) {
        const move = new Move(id, meta)
        move._user = this.pokemon
        if(!this.hasMove(id)) {
            this.moves.push(move)
            this.emit("move-added", move)
            return move
        }
    }
    addMoveForced(move) {
        this.removeMove(move.id)
        this.moves.push(move)
        this.emit("move-added", move)
        return move
    }
    
    
    removeMove(id) {
      const move = this.moves.find(m => m.id === id)      
      if (!move) return
      this.emit("move-removed", move)
      this.moves = this.moves.filter(m => m.id !== id)
      return move
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

    attackSelf() {
        return this.flags.attackSelf || this.effects.attackSelf()
    }

    decreaseHealth(amount, isInternal = false, clonemode = false) {
        if (clonemode) {
          this.manCount--
          amount = amount * 0.2
          isInternal = true
        }
        if (!isInternal) {
            amount = this.armor.consume(amount)
        }
        return this.stats.set("hp", Math.max(this.stats.get("hp") - amount, 0));
    }

    async summon(id) {
        const sourceMove = this.moves.find(m => m.id === `summon:${id}`);
        const level = ((sourceMove._meta.grade || 0) * 3) || 1         
        const summon = new Pokemon(id, {
          xp: (level - 1) * 100,
          retreat: Math.max(3, level)
        }, this.pokemon._tag)

        summon.meta.name = `${summon.name} (${this._summonNo++})`

        const { default: learnset } = await import(`../../../data/learnsets/${id}.js`)
        console.log(level);
        
        
        summon.meta.moves = learnset
          .filter(ls => ls.required_level <= level && ls.source === "level")
          .map(ls => ({ id: ls.name }))

        this.battle.addPokemon(summon)  
    }

    usableMoves() {
        return this.moves.filter(m => this.battle.canUseMove(this.pokemon, m.id))
    }

    usableOffensiveMoves() {
        return this.usableMoves().filter(m => m.flags.offensive)
    }

    increasePP(moveId) {
        const move = this.moves.find(m => m.id === moveId)
        if(!move) return
        if (move.pp !== null) move.pp++
        return move
    }

    increasePP(moveId) {
        const move = this.moves.find(m => m.id === moveId)
        if(!move) return
        if (move.pp !== null) move.pp++
        return move
    }
    
    reducePP(moveId) {
        const move = this.moves.find(m => m.id === moveId)
        if(!move) return
        if (move.pp !== null) move.pp--
        return move
    }
    
    freeze() {
        this.stats.freeze()
        this.effects.freeze()
    }

    unfreeze() {
        this.stats.unfreeze()
        this.effects.unfreeze()
    }
}

class StatsManager {  
    _statChanges = {
      atk: 0,
      def: 0,
      spe: 0,
      spa: 0,
      spd: 0,
      crit: 0,
      accuracy: 0,
      evasion: 0,
    };
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
        this.refresh()

        this.state.on("scene", () => {
            this._modifiers = {}
        })
        this.state.on("wave", () => {
            this._modifiers = {}
        })
    }

    get(name) {
        const baseStat = this._stats[name] ?? this.state.pokemon.stats[name] ?? 1;
        const stage = this._statChanges[name] ?? 0;
        const finalStat = baseStat
            * this._statStageMultiplier(name, stage)
            * this.modifier(name)
        return fixFloat(finalStat);
    }

    set(name, value) {
        if (name !== "hp") {
          console.log(`BUG: Set ${name} to ${value}`);
          return
        }

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
        const attacker = this.state.battle.opponentOf(this.state.pokemon);
        const statChanged = Math.random() < (move.statChanges.chance / 100)
        if (!statChanged) return
        const oldStatChanges = structuredClone(move.statChanges)
        if(on === "self") {
            this.state.pokemon.abilities.onTryBoost(move.statChanges.self, attacker, attacker)
            attacker.abilities.onTryBoostOpponent(move.statChanges.self, attacker, attacker)
            for (const [stat, change] of Object.entries(move.statChanges.self)) {
                attacker.state.stats.applyStatChange(stat, change)
            }
        }
        else if (on === "target") {
            this.state.pokemon.abilities.onTryBoost(move.statChanges.target, this.state.pokemon, attacker)
            attacker.abilities.onTryBoostOpponent(move.statChanges.target, this.state.pokemon, attacker)
            
            for (const [stat, change] of Object.entries(move.statChanges.target)) {
                this.applyStatChange(stat, change)
            }
        }
        move.statChanges = oldStatChanges
    }

    applyStatChange(stat, stages) {
        if (this._freezed) return null
  
        if (!this._statChanges[stat]) {
            this._statChanges[stat] = 0;
        }
        
        console.log(stat, stages, this.state.pokemon.name);
        

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

    refresh() {
        this._stats = {
          hp: this.state.pokemon.stats.hp
        };
        this.prev = new PrevStatsManager(this.state, this)
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

class DamageManager {
    _modifiers = []
    _critModifiers = []
    _blockModifiers = []
    _powerModifiers = {}
    
    constructor(state) {
        this.state = state
        
        this.state.on("scene", () => {
            this._modifiers = []
            this._critModifiers = []
            this._blockModifiers = []
            this._powerModifiers = {}
        })
        this.state.on("wave", () => {
            this._modifiers = []
            this._critModifiers = []
            this._blockModifiers = []
            this._powerModifiers = {}
        })
    }
    
    toJSON() {
        return {
            _modifiers: { ...this._modifiers },
            _critModifiers: { ...this._critModifiers },
        }
    }
    
    sync(data) {
        this._modifiers = data._modifiers
        this._critModifiers = data._critModifiers
    }

    modifier() {
        return this._modifiers.reduce((acc, m) => acc * m, 1)
    }

    critModifier() {
        return this._critModifiers.reduce((acc, m) => acc * m, 1)
    }
    blockModifier() {
        return Math.min(1, this._blockModifiers.reduce((acc, m) => acc + m, 0))
    }
    powerModifier(id) {
        const all = this._powerModifiers['*']?.reduce((acc, m) => acc * m, 1) ?? 1
        const specific = this._powerModifiers[id]?.reduce((acc, m) => acc * m, 1) ?? 1
        return all * specific
    }

    chainModify(modifier) {
        this._modifiers.push(modifier)
    }

    chainModifyCrit(modifier) {
        this._critModifiers.push(modifier)
    }
    
    chainModifyPower(id, modifier) {
        if (!this._powerModifiers[id]) 
            this._powerModifiers[id] = []
        this._powerModifiers[id].push(modifier)
    }

    chainAddBlock(modifier) {
        this._blockModifiers.push(modifier)
    }
}

class ArmorManager {
    _items = []

    constructor(state) {
        this.state = state
        this.state.pokemon.items._items
          .filter(item => item.type === "armor")
          .forEach(item => this.add(item))
    }
    
    maxhp() {
        return this._items.reduce((hp, item) => {
            return hp + item.armor.hp
        }, 0)
    }

    hp() {
        return Math.round(this._items.reduce((hp, item) => {
            return hp + item.armor._hp
        }, 0))
    }

    add(item, toFront = false) {
      item.armor = {
        hp: 100,
        _hp: 100
      }
      this._items[toFront ? "unshift" : "push"](item)
    }

    remove(id) {
        this._items = this._items.filter(item => item.id !== id)
    }

    consume(amount) {
        const id = this.state._data.armorUsed  
              
        if (!id) return amount
        const armor = this._items.find(item => item.id === id)
        armor.armor._hp -= amount
        if (armor.armor._hp < 0) {
            amount = Math.abs(armor.armor._hp)
            armor.armor._hp = 0
        }
        else amount = 0
        return Math.max(amount, 0)
    }

    forCategory(category) {
        const statMap = {
            "Physical": "def",
            "Special": "spd"
        }
        for (const item of this._triggeredArmors()) {
            const defStat = item.stats[statMap[category]]

            if (defStat > 0 && item.armor._hp > 0) {
                return {
                    id: item.id,
                    defStat
                } 
            }
        }
        return null
    }

    _triggeredArmors() {
        return this._items.filter(item => {
            return Math.random() < (item.covers / 100)
        })
    }
}

class BattlePrompt {
    _repliers = {};

    async ask(tag, ...args) {
        const replier = this._repliers[tag]
        if (!replier) throw new Error(`No replier for tag ${tag}`)
        return await replier(...args)
    }

    reply(tag, cb) {      
        this._repliers[tag] = cb
        return this
    }
}

export const BATTLE_SYSTEMS = {
    "single": SingleBattle,
    "multiple": MultiBattle,
}