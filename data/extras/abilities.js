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