// import humans from "../../../../../data/humans.js";
import { calcAmmoCost, getAmmoWithQuantity, saveKingdoms } from "../../../../utils.js";
import {initAllMultyInputBox,getMultyInputValues } from "../../../../../assets/js/utils/dom.js";
var totalItemsMultyInputBox = 0
globalThis.addInput = null
const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const encodedName =  encodeURIComponent(name);
const kingdoms = JSON.parse(localStorage.getItem("kingdoms"))
const kingdom = kingdoms[encodedName]

function loadMainHeading(){
document.getElementById("main-heading")
.textContent = `${encodedName}'s Ammo`
}
function saveCardItems(cardIndex){
  const items = getMultyInputValues("items",cardIndex)
  const shift = document.querySelector(`.soldier-ammo-card[data-index="${cardIndex}"]`).dataset.shift
  const soldierData = kingdom.barrack.soldiers[shift][cardIndex]
  soldierData.image.items = items
  saveKingdoms(kingdoms)
}
function loadAllCardItems(){
  const shiftElements = document.querySelectorAll(".shift")
  for (const shiftElement of shiftElements) {
  console.log(shiftElement.dataset.shift);

  const soldierAmmoCards = shiftElement.querySelectorAll(".soldier-ammo-cards-container > .soldier-ammo-card")
  let i = 0
  for (const soldierAmmoCard of soldierAmmoCards) {
     const multyInputBox = soldierAmmoCard.querySelector(`.multy-input-box`)
     const items = kingdom.barrack.soldiers[shiftElement.dataset.shift][i++].image.items
     if (addInput && items) { 
      for (const item of items) {
        addInput(multyInputBox,item)
      }
     }
    //  const items = soldier.image.items  
    //  items.forEach(item => {
    //      
    //     })
    //  })
  }
  
}
}
function loadSoldierAmmoCards(shiftData,shiftElement,shiftName){
  const soldierAmmoCardsContainer = shiftElement.querySelector(".soldier-ammo-cards-container")
  soldierAmmoCardsContainer.innerHTML = ""
  shiftData.forEach(soldier => {
    const items = soldier.image.items || []
    soldierAmmoCardsContainer.innerHTML +=` 
     <div class="soldier-ammo-card" data-index="${totalItemsMultyInputBox}" data-shift="${shiftName}">
          <div class="header">
            <h3 class="rank">${soldier.image.id}</h3>
          </div>
          <div class="body">
            <div class="multy-input-box" data-property="items" data-index="${totalItemsMultyInputBox++}">
              <div class="inputs-wrapper">
              </div>
              <div class="controller">

                <datalist id="multy-input-box-datalist"></datalist>
                <button class="add-input-btn">Add</button>
              </div>
            </div>
          </div>
        </div>`
    
  })
 
 
}

function getShiftElement(shift){
  const shiftData = kingdom.barrack.soldiers[shift]
  const shiftElement = document.createElement("div")
  shiftElement.dataset.shift = shift
  shiftElement.className =  `shift ${shift}`
  shiftElement.innerHTML += `
      <h2>${shift}:</h2>
      <div class="soldier-ammo-cards-container"></div>
  ` 
   loadSoldierAmmoCards(shiftData,shiftElement,shift)
  return shiftElement
}
function loadSoldierShiftsContainer() {
  totalItemsMultyInputBox = 0
  const soldierShiftsContainer = document.querySelector(".soldier-shifts-container")
  soldierShiftsContainer.innerHTML = ""

  const Shifts = Object.keys(kingdom.barrack.soldiers)

  for (const shift of Shifts) {
    soldierShiftsContainer.appendChild(getShiftElement(shift))
  }
  globalThis.addInput = initAllMultyInputBox({all:saveCardItems}).addInput
 
      loadAllCardItems()
  
}
globalThis.updateItemPrice = function({currentTarget},item){
  kingdom.barrack.ammo[item] = Number(currentTarget.value)
  saveKingdoms(kingdoms)
  setItemsTable()
}

function setItemsTable(){
  const items = getAmmoWithQuantity(kingdom)
  const itemsTableBody = document.querySelector("#items-table > tbody")
  itemsTableBody.innerHTML = ""

  for (const item in items) {
    if (!kingdom.barrack.ammo[item]){
      kingdom.barrack.ammo[item] = 0
    }
    const price =  kingdom.barrack.ammo[item]

    itemsTableBody.innerHTML += `<tr>
    <td>${item}</td>
    <td>${items[item]}</td>
    <td ><input style="width: 50px; border: none" onchange="updateItemPrice(event,'${item}')" class="price" type="number" value="${price}"/>$</td>
    </tr>`
  }
   itemsTableBody.innerHTML += `<tr>
    <td>total</td>
    <td></td>
    <td>${calcAmmoCost(kingdom).toLocaleString()}$</td>
    </tr>`
}


window.onload = ()=>{
  if (!kingdom.barrack.ammo){
      kingdom.barrack.ammo = {}
    }
setItemsTable()
  loadMainHeading()
  loadSoldierShiftsContainer()

}