import { Pokemon, Move } from "./utils/models.js";
import { capitalizeFirstLetter, getMoveLearnset, flagsToObj } from "./utils/helpers.js"
import { loadPokemonsDatalist, loadNaturesDataList, loadMovesDatalist, startBattle } from "./utils/dom.js";
//import learnset from "../../data/learnsets/charmander.js"




//console.log(learnset)
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
    const tokens = flagsToObj(tokenInp.value);
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
        id: form.querySelector(".enemy").value,
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
  const enemiesMeta = []
  pokemonForms.forEach((form, index) => {
      if (!form.querySelector(".enemy").value) return
      enemiesMeta.push(makeEnemyMeta(form, index))
  })
return enemiesMeta
}

function getActiveBattleFields(){
    const battleFields = []
    const activeFields = document.querySelectorAll(".fields-cont > .field.active")
    for (const field of activeFields){
       battleFields.push(capitalizeFirstLetter(field.classList[1]))
    }
    return battleFields
}

globalThis.fieldClickHandler = function({currentTarget}){
    currentTarget.classList.toggle("active")
}
globalThis.selectRandomFields = function(){
 const fields = document.querySelectorAll(".fields-cont > .field")
 const startIndex = Math.floor(Math.random() * fields.length)
 const totalFeildsToSelect = Math.floor(Math.random() * 6) + 1
 let fieldsSelected = 0
 while (fieldsSelected !== totalFeildsToSelect){
  for (let i = startIndex; i < fields.length; i++){
      const isSelected = (Math.floor(Math.random() * 11) + 1) <= 3 ? true : false
      if (isSelected){
          fields[i].classList.add("active")
          fieldsSelected++
      }
      if (fieldsSelected === totalFeildsToSelect)
         break;
  }
 }
}
globalThis.copyFields = function(){
    const fields = `[${getActiveBattleFields().map(f => `"${f}"`).join(', ')}]`
 navigator.clipboard.writeText(fields)
    alert(fields)
}

globalThis.showStats = function(formId) {
    const enemyStats = document.querySelectorAll(".pokemon-form")[formId].querySelector(".enemy-stats")
    const metas = makeEnemiesMeta()
    formId = Object.keys(metas)[formId]
    const enemyPokemon = new Pokemon(formId, metas[formId])
    enemyStats.innerHTML = JSON.stringify(enemyPokemon.stats,  null, 2);
}

globalThis.setDefaultMoves = async ({currentTarget})=>{
   const form = currentTarget.parentElement
   const pokemonName = form.querySelector(".enemy").value
   const level = form.querySelector(".level-inp").value
 
  if (pokemonName) {
   const moveInputs = form.querySelectorAll(".move-input")
   const moveLearnset =  await getMoveLearnset(pokemonName,level)
   let i = 0;
   for (const moveInput of moveInputs) {
     if (moveInput.value === ""){
     moveInput.value = moveLearnset[i++].name
     }
   }
  }
}

globalThis.copyStartBattleCode = function() {
    const fields = getActiveBattleFields().map(f => `"${f}"`).join(', ')
    const code = `startBattle(${JSON.stringify(makeEnemiesMeta(), null, 2)}, [${fields}])`;
    navigator.clipboard.writeText(code)
    alert(code)
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
  startBattle(makeEnemiesMeta(), getActiveBattleFields())
}
