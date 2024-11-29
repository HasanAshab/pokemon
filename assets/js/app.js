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

setTimeout(t, 1000)


function applyStatChanges(attacker, target, move) {
    const { stat_changes } = move;

    // Initialize stat stages if not already present
    // Apply changes to defender's stat stages
    for (const [stat, change] of Object.entries(stat_changes.target)) {
        target.state.applyStatChange(stat, change)
    }

    // Apply changes to attacker's stat stages
    for (const [stat, change] of Object.entries(stat_changes.self)) {
        attacker.state.applyStatChange(stat, change)
    }
}


function canDodge(pokemon1, pokemon2, move) {
    if (move.accuracy === null) {
        // Moves with null accuracy always hit
        return false;
    }

    // Get speed stats
    const pokemon1Spd = pokemon1.statOf("speed");
    const pokemon2Spd = pokemon2.statOf("speed");
    const isPhysical = move.damage_class === "physical";

    // Simulate hit/miss based on final accuracy
    const maxHitChance = isPhysical ? 100 : 50
    const minHitChance = isPhysical ? 25 : 50
    const hitChance = (Math.random() * maxHitChance) - minHitChance; 
    const dodgeChance = (pokemon2Spd - pokemon1Spd);
    return dodgeChance > hitChance;
}

async function calculateWinXP(poke1, poke2) {
    const levelMultiplier = (poke2.level / poke1.level) * 5;
    const baseXp = 10
    let typeEffectiveness1 = 1
    let typeEffectiveness2 = 1

    for (const type of poke2.data.types) {
        typeEffectiveness1 *= await poke1.effectiveness(type)
    }
    for (const type of poke1.data.types) {
        typeEffectiveness2 *= await poke2.effectiveness(type)
    }
    
    const typeEffectiveness = typeEffectiveness1 / typeEffectiveness2

    const xp = Math.floor(baseXp * levelMultiplier * typeEffectiveness);
    return xp;
}
