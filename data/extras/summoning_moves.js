import pokemons from "../pokemons.js"

const MOVES = {}

for (const pokemon of Object.values(pokemons)) {
  if (!["beast", "entity"].includes(pokemon.type)) continue
  console.log(pokemon.name);
  console.log(pokemon.id);
  
  MOVES[`summon:${pokemon.id}`] = {
    accuracy: true,
    basePower: 0,
    category: "Special",
    name: `Summon (${pokemon.name})`,
    pp: null,
    priority: 0,
    flags: {},
    target: "normal",
    type: "Normal",
    retreat: 0
  }
}

export default MOVES