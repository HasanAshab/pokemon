export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


export function getParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

export function getPokemonsMeta(name) {
    const pokemons_meta = JSON.parse(localStorage.getItem("pokemons-meta"))
    if (!name) return pokemons_meta
    return pokemons_meta[name]
}

export function setPokemonMeta(name, value) {
    const pokemons_meta = getPokemonsMeta()
    pokemons_meta[name] = value
    localStorage.setItem("pokemons-meta", JSON.stringify(pokemons_meta))
}