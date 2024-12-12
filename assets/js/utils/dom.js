import pokemons from "../../../data/pokemons.js"
import moves from "../../../data/moves.js"
import natures from "../../../data/natures.js"


export function loadPokemonsDatalist(id) {
  const dataList = document.getElementById(id);
  const html = Object.keys(pokemons)
    .map(id => `<option value="${id}">${pokemons[id].name} (${pokemons[id].types.join(", ")})</option>`)
    .join("")
  dataList.innerHTML = html;
}

export function loadMovesDatalist(id) {
  const dataList = document.getElementById(id);
  const html = Object.keys(moves)
    .map(id => `<option value="${id}">${moves[id].name} (${moves[id].type})</option>`)
    .join("")
  dataList.innerHTML = html;
}

export function loadNaturesDataList(id){
  const dataList = document.getElementById(id);
  const html = Object.keys(natures)
    .map(id => `<option value="${id}">${natures[id].name} | ${natures[id].description}</option>`)
    .join("")
  dataList.innerHTML =  html
}