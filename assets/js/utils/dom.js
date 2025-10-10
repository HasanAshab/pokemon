import pokemons from "../../../data/pokemons.js"
import moves from "../../../data/moves.js"
import natures from "../../../data/natures.js"
import items from "../../../data/items.js"
import types from "../../../data/types.js"
import abilities from "../../../data/abilities.js"
import { Pokemon } from "./models.js";


export function loadPokemonsDatalist(id) {
  const dataList = document.getElementById(id);
  const html = Object.keys(pokemons)
    .map(id => `<option value="${id}">${pokemons[id].name} (${pokemons[id].types.join(", ")})</option>`)
    .join("")
  dataList.innerHTML = html;
}

export function loadMovesDatalist(id) {
  const dataList = document.getElementById(id);
  const html = Object.keys(moves)
    .map(id => {
        const move = moves[id]
        const display = `${move.name} (${move.type}, ${move.flags.contact ? '->' : 'x'}, ${move.basePower})`
        return `<option value="${id}">${display}</option>`
    })
    .join("")
  dataList.innerHTML = html;
}

export function loadNaturesDataList(id){
  const dataList = document.getElementById(id);
  const html = Object.keys(natures)
    .map(id => `<option value="${id}">${natures[id].name} | ${natures[id].description}</option>`)
    .join("")
  dataList.innerHTML =  html
}
export function loadItemsDataList(id,elm){
  const dataList = document.getElementById(id);
 dataList.innerHTML = ""
  const html = Object.keys(items)
    .map(id => `<option value="${id}">${items[id].name} | ${items[id].description}</option>`)
    .join("")
  dataList.innerHTML =  html
}

export function loadTypesDataList(id,elm){
  const dataList = document.getElementById(id);
 dataList.innerHTML = ""
  const html = Object.keys(types)
    .map(id => `<option value="${id}">${types[id].name} | ${types[id].description}</option>`)
    .join("")
  dataList.innerHTML =  html
}
export function loadAbilitiesDataList(id,elm){
  const dataList = document.getElementById(id);
  dataList.innerHTML = ""
  const html = Object.keys(abilities)
    .map(id => `<option value="${id}">${abilities[id].name} | ${abilities[id].description}</option>`)
    .join("")
  dataList.innerHTML =  html
}

function loadDatalist(index,multyInputBox){
  const propertyName = multyInputBox.getAttribute("data-property")
  const datalistId = `multy-input-box-datalist-${index}`
  switch (propertyName){
    case "abilities" : loadAbilitiesDataList(datalistId);
    break;
    case "items" : loadItemsDataList(datalistId)
    break;
    case "types" : loadTypesDataList(datalistId)
    break;
  }
}

function removeInput (inputElm){
  inputElm.parentElement.removeChild(inputElm)
}

function addInput(multyInputBox,value){
  console.log(multyInputBox,value);
  
  const valueInput = multyInputBox.querySelector(".controller > input")
  const inputsWrapper = multyInputBox.querySelector(".inputs-wrapper")
  const newInputElm = document.createElement("div") 
  newInputElm.classList = "input"
  newInputElm.innerHTML = `
          <span class="value">${value ? value : valueInput.value}</span>
  `
  const removeBtn = document.createElement("button")
  removeBtn.classList = "remove-btn"
  removeBtn.textContent = "x"
  removeBtn.onclick = ()=> removeInput(newInputElm)
  newInputElm.appendChild(removeBtn)
   
  inputsWrapper.appendChild(newInputElm)
  valueInput.value = ""
}
function setIndex(index,multyInputBox){
  const controller = multyInputBox.querySelector(".controller")
  const datalist = controller.querySelector("datalist")
  datalist.id = `multy-input-box-datalist-${index}`
  if (!controller.querySelector("input")){
  const valueInputHTML = `<input list="${datalist.id}" type="text" />`
  controller.innerHTML = valueInputHTML + controller.innerHTML
  }
}
export function getMultyInputValues(propertyName,index = null){
  let multyInputBox = null
  const values = []
  if (index === null){
    multyInputBox = document.querySelector(`.multy-input-box[data-property="${propertyName}"]`)
  }else {
    multyInputBox = document.querySelector(`.multy-input-box[data-property="${propertyName}"][data-index="${index}"]`)
  }
  
 const inputElms = multyInputBox.querySelectorAll(".inputs-wrapper > .input")
 
 for (const inputElm of inputElms){
   values.push(inputElm.querySelector(".value").textContent)
 }
  return values
}

export function initAllMultyInputBox(){
  const multyInputBoxes = document.querySelectorAll(".multy-input-box")
  let index = 0;
  for (const multyInputBox of multyInputBoxes){
    setIndex(index,multyInputBox)
    loadDatalist(index,multyInputBox)
      const addInputBtn = multyInputBox.querySelector(".controller > .add-input-btn")
    addInputBtn.onclick = ()=> addInput(multyInputBox)
  
    index++
  }
  return {addInput}
}


export class PopupMsgQueue {
    queue = []
    isRunning = false

    constructor(elemIdSuffix, limit = 7, lifetime = 1000) {
        this.elemIdSuffix = elemIdSuffix;
        this.limit = limit
        this.lifetime = lifetime
    }

    add(msg, playerTag, lifetime) {
        if (!lifetime)
            lifetime = this.lifetime
        if (this.queue.length === this.limit) return
        this.queue.push({ msg, playerTag, lifetime });
        this.runQueue();
    }

    async runQueue() {
        if (this.isRunning || this.queue.length === 0) return;

        this.isRunning = true;

        while (this.queue.length > 0) {
            const { msg, playerTag, lifetime } = this.queue.shift();
            await this.showPopupMsg(msg, playerTag, lifetime);
        }

        this.isRunning = false;
    }

    showPopupMsg(msg, playerTag, lifetime) {
        return new Promise(resolve => {
            const popupMsgCont = document.getElementById(playerTag + "-" + this.elemIdSuffix);

            // Add random tilt
            //const tiltClass = Math.random() > 0.5 ? "tilt-left" : "tilt-right";
            popupMsgCont.classList.add("active");

            popupMsgCont.querySelector(".msg").innerHTML = msg;

            setTimeout(() => {
                popupMsgCont.classList.remove("active");
                popupMsgCont.classList.remove("enemy-side");
                resolve();
            }, lifetime); // Adjust duration if needed
        });
    }
}

export async function getUserPokemonsMeta(name, session = 1){
  const prom = await fetch(`./users/sessions/${session}/${name}.json`)
  const enemiesMeta = await prom.json()
  return enemiesMeta
}
export function startBattle(enemiesMeta, fields = [], system) {
    system = "multiple"
    const history = JSON.parse(localStorage.getItem("battle-history")) || {};
    const enemiesBase64List = enemiesMeta.map(meta => {
        history[meta.name] = meta
        return new Pokemon(meta.id, meta).toBase64()
    })
    localStorage.setItem("$enemies-base64-list", JSON.stringify(enemiesBase64List));
    localStorage.setItem("battle-history", JSON.stringify(history));
    window.location = `battle.html?fields=${fields.join(',')}${system ? "&system=" + system : ''}`;
  }

export async function startUserBattle(name,popList=[],fields =[], system) {
   try {
       const userPokemonsMeta = await getUserPokemonsMeta(name)
       startBattle(userPokemonsMeta, fields, system)
   }
   catch(e) {
       console.error(e)
   }
}
