import pokemons from "../pokemons.js"

const MOVES = {}

for (const [id, pokemon] of Object.entries(pokemons)) {
  if (!["beast", "entity"].includes(pokemon.type)) continue
  console.log(pokemon.name);
  console.log(id);
  
  MOVES[`summon:${id}`] = {
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