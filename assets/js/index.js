import db from './utils/db.js';

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

function badgeClickHandler( {
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
function pokemonClickHandler(slug) {
    window.location = `poke_details.html?name=${slug}`
}

async function loadAllPokemons() {
    const pokemonList = document.querySelector(".pokemon-list");
    const pokemons = await db.pokemons_meta.all();
    pokemonList.innerHTML = "";
    for (const name in pokemons) {
        const pokemon = pokemons[name];
        const listItem = document.createElement("li");
        listItem.classList.add("pokemon");
        listItem.innerHTML = `
            <span class="pokemon-name">${name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <span class="pokemon-level">LVL: ${pokemon.level}</span>
        `;
        listItem.addEventListener("click", () => pokemonClickHandler(name));
        pokemonList.appendChild(listItem);
    }
}


function loadAll() {
    loadTotalBadges()
    loadActiveBadges()
    loadAllPokemons()
}
document.body.onload = loadAll