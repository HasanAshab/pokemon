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
      pokemon.state.stats._statChanges.spe += 0.5
      this.ability._totalSpeedBoost += 0.5
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
    beastTailsCount: 1,
    tokenChangesPercent: {
      spe: 50,
      def: -20,
    },
    statChanges: {
      crit: 1
    },
    onModifyMove(move) {
        if (move.id.startsWith("tail") || move.id.endsWith("tail")) {
            const hitCount = move.multiHit();
            move.multiHit = () => {
                return hitCount * this.ability.beastTailsCount
            }
        }
    },
  },
  tail3beast: {
    type: 'beast',
    beastTailsCount: 3,
    tokenChangesPercent: {
      spe: 100,
    },
    statChanges: {
      crit: 2
    },
    onModifyMove(move) {
        if (move.id.startsWith("tail") || move.id.endsWith("tail")) {
            const hitCount = move.multiHit();
            move.multiHit = () => {
                return hitCount * this.ability.beastTailsCount
            }
        }
    },
  },
  tail6beast: {
    type: 'beast',
    beastTailsCount: 6,
    tokenChangesPercent: {
      spe: 200,
    },
    statChanges: {
      crit: 2
    },
    onModifyMove(move) {
        if (move.id.startsWith("tail") || move.id.endsWith("tail")) {
            const hitCount = move.multiHit();
            move.multiHit = () => {
                return hitCount * this.ability.beastTailsCount
            }
        }
    },
  },
  tail9beast: {
    type: 'beast',
    beastTailsCount: 9,
    tokenChangesPercent: {
      spe: 300,
    },
    statChanges: {
      crit: 3
    },
    onModifyMove(move) {
        if (move.id.startsWith("tail") || move.id.endsWith("tail")) {
            const hitCount = move.multiHit();
            move.multiHit = () => {
                return hitCount * this.ability.beastTailsCount
            }
        }
    },
  },
  tail10beast: {
    type: 'beast',
    beastTailsCount: 10,
    tokenChangesPercent: {
      spe: 300,
    },
    statChanges: {
      crit: 3
    },
    onModifyMove(move) {
        if (move.id.startsWith("tail") || move.id.endsWith("tail")) {
            const hitCount = move.multiHit();
            move.multiHit = () => {
                return hitCount * this.ability.beastTailsCount
            }
        }
    },
    onTryBoost(boost, target, source, effect) {      
      delete boost.spe
      delete boost.crit
    },
  },
}