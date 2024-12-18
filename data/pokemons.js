import defaultPokemons from './default/pokemons.js'
import extraPokemons from './extras/pokemons.js'

// Export processed moves
export default {
    ...defaultPokemons,
    ...extraPokemons
};
