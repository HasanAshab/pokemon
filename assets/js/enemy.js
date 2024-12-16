import db from "./utils/db.js";
import { Pokemon } from "./utils/models.js";
import { getParam } from "./utils/helpers.js"
import { loadPokemonsDatalist, loadNaturesDataList, loadMovesDatalist } from "./utils/dom.js";



window.onload = () => {
    loadPokemonsDatalist("enemy-data-list")
    loadNaturesDataList("natures-data-list")
    loadMovesDatalist("moves-data-list")
}

const enemy = document.getElementById("enemy");
const levelInp = document.getElementById("level-inp");
const retreatInp = document.getElementById("retreat-inp");
const natureInp = document.getElementById("nature-inp");
const tokenInp = document.getElementById("token-inp");
const enemyStats = document.getElementById("enemy-stats");

function makePokemon() {
    const level = levelInp.value;
    const retreat = retreatInp.value;
    const nature = natureInp.value;
    const tokens = tokenInp.value ? JSON.parse(tokenInp.value) : {};
    const moves = [
        document.getElementById("move-input-1").value,
        document.getElementById("move-input-2").value,
        document.getElementById("move-input-3").value,
        document.getElementById("move-input-4").value,
        document.getElementById("move-input-5").value,
    ].filter(Boolean).map(id => ({
        id,
        isSelected: true
    }))
    
    return new Pokemon(enemy.value, {
        xp: level * 100,
        nature,
        retreat,
        moves,
        token_used: tokens
    });
}
globalThis.showStats = async function() {
    console.log("bb")
    const enemyPokemon = makePokemon()
    enemyStats.innerHTML = JSON.stringify(enemyPokemon.stats,  null, 2);
}


globalThis.startBattle = function() {
    const enemyPokemon = makePokemon()
    console.log(enemyPokemon)

    window.location = `battle.html?you=${getParam("name")}&enemy=${enemy.value}&xp=${level * 100}&retreat=${retreat}&nature=${nature}&moves=${moves}`;
}