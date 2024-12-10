import { fixFloat } from "./utils/helpers.js"
import { Pokemon, Move } from "./utils/models.js"
import { BattleField } from "./utils/battle.js"
import { calculateBaseDamage } from "./utils/damage.js"
import { calculateWinXP } from "./utils/battle.js"
import { capitalizeFirstLetter, getParam, getPokemonsMeta, setPokemonMeta } from "./utils/helpers.js"


globalThis.isVeryClose = false

globalThis.veryCloseBtnClickHandler = function({currentTarget}) {
  currentTarget.classList.toggle("active")
  globalThis.isVeryClose = !isVeryClose
}

globalThis.healthProgressbarClickHandler = ({currentTarget},playerTag)=>{
  const totalHp = 50 // give here total hp data
  const currentHp = 10 //give the hp data here
  const newHp = prompt(playerTag,currentHp)
    if (currentHp !== newHp){
    setCurrentHealth(Math.min(newHp,totalHp))
    }
}

function setBattleStateChangeListener(playerTag) {
    const pokemon = pokemonMap[playerTag]

    battleField.state(pokemon).on("change", state => {
        const hp = state.statOf("hp")
        setCurrentRetreat(state.retreat, playerTag)
        setStateChanges(state._statChanges, playerTag)
        setEffects(state.effects.names(), playerTag)
        setCurrentHealth(hp, playerTag)
        loadMoves(playerTag)

        if (hp === 0) {
            const winnerTag = playerTag === "you"
                ? "enemy"
                : "you"
            handleWin(winnerTag, playerTag)
        }
    })
    
}

async function handleWin(winnerTag, looserTag) {
    const winner = pokemonMap[winnerTag]
    const looser = pokemonMap[looserTag]

    const xp = await calculateWinXP(winner , looser)
 
    const meta = getPokemonsMeta(pokemon.name)
    meta.xp += xp
    setPokemonMeta(pokemon.name, meta)
     
    if (winnerTag === "you")
     showChoosePokemon()
     
    showPopupMsg("Winner! +" + xp, winnerTag, () => {
        //window.location = `poke_details.html?name=${pokemon.name}`
    })
}

function showChoosePokemon(){
     const choosePokemonCont = document.querySelector(".choose-pokemon-cont")
     choosePokemonCont.parentNode.classList.add(active)
}

function loadChoosePokemon(){
  const choosePokemonCont = document.querySelector(".choose-pokemon-cont")
   const pokemonsMeta =  getPokemonsMeta()
   choosePokemonCont.innerHTML = ""
   for (const pokemon in pokemonsMeta){
      const meta = pokemonsMeta[pokemon] 
      const isFainted = false   
    choosePokemonCont.innerHTML += `
            <button class="pokemon" ${isFainted ? "disabled" : ""}>
                <strong class="name">${pokemon}</strong>
                <strong class="level">${meta.level}lvl</strong>
            </button> 
    `
   }

 }

async function loadGlobal() {
    const pokemonName = getParam("you")
    const enemyMovesMeta = getParam("moves").split(",").map(moveName => ({
        name: moveName,
        isSelected: true
    }))

    globalThis.enemyPokemon = await Pokemon.make(getParam("enemy"), {
        xp: parseInt(getParam("xp")),
        retreat: parseInt(getParam("retreat")),
        nature: getParam("nature"),
        moves: enemyMovesMeta
    })
    globalThis.pokemon = await Pokemon.make(pokemonName, getPokemonsMeta(pokemonName))
    globalThis.pokemonMap = {
        "you": pokemon,
        "enemy": enemyPokemon
    }
    globalThis.battleField = await BattleField.init(pokemon, enemyPokemon)
}

function showBattlePromptPopup(msg, playerTag) {
  const battlePromptPopup = document.querySelector(".battle-prompt-popup")
  const dodgeBtn = battlePromptPopup.querySelector(".btns-cont > .dodge-btn")
  const nothingBtn = battlePromptPopup.querySelector(".btns-cont > .nothing-btn")
  function hideShowToggle(){
    battlePromptPopup.classList.toggle("active")
  if (playerTag === "enemy") {
    battlePromptPopup.classList.toggle("enemy")
  }
  }
  hideShowToggle()
  battlePromptPopup.querySelector(".msg").textContent = msg

 dodgeBtn.onclick = ()=>{
   //code for dodge
   hideShowToggle()
 }
nothingBtn.onclick = ()=>{
   //code for nothing
   hideShowToggle()
 }
}

function showPopupMsg(msg,playerTag, cb = (() => null)){
    const popupMsgCont = document.getElementById("popup-msg-cont")
    popupMsgCont.classList.add("active")
    popupMsgCont.querySelector(".msg").textContent = msg
    if (playerTag === "enemy"){
     popupMsgCont.classList.add("enemy-side")
    }
    setTimeout(()=>{
    popupMsgCont.classList.remove("active")
      popupMsgCont.classList.remove("enemy-side")
      cb()
   },2000)
    
}


function setEffects(effects, playerTag) {
  const typeMap = {
    "burn": "fire",
    "poison": "poison",
    "paralyze": "electric",
    "freeze": "ice",
    "sleep": "psychic",
    "confusion": "psychic",
    "curse": "ghost",
    "flinch": "dark",
    "infatuation": "fairy",
    "trap": "ground", // e.g., moves like Sand Tomb
    "leech": "grass", // e.g., Leech Seed
    "drowsy": "psychic", // e.g., Yawn
};

  const effectsDataColumn = document.querySelector(`.${playerTag}-controle-cont .effects-data-column`)
  effectsDataColumn.innerHTML = ""
  effects.forEach(effect => {
    const html = ` <span class="effect" style="background-color:var(--${typeMap[effect]}-type-color)">${capitalizeFirstLetter(effect)}</span>`
    effectsDataColumn.innerHTML += html
  })
}

function setStateChanges(data, playerTag) {
  const attributesDataRow = document.querySelector(`.${playerTag}-controle-cont .attributes-data-row`)
  attributesDataRow.innerHTML = ""
  for (const stat in data) {
    attributesDataRow.innerHTML += `<span class>${stat}${data[stat]}</span>`
  }
}

function setRetreatPerWave(retreat, playerTag) {
  const retreatPerWave = document.querySelector(`.${playerTag}-controle-cont .retreat-per-wave`)
  retreatPerWave.textContent = retreat
}
function setCurrentRetreat(retreat, playerTag) {
  const currentRetreat = document.getElementById(`${playerTag}-current-retreat`)
  currentRetreat.innerText = retreat
}

function setTotalHealth(hp, playerTag) {
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .health-progress-bar`)
  healthProgressBar.setAttribute("data-total-hp", hp)
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".inner").style.width = '100%'
  healthProgressBar.querySelector(".current-hp").textContent = hp
  healthProgressBar.querySelector(".total-hp").textContent = hp

}
function setCurrentHealth(hp, playerTag) {
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .health-progress-bar`)
  const totalHp = Number(healthProgressBar.getAttribute("data-total-hp"))
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".current-hp").textContent = hp
  const progress = (hp / totalHp) * 100
  healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0: progress}%`
}


function showMoveDamageInjectForm(moveName, damage, playerTag) {
  const moveDamageInjectForm = document.querySelector(`.${playerTag}-controle-cont .move-damage-inject-form`)
  moveDamageInjectForm.classList.add("active")
  const moveNameHeading = moveDamageInjectForm.querySelector(".move-name")
  const damageInp = moveDamageInjectForm.querySelector(".damage-input")
  const injectBtn = moveDamageInjectForm.querySelector(".inject-btn")
  const noBtn = moveDamageInjectForm.querySelector(".no-btn")
  moveNameHeading.textContent = moveName || "name"
  damageInp.value = damage || 0
  injectBtn.onclick = ()=> {
    moveDamageInjectForm.classList.remove("active")
    injectDamage(damageInp.value || 0, playerTag === "you" ? "enemy": "you")
  }
  noBtn.onclick = ()=> moveDamageInjectForm.classList.remove("active")


}


function loadMoves(playerTag) {
    const pokemon = pokemonMap[playerTag]
  const moveCardsContainer = document.querySelector(`.${playerTag}-controle-cont .card-container`)
  
    moveCardsContainer.innerHTML = ''
  // re adding cards
  for (const move of pokemon.state.moves) {
      const damage = fixFloat(calculateBaseDamage(pokemon, move))
      const effectiveness = move._effectiveness
     const cardHtml = ` <div class="card ${pokemon.state.canUseMove(move.name) ? "" : "disabled"}"  data-move-name="${move.name}" onclick="moveCardClickHandler(event, '${playerTag}')">
    <div class="card-header" style="background-color:var(--${move.type || "normal"}-type-color)">
    <h3>${move.display}</h3>
    <div class="move-icons">
    <div class="icon"></div>
    <div class="icon"></div>
    </div>
    </div>
    <div class="card-body">
    ${move.damage_class}

${
    effectiveness === 1 ? ''
    : `<p class="effectiveness">
     Effectiveness: 
    <img  src="./assets/svg/arrow-${effectiveness > 1 ? 'up' : 'down'}.svg"/>
    </p>`
}

        <p>
    ${damage !== null ? "Damage: " + damage : ""}
    </p>
    <p>
    PP: ${move.pp ?? "∞"}
    </p>
    <small class="description">${move.description}</small>
    </div>    
   
    ${
        move.retreat ? `<div class="retreat-cost">
        ${move.retreat}
        </div>` : ''
    }
    </div>
    `
    moveCardsContainer.innerHTML += cardHtml
  }
}

async function handleMoveCardSelect(card, playerTag) {
  if (card.classList.contains("disabled")) return
  const oponentPlayerTag = playerTag === "you" ? "enemy": "you"
  const oponentSelectedMoveCard = document.querySelector(`.${oponentPlayerTag}-controle-cont .card-container .card.selected`)
  if (oponentSelectedMoveCard){
    oponentSelectedMoveCard.classList.remove("selected")
    const moveNames = {
        [playerTag]: card.dataset.moveName,
        [oponentPlayerTag]: oponentSelectedMoveCard.dataset.moveName
    }
    try {
        await battle(moveNames)
    }
    catch(e) {
        console.log(e)
    }
  }else{
    card.parentElement.querySelector(".card.selected")?.classList.remove("selected")
    card.classList.add("selected")
  }
  }
 
globalThis.moveCardClickHandler = function( {
  currentTarget
}, playerTag) {
  handleMoveCardSelect(currentTarget, playerTag)
}


async function battle(moveNames) {
    const {you: moveName, enemy: enemyMoveName} = moveNames
    const move1 = await Move.make(moveName)
    const move2 = await Move.make(enemyMoveName)
    
    await battleField.turn([
        [pokemon, move1],
        [enemyPokemon, move2],
    ])
}


function loadRetreat() {
    const retreat = battleField.state(pokemon).retreat
    setRetreatPerWave(retreat, "you")
    setCurrentRetreat(retreat, "you")
}

function loadEnemyRetreat() {
    const retreat = battleField.state(enemyPokemon).retreat
    setRetreatPerWave(retreat, "enemy")
    setCurrentRetreat(retreat, "enemy")
}

function loadHealth() {
    const hp = battleField.state(pokemon).statOf("hp")
    setTotalHealth(hp, "you")
}

function loadEnemyHealth() {
    const hp = battleField.state(enemyPokemon).statOf("hp")
    setTotalHealth(hp, "enemy")
}

function prepareMoves(playerTag) {
    const pokemon = pokemonMap[playerTag]
    const oponentPokemon = pokemonMap[playerTag === "you" ? "enemy" : "you"]
    const tasks = pokemon.state.moves.map(async move => {
        move._effectiveness = await oponentPokemon.effectiveness(move.type)
    })

    return Promise.all(tasks)
}

async function loadAll() {
    await loadGlobal()
    
    await Promise.all([
        prepareMoves("you"),
        prepareMoves("enemy"),
    ])

    loadMoves("you")
    loadMoves("enemy")

    loadRetreat()
    loadEnemyRetreat()

    loadHealth()
    loadEnemyHealth()
    //loadChoosePokemon() 
    setBattleStateChangeListener("you")
    setBattleStateChangeListener("enemy")
}


setTimeout(loadAll, 1000)
