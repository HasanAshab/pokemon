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
  const totalHp = pokemonMap[playerTag].stats["hp"] // give here total hp data
  const currentHp = pokemonMap[playerTag].state.stats.get("hp") //give the hp data here
  const newHp = prompt(playerTag, currentHp)
  if (currentHp !== newHp){
    pokemonMap[playerTag].state.stats.set("hp", newHp)
    setCurrentHealth(Math.min(newHp, totalHp))
  }
}

function setBattleStateChangeListener(playerTag) {
    const pokemon = pokemonMap[playerTag]
    pokemon.state.on("change", state => {
        const hp = state.stats.get("hp")
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

function showChoosePokemon() {
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

function loadGlobal() {
    const pokemonName = getParam("you")
    const enemyMovesMeta = getParam("moves").split(",").map(moveName => ({
        name: moveName,
        isSelected: true
    }))

    globalThis.enemyPokemon = new Pokemon(getParam("enemy"), {
        xp: parseInt(getParam("xp")),
        retreat: parseInt(getParam("retreat")),
        nature: getParam("nature"),
        moves: enemyMovesMeta
    })
    globalThis.pokemon = new Pokemon(pokemonName, getPokemonsMeta(pokemonName))
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
  const effectsMap = {
    "brn": {
        "name": "Burn",
        "color": "fire" 
    },
    "psn": {
      "name": "Poison",
      "color": "poison"
    },
    "par": {
      "name": "Paralyze",
      "color": "electric"
    },
    "frz": {
      "name": "Freeze",
      "color": "ice"
    },
    "slp": {
      "name": "Sleep",
      "color": "psychic"
    },
    "cnf": {
      "name": "Confusion",
      "color": "psychic"
    },
    "cur": {
      "name": "Curse",
      "color": "ghost"
    },
    "fln": {
      "name": "Flinch",
      "color": "dark"
    },
    "inf": {
      "name": "Infatuation",
      "color": "fairy"
    },
    "trp": {
      "name": "Trap",
      "color": "ground"
    },
    "lch": {
      "name": "Leech",
      "color": "grass"
    },
    "dws": {
      "name": "Drowsy",
      "color": "psychic"
    },
};
  const effectsDataColumn = document.querySelector(`.${playerTag}-controle-cont .effects-data-column`)
  effectsDataColumn.innerHTML = ""
  effects.forEach(effect => {
    const html = ` <span class="effect" style="background-color:var(--${effectsMap[effect].color}-type-color)">${effectsMap[effect].name}</span>`
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
    const oponentPokemon = pokemonMap[playerTag === "you" ? "enemy" : "you"]
    const moveCardsContainer = document.querySelector(`.${playerTag}-controle-cont .card-container`)
  
    moveCardsContainer.innerHTML = ''
  for (const move of pokemon.state.moves) {
      const effectiveness = oponentPokemon.effectiveness(move.type)
      const damage = fixFloat(calculateBaseDamage(pokemon, move))
     const cardHtml = ` <div class="card ${pokemon.state.canUseMove(move.name) ? "" : "disabled"}"  data-move-name="${move.name}" onclick="moveCardClickHandler(event, '${playerTag}')">
    <div class="card-header" style="background-color:var(--${move.type || "Normal"}-type-color)">
    <h3>${move.name}</h3>
    <div class="move-icons">
    <div class="icon"></div>
    <div class="icon"></div>
    </div>
    </div>
    <div class="card-body">
    ${move.category}

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
    const move1 = new Move(moveName)
    const move2 = new Move(enemyMoveName)
    
    await battleField.turn([
        [pokemon, move1],
        [enemyPokemon, move2],
    ])
}


function loadRetreat(playerTag) {
    const retreat = pokemonMap[playerTag].state.retreat
    setRetreatPerWave(retreat, playerTag)
    setCurrentRetreat(retreat, playerTag)
}

function loadHealth(playerTag) {
    const hp = pokemonMap[playerTag].stats.hp
    setTotalHealth(hp, playerTag)
}


function loadAll() {
    loadGlobal()

    loadMoves("you")
    loadMoves("enemy")

    loadRetreat("you")
    loadRetreat("enemy")

    loadHealth("you")
    loadHealth("enemy")

    //loadChoosePokemon() 
    setBattleStateChangeListener("you")
    setBattleStateChangeListener("enemy")
}


loadAll()
