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
    window.location = `poke_details.html?${slug}`
}
function loadAllPokemons() {
    const pokemonList = document.querySelector(".pokemon-list")
    const pokemons = [{
        name: "Charmander",
        slug: "charmander",
        level: 5,
    }]
    pokemonList.innerHTML = ""
    for (const pokemon of pokemons) {
        pokemonList.innerHTML += `
        <li class="pokemon" onclick="pokemonClickHandler('${pokemon.slug}')">
        <span class="pokemon-name">${pokemon.name}</span>
        <span class="pokemon-level">LVL: ${pokemon.level}</span>
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