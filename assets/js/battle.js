import { EventEmitter } from "./utils/event.js"
import { Pokemon, Move } from "./utils/models.js"
import { BATTLE_SYSTEMS } from "./utils/battle.js"
import { Damage } from "./utils/damage.js"
import { fixFloat, getParam, getPokemonsMeta, setPokemonMeta, getDamageDangerLevel, flagsToObj, objToFlags, shuffle, weightedRandomV2 } from "./utils/helpers.js"
import { PopupMsgQueue } from "./utils/dom.js"
import { loadMovesDatalist } from "./utils/dom.js";
import pokemons from "../../data/pokemons.js"

globalThis.selectRandomFields = function(){
 const fields = document.querySelectorAll(".fields-cont > .field")
 const startIndex = Math.floor(Math.random() * fields.length)
 const totalFeildsToSelect = Math.floor(Math.random() * 6) + 1
 let fieldsSelected = 0

 // cleanup old active fields
 for (const field of fields){
    field.classList.remove("active")
 }
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

const eventEmitter = new EventEmitter()
const system = getParam("system") || "multiple"
let allAdjacentModeBy = null
let shadowCloneBy = null

globalThis.popupQueue = new PopupMsgQueue("popup-msg-cont");
globalThis.abilitiesPopupQueue = new PopupMsgQueue("abilities-msg-cont", 4, 3000);
globalThis.toggleMoveInfo = function (info) {
  info.classList.toggle("active")
}
globalThis.retreatBtnClickHandler = function (playerTag) {
  const selectedCard = document.querySelector(`.${playerTag}-controle-cont .card-container .card.selected`)
  const oldRetreat = pokemonMap[playerTag].state.retreat
  if (selectedCard) {
    const move = new Move(selectedCard.dataset.moveId)
    pokemonMap[playerTag].state.emit("used-move", move)
  }
  else {
    const newRetreat = Number(window.prompt("retreat", oldRetreat))
    pokemonMap[playerTag].state.retreat = newRetreat
  }
  loadPokemonData(playerTag)
}


globalThis.getEnemiesMetaBtnClickHandler = function () {
  const meta = teams.enemy.map((p) => ({
    id: p.id,
    ...p.meta
  }))
  const fieldsStr = fields.map(f => `"${f}"`).join(', ')
  const code = `startBattle(${JSON.stringify(meta, null, 2)}, [${fieldsStr}])`
  navigator.clipboard.writeText(code)
  alert(code)
}
globalThis.undoScene = function () {
  battle.undo()
  loadPokemonData("you")
  loadPokemonData("enemy")
}
globalThis.veryCloseBtnClickHandler = function ({ currentTarget }) {
  currentTarget.classList.toggle("active")
  battle.ctx.veryClose = !battle.ctx.veryClose
}
globalThis.doubleTeamDataClickHandler = (playerTag) => {
  const oldDoubleTeamsCount = pokemonMap[playerTag].state.manCount
  const newVal = parseInt(window.prompt(`Set the double team data of ${playerTag}`, oldDoubleTeamsCount))
  setDoubleTeamData(newVal, playerTag)
  pokemonMap[playerTag].state.manCount = newVal
}
globalThis.closePlayerSettingsForm = function ({ currentTarget }) {
  const playerSettingsForm = document.querySelector(".player-settings-form")
  playerSettingsForm.parentElement.classList.remove("active")

  // abilities cleanup
  const abilitiesWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.abilities .wrapper')
  abilitiesWrapper.innerHTML = ''

  // items cleanup
  const itemsWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.items .wrapper')
  itemsWrapper.innerHTML = ''
}
globalThis.progressbarClickHandler = ({ currentTarget }, playerTag) => {
  if (currentTarget.classList.contains("health")) {
    // health progress-bar clicked
    const pokemon = pokemonMap[playerTag]
    let newHp = prompt(`health of ${playerTag}`, pokemon.hp)
    newHp = pokemon.state.stats.set("hp", newHp)
    setCurrentHealth("health", newHp, playerTag)
  } else {
    // armor progress-bar clicked
    const oldHp = pokemonMap[playerTag].state.armor.hp()
    console.error(`modifying armor hp not implemented yet`)
    //let newArmourHp = prompt(`armor of ${playerTag}`, oldHp)
    //setCurrentHealth("armor-hp",newArmourHp, playerTag)

  }
}

function clickOnMove(playerTag,moveId) {
  // const pokemon = pokemonMap[playerTag]
  const moveCard = document.querySelector(`.${playerTag}-controle-cont  .card-container .card[data-move-id="${moveId}"]`)  
  if (moveCard) {
    moveCard.click();
    moveCard.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    console.warn(`Move card not found for ${playerTag} with moveId ${moveId}`);
  }
}

globalThis.switchPokemonClickHandler = function ({ currentTarget }, playerTag) {
  eventEmitter.emit("switch-pokemon-select", playerTag, currentTarget)
}

eventEmitter.on("switch-pokemon-select", (playerTag, currentTarget) => {
  if (!currentTarget.classList.contains("disabled")) {
    const parent = currentTarget.parentElement
    parent.querySelector(".pokemon.active")?.classList.remove("active")
    currentTarget.classList.add("active")
    switchPokemon(playerTag, currentTarget.dataset.index)
  }
})

globalThis.showStatEditForm = function (playerTag) {
  const pokemon = pokemonMap[playerTag]
  const oldStatChanges = objToFlags(pokemon.state.stats._statChanges)
  const newStatChanges = flagsToObj(
    window.prompt(`edit stat changes of "${playerTag}"`, oldStatChanges)
  )
  pokemon.state.stats._statChanges = newStatChanges

  setStatChanges(pokemon.state.stats._statChanges, playerTag)
}



globalThis.showEffectsEditForm = function (playerTag) {
  const pokemon = pokemonMap[playerTag]
  const oldEffects = pokemon.state.effects.names().join(', ')
  const newEffects = window
    .prompt(`edit stat changes of "${playerTag}"`, oldEffects)
    .split(', ')
    .map(e => e.trim())
  pokemon.state.effects.sync(...newEffects)
  setEffects(pokemon.state.effects.all(), playerTag)
}
globalThis.toggleMirror = function (playerTag, { currentTarget }) {
  currentTarget.classList.toggle("active")
  let opponentTeam = teams[opponentTag(playerTag)]

  if (currentTarget.classList.contains("active")) {
    toggleMirrorChoosePokemons(playerTag)
    teams[playerTag].forEach(p => {
      p.meta.mirror = true
      opponentTeam.push(p)
    })
    clickOnFirstPokemonSwitch(opponentTag(playerTag),true)
  }

  else {
    toggleMirrorChoosePokemons(playerTag)
    teams[opponentTag(playerTag)] = opponentTeam.filter(p => !p.meta.mirror)
    
    teams[playerTag].forEach(p => {
      p.meta.mirror = false
    })
        clickOnFirstPokemonSwitch(opponentTag(playerTag))

  }

}
globalThis.showPlayerSettingsForm = function (playerTag) {
  const playerSettingsForm = document.querySelector(".player-settings-form")
  playerSettingsForm.parentElement.classList.add("active")
  playerSettingsForm.querySelector(".header .primary .name").textContent = pokemonMap[playerTag].name
  playerSettingsForm.querySelector(".header .primary .pokemon-pic").src = pokemonMap[playerTag].picture
  
  setupBotModeBtn(playerTag)
  loadCurrentHealthPercentage(playerTag)
  loadAbilities(playerTag)
  loadItems(playerTag)
  loadEasyStats(playerTag)
  loadTokenStats(playerTag)
  // global
  loadActiveFeilds()
}

 function setupBotModeBtn(playerTag){
  const botModeBtn =  document.querySelector(".player-settings-form .bot-mode-btn:not(.team)") 
  const botModeTeamBtn =  document.querySelector(".player-settings-form .bot-mode-btn.team") 

  botModeBtn.onclick = ()=>{
    botModeBtn.classList.toggle("active")
    const pokemon = pokemonMap[playerTag]
    if (botModeBtn.classList.contains("active")){
      pokemon.meta.isBot = true
    }else {
      pokemon.meta.isBot = false
    }
   loadChoosePokemon(playerTag)
  }
  botModeTeamBtn.onclick = ()=>{
        botModeTeamBtn.classList.toggle("active")
    const team = teams[playerTag]
   for (const pokemon of team){
    if (botModeTeamBtn.classList.contains("active")){
      pokemon.meta.isBot = true
    }else {
      pokemon.meta.isBot = false
    }
   }
   loadChoosePokemon(playerTag)
  }
 }
function loadCurrentHealthPercentage(playerTag) {
  const healthElm = document.querySelector(".player-settings-form .settings-wrapper .extra-data .health-percent > .value") 
  healthElm.textContent = `${Math.floor((pokemonMap[playerTag].hp/pokemonMap[playerTag].maxhp)*100)} % `;
  
}
function loadActiveFeilds() {
  const fieldElmList = document.querySelectorAll(".player-settings-form .fields-cont .field")
  const activeFieldsTypeList = []
  for (const { type } of battle.fields) {
    activeFieldsTypeList.push(type)
  }
  for (const fieldElm of fieldElmList) {
    const currentFieldType = fieldElm.classList[1]
    if (activeFieldsTypeList.includes(currentFieldType))
      fieldElm.classList.add("active")
    else
      fieldElm.classList.remove("active")
  }
}
globalThis.fieldClickHandler = function ({ currentTarget }) {
  const fieldType = currentTarget.classList[1]
  if (currentTarget.classList.contains("active"))
    battle.removeField(fieldType)
  else
    battle.addField(fieldType)
  loadActiveFeilds()
}
globalThis.showFieldsImpacts = function ({ currentTarget }) {
  currentTarget.classList.toggle("active")
  const fields = battle.fields
  const fieldsImpactDiv = currentTarget.parentElement.querySelector(".fields-impact")
    const impactsWrapper = fieldsImpactDiv.querySelector(".impacts-wrapper")
   impactsWrapper.innerHTML = ""
  for (const field of fields) {
   const impactsData = field.impacts()
   const impactHeader = document.createElement("h3")
   impactHeader.textContent = field.type
   impactsWrapper.appendChild(impactHeader)
   for (const impactData of impactsData){
   const impact = document.createElement("ul")
   impact.className = "impact"
   const placeHolder = document.createElement("li")
   placeHolder.className = "placeholder"
   placeHolder.classList.add(impactData.type)
   placeHolder.textContent += `${impactData.placeholder} for  `
   for (const targetType of impactData.targets){
    placeHolder.innerHTML += `<strong style="color: var(--${targetType}-type-color);">${targetType}</strong>, `
   }
   impact.appendChild(placeHolder)
   impactsWrapper.appendChild(impact)
   }
  }
}
globalThis.showActiveFieldsBtnClickHandler = function ({ currentTarget }) {
   console.log(battle.fields[0].impacts())
  currentTarget.classList.toggle("active")
  const onlyActiveFieldsWrapper = currentTarget.parentElement.querySelector(".only-active-fields-wrapper")
  onlyActiveFieldsWrapper.innerHTML = ""
  // loading all active fields
  for (const field of battle.fields) {
    const fieldElm = document.createElement("strong")
    fieldElm.className = "field active"
    fieldElm.classList.add(field.type)
    fieldElm.textContent = `${field.type} (${field.lifetime?.turns || "*"})`
    onlyActiveFieldsWrapper.appendChild(fieldElm)
    fieldElm.style.backgroundColor = `var(--${field.type}-type-color)`

  }
  //battle
}
function loadEasyStats(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const stats = pokemon.state.stats._statChanges
  const statsWrapper = document.querySelector(".player-settings-form .settings.stats")
  statsWrapper.innerHTML = ""
  for (const stat in stats) {
    const statElm = document.createElement("div")
    statElm.className = "stat"
    statElm.setAttribute("data-stat-name", stat)
    statElm.innerHTML = `
                 <p data-value="${stats[stat]}" class="stat-name">${stat.toUpperCase()}:</p>
             <div class="button-wrapper">
           <svg class="increase-btn" onclick="increaseStat('${playerTag}','${stat}')"   width="25px" height="25px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z" fill="#009c1a"></path> </g></svg>
            <svg class="decrease-btn" onclick="decreaseStat('${playerTag}','${stat}')"  width="25px" height="25px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z" fill="#ff1212"></path> </g></svg>
             </div>
  `
    statsWrapper.appendChild(statElm)
  }
}

globalThis.increaseStat = function (playerTag, statName) {
  const pokemon = pokemonMap[playerTag]
  pokemon.state.stats._statChanges[statName] = pokemon.state.stats._statChanges[statName] + 0.5
  setStatChanges(pokemon.state.stats._statChanges, playerTag)
  loadEasyStats(playerTag)

}
globalThis.decreaseStat = function (playerTag, statName) {
  const pokemon = pokemonMap[playerTag]
  pokemon.state.stats._statChanges[statName] = pokemon.state.stats._statChanges[statName] - 0.5
  setStatChanges(pokemon.state.stats._statChanges, playerTag)
  loadEasyStats(playerTag)

}
function updateAllAdjFlag(isActive, capacity, playerTag) {
  const allAdjElm = document.getElementById("all-adj-data")
  if (isActive) {
    allAdjElm.classList.add("active")
    allAdjElm.textContent = `Adjasten ( ${capacity} )`
    allAdjacentModeBy = playerTag
  }
  else {
    allAdjElm.classList.remove("active")
    allAdjElm.textContent = "Adjasten"
    allAdjacentModeBy = null
  }
}

function loadVeryCloseBtn() {
  const btn = document.getElementById("very-close-btn")
  battle.ctx.veryClose
    ? btn.classList.add("active")
    : btn.classList.remove("active")
}

function loadWeatherIndicator() {
  
  const indicator = document.getElementById("weather-indicator")
  const weather = battle.weathers
  const weatherData = {
    "sunnyday": `<svg height="25px" width="25px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 186.146 186.146" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path style="fill:#FDD633;" d="M92.846,7.102c0-0.005,0-0.01,0-0.015C92.846,7.092,92.846,7.097,92.846,7.102z"></path> <path style="fill:#FDD633;" d="M90.036,6.163c0.141-0.328,0.302-0.654,0.481-0.979C90.339,5.508,90.177,5.835,90.036,6.163z"></path> <path style="fill:#FDD633;" d="M93.072,5.293C93.708,2.477,95.436,0,95.436,0c-0.891,0.61-1.676,1.248-2.363,1.905v3.38 C93.072,5.288,93.072,5.291,93.072,5.293z"></path> <path style="fill:#FDD633;" d="M92.176,2.845c0.279-0.316,0.574-0.631,0.896-0.94C92.75,2.214,92.456,2.528,92.176,2.845z"></path> <path style="fill:#FDD633;" d="M90.629,4.987C90.807,4.675,91,4.365,91.215,4.058C91,4.365,90.807,4.675,90.629,4.987z"></path> <path style="fill:#FDD633;" d="M91.545,16.619c0.452,0.574,0.961,1.113,1.522,1.61C92.506,17.732,91.996,17.193,91.545,16.619z"></path> <path style="fill:#FDD633;" d="M91.254,4c0.228-0.321,0.481-0.639,0.749-0.955C91.734,3.36,91.481,3.678,91.254,4z"></path> <path style="fill:#FDD633;" d="M92.915,6.17c-0.002,0.014-0.003,0.028-0.005,0.042C92.912,6.198,92.913,6.184,92.915,6.17z"></path> <path style="fill:#FDD633;" d="M90.71,186.146c0,0,0.011-0.016,0.027-0.039C90.728,186.12,90.71,186.146,90.71,186.146z"></path> <path style="fill:#FDD633;" d="M91.845,166.953c0.429,0.297,0.836,0.615,1.219,0.953C92.681,167.568,92.274,167.249,91.845,166.953 z"></path> <path style="fill:#FDD633;" d="M91.83,185.314c-0.355,0.281-0.724,0.561-1.121,0.832C91.106,185.874,91.475,185.595,91.83,185.314z "></path> <path style="fill:#FDD633;" d="M93.068,177.257c0.343,1.157,0.277,2.41,0.005,3.607v3.376c-0.304,0.291-0.635,0.576-0.978,0.859 c6.803-5.597,5.777-12.947,0.978-17.186v9.357C93.072,177.266,93.07,177.262,93.068,177.257z"></path> <path style="fill:#FDD633;" d="M90.456,166.113c0.479,0.251,0.936,0.527,1.37,0.827C91.39,166.64,90.934,166.363,90.456,166.113z"></path> <path style="fill:#FDD633;" d="M90.686,148.177c-0.182,0.212-0.361,0.424-0.553,0.632 C90.326,148.601,90.503,148.389,90.686,148.177z"></path> <path style="fill:#FDD633;" d="M89.37,8.36c0.061-0.331,0.14-0.663,0.236-0.995C89.51,7.698,89.431,8.029,89.37,8.36z"></path> <path style="fill:#FDD633;" d="M91.51,16.573c-0.439-0.563-0.821-1.159-1.142-1.781C90.689,15.414,91.071,16.01,91.51,16.573z"></path> <path style="fill:#FDD633;" d="M89.549,12.681c-0.173-0.646-0.281-1.308-0.321-1.981C89.268,11.373,89.376,12.035,89.549,12.681z"></path> <path style="fill:#FDD633;" d="M90.785,186.035L90.785,186.035L90.785,186.035z"></path> <path style="fill:#FDD633;" d="M90.325,14.707c-0.309-0.612-0.558-1.248-0.742-1.902C89.767,13.46,90.016,14.095,90.325,14.707z"></path> <path style="fill:#FDD633;" d="M92.706,176.374c-0.065-0.125-0.133-0.249-0.21-0.37C92.574,176.126,92.64,176.249,92.706,176.374z"></path> <path style="fill:#FDD633;" d="M92.31,175.735c-0.165-0.222-0.345-0.438-0.562-0.642C91.965,175.296,92.143,175.514,92.31,175.735z "></path> <path style="fill:#FDD633;" d="M89.234,9.445c0.021-0.309,0.059-0.619,0.111-0.93C89.294,8.827,89.256,9.137,89.234,9.445z"></path> <path style="fill:#FDD633;" d="M93.072,144.97c-0.225,0.357-0.469,0.711-0.715,1.064C92.605,145.68,92.847,145.327,93.072,144.97z"></path> <path style="fill:#FDD633;" d="M92.001,146.535c-0.211,0.289-0.432,0.575-0.659,0.86C91.571,147.11,91.789,146.824,92.001,146.535z "></path> <path style="fill:#FDD633;" d="M89.658,7.2c0.094-0.304,0.203-0.608,0.328-0.911C89.861,6.592,89.753,6.896,89.658,7.2z"></path> <path style="fill:#FDD633;" d="M164.548,108.336c-4.741,6.145-9.624,8.825-15.949-1.058c-1.613-2.521-3.551-4.549-5.539-6.175 c0.399-2.514,0.615-5.088,0.632-7.709c4.806,2.293,8.556,5.933,15.997,4.619c9.526-1.678,11.352-13.223,14.388-17.876 c3.039-4.651,11.065-0.897,11.065-0.897c-8.127-8.296-17.202-4.074-19.685,3.729c-2.354,7.397-6.026,11.586-15.349,4.462 c-2.38-1.819-4.896-3.063-7.322-3.91c-0.488-2.559-1.167-5.051-2.025-7.458c5.295,0.514,10.063,2.647,16.6-1.13 c8.379-4.835,6.146-16.309,7.406-21.72c1.265-5.41,10.091-4.629,10.091-4.629c-10.474-5.016-17.558,2.057-17.222,10.238 c0.318,7.756-1.7,12.947-12.897,9.441c-2.857-0.895-5.645-1.203-8.214-1.17c-1.331-2.22-2.822-4.33-4.466-6.313 c5.154-1.331,10.366-0.954,15.22-6.742c6.22-7.409,0.197-17.427-0.469-22.943c-0.661-5.515,7.899-7.8,7.899-7.8 c-11.558-1.132-15.796,7.938-12.682,15.511c2.952,7.179,2.831,12.748-8.891,13.282c-2.994,0.137-5.719,0.804-8.124,1.716 c-1.996-1.626-4.122-3.098-6.354-4.408c4.39-3.014,9.417-4.441,12-11.542c3.311-9.089-5.775-16.443-8.287-21.399 c-2.509-4.957,4.754-10.032,4.754-10.032c-11.247,2.889-12.128,12.861-6.611,18.913c5.229,5.737,7.021,11.012-3.813,15.523 c-2.764,1.151-5.099,2.708-7.046,4.385c-2.415-0.837-4.914-1.494-7.481-1.961c3.095-4.335,7.332-7.396,7.332-14.955 c0-9.671-11.053-13.472-15.107-17.272c-0.688-0.644-1.096-1.393-1.327-2.184l0,0v9.363c0.78,0.689,1.656,1.298,2.617,1.802 c6.876,3.602,10.364,7.945,1.728,15.89c-2.208,2.032-3.871,4.296-5.128,6.544c0.241-0.432,0.511-0.863,0.783-1.292v10.437l0,0 c22.898,0,41.462,18.563,41.462,41.459c0,22.9-18.563,41.463-41.462,41.463l0,0v10.433c0.271-0.429,0.541-0.858,0.781-1.288 c2.618-0.039,5.186-0.276,7.693-0.699c-1.424,5.128-4.355,9.456-1.77,16.553c3.307,9.09,14.993,8.881,20.104,11.064 c5.108,2.186,2.805,10.743,2.805,10.743c6.76-9.445,1.026-17.649-7.092-18.74c-7.692-1.031-12.455-3.921-7.058-14.341 c1.376-2.657,2.164-5.346,2.577-7.882c2.426-0.925,4.762-2.034,6.992-3.307c0.416,5.308-0.86,10.376,3.997,16.16 c6.217,7.413,17.127,3.22,22.676,3.523c5.549,0.307,6.311,9.135,6.311,9.135c3.121-11.187-5.072-16.936-13.072-15.183 c-7.582,1.66-13.045,0.574-11.538-11.064c0.386-2.975,0.201-5.774-0.28-8.303c1.951-1.691,3.771-3.524,5.444-5.491 c2.209,4.848,2.739,10.05,9.285,13.827c8.377,4.839,17.196-2.834,22.513-4.446c5.319-1.61,9.055,6.426,9.055,6.426 c-0.893-11.579-10.56-14.179-17.477-9.798c-6.557,4.153-12.061,5.002-14.626-6.447c-0.654-2.923-1.78-5.487-3.096-7.697 c1.252-2.239,2.342-4.582,3.245-7.016c3.726,3.796,6.008,8.492,13.44,9.8c9.525,1.683,15.189-8.543,19.634-11.877 c4.448-3.331,10.706,2.94,10.706,2.94C179.521,100.988,169.55,101.852,164.548,108.336z"></path> <path style="fill:#FDD633;" d="M89.219,10.548c-0.015-0.331-0.014-0.665,0.006-0.999C89.205,9.884,89.205,10.217,89.219,10.548z"></path> <path style="fill:#F4CA19;" d="M93.073,8.871c-0.167-0.573-0.234-1.169-0.227-1.769c0-0.005,0-0.01,0-0.015 c0.004-0.292,0.027-0.584,0.064-0.875c0.002-0.014,0.003-0.028,0.005-0.042c0.038-0.294,0.091-0.587,0.157-0.876 c0-0.003,0.001-0.006,0.001-0.009v-3.38l0,0c0,0,0,0-0.001,0c-0.323,0.309-0.617,0.623-0.896,0.94 c-0.059,0.066-0.117,0.133-0.174,0.2C91.734,3.36,91.481,3.678,91.254,4c-0.014,0.02-0.025,0.039-0.039,0.058 C91,4.365,90.807,4.675,90.629,4.987c-0.037,0.065-0.076,0.131-0.112,0.196c-0.178,0.325-0.34,0.652-0.481,0.979 c-0.018,0.042-0.033,0.084-0.05,0.127c-0.125,0.303-0.233,0.607-0.328,0.911c-0.017,0.055-0.036,0.11-0.052,0.165 C89.51,7.698,89.431,8.029,89.37,8.36c-0.009,0.052-0.016,0.103-0.025,0.155c-0.052,0.311-0.09,0.621-0.111,0.93 c-0.003,0.035-0.007,0.069-0.009,0.104c-0.02,0.335-0.021,0.668-0.006,0.999c0.002,0.051,0.006,0.101,0.009,0.152 c0.04,0.672,0.148,1.335,0.321,1.981c0.011,0.042,0.023,0.083,0.034,0.124c0.184,0.654,0.433,1.29,0.742,1.902 c0.014,0.028,0.028,0.057,0.043,0.085c0.321,0.622,0.703,1.218,1.142,1.781c0.012,0.015,0.023,0.03,0.035,0.045 c0.452,0.574,0.961,1.113,1.522,1.61c0.002,0.002,0.004,0.004,0.006,0.006v0V8.871L93.073,8.871z"></path> <path style="fill:#F4CA19;" d="M93.072,134.537c-22.898,0-41.461-18.563-41.461-41.463c0-22.896,18.562-41.459,41.461-41.459h0.001 V41.178c-0.272,0.43-0.542,0.861-0.783,1.292c-2.618,0.04-5.186,0.277-7.692,0.699c1.423-5.131,4.358-9.457,1.775-16.559 c-3.308-9.088-14.995-8.88-20.105-11.064c-5.11-2.184-2.806-10.742-2.806-10.742c-6.761,9.445-1.026,17.651,7.091,18.741 c7.694,1.033,12.457,3.921,7.058,14.341c-1.377,2.657-2.164,5.349-2.578,7.884c-2.426,0.926-4.761,2.036-6.991,3.307 C67.623,43.77,68.902,38.7,64.045,32.91c-6.218-7.409-17.128-3.215-22.677-3.52c-5.549-0.304-6.311-9.133-6.311-9.133 c-3.122,11.187,5.073,16.937,13.073,15.185c7.583-1.662,13.046-0.577,11.538,11.062c-0.386,2.975-0.202,5.777,0.279,8.307 c-1.95,1.689-3.77,3.522-5.442,5.488c-2.209-4.848-2.74-10.051-9.286-13.831c-8.378-4.836-17.195,2.837-22.514,4.448 c-5.318,1.611-9.054-6.424-9.054-6.424c0.893,11.579,10.559,14.18,17.478,9.797c6.557-4.154,12.062-5.004,14.625,6.449 c0.653,2.921,1.782,5.487,3.096,7.697c-1.251,2.239-2.341,4.581-3.245,7.016c-3.725-3.798-6.006-8.494-13.441-9.805 c-9.526-1.68-15.188,8.546-19.634,11.881c-4.447,3.332-10.705-2.941-10.705-2.941c4.799,10.576,14.772,9.712,19.775,3.229 c4.741-6.146,9.623-8.828,15.949,1.059c1.612,2.521,3.549,4.548,5.539,6.174c-0.4,2.513-0.616,5.086-0.632,7.709 c-4.807-2.295-8.557-5.936-15.999-4.623c-9.526,1.679-11.349,13.225-14.387,17.878c-3.039,4.653-11.065,0.899-11.065,0.899 c8.126,8.295,17.204,4.073,19.687-3.73c2.352-7.396,6.024-11.586,15.349-4.461c2.379,1.818,4.894,3.063,7.32,3.91 c0.489,2.558,1.167,5.049,2.025,7.457c-5.294-0.515-10.062-2.647-16.6,1.128c-8.378,4.836-6.142,16.31-7.405,21.722 c-1.265,5.411-10.091,4.629-10.091,4.629c10.475,5.017,17.56-2.056,17.224-10.237c-0.32-7.757,1.698-12.948,12.898-9.442 c2.855,0.895,5.641,1.202,8.209,1.171c1.33,2.218,2.822,4.33,4.465,6.313c-5.153,1.328-10.364,0.954-15.219,6.74 c-6.219,7.409-0.194,17.426,0.471,22.942c0.662,5.518-7.9,7.8-7.9,7.8c11.558,1.133,15.798-7.936,12.684-15.509 c-2.953-7.18-2.832-12.749,8.891-13.284c2.991-0.137,5.715-0.802,8.119-1.713c1.996,1.626,4.121,3.098,6.353,4.408 c-4.388,3.013-9.415,4.442-11.997,11.542c-3.31,9.088,5.777,16.439,8.289,21.398c2.509,4.957-4.756,10.032-4.756,10.032 c11.249-2.89,12.131-12.86,6.614-18.913c-5.23-5.735-7.022-11.011,3.811-15.523c2.762-1.15,5.095-2.705,7.042-4.381 c2.415,0.838,4.914,1.495,7.48,1.962c-3.093,4.333-7.329,7.396-7.326,14.949c-0.002,9.673,11.051,13.475,15.107,17.275 c0.217,0.203,0.397,0.42,0.562,0.642c0.065,0.089,0.128,0.179,0.186,0.27c0.077,0.121,0.146,0.245,0.21,0.37 c0.147,0.287,0.272,0.58,0.362,0.883c0.001,0.005,0.003,0.009,0.005,0.014v-9.357v-0.001c-0.003-0.003-0.006-0.005-0.009-0.007 c-0.384-0.338-0.79-0.656-1.219-0.953c-0.006-0.004-0.013-0.009-0.019-0.013c-0.435-0.3-0.892-0.576-1.37-0.827 c-6.876-3.604-10.363-7.946-1.728-15.893c0.499-0.459,0.962-0.932,1.405-1.411c0.192-0.208,0.371-0.42,0.553-0.632 c0.224-0.259,0.446-0.518,0.656-0.782c0.227-0.285,0.448-0.571,0.659-0.86c0.122-0.166,0.24-0.333,0.356-0.5 c0.246-0.354,0.49-0.708,0.715-1.064l0.001-0.001l0,0L93.072,134.537L93.072,134.537z"></path> <path style="fill:#F4CA19;" d="M93.073,180.865L93.073,180.865c-0.559,2.459-1.948,4.656-2.288,5.169l0,0.001 c-0.021,0.031-0.036,0.054-0.048,0.072c-0.016,0.023-0.027,0.039-0.027,0.039c0.397-0.271,0.765-0.551,1.121-0.832 c0.089-0.071,0.178-0.143,0.265-0.214c0.343-0.283,0.674-0.568,0.978-0.859V180.865z"></path> <path style="fill:#F2AB0C;" d="M134.535,93.074c0-22.896-18.563-41.459-41.462-41.459v82.922 C115.971,134.537,134.535,115.974,134.535,93.074z"></path> <path style="fill:#F4940B;" d="M51.612,93.074c0,22.9,18.562,41.463,41.461,41.463h0.001l0,0V51.615l0,0h-0.001 C70.174,51.615,51.612,70.177,51.612,93.074z"></path> </g> </g></svg>`,
    "RainDance": `<svg height="25px" width="25px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path style="fill:#E0E0E2;" d="M380.121,93.03h-2.586C357.432,42.207,310.557,6.568,256,0.832C250.888,0.293,245.715,0,240.485,0 C161.468,0,96.776,62.498,93.243,140.659C40.603,148.14,0,193.508,0,248.182c0,59.885,48.719,108.606,108.606,108.606H256h124.121 c72.718,0,131.879-59.161,131.879-131.879S452.839,93.03,380.121,93.03z"></path> <path style="fill:#9BC9FF;" d="M488.727,403.394c-12.853,0-23.273,10.42-23.273,23.273v31.03c0,12.853,10.42,23.273,23.273,23.273 S512,470.55,512,457.697v-31.03C512,413.814,501.58,403.394,488.727,403.394z"></path> <path style="fill:#57A4FF;" d="M23.273,480.97c12.853,0,23.273-10.42,23.273-23.273v-31.03c0-12.853-10.42-23.273-23.273-23.273 S0,413.814,0,426.667v31.03C0,470.55,10.42,480.97,23.273,480.97z"></path> <path style="fill:#9BC9FF;" d="M395.636,488.727v-31.03c0-12.853-10.42-23.273-23.273-23.273s-23.273,10.42-23.273,23.273v31.03 c0,12.853,10.42,23.273,23.273,23.273S395.636,501.58,395.636,488.727z"></path> <path style="fill:#57A4FF;" d="M162.909,488.727v-31.03c0-12.853-10.42-23.273-23.273-23.273c-12.853,0-23.273,10.42-23.273,23.273 v31.03c0,12.853,10.42,23.273,23.273,23.273C152.489,512,162.909,501.58,162.909,488.727z"></path> <path style="fill:#9BC9FF;" d="M279.273,457.697v-31.03c0-12.853-10.42-23.273-23.273-23.273c-12.853,0-23.273,10.42-23.273,23.273 v31.03c0,12.853,10.42,23.273,23.273,23.273C268.853,480.97,279.273,470.55,279.273,457.697z"></path> <path style="fill:#C6C5CA;" d="M240.485,0C161.468,0,96.776,62.498,93.243,140.659C40.603,148.14,0,193.508,0,248.182 c0,59.885,48.719,108.606,108.606,108.606H256V0.832C250.888,0.295,245.715,0,240.485,0z"></path> <path style="fill:#57A4FF;" d="M232.727,426.667v31.03c0,12.853,10.42,23.273,23.273,23.273v-77.576 C243.147,403.394,232.727,413.814,232.727,426.667z"></path> </g></svg>`,
    "Sandstorm": "Sandstorm",
    "hail": "Hail",
    "snow": "Snow"
  } 
  indicator.dataset.lifetime = weather?._weather?.lifetime?.turns || 0 
  indicator.innerHTML =  weatherData[weather.name()] || ""
}


function syncStatsMeta(pokemon) {
  pokemon.meta.stats.hp = pokemon.state.stats.get("hp")
  setPokemonMeta(pokemon.id, pokemon.meta)
}

function setBattleListeners() {
  battle.on(["wave", "turn"], function () {
    if (system === "single" && this._event === "turn") return
    popupQueue.add(`New ${this._event}!`, "you")
  })

  battle.on(["wave", "scene", "scene-end"], function () {
    loadWeatherIndicator()
  })

  const dodgeDataCollector = (data) => {
    let i = 1
    return (move) => {
      if (move.id === "dodge" && move._dodgeMatrix.every(Boolean)) {
        data[i / 2] = true
      }
      i++
    }
  }
  let dodgeData = {}
  let enemyDodgeData = {}

  battle.on("$counterclonestart", (sc1, sc2) => {
    if (!sc1 || !sc2) return
    pokemonMap["you"].state.on("used-move", dodgeDataCollector(dodgeData), "dodge-data-collector")
    pokemonMap["enemy"].state.on("used-move", dodgeDataCollector(enemyDodgeData), "dodge-data-collector")
  })

  battle.on("$counterclonecomplete", (moves1, moves2) => {
    if (moves1.length === 0 || moves2.length === 0) {
      const botMode = battle.pokemon1.meta.isBot || battle.pokemon2.meta.isBot
    }
    else {
      const data1 = moves1.map((m, i) => ({ move: m, isDodged: dodgeData[i + 1] ?? false }))
      const data2 = moves2.map((m, i) => ({ move: m, isDodged: enemyDodgeData[i + 1] ?? false }))

      showShadowCloneAutoSceneController(data1, data2)
      dodgeData = {}
      enemyDodgeData = {}
    }

    const cleanTags = ["dodge-data-collector", "dodge-detector"]
    cleanTags.forEach(tag => {
      pokemonMap["you"].state.removeListener("used-move", tag)
      pokemonMap["enemy"].state.removeListener("used-move", tag)
    })
  })
}


const opponentTag = tag => (tag === "you" ? "enemy" : "you")

function addFieldMove(playerTag, moveId, per) {
  const pokemon = pokemonMap[playerTag]
  const move = pokemon.state.addMove(moveId)
  pokemon.state.on("scene", () => {
    pokemon.state.damage.chainModifyPower(moveId, per / 100)
  })
  loadPokemonData(playerTag)
}

globalThis.removeMove = function (playerTag, moveId) {
  const pokemon = pokemonMap[playerTag]
  pokemon.state.removeMove(moveId)
  loadPokemonData(playerTag)
}


function chooseBotMove(playerTag) {
  const pokemon = pokemonMap[playerTag];
  const opponent = pokemonMap[opponentTag(playerTag)];

  const actionableMovesHistory = pokemon.state._data.movesHistory.filter(m => m !== "staythere");
  const lastMoveName = actionableMovesHistory[actionableMovesHistory.length - 1];
  if (lastMoveName) {
    const move = new Move(lastMoveName);
    if (move.flags.combo)
      return battle.canUseMove(pokemon, lastMoveName)
        ? lastMoveName
        : "staythere";
  }

  const scores = {}

  const sortedMoves = pokemon.state.usableOffensiveMoves()
    .filter(m => m.flags.offensive)
    .filter(m => m.category !== "Status")
    .filter(m => allAdjacentModeBy === null || m.capacity === 1)
    .filter(m => {
      if (pokemon.state.usableOffensiveMoves().length === 1) return true
      const alreadyEffected = m.effects.self.some(e => pokemon.state.effects.has(e.name))
        || m.effects.target.some(e => opponent.state.effects.has(e.name))
      return !alreadyEffected
    })
    .toSorted((m1, m2) => {
      const predictPower = move => {
        const avgHits = Array.isArray(move.multihit)
          ? (move.multihit[0] + move.multihit[1]) / 2
          : move.multihit
        return move.basePower * move.capacity * avgHits
      }

      const getEffectBonus = move => {
        const calcBonus = effects => {
          return effects.reduce((total, e) => total + (e.chance / 19), 0)
        }
        return Math.max(1, calcBonus(move.effects.self) + calcBonus(move.effects.target))
      }

      const getStatChangesBonus = move => {
        const calcTotal = changes => {
          return Object.values(changes).reduce((total, stat) => total + stat, 0)
        }
        const total = calcTotal(move.statChanges.self) + (calcTotal(move.statChanges.target) * -1)
        let bonus;
        if (total === 0) {
          bonus = 1
        }
        else if (total > 0) {
          bonus = Math.pow(1.5, total)
        }
        else {
          bonus = Math.pow(0.7, Math.abs(total))
        }
        return bonus
      }

      const getCategoryBonus = move => {
        const map = {
          "Physical": "atk",
          "Special": "spa",
        }
        const revMap = {
          "Physical": "Special",
          "Special": "Physical",
        }

        const mod = pokemon.state.stats.get(map[move.category]) / pokemon.state.stats.get(map[revMap[move.category]])

        let bonus;
        if (mod < 1) {
          // Amplifies the negative impact by a factor of 4 (e.g., 0.95 -> 1 + (-0.05 * 4) = 0.8)
          bonus = 1 + ((mod - 1) * 4)
        } else {
          // Amplifies the positive impact by a factor of 3 (e.g., 1.05 -> 1 + (0.05 * 3) = 1.15)
          bonus = 1 + ((mod - 1) * 3)
        }
        return Math.max(0, bonus)
      }

      const getScore = move => {
        return predictPower(move)
          * getStatChangesBonus(move)
          * getEffectBonus(move)
          * getCategoryBonus(move)
          * opponent.effectiveness(move)
          * (pokemon.isTypeOf(move.type) ? 1.5 : 1)
      }

      const score1 = getScore(m1)
      const score2 = getScore(m2)

      scores[m1.id] = score1
      scores[m2.id] = score2

      return score2 - score1;
    });

    if (Object.keys(scores).length === 1)
      scores[0] = 1

    
  const choosedMoves = sortedMoves.slice(0, 6);
  const weights = choosedMoves.map(m => scores[m.id])

  const choosedStatusMove = shuffle(
    pokemon.state.usableOffensiveMoves()
      .filter(m => m.category === "Status")
      .filter(m => shadowCloneBy === null || m.id !== "shadowclone")
      .filter(m => m.effects.self.every(e => !pokemon.state.effects.has(e.name)))
  )[0]
  const choosedStallingMove = shuffle(
    pokemon.state.usableMoves()
      .filter(m => m.flags.stall)
  )[0]


  if (choosedStatusMove) {
    const avgWeight = weights.reduce((total, w) => total + w, 0) / weights.length
    choosedMoves.push(choosedStatusMove)
    weights.push(avgWeight)
  }

  if ((allAdjacentModeBy || shadowCloneBy) && choosedStallingMove) {
    choosedMoves.push(choosedStallingMove)
    weights.push(Math.max(weights) - 1)
  }

  const moveId = choosedMoves.length === 0 
    ? "staythere"
    : weightedRandomV2(choosedMoves, weights).id

  // console.log(choosedMoves.map((m, i) => `${m.id} -> ${weights[i]}`));

  battle.fields.forEach(f => {
    const modMap = {
     "good": 1.3,
     "bad": 0.7 
    }
    f.impacts()
      .filter(im => im.targetObj === "move")
      .forEach(im => {
        choosedMoves.forEach((m, i) => {
          if (im.targets.includes(m.type)) {
            weights[i] *= modMap[im.type]
          }
        })
    })
  })
  
  // console.log(choosedMoves.map((m, i) => `${m.id} -> ${weights[i]}`));
  
  return moveId
}


function loadPokemonData(playerTag) {

  const pokemon = pokemonMap[playerTag]
  const hp = pokemon.state.stats.get("hp")
  const oldHp = pokemon.state.stats.prev.get("hp")

  loadVeryCloseBtn()
  setCurrentRetreat(pokemon.state.retreat, playerTag)
  setStatChanges(pokemon.state.stats._statChanges, playerTag)
  loadHealth(playerTag)
  loadAHealth(playerTag)
  setCurrentHealth("health", hp, playerTag)
  setCurrentHealth("armor-hp", pokemon.state.armor.hp(), playerTag)
  setDoubleTeamData(pokemon.state.manCount, playerTag)
  loadMoves(playerTag)  
  setRetreatPerWave(pokemonMap[playerTag].meta.retreat,playerTag)
 // setRetreatChargeForAbilities(pokemon.abilities.retreatCost(), playerTag)
 
  if (hp !== oldHp) {
    const hpDist = fixFloat(hp - oldHp)
    const msg = `${0 < hpDist ? '+' : ''} ${hpDist} ${0 > hpDist ? `(${getDamageDangerLevel(pokemon, -hpDist)})` : ''}`
    //popupQueue.add(msg, playerTag)
  }

  if (pokemon.meta.isBot && ![allAdjacentModeBy, shadowCloneBy].includes(playerTag)) {
    clickOnMove(playerTag, chooseBotMove(playerTag))
  }
}

function loadEffects(playerTag) {
  const pokemon = pokemonMap[playerTag]
  setEffects(pokemon.state.effects.all(), playerTag)
}

const _alreadySubscribedPokemons = []

function setBattleStateListeners(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const opponent = pokemonMap[opponentTag(playerTag)]

  if (_alreadySubscribedPokemons.includes(pokemon.name)) return
  _alreadySubscribedPokemons.push(pokemon.name)
  
  pokemon.state.on("wave", () => {
    loadPokemonData(playerTag)
  })
  pokemon.state.on("scene", () => {
    loadEffects(playerTag)
  })
  pokemon.state.tailListener("scene-end", () => {
    setTimeout(() => {
      globalThis.teams = {
        "you": battle.team1,
        "enemy": battle.team2
      }
      loadEffects(playerTag)
      setStatChanges(pokemon.state.stats._statChanges, playerTag)
      loadChoosePokemon(playerTag)
      loadPokemonData(playerTag)
    }, 100)
  })

  // dodge pop up
  pokemon.state.on("used-move", move => {
    if (move.id === "dodge") {
      const dodgedCount = move._dodgeMatrix.filter(Boolean).length
      const failedCount = move._dodgeMatrix.length - dodgedCount
      if (!dodgedCount) return
      let msg = null
      if (move._dodgeMatrix.length === 1 && dodgedCount)
        msg = 'Dodged!'
      else if (move._dodgeMatrix.length > 1)
        msg = `${dodgedCount}x Dodged, ${failedCount} failed!`

      msg && popupQueue.add(msg, playerTag, 2500)
    }

  })

  // critical pop up + refresh retreat
  pokemon.state.tailListener("used-move", move => {
    const pokemon = pokemonMap[playerTag]
    setCurrentRetreat(pokemon.state.retreat, playerTag)

    if (!move.hit) return
    if (move.hit.damage() <= 0) return;
    let msg = null
    if (move.hits === 1 && move.hit.criticalCount() === 1) {
      msg = 'Critical Hit!'
    }
    else if (move.hits > 1) {
      msg = `${move.hits} Hits ${move.hit.criticalCount() ? `, (${move.hit.criticalCount()} Crit)` : ''} !`
    }
    msg && popupQueue.add(msg, opponentTag(playerTag), 3500)
  })

  // KO popup
  pokemon.state.on("used-move", move => {
    if (move._bp === Infinity)
      popupQueue.add("K.O!", opponentTag(playerTag), 3500)
  })

  pokemon.state.on('fainted', () => {
    loadChoosePokemon(playerTag)
    const pokemonSwitchBtn = document.querySelector(`.${playerTag}-controle-cont .pokemon-switch-controler .pokemon:not(.disabled)`)
    pokemonSwitchBtn?.click()
    loadPokemonData(playerTag)
  })

  battle.prompt(pokemon).reply("dodge", () => {
    return showDodgeBattlePrompt("Want to Dodge?", playerTag)
  })

  battle.prompt(pokemon).reply("counterclone", (cloneMove, counterMove) => {
    shadowCloneBy = opponentTag(playerTag)
    showShadowCloneSceneController(playerTag)
    addShadowCloneScene(cloneMove.id)
    if (counterMove) {
      setShadowCloneSceneTargetMove(counterMove.id)
      return counterMove
    }
    return new Promise((resolve, _) => {
      eventEmitter.once("move-card-select", (card, tag) => {
        if (playerTag !== tag) return
        const storedMove = pokemon.state.moves.find(move => move.id === card.dataset.moveId)
        const move = new Move(card.dataset.moveId, storedMove._meta)
        setShadowCloneSceneTargetMove(move.id)
        resolve(move)
        let i = 1
        opponent.state.on("used-move", move => {
          if (move.id === "dodge" && move._dodgeMatrix.every(Boolean)) {
            setShadowCloneSceneTargetDodged(i / 2, opponentTag(playerTag))
          }
          i++
        }, "dodge-detector")
      })
    })
  })


  battle.prompt(pokemon).reply("adjacent_counter_stack", (adjacentMove) => {
    return new Promise((resolve, _) => {
      updateAllAdjFlag(true, adjacentMove.capacity - 1, playerTag)
      const pokemonToSelect = document.querySelector(`.pokemon-switch-controler .pokemon[data-name="${pokemon.meta.name}"]`)
      pokemonToSelect.click()

      eventEmitter.once("move-card-select", async (card, tag) => {
        const confirmed = allAdjacentModeBy === playerTag ? true : await confirmBotScene()
        if (!confirmed) return
        updateAllAdjFlag(adjacentMove.capacity - 2 > 0, adjacentMove.capacity - 1, playerTag)
        const selectedPokemonName = document.querySelector(`.${tag}-controle-cont .pokemon-switch-controler .pokemon.active`)?.dataset.name
        const p = teams[tag].find(p => p.name === selectedPokemonName)
        const storedMove = p.state.moves.find(move => move.id === card.dataset.moveId)
        const move = new Move(card.dataset.moveId, storedMove._meta)
        resolve([p, move])
      })
    })
  })
}
function toggleMirrorChoosePokemons(playerTag) {
  const pokemonSwitchControler = document.querySelector(`.${opponentTag(playerTag)}-controle-cont .pokemon-switch-controler`)
  let i = teams[opponentTag(playerTag)].length
  pokemonSwitchControler.classList.toggle("mirror-mode")
 
  if (pokemonSwitchControler.classList.contains("mirror-mode")) {
    for (const pokemon of teams[playerTag]) {
      pokemonSwitchControler.innerHTML += `
          <div class="pokemon ${pokemon.isFainted ? "disabled" : ""} mirror" data-name="${pokemon.meta.name}" onclick="switchPokemonClickHandler(event, '${opponentTag(playerTag)}')" data-index="${i}">
                  <svg class="pokeball-icon" height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 511.985 511.985" xml:space="preserve" fill="grey">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path style="fill:black;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-34.554,0-68.083,6.773-99.645,20.125 c-30.483,12.89-57.865,31.351-81.373,54.85c-23.499,23.507-41.959,50.889-54.85,81.372C6.774,187.91,0,221.44,0,255.993 c0,34.56,6.773,68.091,20.125,99.652c12.89,30.469,31.351,57.857,54.85,81.357c23.507,23.516,50.889,41.967,81.373,54.857 c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857 c23.5-23.5,41.951-50.889,54.842-81.357c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z "></path>
          <path style="fill:#E6E9ED;" d="M0.102,263.18c0.875,32.014,7.593,63.092,20.023,92.465c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125 c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357c12.438-29.373,19.156-60.451,20.031-92.465 H0.102z"></path> <path style="fill:#434A54;" d="M510.765,281.211c0.812-8.344,1.219-16.75,1.219-25.218c0-9.516-0.516-18.953-1.531-28.289 c-12.719,1.961-30.984,4.516-53.998,7.054c-43.688,4.82-113.904,10.57-200.463,10.57c-86.552,0-156.776-5.75-200.455-10.57 c-23.022-2.539-41.28-5.093-53.998-7.054C0.516,237.04,0,246.478,0,255.993c0,8.468,0.406,16.875,1.219,25.218 c41.53,6.25,133.027,17.436,254.773,17.436S469.234,287.461,510.765,281.211z"></path> <path style="fill:#E6E9ED;" d="M309.334,266.656c0,29.459-23.891,53.334-53.342,53.334c-29.452,0-53.334-23.875-53.334-53.334 c0-29.453,23.882-53.327,53.334-53.327C285.443,213.33,309.334,237.204,309.334,266.656z"></path> <path style="fill:#434A54;" d="M255.992,170.66c-52.936,0-95.997,43.069-95.997,95.997s43.062,95.988,95.997,95.988 s95.996-43.061,95.996-95.988C351.988,213.729,308.928,170.66,255.992,170.66z M255.992,309.335 c-23.522,0-42.663-19.156-42.663-42.678c0-23.523,19.14-42.663,42.663-42.663c23.531,0,42.654,19.14,42.654,42.663 C298.646,290.178,279.523,309.335,255.992,309.335z"></path> <path style="opacity:0.2;fill:#FFFFFF;enable-background:new ;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-3.57,0-7.125,0.078-10.664,0.219 c30.789,1.25,60.662,7.93,88.974,19.906c30.498,12.89,57.873,31.351,81.371,54.85c23.5,23.507,41.969,50.889,54.857,81.372 c13.359,31.562,20.109,65.092,20.109,99.646c0,34.56-6.75,68.091-20.109,99.652c-12.889,30.469-31.357,57.857-54.857,81.357 c-23.498,23.516-50.873,41.967-81.371,54.857c-28.312,11.969-58.186,18.656-88.974,19.906c3.539,0.141,7.093,0.219,10.664,0.219 c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357 c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z"></path> <path style="opacity:0.1;enable-background:new ;" d="M20.125,355.645c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c3.57,0,7.125-0.078,10.664-0.219 c-30.789-1.25-60.67-7.938-88.982-19.906c-30.483-12.891-57.857-31.342-81.364-54.857c-23.507-23.5-41.96-50.889-54.858-81.357 c-13.352-31.56-20.117-65.091-20.117-99.652c0-34.554,6.765-68.084,20.116-99.646C54.35,125.864,72.803,98.481,96.31,74.983 c23.507-23.507,50.881-41.968,81.364-54.858c28.312-11.976,58.193-18.656,88.982-19.906c-3.539-0.14-7.094-0.218-10.664-0.218 c-34.554,0-68.083,6.773-99.645,20.125c-30.483,12.89-57.865,31.351-81.373,54.858c-23.499,23.499-41.959,50.881-54.85,81.364 C6.774,187.91,0,221.44,0,255.993C0,290.553,6.774,324.085,20.125,355.645z"></path>
        </g>
      </svg>
            <span class="name">${pokemon.meta.name ?? pokemon.name}</span>
          </div>
    `
      i++
    }
   
  } else {
     pokemonSwitchControler.querySelectorAll(".pokemon").forEach(pokemon => {
      if (pokemon.classList.contains("mirror") )
      pokemonSwitchControler.removeChild(pokemon)
     })

  }
}

function loadChoosePokemon(playerTag) {
  const team = teams[playerTag]
   if (team[0].meta.mirror) 
     return null

  const pokemonSwitchControler = document.querySelector(`.${playerTag}-controle-cont .pokemon-switch-controler`)
  if (pokemonSwitchControler.classList.contains("mirror-mode")) return null
 
  pokemonSwitchControler.innerHTML = ""
  const activePokemon = playerTag === "you" ? globalThis.pokemon : globalThis.enemyPokemon
  let i = 0
  for (const pokemon of team) {
    pokemonSwitchControler.innerHTML += `
          <div class="pokemon ${pokemon.isFainted ? "disabled" : ""} ${pokemon.meta.name === activePokemon?.meta.name ? "active" : ""}" data-name="${pokemon.meta.name}" onclick="switchPokemonClickHandler(event, '${playerTag}')" data-index="${i}">
      ${ pokemon.meta.isBot 
      ? `
         <svg fill="royalblue" width="40px" height="40px" viewBox="0 0 24.00 24.00" xmlns="http://www.w3.org/2000/svg" class="stroke" stroke="#00000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#ffffff" stroke-width="0.336"></g><g id="SVGRepo_iconCarrier"><path d="M21 10.975V8a2 2 0 0 0-2-2h-6V4.688c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5a2 2 0 0 0-2 2v2.998l-.072.005A.999.999 0 0 0 2 12v2a1 1 0 0 0 1 1v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a1 1 0 0 0 1-1v-1.938a1.004 1.004 0 0 0-.072-.455c-.202-.488-.635-.605-.928-.632zM7 12c0-1.104.672-2 1.5-2s1.5.896 1.5 2-.672 2-1.5 2S7 13.104 7 12zm8.998 6c-1.001-.003-7.997 0-7.998 0v-2s7.001-.002 8.002 0l-.004 2zm-.498-4c-.828 0-1.5-.896-1.5-2s.672-2 1.5-2 1.5.896 1.5 2-.672 2-1.5 2z"></path></g></svg>
      `
      
     : `<svg class="pokeball-icon" height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 511.985 511.985" xml:space="preserve" fill="#000000">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path style="fill:#ED5564;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-34.554,0-68.083,6.773-99.645,20.125 c-30.483,12.89-57.865,31.351-81.373,54.85c-23.499,23.507-41.959,50.889-54.85,81.372C6.774,187.91,0,221.44,0,255.993 c0,34.56,6.773,68.091,20.125,99.652c12.89,30.469,31.351,57.857,54.85,81.357c23.507,23.516,50.889,41.967,81.373,54.857 c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857 c23.5-23.5,41.951-50.889,54.842-81.357c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z "></path>
          <path style="fill:#E6E9ED;" d="M0.102,263.18c0.875,32.014,7.593,63.092,20.023,92.465c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125 c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357c12.438-29.373,19.156-60.451,20.031-92.465 H0.102z"></path> <path style="fill:#434A54;" d="M510.765,281.211c0.812-8.344,1.219-16.75,1.219-25.218c0-9.516-0.516-18.953-1.531-28.289 c-12.719,1.961-30.984,4.516-53.998,7.054c-43.688,4.82-113.904,10.57-200.463,10.57c-86.552,0-156.776-5.75-200.455-10.57 c-23.022-2.539-41.28-5.093-53.998-7.054C0.516,237.04,0,246.478,0,255.993c0,8.468,0.406,16.875,1.219,25.218 c41.53,6.25,133.027,17.436,254.773,17.436S469.234,287.461,510.765,281.211z"></path> <path style="fill:#E6E9ED;" d="M309.334,266.656c0,29.459-23.891,53.334-53.342,53.334c-29.452,0-53.334-23.875-53.334-53.334 c0-29.453,23.882-53.327,53.334-53.327C285.443,213.33,309.334,237.204,309.334,266.656z"></path> <path style="fill:#434A54;" d="M255.992,170.66c-52.936,0-95.997,43.069-95.997,95.997s43.062,95.988,95.997,95.988 s95.996-43.061,95.996-95.988C351.988,213.729,308.928,170.66,255.992,170.66z M255.992,309.335 c-23.522,0-42.663-19.156-42.663-42.678c0-23.523,19.14-42.663,42.663-42.663c23.531,0,42.654,19.14,42.654,42.663 C298.646,290.178,279.523,309.335,255.992,309.335z"></path> <path style="opacity:0.2;fill:#FFFFFF;enable-background:new ;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-3.57,0-7.125,0.078-10.664,0.219 c30.789,1.25,60.662,7.93,88.974,19.906c30.498,12.89,57.873,31.351,81.371,54.85c23.5,23.507,41.969,50.889,54.857,81.372 c13.359,31.562,20.109,65.092,20.109,99.646c0,34.56-6.75,68.091-20.109,99.652c-12.889,30.469-31.357,57.857-54.857,81.357 c-23.498,23.516-50.873,41.967-81.371,54.857c-28.312,11.969-58.186,18.656-88.974,19.906c3.539,0.141,7.093,0.219,10.664,0.219 c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357 c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z"></path> <path style="opacity:0.1;enable-background:new ;" d="M20.125,355.645c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c3.57,0,7.125-0.078,10.664-0.219 c-30.789-1.25-60.67-7.938-88.982-19.906c-30.483-12.891-57.857-31.342-81.364-54.857c-23.507-23.5-41.96-50.889-54.858-81.357 c-13.352-31.56-20.117-65.091-20.117-99.652c0-34.554,6.765-68.084,20.116-99.646C54.35,125.864,72.803,98.481,96.31,74.983 c23.507-23.507,50.881-41.968,81.364-54.858c28.312-11.976,58.193-18.656,88.982-19.906c-3.539-0.14-7.094-0.218-10.664-0.218 c-34.554,0-68.083,6.773-99.645,20.125c-30.483,12.89-57.865,31.351-81.373,54.858c-23.499,23.499-41.959,50.881-54.85,81.364 C6.774,187.91,0,221.44,0,255.993C0,290.553,6.774,324.085,20.125,355.645z"></path>
        </g>
      </svg>
      `}
            <span class="name">${pokemon.meta.name ?? pokemon.name}</span>
          </div>`
    
    i++
  }
}


function makeMyPokemons() {
  const pokemonsMeta = getPokemonsMeta()
  return Object.keys(pokemonsMeta)
    .map(id => new Pokemon(pokemonsMeta[id].id, pokemonsMeta[id], "you"))
    .filter(p => system !== "multiple" || p.meta.isSelectedForMultiBattle)
}

function makeEnemyPokemons() {
  const enemiesBase64List = JSON.parse(localStorage.getItem("$enemies-base64-list"))
  return enemiesBase64List.map(base64 => Pokemon.fromBase64(base64, "enemy"))
}


function loadTeams() {
  globalThis.teams = {
    "you": makeMyPokemons(),
    "enemy": makeEnemyPokemons()
  }
}

function registerBattle() {
  const Battle = BATTLE_SYSTEMS[system]
  globalThis.battle = new Battle(teams.you, teams.enemy, fields)

  if (system === "multiple") {
    pokemonMap = {
      "you": teams.you.find(p => p.meta.isSelectedForMultiBattle),
      "enemy": teams.enemy.find(p => p.meta.isSelectedForMultiBattle)
    }

    Object.keys(teams).forEach(t => {
      const oldP = pokemonMap[t]
      teams[t].forEach(p => {
        if (!p.meta.isSelectedForMultiBattle) return
        pokemonMap[t] = p
        setBattleStateListeners(t)
      })
      pokemonMap[t] = oldP
    })
  }
}

function switchPokemon(playerTag, index) {
  if (playerTag === "you") {
    globalThis.pokemon = teams.you[index]
    globalThis.pokemonMap["you"] = pokemon
  }
  else {
    globalThis.enemyPokemon = teams.enemy[index]
    globalThis.pokemonMap["enemy"] = enemyPokemon
  }

  if (globalThis.pokemon && globalThis.enemyPokemon) {
    setupCurrentBattle(playerTag)
  }

  if (globalThis.pokemon && globalThis.enemyPokemon) {
    const diff = pokemon.cp() - enemyPokemon.cp()
    popupQueue.add(`CP: ${pokemon.cp()} ${diff > 0 ? `  ↑${diff}` : ''}`, "you", 2000)
    popupQueue.add(`CP: ${enemyPokemon.cp()} ${diff < 0 ? `  ↑${diff}` : ''} `, "enemy", 2000)
  }
}

function setupCurrentBattle(switcher) {
  battle.activate(pokemon)
  battle.activate(enemyPokemon)
  setupPokemonForDom("you")
  setupPokemonForDom("enemy")
}

function setupPokemonForDom(playerTag) {
  setBattleStateListeners(playerTag)
  loadRetreat(playerTag)
  loadPokemonData(playerTag)
  loadEffects(playerTag)
}

//todo
function showBattlePromptPopup(msg, playerTag) {
  const battlePromptPopup = document.querySelector(".battle-prompt-popup")
  const counterBtn = battlePromptPopup.querySelector(".btns-cont > .counter-btn")
  const dodgeBtn = battlePromptPopup.querySelector(".btns-cont > .dodge-btn")
  const nothingBtn = battlePromptPopup.querySelector(".btns-cont > .nothing-btn")
  function hideShowToggle() {
    battlePromptPopup.classList.toggle("active")
    if (playerTag === "enemy") {
      battlePromptPopup.classList.toggle("enemy")
    }
  }
  hideShowToggle()
  battlePromptPopup.querySelector(".msg").textContent = msg
  return new Promise((res, rej) => {
    counterBtn.onclick = () => {
      res("counter")
      hideShowToggle()
    }
    dodgeBtn.onclick = () => {
      res("dodge")
      hideShowToggle()
    }
    nothingBtn.onclick = () => {
      res("nothing")
      hideShowToggle()
    }

  })

}

function showDodgeBattlePrompt(msg, playerTag) {
  const battlePromptPopup = document.querySelector(".battle-prompt-popup")
  const dodgeBtn = battlePromptPopup.querySelector(".btns-cont > .dodge-btn")
  const nothingBtn = battlePromptPopup.querySelector(".btns-cont > .nothing-btn")
  function hideShowToggle() {
    battlePromptPopup.classList.toggle("active")
    if (playerTag === "enemy") {
      battlePromptPopup.classList.toggle("enemy")
    }
  }
  hideShowToggle()
  battlePromptPopup.querySelector(".msg").textContent = msg
  return new Promise((res, rej) => {
    dodgeBtn.onclick = () => {
      res(true)
      hideShowToggle()
    }
    nothingBtn.onclick = () => {
      res(false)
      hideShowToggle()
    }
  })

}


function showShadowCloneAutoSceneController(moves1, moves2) {
  const shadowCloneSceneController = document.querySelector(".shadow-clone-scene-controller")
  shadowCloneSceneController.classList.add("active")
  shadowCloneSceneController.classList.add("auto")
  const title = shadowCloneSceneController.querySelector(".title")
  title.textContent = `Shadow Clone Auto Scene ( You vs Enemy )`

  for (let i = 0; i < moves1.length; i++) {
    // for "you"
    addShadowCloneScene(moves1[i].move.id, moves1[i].isDodged, true)
    // for "enemy"
    setShadowCloneSceneTargetMove(moves2[i].move.id, moves2[i].isDodged, true)

  }

}

function showShadowCloneSceneController(playerTag) {
  const shadowCloneSceneController = document.querySelector(".shadow-clone-scene-controller")
  shadowCloneSceneController.classList.add("active")
  if (playerTag === "enemy") {
    shadowCloneSceneController.classList.add("enemy")
  }
  const title = shadowCloneSceneController.querySelector(".title")
  title.textContent = `Shadow Clone Scene Controller ( ${playerTag} )`
}

globalThis.hideShadowCloneSceneController = function () {
  shadowCloneBy = null
  const shadowCloneSceneController = document.querySelector(".shadow-clone-scene-controller")
  const shadowCloneSceneList = shadowCloneSceneController.querySelector(".shadow-clone-scene-list")

  shadowCloneSceneList.innerHTML = ""

  shadowCloneSceneController.classList.remove("active")
  if (shadowCloneSceneController.classList.contains("enemy"))
    shadowCloneSceneController.classList.remove("enemy")
  if (shadowCloneSceneController.classList.contains("auto"))
    shadowCloneSceneController.classList.remove("auto")
}

function addShadowCloneScene(cloneMoveId, isDodged = false, isAutoScene = false) {
  const cloneMove = new Move(cloneMoveId)

  const shadowCloneSceneList = document.querySelector(".shadow-clone-scene-controller .shadow-clone-scene-list")
  const currentCloneIndex = shadowCloneSceneList.querySelectorAll(".shadow-clone-scene").length

  const shadowCloneScene = document.createElement("div")
  shadowCloneScene.classList.add("shadow-clone-scene")
  shadowCloneScene.innerHTML = `
    <span style="color: var(--${cloneMove.type}-type-color);" class="clone-move-name ${isAutoScene ? isDodged ? "dodged" : "" : ""}" data-clone-index="${currentCloneIndex + 1}">${cloneMove.name}</span>
    <strong>VS</strong>
    <span class="target-move-name">?</span>
  `
  shadowCloneSceneList.appendChild(shadowCloneScene)
}


function setShadowCloneSceneTargetMove(targetMoveId, isDodged = false, isAutoScene = false) {
  const targetMove = new Move(targetMoveId)
  const cloneMoveName = document.querySelector(".shadow-clone-scene-controller .shadow-clone-scene-list .shadow-clone-scene:last-child .clone-move-name")

  const targetMoveName = document.querySelector(".shadow-clone-scene-controller .shadow-clone-scene-list .shadow-clone-scene:last-child .target-move-name")
  targetMoveName.style.color = `var(--${targetMove.type}-type-color)`
  targetMoveName.textContent = targetMove.name
  if (isDodged) {
    isAutoScene ? cloneMoveName.classList.add("dodged") : targetMoveName.classList.add("dodged")
  }
}

function setShadowCloneSceneTargetDodged(i, playerTag, both = false) {
  const shadowCloneSceneController = document.querySelector(".shadow-clone-scene-controller")
  const shadowCloneSceneList = shadowCloneSceneController.querySelector(".shadow-clone-scene-list")

  const shadowCloneScene = shadowCloneSceneList.querySelectorAll(".shadow-clone-scene")[i - 1]
  // return 0
  if (both) {
    if (playerTag === "enemy")
      shadowCloneScene.querySelector(".target-move-name").classList.add("dodged")
    else
      shadowCloneScene.querySelector(".clone-move-name").classList.add("dodged")
  }
  else
    shadowCloneScene.classList.add("dodged")

}



function setEffects(effects, playerTag) {
  const effectsMap = {
    "brn": {
      "name": "Burn",
      "color": "Fire"
    },
    "psn": {
      "name": "Poison",
      "color": "Poison"
    },
    "par": {
      "name": "Paralyze",
      "color": "Electric"
    },
    "frz": {
      "name": "Freeze",
      "color": "Ice"
    },
    "slp": {
      "name": "Sleep",
      "color": "Psychic"
    },
    "tailwind":{
      "name": "TailWind",
      "color": "Flying"
    },
    "confusion": {
      "name": "Confusion",
      "color": "Psychic"
    },
    "cur": {
      "name": "Curse",
      "color": "Ghost"
    },
    "flinch": {
      "name": "Flinch",
      "color": "Dark"
    },
    "inf": {
      "name": "Infatuation",
      "color": "Fairy"
    },
    "trp": {
      "name": "Trap",
      "color": "Ground"
    },
    "leechseed": {
      "name": "Leech",
      "color": "Grass"
    },
    "dws": {
      "name": "Drowsy",
      "color": "Psychic"
    },
    "stall": {
      "name": "Stall",
      "color": "Normal"
    },
    "partiallytrapped": {
      "name": "Par. Trapped",
      "color": "Normal"
    },
    "doubleteam": {
      "name": "Double Team",
      "color": "Normal"
    },
    "shadowclone": {
      "name": "Shadow Clone",
      "color": "Dark"
    },
    "aquaring": {
      "name": "Aqua Ring",
      "color": "Water"
    },
    "naturehealing": {
      "name": "Nature Healing",
      "color": "Grass"
    },
    "sage": {
      "name": "sage",
      "color": "Normal"
    },
    "paperbomb": {
      "name": "Paper Bomb",
      "color": "Normal"
    },
    "bleed": {
      "name": "Bleed",
      "color": "Normal"
    },
    "mammothskin": {
      "name": "Mammoth Skin",
      "color": "Normal"
    },
    "areasplash": {
      "name": "Area Splash",
      "color": "Normal"
    },
    "ancientmode": {
      "name": "Ancient Mode",
      "color": "Dragon"
    },
    "innergate": {
      "name": "Inner Gate",
      "color": "Fighting"
    },
    "mustrecharge": {
      "name": "Re-charging",
      "color": "Normal"
    }
  };
  const effectsDataColumn = document.querySelector(`.${playerTag}-controle-cont .effects-data-column`)
  const effectElements = effectsDataColumn.querySelectorAll(".effect")
  effectElements.forEach((elm) => effectsDataColumn.removeChild(elm))
  effects.forEach(effect => {
    const span = document.createElement("span")
    span.classList.add("effect")
    span.style.backgroundColor = `var(--${effectsMap[effect.constructor.effectName].color}-type-color)`
    span.textContent = `${effectsMap[effect.constructor.effectName].name} ${effect.displayMeta()}`.trim()
    effectsDataColumn.insertBefore(span, effectsDataColumn.firstElementChild)
  })
}

function setStatChanges(data, playerTag) {
  const attributesDataRow = document.querySelector(`.${playerTag}-controle-cont .attributes-data-row`)
  const statElements = attributesDataRow.querySelectorAll(".stat")
  statElements.forEach((elm) => attributesDataRow.removeChild(elm))

  for (const [stat, value] of Object.entries(data)) {
    if (value === 0) continue
    const change = value > 0 ? '+' + value : value
    const span = document.createElement("span")
    span.classList.add("stat")
    span.textContent = `${stat}${change}`
    attributesDataRow.insertBefore(span, attributesDataRow.firstElementChild)
  }
}

function setRetreatPerWave(retreat, playerTag) {
  const retreatPerWave = document.querySelector(`.${playerTag}-controle-cont .retreat-per-wave`)  
  retreatPerWave.textContent = parseFloat(retreat - pokemonMap[playerTag].abilities.retreatCost()).toFixed(2)
}

function setRetreatChargeForAbilities(retreat, playerTag) {
  const retreatChargeForAbilities = document.querySelector(`.${playerTag}-controle-cont .retreat-charge-for-abilities`)
  retreatChargeForAbilities.textContent = retreat
}
// retreat-charge-for-abilities
function setCurrentRetreat(retreat, playerTag) {
  const currentRetreat = document.getElementById(`${playerTag}-current-retreat`)
  currentRetreat.innerText = retreat.toFixed(2)
}

function setDoubleTeamData(count, playerTag) {
  const valueElm = document.querySelector(`.${playerTag}-controle-cont .double-team-data > .value`)
  valueElm.textContent = count
}

function setHealthPercentData(percent,playerTag) {
  const valueElm = document.querySelector(`.${playerTag}-controle-cont .health > .value`)
  valueElm.textContent = percent
}


function setTotalHealth(className, hp, playerTag) {
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .${className}.progress-bar`)
  healthProgressBar.setAttribute("data-total-hp", hp)
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".inner").style.width = '100%'
  healthProgressBar.querySelector(".current-hp").textContent = hp
  healthProgressBar.querySelector(".total-hp").textContent = parseInt(hp)
}

function setCurrentHealth(className, hp, playerTag) {
  const pokemon = pokemonMap[playerTag]
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .${className}.progress-bar`)
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".current-hp").textContent = parseInt(hp)
  // if (className === "health")
  //   healthProgressBar.querySelector(".current-hp").textContent += `(${Math.round((hp * 100) / pokemon.maxhp)}%)`
  const progress = className === "health"
    ? (hp / pokemon.maxhp) * 100
    : (hp / pokemon.state.armor.maxhp()) * 100
  healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0 : progress}%`
}

function loadMoves(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const opponentPokemon = pokemonMap[opponentTag(playerTag)]
  const moveCardsContainer = document.querySelector(`.${playerTag}-controle-cont .card-container`)
  moveCardsContainer.innerHTML = ''
  const veryClose = battle.ctx.veryClose === true;
  // let moves = [...pokemon.state.moves].sort((a, b) => {
  //   const aUsable = battle.canUseMove(pokemon, a.id);
  //   const bUsable = battle.canUseMove(pokemon, b.id);
  //   if (aUsable !== bUsable) return aUsable ? -1 : 1;

  //   if (veryClose) {
  //     const aContact = a.flags.contact === 1;
  //     const bContact = b.flags.contact === 1;
  //     if (aContact !== bContact) return aContact ? -1 : 1;
  //   }

  //   const aPower = a.basePower || 0;
  //   const bPower = b.basePower || 0;
  //   if (aPower !== bPower) return bPower - aPower;

  //   const aDefault = a._meta?.isDefault === true;
  //   const bDefault = b._meta?.isDefault === true;
  //   if (aDefault !== bDefault) return aDefault ? 1 : -1;

  //   return 0;
  // });

   let moves = [...pokemon.state.moves].sort((a, b) => {
    const aGroup = a._meta?.$isDefault ? 0 : 1;
    const bGroup = b._meta?.$isDefault ? 0 : 1;

    if (aGroup !== bGroup) return aGroup - bGroup;

    const aPower = a.basePower || 0;
    const bPower = b.basePower || 0;
    return bPower - aPower;
  });

  for (const move of moves) {
    const mod = pokemon.state.damage.powerModifier(move.id)
    const effectiveness = opponentPokemon.effectiveness(move.type)
    const damage = new Damage(pokemon, move)
    let capacityColor = "black"
    let basePowerColor = "black"
    if (move.target === "allAdjacent" || move.target === "all") {
      capacityColor = "darkred"
      if (move.target === "all")
        basePowerColor = "darkred"
    }
    else if (move.target === "allySide" || move.target === "allies") {
      capacityColor = "darkgreen"
    }

    const cardHtml = `
    <div class="single-card-wrapper">
      <div class="card ${battle.canUseMove(pokemon, move.id) ? "" : "disabled"}"  data-move-id="${move.id}" style="outline:1px solid var(--${move.type || "Normal"}-type-color)" onclick="moveCardClickHandler(event, '${playerTag}')" data-makes-contact="${!!move.flags.contact}">
          <div class="card-header" style="background-color:var(--${move.type || "Normal"}-type-color)">
            <div class="category-side">
              
              <div class="category-bg"></div>
              <div class="category-bg-triangle"></div>
              <img class="move-category-icon" width="20px" src="./assets/img/categories/${move.category}.png"  />
            </div>
            <div class="right-side">
          ${effectiveness === 1 ? ""
        : `<img class="move-effectiveness-icon"  width="15px" src="./assets/svg/arrow-${effectiveness > 1 ? "up" : "down"}.svg">`
      }
            <img class="move-type-icon"   width="20px"
            src="./assets/img/types/${move.type}.png"
            
            class="move-type"
          />
            </div>
           
          </div>
          <div class="card-body">
            <div class="primary">
              <p class="move-name">${move.name}</p>
              <span class="pp-data">
                ${move.pp !== null ? `${move.pp} / ${move._move.pp}` : "∞"}
              </span>
            </div>
            <div class="secondary">
            ${move.basePower && !["None", "Status"].includes(move.category)
        ? `  <div class="power-data data-wrapper">
                ${move.flags.contact !== 1
          ? ` <svg
                  class="bow-icon"
                  width="17px"
                  height="17px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M23.9806 1.19613C24.0462 0.868272 23.9436 0.529333 23.7071 0.292909C23.4707 0.056486 23.1318 -0.0461365 22.8039 0.0194355L17.8039 1.01944C17.2624 1.12775 16.9111 1.65457 17.0194 2.19613C17.1278 2.73769 17.6546 3.08891 18.1961 2.9806L19.9575 2.62832L16.8761 5.70976C14.2376 3.39988 10.7823 2.00002 7.00003 2.00002H1.00003C0.447744 2.00002 2.91966e-05 2.44773 2.91966e-05 3.00002C2.91966e-05 3.5523 0.447744 4.00002 1.00003 4.00002C1.00003 4.25594 1.09766 4.51186 1.29292 4.70712L9.58582 13L8.58582 14H5.00003C4.73481 14 4.48046 14.1054 4.29292 14.2929L0.292922 18.2929C0.00692444 18.5789 -0.0786313 19.009 0.0761497 19.3827C0.230931 19.7564 0.595567 20 1.00003 20H4.00003V23C4.00003 23.4045 4.24367 23.7691 4.61735 23.9239C4.99102 24.0787 5.42114 23.9931 5.70714 23.7071L9.70714 19.7071C9.89467 19.5196 10 19.2652 10 19V15.4142L11 14.4142L19.2929 22.7071C19.4882 22.9024 19.7441 23 20 23C20 23.5523 20.4477 24 21 24C21.5523 24 22 23.5523 22 23V17C22 13.2178 20.6002 9.76247 18.2903 7.12397L21.3717 4.04254L21.0194 5.8039C20.9111 6.34546 21.2624 6.87228 21.8039 6.9806C22.3455 7.08891 22.8723 6.73769 22.9806 6.19613L23.9806 1.19613ZM15.4582 7.12759C13.1847 5.17792 10.2299 4.00002 7.00003 4.00002H3.41424L11 11.5858L15.4582 7.12759ZM12.4142 13L16.8725 8.5418C18.8221 10.8153 20 13.7701 20 17V20.5858L12.4142 13ZM5.41424 16H6.58582L4.58581 18H3.41424L5.41424 16ZM8.00003 18.5858L6.00003 20.5858V19.4142L8.00003 17.4142V18.5858Z"
                      fill="${basePowerColor}"
                    ></path>
                  </g>
                </svg>
                `
          : `<svg
                  class="sword-icon"
                  width="17px"
                  height="17px"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      d="M16 0H13L3.70711 9.29289L2.20711 7.79289L0.792893 9.20711L3.08579 11.5L1.5835 13.0023C1.55586 13.0008 1.52802 13 1.5 13C0.671573 13 0 13.6716 0 14.5C0 15.3284 0.671573 16 1.5 16C2.32843 16 3 15.3284 3 14.5C3 14.472 2.99923 14.4441 2.99771 14.4165L4.5 12.9142L6.79289 15.2071L8.20711 13.7929L6.70711 12.2929L16 3V0Z"
                      fill="${basePowerColor}"
                    ></path>
                  </g>
                </svg>`}
                :
                <span class="data">${move.basePower} ${mod !== 1 ? `(${mod > 1 ? '+' : ''}${Math.round((mod - 1) * 100)}%)` : ''}</span>
              </div>` : ``
      }
     ${move.capacity > 1
        ? `
         <div class="capacity-data data-wrapper">
<svg width="17px" height="17px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="${capacityColor}"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>target [#81]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-340.000000, -7839.000000)" fill="${capacityColor}"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M298,7689 C298,7688.448 298.448,7688 299,7688 L299.91,7688 C299.486,7685.493 297.507,7683.514 295,7683.09 L295,7684 C295,7684.552 294.552,7685 294,7685 C293.448,7685 293,7684.552 293,7684 L293,7683.09 C290.493,7683.514 288.514,7685.493 288.09,7688 L289,7688 C289.552,7688 290,7688.448 290,7689 C290,7689.552 289.552,7690 289,7690 L288.09,7690 C288.514,7692.507 290.493,7694.486 293,7694.91 L293,7694 C293,7693.448 293.448,7693 294,7693 C294.552,7693 295,7693.448 295,7694 L295,7694.91 C297.507,7694.486 299.486,7692.507 299.91,7690 L299,7690 C298.448,7690 298,7689.552 298,7689 M304,7689 C304,7689.552 303.552,7690 303,7690 L301.931,7690 C301.479,7693.617 298.617,7696.479 295,7696.931 L295,7698 C295,7698.552 294.552,7699 294,7699 C293.448,7699 293,7698.552 293,7698 L293,7696.931 C289.383,7696.479 286.521,7693.617 286.069,7690 L285,7690 C284.448,7690 284,7689.552 284,7689 C284,7688.448 284.448,7688 285,7688 L286.069,7688 C286.521,7684.383 289.383,7681.521 293,7681.069 L293,7680 C293,7679.448 293.448,7679 294,7679 C294.552,7679 295,7679.448 295,7680 L295,7681.069 C298.617,7681.521 301.479,7684.383 301.931,7688 L303,7688 C303.552,7688 304,7688.448 304,7689 M297,7689 C297,7689.552 296.552,7690 296,7690 L295,7690 L295,7691 C295,7691.552 294.552,7692 294,7692 C293.448,7692 293,7691.552 293,7691 L293,7690 L292,7690 C291.448,7690 291,7689.552 291,7689 C291,7688.448 291.448,7688 292,7688 L293,7688 L293,7687 C293,7686.448 293.448,7686 294,7686 C294.552,7686 295,7686.448 295,7687 L295,7688 L296,7688 C296.552,7688 297,7688.448 297,7689" id="target-[#81]"> </path> </g> </g> </g> </g></svg>
 
                : <span class="data">${move.capacity}</span>
              </div>
              `
        : ""
      }
        <div class="accuracy-data data-wrapper">

<svg fill="#000000" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="21px" height="21px" viewBox="0 0 72 72" enable-background="new 0 0 72 72" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M36.001,63.75C24.233,63.75,2.5,54.883,2.5,42.25c0-12.634,21.733-21.5,33.501-21.5c11.766,0,33.5,8.866,33.5,21.5 C69.501,54.883,47.767,63.75,36.001,63.75z M36.001,24.75C24.886,24.75,6.5,32.929,6.5,42.25c0,9.32,18.387,17.5,29.501,17.5 c11.113,0,29.5-8.18,29.5-17.5C65.501,32.929,47.114,24.75,36.001,24.75z"></path> </g> <g> <path d="M36.001,52.917c-5.791,0-10.501-4.709-10.501-10.5c0-5.79,4.711-10.5,10.501-10.5c5.789,0,10.5,4.71,10.5,10.5 C46.501,48.208,41.79,52.917,36.001,52.917z M36.001,33.917c-4.688,0-8.501,3.814-8.501,8.5c0,4.688,3.813,8.5,8.501,8.5 c4.686,0,8.5-3.813,8.5-8.5C44.501,37.731,40.687,33.917,36.001,33.917z"></path> </g> <g> <path d="M32.073,39.809c-0.242,0-0.484-0.088-0.677-0.264c-0.406-0.375-0.433-1.008-0.059-1.414 c0.2-0.217,0.415-0.422,0.644-0.609c0.428-0.352,1.058-0.291,1.408,0.137c0.352,0.426,0.29,1.057-0.136,1.408 c-0.158,0.129-0.307,0.27-0.444,0.418C32.612,39.7,32.342,39.809,32.073,39.809z"></path> </g> <g> <path d="M36.001,48.75c-3.494,0-6.335-2.842-6.335-6.334c0-0.553,0.448-1,1-1c0.553,0,1,0.447,1,1 c0,2.391,1.945,4.334,4.335,4.334c0.553,0,1,0.447,1,1S36.554,48.75,36.001,48.75z"></path> </g> <g> <path d="M35.876,18.25c-1.105,0-2-0.896-2-2v-6c0-1.104,0.895-2,2-2c1.104,0,2,0.896,2,2v6 C37.876,17.354,36.979,18.25,35.876,18.25z"></path> </g> <g> <path d="M24.353,18.93c-0.732,0-1.437-0.402-1.788-1.101l-1.852-3.68c-0.497-0.987-0.1-2.189,0.888-2.686 c0.985-0.498,2.188-0.101,2.686,0.887l1.852,3.68c0.496,0.987,0.099,2.189-0.888,2.686C24.962,18.861,24.655,18.93,24.353,18.93z"></path> </g> <g> <path d="M12.684,23.567c-0.548,0-1.094-0.224-1.488-0.663l-2.6-2.894c-0.738-0.822-0.671-2.087,0.151-2.824 c0.82-0.74,2.085-0.672,2.824,0.15l2.6,2.894c0.738,0.822,0.67,2.087-0.151,2.824C13.638,23.398,13.16,23.567,12.684,23.567z"></path> </g> <g> <path d="M46.581,18.93c-0.303,0-0.609-0.068-0.898-0.214c-0.986-0.496-1.383-1.698-0.887-2.686l1.852-3.68 c0.494-0.985,1.695-1.386,2.686-0.887c0.986,0.496,1.385,1.698,0.887,2.686l-1.852,3.68C48.019,18.527,47.313,18.93,46.581,18.93z "></path> </g> <g> <path d="M58.249,23.567c-0.475,0-0.953-0.169-1.336-0.513c-0.82-0.737-0.889-2.002-0.15-2.824l2.6-2.894 c0.738-0.82,2.002-0.89,2.824-0.15c0.822,0.737,0.889,2.002,0.15,2.824l-2.6,2.894C59.343,23.344,58.798,23.567,58.249,23.567z"></path> </g> </g> </g></svg>             
: <span class="data">${move.accuracy}</span>
              </div>

              <div class="retreat-data data-wrapper">
                <svg
                  fill="#000000"
                  width="17px"
                  height="17px"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      d="M7.493,22.862a1,1,0,0,0,1.244-.186l11-12A1,1,0,0,0,19,9H13.133l.859-6.876a1,1,0,0,0-1.8-.712l-8,11A1,1,0,0,0,5,14H9.612l-2.56,7.684A1,1,0,0,0,7.493,22.862ZM6.964,12l4.562-6.273-.518,4.149A1,1,0,0,0,12,11h4.727l-6.295,6.867,1.516-4.551A1,1,0,0,0,11,12Z"
                    ></path>
                  </g>
                </svg>
                : <span class="data">${move.retreat}</span>
              </div>
            </div>
        </div>

      </div>
        <button class="info-btn" onclick="toggleMoveInfo(this.nextElementSibling)">&#8505;</button>
       <div class="info-wrapper ">
        <div class="header">
        <strong class="move-name">${move.name}</strong>
        <button class="close-btn" onclick="toggleMoveInfo(this.parentNode.parentNode)">&#10060;</button>
        </div>
        
        ${'⭐ '.repeat(move._meta.grade ?? 0)}
        <div class="info damage">
         <strong>Damage:</strong><span class="data">${Math.round(damage.count * (1 / 70))}</span>
        </div>
        <small class="desc">
         ${move.description()}
              </small>
              <br/>
           <button class="remove-btn" onclick="removeMove('${playerTag}', '${move.id}')">Remove</button>   
      </div>
    </div>
    `
    moveCardsContainer.innerHTML += cardHtml
  }
  const addFieldMoveBtnHtml = `
     <div onclick="showFieldMoveForm('${playerTag}')" class="add-field-move-btn">
      <span> Add Move </span>
     </div>
  `
  moveCardsContainer.innerHTML += addFieldMoveBtnHtml
}
globalThis.showMoveDetails = function ({ currentTarget }) {
  const form = currentTarget.parentElement
  const move = new Move(currentTarget.value)
  if (move) {
    const moveDetails = form.querySelector(".move-details")
    moveDetails.querySelector(".move-name").textContent = move.name
    moveDetails.querySelector(".desc").textContent = move.description() + '\n' + JSON.stringify({
      power: move.basePower,
      category: move.category,
      priority: move.priority
    }, null, 2)
  }
}
globalThis.showFieldMoveForm = (playerTag) => {
  const fieldMoveForm = document.querySelector(".field-move-form")
  const name = fieldMoveForm.querySelector(".name")
  const moveInput = fieldMoveForm.querySelector(".move-input")
  const percentInput = fieldMoveForm.querySelector(".percent-input")
  const addBtn = fieldMoveForm.querySelector(".add-btn")
  const cancelBtn = fieldMoveForm.querySelector(".cancel-btn")

  fieldMoveForm.parentElement.classList.add("active")
  name.textContent = playerTag
  addBtn.onclick = () => {

    addFieldMove(playerTag, moveInput.value, percentInput.value)
    moveInput.value = ""
    fieldMoveForm.parentElement.classList.remove("active")

  }
  cancelBtn.onclick = () => {
    moveInput.value = ""
    fieldMoveForm.parentElement.classList.remove("active")

  }
}
 async function confirmBotScene() {
   const botMoveConfirmBtn = document.querySelector("#bot-move-confirm-btn")
   botMoveConfirmBtn.classList.add("active")
   return new Promise((resolve) => {
      const oldBattlers = Object.values(pokemonMap).map(p => p.name)
      botMoveConfirmBtn.onclick = () => {
        botMoveConfirmBtn.classList.remove("active")
        resolve(true)
      }
      eventEmitter.on("switch-pokemon-select", (playerTag, currentTarget) => {
        const currentBattlers = Object.values(pokemonMap).map(p => p.name)        
        if (oldBattlers[0] === currentBattlers[0] && oldBattlers[1] === currentBattlers[1]) return
        botMoveConfirmBtn.classList.remove("active")
        resolve(false)
        botMoveConfirmBtn.onclick = null
        eventEmitter.removeListener("switch-pokemon-select", "refresh-confirm-bot-btn")
      }, "refresh-confirm-bot-btn")
   })
  }

eventEmitter.on("move-card-select", async (card, playerTag) => {
  if (card.classList.contains("disabled")) return
  const oponentPlayerTag = playerTag === "you" ? "enemy" : "you"
  const oponentSelectedMoveCard = document.querySelector(`.${oponentPlayerTag}-controle-cont .card-container .card.selected`)

  if (oponentSelectedMoveCard) {
    card.classList.add("selected")
    
    const bothBot = pokemonMap[playerTag].meta.isBot && pokemonMap[oponentPlayerTag].meta.isBot
    
    if (bothBot) {
      const confirmBotMode = await confirmBotScene()
      if (!confirmBotMode) {
        return
      }
    }

    runScene({
      [playerTag]: card.dataset.moveId,
      [oponentPlayerTag]: oponentSelectedMoveCard.dataset.moveId
    }).catch(console.log)
    oponentSelectedMoveCard.classList.remove("selected")
    card.classList.remove("selected")

  } else {
    card.parentElement.parentElement.querySelector(".card.selected")?.classList.remove("selected")
    card.classList.add("selected")
  }
})

globalThis.moveCardClickHandler = function ({
  currentTarget
}, playerTag) {
  eventEmitter.emit("move-card-select", currentTarget, playerTag)
}

globalThis.removeItem = function (id, playerTag) {
  pokemonMap[playerTag].items.remove(id)

  try {
    pokemonMap[playerTag].state.armor.remove(id)
  } catch (error) { }
  loadItems(playerTag)
  loadTokenStats(playerTag)
}

async function runScene(moveIds) {
  const { you: moveId, enemy: enemyMoveId } = moveIds
  const move1 = new Move(moveId)
  const move2 = new Move(enemyMoveId)
  const isAlly = pokemon.state.isAlly(enemyPokemon)
  
  const oldActive = battle.getActive("you")
  const oldOppo = battle.getActive("enemy")
  
  if (isAlly) {
    battle.activate(pokemon, "you")
    battle.activate(enemyPokemon, "enemy")
  }

  const senario = new Map([
    [pokemon, move1],
    [enemyPokemon, move2],
  ])
  await battle.run(senario)

  if (isAlly) {
    battle.activate(oldActive, "you")
    battle.activate(oldOppo, "enemy")
  }
}



function loadRetreat(playerTag) {
  const retreat = pokemonMap[playerTag].meta.retreat
  setRetreatPerWave(retreat, playerTag)
}

function loadHealth(playerTag) {
  const hp = pokemonMap[playerTag].stats.hp
  setTotalHealth("health", hp, playerTag)
}
function loadAHealth(playerTag) {
  const hp = pokemonMap[playerTag].state.armor.maxhp()
  setTotalHealth("armor-hp", hp, playerTag)
}


function loadAbilities(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const abilities = pokemon.abilities._abilities

  const playerSettingsForm = document.querySelector('.player-settings-form')
  const abilitiesWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.abilities .wrapper')
  abilitiesWrapper.innerHTML = ''
  for (const ability of abilities) {
    abilitiesWrapper.innerHTML += ` <button data-retreat="${ability._ability?.retreat || '?'}" type="button" onclick="toggleAbility(event,'${playerTag}','${ability.name}')" class="ability ${ability.active ? 'active' : ''}">${ability.name}</button>`
  }
}
/*function loadHealth(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const abilities = pokemon.abilities._abilities
  
  const playerSettingsForm = document.querySelector('.player-settings-form')
  const abilitiesWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.abilities .wrapper')
  abilitiesWrapper.innerHTML = ''
  for (const ability of abilities) {
    abilitiesWrapper.innerHTML += ` <button data-retreat="${ability._ability.retreat}" type="button" onclick="toggleAbility(event,'${playerTag}','${ability.name}')" class="ability ${ability.active ? 'active' : ''}">${ability.name}</button>`
  }
}*/
function loadItems(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const items = pokemon.items._items

  const playerSettingsForm = document.querySelector('.player-settings-form')
  const itemsWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.items .wrapper')
  itemsWrapper.innerHTML = ''
  for (const item of items) {
    itemsWrapper.innerHTML += `         
     <div class="item">
                <span class="name">${item.id}</span>
                ${item.type === "armor" ? `<span class="cover-percentage">( ${item.covers}% )</span>` : ""}

                <button onclick="removeItem('${item.id}', '${playerTag}')" class="remove-btn">x</button>
                </div>
`
  }
}
function loadTokenStats(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const tokenStats = structuredClone(pokemon.tokens)
  let sortedStats = {}
  for (const key of Object.keys(tokenStats)) {
   sortedStats[key] = pokemon.state.stats.get(key)
  }
  // now i will sort the obj by the value
  sortedStats = Object.fromEntries(
    Object.entries(sortedStats).sort((a, b) => b[1] - a[1])
  )
  let i = 1
  for (const key in sortedStats) {
    tokenStats[`${i++}. ${key}`] = `${sortedStats[key]} (${tokenStats[key] < 0 ? '' : '+'}${tokenStats[key]})`
    delete tokenStats[key] 
  }
  
  const playerSettingsForm = document.querySelector('.player-settings-form')
  const preStats = playerSettingsForm.querySelector('.settings-wrapper .settings.token-stats .stats')
  preStats.innerHTML = JSON.stringify(tokenStats, null, 2)
} 
globalThis.toggleAbility = function ({ currentTarget }, playerTag, ability_name) {
  currentTarget.classList.toggle("active")
  pokemonMap[playerTag].abilities.toggle(ability_name);
  loadTokenStats(playerTag)
  loadPokemonData(playerTag)
  loadPokemonData(opponentTag(playerTag))
  loadAbilities(playerTag)
}



function clickOnFirstPokemonSwitch(playerTag,mirror = false) {
  const pokemonSwitchControler = document.querySelector(`.${playerTag}-controle-cont .pokemon-switch-controler`)
  if (mirror) {
    pokemonSwitchControler.querySelector(`.pokemon.mirror`).click()
  }else {
  pokemonSwitchControler.querySelector(`.pokemon`).click()
  }
}

window.onload = () => {
  globalThis.pokemonMap = {}
  globalThis.fields = getParam("fields")?.split(',').filter(Boolean) ?? []
  loadTeams()
  registerBattle()
  loadChoosePokemon("you")
  loadChoosePokemon("enemy")
  loadMovesDatalist("moves-data-list")
  clickOnFirstPokemonSwitch("you")
  clickOnFirstPokemonSwitch("enemy")
  setBattleListeners()
}


