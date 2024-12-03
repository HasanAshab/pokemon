import { Pokemon, Move } from "./utils/models.js"
import { capitalizeFirstLetter, getParam, getPokemonsMeta, setPokemonMeta } from "./utils/helpers.js"
import { calculateDamage } from "./utils/damage.js"
import db from "./utils/db.js"


const name = getParam("name")

function setTotalHealth(hp) {
  const healthProgressBar = document.querySelector(".health-progress-bar")
  healthProgressBar.setAttribute("data-total-hp", hp)
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".inner").style.width = '100%'
  healthProgressBar.querySelector(".current-hp").textContent = hp
  healthProgressBar.querySelector(".total-hp").textContent = hp

}
function setCurrentHealth(hp) {
  const healthProgressBar = document.querySelector(".health-progress-bar")
  const totalHp = Number(healthProgressBar.getAttribute("data-total-hp"))
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".current-hp").textContent = hp
  const progress = (hp / totalHp) * 100
  healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0: progress}%`
}

function setStat(_name, value) {
  const stat = document.querySelector(`.stats .stat.${_name}`)
   const updatableMetaList = ["retreat","xp","nature"]

  stat.setAttribute("data-value", value)
  if (_name === "hp")
    setTotalHealth(value)
  else if (updatableMetaList.includes(_name)){
    //_name is local and "name" is global
     const meta = getPokemonsMeta(name) 
     meta[_name] = value
    setPokemonMeta(name,meta)
  }
}

globalThis.openEnemyChooseInterface = function() {
  window.location = `enemy.html?name=${name}`
}
globalThis.healthProgressBarClickHandler = function ({currentTarget}){
const oldCurrentHp = currentTarget.getAttribute('data-current-hp')
const newHp = prompt("Set current HP:",oldCurrentHp)
if (newHp && newHp !== oldCurrentHp){
   setCurrentHealth(newHp)
}
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
    
    if (meta.moves.find(move => move.name === moveName)) {
        return
    }

    meta.moves.push({
        name: moveName,
        isSelected: false
    })
    setPokemonMeta(name, meta)
    closeMoveChooseInterface()
    loadMoves()
}


globalThis.selectMove = function(moveName) {
    const meta = getPokemonsMeta(name)
    meta.moves = meta.moves.map(move => {
        if (move.name === moveName) {
            move.isSelected = true
        }
        return move
    })
    setPokemonMeta(name, meta)
    loadMoves()
}

globalThis.unselectMove = function(moveName) {
    const meta = getPokemonsMeta(name)
    meta.moves = meta.moves.map(move => {
        if (move.name === moveName) {
            move.isSelected = false
        }
        return move
    })
    setPokemonMeta(name, meta)
    loadMoves()
}

globalThis.forgetMove = function(moveName) {
    const meta = getPokemonsMeta(name)
    meta.moves = meta.moves.filter(move => move.name !== moveName)
    setPokemonMeta(name, meta)
    loadMoves()
}

function loadName() {
    const displayName = capitalizeFirstLetter(name)
    document.getElementById("pokemon-name").innerText = displayName
}

async function loadStats() {
    const meta = getPokemonsMeta(name)
    const pokemon = await Pokemon.make(name, meta)

    setStat("level", pokemon.level)
    setStat("nature", pokemon.meta.nature)
    setStat("xp", pokemon.meta.xp)
    setStat("retreat", pokemon.meta.retreat)
  
    for (const stat in pokemon.data.stats) {
      setStat(stat, pokemon.data.stats[stat])
      if (stat === "hp"){
          setTotalHealth(pokemon.data.stats[stat])
      }
    }
}
async function loadMoves() {
    const movesContainer = document.getElementById("moves-container")
    movesContainer.innerHTML = ""
    const meta = getPokemonsMeta(name)
    const pokemon = await Pokemon.make(name, meta)
    for (const moveMeta of meta.moves) {
        const move = await Move.make(moveMeta.name)
        const damages = await calculateDamage(pokemon, move)
        const damage = damages[1].totalDamage
        movesContainer.innerHTML += `
    <div class="move ${moveMeta.isSelected ? "selected" : ""}">
    <div class="move-header" style="background-color: var(--${move.type}-type-color);">
      <span>${move.display}</span>
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
      <small class="desc">${move.description}</small>
      <div class="btn-cont">
        <button class="unselect-move" onclick="unselectMove('${move.name}')">Unselect</button>
        <button class="select-move" onclick="selectMove('${move.name}')">Select</button>
        <button class="forget-move" onclick="forgetMove('${move.name}')">Forget Move</button>
      </div>
    </div>
  </div>
    
    `  
    }
}

window.onload = () => {
    loadName()
    
    setTimeout(() => {
        loadMoves()
        loadStats()
    }, 1000)


}