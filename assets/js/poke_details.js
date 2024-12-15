import { loadNaturesDataList, loadMovesDatalist } from "./utils/dom.js";
import { Pokemon, Move } from "./utils/models.js"
import { capitalizeFirstLetter, getParam, getPokemonsMeta, setPokemonMeta, fixFloat } from "./utils/helpers.js"
import { calculateBaseDamage } from "./utils/damage.js"
import db from "./utils/db.js"


const name = getParam("name")
const updatablePokemonMetaList = ["retreat","xp","nature"]

function setTotalHealth(totalHp) {
  const healthProgressBar = document.querySelector(".health-progress-bar")
  const hp = healthProgressBar.getAttribute("data-current-hp")
  const progress = (hp / totalHp) * 100
 healthProgressBar.setAttribute("data-total-hp", totalHp)
  healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0: progress}%`
  healthProgressBar.querySelector(".total-hp").textContent = totalHp

}
function setCurrentHealth(hp) {
   const healthProgressBar = document.querySelector(".health-progress-bar")
   const totalHp = Number(healthProgressBar.getAttribute("data-total-hp"))
   const progress = (hp / totalHp) * 100
   healthProgressBar.setAttribute("data-current-hp", hp)
   healthProgressBar.querySelector(".current-hp").textContent = hp
   healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0: progress}%`
}

function setStat(slug, value) {
  const stat = document.querySelector(`.stats .stat.${slug}`)
   if (updatablePokemonMetaList.includes(slug)){
     const meta = getPokemonsMeta(name) 
     meta[slug] = value
    setPokemonMeta(name,meta)
  }else{
     if (slug === "hp")
    setTotalHealth(value)
  }
  stat.setAttribute("data-value", value)
}
function setStatToken(slug,value,shouldSetMeta = true){
   if (!updatablePokemonMetaList.includes(slug)){
       const stat = document.querySelector(`.stats .stat.${slug}`)
    if (shouldSetMeta){ 
     const meta = getPokemonsMeta(name) 
     meta.token_used[slug] = parseInt(value)
     setPokemonMeta(name,meta)
    }
      stat.setAttribute("data-token-used",value)
  }
}

function totalTokenUsed() {
    return Object.keys(getPokemonsMeta(name).token_used)
    .reduce((acc,stat) => acc + getPokemonsMeta(name).token_used[stat], 0)
}
globalThis.openEnemyChooseInterface = function() {
  window.location = `enemy.html?name=${name}`
}
globalThis.healthProgressBarClickHandler = function ({currentTarget}){
const oldCurrentHp = currentTarget.getAttribute('data-current-hp')
let newHp = prompt("Set current HP:",oldCurrentHp)
if (newHp && newHp !== oldCurrentHp){
   const meta = getPokemonsMeta(name)
   meta.stats.hp = newHp
   setPokemonMeta(name,meta)
   setCurrentHealth(newHp)
}
}
globalThis.statClickHandler = function( {
  currentTarget
}) {
  const statSlug = currentTarget.classList[1]
  const statUpdateForm = document.querySelector(".stat-update-form")
  const statNameElm = statUpdateForm.querySelector(".stat-name")
  const statValueInp = statUpdateForm.querySelector(".stat-value-inp")
  const saveBtn = statUpdateForm.querySelector(".save-btn")
  const cancelBtn = statUpdateForm.querySelector(".cancel-btn")
  let attributeName = "data-value"
  
  statUpdateForm.parentNode.classList.add("active")
  statNameElm.textContent = currentTarget.querySelector("strong").textContent
   
  if (updatablePokemonMetaList.includes(statSlug)){
    if (statSlug === "nature")
   statValueInp.setAttribute('list',"natures-data-list")
  } else{
   attributeName = "data-token-used"
   document.getElementById("remaining-token").textContent = (Pokemon.calculateLevel(getPokemonsMeta(name).xp) * 2) - totalTokenUsed()
   }
   
  statValueInp.value = currentTarget.getAttribute(attributeName)

  saveBtn.onclick = ()=> {
   if (attributeName === "data-value")
    setStat(statSlug, statValueInp.value)
   else 
    setStatToken(statSlug,statValueInp.value)
   statUpdateForm.parentNode.classList.remove("active")
   statValueInp.removeAttribute('list')
  }
  cancelBtn.onclick = ()=>{
      statUpdateForm.parentNode.classList.remove("active")
 
   statValueInp.removeAttribute('list')
  }
}



globalThis.showMoveChooseInterface = function() {
    const moveChooseInterface = document.querySelector(".move-choose-interface");
    moveChooseInterface.parentNode.classList.add("active");
    loadMovesDatalist("move-data-list")
  }

globalThis.closeMoveChooseInterface = function() {
    const moveChooseInterface = document.querySelector(".move-choose-interface");
    moveChooseInterface.parentNode.classList.remove("active");
}
globalThis.learnMove = async function() {
    const moveId = document.getElementById("move-search-inp").value
    const meta = getPokemonsMeta(name)
    
    if (meta.moves.find(move => move.id === moveId)) {
        return
    }
    meta.moves.push({
        id: moveId,
        isSelected: false
    })
    setPokemonMeta(name, meta)
    closeMoveChooseInterface()
    loadMoves()
}


globalThis.selectMove = function(moveId) {
    const meta = getPokemonsMeta(name)
    meta.moves = meta.moves.map(move => {
        if (move.id === moveId) {
            move.isSelected = true
        }
        return move
    })
    setPokemonMeta(name, meta)
    loadMoves()
}

globalThis.unselectMove = function(moveId) {
    const meta = getPokemonsMeta(name)
    meta.moves = meta.moves.map(move => {
        if (move.id === moveId) {
            move.isSelected = false
        }
        return move
    })
    setPokemonMeta(name, meta)
    loadMoves()
}

globalThis.forgetMove = function(id) {
    const meta = getPokemonsMeta(name)
    meta.moves = meta.moves.filter(move => move.id !== id)
    setPokemonMeta(name, meta)
    loadMoves()
}

function loadName() {
    const displayName = capitalizeFirstLetter(name)
    document.getElementById("pokemon-name").innerText = displayName
}

function loadStats() {
    const meta = getPokemonsMeta(name)
    const pokemon = new Pokemon(name, meta)

    setCurrentHealth(meta.stats.hp ?? pokemon.stats.hp)
    setStat("level", pokemon.level)
    setStat("nature", pokemon.meta.nature)
    setStat("xp", pokemon.meta.xp)
    setStat("retreat", pokemon.meta.retreat)
    
    setStat("weight", (pokemon.getWeight() / 10) + "kg")

    for (const stat in pokemon.stats) {
     const statValue = pokemon.stats[stat]
      setStat(stat,statValue)
      setStatToken(stat,meta.token_used[stat],false)
      if (stat === "hp"){
          setTotalHealth(statValue)
      }
    }
}

function loadMoves() {
    const movesContainer = document.getElementById("moves-container")
    movesContainer.innerHTML = ""
    const meta = getPokemonsMeta(name)
    const pokemon = new Pokemon(name, meta)
    for (const moveMeta of meta.moves) {
        const move = new Move(moveMeta.id)
        const damage = fixFloat(calculateBaseDamage(pokemon, move))
        movesContainer.innerHTML += `
    <div class="move ${moveMeta.isSelected ? "selected" : ""}">
    <div class="move-header" style="background-color: var(--${move.type}-type-color);">
      <span>${move.name}</span>
      <div class="move-icons">
        <img class="type-img" src="./assets/img/types/${move.type}.png"/>
        <img class="category-img" src="./assets/img/categories/${move.category}.png"/>
      </div>
    </div>
    <div class="move-body">
      <p>
        ${damage !== null ? "Damage: " + damage : ""}
      </p>
      <p>
        ${move.basePower !== null ? "Power: " + move.basePower : ""}
      </p>
      <p>
        Retreat: ${move.retreat}
      </p>
      <p>
        PP: ${move.pp}
      </p>
      <small class="desc">${move.description}</small>
      <div class="btn-cont">
        <button class="unselect-move" onclick="unselectMove('${move.id}')">Unselect</button>
        <button class="select-move" onclick="selectMove('${move.id}')">Select</button>
        <button class="forget-move" onclick="forgetMove('${move.id}')">Forget Move</button>
      </div>
    </div>
  </div>
    
    `  
    }
}

window.onload = () => {
    loadNaturesDataList("natures-data-list")
    loadName()
    loadMoves()
    loadStats()
}