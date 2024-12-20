import { Pokemon,Move } from "./utils/models.js";
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
    const level = parseInt(levelInp.value);
    const retreat = parseInt(retreatInp.value);
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
    const enemyPokemon = makePokemon()
    enemyStats.innerHTML = JSON.stringify(enemyPokemon.stats,  null, 2);
}

globalThis.showMoveDetails = function({currentTarget}){
  const move = new Move(currentTarget.value)
  if (move){
    const moveDetails = document.getElementById("move-details")
    moveDetails.querySelector(".move-name").textContent = move.name
    moveDetails.querySelector(".desc").textContent = move.description()
  
 }
}

globalThis.startBattle = function() {
    const enemyBase64 = makePokemon().toBase64();
    window.location = `battle.html?you=${getParam("name")}&enemy=${enemyBase64}`;
}

globalThis.randomBattle = function() {
    window.location = `battle.html?you=${getParam("name")}&enemy=eyJpZCI6ImJ1bGJhc2F1ciIsIm1ldGEiOnsieHAiOjUwMCwibmF0dXJlIjoiY2FsbSIsInJldHJlYXQiOjIsIm1vdmVzIjpbeyJpZCI6ImFjaWQiLCJpc1NlbGVjdGVkIjp0cnVlfSx7ImlkIjoiYWJzb3JiIiwiaXNTZWxlY3RlZCI6dHJ1ZX1dLCJ0b2tlbl91c2VkIjp7fX19`
}
