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
      pokemon.state._data.autoDodgeCountDown--
      if (pokemon.state._data.autoDodgeCountDown > 0)
      pokemon.state._data.autoDodgeCountDown = 3
      pokemon.state.flags.autoDodge = 1
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
  }
}