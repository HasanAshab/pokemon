import { BATTLE_SYSTEMS } from "./utils/battle.js";
import {loadAbilitiesDataList,loadTypesDataList,loadItemsDataList, loadNaturesDataList, loadMovesDatalist ,loadPokemonsDatalist } from "./utils/dom.js";
import { Pokemon, Move } from "./utils/models.js"
import { getParam, getPokemonsMeta, setPokemonMeta } from "./utils/helpers.js"
import { Damage } from "./utils/damage.js"


var name = getParam("name")
var isMegaEvolved = false
const updatablePokemonMetaList = ["items", "types", "abilities", "retreat","xp","nature","wins-count","loses-count"]


globalThis.upgradeMove = function(id) {
    const meta = getPokemonsMeta(name)
    const moveMeta = meta.moves.find(m => m.id === id)
    const grade = moveMeta.grade ? moveMeta.grade + 1 : 1
    moveMeta.grade = grade
    setPokemonMeta(name, meta)
    loadMoves()
}

globalThis.megaBtnClickHandler = function({currentTarget}){
   currentTarget.classList.toggle("active")
   isMegaEvolved = currentTarget.classList.contains("active")
   isMegaEvolved 
       ? pokemon.megaEvolve()
       : pokemon.megaDevolve()
   loadAll()
}
globalThis.setMegaSuffix = function(value){
    const meta = getPokemonsMeta(name) 
    meta.mega.suffix = value
    setPokemonMeta(name,meta)
}

globalThis.loadMegaSuffix = function(){
    const meta = getPokemonsMeta(name)
    const suffix = meta.mega.suffix
    const select = document.querySelector(".mega-suffix-select")
    select.value = suffix
}

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
    const commaStrs = ["items", "types", "abilities"]
     if (commaStrs.includes(slug)) {
       value = value.split(',').map(item => item.trim()).filter(Boolean)
       value = [ ... new Set(value) ]        
     }
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
      stat.setAttribute("data-token-used", value)
  }
}

globalThis.showPokemonChooseForm = function(){
  const pokemonChooseForm = document.querySelector(".pokemon-choose-form")
  pokemonChooseForm.parentElement.classList.add('active')
  loadPokemonsDatalist("pokemon-data-list")
}

globalThis.changePokemon =  function (){
  const pokemonInput = document.querySelector(".pokemon-choose-form > #pokemon-inp")
  const meta = getPokemonsMeta(name)
  meta.id = pokemonInput.value
  globalThis.pokemon = new Pokemon(meta.id, meta)
  setPokemonMeta(name,meta)
  loadAll()
 closePokemonChooseForm()
}
globalThis.closePokemonChooseForm = function(){
  const pokemonChooseForm = document.querySelector(".pokemon-choose-form")
  pokemonChooseForm.parentElement.classList.remove('active')
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
   console.log(statSlug)
   const datalist = statUpdateForm.querySelector(`datalist[data-property-name="${statSlug}"]`);
    if (datalist !== null)
     statValueInp.setAttribute('list',`${statSlug}-data-list`)
   
    
  } else {
   attributeName = "data-token-used"
   document.getElementById("remaining-token").textContent = pokemon.tokensRemaining()
   }

  statValueInp.value = currentTarget.getAttribute(attributeName) || pokemon.types.join(",")

  saveBtn.onclick = ()=> {
   if (attributeName === "data-value")
    setStat(statSlug, Number(statValueInp.value) || statValueInp.value)
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
    if (pokemon.movesMeta().find(move => move.id === moveId)) {
        return
    }
    pokemon.movesMeta().push({
        id: moveId,
    })
    setPokemonMeta(name, pokemon.meta)
    closeMoveChooseInterface()
    loadMoves()
}




globalThis.forgetMove = function(id) {
    const oldMoves = pokemon.movesMeta()
    const newMoves = oldMoves.filter(move => move.id !== id)
    
    oldMoves.splice(0, oldMoves.length)
    newMoves.forEach(m => oldMoves.push(m))
    setPokemonMeta(name, pokemon.meta)
    loadMoves()
}

function loadName() {
    const display = document.getElementById("pokemon-name")
    display.innerText = `${name} (${pokemon.id})`  
    display.onclick = () => {
      window.location = '/data.html?name=' + name
    }
}


function loadStats() {
   setCurrentHealth(pokemon.meta.stats.hp ?? pokemon.maxhp)
    setStat("level", pokemon.level)
    setStat("nature", pokemon.meta.nature)
    setStat("xp", pokemon.meta.xp)
    setStat("retreat", pokemon.meta.retreat)
    setStat("weight", (pokemon.getWeight() / 10) + "kg")
    setStat("abilities", pokemon.abilities.names().join(', '))
    setStat("items", pokemon.items.names().join(', '))
    setStat("types", pokemon.types.join(','))
    setStat("abilities", pokemon.abilities.names().join(','))
    setStat("wins-count", pokemon.meta["wins-count"])
    setStat("loses-count", pokemon.meta["loses-count"])
        
    for (const stat in pokemon.stats) {
     const statValue = pokemon.stats[stat].toFixed(2)
      setStat(stat,statValue)
      setStatToken(stat, pokemon.meta.token_used[stat], false)
      if (stat === "hp") {
          setTotalHealth(statValue)
      }
    }
    setStat("total", pokemon.cp())
}

function loadMoves() {
    const movesContainer = document.getElementById("moves-container")
    movesContainer.innerHTML = ""
    
    for (const moveMeta of pokemon.movesMeta()) {
        const move = new Move(moveMeta.id, moveMeta)
        move._meta = moveMeta
        const damage = new Damage(pokemon, move)
     let capacityColor = "black"
    let basePowerColor = "black"
    if (move.target === "allAdjacent" || move.target === "all") {
       capacityColor = "darkred" 
      if (move.target === "all") 
        basePowerColor = "darkred"
    }
    else if (move.target === "allySide" || move.target === "allies"){
       capacityColor = "#006400ff"
    }

   movesContainer.innerHTML +=   `
   <div class="single-card-wrapper">
      <div class="card" data-move-id="${move.id}" style="outline:1px solid var(--${move.type || "Normal"}-type-color)" data-makes-contact="${!!move.flags.contact}">
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
             
             ` <div class="power-data data-wrapper">
             ${
              move.flags.contact !== 1 
              ? ` <svg
                  class="bow-icon"
                  width="20px"
                  height="20px"
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
                      fill="${basePowerColor}"
                    ></path>
                  </g>
                </svg>
                `
                : `<svg
                  class="sword-icon"
                  width="20px"
                  height="20px"
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
                      fill="${basePowerColor}"
                    ></path>
                  </g>
                </svg>`}
                :
                <span class="data">${move.basePower}</span>
              </div>`
              : ``
             }
                ${
      move.capacity > 1 
    ? `
         <div class="capacity-data data-wrapper">
<svg width="17px" height="17px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="${capacityColor}"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>target [#81]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-340.000000, -7839.000000)" fill="${capacityColor}"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M298,7689 C298,7688.448 298.448,7688 299,7688 L299.91,7688 C299.486,7685.493 297.507,7683.514 295,7683.09 L295,7684 C295,7684.552 294.552,7685 294,7685 C293.448,7685 293,7684.552 293,7684 L293,7683.09 C290.493,7683.514 288.514,7685.493 288.09,7688 L289,7688 C289.552,7688 290,7688.448 290,7689 C290,7689.552 289.552,7690 289,7690 L288.09,7690 C288.514,7692.507 290.493,7694.486 293,7694.91 L293,7694 C293,7693.448 293.448,7693 294,7693 C294.552,7693 295,7693.448 295,7694 L295,7694.91 C297.507,7694.486 299.486,7692.507 299.91,7690 L299,7690 C298.448,7690 298,7689.552 298,7689 M304,7689 C304,7689.552 303.552,7690 303,7690 L301.931,7690 C301.479,7693.617 298.617,7696.479 295,7696.931 L295,7698 C295,7698.552 294.552,7699 294,7699 C293.448,7699 293,7698.552 293,7698 L293,7696.931 C289.383,7696.479 286.521,7693.617 286.069,7690 L285,7690 C284.448,7690 284,7689.552 284,7689 C284,7688.448 284.448,7688 285,7688 L286.069,7688 C286.521,7684.383 289.383,7681.521 293,7681.069 L293,7680 C293,7679.448 293.448,7679 294,7679 C294.552,7679 295,7679.448 295,7680 L295,7681.069 C298.617,7681.521 301.479,7684.383 301.931,7688 L303,7688 C303.552,7688 304,7688.448 304,7689 M297,7689 C297,7689.552 296.552,7690 296,7690 L295,7690 L295,7691 C295,7691.552 294.552,7692 294,7692 C293.448,7692 293,7691.552 293,7691 L293,7690 L292,7690 C291.448,7690 291,7689.552 291,7689 C291,7688.448 291.448,7688 292,7688 L293,7688 L293,7687 C293,7686.448 293.448,7686 294,7686 C294.552,7686 295,7686.448 295,7687 L295,7688 L296,7688 C296.552,7688 297,7688.448 297,7689" id="target-[#81]"> </path> </g> </g> </g> </g></svg>
 
                : <span class="data">${move.capacity}</span>
              </div>
              `
              : ''
     }
     
       <div class="accuracy-data data-wrapper">
 
<svg fill="#000000" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="21px" height="21px" viewBox="0 0 72 72" enable-background="new 0 0 72 72" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M36.001,63.75C24.233,63.75,2.5,54.883,2.5,42.25c0-12.634,21.733-21.5,33.501-21.5c11.766,0,33.5,8.866,33.5,21.5 C69.501,54.883,47.767,63.75,36.001,63.75z M36.001,24.75C24.886,24.75,6.5,32.929,6.5,42.25c0,9.32,18.387,17.5,29.501,17.5 c11.113,0,29.5-8.18,29.5-17.5C65.501,32.929,47.114,24.75,36.001,24.75z"></path> </g> <g> <path d="M36.001,52.917c-5.791,0-10.501-4.709-10.501-10.5c0-5.79,4.711-10.5,10.501-10.5c5.789,0,10.5,4.71,10.5,10.5 C46.501,48.208,41.79,52.917,36.001,52.917z M36.001,33.917c-4.688,0-8.501,3.814-8.501,8.5c0,4.688,3.813,8.5,8.501,8.5 c4.686,0,8.5-3.813,8.5-8.5C44.501,37.731,40.687,33.917,36.001,33.917z"></path> </g> <g> <path d="M32.073,39.809c-0.242,0-0.484-0.088-0.677-0.264c-0.406-0.375-0.433-1.008-0.059-1.414 c0.2-0.217,0.415-0.422,0.644-0.609c0.428-0.352,1.058-0.291,1.408,0.137c0.352,0.426,0.29,1.057-0.136,1.408 c-0.158,0.129-0.307,0.27-0.444,0.418C32.612,39.7,32.342,39.809,32.073,39.809z"></path> </g> <g> <path d="M36.001,48.75c-3.494,0-6.335-2.842-6.335-6.334c0-0.553,0.448-1,1-1c0.553,0,1,0.447,1,1 c0,2.391,1.945,4.334,4.335,4.334c0.553,0,1,0.447,1,1S36.554,48.75,36.001,48.75z"></path> </g> <g> <path d="M35.876,18.25c-1.105,0-2-0.896-2-2v-6c0-1.104,0.895-2,2-2c1.104,0,2,0.896,2,2v6 C37.876,17.354,36.979,18.25,35.876,18.25z"></path> </g> <g> <path d="M24.353,18.93c-0.732,0-1.437-0.402-1.788-1.101l-1.852-3.68c-0.497-0.987-0.1-2.189,0.888-2.686 c0.985-0.498,2.188-0.101,2.686,0.887l1.852,3.68c0.496,0.987,0.099,2.189-0.888,2.686C24.962,18.861,24.655,18.93,24.353,18.93z"></path> </g> <g> <path d="M12.684,23.567c-0.548,0-1.094-0.224-1.488-0.663l-2.6-2.894c-0.738-0.822-0.671-2.087,0.151-2.824 c0.82-0.74,2.085-0.672,2.824,0.15l2.6,2.894c0.738,0.822,0.67,2.087-0.151,2.824C13.638,23.398,13.16,23.567,12.684,23.567z"></path> </g> <g> <path d="M46.581,18.93c-0.303,0-0.609-0.068-0.898-0.214c-0.986-0.496-1.383-1.698-0.887-2.686l1.852-3.68 c0.494-0.985,1.695-1.386,2.686-0.887c0.986,0.496,1.385,1.698,0.887,2.686l-1.852,3.68C48.019,18.527,47.313,18.93,46.581,18.93z "></path> </g> <g> <path d="M58.249,23.567c-0.475,0-0.953-0.169-1.336-0.513c-0.82-0.737-0.889-2.002-0.15-2.824l2.6-2.894 c0.738-0.82,2.002-0.89,2.824-0.15c0.822,0.737,0.889,2.002,0.15,2.824l-2.6,2.894C59.343,23.344,58.798,23.567,58.249,23.567z"></path> </g> </g> </g></svg>
                 : <span class="data">${move.accuracy}</span>
              </div>
      
    
              <div class="retreat-data data-wrapper">
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
         <strong>Damage:</strong><span class="data"> ${Math.round(damage.count * (1/70))}</span>
        </div>
        ${'⭐ '.repeat(moveMeta.grade ?? 0)}

        <small class="desc">
         ${move.description()}
              </small>
          <div class="bottom-btns-cont">
         <button onclick="forgetMove('${move.id}')" class="forget-btn">Forgot move</button>
         <button onclick="upgradeMove('${move.id}')" class="upgrade-btn">Upgrade move</button>
          </div>
      
      </div>
    </div>`

     
    }
}

function setupPokemon() {
  const meta = getPokemonsMeta(name)
  globalThis.pokemon = new Pokemon(meta.id, meta)
  globalThis.dummy = new Pokemon('student')
  globalThis.battle = new BATTLE_SYSTEMS["single"]([pokemon], [dummy])
}

function loadAll(){
    loadNaturesDataList("nature-data-list")
    loadItemsDataList("items-data-list")
    loadTypesDataList("types-data-list")
    loadAbilitiesDataList("abilities-data-list")

    loadName()
    loadMoves()
    loadStats()

    loadMegaSuffix()
}

window.onload = () => {
    setupPokemon()
    loadAll()
}
