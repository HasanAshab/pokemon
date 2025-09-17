import pokemons from "../pokemons.js"

const MOVES = {}


function calcRetreat(pokemon) {
  const totalBaseStats = Object.values(pokemon.baseStats).reduce((a, b) => a + b)
  const X1 = 198, Y1 = 5
  const X2 = 700, Y2 = 100
  let result = Y1 * Math.pow(Y2 / Y1, (totalBaseStats - X1) / (X2 - X1))
  result *= (pokemon.type === "beast" ? 1.2 : 1)
  return Math.round(result)
}


for (const [id, pokemon] of Object.entries(pokemons)) {
  if (!["beast", "entity"].includes(pokemon.type)) continue
  
  MOVES[`summon:${id}`] = {
    accuracy: 80,
    basePower: 0,
    category: "Status",
    name: `Summon (${pokemon.name})`,
    pp: null,
    priority: 0,
    flags: { summon: 1 },
    target: "self",
    type: "Normal",
    retreat: calcRetreat(pokemon),
    onTryMove(pokemon) { 
      pokemon.state.decreaseHealth(pokemon.hp * 0.05, true)
    },
    async onAfterMove(pokemon) {
      const quantity = pokemon.type === "beast" ? 1 : pokemon.state._data.summonQuantity 
      
      for (let i = 0; i < quantity; i++) {
        await pokemon.state.summon(id)
      }
    }
  }
}

export default MOVES