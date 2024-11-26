import db from "./utils/db.js"
import { Pokemon } from "./utils/models.js"


function setStat(name, value) {
  const stat = document.querySelector(`.stats .stat.${name}`)
  stat.setAttribute("data-value", value)
}
function statClickHandler( {
  currentTarget
}) {
  const statUpdateForm = document.querySelector(".stat-update-form")
  const statNameElm = statUpdateForm.querySelector(".stat-name")
  const statValueInp = statUpdateForm.querySelector(".stat-value-inp")
  const saveBtn = statUpdateForm.querySelector(".save-btn")
  const cancelBtn = statUpdateForm.querySelector(".cancel-btn")

  statUpdateForm.parentNode.classList.add("active")
  statNameElm.textContent = currentTarget.querySelector("strong").textContent
  statValueInp.value = currentTarget.getAttribute("data-value")

  saveBtn.onclick = ()=> {
    setStat(currentTarget.classList[1], statValueInp.value)
  statUpdateForm.parentNode.classList.remove("active")
  }
  cancelBtn.onclick = ()=>{
      statUpdateForm.parentNode.classList.remove("active")
  }
}
function showMoveChooseInterface() {
  
}


window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const displayName = name.charAt(0).toUpperCase() + name.slice(1)
    document.getElementById("pokemon-name").innerText = displayName

    const meta = await db.pokemons_meta.get(name)
    const pokemon = await Pokemon.make(name, meta)

    setStat("level", pokemon.meta.level)
    setStat("retreat", pokemon.meta.retreat)
    for (const stat in pokemon.data.stats) {
      setStat(stat, pokemon.data.stats[stat])
    }
}