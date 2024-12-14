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
const enemyStats = document.getElementById("enemy-stats");

globalThis.showStats = async function() {

    const level = levelInp.value;
    const nature = natureInp.value;
    const enemyPokemon = new Pokemon(enemy.value, { xp: level * 100, nature });
    enemyStats.innerHTML = JSON.stringify(enemyPokemon.stats.all(),  null, 2);
}


globalThis.startBattle = function() {
    const level = levelInp.value;
    const retreat = retreatInp.value;
    const nature = natureInp.value;
    const moves = [
        document.getElementById("move-input-1").value,
        document.getElementById("move-input-2").value,
        document.getElementById("move-input-3").value,
        document.getElementById("move-input-4").value,
        document.getElementById("move-input-5").value,
    ].filter(Boolean).join(",")

    window.location = `battle.html?you=${getParam("name")}&enemy=${enemy.value}&xp=${level * 100}&retreat=${retreat}&nature=${nature}&moves=${moves}`;
}