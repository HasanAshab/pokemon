import { Pokemon, Move } from "./utils/models.js";
import { loadPokemonsDatalist, loadNaturesDataList, loadMovesDatalist, startBattle } from "./utils/dom.js";


window.onload = () => {
    loadPokemonsDatalist("enemy-data-list")
    loadNaturesDataList("natures-data-list")
    loadMovesDatalist("moves-data-list")
}


function makeEnemyMeta(form, index) {
    const levelInp = form.querySelector(".level-inp");
    const retreatInp = form.querySelector(".retreat-inp");
    const natureInp = form.querySelector(".nature-inp");
    const tokenInp = form.querySelector(".token-inp");
     const enemyStats = form.querySelector(".enemy-stats");

    const level = parseInt(levelInp.value);
    const retreat = Number(retreatInp.value);

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
    
    return {
        xp: level * 100,
        nature,
        retreat,
        moves,
        stats: {},
        token_used: tokens
    }
}

function makeEnemiesMeta() {
  const pokemonForms = document.querySelectorAll(".pokemon-form")
  const enemiesMeta = {}
  pokemonForms.forEach((form, index) => {
      const enemy = form.querySelector(".enemy");
      if (!enemy.value) return
      enemiesMeta[enemy.value] = makeEnemyMeta(form, index)
  })
 return enemiesMeta
}

globalThis.showStats = function(formId) {
    const enemyStats = document.querySelectorAll(".pokemon-form")[formId].querySelector(".enemy-stats")
    const metas = makeEnemiesMeta()
    formId = Object.keys(metas)[formId]
    const enemyPokemon = new Pokemon(formId, metas[formId])
    enemyStats.innerHTML = JSON.stringify(enemyPokemon.stats,  null, 2);
}

globalThis.showStartBattleCode = function() {
    const cont = document.getElementById("battle-code-cont")
    cont.innerHTML = "startBattle(" + JSON.stringify(makeEnemiesMeta(), null, 2) + ')';
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

globalThis.startBattleBtnHandler = function() {
  startBattle(makeEnemiesMeta())
}

