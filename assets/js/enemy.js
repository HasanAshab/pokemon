import db from "./utils/db.js";
import { Pokemon } from "./utils/models.js";

window.onload = async () => {
    const pokemons = await db.pokemons.all();
    const dataList = document.getElementById("enemy-data-list");
    dataList.innerHTML = pokemons.map(pokemon => `<option value="${pokemon}">${pokemon}</option>`).join("");

    const moves = await db.moves.all();
    const moveDataList = document.getElementById("moves-data-list");
    moveDataList.innerHTML = moves.map(move => `<option value="${move}">${move}</option>`).join("");
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
    window.location = `battle.html?enemy=${enemy.value}&level=${level}&nature=${nature}`;
}