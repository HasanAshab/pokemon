import { Pokemon } from "./utils/models.js";
import { getPokemonsMeta } from "./utils/helpers.js";
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
//window.location = "/battle.html?you=charmander&enemy=eyJpZCI6ImJ1bGJhc2F1ciIsIm1ldGEiOnsieHAiOjUwMCwibmF0dXJlIjoiY2FsbSIsInJldHJlYXQiOjIsIm1vdmVzIjpbeyJpZCI6ImFjaWQiLCJpc1NlbGVjdGVkIjp0cnVlfSx7ImlkIjoiYWJzb3JiIiwiaXNTZWxlY3RlZCI6dHJ1ZX1dLCJ0b2tlbl91c2VkIjp7fX19"
//window.location = "/battle.html?you=charmander&enemy=riolu&xp=500&retreat=3&nature=calm&moves=scratch,forcepalm,sleeppowder,crunch,firefang"
//window.location = "/battle.html?you=charmander&enemy=charmander&xp=500&retreat=3&nature=calm&moves=growl,scratch,ember"
//window.location = "/battle.html?you=charmander&enemy=bulbasaur&xp=400&retreat=4&nature=adamant&moves=pound,rage,crunch,razor-leaf,leer"
//window.location = "http://localhost:8888/battle.html?you=haxorus&enemy=charizard-mega-x&xp=3500&retreat=6&nature=adamant&moves=dragon-claw,dragon-dance,earthquake,dragon-pulse,sandsear-storm"
//window.location = "http://localhost:8888/battle.html?you=lucario&enemy=hitmonchan&xp=3600&retreat=6&nature=adamant&moves=karate-chop,vacuum-wave,swords-dance,mega-punch,fire-punch")
