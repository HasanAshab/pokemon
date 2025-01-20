import { Pokemon } from "./utils/models.js";
import { getPokemonsMeta, setPokemonMeta } from "./utils/helpers.js";
import { loadPokemonsDatalist, loadNaturesDataList } from "./utils/dom.js";


var totalBadgesCount =  0
const badgesDataStr = localStorage.getItem("badges-data")
const badgesData = JSON.parse(badgesDataStr) || [0, 0, 0, 0, 0, 0, 0, 0, 0,0,0,0,0,0,0,0,0,0,0,0]
const totalBadges = document.getElementById("total-badges")
function loadTotalBadges() {
  totalBadges.textContent = totalBadgesCount
}

function loadActiveBadges() {
  const badges = document.querySelectorAll(".badges-cont >.badge")
  badges.forEach((badge, index)=> {
    if (badgesData[index]){
      badge.classList.add("active")
      totalBadgesCount++
    }
  })
  loadTotalBadges()
}

globalThis.badgeClickHandler = function badgeClickHandler( {
  currentTarget
}) {
  const classList = currentTarget.classList
  const index = currentTarget.getAttribute("data-index")
  if (classList.contains("active")) {
    classList.remove("active")
    totalBadgesCount--
    badgesData[index] = 0
  } else {
    classList.add("active")
    totalBadgesCount++
    badgesData[index] = 1
  }
  localStorage.setItem("badges-data", JSON.stringify(badgesData))
  loadTotalBadges()
}
function updateTotalBattlesCount(){
   const winsCount = Number(localStorage.getItem("user-wins-count"))
   const losesCount = Number(localStorage.getItem("user-loses-count"))
   const totalBattlesCountElm = document.querySelector(".total-battles-count")
   totalBattlesCountElm.textContent = winsCount + losesCount
   
}

function setWinsCount(val){
   const winsCountElm = document.querySelector(".wins-count")
   if (val) {
   localStorage.setItem("user-wins-count",val)
   winsCountElm.textContent = val
   updateTotalBattlesCount()
   }else {
   winsCountElm.textContent = localStorage.getItem("user-wins-count") || 0
   }
}
function setLosesCount(val){
   const losesCountElm = document.querySelector(".loses-count")
   if (val) {
   localStorage.setItem("user-loses-count",val)
   losesCountElm.textContent = val
   updateTotalBattlesCount()
   }else {
   losesCountElm.textContent = localStorage.getItem("user-loses-count") || 0
   }
    
}
globalThis.winsCountClickHandler = function({currentTarget}){
   const val = Number(window.prompt("wins count:",currentTarget.textContent))
   setWinsCount(val)
}
globalThis.losesCountClickHandler = function({currentTarget}){
   const val = Number(window.prompt("loses count:",currentTarget.textContent))
   setLosesCount(val)
}
globalThis.increasePokemonWinCount = function(id){
    const meta = getPokemonsMeta(id)
    meta["wins-count"]++
    setPokemonMeta(id, meta)
}
globalThis.increasePokemonLosesCount = function(id){
    const meta = getPokemonsMeta(id)
    meta["loses-count"]++
    setPokemonMeta(id, meta) 
}
globalThis.addPokeBtnClickHandler = function addPokeBtnClickHandler() {
  const addPokemonForm = document.querySelector(".add-pokemon-form")
  const pokemonNameInput = addPokemonForm.querySelector(".pokemon-name")
  const levelInput = addPokemonForm.querySelector(".level")
  const natureInput = addPokemonForm.querySelector(".nature")
  const retreatInput = addPokemonForm.querySelector(".retreat")
  const addBtn = addPokemonForm.querySelector(".add-btn")
  const cancelBtn = addPokemonForm.querySelector(".cancel-btn")
  addPokemonForm.parentNode.classList.add("active")
  addBtn.onclick = ()=> {
    const pokemonsMeta = JSON.parse(localStorage.getItem("pokemons-meta")) || {}
    pokemonsMeta[pokemonNameInput.value] = {
      "xp": (levelInput.value - 1) * 100,
      "nature": natureInput.value,
      "retreat": parseInt(retreatInput.value),
      "stats": {},
      "token_used":{
          "hp":0,
          "spe":0,
          "atk":0,
          "def":0,
          "spa":0,
          "spd":0
      },
      "wins-count":0,
      "loses-count":0,
      "moves": []
    }
    localStorage.setItem("pokemons-meta",JSON.stringify(pokemonsMeta))
    addPokemonForm.parentNode.classList.remove("active")
     loadAllPokemons()
  }
  cancelBtn.onclick = ()=> {
    addPokemonForm.parentNode.classList.remove("active")
  }
}

globalThis.deletePokemon = function deletePokemon(name) {
  const pokemonsMeta = JSON.parse(localStorage.getItem("pokemons-meta")) || {}
  const totalPokemonsCount =  Number(localStorage.getItem("total-pokemons-count")) || 0
  delete pokemonsMeta[name]
  localStorage.setItem("pokemons-meta",JSON.stringify(pokemonsMeta))
 loadAllPokemons()
}

globalThis.pokemonClickHandler = function pokemonClickHandler(slug) {
  window.location = `poke_details.html?name=${slug}`
}

globalThis.healPokemon = function (id) {
    const meta = getPokemonsMeta(id)
    const pokemon = new Pokemon(id, meta)
    meta.stats.hp = pokemon.maxhp
    setPokemonMeta(id, meta)
}

globalThis.healAllBtnHandler = function () {
    Object.keys(getPokemonsMeta()).forEach(healPokemon)
}

function loadAllPokemons() {
  const pokemonList = document.querySelector(".pokemon-list")
  const pokemons_meta = getPokemonsMeta()
   pokemonList.innerHTML = ""
  for (const pokemon in pokemons_meta) {
    const meta = pokemons_meta[pokemon]
    pokemonList.innerHTML += `
    <li class="pokemon" >
     <div class="center-controle-btns-cont">
  <svg onclick="increasePokemonWinCount('${pokemon}')" class="win-btn" width="25px" height="25px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z" fill="#009c1a"></path> </g></svg>
   <svg onclick="increasePokemonLosesCount('${pokemon}')"  class="lose-btn"width="25px" height="25px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z" fill="#ff1212"></path> </g></svg>
    </div>
    <div class="primary" onclick="pokemonClickHandler('${pokemon}')">
    <span class="pokemon-name">${pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}</span>
    <i class="pokemon-level">LVL: ${Pokemon.calculateLevel(meta.xp)}</i>
    </div>
    
    <div class="right-controle-btns-cont">
    <button onclick="healPokemon('${pokemon}')">Heal</button>
    <button class="del-btn" onclick="deletePokemon('${pokemon}')">Delete</button>
    </div>
    </li>
    `
  }
}

globalThis.openEnemyChooseInterface = function() {
  window.location = `enemy.html?name=${name}`
}
function loadFoodCost() {
  const costPerLevel = 300
  const foodCost = document.getElementById("food-cost")
  const cost = Object.values(getPokemonsMeta()).reduce((acc, meta) => {
    return acc + ((meta.xp / 100) * costPerLevel)
  }, 0)
  foodCost.textContent = cost
}


function loadAll() {
  
  loadActiveBadges()
  loadAllPokemons()
  //loadFoodCost()
  loadPokemonsDatalist("pokemons-data-list")
  loadNaturesDataList("natures-data-list")
  setWinsCount()
  setLosesCount()
  updateTotalBattlesCount()
}
document.body.onload = loadAll


import { startBattle, startUserBattle } from "./utils/dom.js";
startUserBattle("malpo",["normal"])
/*
startBattle([
  {
    "id": "dodrio",
    "xp": 1800,
    "nature": "serious",
    "retreat": 5,
    "moves": [
      {
        "id": "furyattack",
        "isSelected": true
      },
      {
        "id": "growl",
        "isSelected": true
      },
      {
        "id": "supersonic",
        "isSelected": true
      },
      {
        "id": "peck",
        "isSelected": true
      },
      {
        "id": "quickattack",
        "isSelected": true
      }
    ],
    "stats": {},
    "token_used": {}
  }
], ["Flying", "Normal"])
*/