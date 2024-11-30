import db from "./utils/db.js"
import { Pokemon, Move } from "./utils/models.js"
import { calculateDamage } from "./utils/damage.js"

async function t() {
const ember = await Move.make("ember")
const growl = await Move.make("growl")

const charmander = await Pokemon.make("charmander", {
    xp: 10 * 100,
    nature: "brave"
})
console.log("before", charmander.state.stats())
const charmander2 = await Pokemon.make("charmander", {
    xp: 12 * 100,
    nature: "calm"
})
const bulbasaur = await Pokemon.make("bulbasaur", {
    xp: 10 * 100,
    nature: "calm"
})

//console.log("charmander damage without any target", await calculateDamage(charmander, ember))
console.log("charmander thrown ember on bulbasaur", await calculateDamage(charmander2, ember, bulbasaur))
console.log("charmander thrown ember on charmander", await calculateDamage(charmander, ember, charmander))
console.log("charmander thrown ember on charmander", await calculateDamage(charmander2, ember, charmander))
// console.log("2 charmander thrown ember on each others", await calculateDamage(charmander, ember, charmander2, growl))


//applyStatChanges(charmander2, charmander, growl)
//console.log("after", charmander.state.stats())
//console.log("charmander damage without any target", await calculateDamage(charmander, ember))

}

//setTimeout(t, 1000)
