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
  if (pokemon.type !== "entity") continue
  MOVES[`summon-bulk:${id}`] = {
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: `Bulk Summon (${pokemon.name})`,
    pp: null,
    priority: 0,
    flags: { summon: 1 },
    target: "self",
    type: "Dark",
    retreat: 1,
    async onAfterMove(user) {
      const CHANCE_PER_SUMMON = 0.6
      const cost = calcRetreat(pokemon)
      const count = Math.round(user.state.retreat / cost)
      
      console.debug(`${user.name}: Capable of ${count} ${pokemon.name} summon`)
      
      for (let j = 0; j < count; j++) {
        if (Math.random() > CHANCE_PER_SUMMON)
          continue
        
        const quantity = user.state._data.summonQuantity 
        for (let i = 0; i < quantity; i++) {
          await user.state.summon(id)
        }
        user.state.decreaseHealth(user.hp * 0.05, true)
      }
      user.state.retreat = 0
    }
  }

}

export default MOVES