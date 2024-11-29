import { Pokemon, Move } from "./utils/models.js"
import { canDodge } from "./app.js"
import { calculateDamage } from "./utils/damage.js"
import { getEffects } from "./utils/effects.js"
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
    
    globalThis.pokemonMap = {
        "you": pokemon,
        "enemy": enemyPokemon
    }
    pokemon.state.addListener("onHealthChange", state => {
        setCurrentHealth(state.statOf("hp"), "you")
    })
    
    enemyPokemon.state.addListener("onHealthChange", state => {
        console.log(state.statOf("hp"))
        setCurrentHealth(state.statOf("hp"), "enemy")
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


function setEffects(effects, playerTag) {
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
function setCurrentHealth(hp, playerTag) {
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .health-progress-bar`)
  const totalHp = Number(healthProgressBar.getAttribute("data-total-hp"))
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".current-hp").textContent = hp
  const progress = (hp / totalHp) * 100
  healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0: progress}%`
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
      if (card.dataset.moveName === "__nothing__") {
          continue
      }
    moveCardsContainer.removeChild(card)
  }
  
  moveCardsContainer.innerHTML += `
    <div onclick="moveCardClickHandler(event,'${playerTag}')" class="card ${0.5 <= pokemonMap[playerTag].state.retreat ? "" : "disabled"}" class="card dodge" style="display:flex;justify-content:center;align-items:center" data-move-name="__dodge__">
        <h1>Dodge</h1>
      </div>
  `

  // re adding cards
  movesArr.forEach((move)=> {
    const cardHtml = ` <div class="card ${move.retreat <= pokemonMap[playerTag].state.retreat ? "" : "disabled"}"  data-move-name="${move.name}" onclick="moveCardClickHandler(event, '${playerTag}')">
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
    await Promise.all([
        loadMoves(),
        loadOponentMoves()
    ])
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
    const isNotMove = name => ["__dodge__", "__nothing__"].includes(name)
    
    const move1 = isNotMove(moveName)
        ? null
        : await Move.make(moveName)
    const move2 = isNotMove(enemyMoveName)
        ? null
        : await Move.make(enemyMoveName)

    if(moveName === "__dodge__" && enemyMoveName === "__dodge__") {
        pokemon.state.retreat -= 0.5
        enemyPokemon.state.retreat -= 0.5
    }

    else if(moveName === "__nothing__" && enemyMoveName === "__nothing__") {}

    else if(moveName === "__dodge__") {
        const dodged = canDodge(enemyPokemon, pokemon, move2)
        pokemon.state.retreat -= 0.5
        enemyPokemon.state.retreat -= move2.retreat
        if (!dodged) {
            const damages = await calculateDamage(enemyPokemon, move2, pokemon)
            const effects = await getEffects(enemyPokemon, pokemon, move2)
            effects.forEach(effect => pokemon.state.addEffect(effect))
            pokemon.state.decreaseHealth(damages[1].totalDamage)
        }
    }
    
    else if(enemyMoveName === "__dodge__") {
        const dodged = canDodge(pokemon, enemyPokemon, move1)
        pokemon.state.retreat -= move1.retreat
        enemyPokemon.state.retreat -= 0.5
        if (!dodged) {
            const damages = await calculateDamage(pokemon, move1, enemyPokemon)
            const effects = await getEffects(pokemon, enemyPokemon, move1)
            effects.forEach(effect => enemyPokemon.state.addEffect(effect))
            enemyPokemon.state.decreaseHealth(damages[1].totalDamage)
        }
    }
    
    else if(moveName === "__nothing__") {
        enemyPokemon.state.retreat -= move2.retreat
        const damages = await calculateDamage(enemyPokemon, move2, pokemon)
        const effects = await getEffects(enemyPokemon, pokemon, move2)
        effects.forEach(effect => pokemon.state.addEffect(effect))
        pokemon.state.decreaseHealth(damages[1].totalDamage)
    }
    
    else if(enemyMoveName === "__nothing__") {
        pokemon.state.retreat -= move1.retreat
        const damages = await calculateDamage(pokemon, move1, enemyPokemon)
        const effects = await getEffects(pokemon, enemyPokemon, move1)
        effects.forEach(effect => enemyPokemon.state.addEffect(effect))
        enemyPokemon.state.decreaseHealth(damages[1].totalDamage)
    }
    
    else {
        pokemon.state.retreat -= move1.retreat
        enemyPokemon.state.retreat -= move2.retreat

        const damages = await calculateDamage(pokemon, move1, enemyPokemon, move2)
        const hurtedPokemon = damages[1].totalDamage > 0
            ? enemyPokemon
            : pokemon
        const hitterPokemon = hurtedPokemon === enemyPokemon
            ? pokemon
            : enemyPokemon
                console.log(hurtedPokemon.name, hitterPokemon.name)
        const move = hitterPokemon === pokemon
            ? move1
            : move2
        const effects = await getEffects(hitterPokemon, hurtedPokemon, move)
        effects.forEach(effect => hurtedPokemon.state.addEffect(effect))
        hurtedPokemon.state.decreaseHealth(damages[1].totalDamage)
    }
    
    setCurrentRetreat(pokemon.state.retreat, "you")
    setCurrentRetreat(enemyPokemon.state.retreat, "enemy")
}


async function loadMoves() {
    const moves = []
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
    // const moves = await Promise.all(
//       moveNames.map(async moveName => {
//             const move = await Move.make(moveName)
//             move.damage = (await calculateDamage(enemyPokemon, move))[1].totalDamage
//             return move
//         })
//     )
    const moves = []
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
    await loadPokemonsToGlobal()
    
    loadMoves()
    loadOponentMoves()
    
    loadRetreat()
    loadEnemyRetreat()
    
    loadHealth()
    loadEnemyHealth()
}


setTimeout(loadAll, 1000)
