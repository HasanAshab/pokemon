const MOVE_DEX = {
    conditions: {
        get: () => null
    }
}

export const MOVE_CTX = {
    add: (...args) => null, // todo
    debug: () => null,
    runEvent: () => true, //todo
    dex: MOVE_DEX,
    
    heal(hp, pokemon) {
        pokemon.state.increaseHealth(hp)
    },

    damage(damage, pokemon) {
        pokemon.state.decreaseHealth(damage)
    },
}
