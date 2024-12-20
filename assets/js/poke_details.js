import { loadNaturesDataList, loadMovesDatalist ,loadPokemonsDatalist } from "./utils/dom.js";
import { Pokemon, Move } from "./utils/models.js"
import { capitalizeFirstLetter, getParam, getPokemonsMeta, setPokemonMeta } from "./utils/helpers.js"
import { Damage } from "./utils/damage.js"
import natures from "../../../data/natures.js"

let name = getParam("name")
const updatablePokemonMetaList = ["retreat","xp","nature"]
globalThis.toggleMoveInfo = function(info){
info.classList.toggle("active")
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
  const stat = document.querySelector(`.stat.${slug}`)
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

globalThis.showPokemonChooseForm = function(){
  const pokemonChooseForm = document.querySelector(".pokemon-choose-form")
  pokemonChooseForm.parentElement.classList.add('active')
  loadPokemonsDatalist("pokemon-data-list")
  
}
globalThis.changePokemon =  function (){
  const pokemonInput = document.querySelector(".pokemon-choose-form > #pokemon-inp")
  const pokemonsMeta =  getPokemonsMeta()
 const temp = pokemonsMeta[name]
 delete pokemonsMeta[name]
 pokemonsMeta[pokemonInput.value] = temp
   localStorage.setItem("pokemons-meta",JSON.stringify(pokemonsMeta))
  name = pokemonInput.value
  loadAll()
 closePokemonChooseForm()
}
globalThis.closePokemonChooseForm = function(){
  const pokemonChooseForm = document.querySelector(".pokemon-choose-form")
  pokemonChooseForm.parentElement.classList.remove('active')
  
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
   document.getElementById("remaining-token").textContent = pokemon.tokensRemaining()
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
globalThis.showChoosedMoveDesc = function(){
    const moveId = document.getElementById("move-search-inp").value
   const desc = document.querySelector(".move-choose-interface > .desc")
   const move = new Move(moveId)
   if(move._move) {
    desc.textContent = move.description()
   }
}
globalThis.closeMoveChooseInterface = function() {
    const moveChooseInterface = document.querySelector(".move-choose-interface");
    moveChooseInterface.parentNode.classList.remove("active");
}
globalThis.learnMove = async function() {
    const moveId = document.getElementById("move-search-inp").value
    
    if (pokemon.meta.moves.find(move => move.id === moveId)) {
        return
    }
    pokemon.meta.moves.push({
        id: moveId,
        isSelected: false
    })
    setPokemonMeta(name, pokemon.meta)
    closeMoveChooseInterface()
    loadMoves()
}


globalThis.selectMove = function(moveId) {
    pokemon.meta.moves = pokemon.meta.moves.map(move => {
        if (move.id === moveId) {
            move.isSelected = true
        }
        return move
    })
    setPokemonMeta(name, pokemon.meta)
    loadMoves()
}

globalThis.unselectMove = function(moveId) {
    pokemon.meta.moves = pokemon.meta.moves.map(move => {
        if (move.id === moveId) {
            move.isSelected = false
        }
        return move
    })
    setPokemonMeta(name, pokemon.meta)
    loadMoves()
}

globalThis.forgetMove = function(id) {
    pokemon.meta.moves = pokemon.meta.moves.filter(move => move.id !== id)
    setPokemonMeta(name, pokemon.meta)
    loadMoves()
}

function loadName() {
    const displayName = capitalizeFirstLetter(name)
    document.getElementById("pokemon-name").innerText = displayName
}


function loadStats() {
   setCurrentHealth(pokemon.meta.stats.hp ?? pokemon.stats.hp)
    setStat("level", pokemon.level)
    setStat("nature", pokemon.meta.nature)
    setStat("xp", pokemon.meta.xp)
    setStat("retreat", pokemon.meta.retreat)
    
    setStat("weight", (pokemon.getWeight() / 10) + "kg")

    for (const stat in pokemon.stats) {
     const statValue = pokemon.stats[stat]
      setStat(stat,statValue)
      setStatToken(stat, pokemon.meta.token_used[stat], false)
      if (stat === "hp"){
          setTotalHealth(statValue)
      }
    }
}

function loadMoves() {
    const movesContainer = document.getElementById("moves-container")
    movesContainer.innerHTML = ""
    for (const moveMeta of pokemon.meta.moves) {
        const move = new Move(moveMeta.id)
        const damage = new Damage(pokemon, move)
   movesContainer.innerHTML +=   `  
   <div class="single-card-wrapper">
      <div class="card  ${moveMeta.isSelected ? "selected" : ""}"  data-move-id="${move.id}" style="outline:1px solid var(--${move.type || "Normal"}-type-color)" data-makes-contact="${!!move.flags.contact}">
          <div class="card-header" style="background-color:var(--${move.type || "Normal"}-type-color)">
            <div class="category-side">
              
              <div class="category-bg"></div>
              <div class="category-bg-triangle"></div>
              <img class="move-category-icon" width="30px" src="./assets/img/categories/${move.category}.png"  />
            </div>
            <div class="right-side">

            <img class="move-type-icon"   width="30px"
            src="./assets/img/types/${move.type}.png"
            
            class="move-type"
          />
            </div>
           
          </div>
          <div class="card-body">
            <div class="primary">
              <p class="move-name">${move.name}</p>
              <span class="pp-data">
                ${move.pp !== null ? `${move.pp} / ${move._move.pp}` : "∞"}
              </span>
            </div>
            <div class="secondary">
             ${move.category !== "Status" ?
             
             ` <div class="power-data">
             ${
              move.flags.contact !== 1 
              ? ` <svg
                  class="bow-icon"
                  width="23px"
                  height="23px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M23.9806 1.19613C24.0462 0.868272 23.9436 0.529333 23.7071 0.292909C23.4707 0.056486 23.1318 -0.0461365 22.8039 0.0194355L17.8039 1.01944C17.2624 1.12775 16.9111 1.65457 17.0194 2.19613C17.1278 2.73769 17.6546 3.08891 18.1961 2.9806L19.9575 2.62832L16.8761 5.70976C14.2376 3.39988 10.7823 2.00002 7.00003 2.00002H1.00003C0.447744 2.00002 2.91966e-05 2.44773 2.91966e-05 3.00002C2.91966e-05 3.5523 0.447744 4.00002 1.00003 4.00002C1.00003 4.25594 1.09766 4.51186 1.29292 4.70712L9.58582 13L8.58582 14H5.00003C4.73481 14 4.48046 14.1054 4.29292 14.2929L0.292922 18.2929C0.00692444 18.5789 -0.0786313 19.009 0.0761497 19.3827C0.230931 19.7564 0.595567 20 1.00003 20H4.00003V23C4.00003 23.4045 4.24367 23.7691 4.61735 23.9239C4.99102 24.0787 5.42114 23.9931 5.70714 23.7071L9.70714 19.7071C9.89467 19.5196 10 19.2652 10 19V15.4142L11 14.4142L19.2929 22.7071C19.4882 22.9024 19.7441 23 20 23C20 23.5523 20.4477 24 21 24C21.5523 24 22 23.5523 22 23V17C22 13.2178 20.6002 9.76247 18.2903 7.12397L21.3717 4.04254L21.0194 5.8039C20.9111 6.34546 21.2624 6.87228 21.8039 6.9806C22.3455 7.08891 22.8723 6.73769 22.9806 6.19613L23.9806 1.19613ZM15.4582 7.12759C13.1847 5.17792 10.2299 4.00002 7.00003 4.00002H3.41424L11 11.5858L15.4582 7.12759ZM12.4142 13L16.8725 8.5418C18.8221 10.8153 20 13.7701 20 17V20.5858L12.4142 13ZM5.41424 16H6.58582L4.58581 18H3.41424L5.41424 16ZM8.00003 18.5858L6.00003 20.5858V19.4142L8.00003 17.4142V18.5858Z"
                      fill="#000000"
                    ></path>
                  </g>
                </svg>
                `
                : `<svg
                  class="sword-icon"
                  width="23px"
                  height="23px"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      d="M16 0H13L3.70711 9.29289L2.20711 7.79289L0.792893 9.20711L3.08579 11.5L1.5835 13.0023C1.55586 13.0008 1.52802 13 1.5 13C0.671573 13 0 13.6716 0 14.5C0 15.3284 0.671573 16 1.5 16C2.32843 16 3 15.3284 3 14.5C3 14.472 2.99923 14.4441 2.99771 14.4165L4.5 12.9142L6.79289 15.2071L8.20711 13.7929L6.70711 12.2929L16 3V0Z"
                      fill="#000000"
                    ></path>
                  </g>
                </svg>`}
                :
                <span class="data">${move.basePower}</span>
              </div>`
              : ``
             }
              <div class="retreat-data">
                <svg
                  fill="#000000"
                  width="23px"
                  height="23px"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      d="M7.493,22.862a1,1,0,0,0,1.244-.186l11-12A1,1,0,0,0,19,9H13.133l.859-6.876a1,1,0,0,0-1.8-.712l-8,11A1,1,0,0,0,5,14H9.612l-2.56,7.684A1,1,0,0,0,7.493,22.862ZM6.964,12l4.562-6.273-.518,4.149A1,1,0,0,0,12,11h4.727l-6.295,6.867,1.516-4.551A1,1,0,0,0,11,12Z"
                    ></path>
                  </g>
                </svg>
                : <span class="data">${move.retreat}</span>
              </div>
            </div>
        </div>

      </div>
        <button class="info-btn" onclick="toggleMoveInfo(this.nextElementSibling)">&#8505;</button>
       <div class="info-wrapper ">
        <div class="header">
        <strong class="move-name">${move.name}</strong>
        <button class="close-btn" onclick="toggleMoveInfo(this.parentNode.parentNode)">&#10060;</button>
        </div>
        
        <div class="info damage">
         <strong>Damage:</strong><span class="data"> ${damage.count}</span>
        </div>
        <small class="desc">
         ${move.description()}
              </small>
          <div class="bottom-btns-cont">
               <button onclick="selectMove('${move.id}')" class="select-btn">Select</button>
                    <button onclick="unselectMove('${move.id}')" class="unselect-btn">Unselect</button>
         <button onclick="forgetMove('${move.id}')" class="forget-btn">Forgot move</button>

          </div>
      
      </div>
    </div>`

     
    }
}

function loadAll(){
      const meta = getPokemonsMeta(name)
    globalThis.pokemon = new Pokemon(name, meta)

    loadNaturesDataList("natures-data-list")
    loadName()
    loadMoves()
    loadStats()
}

window.onload = () => {
loadAll()
}
