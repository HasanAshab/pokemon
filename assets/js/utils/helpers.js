export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function toTitleCase(str) {
  return str.replace("-", " ").replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
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
   console.log(value)
    const pokemons_meta = getPokemonsMeta()
    pokemons_meta[name] = value
    localStorage.setItem("pokemons-meta", JSON.stringify(pokemons_meta))
}

export function fixFloat(damage) {
    return damage === null
        ? null
        : parseFloat(damage.toFixed(2));
}