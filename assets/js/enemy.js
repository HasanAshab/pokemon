import { Pokemon, Move } from "./utils/models.js";
import { capitalizeFirstLetter, getMoveLearnset, flagsToObj } from "./utils/helpers.js"
import { loadPokemonsDatalist, loadNaturesDataList, loadMovesDatalist, getUserPokemonsMeta, startBattle, startUserBattle } from "./utils/dom.js";
import { BATTLE_SYSTEMS } from "./utils/battle.js"


window.onload = () => {
    loadCharectersList()
    loadPokemonsDatalist("enemy-data-list")
    loadNaturesDataList("natures-data-list")
    loadMovesDatalist("moves-data-list")
    loadBattleSystems()
    loadHistory()
}
globalThis.redirectToNewInterface = function (){
  window.location = "m_enemy.html"
}
function loadBattleSystems() {
    const selectElement = document.getElementById('sys-select');
    Object.keys(BATTLE_SYSTEMS).forEach(optionText => {
      const option = document.createElement('option');
      option.value = optionText.toLowerCase().replace(/\s+/g, '-');  // Converts spaces to hyphens for value
      option.textContent = optionText;
      selectElement.appendChild(option);
    });
}

async function loadCharectersList(){
   const res = await fetch("../../users/sessions/1/_names.json") 
   const data = await res.json()
   
   const charectersList = document.querySelector(".charecters-list")
   charectersList.innerHTML = ""
   for (const charecter of data){
    const btn = document.createElement("button")
    btn.className = "charecter"
    btn.onclick = ()=> charecterBtnsClickHandler(charecter)
    btn.textContent = charecter
    charectersList.appendChild(btn)
   }
}


async function charecterBtnsClickHandler(charecter){
  const system = document.getElementById('sys-select')?.value;
   let popList = []
  if (system === "multiple"){
     popList = await getPopList(charecter)
  }
   startUserBattle(charecter,popList,getActiveBattleFields(),system)
  }
 async function getPopList(charecter){
    const userPokemonsMeta = await getUserPokemonsMeta(charecter)
    const popListForm = document.querySelector(".pop-list-form")
    const confirmBtn = document.createElement('button')
    confirmBtn.classList ="confirm-btn" 
    confirmBtn.textContent ="Confirm"
    popListForm.parentElement.classList.add("active")
    popListForm.innerHTML = ""
    for (const {id} of userPokemonsMeta) {
       popListForm.innerHTML += `
        <label>
            <input type="checkbox" value="${id}">
            <strong class="name">${id}</strong>
        </label>
        `
    }
    popListForm.appendChild(confirmBtn)
   
    return new Promise((resolve,reject)=>{
     confirmBtn.onclick = function(){
         const popList = []
         
        const unCheckedInputs = popListForm.querySelectorAll("label > input:not(:checked)")
        unCheckedInputs.forEach((inp)=>{
           popList.push(inp.value) 
        })
       resolve(popList)
     }
          console.log(confirmBtn.onclick)

  })
  }
  
 function getMegaMoves(form){
     const megaMoveInputs = form.querySelectorAll(".mega-move-input")
     const moveInputs = form.querySelectorAll(".move-input")
     const moves = []
     for (let i = 0; i < megaMoveInputs.length;i++){
       let id = ""
       if (megaMoveInputs[i].value === ""){
         id = moveInputs[i].value
       }
        else id = megaMoveInputs[i].value
        moves.push({id,isSelected:true})
     }
     
     return moves
 }
function makeEnemyMeta(form, index) {
    const levelInp = form.querySelector(".level-inp");
    const retreatInp = form.querySelector(".retreat-inp");
    const natureInp = form.querySelector(".nature-inp");
    const megaSuffixSelect = form.querySelector(".mega-suffix-select");
    const tokenInp = form.querySelector(".token-inp");
     const enemyStats = form.querySelector(".enemy-stats");

    const level = parseInt(levelInp.value);
    const retreat = Number(retreatInp.value);

    const nature = natureInp.value;
    const mega = {
        moves: getMegaMoves(form),
        suffix: megaSuffixSelect.value
    }
    const tokens = flagsToObj(tokenInp.value);
    // pushing all the move inp values to moves
    const moves = []
    form.querySelectorAll(".move-input").forEach(inp=>{
     if (inp.value !== ""){
      moves.push({
         id: inp.value,
          isSelected: true
        })  
     }
    })

   
   
   
    
    return {
        id: form.querySelector(".enemy").value,
        xp: (level - 1) * 100,
        nature,
        retreat,
        moves,
        mega,
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
    const meta = metas[formId]
    const enemyPokemon = new Pokemon(meta.id, meta)
    enemyStats.innerHTML = JSON.stringify(enemyPokemon.stats,  null, 2);
}

function getDefaultOptions(form) {
    const level = form.querySelector(".level-inp").value
    return {
       level,
       limit: 5,
      //  power: {
//            min: 1,
//            max: 1000,
//        },
//        category: null,
//        priority: null,
//        types: null,
//        effects: null,
   }
}

globalThis.setDefaultMoves = async ({currentTarget})=>{
   const form = currentTarget.parentElement
   const pokemonName = form.querySelector(".enemy").value
  if (pokemonName) {
   const moveInputs = form.querySelectorAll(".move-input")
   const options = getDefaultOptions(form)//JSON.parse(form.querySelector(".query").value)
   const moveLearnset = await getMoveLearnset(pokemonName, options)
   console.log(moveLearnset)
   let i = 0;
   for (const moveInput of moveInputs) {
     if (moveInput.value === "" && moveLearnset[i]){
        moveInput.value = moveLearnset[i]
     }
     i++
   }
  }
}


export function makeStartBattleCode(meta, fields, system = "single") {
    fields = fields.map(f => `"${f}"`).join(', ')
    return `startBattle(${JSON.stringify(meta, null, 2)}, [${fields}], "${system}")`;
}


globalThis.copyStartBattleCode = function() {
    const code = makeStartBattleCode(
        makeEnemiesMeta(),
        getActiveBattleFields()
    )
    navigator.clipboard.writeText(code)
    alert(code)
}


globalThis.showMoveDetails = function({currentTarget}){
  const form = currentTarget.parentElement
  const move = new Move(currentTarget.value)
  if (move.exists()){
    const moveDetails = form.querySelector(".move-details")
    moveDetails.querySelector(".move-name").textContent = move.name
    moveDetails.querySelector(".desc").textContent = move.description() + '\n' + JSON.stringify({
        power: move.basePower,
        category: move.category,
        priority: move.priority
    }, null, 2)
 }
}

globalThis.startBattleBtnHandler = function() {
  const sysSelect = document.getElementById('sys-select');
  const code = makeStartBattleCode(
        makeEnemiesMeta(),
        getActiveBattleFields(),
        sysSelect.value
   )

  localStorage.setItem("last-battle", code)
  startBattle(makeEnemiesMeta(), getActiveBattleFields(), sysSelect.value)
}

globalThis.startLastBattle = function() {
    eval(localStorage.getItem("last-battle"))
}


function loadHistory() {
    const history = JSON.parse(localStorage.getItem("battle-history")) || {};  
    console.log(history);
    
    const historyList = document.querySelector(".history-list")
    historyList.innerHTML = Object.entries(history).map(([name, meta]) => {
        return `<button class="history-item" onclick="copyData('${name}')">${name}</button>`
    }).join('')
}
globalThis.copyData = function(name) {
    const meta = JSON.stringify(JSON.parse(localStorage.getItem("battle-history"))[name], null, 2)
    navigator.clipboard.writeText(meta)
    alert(meta)
}
globalThis.clearHistory = function() {
    const name = window.prompt("Which one? ($all for clear everything)")
    const history = JSON.parse(localStorage.getItem("battle-history")) || {};  
    console.log(name);
    
    if (name === "$all")
        localStorage.removeItem("battle-history")
    else {
        delete history[name]
        localStorage.setItem("battle-history", JSON.stringify(history));
    }
    loadHistory()
}

// functionm