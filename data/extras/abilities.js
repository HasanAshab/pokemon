export default {
  sharingan: {
    onStart(pokemon) {
      pokemon.state.stats._statChanges.accuracy = 2
    },
    onTryAddVolatile(status, pokemon) {
      if (status.id === "confusion") return null
    }
  }
}