import pokemons from "../data/pokemons.js"
import { getInitialFixedXp } from "./utils.js"

// MIGRATIONS
function FIXED_FORCES_LEVEL_BASED_ON_IMAGE(kingdom) {
    const fixForce = force => {
        for (const shift in force) {
            for (const { image } of force[shift]) {                
                image.xp = getInitialFixedXp(image.id)
            }
        }
    }

    fixForce(kingdom.barrack.polices)
    fixForce(kingdom.barrack.soldiers)
}

window.onload = () => {
    const kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
    Object.values(kingdoms).forEach(kingdom => {
        FIXED_FORCES_LEVEL_BASED_ON_IMAGE(kingdom)
    });

    localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
}