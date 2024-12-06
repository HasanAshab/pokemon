import { Pokemon, Move } from "./utils/models.js"
import { capitalizeFirstLetter, getParam, getPokemonsMeta, setPokemonMeta, fixFloat } from "./utils/helpers.js"
import { calculateBaseDamage } from "./utils/damage.js"
import db from "./utils/db.js"


const name = getParam("name")
const updatablePokemonMetaList = ["retreat","xp","nature"]

async function loadNaturesDataList(){
  const natures = await db.natures.all()
  const dataList = document.getElementById("natures-data-list");
  for (const nature in natures ){
  const data = natures[nature]
  dataList.innerHTML +=  `<option value="${nature}">${data.name} | ${data.description}</option>`
}
}
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
     meta.token_used[slug] = value
     setPokemonMeta(name,meta)
    }
      stat.setAttribute("data-token-used",value)
  }
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



globalThis.showMoveChooseInterface = async function() {
    const moveChooseInterface = document.querySelector(".move-choose-interface");
    const moveDataList = document.getElementById("move-data-list");
    const moves = await db.moves.all();
    moveChooseInterface.parentNode.classList.add("active");
    moveDataList.innerHTML = moves.map(move => {
        return`<option value="${move}">`
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
     // console.log(meta)

    setCurrentHealth(meta.stats.hp ?? pokemon.statOf("hp"))
    setStat("level", pokemon.level)
    setStat("nature", pokemon.meta.nature)
    setStat("xp", pokemon.meta.xp)
    setStat("retreat", pokemon.meta.retreat)

    for (const stat in pokemon.data.stats) {
     const statValue = pokemon.data.stats[stat]
      setStat(stat,statValue)
      setStatToken(stat,meta.token_used[stat],false)
      if (stat === "hp"){
          setTotalHealth(statValue)
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
        const damage = fixFloat(calculateBaseDamage(pokemon, move))
        movesContainer.innerHTML += `
    <div class="move ${moveMeta.isSelected ? "selected" : ""}">
    <div class="move-header" style="background-color: var(--${move.type}-type-color);">
      <span>${move.display}</span>
      <div class="move-icons">
        <img class="type-img" src="./assets/img/${move.type}.png"/>
        <img class="category-img" src="./assets/img/${move.damage_class}.png"/>
      </div>
    </div>
    <div class="move-body">

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
        loadNaturesDataList()
        loadStats()
    }, 1000)


}