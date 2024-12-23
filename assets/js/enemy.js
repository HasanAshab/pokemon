import { Pokemon,Move } from "./utils/models.js";
import { getParam } from "./utils/helpers.js"
import { loadPokemonsDatalist, loadNaturesDataList, loadMovesDatalist } from "./utils/dom.js";



window.onload = () => {
    loadPokemonsDatalist("enemy-data-list")
    loadNaturesDataList("natures-data-list")
    loadMovesDatalist("moves-data-list")
}

function makePokemon() {
  const pokemonForms = document.querySelectorAll(".pokemon-form")
  const enemyPokemonList = []
  pokemonForms.forEach((form,index)=>{
    const enemy = form.querySelector(".enemy");
    if (enemy.value) {
    const levelInp = form.querySelector(".level-inp");
    const retreatInp = form.querySelector(".retreat-inp");
    const natureInp = form.querySelector(".nature-inp");
    const tokenInp = form.querySelector(".token-inp");
     const enemyStats = form.querySelector(".enemy-stats");

    const level = parseInt(levelInp.value);
    const retreat = parseInt(retreatInp.value);
    const nature = natureInp.value;
    const tokens = tokenInp.value ? JSON.parse(tokenInp.value) : {};
    const moves = [
        form.querySelector(".move-input-1").value,
        form.querySelector(".move-input-2").value,
        form.querySelector(".move-input-3").value,
        form.querySelector(".move-input-4").value,
        form.querySelector(".move-input-5").value,
    ].filter(Boolean).map(id => ({
        id,
        isSelected: true
    }))
    
    const enemyPokemon = new Pokemon(enemy.value, {
        xp: level * 100,
        nature,
        retreat,
        moves,
        token_used: tokens
    });
    enemyPokemonList.push(enemyPokemon)
    }
  })
 return enemyPokemonList
}
globalThis.showStats = async function(formId) {
    const enemyStats = document.querySelectorAll(".pokemon-form")[formId].querySelector(".enemy-stats")
    const enemyPokemon = makePokemon()[formId]
    enemyStats.innerHTML = JSON.stringify(enemyPokemon.stats,  null, 2);
}

globalThis.showMoveDetails = function({currentTarget}){
  const form = currentTarget.parentElement
  const move = new Move(currentTarget.value)
  if (move){
    const moveDetails = form.querySelector(".move-details")
    moveDetails.querySelector(".move-name").textContent = move.name
    moveDetails.querySelector(".desc").textContent = move.description()
 }
}

globalThis.startBattle = function() {
  const enemiesBase64List = makePokemon().map((poke)=> poke.toBase64())
  window.location = `battle.html?you=${getParam("name")}&enemy=${enemiesBase64List.join(",")}`;
}

globalThis.randomBattle = function() {
    window.location = `battle.html?you=${getParam("name")}&enemy=eyJpZCI6ImJ1bGJhc2F1ciIsIm1ldGEiOnsieHAiOjUwMCwibmF0dXJlIjoiY2FsbSIsInJldHJlYXQiOjIsIm1vdmVzIjpbeyJpZCI6ImFjaWQiLCJpc1NlbGVjdGVkIjp0cnVlfSx7ImlkIjoiYWJzb3JiIiwiaXNTZWxlY3RlZCI6dHJ1ZX1dLCJ0b2tlbl91c2VkIjp7fX19`
}
