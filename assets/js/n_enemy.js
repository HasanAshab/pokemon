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
    </div>

    <div class="move-section">
      <h4>Mega Moves</h4>
      <div class="mega-moves-list"></div>
      <button type="button" onclick="addMove(event, true)">Add Mega Move</button>
    </div>
  `;
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
    const xp = parseInt(form.querySelector('.level-inp')?.value || '1', 10) * 100; // Example XP logic
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
globalThis.removeMove = removeMove
globalThis.fieldClickHandler = function({currentTarget}){
    currentTarget.classList.toggle("active")
}
globalThis.selectRandomFields = function(){
 const fields = document.querySelectorAll(".fields-cont > .field")
 const startIndex = Math.floor(Math.random() * fields.length)
 const totalFeildsToSelect = Math.floor(Math.random() * 6) + 1
 let fieldsSelected = 0
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
