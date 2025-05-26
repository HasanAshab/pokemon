import { sumObj } from "../../assets/js/utils/helpers.js"

export default {
  sharingan1: {
    onActivate(pokemon) {
      pokemon.state.stats._statChanges.accuracy += 2
    },
    onDeactivate(pokemon) {
      pokemon.state.stats._statChanges.accuracy += 2
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
        this.popup("ability aquired auto dodge");
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
    onTryBoost(boost, target, source, effect) {
      if (source && target === source) return
      for (let i in boost) {
        boost[i] *= -1
      }
    },
    onTurn(pokemon, opponent) {
      // Config
      const MAX = 8;
      const MIN = 2;

      // Revive
      const maxHp = pokemon.maxhp;
      const currentHp = pokemon.hp;
      const missingHpRatio = 1 - (currentHp / maxHp);
      const hpIncreasePercent = Math.min((MIN / 100) + missingHpRatio * 0.23, (MAX / 100)).toFixed(2);
      const hp = maxHp * hpIncreasePercent;
      pokemon.state.increaseHealth(hp);
      console.log(`${pokemon.name}: ability increased health by ${hp.toFixed(2)} (${hpIncreasePercent * 100}%)`);
    }

  },
  mayangan3: {
    onTryBoost(boost, target, source, effect) {
      if (source && target === source) return
      for (let i in boost) {
        boost[i] *= -1
      }
    },
    onTurn(pokemon, opponent) {
      // Config
      const MAX = 15;
      const MIN = 5;
      const ATTACK_SELF_CHANCE = 30;

      // Cleanup
      opponent.state.flags.attackSelf = 0;

      // Revive
      const maxHp = pokemon.maxhp;
      const currentHp = pokemon.hp;
      const missingHpRatio = 1 - (currentHp / maxHp);
      const hpIncreasePercent = Math.min((MIN / 100) + missingHpRatio * 0.23, (MAX / 100)).toFixed(2);
      const hp = maxHp * hpIncreasePercent;
      pokemon.state.increaseHealth(hp);
      console.log(`${pokemon.name}: ability increased health by ${hp.toFixed(2)} (${hpIncreasePercent * 100}%)`);
      

      // Opponent Attack Self
      if (Math.random() * 100 < ATTACK_SELF_CHANCE) {
        opponent.state.flags.attackSelf = 1;
        console.log(`${opponent.name}: ${pokemon.name}'s ability caused attack self`);
      }
    }
  },

  shadow: {
    canUseMove(move) {      
      return move.category !== "Physical"
    },
    onModifyOpponentAtk(_, target, source, move) {
      console.log(`${source.name}: ability immune to ${move.name}`);
      
      return this.chainModify(0)
    }
  },
  onehandedbeast: {
    type: 'beast',
    //dynamic
    onActivate(pokemon) {
      const tokens = {
        atk: 15,
        spe: 5,
      }
      pokemon.tokens = sumObj(pokemon.tokens, tokens)
    },
    onDeactivate(pokemon) {
      const tokens = {
        atk: 15,
        spe: 5,
      }
      pokemon.tokens = sumObj(pokemon.tokens, modObj(tokens, -1))
    },
    onModifyAtk(_, target, source, move) {
      const chance = 30
      if (!move.flags.weapon && Math.random() * 100 < chance) {
        this.chainModify(1.3)
        this.debug(`${target.name}: beast also used ${move.name}`);
      }
    }
  }
}