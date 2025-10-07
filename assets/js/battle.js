import { EventEmitter } from "./utils/event.js"
import { Pokemon, Move } from "./utils/models.js"
import { BATTLE_SYSTEMS } from "./utils/battle.js"
import { Damage } from "./utils/damage.js"
import { fixFloat, getParam, getPokemonsMeta, setPokemonMeta, delayedFunc, getDamageDangerLevel, flagsToObj, objToFlags } from "./utils/helpers.js"
import { PopupMsgQueue } from "./utils/dom.js"
import { loadMovesDatalist } from "./utils/dom.js";
import pokemons from "../../data/pokemons.js"


const eventEmitter = new EventEmitter()
const system = getParam("system") || "multiple"
globalThis.popupQueue = new PopupMsgQueue("popup-msg-cont");
globalThis.abilitiesPopupQueue = new PopupMsgQueue("abilities-msg-cont", 4, 3000);
globalThis.toggleMoveInfo = function (info) {
  info.classList.toggle("active")
}
globalThis.retreatBtnClickHandler = function (playerTag) {
  const selectedCard = document.querySelector(`.${playerTag}-controle-cont .card-container .card.selected`)
  const oldRetreat = pokemonMap[playerTag].state.retreat
  if (selectedCard) {
    const move = new Move(selectedCard.dataset.moveId)
    pokemonMap[playerTag].state.emit("used-move", move)
  }
  else {
    const newRetreat = Number(window.prompt("retreat", oldRetreat))
    pokemonMap[playerTag].state.retreat = newRetreat
  }
  loadPokemonData(playerTag)
}


globalThis.getEnemiesMetaBtnClickHandler = function () {
  const meta = teams.enemy.map((p) => ({
    id: p.id,
    ...p.meta
  }))
  const fieldsStr = fields.map(f => `"${f}"`).join(', ')
  const code = `startBattle(${JSON.stringify(meta, null, 2)}, [${fieldsStr}])`
  navigator.clipboard.writeText(code)
  alert(code)
}
globalThis.undoScene = function () {
  battle.undo()
  loadPokemonData("you")
  loadPokemonData("enemy")
}
globalThis.veryCloseBtnClickHandler = function ({ currentTarget }) {
  currentTarget.classList.toggle("active")
  battle.ctx.veryClose = !battle.ctx.veryClose
}
globalThis.doubleTeamDataClickHandler = (playerTag) => {
  const oldDoubleTeamsCount = pokemonMap[playerTag].state.manCount
  const newVal = parseInt(window.prompt(`Set the double team data of ${playerTag}`, oldDoubleTeamsCount))
  setDoubleTeamData(newVal, playerTag)
  pokemonMap[playerTag].state.manCount = newVal
}
globalThis.closePlayerSettingsForm = function ({ currentTarget }) {
  const playerSettingsForm = document.querySelector(".player-settings-form")
  playerSettingsForm.parentElement.classList.remove("active")

  // abilities cleanup
  const abilitiesWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.abilities .wrapper')
  abilitiesWrapper.innerHTML = ''

  // items cleanup
  const itemsWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.items .wrapper')
  itemsWrapper.innerHTML = ''
}
globalThis.progressbarClickHandler = ({ currentTarget }, playerTag) => {
  if (currentTarget.classList.contains("health")) {
    // health progress-bar clicked
    const pokemon = pokemonMap[playerTag]
    let newHp = prompt(`health of ${playerTag}`, pokemon.hp)
    newHp = pokemon.state.stats.set("hp", newHp)
    setCurrentHealth("health", newHp, playerTag)
  } else {
    // armor progress-bar clicked
    const oldHp = pokemonMap[playerTag].state.armor.hp()
    console.error(`modifying armor hp not implemented yet`)
    //let newArmourHp = prompt(`armor of ${playerTag}`, oldHp)
    //setCurrentHealth("armor-hp",newArmourHp, playerTag)

  }
}


globalThis.switchPokemonClickHandler = function ({ currentTarget }, playerTag) {
  if (!currentTarget.classList.contains("disabled")) {
    const parent = currentTarget.parentElement
    parent.querySelector(".pokemon.active")?.classList.remove("active")
    currentTarget.classList.add("active")
    switchPokemon(playerTag, currentTarget.dataset.index)
  }
}

globalThis.showStatEditForm = function (playerTag) {
  const pokemon = pokemonMap[playerTag]
  const oldStatChanges = objToFlags(pokemon.state.stats._statChanges)
  const newStatChanges = flagsToObj(
    window.prompt(`edit stat changes of "${playerTag}"`, oldStatChanges)
  )
  pokemon.state.stats._statChanges = newStatChanges

  setStatChanges(pokemon.state.stats._statChanges, playerTag)
}



globalThis.showEffectsEditForm = function (playerTag) {
  const pokemon = pokemonMap[playerTag]
  const oldEffects = pokemon.state.effects.names().join(', ')
  const newEffects = window
    .prompt(`edit stat changes of "${playerTag}"`, oldEffects)
    .split(', ')
    .map(e => e.trim())
  pokemon.state.effects.sync(...newEffects)
  setEffects(pokemon.state.effects.all(), playerTag)
}
globalThis.toggleMirror = function (playerTag, { currentTarget }) {
  currentTarget.classList.toggle("active")
  let opponentTeam = teams[opponentTag(playerTag)]

  if (currentTarget.classList.contains("active")) {
    toggleMirrorChoosePokemons(playerTag)
    teams[playerTag].forEach(p => {
      p.meta.mirror = true
      opponentTeam.push(p)
    })
    clickOnFirstPokemonSwitch(opponentTag(playerTag),true)
  }

  else {
    toggleMirrorChoosePokemons(playerTag)
    teams[opponentTag(playerTag)] = opponentTeam.filter(p => !p.meta.mirror)
    
    teams[playerTag].forEach(p => {
      p.meta.mirror = false
    })
        clickOnFirstPokemonSwitch(opponentTag(playerTag))

  }

}
globalThis.showPlayerSettingsForm = function (playerTag) {
  const playerSettingsForm = document.querySelector(".player-settings-form")
  playerSettingsForm.parentElement.classList.add("active")
  playerSettingsForm.querySelector(".header > .name").textContent = playerTag
  loadCurrentHealthPercentage(playerTag)
  loadAbilities(playerTag)
  loadItems(playerTag)
  loadEasyStats(playerTag)
  loadTokenStats(playerTag)
  // global
  loadActiveFeilds()
}
function loadCurrentHealthPercentage(playerTag) {
  const healthElm = document.querySelector(".player-settings-form .settings-wrapper .extra-data .health-percent > .value") 
  healthElm.textContent = `${Math.floor((pokemonMap[playerTag].hp/pokemonMap[playerTag].maxhp)*100)} % `;
  
}
function loadActiveFeilds() {
  const fieldElmList = document.querySelectorAll(".player-settings-form .fields-cont .field")
  const activeFieldsTypeList = []
  for (const { type } of battle.fields) {
    activeFieldsTypeList.push(type)
  }
  for (const fieldElm of fieldElmList) {
    const currentFieldType = fieldElm.classList[1]
    if (activeFieldsTypeList.includes(currentFieldType))
      fieldElm.classList.add("active")
    else
      fieldElm.classList.remove("active")
  }
}
globalThis.fieldClickHandler = function ({ currentTarget }) {
  const fieldType = currentTarget.classList[1]
  if (currentTarget.classList.contains("active"))
    battle.removeField(fieldType)
  else
    battle.addField(fieldType)
  loadActiveFeilds()
}

globalThis.showActiveFieldsBtnClickHandler = function ({ currentTarget }) {
  currentTarget.classList.toggle("active")
  const onlyActiveFieldsWrapper = currentTarget.parentElement.querySelector(".only-active-fields-wrapper")
  onlyActiveFieldsWrapper.innerHTML = ""
  // loading all active fields
  for (const field of battle.fields) {
    const fieldElm = document.createElement("strong")
    fieldElm.className = "field active"
    fieldElm.classList.add(field.type)
    fieldElm.textContent = `${field.type} (${field.lifetime?.turns || "*"})`
    onlyActiveFieldsWrapper.appendChild(fieldElm)
    fieldElm.style.backgroundColor = `var(--${field.type}-type-color)`

  }
  //battle
}
function loadEasyStats(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const stats = pokemon.state.stats._statChanges
  const statsWrapper = document.querySelector(".player-settings-form .settings.stats")
  statsWrapper.innerHTML = ""
  for (const stat in stats) {
    const statElm = document.createElement("div")
    statElm.className = "stat"
    statElm.setAttribute("data-stat-name", stat)
    statElm.innerHTML = `
                 <p data-value="${stats[stat]}" class="stat-name">${stat.toUpperCase()}:</p>
             <div class="button-wrapper">
           <svg class="increase-btn" onclick="increaseStat('${playerTag}','${stat}')"   width="25px" height="25px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z" fill="#009c1a"></path> </g></svg>
            <svg class="decrease-btn" onclick="decreaseStat('${playerTag}','${stat}')"  width="25px" height="25px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z" fill="#ff1212"></path> </g></svg>
             </div>
  `
    statsWrapper.appendChild(statElm)
  }
}

globalThis.increaseStat = function (playerTag, statName) {
  const pokemon = pokemonMap[playerTag]
  pokemon.state.stats._statChanges[statName] = pokemon.state.stats._statChanges[statName] + 0.5
  setStatChanges(pokemon.state.stats._statChanges, playerTag)
  loadEasyStats(playerTag)

}
globalThis.decreaseStat = function (playerTag, statName) {
  const pokemon = pokemonMap[playerTag]
  pokemon.state.stats._statChanges[statName] = pokemon.state.stats._statChanges[statName] - 0.5
  setStatChanges(pokemon.state.stats._statChanges, playerTag)
  loadEasyStats(playerTag)

}
function updateAllAdjFlag(isActive, capacity) {
  const allAdjElm = document.getElementById("all-adj-data")
  if (isActive) {
    allAdjElm.classList.add("active")
    allAdjElm.textContent = `Adjasten ( ${capacity} )`
  }
  else {
    allAdjElm.classList.remove("active")
    allAdjElm.textContent = "Adjasten"

  }

}
function loadVeryCloseBtn() {
  const btn = document.getElementById("very-close-btn")
  battle.ctx.veryClose
    ? btn.classList.add("active")
    : btn.classList.remove("active")
}

function syncStatsMeta(pokemon) {
  pokemon.meta.stats.hp = pokemon.state.stats.get("hp")
  setPokemonMeta(pokemon.id, pokemon.meta)
}

function setBattleListeners() {
  battle.on(["wave", "turn"], function () {
    if (system === "single" && this._event === "turn") return
    popupQueue.add(`New ${this._event}!`, "you")
  })

  const dodgeDataCollector = (data) => {
    let i = 1
    return (move) => {
      if (move.id === "dodge" && move._dodgeMatrix.every(Boolean)) {
        data[i / 2] = true
      }
      i++
    }
  }
  let dodgeData = {}
  let enemyDodgeData = {}

  battle.on("$counterclonestart", (sc1, sc2) => {
    if (!sc1 || !sc2) return
    pokemonMap["you"].state.on("used-move", dodgeDataCollector(dodgeData), "dodge-data-collector")
    pokemonMap["enemy"].state.on("used-move", dodgeDataCollector(enemyDodgeData), "dodge-data-collector")
  })

  battle.on("$counterclonecomplete", (moves1, moves2) => {
    if (moves1.length === 0 || moves2.length === 0) {
      setTimeout(() => hideShadowCloneSceneController(), 3000)
    }
    else {
      const data1 = moves1.map((m, i) => ({ move: m, isDodged: dodgeData[i + 1] ?? false }))
      const data2 = moves2.map((m, i) => ({ move: m, isDodged: enemyDodgeData[i + 1] ?? false }))

      showShadowCloneAutoSceneController(data1, data2)
      dodgeData = {}
      enemyDodgeData = {}
    }

    const cleanTags = ["dodge-data-collector", "dodge-detector"]
    cleanTags.forEach(tag => {
      pokemonMap["you"].state.removeListener("used-move", tag)
      pokemonMap["enemy"].state.removeListener("used-move", tag)
    })
  })
}


const opponentTag = tag => (tag === "you" ? "enemy" : "you")

function addFieldMove(playerTag, moveId, per) {
  const pokemon = pokemonMap[playerTag]
  const move = pokemon.state.addMove(moveId)
  pokemon.state.on("scene", () => {
    pokemon.state.damage.chainModifyPower(moveId, per / 100)
  })
  loadPokemonData(playerTag)
}

globalThis.removeMove = function (playerTag, moveId) {
  const pokemon = pokemonMap[playerTag]
  pokemon.state.removeMove(moveId)
  loadPokemonData(playerTag)
}


function loadPokemonData(playerTag) {

  const pokemon = pokemonMap[playerTag]
  const hp = pokemon.state.stats.get("hp")
  const oldHp = pokemon.state.stats.prev.get("hp")

  loadVeryCloseBtn()
  setCurrentRetreat(pokemon.state.retreat, playerTag)
  setStatChanges(pokemon.state.stats._statChanges, playerTag)
  loadHealth(playerTag)
  loadAHealth(playerTag)
  setCurrentHealth("health", hp, playerTag)
  setCurrentHealth("armor-hp", pokemon.state.armor.hp(), playerTag)
  setDoubleTeamData(pokemon.state.manCount, playerTag)
  loadMoves(playerTag)
  setRetreatPerWave(pokemonMap[playerTag].meta.retreat,playerTag)
 // setRetreatChargeForAbilities(pokemon.abilities.retreatCost(), playerTag)
 
  if (hp !== oldHp) {
    const hpDist = fixFloat(hp - oldHp)
    const msg = `${0 < hpDist ? '+' : ''} ${hpDist} ${0 > hpDist ? `(${getDamageDangerLevel(pokemon, -hpDist)})` : ''}`
    //popupQueue.add(msg, playerTag)
  }

  if (hp === 0) {
    const winnerTag = opponentTag(playerTag)
    //handleWin(winnerTag, playerTag)
  }
}

function loadEffects(playerTag) {
  const pokemon = pokemonMap[playerTag]
  setEffects(pokemon.state.effects.all(), playerTag)
}

function setBattleStateListeners(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const opponent = pokemonMap[opponentTag(playerTag)]

  pokemon.state.on("wave", () => {
    loadPokemonData(playerTag)
  })
  pokemon.state.on("scene", () => {
    loadEffects(playerTag)
  })
  pokemon.state.tailListener("scene-end", () => {
    setTimeout(() => {
      globalThis.teams = {
        "you": battle.team1,
        "enemy": battle.team2
      }
      loadEffects(playerTag)
      setStatChanges(pokemon.state.stats._statChanges, playerTag)
      loadChoosePokemon(playerTag)
      loadPokemonData(playerTag)
    }, 100)
  })

  // dodge pop up
  pokemon.state.on("used-move", move => {
    if (move.id === "dodge") {
      const dodgedCount = move._dodgeMatrix.filter(Boolean).length
      const failedCount = move._dodgeMatrix.length - dodgedCount
      if (!dodgedCount) return
      let msg = null
      if (move._dodgeMatrix.length === 1 && dodgedCount)
        msg = 'Dodged!'
      else if (move._dodgeMatrix.length > 1)
        msg = `${dodgedCount}x Dodged, ${failedCount} failed!`

      msg && popupQueue.add(msg, playerTag, 2500)
    }

  })

  // critical pop up + refresh retreat
  pokemon.state.tailListener("used-move", move => {
    const pokemon = pokemonMap[playerTag]
    setCurrentRetreat(pokemon.state.retreat, playerTag)

    if (!move.hit) return
    if (move.hit.damage() <= 0) return;
    let msg = null
    if (move.hits === 1 && move.hit.criticalCount() === 1) {
      msg = 'Critical Hit!'
    }
    else if (move.hits > 1) {
      msg = `${move.hits} Hits ${move.hit.criticalCount() ? `, (${move.hit.criticalCount()} Crit)` : ''} !`
    }
    msg && popupQueue.add(msg, opponentTag(playerTag), 3500)
  })

  // KO popup
  pokemon.state.on("used-move", move => {
    if (move._bp === Infinity)
      popupQueue.add("K.O!", opponentTag(playerTag), 3500)
  })

  pokemon.state.on('fainted', () => {

    const pokemonSwitchBtn = document.querySelector(`.${playerTag}-controle-cont .pokemon-switch-controler .pokemon:not(.disabled)`)
    pokemonSwitchBtn?.click()


  })

  battle.prompt(pokemon).reply("dodge", () => {
    return showDodgeBattlePrompt("Want to Dodge?", playerTag)
  })

  battle.prompt(pokemon).reply("counterclone", (cloneMove, counterMove) => {
    showShadowCloneSceneController(playerTag)
    addShadowCloneScene(cloneMove.id)
    if (counterMove) {
      setShadowCloneSceneTargetMove(counterMove.id)
      return counterMove
    }
    return new Promise((resolve, _) => {
      eventEmitter.once("move-card-select", (card, tag) => {
        if (playerTag !== tag) return
        const storedMove = pokemon.state.moves.find(move => move.id === card.dataset.moveId)
        const move = new Move(card.dataset.moveId, storedMove._meta)
        setShadowCloneSceneTargetMove(move.id)
        resolve(move)
        let i = 1
        opponent.state.on("used-move", move => {
          if (move.id === "dodge" && move._dodgeMatrix.every(Boolean)) {
            setShadowCloneSceneTargetDodged(i / 2, opponentTag(playerTag))
          }
          i++
        }, "dodge-detector")
      })
    })
  })


  battle.prompt(pokemon).reply("adjacent_counter_stack", (adjacentMove) => {
    return new Promise((resolve, _) => {
      updateAllAdjFlag(true, adjacentMove.capacity - 1)
      const pokemonToSelect = document.querySelector(`.pokemon-switch-controler .pokemon[data-name="${pokemon.meta.name}"]`)
      pokemonToSelect.click()

      eventEmitter.once("move-card-select", (card, tag) => {
        updateAllAdjFlag(adjacentMove.capacity - 2 > 0, adjacentMove.capacity - 1)
        const selectedPokemonName = document.querySelector(`.${tag}-controle-cont .pokemon-switch-controler .pokemon.active`)?.dataset.name
        const p = teams[tag].find(p => p.name === selectedPokemonName)
        const storedMove = p.state.moves.find(move => move.id === card.dataset.moveId)
        const move = new Move(card.dataset.moveId, storedMove._meta)
        resolve([p, move])
      })
    })
  })
}
function toggleMirrorChoosePokemons(playerTag) {
  const pokemonSwitchControler = document.querySelector(`.${opponentTag(playerTag)}-controle-cont .pokemon-switch-controler`)
  let i = teams[opponentTag(playerTag)].length
  pokemonSwitchControler.classList.toggle("mirror-mode")
 
  if (pokemonSwitchControler.classList.contains("mirror-mode")) {
    for (const pokemon of teams[playerTag]) {
      pokemonSwitchControler.innerHTML += `
          <div class="pokemon ${pokemon.isFainted ? "disabled" : ""} mirror" data-name="${pokemon.meta.name}" onclick="switchPokemonClickHandler(event, '${opponentTag(playerTag)}')" data-index="${i}">
                  <svg class="pokeball-icon" height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 511.985 511.985" xml:space="preserve" fill="grey">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path style="fill:black;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-34.554,0-68.083,6.773-99.645,20.125 c-30.483,12.89-57.865,31.351-81.373,54.85c-23.499,23.507-41.959,50.889-54.85,81.372C6.774,187.91,0,221.44,0,255.993 c0,34.56,6.773,68.091,20.125,99.652c12.89,30.469,31.351,57.857,54.85,81.357c23.507,23.516,50.889,41.967,81.373,54.857 c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857 c23.5-23.5,41.951-50.889,54.842-81.357c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z "></path>
          <path style="fill:#E6E9ED;" d="M0.102,263.18c0.875,32.014,7.593,63.092,20.023,92.465c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125 c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357c12.438-29.373,19.156-60.451,20.031-92.465 H0.102z"></path> <path style="fill:#434A54;" d="M510.765,281.211c0.812-8.344,1.219-16.75,1.219-25.218c0-9.516-0.516-18.953-1.531-28.289 c-12.719,1.961-30.984,4.516-53.998,7.054c-43.688,4.82-113.904,10.57-200.463,10.57c-86.552,0-156.776-5.75-200.455-10.57 c-23.022-2.539-41.28-5.093-53.998-7.054C0.516,237.04,0,246.478,0,255.993c0,8.468,0.406,16.875,1.219,25.218 c41.53,6.25,133.027,17.436,254.773,17.436S469.234,287.461,510.765,281.211z"></path> <path style="fill:#E6E9ED;" d="M309.334,266.656c0,29.459-23.891,53.334-53.342,53.334c-29.452,0-53.334-23.875-53.334-53.334 c0-29.453,23.882-53.327,53.334-53.327C285.443,213.33,309.334,237.204,309.334,266.656z"></path> <path style="fill:#434A54;" d="M255.992,170.66c-52.936,0-95.997,43.069-95.997,95.997s43.062,95.988,95.997,95.988 s95.996-43.061,95.996-95.988C351.988,213.729,308.928,170.66,255.992,170.66z M255.992,309.335 c-23.522,0-42.663-19.156-42.663-42.678c0-23.523,19.14-42.663,42.663-42.663c23.531,0,42.654,19.14,42.654,42.663 C298.646,290.178,279.523,309.335,255.992,309.335z"></path> <path style="opacity:0.2;fill:#FFFFFF;enable-background:new ;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-3.57,0-7.125,0.078-10.664,0.219 c30.789,1.25,60.662,7.93,88.974,19.906c30.498,12.89,57.873,31.351,81.371,54.85c23.5,23.507,41.969,50.889,54.857,81.372 c13.359,31.562,20.109,65.092,20.109,99.646c0,34.56-6.75,68.091-20.109,99.652c-12.889,30.469-31.357,57.857-54.857,81.357 c-23.498,23.516-50.873,41.967-81.371,54.857c-28.312,11.969-58.186,18.656-88.974,19.906c3.539,0.141,7.093,0.219,10.664,0.219 c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357 c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z"></path> <path style="opacity:0.1;enable-background:new ;" d="M20.125,355.645c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c3.57,0,7.125-0.078,10.664-0.219 c-30.789-1.25-60.67-7.938-88.982-19.906c-30.483-12.891-57.857-31.342-81.364-54.857c-23.507-23.5-41.96-50.889-54.858-81.357 c-13.352-31.56-20.117-65.091-20.117-99.652c0-34.554,6.765-68.084,20.116-99.646C54.35,125.864,72.803,98.481,96.31,74.983 c23.507-23.507,50.881-41.968,81.364-54.858c28.312-11.976,58.193-18.656,88.982-19.906c-3.539-0.14-7.094-0.218-10.664-0.218 c-34.554,0-68.083,6.773-99.645,20.125c-30.483,12.89-57.865,31.351-81.373,54.858c-23.499,23.499-41.959,50.881-54.85,81.364 C6.774,187.91,0,221.44,0,255.993C0,290.553,6.774,324.085,20.125,355.645z"></path>
        </g>
      </svg>
            <span class="name">${pokemon.meta.name ?? pokemon.name}</span>
          </div>
    `
      i++
    }
   
  } else {
     pokemonSwitchControler.querySelectorAll(".pokemon").forEach(pokemon => {
      if (pokemon.classList.contains("mirror") )
      pokemonSwitchControler.removeChild(pokemon)
     })

  }
}

function loadChoosePokemon(playerTag) {
  const team = teams[playerTag]
   if (team[0].meta.mirror) 
     return null

  const pokemonSwitchControler = document.querySelector(`.${playerTag}-controle-cont .pokemon-switch-controler`)
  if (pokemonSwitchControler.classList.contains("mirror-mode")) return null
 
  pokemonSwitchControler.innerHTML = ""
  const activePokemon = playerTag === "you" ? globalThis.pokemon : globalThis.enemyPokemon
  let i = 0
  for (const pokemon of team) {
    pokemonSwitchControler.innerHTML += `
          <div class="pokemon ${pokemon.isFainted ? "disabled" : ""} ${pokemon.meta.name === activePokemon?.meta.name ? "active" : ""}" data-name="${pokemon.meta.name}" onclick="switchPokemonClickHandler(event, '${playerTag}')" data-index="${i}">
                  <svg class="pokeball-icon" height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 511.985 511.985" xml:space="preserve" fill="#000000">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path style="fill:#ED5564;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-34.554,0-68.083,6.773-99.645,20.125 c-30.483,12.89-57.865,31.351-81.373,54.85c-23.499,23.507-41.959,50.889-54.85,81.372C6.774,187.91,0,221.44,0,255.993 c0,34.56,6.773,68.091,20.125,99.652c12.89,30.469,31.351,57.857,54.85,81.357c23.507,23.516,50.889,41.967,81.373,54.857 c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857 c23.5-23.5,41.951-50.889,54.842-81.357c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z "></path>
          <path style="fill:#E6E9ED;" d="M0.102,263.18c0.875,32.014,7.593,63.092,20.023,92.465c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c34.561,0,68.092-6.781,99.652-20.125 c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357c12.438-29.373,19.156-60.451,20.031-92.465 H0.102z"></path> <path style="fill:#434A54;" d="M510.765,281.211c0.812-8.344,1.219-16.75,1.219-25.218c0-9.516-0.516-18.953-1.531-28.289 c-12.719,1.961-30.984,4.516-53.998,7.054c-43.688,4.82-113.904,10.57-200.463,10.57c-86.552,0-156.776-5.75-200.455-10.57 c-23.022-2.539-41.28-5.093-53.998-7.054C0.516,237.04,0,246.478,0,255.993c0,8.468,0.406,16.875,1.219,25.218 c41.53,6.25,133.027,17.436,254.773,17.436S469.234,287.461,510.765,281.211z"></path> <path style="fill:#E6E9ED;" d="M309.334,266.656c0,29.459-23.891,53.334-53.342,53.334c-29.452,0-53.334-23.875-53.334-53.334 c0-29.453,23.882-53.327,53.334-53.327C285.443,213.33,309.334,237.204,309.334,266.656z"></path> <path style="fill:#434A54;" d="M255.992,170.66c-52.936,0-95.997,43.069-95.997,95.997s43.062,95.988,95.997,95.988 s95.996-43.061,95.996-95.988C351.988,213.729,308.928,170.66,255.992,170.66z M255.992,309.335 c-23.522,0-42.663-19.156-42.663-42.678c0-23.523,19.14-42.663,42.663-42.663c23.531,0,42.654,19.14,42.654,42.663 C298.646,290.178,279.523,309.335,255.992,309.335z"></path> <path style="opacity:0.2;fill:#FFFFFF;enable-background:new ;" d="M491.859,156.348c-12.891-30.483-31.342-57.865-54.842-81.372 c-23.516-23.5-50.904-41.96-81.373-54.85c-31.56-13.351-65.091-20.125-99.652-20.125c-3.57,0-7.125,0.078-10.664,0.219 c30.789,1.25,60.662,7.93,88.974,19.906c30.498,12.89,57.873,31.351,81.371,54.85c23.5,23.507,41.969,50.889,54.857,81.372 c13.359,31.562,20.109,65.092,20.109,99.646c0,34.56-6.75,68.091-20.109,99.652c-12.889,30.469-31.357,57.857-54.857,81.357 c-23.498,23.516-50.873,41.967-81.371,54.857c-28.312,11.969-58.186,18.656-88.974,19.906c3.539,0.141,7.093,0.219,10.664,0.219 c34.561,0,68.092-6.781,99.652-20.125c30.469-12.891,57.857-31.342,81.373-54.857c23.5-23.5,41.951-50.889,54.842-81.357 c13.344-31.561,20.125-65.092,20.125-99.652C511.984,221.44,505.203,187.91,491.859,156.348z"></path> <path style="opacity:0.1;enable-background:new ;" d="M20.125,355.645c12.89,30.469,31.351,57.857,54.85,81.357 c23.507,23.516,50.889,41.967,81.373,54.857c31.562,13.344,65.091,20.125,99.645,20.125c3.57,0,7.125-0.078,10.664-0.219 c-30.789-1.25-60.67-7.938-88.982-19.906c-30.483-12.891-57.857-31.342-81.364-54.857c-23.507-23.5-41.96-50.889-54.858-81.357 c-13.352-31.56-20.117-65.091-20.117-99.652c0-34.554,6.765-68.084,20.116-99.646C54.35,125.864,72.803,98.481,96.31,74.983 c23.507-23.507,50.881-41.968,81.364-54.858c28.312-11.976,58.193-18.656,88.982-19.906c-3.539-0.14-7.094-0.218-10.664-0.218 c-34.554,0-68.083,6.773-99.645,20.125c-30.483,12.89-57.865,31.351-81.373,54.858c-23.499,23.499-41.959,50.881-54.85,81.364 C6.774,187.91,0,221.44,0,255.993C0,290.553,6.774,324.085,20.125,355.645z"></path>
        </g>
      </svg>
            <span class="name">${pokemon.meta.name ?? pokemon.name}</span>
          </div>
    `
    i++
  }
}


function makeMyPokemons() {
  const pokemonsMeta = getPokemonsMeta()
  return Object.keys(pokemonsMeta)
    .map(id => new Pokemon(pokemonsMeta[id].id, pokemonsMeta[id], "you"))
    .filter(p => system !== "multiple" || p.meta.isSelectedForMultiBattle)
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

function registerBattle() {
  const Battle = BATTLE_SYSTEMS[system]
  globalThis.battle = new Battle(teams.you, teams.enemy, fields)

  if (system === "multiple") {
    pokemonMap = {
      "you": teams.you.find(p => p.meta.isSelectedForMultiBattle),
      "enemy": teams.enemy.find(p => p.meta.isSelectedForMultiBattle)
    }

    Object.keys(teams).forEach(t => {
      const oldP = pokemonMap[t]
      teams[t].forEach(p => {
        if (!p.meta.isSelectedForMultiBattle) return
        pokemonMap[t] = p
        setBattleStateListeners(t)
      })
      pokemonMap[t] = oldP
    })
  }
}

function switchPokemon(playerTag, index) {
  if (playerTag === "you") {
    globalThis.pokemon = teams.you[index]
    globalThis.pokemonMap["you"] = pokemon
  }
  else {

    globalThis.enemyPokemon = teams.enemy[index]

    globalThis.pokemonMap["enemy"] = enemyPokemon
  }

  if (globalThis.pokemon && globalThis.enemyPokemon) {
    setupCurrentBattle(playerTag)
  }

  if (globalThis.pokemon && globalThis.enemyPokemon) {
    const diff = pokemon.cp() - enemyPokemon.cp()
    popupQueue.add(`CP: ${pokemon.cp()} ${diff > 0 ? `  ↑${diff}` : ''}`, "you", 2000)
    popupQueue.add(`CP: ${enemyPokemon.cp()} ${diff < 0 ? `  ↑${diff}` : ''} `, "enemy", 2000)
  }
}

function setupCurrentBattle(switcher) {
  battle.activate(pokemon)
  battle.activate(enemyPokemon)
  setupPokemonForDom("you")
  setupPokemonForDom("enemy")
}

function setupPokemonForDom(playerTag) {
  setBattleStateListeners(playerTag)
  loadRetreat(playerTag)
  loadPokemonData(playerTag)
  loadEffects(playerTag)
}

//todo
function showBattlePromptPopup(msg, playerTag) {
  const battlePromptPopup = document.querySelector(".battle-prompt-popup")
  const counterBtn = battlePromptPopup.querySelector(".btns-cont > .counter-btn")
  const dodgeBtn = battlePromptPopup.querySelector(".btns-cont > .dodge-btn")
  const nothingBtn = battlePromptPopup.querySelector(".btns-cont > .nothing-btn")
  function hideShowToggle() {
    battlePromptPopup.classList.toggle("active")
    if (playerTag === "enemy") {
      battlePromptPopup.classList.toggle("enemy")
    }
  }
  hideShowToggle()
  battlePromptPopup.querySelector(".msg").textContent = msg
  return new Promise((res, rej) => {
    counterBtn.onclick = () => {
      res("counter")
      hideShowToggle()
    }
    dodgeBtn.onclick = () => {
      res("dodge")
      hideShowToggle()
    }
    nothingBtn.onclick = () => {
      res("nothing")
      hideShowToggle()
    }

  })

}

function showDodgeBattlePrompt(msg, playerTag) {
  const battlePromptPopup = document.querySelector(".battle-prompt-popup")
  const dodgeBtn = battlePromptPopup.querySelector(".btns-cont > .dodge-btn")
  const nothingBtn = battlePromptPopup.querySelector(".btns-cont > .nothing-btn")
  function hideShowToggle() {
    battlePromptPopup.classList.toggle("active")
    if (playerTag === "enemy") {
      battlePromptPopup.classList.toggle("enemy")
    }
  }
  hideShowToggle()
  battlePromptPopup.querySelector(".msg").textContent = msg
  return new Promise((res, rej) => {
    dodgeBtn.onclick = () => {
      res(true)
      hideShowToggle()
    }
    nothingBtn.onclick = () => {
      res(false)
      hideShowToggle()
    }
  })

}


function showShadowCloneAutoSceneController(moves1, moves2) {
  const shadowCloneSceneController = document.querySelector(".shadow-clone-scene-controller")
  shadowCloneSceneController.classList.add("active")
  shadowCloneSceneController.classList.add("auto")
  const title = shadowCloneSceneController.querySelector(".title")
  title.textContent = `Shadow Clone Auto Scene ( You vs Enemy )`

  for (let i = 0; i < moves1.length; i++) {
    // for "you"
    addShadowCloneScene(moves1[i].move.id, moves1[i].isDodged, true)
    // for "enemy"
    setShadowCloneSceneTargetMove(moves2[i].move.id, moves2[i].isDodged, true)

  }

}

function showShadowCloneSceneController(playerTag) {
  const shadowCloneSceneController = document.querySelector(".shadow-clone-scene-controller")
  shadowCloneSceneController.classList.add("active")
  if (playerTag === "enemy") {
    shadowCloneSceneController.classList.add("enemy")
  }
  const title = shadowCloneSceneController.querySelector(".title")
  title.textContent = `Shadow Clone Scene Controller ( ${playerTag} )`
}
globalThis.hideShadowCloneSceneController = function () {

  const shadowCloneSceneController = document.querySelector(".shadow-clone-scene-controller")
  const shadowCloneSceneList = shadowCloneSceneController.querySelector(".shadow-clone-scene-list")

  shadowCloneSceneList.innerHTML = ""

  shadowCloneSceneController.classList.remove("active")
  if (shadowCloneSceneController.classList.contains("enemy"))
    shadowCloneSceneController.classList.remove("enemy")
  if (shadowCloneSceneController.classList.contains("auto"))
    shadowCloneSceneController.classList.remove("auto")
}

function addShadowCloneScene(cloneMoveId, isDodged = false, isAutoScene = false) {
  const cloneMove = new Move(cloneMoveId)

  const shadowCloneSceneList = document.querySelector(".shadow-clone-scene-controller .shadow-clone-scene-list")
  const currentCloneIndex = shadowCloneSceneList.querySelectorAll(".shadow-clone-scene").length

  const shadowCloneScene = document.createElement("div")
  shadowCloneScene.classList.add("shadow-clone-scene")
  shadowCloneScene.innerHTML = `
    <span style="color: var(--${cloneMove.type}-type-color);" class="clone-move-name ${isAutoScene ? isDodged ? "dodged" : "" : ""}" data-clone-index="${currentCloneIndex + 1}">${cloneMove.name}</span>
    <strong>VS</strong>
    <span class="target-move-name">?</span>
  `
  shadowCloneSceneList.appendChild(shadowCloneScene)
}


function setShadowCloneSceneTargetMove(targetMoveId, isDodged = false, isAutoScene = false) {
  const targetMove = new Move(targetMoveId)
  const cloneMoveName = document.querySelector(".shadow-clone-scene-controller .shadow-clone-scene-list .shadow-clone-scene:last-child .clone-move-name")

  const targetMoveName = document.querySelector(".shadow-clone-scene-controller .shadow-clone-scene-list .shadow-clone-scene:last-child .target-move-name")
  targetMoveName.style.color = `var(--${targetMove.type}-type-color)`
  targetMoveName.textContent = targetMove.name
  if (isDodged) {
    isAutoScene ? cloneMoveName.classList.add("dodged") : targetMoveName.classList.add("dodged")
  }
}

function setShadowCloneSceneTargetDodged(i, playerTag, both = false) {
  const shadowCloneSceneController = document.querySelector(".shadow-clone-scene-controller")
  const shadowCloneSceneList = shadowCloneSceneController.querySelector(".shadow-clone-scene-list")

  const shadowCloneScene = shadowCloneSceneList.querySelectorAll(".shadow-clone-scene")[i - 1]
  // return 0
  if (both) {
    if (playerTag === "enemy")
      shadowCloneScene.querySelector(".target-move-name").classList.add("dodged")
    else
      shadowCloneScene.querySelector(".clone-move-name").classList.add("dodged")
  }
  else
    shadowCloneScene.classList.add("dodged")

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
    "confusion": {
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
    },
    "partiallytrapped": {
      "name": "Par. Trapped",
      "color": "Normal"
    },
    "doubleteam": {
      "name": "Double Team",
      "color": "Normal"
    },
    "shadowclone": {
      "name": "Shadow Clone",
      "color": "Dark"
    },
    "aquaring": {
      "name": "Aqua Ring",
      "color": "Water"
    },
    "naturehealing": {
      "name": "Nature Healing",
      "color": "Grass"
    },
    "sage": {
      "name": "sage",
      "color": "Normal"
    },
    "paperbomb": {
      "name": "Paper Bomb",
      "color": "Normal"
    },
    "bleed": {
      "name": "Bleed",
      "color": "Normal"
    },
    "mammothskin": {
      "name": "Mammoth Skin",
      "color": "Normal"
    },
    "areasplash": {
      "name": "Area Splash",
      "color": "Normal"
    },
    "ancientmode": {
      "name": "Ancient Mode",
      "color": "Dragon"
    }
  };
  const effectsDataColumn = document.querySelector(`.${playerTag}-controle-cont .effects-data-column`)
  const effectElements = effectsDataColumn.querySelectorAll(".effect")
  effectElements.forEach((elm) => effectsDataColumn.removeChild(elm))
  effects.forEach(effect => {
    const span = document.createElement("span")
    span.classList.add("effect")
    span.style.backgroundColor = `var(--${effectsMap[effect.constructor.effectName].color}-type-color)`
    span.textContent = `${effectsMap[effect.constructor.effectName].name} ${effect.displayMeta()}`.trim()
    effectsDataColumn.insertBefore(span, effectsDataColumn.firstElementChild)
  })
}

function setStatChanges(data, playerTag) {
  const attributesDataRow = document.querySelector(`.${playerTag}-controle-cont .attributes-data-row`)
  const statElements = attributesDataRow.querySelectorAll(".stat")
  statElements.forEach((elm) => attributesDataRow.removeChild(elm))

  for (const [stat, value] of Object.entries(data)) {
    if (value === 0) continue
    const change = value > 0 ? '+' + value : value
    const span = document.createElement("span")
    span.classList.add("stat")
    span.textContent = `${stat}${change}`
    attributesDataRow.insertBefore(span, attributesDataRow.firstElementChild)
  }
}

function setRetreatPerWave(retreat, playerTag) {
  const retreatPerWave = document.querySelector(`.${playerTag}-controle-cont .retreat-per-wave`)

  retreatPerWave.textContent = (retreat - pokemonMap[playerTag].abilities.retreatCost())
}
function setRetreatChargeForAbilities(retreat, playerTag) {
  const retreatChargeForAbilities = document.querySelector(`.${playerTag}-controle-cont .retreat-charge-for-abilities`)
  retreatChargeForAbilities.textContent = retreat
}
// retreat-charge-for-abilities
function setCurrentRetreat(retreat, playerTag) {
  const currentRetreat = document.getElementById(`${playerTag}-current-retreat`)
  currentRetreat.innerText = retreat.toFixed(2)
}

function setDoubleTeamData(count, playerTag) {
  const valueElm = document.querySelector(`.${playerTag}-controle-cont .double-team-data > .value`)
  valueElm.textContent = count
}

function setHealthPercentData(percent,playerTag) {
  const valueElm = document.querySelector(`.${playerTag}-controle-cont .health > .value`)
  valueElm.textContent = percent
}


function setTotalHealth(className, hp, playerTag) {
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .${className}.progress-bar`)
  healthProgressBar.setAttribute("data-total-hp", hp)
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".inner").style.width = '100%'
  healthProgressBar.querySelector(".current-hp").textContent = hp
  healthProgressBar.querySelector(".total-hp").textContent = hp
}

function setCurrentHealth(className, hp, playerTag) {
  const pokemon = pokemonMap[playerTag]
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .${className}.progress-bar`)
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".current-hp").textContent = hp
  // if (className === "health")
  //   healthProgressBar.querySelector(".current-hp").textContent += `(${Math.round((hp * 100) / pokemon.maxhp)}%)`
  const progress = className === "health"
    ? (hp / pokemon.maxhp) * 100
    : (hp / pokemon.state.armor.maxhp()) * 100
  healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0 : progress}%`
}

function loadMoves(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const opponentPokemon = pokemonMap[opponentTag(playerTag)]
  const moveCardsContainer = document.querySelector(`.${playerTag}-controle-cont .card-container`)
  moveCardsContainer.innerHTML = ''
  const veryClose = battle.ctx.veryClose === true;
  let moves = [...pokemon.state.moves].sort((a, b) => {
    const aUsable = battle.canUseMove(pokemon, a.id);
    const bUsable = battle.canUseMove(pokemon, b.id);
    if (aUsable !== bUsable) return aUsable ? -1 : 1;

    if (veryClose) {
      const aContact = a.flags.contact === 1;
      const bContact = b.flags.contact === 1;
      if (aContact !== bContact) return aContact ? -1 : 1;
    }

    const aPower = a.basePower || 0;
    const bPower = b.basePower || 0;
    if (aPower !== bPower) return bPower - aPower;

    const aDefault = a._meta?.isDefault === true;
    const bDefault = b._meta?.isDefault === true;
    if (aDefault !== bDefault) return aDefault ? 1 : -1;

    return 0;
  });

  moves = pokemon.state.moves
  for (const move of moves) {
    const mod = pokemon.state.damage.powerModifier(move.id)
    const effectiveness = opponentPokemon.effectiveness(move.type)
    const damage = new Damage(pokemon, move)
    let capacityColor = "black"
    let basePowerColor = "black"
    if (move.target === "allAdjacent" || move.target === "all") {
      capacityColor = "darkred"
      if (move.target === "all")
        basePowerColor = "darkred"
    }
    else if (move.target === "allySide" || move.target === "allies") {
      capacityColor = "darkgreen"
    }

    const cardHtml = `
    <div class="single-card-wrapper">
      <div class="card ${battle.canUseMove(pokemon, move.id) ? "" : "disabled"}"  data-move-id="${move.id}" style="outline:1px solid var(--${move.type || "Normal"}-type-color)" onclick="moveCardClickHandler(event, '${playerTag}')" data-makes-contact="${!!move.flags.contact}">
          <div class="card-header" style="background-color:var(--${move.type || "Normal"}-type-color)">
            <div class="category-side">
              
              <div class="category-bg"></div>
              <div class="category-bg-triangle"></div>
              <img class="move-category-icon" width="20px" src="./assets/img/categories/${move.category}.png"  />
            </div>
            <div class="right-side">
          ${effectiveness === 1 ? ""
        : `<img class="move-effectiveness-icon"  width="15px" src="./assets/svg/arrow-${effectiveness > 1 ? "up" : "down"}.svg">`
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
        ? `  <div class="power-data data-wrapper">
                ${move.flags.contact !== 1
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
                      fill="${basePowerColor}"
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
                      fill="${basePowerColor}"
                    ></path>
                  </g>
                </svg>`}
                :
                <span class="data">${move.basePower} ${mod !== 1 ? `(${mod > 1 ? '+' : ''}${Math.round((mod - 1) * 100)}%)` : ''}</span>
              </div>` : ``
      }
     ${move.capacity > 1
        ? `
         <div class="capacity-data data-wrapper">
<svg width="17px" height="17px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="${capacityColor}"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>target [#81]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-340.000000, -7839.000000)" fill="${capacityColor}"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M298,7689 C298,7688.448 298.448,7688 299,7688 L299.91,7688 C299.486,7685.493 297.507,7683.514 295,7683.09 L295,7684 C295,7684.552 294.552,7685 294,7685 C293.448,7685 293,7684.552 293,7684 L293,7683.09 C290.493,7683.514 288.514,7685.493 288.09,7688 L289,7688 C289.552,7688 290,7688.448 290,7689 C290,7689.552 289.552,7690 289,7690 L288.09,7690 C288.514,7692.507 290.493,7694.486 293,7694.91 L293,7694 C293,7693.448 293.448,7693 294,7693 C294.552,7693 295,7693.448 295,7694 L295,7694.91 C297.507,7694.486 299.486,7692.507 299.91,7690 L299,7690 C298.448,7690 298,7689.552 298,7689 M304,7689 C304,7689.552 303.552,7690 303,7690 L301.931,7690 C301.479,7693.617 298.617,7696.479 295,7696.931 L295,7698 C295,7698.552 294.552,7699 294,7699 C293.448,7699 293,7698.552 293,7698 L293,7696.931 C289.383,7696.479 286.521,7693.617 286.069,7690 L285,7690 C284.448,7690 284,7689.552 284,7689 C284,7688.448 284.448,7688 285,7688 L286.069,7688 C286.521,7684.383 289.383,7681.521 293,7681.069 L293,7680 C293,7679.448 293.448,7679 294,7679 C294.552,7679 295,7679.448 295,7680 L295,7681.069 C298.617,7681.521 301.479,7684.383 301.931,7688 L303,7688 C303.552,7688 304,7688.448 304,7689 M297,7689 C297,7689.552 296.552,7690 296,7690 L295,7690 L295,7691 C295,7691.552 294.552,7692 294,7692 C293.448,7692 293,7691.552 293,7691 L293,7690 L292,7690 C291.448,7690 291,7689.552 291,7689 C291,7688.448 291.448,7688 292,7688 L293,7688 L293,7687 C293,7686.448 293.448,7686 294,7686 C294.552,7686 295,7686.448 295,7687 L295,7688 L296,7688 C296.552,7688 297,7688.448 297,7689" id="target-[#81]"> </path> </g> </g> </g> </g></svg>
 
                : <span class="data">${move.capacity}</span>
              </div>
              `
        : ""
      }
        <div class="accuracy-data data-wrapper">

<svg fill="#000000" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="21px" height="21px" viewBox="0 0 72 72" enable-background="new 0 0 72 72" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M36.001,63.75C24.233,63.75,2.5,54.883,2.5,42.25c0-12.634,21.733-21.5,33.501-21.5c11.766,0,33.5,8.866,33.5,21.5 C69.501,54.883,47.767,63.75,36.001,63.75z M36.001,24.75C24.886,24.75,6.5,32.929,6.5,42.25c0,9.32,18.387,17.5,29.501,17.5 c11.113,0,29.5-8.18,29.5-17.5C65.501,32.929,47.114,24.75,36.001,24.75z"></path> </g> <g> <path d="M36.001,52.917c-5.791,0-10.501-4.709-10.501-10.5c0-5.79,4.711-10.5,10.501-10.5c5.789,0,10.5,4.71,10.5,10.5 C46.501,48.208,41.79,52.917,36.001,52.917z M36.001,33.917c-4.688,0-8.501,3.814-8.501,8.5c0,4.688,3.813,8.5,8.501,8.5 c4.686,0,8.5-3.813,8.5-8.5C44.501,37.731,40.687,33.917,36.001,33.917z"></path> </g> <g> <path d="M32.073,39.809c-0.242,0-0.484-0.088-0.677-0.264c-0.406-0.375-0.433-1.008-0.059-1.414 c0.2-0.217,0.415-0.422,0.644-0.609c0.428-0.352,1.058-0.291,1.408,0.137c0.352,0.426,0.29,1.057-0.136,1.408 c-0.158,0.129-0.307,0.27-0.444,0.418C32.612,39.7,32.342,39.809,32.073,39.809z"></path> </g> <g> <path d="M36.001,48.75c-3.494,0-6.335-2.842-6.335-6.334c0-0.553,0.448-1,1-1c0.553,0,1,0.447,1,1 c0,2.391,1.945,4.334,4.335,4.334c0.553,0,1,0.447,1,1S36.554,48.75,36.001,48.75z"></path> </g> <g> <path d="M35.876,18.25c-1.105,0-2-0.896-2-2v-6c0-1.104,0.895-2,2-2c1.104,0,2,0.896,2,2v6 C37.876,17.354,36.979,18.25,35.876,18.25z"></path> </g> <g> <path d="M24.353,18.93c-0.732,0-1.437-0.402-1.788-1.101l-1.852-3.68c-0.497-0.987-0.1-2.189,0.888-2.686 c0.985-0.498,2.188-0.101,2.686,0.887l1.852,3.68c0.496,0.987,0.099,2.189-0.888,2.686C24.962,18.861,24.655,18.93,24.353,18.93z"></path> </g> <g> <path d="M12.684,23.567c-0.548,0-1.094-0.224-1.488-0.663l-2.6-2.894c-0.738-0.822-0.671-2.087,0.151-2.824 c0.82-0.74,2.085-0.672,2.824,0.15l2.6,2.894c0.738,0.822,0.67,2.087-0.151,2.824C13.638,23.398,13.16,23.567,12.684,23.567z"></path> </g> <g> <path d="M46.581,18.93c-0.303,0-0.609-0.068-0.898-0.214c-0.986-0.496-1.383-1.698-0.887-2.686l1.852-3.68 c0.494-0.985,1.695-1.386,2.686-0.887c0.986,0.496,1.385,1.698,0.887,2.686l-1.852,3.68C48.019,18.527,47.313,18.93,46.581,18.93z "></path> </g> <g> <path d="M58.249,23.567c-0.475,0-0.953-0.169-1.336-0.513c-0.82-0.737-0.889-2.002-0.15-2.824l2.6-2.894 c0.738-0.82,2.002-0.89,2.824-0.15c0.822,0.737,0.889,2.002,0.15,2.824l-2.6,2.894C59.343,23.344,58.798,23.567,58.249,23.567z"></path> </g> </g> </g></svg>             
: <span class="data">${move.accuracy}</span>
              </div>

              <div class="retreat-data data-wrapper">
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
        
        ${'⭐ '.repeat(move._meta.grade ?? 0)}
        <div class="info damage">
         <strong>Damage:</strong><span class="data">${Math.round(damage.count * (1 / 70))}</span>
        </div>
        <small class="desc">
         ${move.description()}
              </small>
              <br/>
           <button class="remove-btn" onclick="removeMove('${playerTag}', '${move.id}')">Remove</button>   
      </div>
    </div>
    `
    moveCardsContainer.innerHTML += cardHtml
  }
  const addFieldMoveBtnHtml = `
     <div onclick="showFieldMoveForm('${playerTag}')" class="add-field-move-btn">
      <span> Add Move </span>
     </div>
  `
  moveCardsContainer.innerHTML += addFieldMoveBtnHtml
}
globalThis.showMoveDetails = function ({ currentTarget }) {
  const form = currentTarget.parentElement
  const move = new Move(currentTarget.value)
  if (move) {
    const moveDetails = form.querySelector(".move-details")
    moveDetails.querySelector(".move-name").textContent = move.name
    moveDetails.querySelector(".desc").textContent = move.description() + '\n' + JSON.stringify({
      power: move.basePower,
      category: move.category,
      priority: move.priority
    }, null, 2)
  }
}
globalThis.showFieldMoveForm = (playerTag) => {
  const fieldMoveForm = document.querySelector(".field-move-form")
  const name = fieldMoveForm.querySelector(".name")
  const moveInput = fieldMoveForm.querySelector(".move-input")
  const percentInput = fieldMoveForm.querySelector(".percent-input")
  const addBtn = fieldMoveForm.querySelector(".add-btn")
  const cancelBtn = fieldMoveForm.querySelector(".cancel-btn")

  fieldMoveForm.parentElement.classList.add("active")
  name.textContent = playerTag
  addBtn.onclick = () => {

    addFieldMove(playerTag, moveInput.value, percentInput.value)
    moveInput.value = ""
    fieldMoveForm.parentElement.classList.remove("active")

  }
  cancelBtn.onclick = () => {
    moveInput.value = ""
    fieldMoveForm.parentElement.classList.remove("active")

  }
}

eventEmitter.on("move-card-select", (card, playerTag) => {
  if (card.classList.contains("disabled")) return
  const oponentPlayerTag = playerTag === "you" ? "enemy" : "you"
  const oponentSelectedMoveCard = document.querySelector(`.${oponentPlayerTag}-controle-cont .card-container .card.selected`)
  if (oponentSelectedMoveCard) {
    oponentSelectedMoveCard.classList.remove("selected")
    runScene({
      [playerTag]: card.dataset.moveId,
      [oponentPlayerTag]: oponentSelectedMoveCard.dataset.moveId
    }).catch(console.log)
  } else {
    card.parentElement.parentElement.querySelector(".card.selected")?.classList.remove("selected")
    card.classList.add("selected")
  }
})

globalThis.moveCardClickHandler = function ({
  currentTarget
}, playerTag) {
  eventEmitter.emit("move-card-select", currentTarget, playerTag)
}

globalThis.removeItem = function (id, playerTag) {
  pokemonMap[playerTag].items.remove(id)

  try {
    pokemonMap[playerTag].state.armor.remove(id)
  } catch (error) { }
  loadItems(playerTag)
  loadTokenStats(playerTag)
}

async function runScene(moveIds) {
  const { you: moveId, enemy: enemyMoveId } = moveIds
  const move1 = new Move(moveId)
  const move2 = new Move(enemyMoveId)
  const isAlly = pokemon.state.isAlly(enemyPokemon)
  
  const oldActive = battle.getActive("you")
  const oldOppo = battle.getActive("enemy")
  
  if (isAlly) {
    battle.activate(pokemon, "you")
    battle.activate(enemyPokemon, "enemy")
  }

  const senario = new Map([
    [pokemon, move1],
    [enemyPokemon, move2],
  ])
  await battle.run(senario)

  if (isAlly) {
    battle.activate(oldActive, "you")
    battle.activate(oldOppo, "enemy")
  }
}



function loadRetreat(playerTag) {
  const retreat = pokemonMap[playerTag].meta.retreat
  setRetreatPerWave(retreat, playerTag)
}

function loadHealth(playerTag) {
  const hp = pokemonMap[playerTag].stats.hp
  setTotalHealth("health", hp, playerTag)
}
function loadAHealth(playerTag) {
  const hp = pokemonMap[playerTag].state.armor.maxhp()
  setTotalHealth("armor-hp", hp, playerTag)
}


function loadAbilities(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const abilities = pokemon.abilities._abilities

  const playerSettingsForm = document.querySelector('.player-settings-form')
  const abilitiesWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.abilities .wrapper')
  abilitiesWrapper.innerHTML = ''
  for (const ability of abilities) {
    abilitiesWrapper.innerHTML += ` <button data-retreat="${ability._ability.retreat}" type="button" onclick="toggleAbility(event,'${playerTag}','${ability.name}')" class="ability ${ability.active ? 'active' : ''}">${ability.name}</button>`
  }
}
/*function loadHealth(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const abilities = pokemon.abilities._abilities
  
  const playerSettingsForm = document.querySelector('.player-settings-form')
  const abilitiesWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.abilities .wrapper')
  abilitiesWrapper.innerHTML = ''
  for (const ability of abilities) {
    abilitiesWrapper.innerHTML += ` <button data-retreat="${ability._ability.retreat}" type="button" onclick="toggleAbility(event,'${playerTag}','${ability.name}')" class="ability ${ability.active ? 'active' : ''}">${ability.name}</button>`
  }
}*/
function loadItems(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const items = pokemon.items._items

  const playerSettingsForm = document.querySelector('.player-settings-form')
  const itemsWrapper = playerSettingsForm.querySelector('.settings-wrapper .settings.items .wrapper')
  itemsWrapper.innerHTML = ''
  for (const item of items) {
    itemsWrapper.innerHTML += `         
     <div class="item">
                <span class="name">${item.id}</span>
                <button onclick="removeItem('${item.id}', '${playerTag}')" class="remove-btn">x</button>
              </div>
`
  }
}
function loadTokenStats(playerTag) {
  const pokemon = pokemonMap[playerTag]
  const tokenStats = structuredClone(pokemon.tokens)

  for (const [key, value] of Object.entries(tokenStats)) {
    tokenStats[key] = `${pokemon.state.stats.get(key)} (${value < 0 ? '' : '+'}${value})`
  }

  const playerSettingsForm = document.querySelector('.player-settings-form')
  const preStats = playerSettingsForm.querySelector('.settings-wrapper .settings.token-stats .stats')
  preStats.innerHTML = JSON.stringify(tokenStats, null, 2)
}
globalThis.toggleAbility = function ({ currentTarget }, playerTag, ability_name) {
  currentTarget.classList.toggle("active")
  pokemonMap[playerTag].abilities.toggle(ability_name);
  loadTokenStats(playerTag)
  loadPokemonData(playerTag)
  loadPokemonData(opponentTag(playerTag))
  loadAbilities(playerTag)
}



function clickOnFirstPokemonSwitch(playerTag,mirror = false) {
  const pokemonSwitchControler = document.querySelector(`.${playerTag}-controle-cont .pokemon-switch-controler`)
  if (mirror) {
    pokemonSwitchControler.querySelector(`.pokemon.mirror`).click()
  }else {
  pokemonSwitchControler.querySelector(`.pokemon`).click()
    
  }
  // log
}
window.onload = () => {
  globalThis.pokemonMap = {}
  globalThis.fields = getParam("fields")?.split(',').filter(Boolean) ?? []
  loadTeams()
  registerBattle()
  loadChoosePokemon("you")
  loadChoosePokemon("enemy")
  loadMovesDatalist("moves-data-list")
  clickOnFirstPokemonSwitch("you")
  clickOnFirstPokemonSwitch("enemy")
  setBattleListeners()
}


