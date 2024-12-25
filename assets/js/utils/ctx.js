const MOVE_DEX = {
    conditions: {
        get: () => null
    }
}

export const MOVE_CTX = {
    debug: () => null,
    runEvent: () => null,
    dex: MOVE_DEX,
    
    heal(hp, pokemon) {
        pokemon.state.increaseHealth(hp)
    },

    damage(damage, pokemon) {
        pokemon.state.decreaseHealth(damage)
    }
}
