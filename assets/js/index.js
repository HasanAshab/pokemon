import { Pokemon } from "./utils/models.js";


function __setDefaultPokeMeta() {
    const pokemons_meta = {
        "charmander": {
            "xp": 2 * 100,
            "nature": "bully",
            "retreat": 2,
            "moves": ["scratch", "growl"]
        },
        "froakie": {
            "xp": 1 * 100,
            "nature": "gentle",
            "retreat": 2,
            "moves": ["water-gun", "tail-whip"]
        }
    }
    localStorage.setItem("pokemons-meta", JSON.stringify(pokemons_meta))
}
__setDefaultPokeMeta()


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
        <li class="pokemon" onclick="pokemonClickHandler('${pokemon}')">
        <span class="pokemon-name">${pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}</span>
        <span class="pokemon-level">LVL: ${Pokemon.calculateLevel(meta.xp)}</span>
        </li>
        `
    }
}


function loadAll() {
    loadTotalBadges()
    loadActiveBadges()
    loadAllPokemons()
}
document.body.onload = loadAll