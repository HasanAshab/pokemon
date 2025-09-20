import {initAllMultyInputBox,getMultyInputValues, loadPokemonsDatalist, loadNaturesDataList, loadMovesDatalist, startBattle } from "./utils/dom.js";
import { BATTLE_SYSTEMS } from "./utils/battle.js"
import MOVES from "../../data/moves.js"
import { Move , Pokemon } from "./utils/models.js";

import { objToFlags,flagsToObj, shuffle } from "./utils/helpers.js";
import { EFFECTS } from "./utils/effects.js";

window.onload = () => {
    loadPokemonsDatalist("enemy-data-list")
    loadNaturesDataList("natures-data-list")
    loadMovesDatalist("moves-data-list")
    loadBattleSystems()
    addEnemy()
}

let enemyCount = 0;



function loadBattleSystems() {
    const selectElement = document.getElementById('sys-select');
    Object.keys(BATTLE_SYSTEMS).forEach(optionText => {
      const option = document.createElement('option');
      option.value = optionText.toLowerCase().replace(/\s+/g, '-');  // Converts spaces to hyphens for value
      option.textContent = optionText;
      selectElement.appendChild(option);
    });
}
globalThis.addInput = null
globalThis.addEnemy =  function addEnemy(isDuplicate = false,formIndex = null) {
  const container = document.getElementById('enemies-container');
  const div = document.createElement('div');
  div.className = 'pokemon-form';
  div.dataset.index = enemyCount;
  div.innerHTML = getEnemyForm(enemyCount,container,isDuplicate,formIndex);
  container.appendChild(div);
  // add input is just a small gift from  the function. ignore it
  globalThis.addInput = initAllMultyInputBox().addInput
  if (isDuplicate){
    const enemyFormToDuplicate = container.querySelector(`.pokemon-form[data-index="${formIndex}"]`)
    const typesMultiInputBox = div.querySelector('.multy-input-box[data-property="types"]')
    const abilitiesMultiInputBox = div.querySelector('.multy-input-box[data-property="abilities"]')
    const itemsMultiInputBox = div.querySelector('.multy-input-box[data-property="items"]')
    const types = getMultyInputValues("types",formIndex)
    const abilities = getMultyInputValues("abilities",formIndex)
    const items = getMultyInputValues("items",formIndex)
    const enemyMoveItems = enemyFormToDuplicate.querySelectorAll('.moves-list .move-item')
   console.log(types,abilities,items);
   

    types.forEach(type => addInput(typesMultiInputBox,type))
    abilities.forEach(ability => addInput(abilitiesMultiInputBox,ability))
    items.forEach(item => addInput(itemsMultiInputBox,item))

    enemyMoveItems.forEach(item => {
      addMove(null,item.querySelector('.move-input').value, item.querySelector('.move-grade-input').value,div)
    })
    
  }
  enemyCount++;

}
globalThis.removeEnemy = function removeEnemy(index) {
  const container = document.getElementById('enemies-container');
  container.querySelector(`.pokemon-form[data-index="${index}"]`).remove();
}

function getEnemyForm(index,enemiesContainer,isDuplicate,formIndex = null) {
  let heading = `Enemy ${index + 1}`
  let name =  `E${index + 1}`
  let enemyImage = "rookie"
  let level = 20
  let retreat = 4
  let nature = "none"
  if (isDuplicate){
    const enemyFormToDuplicate = enemiesContainer.querySelector(`.pokemon-form[data-index="${formIndex}"]`)
    heading = `Enemy ${index + 1} ( Copied from Enemy ${formIndex + 1} )`
    enemyImage = enemyFormToDuplicate.querySelector('.enemy').value
    // name = enemyFormToDuplicate.querySelector('.name-inp').value
    level = enemyFormToDuplicate.querySelector('.level-inp').value
    retreat = enemyFormToDuplicate.querySelector('.retreat-inp').value
    nature = enemyFormToDuplicate.querySelector('.nature-inp').value
  
  }
  return `
    <h3>${heading}</h3>
    <label>Choose Enemy Image</label>
    <input list="enemy-data-list" class="enemy" onblur="showStats(event)" value="${enemyImage}">
    <br>
    <label>Name</label>
    <input type="text" class="name-inp" value="${name}">
    <br>
    <label>Level</label>
    <input type="number" class="level-inp" value="${level}" onchange="showStats(event)">
    <br>
    <label>Retreat</label>
    <input type="number" class="retreat-inp" value="${retreat}">
    <br>
    <label>Nature</label>
    <input list="natures-data-list" value="${nature}" type="text" onblur="showStats(event)" class="nature-inp">
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
 <br>
 <button onclick="addEnemy(true,${index})" class="duplicate-enemy-btn">Duplicate This Enemy</button>
 <button onclick="removeEnemy(${index})" class="remove-enemy-btn">Remove This Enemy</button>
  `;

  // ###########################
  // don't delete this
//       <label>Mega Suffix</label>
//     <select class="mega-suffix-select">
//       <option value="mega">Mega</option>
//       <option value="megax">X</option>
//       <option value="megay">Y</option>
//       <option value="megaz">Z</option>
//     </select>
//     <br>
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

function addMove(event, moveId = '' , grade =0 , form , isMega = false) {
  if (!form)
   form = event.target.closest('.pokemon-form');
  const list = isMega ? form.querySelector('.mega-moves-list') : form.querySelector('.moves-list');

  const div = document.createElement('div');
  div.className = 'move-item';
  div.innerHTML = `
    <button class="info-btn" type="button" onclick="showMoveDetails(event,true)">
     <svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16px" height="16px" viewBox="0 0 416.979 416.979" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85 c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786 c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576 c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765 c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z"></path> </g> </g></svg>
    </button>
    <input type="text" value="${moveId}" list="moves-data-list" onblur="showMoveDetails(event)" class="move-input">
    <input type="number"  class="move-grade-input" value="${grade}" style="width: 40px">
    <button type="button" onclick="removeMove(event)">X</button>
  `;
  list.appendChild(div);
}


async function suggestFromLearnset(pokemon) {
  const { default: learnset } = await import(`../../data/learnsets/${pokemon.image}.js`)
  console.log(learnset)
  return learnset
    .filter(ls => ls.required_level <= pokemon.level && ls.source === "level")
    .map(ls => ls.name)
}

async function suggestUsingOptions(options, pokemon) {
  const totalMoves = options.mele + options.ranged;
  const physicalCount = Math.round((options.phyPer / 100) * totalMoves);
  const specialCount = Math.round((options.spePer / 100) * totalMoves);
  const statusCount = totalMoves - physicalCount - specialCount;

  const highCount = Math.round(totalMoves * 0.2);
  const midCount = Math.round(totalMoves * 0.5);
  const lowCount = totalMoves - highCount - midCount;

  let allMoves = []
  
  const dummyMeta = { xp: 900, retreat: 50 }
  const dummy1 = new Pokemon('rookie', structuredClone(dummyMeta),'you')
  const dummy2 = new Pokemon('rookie', structuredClone(dummyMeta),'enemy')
  const battle = new BATTLE_SYSTEMS["single"]([dummy1], [dummy2])
  dummy1.state.removeListeners()
  dummy2.state.removeListeners()
  
  for (const [id, move] of Object.entries(MOVES)) {
    if (move.flags.weapon || move.flags.summon) continue

    // test if the move is implemented and healthy
    try {
      // test1: check if effects implemented
      move.effects.self.forEach(effect => {
        if (!EFFECTS[effect.name]) 
          throw new Error()
      })
      
      move.effects.target.forEach(effect => {
        if (!EFFECTS[effect.name]) 
          throw new Error()
      })

      // test 2: E2E
      const m1 = new Move(id)
      m1._user = dummy1
      m1._target = dummy2

      const m2 = new Move("staythere");
      m2._user = dummy2
      m2._target = dummy1
      
      await battle.run(new Map([
        [dummy1, m1],
        [dummy2, m2],
      ]))
      allMoves.push(move)
    } catch (e) {}
  }
  
  
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
  const rangedStatus = categorizeMoves(allMoves.filter(move => move.category === "Status" && move.retreat <= pokemon.retreat * 0.7 ));

  const selectedMoves = [];
  const powerCounts = { high: 0, mid: 0, low: 0 };

  const selectFromCategory = (pool, category, limit) => {
    const moves = pool[category].splice(0, Math.min(limit, pool[category].length));
    moves.forEach(move => {
      const powerCategory = getPowerCategory(move);
      powerCounts[powerCategory]++;
    });
    
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


async function suggestMoves(options, pokemon) {
  try {
    return await suggestFromLearnset(pokemon)
  }
  catch (e) {
    console.log(e)
    return await suggestUsingOptions(options, pokemon)
  }
}
function getDefaultPrompt({ level, nature }) {
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

async function setMoveAutomatic(event) {
  const form = event.target.closest('.pokemon-form');
  const typesInputIndex = form.querySelector(".multy-input-box").dataset.index
  const pokemon = new Pokemon(form.querySelector('.enemy').value);
  const prompt = window.prompt("Edit the prompt here", objToFlags(getDefaultPrompt({
    level: form.querySelector('.level-inp').value,
    nature: form.querySelector('.nature-inp').value
  })));
  
  const automaticCreatedMoves = await suggestMoves(flagsToObj(prompt), {
    image: form.querySelector('.enemy').value,
    level: form.querySelector('.level-inp').value,
    types: getMultyInputValues("types",typesInputIndex).concat(pokemon._pokemon.types),
    retreat: form.querySelector('.retreat-inp').value
  });

  const list = form.querySelector('.moves-list');
  const moveItems = list.querySelectorAll('.move-item');
  if ( moveItems.length === 0){
  automaticCreatedMoves.forEach(moveId => addMove(event, moveId));
}else {
  moveItems.forEach((moveItem,index) => {
    const moveInput = moveItem.querySelector('.move-input');
    if (moveInput.value === "") {
      moveInput.value = automaticCreatedMoves[index];
    }
  })
}
}
function removeMove(event) {
  const moveItem = event.target.closest('.move-item');
  moveItem.remove();
}

globalThis.showMoveDetails = function({currentTarget},popup = false){
  console.log(popup)

 const moveName = popup ? currentTarget.parentElement.querySelector(".move-input").value : currentTarget.value
  console.log(moveName)

  if (moveName in MOVES) {
  const move =  new Move(moveName)
    const moveDetails = document.querySelector(`.move-details${popup ? "-popup" : ""}`)
    moveDetails.parentElement.classList.add("active")
    moveDetails.querySelector(".name").textContent = move.name
    moveDetails.querySelector(".desc").textContent = move.description() + '\n' + JSON.stringify({
        power: move.basePower,
        category: move.category,
        priority: move.priority
    }, null, 2)
    showMoveMoreDetails(moveName,popup)
 }
 
}
globalThis.hideMoveDetailsPopup = ({currentTarget})=>{
  currentTarget.parentElement.parentElement.parentElement.classList.remove('active')
console.log(currentTarget.parentElement.parentElement.parentElement)
  
}
function showMoveMoreDetails(moveName,popup) {
  const details = MOVES[moveName];
  if (details) {
    const queryPrefix = 
  document.querySelector(`${popup ? ".move-details-popup" : "body"} > details  pre.more-details`).textContent = JSON.stringify(details, null, 2);
  }

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
    form.querySelectorAll('.move-item').forEach(moveItem => {
      const id = moveItem.querySelector('.move-input').value.trim();
      const grade = moveItem.querySelector('.move-grade-input').value.trim();
      
      if (id) moves.push({ id, grade, isSelected: true });
    });

   

    const megaMoves = [];
    // form.querySelectorAll('.mega-moves-list .mega-move-input').forEach(input => {
    //   const id = input.value.trim();
    //   if (id) megaMoves.push({ id, isSelected: true });
    // });

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

function makeStartBattleCode(meta, fields, system = "multiple") {
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
