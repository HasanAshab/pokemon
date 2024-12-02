import { Pokemon, Move } from "./utils/models.js"
import { BattleField } from "./utils/battle.js"
import { applyStatChanges } from "./utils/stats.js"
import { calculateDamage } from "./utils/damage.js"
import { getEffects } from "./utils/effects.js"
import { canDodge, calculateWinXP } from "./utils/battle.js"
import { capitalizeFirstLetter, getParam, getPokemonsMeta, setPokemonMeta } from "./utils/helpers.js"



globalThis.isVeryClose = false
globalThis.veryCloseBtnClickHandler = function({currentTarget}) {
  currentTarget.classList.toggle("active")
  globalThis.isVeryClose = !isVeryClose
}


function addBattleStateListeners(pokemon, playerTag) {
    pokemon.state.addListener("onHealthChange", state => {
        const hp = state.statOf("hp")
        setCurrentHealth(hp, playerTag)
        if (hp === 0) {
            const winnerTag = playerTag === "you"
                ? "enemy"
                : "you"
            handleWin(winnerTag, playerTag)
        }
    })

    pokemon.state.addListener("onEffectAdded", state => {
        setEffects(state._effects, playerTag)
    })
    
    pokemon.state.addListener("onStatChange", state => {
        setStateChanges(state._statChanges, playerTag)
    })
}

async function handleWin(winnerTag, looserTag) {
    const winner = pokemonMap[winnerTag]
    const looser = pokemonMap[looserTag]
    const xp = await calculateWinXP(winner , looser)
    
    const meta = getPokemonsMeta(pokemon.name)
    meta.xp += xp
    setPokemonMeta(pokemon.name, meta)
    
    showPopupMsg("Winner! +" + xp, winnerTag, () => {
        window.location = `poke_details.html?name=${pokemon.name}`
    })
}


async function loadGlobal() {
    globalThis.NothingMove = await Move.make("$nothing")
    globalThis.DodgeMove = await Move.make("$dodge")

    const pokemonName = getParam("you")
    const pokemon = await Pokemon.make(pokemonName, getPokemonsMeta(pokemonName))
    const enemyPokemon = await Pokemon.make(getParam("enemy"), {
        xp: parseInt(getParam("xp")),
        retreat: parseInt(getParam("retreat")),
        nature: getParam("nature"),
    })

    globalThis.pokemon = pokemon
    globalThis.enemyPokemon = enemyPokemon
    
    globalThis.pokemonMap = {
        "you": pokemon,
        "enemy": enemyPokemon
    }

    globalThis.battleField = new BattleField(pokemon, enemyPokemon)
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

function showPopupMsg(msg,playerTag, cb){
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
  }
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

function loadAllMoves(movesArr, playerTag) {
  const moveCardsContainer = document.querySelector(`.${playerTag}-controle-cont .card-container`)
  //clean up old cards
  const oldMoveCards = moveCardsContainer.querySelectorAll('.card')
  for (const card of oldMoveCards) {
    moveCardsContainer.removeChild(card)
  }
  
  // re adding cards
  movesArr.forEach((move)=> {
    const cardHtml = ` <div class="card ${move.retreat <= pokemonMap[playerTag].state.retreat ? "" : "disabled"}"  data-move-name="${move.name}" onclick="moveCardClickHandler(event, '${playerTag}')">
    <div class="card-header" style="background-color:var(--${move.type}-type-color)">
    <h3>${move.display}</h3>
    <div class="icons">
    <div class="icon"></div>
    <div class="icon"></div>
    </div>
    </div>
    <div class="card-body">
    <p>
    Category: ${move.damage_class}
    </p>
    <p>
    ${move.damage !== null ? "Damage: " + move.damage : ""}
    </p>
    <p>
    PP: ${move.pp || "∞"}
    </p>
    </div>
    ${
        move.retreat ? `<div class="retreat-cost">
        ${move.retreat}
        </div>` : ''
    }
    </div>
    `
    moveCardsContainer.innerHTML += cardHtml

  })

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
    await loadMoves()
    await loadOponentMoves()
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


globalThis.newWave = function() {
    pokemon.state.decreaseHealthForEffects()
    enemyPokemon.state.decreaseHealthForEffects()
    
    pokemon.state.addWaveRetreat()
    enemyPokemon.state.addWaveRetreat()
    
    setCurrentRetreat(pokemon.state.retreat, "you")
    setCurrentRetreat(enemyPokemon.state.retreat, "enemy")
    
    loadMoves()
    loadOponentMoves()
}


async function battle(moveNames) {
    const {you: moveName, enemy: enemyMoveName} = moveNames
    const move1 = await Move.make(moveName)
    const move2 = await Move.make(enemyMoveName)
    
    await battleField.turn([
        [pokemon, move1],
        [enemyPokemon, move2],
    ])
    
    //setCurrentRetreat(pokemon.state.retreat, "you")
    //setCurrentRetreat(enemyPokemon.state.retreat, "enemy")
}


async function loadMoves() {
    const moves = [
        NothingMove,
        DodgeMove,
    ]
    for (const moveMeta of pokemon.meta.moves) {
        if (!moveMeta.isSelected) continue
        const move = await Move.make(moveMeta.name)
        move.damage = (await calculateDamage(pokemon, move))[1].totalDamage
        moves.push(move)
    }
    loadAllMoves(moves, "you")
}

async function loadOponentMoves() {
    const moveNames = getParam("moves").split(",")
    const moves = [
        NothingMove,
        DodgeMove,
    ]
    for (const moveName of moveNames) {
        const move = await Move.make(moveName)
        move.damage = (await calculateDamage(enemyPokemon, move))[1].totalDamage
        moves.push(move)
    }
    loadAllMoves(moves, "enemy")
}

function loadRetreat() {
    const retreat = pokemon.state.retreat
    setRetreatPerWave(retreat, "you")
    setCurrentRetreat(retreat, "you")
}

function loadEnemyRetreat() {
    const retreat = enemyPokemon.state.retreat
    setRetreatPerWave(retreat, "enemy")
    setCurrentRetreat(retreat, "enemy")
}

function loadHealth() {
    const hp = pokemon.state.statOf("hp")
    setTotalHealth(hp, "you")
}

function loadEnemyHealth() {
    const hp = enemyPokemon.state.statOf("hp")
    setTotalHealth(hp, "enemy")
}

async function loadAll() {
    await loadGlobal()
    
    loadMoves()
    loadOponentMoves()
    
    loadRetreat()
    loadEnemyRetreat()
    
    loadHealth()
    loadEnemyHealth()
    
    addBattleStateListeners(pokemon, "you")
    addBattleStateListeners(enemyPokemon, "enemy")
}


setTimeout(loadAll, 1000)
