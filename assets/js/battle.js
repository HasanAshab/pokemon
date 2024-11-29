import { Pokemon, Move } from "./utils/models.js"
import { calculateDamage } from "./utils/damage.js"
import { capitalizeFirstLetter, getParam, getPokemonsMeta, setPokemonMeta } from "./utils/helpers.js"


async function loadPokemonsToGlobal() {
    const pokemonName = getParam("you")
    const [pokemon, enemyPokemon] = await Promise.all([
        Pokemon.make(pokemonName, getPokemonsMeta(pokemonName)),
        Pokemon.make(getParam("enemy"), {
            xp: parseInt(getParam("xp")),
            retreat: parseInt(getParam("retreat")),
            nature: getParam("nature"),
        })
    ])
    globalThis.pokemon = pokemon
    globalThis.enemyPokemon = enemyPokemon
    
    pokemon.state.addListener("onHealthChange", state => {
        setTotalHealth(state.hp, "you")
    })
    
    enemyPokemon.state.addListener("onHealthChange", state => {
        setTotalHealth(state.hp, "enemy")
    })
    
    pokemon.state.addListener("onEffectAdded", state => {
        setEffects(state._effects, "you")
    })
    
    enemyPokemon.state.addListener("onEffectAdded", state => {
        setEffects(state._effects, "enemy")
    })
}


function showPopupMsg(msg,playerTag){
    const popupMsgCont = document.getElementById("popup-msg-cont")
    popupMsgCont.classList.add("active")
    popupMsgCont.querySelector(".msg").textContent = msg
    if (playerTag === "enemy"){
     popupMsgCont.classList.add("enemy-side")
    }
    setTimeout(()=>{
    popupMsgCont.classList.remove("active")
      popupMsgCont.classList.remove("enemy-side")
   },2000)
    
}

function setEffect(effects, playerTag) {
  const effectsDataColumn = document.querySelector(`.${playerTag}-controle-cont .effects-data-column`)
  effectsDataColumn.innerHTML = ""
  effects.forEach(effect => {
    const html = ` <span class="effect" style="background-color:var(--fire-type-color)">${capitalizeFirstLetter(effect)}</span>`
    effectsDataColumn.innerHTML += html
  })
}

function setPokeAttribute(data, playerTag) {
  const attributesDataRow = document.querySelector(`.${playerTag}-controle-cont .attributes-data-row`)
  attributesDataRow.innerHTML = ""
  for (stat in data) {
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
function injectDamage(damage, playerTag) {
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .health-progress-bar`)
  const newHp = Number(healthProgressBar.getAttribute("data-current-hp")) - damage
  const totalHp = Number(healthProgressBar.getAttribute("data-total-hp"))
  healthProgressBar.setAttribute("data-current-hp", newHp)
  healthProgressBar.querySelector(".current-hp").textContent = newHp
  const progress = (newHp / totalHp) * 100
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
      if (card.dataset.moveName === "__nothing__" || card.dataset.moveName === "__dodge__") {
          continue
      }
    moveCardsContainer.removeChild(card)
  }

  // re adding cards
  movesArr.forEach((move)=> {
    const cardHtml = ` <div class="card "  data-move-name="${move.name}" onclick="moveCardClickHandler(event, '${playerTag}')">
    <div class="card-header" style="background-color:var(--${move.type}-type-color)">
    <h3>${capitalizeFirstLetter(move.name)}</h3>
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
    PP: ${move.pp}
    </p>
    </div>
    <div class="retreat-cost">
    ${move.retreat}
    </div>
    </div>
    `
    moveCardsContainer.innerHTML += cardHtml

  })

}
function handleMoveCardSelect(card, playerTag) {
  const oponentPlayerTag = playerTag === "you" ? "enemy": "you"
  const oponentSelectedMoveCard = document.querySelector(`.${oponentPlayerTag}-controle-cont .card-container .card.selected`)
  if (oponentSelectedMoveCard){
    oponentSelectedMoveCard.classList.remove("selected")
    const moveNames = {
        [playerTag]: card.dataset.moveName,
        [oponentPlayerTag]: oponentSelectedMoveCard.dataset.moveName
    }
    pokemon.state.decreaseHealth(20)
    fight(moveNames)
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
}


async function fight(moveNames) {
    let damages = {}
    const {you: moveName, enemy: enemyMoveName} = moveNames
    const isNotMove = name => ["__dodge__", "__nothing__"].includes(name)
    
    const move1 = isNotMove(moveName)
        ? null
        : await Move.make(moveName)
    const move2 = isNotMove(enemyMoveName)
        ? null
        : await Move.make(enemyMoveName)

    if(moveName === "__dodge__") {
        const dodged = canDodge(enemyPokemon, pokemon, move2)
        if (dodged) return
        damages = await calculateDamage(enemyPokemon, move2, pokemon)
        const effects = await getEffects(enemyPokemon, pokemon, moves)
        effects.forEach(effect => pokemon.state.addEffect(effect))
    }
    
}


async function loadMoves() {
    const moves = await Promise.all(
      pokemon.meta.moves
        .filter(move => move.isSelected)
        .map(async moveMeta => {
            const move = await Move.make(moveMeta.name)
            move.damage = (await calculateDamage(pokemon, move))[1].totalDamage
            return move
        })
    )
    loadAllMoves(moves, "you")
}

async function loadOponentMoves() {
    const moveNames = getParam("moves").split(",")
    const moves = await Promise.all(
      moveNames.map(async moveName => {
            const move = await Move.make(moveName)
            move.damage = (await calculateDamage(enemyPokemon, move))[1].totalDamage
            return move
        })
    )
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
    await loadPokemonsToGlobal()
    
    loadMoves()
    loadOponentMoves()
    
    loadRetreat()
    loadEnemyRetreat()
    
    loadHealth()
    loadEnemyHealth()
}


setTimeout(loadAll, 1500)
