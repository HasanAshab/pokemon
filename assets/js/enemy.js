import db from "./utils/db.js";
import { Pokemon } from "./utils/models.js";
import { getParam } from "./utils/helpers.js"

async function loadPokemonsDatalist() {
    const pokemons = await db.pokemons.all();
    const dataList = document.getElementById("enemy-data-list");
    dataList.innerHTML = pokemons.map(pokemon => `<option value="${pokemon}">${pokemon}</option>`).join("");
}

async function loadMovesDatalist() {
    const moves = await db.moves.all();
    const moveDataList = document.getElementById("moves-data-list");
    moveDataList.innerHTML = moves.map(move => `<option value="${move}">${move}</option>`).join("");
}



window.onload = () => {
    loadPokemonsDatalist()
    loadMovesDatalist()
}

const enemy = document.getElementById("enemy");
const levelInp = document.getElementById("level-inp");
const natureInp = document.getElementById("nature-inp");
const enemyStats = document.getElementById("enemy-stats");

globalThis.showStats = async function() {
    const level = levelInp.value;
    const nature = natureInp.value;
    const enemyPokemon = await Pokemon.make(enemy.value, { xp: level * 100, nature });
    enemyStats.innerHTML = JSON.stringify(enemyPokemon.data.stats,  null, 2);
}


globalThis.startBattle = function() {
    const level = levelInp.value;
    const nature = natureInp.value;
    const moves = [
        document.getElementById("move-input-1").value,
        document.getElementById("move-input-2").value,
        document.getElementById("move-input-3").value,
        document.getElementById("move-input-4").value,
        document.getElementById("move-input-5").value,
    ]

    window.location = `battle.html?you=${getParam("name")}&enemy=${enemy.value}&level=${level}&nature=${nature}&moves=${moves.join(',')}`;
}