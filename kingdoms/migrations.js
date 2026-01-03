import pokemons from "../data/pokemons.js"

// MIGRATIONS
function FIXED_FORCES_LEVEL_BASED_ON_IMAGE(kingdom) {
    const getInitialXp = image => {
        const pokemon = pokemons[image]
        let lvl = 1
        if (pokemon.type === "human")
            lvl = (pokemon.num - 1) * 10
        return Math.max(1, lvl)
    }

    const fixForce = force => {
        for (const shift in force) {
            for (const { image } of force[shift]) {                
                image.xp = getInitialXp(image.id)
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