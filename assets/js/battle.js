import { Pokemon, Move } from "./utils/models.js"
import { BattleField } from "./utils/battle.js"
import { Damage } from "./utils/damage.js"
import { calculateWinXP } from "./utils/battle.js"
import { fixFloat, getParam, getPokemonsMeta, setPokemonMeta, delayedFunc, getDamageDangerLevel } from "./utils/helpers.js"
import { PopupMsgQueue } from "./utils/dom.js"


globalThis.popupQueue = new PopupMsgQueue("popup-msg-cont");
globalThis.toggleMoveInfo = function(info){
info.classList.toggle("active")
}

function loadVeryCloseBtn() {
    const btn = document.getElementById("very-close-btn")
    battleField.context.get("veryClose")
        ? btn.classList.add("active")
        : btn.classList.remove("active")
}

function syncStatsMeta(pokemon) {
    pokemon.meta.stats.hp = pokemon.state.stats.get("hp")
    setPokemonMeta(pokemon.id, pokemon.meta)
}

globalThis.veryCloseBtnClickHandler = function({currentTarget}) {
  currentTarget.classList.toggle("active")
  battleField.context.set("veryClose", !battleField.context.get("veryClose"))
}

globalThis.healthProgressbarClickHandler = ({currentTarget},playerTag)=>{
  const pokemon = pokemonMap[playerTag]
  let newHp = prompt(playerTag, pokemon.hp)
  newHp = pokemon.state.stats.set("hp", newHp)
  setCurrentHealth(newHp, playerTag)
}


globalThis.switchPokemonClickHandler = function({currentTarget}, playerTag){
  if (!currentTarget.classList.contains("disabled")) {
   const parent = currentTarget.parentElement
    parent.querySelector(".pokemon.active")?.classList.remove("active")
    currentTarget.classList.add("active")
    switchPokemon(playerTag, currentTarget.dataset.pokemonId)
  }
}

const opponentTag = tag => (tag === "you" ? "enemy" : "you")

function loadPokemonData(playerTag) {
    const pokemon = pokemonMap[playerTag]
    const hp = pokemon.state.stats.get("hp")
    const oldHp = pokemon.state.stats.prev.get("hp")

    loadVeryCloseBtn()
    setCurrentRetreat(pokemon.state.retreat, playerTag)
    setStatChanges(pokemon.state.stats._statChanges, playerTag)
    setEffects(pokemon.state.effects.names(), playerTag)
    setCurrentHealth(hp, playerTag)
    loadMoves(playerTag)

    if(hp !== oldHp) {
        const hpDist = fixFloat(hp - oldHp) 
        const msg = `${0 < hpDist ? '+' : ''} ${hpDist} ${0 > hpDist ? `(${getDamageDangerLevel(pokemon, -hpDist)})` : ''}`
        popupQueue.add(msg, playerTag)
    }

    if (hp === 0) {
        const winnerTag = opponentTag(playerTag)
        //handleWin(winnerTag, playerTag)
    }
}

function setBattleStateListeners(playerTag) {
    const pokemon = pokemonMap[playerTag]
    pokemon.state.on(
        ["turn-end", "wave"], 
        delayedFunc(() => loadPokemonData(playerTag), 1000)
    )
    
    pokemon.state.on("dodged", delayedFunc(() => {
        popupQueue.add("dodged!", playerTag)
    }, 1000))
    
    pokemon.state.on("turn-end", delayedFunc((_, hit) => {
        const msg = `${hit.hitCount()} Hits ${hit.criticalCount() ? `, (${hit.criticalCount()} Crit)` : ''} !`
        hit.hitCount() > 1 && popupQueue.add(msg, opponentTag(playerTag))
    }, 1000))

    pokemon.state.on("fainted", () => {
        loadChoosePokemon(playerTag)
    })

    battleField.prompt(pokemon).reply("dodge", () => {
        return showDodgeBattlePrompt("Want to Dodge?", playerTag)
    })
}


async function handleWin(winnerTag, looserTag) {
    const winner = pokemonMap[winnerTag]
    const looser = pokemonMap[looserTag]

    const xp = await calculateWinXP(winner , looser)
 
    const meta = getPokemonsMeta(pokemon.name)
    meta.xp += xp
    setPokemonMeta(pokemon.name, meta)
     
    
    popupQueue.add("Winner! +" + xp, winnerTag, () => {
        window.location = `poke_details.html?name=${pokemon.name}`
    })
}

function loadChoosePokemon(playerTag){
  const pokemonSwitchControler = document.querySelector(`.${playerTag}-controle-cont .pokemon-switch-controler`)
   pokemonSwitchControler.innerHTML = ""

   for (const pokemon of teams[playerTag]) {
    pokemonSwitchControler.innerHTML += `
          <div class="pokemon ${pokemon.isFainted ? "disabled" : ""}" onclick="switchPokemonClickHandler(event, '${playerTag}')" data-pokemon-id="${pokemon.id}">
                  <svg class="pokeball-icon" height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 511.985 511.985" xml:space="preserve" fill="#000000">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path style="fill:#ED5564;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-34.554,0-68.083,6.773-99.645,20.125 c-30.483,12.89-57.865,31.351-81.373,54.85c-23.499,23.507-41.959,50.889-54.85,81.372C6.774,187.91,0,221.44,0,255.993 c0,34.56,6.773,68.091,20.125,99.652c12.89,30.469,31.351,57.857,54.85,81.357c23.507,23.516,50.889,41.967,81.373,54.857 c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857 c23.5-23.5,41.951-50.889,54.842-81.357c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z "></path>
          <path style="fill:#E6E9ED;" d="M0.102,263.18c0.875,32.014,7.593,63.092,20.023,92.465c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125 c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357c12.438-29.373,19.156-60.451,20.031-92.465 H0.102z"></path> <path style="fill:#434A54;" d="M510.765,281.211c0.812-8.344,1.219-16.75,1.219-25.218c0-9.516-0.516-18.953-1.531-28.289 c-12.719,1.961-30.984,4.516-53.998,7.054c-43.688,4.82-113.904,10.57-200.463,10.57c-86.552,0-156.776-5.75-200.455-10.57 c-23.022-2.539-41.28-5.093-53.998-7.054C0.516,237.04,0,246.478,0,255.993c0,8.468,0.406,16.875,1.219,25.218 c41.53,6.25,133.027,17.436,254.773,17.436S469.234,287.461,510.765,281.211z"></path> <path style="fill:#E6E9ED;" d="M309.334,266.656c0,29.459-23.891,53.334-53.342,53.334c-29.452,0-53.334-23.875-53.334-53.334 c0-29.453,23.882-53.327,53.334-53.327C285.443,213.33,309.334,237.204,309.334,266.656z"></path> <path style="fill:#434A54;" d="M255.992,170.66c-52.936,0-95.997,43.069-95.997,95.997s43.062,95.988,95.997,95.988 s95.996-43.061,95.996-95.988C351.988,213.729,308.928,170.66,255.992,170.66z M255.992,309.335 c-23.522,0-42.663-19.156-42.663-42.678c0-23.523,19.14-42.663,42.663-42.663c23.531,0,42.654,19.14,42.654,42.663 C298.646,290.178,279.523,309.335,255.992,309.335z"></path> <path style="opacity:0.2;fill:#FFFFFF;enable-background:new ;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-3.57,0-7.125,0.078-10.664,0.219 c30.789,1.25,60.662,7.93,88.974,19.906c30.498,12.89,57.873,31.351,81.371,54.85c23.5,23.507,41.969,50.889,54.857,81.372 c13.359,31.562,20.109,65.092,20.109,99.646c0,34.56-6.75,68.091-20.109,99.652c-12.889,30.469-31.357,57.857-54.857,81.357 c-23.498,23.516-50.873,41.967-81.371,54.857c-28.312,11.969-58.186,18.656-88.974,19.906c3.539,0.141,7.093,0.219,10.664,0.219 c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357 c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z"></path> <path style="opacity:0.1;enable-background:new ;" d="M20.125,355.645c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c3.57,0,7.125-0.078,10.664-0.219 c-30.789-1.25-60.67-7.938-88.982-19.906c-30.483-12.891-57.857-31.342-81.364-54.857c-23.507-23.5-41.96-50.889-54.858-81.357 c-13.352-31.56-20.117-65.091-20.117-99.652c0-34.554,6.765-68.084,20.116-99.646C54.35,125.864,72.803,98.481,96.31,74.983 c23.507-23.507,50.881-41.968,81.364-54.858c28.312-11.976,58.193-18.656,88.982-19.906c-3.539-0.14-7.094-0.218-10.664-0.218 c-34.554,0-68.083,6.773-99.645,20.125c-30.483,12.89-57.865,31.351-81.373,54.858c-23.499,23.499-41.959,50.881-54.85,81.364 C6.774,187.91,0,221.44,0,255.993C0,290.553,6.774,324.085,20.125,355.645z"></path>
        </g>
      </svg>

            <span class="name">${pokemon.name}</span>
          </div>
    `
   }
}

function makeMyPokemons() {
    const pokemonsMeta = getPokemonsMeta()
    return Object.keys(pokemonsMeta).map(id => new Pokemon(id, pokemonsMeta[id], "you"))
}

function makeEnemyPokemons() {
    return getParam("enemy").split(",").map(base64 => Pokemon.fromBase64(base64, "enemy"))
}

function loadTeams() {
    globalThis.teams = {
        "you": makeMyPokemons(),
        "enemy": makeEnemyPokemons()
    }
}


function switchPokemon(playerTag, pokemonId) {
    if(playerTag === "you") {
        globalThis.pokemon = teams.you.find(p => p.id === pokemonId)
        globalThis.pokemonMap["you"] = pokemon
    }
    else {
        globalThis.enemyPokemon = teams.enemy.find(p => p.id === pokemonId)
        globalThis.pokemonMap["enemy"] = enemyPokemon
    }
    
    if(globalThis.pokemon && globalThis.enemyPokemon) {
        setupCurrentBattle(playerTag)
    }
}

function setupCurrentBattle(switcher) {
    const firstTurn = !("battleField" in globalThis)

    globalThis.battleField = new BattleField(pokemon, enemyPokemon)

    if (firstTurn) {
        setupPokemonForDom("you")
        setupPokemonForDom("enemy")
    }
    else setupPokemonForDom(switcher)
}

function setupPokemonForDom(playerTag) {
    setBattleStateListeners(playerTag)
    loadHealth(playerTag)
    loadRetreat(playerTag)
    loadPokemonData(playerTag)
}

//todo
function showBattlePromptPopup(msg, playerTag) {
  const battlePromptPopup = document.querySelector(".battle-prompt-popup")
  const counterBtn = battlePromptPopup.querySelector(".btns-cont > .counter-btn")
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
return new Promise((res, rej) => {
 counterBtn.onclick = ()=>{
   res("counter")
   hideShowToggle()
 }
 dodgeBtn.onclick = ()=>{
   res("dodge")
   hideShowToggle()
 }
nothingBtn.onclick = ()=>{
    res("nothing")
   hideShowToggle()
 }
 
})
  
}

function showDodgeBattlePrompt(msg, playerTag) {
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
return new Promise((res, rej) => {
 dodgeBtn.onclick = ()=>{
   res(true)
   hideShowToggle()
 }
nothingBtn.onclick = ()=>{
    res(false)
   hideShowToggle()
 }
})
  
}


function setEffects(effects, playerTag) {
  const effectsMap = {
    "brn": {
        "name": "Burn",
        "color": "Fire" 
    },
    "psn": {
      "name": "Poison",
      "color": "Poison"
    },
    "par": {
      "name": "Paralyze",
      "color": "Electric"
    },
    "frz": {
      "name": "Freeze",
      "color": "Ice"
    },
    "slp": {
      "name": "Sleep",
      "color": "Psychic"
    },
    "cnf": {
      "name": "Confusion",
      "color": "Psychic"
    },
    "cur": {
      "name": "Curse",
      "color": "Ghost"
    },
    "flinch": {
      "name": "Flinch",
      "color": "Dark"
    },
    "inf": {
      "name": "Infatuation",
      "color": "Fairy"
    },
    "trp": {
      "name": "Trap",
      "color": "Ground"
    },
    "leechseed": {
      "name": "Leech",
      "color": "Grass"
    },
    "dws": {
      "name": "Drowsy",
      "color": "Psychic"
    },
    "stall": {
        "name": "Stall",
        "color": "Normal"
    }
};
  const effectsDataColumn = document.querySelector(`.${playerTag}-controle-cont .effects-data-column`)
  effectsDataColumn.innerHTML = ""
  effects.forEach(effect => {
    const html = ` <span class="effect" style="background-color:var(--${effectsMap[effect].color}-type-color)">${effectsMap[effect].name}</span>`
    effectsDataColumn.innerHTML += html
  })
}

function setStatChanges(data, playerTag) {
  const attributesDataRow = document.querySelector(`.${playerTag}-controle-cont .attributes-data-row`)
  attributesDataRow.innerHTML = ""
  for (const [stat, value] of Object.entries(data)) {
      const change = value > 0 ? '+' + value : value
    attributesDataRow.innerHTML += `<span class>${stat}${change}</span>`
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
  const pokemon = pokemonMap[playerTag]
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .health-progress-bar`)
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".current-hp").textContent = hp
  const progress = (hp / pokemon.maxhp) * 100
  healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0: progress}%`
  playerTag === "you" && syncStatsMeta(pokemon)
}

function loadMoves(playerTag) {
    const pokemon = pokemonMap[playerTag]
    const opponentPokemon = pokemonMap[opponentTag(playerTag)]
    const moveCardsContainer = document.querySelector(`.${playerTag}-controle-cont .card-container`)
    moveCardsContainer.innerHTML = ''
  for (const move of pokemon.state.moves) {
      const effectiveness = opponentPokemon.effectiveness(move.type)
      const damage = new Damage(pokemon, move)
    const cardHtml = `
    <div class="single-card-wrapper">
      <div class="card ${pokemon.state.canUseMove(move.id) ? "" : "disabled"}"  data-move-id="${move.id}" style="outline:1px solid var(--${move.type || "Normal"}-type-color)" onclick="moveCardClickHandler(event, '${playerTag}')" data-makes-contact="${!!move.flags.contact}">
          <div class="card-header" style="background-color:var(--${move.type || "Normal"}-type-color)">
            <div class="category-side">
              
              <div class="category-bg"></div>
              <div class="category-bg-triangle"></div>
              <img class="move-category-icon" width="20px" src="./assets/img/categories/${move.category}.png"  />
            </div>
            <div class="right-side">
          ${effectiveness === 1 ? ""
           :`<img class="move-effectiveness-icon"  width="15px" src="./assets/svg/arrow-${effectiveness > 1 ? "up" : "down" }.svg">`
          }
            <img class="move-type-icon"   width="20px"
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
            ${move.basePower && !["None", "Status"].includes(move.category) 
            ? `  <div class="power-data">
                ${
                move.flags.contact !== 1 
              ? ` <svg
                  class="bow-icon"
                  width="17px"
                  height="17px"
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
                  width="17px"
                  height="17px"
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
              </div>` : ``
              }
              <div class="retreat-data">
                <svg
                  fill="#000000"
                  width="17px"
                  height="17px"
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
         <strong>Damage:</strong><span class="data">${damage.count}</span>
        </div>
        <small class="desc">
         ${move.description()}
              </small>
      </div>
    </div>
    `
    moveCardsContainer.innerHTML += cardHtml
  }
}

function handleMoveCardSelect(card, playerTag) {
  if (card.classList.contains("disabled")) return
  const oponentPlayerTag = playerTag === "you" ? "enemy": "you"
  const oponentSelectedMoveCard = document.querySelector(`.${oponentPlayerTag}-controle-cont .card-container .card.selected`)
  if (oponentSelectedMoveCard){
    oponentSelectedMoveCard.classList.remove("selected")
    battle({
        [playerTag]: card.dataset.moveId,
        [oponentPlayerTag]: oponentSelectedMoveCard.dataset.moveId
    })
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


function battle(moveIds) {
    const {you: moveId, enemy: enemyMoveId} = moveIds
    const move1 = new Move(moveId)
    const move2 = new Move(enemyMoveId)
    const senario = new Map([
        [pokemon, move1],
        [enemyPokemon, move2],
    ])
    return battleField.turn(senario)
}


function loadRetreat(playerTag) {
    const retreat = pokemonMap[playerTag].state.retreat
    setRetreatPerWave(retreat, playerTag)
}

function loadHealth(playerTag) {
    const hp = pokemonMap[playerTag].stats.hp
    setTotalHealth(hp, playerTag)
}


window.onload = () => {
    globalThis.pokemonMap = {}
    loadTeams()
    loadChoosePokemon("you") 
    loadChoosePokemon("enemy") 
}