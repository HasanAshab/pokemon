import { Damage } from "../../assets/js/utils/damage.js"
import { weightedRandom } from "../../assets/js/utils/helpers.js"
import types from "../types.js"

function SharinganAbility({ blind, copycat, retreat, dependencies = [] }) {
  return {
    retreat,
    accuracyReduced: 0,
    dependencies,
    copycat: {
      data: {},
      min: Array.isArray(copycat) ? copycat[0] : copycat,
      max: Array.isArray(copycat) ? copycat[1] : copycat
    },
    onActivate(pokemon) {
      pokemon.state.removeListener("turn", "sharingan-recovery")
    },
    onDeactivate(pokemon) {
      pokemon.state.on("turn", () => {
        if (this.ability.accuracyReduced <= 0) 
          return pokemon.state.removeListener("turn", "sharingan-recovery")

        pokemon.state.stats._statChanges.accuracy += blind
        this.ability.accuracyReduced -= blind
      }, "sharingan-recovery")
    },
    onTurn(pokemon) {
      pokemon.state.stats._statChanges.accuracy -= blind
      this.ability.accuracyReduced += blind
    },
    onModifyOpponentMove(move, pokemon) {
      const unableToCopy = pokemon.state.hasMove(move.id) || move.flags.weapon
      if (unableToCopy) return null

      const data = this.ability.copycat.data
      const min = this.ability.copycat.min
      const max = this.ability.copycat.max
      const copycatAfter = Math.floor(Math.random() * (max - min + 1) + min)

      if (!data[move.id])
        data[move.id] = 0
      data[move.id]++

      if (data[move.id] === copycatAfter)
        pokemon.state.addMove(move.id)
    }
  }
}
function SharedEyeAbility({ blind, retreat, dependencies = [] }) {
  return {
    retreat,
    accuracyReduced: 0,
    dependencies,
    onActivate(pokemon) {
      pokemon.state.removeListener("turn", "sharedeye-recovery")
    },
    onDeactivate(pokemon) {
      pokemon.state.on("turn", () => {
        if (this.ability.accuracyReduced <= 0) 
          return pokemon.state.removeListener("turn", "sharedeye-recovery")

        pokemon.state.stats._statChanges.accuracy += blind
        this.ability.accuracyReduced -= blind
      }, "sharedeye-recovery")
    },
    onTurn(pokemon) {
      pokemon.state.stats._statChanges.accuracy -= blind
      this.ability.accuracyReduced += blind
    },
  }
}

export default {
  // secret
  sharedeye: SharedEyeAbility({blind: 0.125, retreat: -1, dependencies: ["mayangan:silver-eye", "mayangan:selfish-scar:silver"]}),
  // gets 6 seconds
  sharingan1: SharinganAbility({ blind: 0.5, copycat: 5, retreat: 1.5 }),
  // gets 12 seconds
  sharingan2: SharinganAbility({ blind: 0.25, copycat: 3, retreat: 3 }),
  // gets 20 seconds
  sharingan3: SharinganAbility({ blind: 0, copycat: [1, 2], retreat: 5 }),
  defsusano: {
    retreat: 1,
    oldSpeedStat: null,
    onActivate(pokemon) {
      this.ability._lockStatChanges(pokemon)

      const defStat = pokemon.state.stats.get("def") + pokemon.state.stats.get("spd")
      const armor = {
        id: "$susano",
        type: "armor",
        covers: 100,
        stats: {
          def: defStat,
          spd: defStat
        }
      }
      pokemon.state.armor.add(armor, true)
    },
    onDeactivate(pokemon) {
      pokemon.state.stats._statChanges.spe = this.ability.oldSpeedStat
      this.ability.oldSpeedStat = null
      pokemon.state.armor.remove("$susano")
    },
    onTurn(pokemon) {
      this.ability._lockStatChanges(pokemon)
    },
    onWave(pokemon) {
      this.ability._lockStatChanges(pokemon)
    },
    canUseMove(move) {
      return !move.flags.contact
    },
    _lockStatChanges(pokemon) {
      this.ability.oldSpeedStat = pokemon.state.stats._statChanges.spe
      pokemon.state.stats._statChanges.spe = -6
    }
  },
  offsusano: {
    oldSpeedStat: null,
    oldAccuracyStat: null,
    onActivate(pokemon) {
      if (pokemon.hp / pokemon.maxhp > 0.7) {
        this.popup('Susano Failed', pokemon);
        return this.deactivate()
      }
      this.ability._lockStatChanges(pokemon)
      const defStat = pokemon.state.stats.get("def") + pokemon.state.stats.get("spd")
      const armor = {
        id: "$susano",
        type: "armor",
        covers: 100,
        stats: {
          def: defStat,
          spd: defStat
        }
      }
      pokemon.state.armor.add(armor, true)
      pokemon.state.addMove("$susanosword")
    },
    onDeactivate(pokemon) {
      pokemon.state.stats._statChanges.spe = this.ability.oldSpeedStat
      pokemon.state.stats._statChanges.accuracy = this.ability.oldAccuracyStat
      this.ability.oldSpeedStat = null
      this.ability.oldAccuracyStat = null
      pokemon.state.armor.remove("$susano")
      pokemon.state.removeMove("$susanosword")
    },
    onTurn(pokemon) {
      this.ability._lockStatChanges(pokemon)
    },
    onWave(pokemon) {
      this.ability._lockStatChanges(pokemon)
    },
    canUseMove(move) {
      return move.id === "$susanosword"
    },
    _lockStatChanges(pokemon) {
      this.ability.oldSpeedStat = pokemon.state.stats._statChanges.spe
      this.ability.oldAccuracyStat = pokemon.state.stats._statChanges.accuracy
      pokemon.state.stats._statChanges.spe = -3
      pokemon.state.stats._statChanges.accuracy = -3
    }
  },

  // opponents time half , never flinch, heit
  mayangan1: {
    retreat: 3
  },
  "mayangan:selfish-scar:silver": {
    retreat: 1.5,
    dependencies: ["mayangan:silver-eye"]
  },
  "mayangan:selfish-scar:golden": {
    retreat: 1.5,
    dependencies: ["mayangan:golden-eye"]
  },

  "mayangan:silver-eye": {
    onTryBoost(boost, target, source) {
      console.log(target.name);
      
      const hasIntelligentEye = target.hasAbility("mayangan:selfish-scar:silver");
      console.log(hasIntelligentEye);
      
      for (let i in boost) {
        if (hasIntelligentEye && boost[i] < 0)
          delete boost[i]
        else
          boost[i] = -boost[i];
      }
    },
    retreat: 0.5
  },
  // nakku
  "mayangan:golden-eye": {
    onTryBoostOpponent(boost, target, source, opponent) {
      const hasIntelligentEye = opponent.hasAbility("mayangan:selfish-scar:golden");
      for (let i in boost) {
        if (hasIntelligentEye && boost[i] > 0)
          delete boost[i]
        else
          boost[i] = -boost[i];
      }
    },
    retreat: 1.5
  },

  // fushi
  fishingan1: {
    retreat: 1,
    oldSpeStat: null,
    onActivate(pokemon, opponent, battle) {
      this.ability._lockSpeDown(battle, pokemon)
    },
    onWave(pokemon, opponent, battle) {
      this.ability._lockSpeDown(battle, pokemon)
    },
    onTurn(pokemon, opponent, battle) {
      this.ability._lockSpeDown(battle, pokemon)
    },
    onDeactivate(pokemon) {
      pokemon.state.stats._statChanges.spe = this.ability.oldSpeStat
      this.ability.oldSpeStat = null
    },
    _lockSpeDown(battle, pokemon) {
      if (battle.fields.some(f => f.type === "Water")) {
        if (pokemon.state.stats._statChanges.spe < 3) {
          this.ability.oldSpeStat = pokemon.state.stats._statChanges.spe
          pokemon.state.stats._statChanges.spe = 3
        }
      }
      else if (this.ability.oldSpeStat !== null) {
        pokemon.state.stats._statChanges.spe = this.ability.oldSpeStat
      }
    }
  },
  fishingan2: {
    retreat: 2.5,
    onActivate(pokemon) {
      pokemon.state.moves.forEach(move => {
        if (move.type === "Water") {
          move.accuracy = true
        }
      })
    },
    onDeactivate(pokemon) {
      pokemon.state.moves.forEach(move => {
        if (move.type === "Water") {
          move.accuracy = move._ref.accuracy
        }
      })
    },
  },

  bhuiyakugan0: {
    retreat: 0,
    flags: { autoenable: 1 },
    onScene(pokemon) {
      if (pokemon.state.effects.has("bleed")) {
        pokemon.state.effects.add(null, "confusion")
      }
    }
  },

  bhuiyakugan1: {
    dependencies: ["bhuiyakugan0"],
    retreat: 0.5,
    onActivate(pokemon) {
        pokemon.state.chainModifyRetreat(0.5, move => move.flags.summon)
    },
    onDeactivate(pokemon) {
        pokemon.state.chainModifyRetreat(2, move => move.flags.summon)
    },
  },

  bhuiyakugan2: {
    dependencies: ["bhuiyakugan0"],
    retreat: 2,
    onActivate(pokemon) {
      pokemon.state.moves.forEach(move => {
        if (move.flags.summon) {
          move.accuracy = true
        }
      })
    },
    onDeactivate(pokemon) {
      pokemon.state.moves.forEach(move => {
        if (move.flags.summon) {
          move.accuracy = move._ref.accuracy
        }
      })
    },
  },
  bhuiyakugan3: {
    retreat: 0,
    onScene(pokemon) {      
      const possibleQuantities = [1, 2, 3]
      const weights = [0.35, 0.40, 0.25]
      pokemon.state._data.summonQuantity = weightedRandom(possibleQuantities, weights)
    },
    onSceneEnd(pokemon) {
      pokemon.state._data.summonQuantity = 1
    }
  },
  bhuiyakugan4: {
    retreat: 0
  },

  shadow: {
    retreat: 2,
    canUseMove(move) {      
      return move.category !== "Physical"
    },
    onModifyOpponentAtk(_, target, source, move) {
      this.popup("immune to physical touch", source);
      return this.chainModify(0)
    }
  },

  innerpressure: {
    retreat: 1.5,
    flags: { autoenable: 1 },
    _refs: {},
    onScene(pokemon) {
        pokemon.state.battle._all.forEach(p => {
          if (p.name === pokemon.name)
            return
          const oldRef = this.ability._refs[p.name]
          if (oldRef)
            p.state.removeRetreatModifier(oldRef)

          const ref = p.state.chainModifyRetreat(this.ability._calcMod(pokemon))
          this.ability._refs[p.name] = ref
        })
    },

    onDeactivate(pokemon) {
        pokemon.state.battle._all.forEach(p => {
          if (p.name === pokemon.name)
            return
          const ref = this.ability._refs[p.name]
          if (ref)
            p.state.removeRetreatModifier(ref)
        })
    },

    _calcMod(pokemon) {      
      return 2 - (pokemon.hp / pokemon.maxhp);
    }
  },

  // no weakness and resistence for the type + effects 100% 
  blueflame: { retreat: 2 },
  purplethunder: { retreat: 2 },
  
  chakrafarm: {
    retreat: 0,
    onWave(pokemon) {
      const chance = Math.random() * 100
      
      if (chance >= 85) {
        pokemon.state.retreat += pokemon.level
      }
      else if (chance >= 65) {
        pokemon.state.retreat += pokemon.level / 1.5
      }
      else if (chance >= 50) {
        pokemon.state.retreat += pokemon.level / 3
      }
    }
  },
  recover: {
    retreat: 2,
    onTurn(pokemon) {
      pokemon.state.increaseHealth(pokemon.maxhp * 0.02)
    }
  },
  regeneration: {
    retreat: 3,
    unrecoverableHP: 0,
    onTurn(pokemon) {
      if (this.ability.unrecoverableHP + pokemon.hp >= pokemon.maxhp) return
      pokemon.state.increaseHealth(pokemon.maxhp * 0.005)
    },
    onModifyOpponentMove(move, pokemon, oppo) {
      if (move.id !== "soulstick") return
      const oldHp = pokemon.hp;
      
      pokemon.state.once("scene-end", () => {
        this.ability.unrecoverableHP += oldHp - pokemon.hp;
      })
    }
  },

  mistmaster: {
    retreat: 3,
    statChanges: {
      accuracy: 3
    },
    opponentStatChanges: {
      accuracy: -3
    },
    canUseMove(move) {      
      return ["Water", "Ice"].includes(move.type)
    },
  },

  flash: {
    retreat: 2,
    _totalSpeedBoost: 0,
    onTurn(pokemon) {
      pokemon.state.stats._statChanges.spe += 0.25
      this.ability._totalSpeedBoost += 0.25
    },
    onDeactivate(pokemon) {
      pokemon.state.stats._statChanges.spe -= this.ability._totalSpeedBoost
      this.ability._totalSpeedBoost = 0
    },
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target)) {
        if (this.randomChance(3, 10)) {
          source.trySetStatus("par", target)
        }
      }
    },
    onModifyOpponentAtk(_, target, source, move) {
      if (move.type === "Ground") {
        return this.chainModify(1.5)
      }
    },
    onModifyOpponentSpA(_, target, source, move) {
      if (move.type === "Ground") {
        return this.chainModify(1.5)
      }
    },
    onHit(pokemon, opponent, move) {
      if (move.type === "Ground" && move.hit.criticalCount()) {
        this.deactivate()
        this.popup(`breaked by ${move.name}`, pokemon);
      }
    }
  },
  flamebody: {
    retreat: 2,
    onDamagingHit(damage, target, source, move) { 
      if (this.checkMoveMakesContact(move, source, target)) {
        if (this.randomChance(5, 10)) {
          source.trySetStatus("brn", target)
        }
      }
    },
    onModifyOpponentAtk(_, target, source, move) {      
      if (move.type === "Water") {
        return this.chainModify(1.5)
      }
    },
    onModifyOpponentSpA(_, target, source, move) {      
      if (move.type === "Water") {
        return this.chainModify(1.5)
      }
    },
    onHit(pokemon, opponent, move) {
      if (move.type === "Water" && move.hit.criticalCount()) {
        this.deactivate()
        this.popup(`breaked by ${move.name}`, pokemon);
      }
    },
  },
  swordmanship: {
    retreat: 0,
    onActivate(pokemon) {
      pokemon.state.moves.forEach(move => {
        if (move.flags.weapon) {
          move.accuracy = true
        }
      })
    },
    onDeactivate(pokemon) {
      pokemon.state.moves.forEach(move => {
        if (move.flags.weapon) {
          move.accuracy = move._ref.accuracy
        }
      })
    },
    flags: { autoenable: 1 }
  },
  senju1: {
    dependencies: ["chakrafarm"],
  },

  changekornam: {
    retreat: 0, //set it
    setup(pokemon) {
      this.ability._lockCritDown(pokemon)
    },
    onScene(pokemon) {
      this.ability._lockCritDown(pokemon)
    },
    _lockCritDown(pokemon) {
      pokemon.state.stats._statChanges.crit = Math.max(2, pokemon.state.stats._statChanges.crit)
    }
  },

  hands1beast: {
    retreat: 1.25,
    type: 'beast',
    beastImage: 'hands1',
    beastAttackChance: 30,
    beastAttackCount: 1,
    onModifyAtk(_, target, source, move) {
      const rand = Math.random() * 100
      if (!move.flags.weapon && rand < this.ability.beastAttackChance) {
        target.state.once("used-move", move => {
            const beast = this.ability._getBeast(target)
            Array.from({ length: this.ability.beastAttackCount }, (_, i) => {
                const damage = new Damage(beast, move, source)
                move.hit.damages.push(damage)
            })
            this.popup("beast also attacked", target);
        })
      }
    },
    _getBeast(pokemon) {
      const beast = pokemon.clone()
      beast.meta.name += " (Beast)"
      beast.tokens.atk += pokemon.stats.atk * 0.2
      beast.state = pokemon.state.clone()
      return beast
    },
  },
  hands3beast: {
    retreat: 3,
    type: 'beast',
    beastImage: 'hands3',
    beastAttackChance: 30,
    beastAttackCount: [1, 3],
    onModifyMove(move, pokemon) {
      if (move.id !== "block") return
      const modifier = Math.random() * 0.1
      pokemon.state.damage.chainAddBlock(modifier)
      this.popup(`hand beast blocked more ${modifier * 100}% of damage`, pokemon);
    },
    onModifyAtk(_, target, source, move) {
      const rand = Math.random() * 100
      if (!move.flags.weapon && rand < this.ability.beastAttackChance) {
        target.state.once("used-move", move => {
            const beastAttackCount = Math.floor(Math.random() * (this.ability.beastAttackCount[1] - this.ability.beastAttackCount[0] + 1) + this.ability.beastAttackCount[0])            
            const beast = this.ability._getBeast(target)
            Array.from({ length: beastAttackCount }, (_, i) => {
                const damage = new Damage(beast, move, source)
                move.hit.damages.push(damage)
            })
            this.popup(`beast also attacked (${beastAttackCount})`, target);
        })
      }
    },
    _getBeast(pokemon) {
      const beast = pokemon.clone()
      beast.meta.name += " (Beast)"
      beast.tokens.atk += pokemon.stats.atk * 0.2
      beast.state = pokemon.state.clone()
      
      return beast
    },
  },
  hand6beast: {
    retreat: 6,
    type: 'beast',
    beastImage: 'hands6',
    beastAttackChance: 45,
    beastAttackCount: [2, 6],
    onModifyMove(move, pokemon) {
      if (move.id !== "block") return
      const min = 0.1
      const max = 0.3
      const modifier = min + Math.random() * (max - min)
      pokemon.state.damage.chainAddBlock(modifier)
      this.popup(`hand beast blocked more ${modifier * 100}% of damage`, pokemon);
    },
    onModifyAtk(_, target, source, move) {
      const rand = Math.random() * 100
      if (!move.flags.weapon && rand < this.ability.beastAttackChance) {
        target.state.once("used-move", move => {
            const beastAttackCount = Math.floor(Math.random() * (this.ability.beastAttackCount[1] - this.ability.beastAttackCount[0] + 1) + this.ability.beastAttackCount[0])            
            const beast = this.ability._getBeast(target)
            Array.from({ length: beastAttackCount }, (_, i) => {
                const damage = new Damage(beast, move, source)
                move.hit.damages.push(damage)
            })
            this.popup(`beast also attacked (${beastAttackCount})`, target);
        })
      }
    },
    _getBeast(pokemon) {
      const beast = pokemon.clone()
      beast.meta.name += " (Beast)"
      beast.tokens.atk += pokemon.stats.atk * 0.2
      beast.state = pokemon.state.clone()
      return beast
    },
  },

  tails1beast: {
    retreat: 1.5,
    type: 'beast',
    beastImage: 'tails1',
    onActivate(pokemon) {
      pokemon.state.moves.forEach(move => {
        if (move.type === "Ground") {
          move.accuracy = true
        }
      })
    },
    onDeactivate(pokemon) {
      pokemon.state.moves.forEach(move => {
        if (move.type === "Ground") {
          move.accuracy = move._ref.accuracy
        }
      })
    },
    onModifyMove(move, pokemon) {
      if (move.id === "block") {
          const min = 0.1
          const max = 0.5
          const modifier = min + Math.random() * (max - min)
          pokemon.state.damage.chainAddBlock(modifier)
          this.popup(`shikagu blocked more ${modifier * 100}% of damage`, pokemon);
      }
    },
  },
  tails2beast: {
    retreat: 1.5,
    type: 'beast',
    beastImage: 'tails2',
    dependencies: ['blueflame'],
  },
  tails3beast: {
    retreat: 2,
    type: 'beast',
    beastImage: 'tails3',
    dependencies: ['roughskin'],
  },
  tails5beast: {
    retreat: 1.5,
    type: 'beast',
    beastImage: 'tails5',
    dependencies: ["regeneration"],
  },
  tails6beast: {
    type: 'beast',
    beastImage: 'tails6',
    onDamagingHit(_, pokemon, contactor, move) {
      if (!this._contacted) return
      contactor.state.stats._statChanges.spe -= 0.25
    }
  },
  tails8beast: {
    type: 'beast',
    beastImage: 'tails8',
    wrapChance: 30,
    onDamagingHit(_, pokemon, contactor, move) {
      const rand = Math.random() * 100      
      if (!this._contacted || rand > this.ability.wrapChance) return
      contactor.state.effects.add(new move.constructor("wrap"), "partiallytrapped")
    }
  },
  tails9beast: {
    retreat: 10,
    type: 'beast',
    beastImage: 'tails9',
    dependencies: ['chakrafarm'],
  },

  tails10beast: {
    type: 'beast',
    beastImage: false,
    dependencies: ["tails1beast", "tails2beast", "tails3beast", "tails5beast", "tails6beast", "tails8beast", "tails9beast"],
  },

  charizardbeast: {
    retreat: 2,
    type: 'beast',
    beastImage: 'charizard',
    onActivate(pokemon) {
        pokemon.state.chainModifyRetreat(0.5, move => move.type === "Fire")
    },
    onDeactivate(pokemon) {
        pokemon.state.chainModifyRetreat(2, move => move.type === "Fire")
    },
  },
  charizardybeast: {
    retreat: 3.5,
    type: 'beast',
    beastImage: 'charizardy',
    onActivate(pokemon) {
        pokemon.state.chainModifyRetreat(0.5, move => ["Fire", "Flying"].includes(move.type))
    },
    onDeactivate(pokemon) {
        pokemon.state.chainModifyRetreat(2, move => ["Fire", "Flying"].includes(move.type))
    },
  },

  killerbeebeast: {
    retreat: 2,
    type: 'beast',
    beastImage: 'killerbee',
    onTurn(pokemon) {
        if (!this._summonAfterTurns) {
            this._summonAfterTurns = this._summonAfterTurns === undefined
                ? 1
                : Math.floor(Math.random() * 3) + 1
        }
        this._summonAfterTurns--
        if (this._summonAfterTurns === 0) {
            pokemon.state.summon("suicidebee")
        }
    }
  },

  // paths
  indrapath: {
    retreat: 2,
    type: 'path',
    onTurn(pokemon) {
      if (pokemon.state.flags.autoDodge) return
      if (pokemon.state._data.autoDodgeCountDown === undefined) {
        pokemon.state._data.autoDodgeCountDown = pokemon.abilities.isActive("rinnegan") ? 2 : 3
      }      

      pokemon.state._data.autoDodgeCountDown--
      if (pokemon.state._data.autoDodgeCountDown === 0) {
        pokemon.state._data.autoDodgeCountDown = undefined
        pokemon.state.flags.autoDodge = 1
        this.popup("aquired auto dodge", pokemon);
      }
    },
  },
  asurapath: {
    retreat: 0,
    type: 'path',
    onActivate(pokemon) {            
        const statExchange = pokemon.state.stats.get("spe") * 0.5
        pokemon.tokens.atk += statExchange
        if (!pokemon.abilities.isActive("rinnegan")) 
          pokemon.tokens.spe -= statExchange
    },
    onDeactivate(pokemon) {
        const statExchange = pokemon.state.stats.get("spe") * 0.5
        pokemon.tokens.atk -= statExchange
        if (!pokemon.abilities.isActive("rinnegan"))
          pokemon.tokens.spe += statExchange
    },
  },
  pretapath: {
        retreat: 2,
    type: 'path',
    onHit(pokemon, opponent, move) {
      const safeTypes = ["normal", "fighting", "ghost"]
      const removeChance = pokemon.abilities.isActive("rinnegan") ? 0.35 : 0.2
      if (!safeTypes.includes(move.type) && Math.random() < removeChance) {
        opponent.state.moves.forEach(m => {
          if (m.type === move.type) {
            opponent.state.removeMove(m.id)
          }
        })
        this.popup(`PRETA PRETA!`, pokemon);
      }
    },
  },
  innerpath: {
    retreat: 0,
    type: 'path',
    onWave(pokemon, opponent) {
      const drainPercent = pokemon.abilities.isActive("rinnegan") ? 0.35 : 0.2
      const drainRetreat = opponent.state.retreat * drainPercent
      pokemon.state.retreat += drainRetreat
      opponent.state.retreat -= drainRetreat      
    }
  },
  animalpath: {
    retreat: 2,
    type: 'path',
    onTurn(_, opponent) {
      if (opponent.abilities.jinchuriki()) {
        opponent.state.effects.add(null, "confusion")
      }
    }
  },
  devapath: { 
        retreat: 0,
    type: 'path',
    dependencies: ["regeneration"],
  },

  rinnegan: {
        retreat: 0,

    dependencies: ["devapath", "animalpath", "innerpath", "pretapath", "asurapath", "indrapath"],
  },
}