import { Damage } from "../../assets/js/utils/damage.js"


export default {
  sharingan1: {
    statChanges: {
      accuracy: 2
    },
    onTryAddVolatile(status, pokemon) {
      if (status.id === "confusion") return null
    }
  },
  sharingan2: {
    onTryBoost(boost, target, source, effect) {
      if (source && target === source) return
      if (boost.accuracy && boost.accuracy < 0) {
        delete boost.accuracy
      }
    },
    onTryAddVolatile(status, pokemon) {
      if (status.id === "confusion") return null
    }
  },
  sharingan3: {
    onTurn(pokemon) {
      if (pokemon.state.flags.autoDodge) return
      if (pokemon.state._data.autoDodgeCountDown === undefined) {
        pokemon.state._data.autoDodgeCountDown = 3
      }      

      pokemon.state._data.autoDodgeCountDown--
      if (pokemon.state._data.autoDodgeCountDown === 0) {
        pokemon.state._data.autoDodgeCountDown = undefined
        pokemon.state.flags.autoDodge = 1
        this.popup("ability aquired auto dodge", pokemon);
      }
    },
    onTryBoost(boost, target, source, effect) {
      if (source && target === source) return
      if (boost.accuracy && boost.accuracy < 0) {
        delete boost.accuracy
      }
    },
    onTryAddVolatile(status, pokemon) {
      if (status.id === "confusion") return null
    }
  },

  mayangan1: {
    onTryBoost(boost, target, source, effect) {
      if (source && target === source) return
      for (let i in boost) {
        boost[i] *= -1
      }
    }
  },
  mayangan2: {
    healthBoost: [2, 8],
    onTryBoost(boost, target, source, effect) {
      if (source && target === source) return
      for (let i in boost) {
        boost[i] *= -1
      }
    },
    onTurn(pokemon, opponent) {
      // Config
      const [MIN, MAX] = this.ability.healthBoost;

      // Revive
      const maxHp = pokemon.maxhp;
      const currentHp = pokemon.hp;
      const missingHpRatio = 1 - (currentHp / maxHp);
      const hpIncreasePercent = Math.min((MIN / 100) + missingHpRatio * 0.23, (MAX / 100)).toFixed(2);
      const hp = maxHp * hpIncreasePercent;
      pokemon.state.increaseHealth(hp);
    }
  },
  mayangan3: {
    healthBoost: [5, 15],
    attackSelfChance: 30,
    onTryBoost(boost, target, source, effect) {
      if (source && target === source) return
      for (let i in boost) {
        boost[i] *= -1
      }
    },
    onTurn(pokemon, opponent) {
      // Config
      const [MIN, MAX] = this.ability.healthBoost;
      const ATTACK_SELF_CHANCE = this.ability.attackSelfChance;

      // Cleanup
      opponent.state.flags.attackSelf = 0;

      // Revive
      const maxHp = pokemon.maxhp;
      const currentHp = pokemon.hp;
      const missingHpRatio = 1 - (currentHp / maxHp);
      const hpIncreasePercent = Math.min((MIN / 100) + missingHpRatio * 0.23, (MAX / 100)).toFixed(2);
      const hp = maxHp * hpIncreasePercent;
      pokemon.state.increaseHealth(hp);

      // Opponent Attack Self
      if (Math.random() * 100 < ATTACK_SELF_CHANCE) {
        opponent.state.flags.attackSelf = 1;
        this.popup("opponent attack self", pokemon);
      }
    }
  },

  shadow: {
    canUseMove(move) {      
      return move.category !== "Physical"
    },
    onModifyOpponentAtk(_, target, source, move) {
      this.popup("immune to physical touch", source);
      return this.chainModify(0)
    }
  },

  mistmaster: {
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
    onHitteeMove(move, pokemon, opponent) {
      if (move.type === "Ground" && move.hit.criticalCount()) {
        this.deactivate()
        this.popup(`breaked by ${move.name}`, pokemon);
      }
    }
  },
  flamebody: {
    _totalSpeedDecrease: 0,
    onTurn(pokemon, opponent) {
      opponent.state.stats._statChanges.spe -= 0.25
      this.ability._totalSpeedDecrease += 0.25
    },
    onDeactivate(pokemon, opponent) {
      opponent.state.stats._statChanges.spe += this.ability._totalSpeedDecrease
      this.ability._totalSpeedDecrease = 0
    },
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target)) {
        if (this.randomChance(3, 10)) {
          source.trySetStatus("brn", target)
        }
      }
    },
    onModifyOpponentAtk(_, target, source, move) {
      if (move.type === "Water") {
        return this.chainModify(1.5)
      }
    },
    onHitteeMove(move, pokemon, opponent) {
      if (move.type === "Water" && move.hit.criticalCount()) {
        this.deactivate()
        this.popup(`breaked by ${move.name}`, pokemon);
      }
    },
  },

  hand1beast: {
    type: 'beast',
    beastAttackChance: 30,
    beastAttackCount: 1,
    tokenChangesPercent: {
      atk: 20,
      spe: -10,
    },
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
  hand3beast: {
    type: 'beast',
    beastAttackChance: 30,
    beastAttackCount: [1, 3],
    tokenChangesPercent: {
      atk: 30,
      spe: -50,
    },
    onModifyMove(move, pokemon) {
      if (move.id !== "block") return
      const modifier = Math.random() * 0.2
      pokemon.state.damage.chainAddBlock(modifier)
      console.log(`hand beast blocked more ${modifier * 100}% of damage`);
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
  hand6beast: {
    type: 'beast',
    beastAttackChance: 45,
    beastAttackCount: [2, 6],
    tokenChangesPercent: {
      atk: 50,
      spe: -100,
    },
    onModifyMove(move, pokemon) {
      if (move.id !== "block") return
      const modifier = Math.random() * 0.5
      pokemon.state.damage.chainAddBlock(modifier)
      console.log(`hand beast blocked more ${modifier * 100}% of damage`);
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
  tail1beast: {
    type: 'beast',
    _tailsUsed: 0,
    beastTailsCount: 1,
    onDeactivate() {
      this.ability._tailsUsed = 0
    },
    canUseMove(move) {      
      return !move.flags.weapon
    },
    onModifyMove(move, pokemon) {
      move.flags.weapon = 1
      move.flags.bodypart = 1
      
      if (move.id.includes("tail") && move.multihit) {
          const bonus = Math.max(this.ability.beastTailsCount - this.ability._tailsUsed, 0)
          
          if (!Array.isArray(move.multihit))        
            move.multihit += bonus;
          else
            move.multihit[1] += bonus;
          this.ability._tailsUsed++
      }

      // TEMP: workaround to reset move
      pokemon.state.once("used-move", move => {        
        const actualMove = pokemon.state.moves.find(m => m.id === move.id)        
        actualMove.flags = actualMove._ref.flags
        actualMove.multihit = actualMove._ref.multihit
      })
    },
  },
}