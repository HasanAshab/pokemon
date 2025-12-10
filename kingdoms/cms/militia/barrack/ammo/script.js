// import humans from "../../../../../data/humans.js";
import { getAmmoWithQuantity, saveKingdoms } from "../../../../utils.js";
import {initAllMultyInputBox,getMultyInputValues } from "../../../../../assets/js/utils/dom.js";
var totalItemsMultyInputBox = 0
globalThis.addInput = null
// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("name");
})();
const encodedName =  encodeURIComponent(name);
const kingdoms = JSON.parse(localStorage.getItem("kingdoms"))
const kingdom = kingdoms[encodedName]

function loadMainHeading(){
document.getElementById("main-heading")
.textContent = `${encodedName}'s Ammo`
}
function saveCardItems(cardIndex){
  const items = getMultyInputValues("items",cardIndex)
  const ammoCard = document.querySelector(`.soldier-ammo-card[data-index="${cardIndex}"]`)
  const shift = ammoCard.dataset.shift
const index = Array.prototype.indexOf.call(ammoCard.parentElement.children,ammoCard)  
  const soldierData = kingdom.barrack.soldiers[shift][index]
  console.log(soldierData,shift,cardIndex);
  
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

globalThis.updatePriceChangePercent = function({currentTarget}){
  const percent = Number(currentTarget.value) || 0
  kingdom.barrack.ammoPriceChange = percent
  saveKingdoms(kingdoms)
  setItemsTable(percent)
}

function setItemsTable(priceChangePercent = 0){
  const items = getAmmoWithQuantity(kingdom)
  const itemsTableBody = document.querySelector("#items-table > tbody")
  const itemsTableHead = document.querySelector("#items-table > thead")
  
  // Add table header if it doesn't exist
  if (!itemsTableHead || itemsTableHead.children.length === 0) {
    const table = document.querySelector("#items-table")
    if (!table.querySelector("thead")) {
      table.innerHTML = `<thead><tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Base Price</th>
        <th>Adjusted Price</th>
      </tr></thead><tbody></tbody>`
    }
  }
  
  itemsTableBody.innerHTML = ""

  let totalCost = 0
  let adjustedTotalCost = 0

  for (const item in items) {
    if (!kingdom.barrack.ammo[item]){
      kingdom.barrack.ammo[item] = 0
    }
    const basePrice = kingdom.barrack.ammo[item]
    const adjustedPrice = basePrice * (1 + priceChangePercent / 100)
    const itemCost = basePrice * items[item]
    const adjustedItemCost = adjustedPrice * items[item]
    
    totalCost += itemCost
    adjustedTotalCost += adjustedItemCost

    const priceDisplay = priceChangePercent !== 0 
      ? `${Math.round(adjustedPrice)}$`
      : `${basePrice}$`

    itemsTableBody.innerHTML += `<tr>
    <td>${item}</td>
    <td>${items[item]}</td>
    <td><input style="width: 50px; border: none" onchange="updateItemPrice(event,'${item}')" class="price" type="number" value="${basePrice}"/>$</td>
    <td>${priceDisplay}</td>
    </tr>`
  }

  // Add price change percentage input row
  itemsTableBody.innerHTML += `<tr style="background-color: #f0f0f0;">
    <td colspan="2"><strong>Price Change %:</strong></td>
    <td><input style="width: 60px; border: 1px solid #ccc" onchange="updatePriceChangePercent(event)" type="number" value="${priceChangePercent}" step="0.1"/>%</td>
    <td></td>
    </tr>`

  // Add total row
  const totalDisplay = priceChangePercent !== 0 
    ? `${totalCost.toLocaleString()}$ → ${adjustedTotalCost.toLocaleString()}$`
    : `${totalCost.toLocaleString()}$`

  itemsTableBody.innerHTML += `<tr style="font-weight: bold; background-color: #e8e8e8;">
    <td>Total</td>
    <td></td>
    <td></td>
    <td>${totalDisplay}</td>
    </tr>`
}


window.onload = ()=>{
  if (!kingdom.barrack.ammo){
      kingdom.barrack.ammo = {}
    }
  if (!kingdom.barrack.ammoPriceChange){
      kingdom.barrack.ammoPriceChange = 0
    }
  
  const savedPriceChange = kingdom.barrack.ammoPriceChange
  setItemsTable(savedPriceChange)
  loadMainHeading()
  loadSoldierShiftsContainer()

}