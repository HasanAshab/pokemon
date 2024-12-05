import db from "./utils/db.js";

<<<<<<< HEAD
function __setDefaultPokeMeta() {
    const pokemons_meta = {
        "charmander": {
            "xp": 2 * 100,
            "nature": "bully",
            "retreat": 2,
            "moves": []
        },
        "froakie": {
            "xp": 2 * 100,
            "nature": "gentle",
            "retreat": 2,
            "moves": []
        },
        "riolu": {
            "xp": 2 * 100,
            "nature": "nauty",
            "retreat": 2,
            "moves": []
        },
        "scyther": {
            "xp": 40 * 100,
            "nature": "nauty",
            "retreat": 8,
            "moves": []
        }
    }
    localStorage.setItem("pokemons-meta", JSON.stringify(pokemons_meta))
}

//localStorage.removeItem("pokemons-meta")
if (!localStorage.getItem("pokemons-meta"))
    __setDefaultPokeMeta()
=======
import {
  Pokemon
} from "./utils/models.js";
import {
  getPokemonsMeta
} from "./utils/helpers.js";
try{
>>>>>>> 2708929904dccb71c214de21a8b18500d90d4331


var totalBadgesCount = localStorage.getItem("total-badges-count") || 0
const badgesDataStr = localStorage.getItem("badges-data")
const badgesData = JSON.parse(badgesDataStr) || [0, 0, 0, 0, 0, 0, 0, 0, 0]
const totalBadges = document.getElementById("total-badges")
function loadTotalBadges() {
  totalBadges.textContent = totalBadgesCount
  localStorage.setItem("total-badges-count", totalBadgesCount)
}

function loadActiveBadges() {
  const badges = document.querySelectorAll(".badges-cont >.badge")
  badges.forEach((badge, index)=> {
    if (badgesData[index])
      badge.classList.add("active")
  })
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
async function loadPokemonsDatalist() {
  const pokemons = await db.pokemons.all();
  const dataList = document.getElementById("pokemons-data-list");
  dataList.innerHTML = pokemons.map(pokemon => `<option value="${pokemon}">${pokemon}</option>`).join("");
}
async function loadNaturesDataList(){
  const natures = await db.natures.all()
  const dataList = document.getElementById("natures-data-list");
  for (const nature in natures ){
  const data = natures[nature]
  dataList.innerHTML +=  `<option value="${nature}">${data.name} | ${data.description}</option>`
}
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
      "retreat": retreatInput.value,
      "stats": {},
      "token_used":{
          "hp":0,
          "speed":0,
          "attack":0,
          "defense":0,
          "special-attack":0,
          "special-defense":0
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
  loadTotalBadges()
  loadActiveBadges()
  loadAllPokemons()
  //loadFoodCost()
  loadPokemonsDatalist()
  loadNaturesDataList()
}
document.body.onload = loadAll
<<<<<<< HEAD

//window.location = "http://localhost:8888/battle.html?you=charmander&enemy=bulbasaur&xp=400&retreat=4&nature=adamant&moves=pound,karate-chop,crunch,razor-leaf,leer"
//window.location = "http://localhost:8888/battle.html?you=haxorus&enemy=garchomp-mega&xp=3500&retreat=6&nature=adamant&moves=dragon-claw,dragon-dance,earthquake,dragon-pulse,sandsear-storm"
window.location = "http://localhost:8888/battle.html?you=scyther&enemy=scizor-mega&xp=3000&retreat=8&nature=naughty&moves=x-scissor,iron-head,steel-beam,harden,slash"
=======
}catch (e){
  console.log(e)
}
//window.location = "http://localhost:8888/battle.html?you=bulbasaur&enemy=bulbasaur&xp=400&retreat=4&nature=adamant&moves=pound,karate-chop,crunch,razor-leaf,leer"
//window.location = "http://localhost:8888/battle.html?you=haxorus&enemy=charizard-mega-x&xp=3500&retreat=6&nature=adamant&moves=dragon-claw,dragon-dance,earthquake,dragon-pulse,sandsear-storm"
//window.location = "http://localhost:8888/battle.html?you=lucario&enemy=hitmonchan&xp=3600&retreat=6&nature=adamant&moves=karate-chop,vacuum-wave,swords-dance,mega-punch,fire-punch")
>>>>>>> 2708929904dccb71c214de21a8b18500d90d4331
