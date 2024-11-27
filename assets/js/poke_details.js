import { Pokemon, Move } from "./utils/models.js"
import { capitalizeFirstLetter, getParam, getPokemonsMeta, setPokemonMeta } from "./utils/helpers.js"
import { calculateDamage } from "./utils/damage.js"
import db from "./utils/db.js"


const name = getParam("name")


function setStat(name, value) {
  const stat = document.querySelector(`.stats .stat.${name}`)
  stat.setAttribute("data-value", value)
}

globalThis.statClickHandler = function( {
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

globalThis.showMoveChooseInterface = async function() {
    const moveChooseInterface = document.querySelector(".move-choose-interface");
    const moveDataList = document.getElementById("move-data-list");
    const moves = await db.moves.all();
    moveChooseInterface.parentNode.classList.add("active");
    moveDataList.innerHTML = moves.map(move => {
        const display = (move.charAt(0).toUpperCase() + move.slice(1))
            .replace(/-/g, " ")
        return`<option value="${move}">${display}</option>`
    }).join("")
  }

globalThis.closeMoveChooseInterface = function() {
    const moveChooseInterface = document.querySelector(".move-choose-interface");
    moveChooseInterface.parentNode.classList.remove("active");
}

globalThis.learnMove = async function() {
    const moveName = document.getElementById("move-search-inp").value
    const meta = getPokemonsMeta(name)
    if (meta.moves.includes(moveName)) return
    meta.moves.push(moveName)
    setPokemonMeta(name, meta)
    closeMoveChooseInterface()
    loadMoves()
}


function loadName() {
    const displayName = capitalizeFirstLetter(name)
    document.getElementById("pokemon-name").innerText = displayName
}

async function loadStats() {
    const meta = getPokemonsMeta(name)
    const pokemon = await Pokemon.make(name, meta)

    setStat("level", pokemon.meta.level)
    setStat("retreat", pokemon.meta.retreat)
    for (const stat in pokemon.data.stats) {
      setStat(stat, pokemon.data.stats[stat])
    }
}
async function loadMoves() {
    const movesContainer = document.getElementById("moves-container")
    movesContainer.innerHTML = ""
    const meta = getPokemonsMeta(name)
    const pokemon = await Pokemon.make(name, meta)
    for (const moveName of meta.moves) {
        const move = await Move.make(moveName)
        const damages = await calculateDamage(pokemon, move)
        const damage = damages[1].totalDamage
        movesContainer.innerHTML += `
    <div class="move selected">
    <div class="move-header" style="background-color: var(--${move.type}-type-color);">
      <span>${capitalizeFirstLetter(move.name)}</span>
      <div class="move-icons">
        <span>🖼️</span>
        <span>🖼️</span>
      </div>
    </div>
    <div class="move-body">
      <p>
        Category: ${capitalizeFirstLetter(move.damage_class)}
      </p>
      <p>
        ${damage !== null ? "Damage: " + damage : ""}
      </p>
      <p>
        ${move.power !== null ? "Power: " + move.power : ""}
      </p>
      <p>
        Retreat: ${move.retreat}
      </p>
      <p>
        PP: ${move.pp}
      </p>
      <small class="desc">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Cum nihil officia assumenda non repudiandae sint velit, recusandae magni suscipit rem delectus obcaecati laudantium beatae dolores. Odit doloribus nemo, eveniet doloremque laudantium nam necessitatibus quo libero eum ea ut cupiditate. Cum corporis culpa, minus! Explicabo ut aliquam magni illum minima expedita.</small>
      <div class="btn-cont">
        <button class="unselect-move">Unselect</button>
        <button class="select-move">Select</button>
        <button class="forget-move">Forget Move</button>
  
      </div>
    </div>
  </div>
    
    `  
    }
}

window.onload = () => {
    loadName()
    loadMoves()
    loadStats()


}