const MOVE_DEX = {
    conditions: {
        get: () => null
    }
}

export const MOVE_CTX = {
    debug: () => null,
    runEvent: () => null,
    dex: MOVE_DEX,
    
    damage(damage, pokemon) {
        pokemon.state.decreaseHealth(damage)
    }
}
