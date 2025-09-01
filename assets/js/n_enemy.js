import {initAllMultyInputBox,getMultyInputValues, loadPokemonsDatalist, loadNaturesDataList, loadMovesDatalist, startBattle } from "./utils/dom.js";
import { BATTLE_SYSTEMS } from "./utils/battle.js"
import MOVES from "../../data/moves.js"
import { Move } from "./utils/models.js";

import { objToFlags,flagsToObj } from "./utils/helpers.js";

window.onload = () => {
    loadPokemonsDatalist("enemy-data-list")
    loadNaturesDataList("natures-data-list")
    loadMovesDatalist("moves-data-list")
    loadBattleSystems()
    addEnemy()
}

let enemyCount = 0;

document.getElementById('add-enemy-btn').addEventListener('click', addEnemy);

function loadBattleSystems() {
    const selectElement = document.getElementById('sys-select');
    Object.keys(BATTLE_SYSTEMS).forEach(optionText => {
      const option = document.createElement('option');
      option.value = optionText.toLowerCase().replace(/\s+/g, '-');  // Converts spaces to hyphens for value
      option.textContent = optionText;
      selectElement.appendChild(option);
    });
}

function addEnemy() {
  const container = document.getElementById('enemies-container');
  const div = document.createElement('div');
  div.className = 'pokemon-form';
  div.dataset.index = enemyCount;
  div.innerHTML = getEnemyForm(enemyCount);
  container.appendChild(div);
  enemyCount++;
  initAllMultyInputBox()

}

function getEnemyForm(index) {
  return `
    <h3>Enemy ${index + 1}</h3>
    <label>Choose Enemy Image</label>
    <input list="enemy-data-list" class="enemy" onblur="showStats(event)">
    <br>
    <label>Name</label>
    <input type="text" class="name-inp" value="E${index + 1}">
    <br>
    <label>Level</label>
    <input type="number" class="level-inp" value="1" onchange="showStats(event)">
    <br>
    <label>Retreat</label>
    <input type="number" class="retreat-inp" value="2">
    <br>
    <label>Nature</label>
    <input list="natures-data-list" value="calm" type="text" onblur="showStats(event)" class="nature-inp">
    <br>
    <label>Mega Suffix</label>
    <select class="mega-suffix-select">
      <option value="mega">Mega</option>
      <option value="megax">X</option>
      <option value="megay">Y</option>
      <option value="megaz">Z</option>
    </select>
    <br>
    <label>Token Used</label>
    <textarea class="token-inp" onblur="showStats(event)">${objToFlags({
          hp:0,
          spe:0,
          atk:0,
          def:0,
          spa:0,
          spd:0
        })}</textarea>
    <br>
    <h4>Types</h4>
  <div class="multy-input-box" data-property="types" data-index=${index}>
    <div class="inputs-wrapper">
    </div>
    <div class="controller">
      
      <datalist id="multy-input-box-datalist"></datalist>
      <button class="add-input-btn">Add</button>
    </div>
    </div>
    <br>
    <h4>Abilities</h4>
  <div class="multy-input-box" data-property="abilities" data-index=${index}>
    <div class="inputs-wrapper">
    </div>
    <div class="controller">
      
      <datalist id="multy-input-box-datalist"></datalist>
      <button class="add-input-btn">Add</button>
    </div>
    </div>
    <br>
    <h4>Items</h4>
  <div class="multy-input-box" data-property="items" data-index=${index}>
    <div class="inputs-wrapper">
    </div>
    <div class="controller">
      
      <datalist id="multy-input-box-datalist"></datalist>
      <button class="add-input-btn">Add</button>
    </div>
    </div>
    <br>



    <pre class="enemy-stats">Stats will show here...</pre>

    <div class="move-section">
      <h4>Moves</h4>
      <div class="moves-list"></div>
      <button type="button" onclick="addMove(event)">Add Move</button>
      <button class="set-auto-move-btn" type="button" onclick="setMoveAutomatic(event)" >Set Automatic</button>
      </div>


  `;

  // ###########################
  // don't delete this
  //   <div class="move-section">
    //   <h4>Mega Moves</h4>
    //   <div class="mega-moves-list"></div>
    //   <button type="button" onclick="addMove(event, true)">Add Mega Move</button>
    // </div>
    // ###########################
}

function showStats(event) {
  const form = event.target.closest('.pokemon-form');
  const stats = form.querySelector('.enemy-stats');
  stats.textContent = `Enemy: ${form.querySelector('.enemy').value}\nLevel: ${form.querySelector('.level-inp').value}`;
}

function addMove(event, isMega = false) {
  const form = event.target.closest('.pokemon-form');
  const list = isMega ? form.querySelector('.mega-moves-list') : form.querySelector('.moves-list');

  const div = document.createElement('div');
  div.className = 'move-item';
  div.innerHTML = `
    <input type="text" list="moves-data-list" onblur="showMoveDetails(event)" class="${isMega ? 'mega-move-input' : 'move-input'}">
    <button type="button" onclick="removeMove(event)">X</button>
  `;
  list.appendChild(div);
}


function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

function suggestMoves(options, pokemon) {
  const totalMoves = options.mele + options.ranged;
  const physicalCount = Math.round((options.phyPer / 100) * totalMoves);
  const specialCount = Math.round((options.spePer / 100) * totalMoves);
  const statusCount = totalMoves - physicalCount - specialCount;

  const highCount = Math.round(totalMoves * 0.2);
  const midCount = Math.round(totalMoves * 0.5);
  const lowCount = totalMoves - highCount - midCount;

  let allMoves = Object.values(MOVES);
  shuffle(allMoves);
  if (options.maxPower) {
    allMoves = allMoves.filter(move => move.basePower <= options.maxPower);
  }

  const isSameType = (move) => pokemon.types.includes(move.type);
  const getPowerCategory = (move) => {
    let power = move.basePower;
    if (move.multihit) {
      const avgHits = Array.isArray(move.multihit)
        ? (move.multihit[0] + move.multihit[1]) / 2
        : move.multihit;
      power *= avgHits;
    }
    
    if (move.category === "Status") return "mid";
    if (power <= pokemon.level) return "low";
    if (power <= pokemon.level * 2) return "mid";
    if (power <= (pokemon.level * 2) + 10) return "high";
    return null;
  };

  const categorizeMoves = (moves) => {
    const categorized = { high: [], mid: [], low: [] };
    moves.forEach(move => {
      const category = getPowerCategory(move);
      category && categorized[category].push(move);
    });
    categorized.high.sort((a, b) => isSameType(b) - isSameType(a));
    categorized.mid.sort((a, b) => isSameType(b) - isSameType(a));
    categorized.low.sort((a, b) => isSameType(b) - isSameType(a));
    return categorized;
  };

  const melePhysical = categorizeMoves(allMoves.filter(move => move.flags?.contact && move.category === "Physical"));
  const meleSpecial = categorizeMoves(allMoves.filter(move => move.flags?.contact && move.category === "Special"));
  const rangedPhysical = categorizeMoves(allMoves.filter(move => !move.flags?.contact && move.category === "Physical"));
  const rangedSpecial = categorizeMoves(allMoves.filter(move => !move.flags?.contact && move.category === "Special"));
  const rangedStatus = categorizeMoves(allMoves.filter(move => !move.flags?.contact && move.category === "Status"));

  const selectedMoves = [];
  const powerCounts = { high: 0, mid: 0, low: 0 };

  const selectFromCategory = (pool, category, limit) => {
    const moves = pool[category].splice(0, Math.min(limit, pool[category].length));
    moves.forEach(move => {
      const powerCategory = getPowerCategory(move);
      powerCounts[powerCategory]++;
    });
    console.log(moves);
    
    return moves;
  };

  const selectMoves = (pool, categoryLimit, powerCategory) => {
    const selected = [];
    while (selected.length < categoryLimit && powerCounts[powerCategory] < (powerCategory === 'high' ? highCount : powerCategory === 'mid' ? midCount : lowCount)) {
      if (pool[powerCategory].length > 0) {
        const move = pool[powerCategory].shift();
        selected.push(move);
        powerCounts[powerCategory]++;
      } else {
        break;
      }
    }
    return selected;
  };

  const balancePower = (moves, pool) => {
    moves.forEach(move => {
      const currentCategory = getPowerCategory(move);
      if (powerCounts[currentCategory] > (currentCategory === 'high' ? highCount : currentCategory === 'mid' ? midCount : lowCount)) {
        for (const category of ['high', 'mid', 'low']) {
          if (powerCounts[category] < (category === 'high' ? highCount : category === 'mid' ? midCount : lowCount) && pool[category].length > 0) {
            const newMove = pool[category].shift();
            moves[moves.indexOf(move)] = newMove;
            powerCounts[currentCategory]--;
            powerCounts[category]++;
            break;
          }
        }
      }
    });
  };

  // Initial selection without power consideration
  let meleSelected = 0;
  const meleMoves = [];
  meleMoves.push(...selectFromCategory(melePhysical, 'mid', physicalCount));
  meleMoves.push(...selectFromCategory(meleSpecial, 'mid', specialCount));
  meleSelected = meleMoves.length;

  let rangedSelected = 0;
  const rangedMoves = [];
  rangedMoves.push(...selectFromCategory(rangedPhysical, 'mid', physicalCount - meleMoves.filter(m => m.category === "Physical").length));
  rangedMoves.push(...selectFromCategory(rangedSpecial, 'mid', specialCount - meleMoves.filter(m => m.category === "Special").length));
  rangedMoves.push(...selectFromCategory(rangedStatus, 'mid', statusCount - meleMoves.filter(m => m.category === "Status").length));
  rangedSelected = rangedMoves.length;

  // Balance power distribution
  balancePower(meleMoves, melePhysical);
  balancePower(meleMoves, meleSpecial);
  balancePower(rangedMoves, rangedPhysical);
  balancePower(rangedMoves, rangedSpecial);
  balancePower(rangedMoves, rangedStatus);

  selectedMoves.push(...meleMoves, ...rangedMoves);

  return selectedMoves.map(move => move.name.toLowerCase().replace(' ', ''));
}

function getDefaultPrompt() {
  const level = 20
  const nature = 'tai'
  const count = level / 4

  const meleMap = {
    'tai': 0.6,
    'nin': 0.2,
    'none': 0.5,
  }
  const rangedMap = {
    'tai': 0.4,
    'nin': 0.8,
    'none': 0.5,
  }

  const phyPerMap = {
    'tai': 60,
    'nin': 20,
    'none': 50,
  }
  const noneStatPerChoices = [20, 40]
  const statPerMap = {
    'tai': 20,
    'nin': 40,
    'none': noneStatPerChoices[Math.floor(Math.random() * noneStatPerChoices.length)],
  }
  const spePerMap = {
    'tai': 20,
    'nin': 40,
    'none': 50 - statPerMap.none,
  }

  return {
    maxPower: (level * 2) + 10,
    mele: Math[nature !== 'nin' ? 'ceil' : 'floor'](count * meleMap[nature]),
    ranged: Math[nature === 'nin' ? 'ceil' : 'floor'](count * rangedMap[nature]),
    phyPer: phyPerMap[nature],
    statPer: statPerMap[nature],
    spePer: spePerMap[nature],
  }
}

function setMoveAutomatic(event) {
  const form = event.target.closest('.pokemon-form');
  const prompt = window.prompt("Edit the prompt here", objToFlags(getDefaultPrompt()));
  const automaticCreatedMoves = suggestMoves(flagsToObj(prompt), {
    level: 20,
    types: ["Normal", "Fighting"]
  });
  const list = form.querySelector('.moves-list');
  list.innerHTML = '';
  automaticCreatedMoves.forEach(move => {
    const div = document.createElement('div');
    div.className = 'move-item';
    div.innerHTML = `
      <input type="text" list="moves-data-list" onblur="showMoveDetails(event)" class="move-input" value="${move}">
      <button type="button" onclick="removeMove(event)">X</button>
    `;
    list.appendChild(div);
  });
}
function removeMove(event) {
  const moveItem = event.target.closest('.move-item');
  moveItem.remove();
}

globalThis.showMoveDetails = function({currentTarget}){
 const moveName = currentTarget.value
  const move =  new Move(moveName)
  if (move.exists()){
    const moveDetails = document.querySelector(".move-details")
    moveDetails.querySelector(".name").textContent = move.name
    moveDetails.querySelector(".desc").textContent = move.description() + '\n' + JSON.stringify({
        power: move.basePower,
        category: move.category,
        priority: move.priority
    }, null, 2)
    showMoveMoreDetails(moveName)
 }
 
}

function showMoveMoreDetails(moveName) {
  const details = MOVES[moveName];
  document.getElementById("details").textContent = JSON.stringify(details, null, 2);
}


document.getElementById('start-battle-btn').addEventListener('click', startBattleBtnHandler);

function makeEnemiesMeta() {
  const enemiesMeta = [];

  document.querySelectorAll('.pokemon-form').forEach((form,index) => {
    const enemyId = form.querySelector('.enemy')?.value || '';
    const name = form.querySelector('.name-inp')?.value;
    const xp = (parseInt(form.querySelector('.level-inp')?.value || '1', 10) - 1) * 100; // Example XP logic
    const retreat = parseFloat(form.querySelector('.retreat-inp')?.value || '2');
    const nature = form.querySelector('.nature-inp')?.value || '';
    const megaSuffix = form.querySelector('.mega-suffix-select')?.value || '';
    const tokenUsed = form.querySelector('.token-inp')?.value || '';
    const typesRaw = form.querySelector('.types-inp')?.value || '';
    const abilitiesRaw = form.querySelector('.abilities-inp')?.value || '';
    const itemsRaw = form.querySelector('.items-inp')?.value || '';
    const types = getMultyInputValues("types",index)//typesRaw.split(',').map(item => item.trim()).filter(item => item);
    const abilities = getMultyInputValues("abilities",index)//abilitiesRaw.split(',').map(item => item.trim()).filter(item => item);
    const items = getMultyInputValues("items",index)//itemsRaw.split(',').map(item => item.trim()).filter(item => item);

    const moves = [];
    form.querySelectorAll('.moves-list .move-input').forEach(input => {
      const id = input.value.trim();
      if (id) moves.push({ id, isSelected: true });
    });

    const megaMoves = [];
    form.querySelectorAll('.mega-moves-list .mega-move-input').forEach(input => {
      const id = input.value.trim();
      if (id) megaMoves.push({ id, isSelected: true });
    });

    const enemyMeta = {
      id: enemyId,
      name,
      xp: xp,
      nature: nature,
      retreat: retreat,
      types,
      abilities,
      items,
      moves: moves,
      mega: {
        moves: megaMoves,
        suffix: megaSuffix
      },
      stats: {},
      token_used: flagsToObj(tokenUsed)
    };

    enemiesMeta.push(enemyMeta);
  });
  return enemiesMeta
}

function makeStartBattleCode(meta, fields, system = "single") {
    fields = fields.map(f => `"${f}"`).join(', ')
    return `startBattle(${JSON.stringify(meta, null, 2)}, [${fields}], "${system}")`;
}

function getActiveBattleFields(){
    const battleFields = []
    const activeFields = document.querySelectorAll(".fields-cont > .field.active")
    for (const field of activeFields){
       battleFields.push(capitalizeFirstLetter(field.classList[1]))
    }
    return battleFields
}


function startBattleBtnHandler() {
  const sysSelect = document.getElementById('sys-select');
  const code = makeStartBattleCode(
        makeEnemiesMeta(),
        getActiveBattleFields(),
        sysSelect.value
   )

  localStorage.setItem("last-battle", code)
  startBattle(makeEnemiesMeta(), getActiveBattleFields(), sysSelect.value)
}



globalThis.showStats = showStats
globalThis.addMove = addMove
globalThis.setMoveAutomatic  = setMoveAutomatic
globalThis.removeMove = removeMove
globalThis.fieldClickHandler = function({currentTarget}){
    currentTarget.classList.toggle("active")
}
globalThis.selectRandomFields = function(){
 const fields = document.querySelectorAll(".fields-cont > .field")
 const startIndex = Math.floor(Math.random() * fields.length)
 const totalFeildsToSelect = Math.floor(Math.random() * 6) + 1
 let fieldsSelected = 0

 // cleanup old active fields
 for (const field of fields){
    field.classList.remove("active")
 }
 while (fieldsSelected !== totalFeildsToSelect){
  for (let i = startIndex; i < fields.length; i++){
       
      const isSelected = (Math.floor(Math.random() * 11) + 1) <= 3 ? true : false
      if (isSelected){
          fields[i].classList.add("active")
          fieldsSelected++
      }
      if (fieldsSelected === totalFeildsToSelect)
         break;
  }
 }
}

globalThis.copyStartBattleCode = function() {
    const code = makeStartBattleCode(
        makeEnemiesMeta(),
        getActiveBattleFields()
    )
    navigator.clipboard.writeText(code)
    alert(code)
}
