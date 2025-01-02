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
  const pokemons_meta = JSON.parse(localStorage.getItem("pokemons-meta"))
    pokemonList.innerHTML = ""
  for (const pokemon in pokemons_meta) {
    const meta = pokemons_meta[pokemon]
    pokemonList.innerHTML += `
    <li class="pokemon" >
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
}
document.body.onload = loadAll
// const originalSetItem = localStorage.setItem;

// localStorage.setItem = function(key, value) {
//     console.log(key, value);
//     originalSetItem.call(this, key, value); // Call the original setItem
// };


import { startBattle, startUserBattle } from "./utils/dom.js";
//window.location = "http://localhost:8888/battle.html?enemy=eyJpZCI6Imdhc3RseSIsIm1ldGEiOnsieHAiOjcwMCwibmF0dXJlIjoiam9sbHkiLCJyZXRyZWF0IjozLCJtb3ZlcyI6W3siaWQiOiJjb25mdXNlcmF5IiwiaXNTZWxlY3RlZCI6dHJ1ZX0seyJpZCI6ImxpY2siLCJpc1NlbGVjdGVkIjp0cnVlfSx7ImlkIjoicG9pc29ucG93ZGVyIiwiaXNTZWxlY3RlZCI6dHJ1ZX1dLCJzdGF0cyI6e30sInRva2VuX3VzZWQiOnt9fX0=,eyJpZCI6Im1pc2RyZWF2dXMiLCJtZXRhIjp7InhwIjoxMjAwLCJuYXR1cmUiOiJicmF2ZSIsInJldHJlYXQiOjMsIm1vdmVzIjpbeyJpZCI6InNoYWRvd3N0cmlrZSIsImlzU2VsZWN0ZWQiOnRydWV9LHsiaWQiOiJuaWdodHNoYWRlIiwiaXNTZWxlY3RlZCI6dHJ1ZX0seyJpZCI6ImN1cnNlIiwiaXNTZWxlY3RlZCI6dHJ1ZX1dLCJzdGF0cyI6e30sInRva2VuX3VzZWQiOnt9fX0=&fields=Ghost"
//startUserBattle("team-rocket", ["Ground", "Rock"])

//window.location = "http://localhost:8888/battle.html?enemy=eyJpZCI6ImJhcmJvYWNoIiwibWV0YSI6eyJ4cCI6MTYwMCwibmF0dXJlIjoiYnJhdmUiLCJyZXRyZWF0IjozLCJtb3ZlcyI6W3siaWQiOiJ3YXRlcmd1biIsImlzU2VsZWN0ZWQiOnRydWV9LHsiaWQiOiJhcXVhamV0IiwiaXNTZWxlY3RlZCI6dHJ1ZX0seyJpZCI6InRhaWxzbGFwIiwiaXNTZWxlY3RlZCI6dHJ1ZX0seyJpZCI6Im11ZHNsYXAiLCJpc1NlbGVjdGVkIjp0cnVlfV0sInN0YXRzIjp7fSwidG9rZW5fdXNlZCI6e319fQ==&fields="

// startBattle({
//   "bulbasaur": {
//     "xp": 100,
//     "nature": "calm",
//     "retreat": 2,
//     "moves": [
//         {
//             id: "razorleaf",
//             isSelected: true
//         }
//     ],
//     "stats": {},
//     "token_used": {}
//   }
// }, ["Grass"])
// 
// 