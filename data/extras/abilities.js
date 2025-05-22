export default {
  sharingan1: {
    onStart(pokemon) {
      pokemon.state.stats._statChanges.accuracy = 2
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
        console.log(`${pokemon.name}: ability aquired auto dodge`);
        
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
    onTurn(pokemon) {
      const MAX = 10;
      const MIN = 2;

      const maxHp = pokemon.maxhp;
      const currentHp = pokemon.hp;
      const missingHpRatio = 1 - (currentHp / maxHp);
      const hpIncreasePercent = Math.min((MIN / 100) + missingHpRatio * 0.23, (MAX / 100)).toFixed(2);
      const hp = maxHp * hpIncreasePercent;
      pokemon.state.increaseHealth(hp);
      console.log(`${pokemon.name}: ability increased health by ${hp.toFixed(2)} (${hpIncreasePercent * 100}%)`);
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
  }
}