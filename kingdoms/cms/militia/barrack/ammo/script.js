// import humans from "../../../../../data/humans.js";
import { getAmmoWithQuantity, saveKingdoms } from "../../../../utils.js";
import {initAllMultyInputBox,getMultyInputValues } from "../../../../../assets/js/utils/dom.js";
import items from "../../../../../data/items.js";
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
  
  soldierData.image.items = items
  saveKingdoms(kingdoms)
}
function loadAllCardItems(){
  const shiftElements = document.querySelectorAll(".shift")
  for (const shiftElement of shiftElements) {

  const soldierAmmoCards = shiftElement.querySelectorAll(".soldier-ammo-cards-container > .soldier-ammo-card")
  let i = 0
  for (const soldierAmmoCard of soldierAmmoCards) {
     const multyInputBox = soldierAmmoCard.querySelector(`.multy-input-box`)
     const items = kingdom.barrack.soldiers[shiftElement.dataset.shift][i++].image.items
     if (addInput && items) { 
      for (const item of items) {
        addInput(multyInputBox,item,{all:saveCardItems})
      }
     }
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
      ? `${basePrice}$ → ${adjustedPrice.toFixed(2)}$`
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

// Bulk Operations Functions
function loadSoldierImageOptions() {
  const soldierImages = new Set()
  
  // Collect all unique soldier image IDs
  Object.values(kingdom.barrack.soldiers).forEach(shiftSoldiers => {
    shiftSoldiers.forEach(soldier => {
      soldierImages.add(soldier.image.id)
    })
  })
  
  // Populate both select dropdowns
  const addSelect = document.getElementById("soldier-image-select")
  const removeSelect = document.getElementById("soldier-image-select-remove")
  
  addSelect.innerHTML = '<option value="">Select Soldier Image</option>'
  removeSelect.innerHTML = '<option value="">Select Soldier Image</option>'
  
  soldierImages.forEach(imageId => {
    addSelect.innerHTML += `<option value="${imageId}">${imageId}</option>`
    removeSelect.innerHTML += `<option value="${imageId}">${imageId}</option>`
  })
}

// Get all items from the main datalist (same as other item inputs)
function getAllAvailableItems() {
  return Object.keys(items)
}

// Get items that soldiers with specific image ID currently have
function getItemsForImageId(imageId) {
  const items = new Set()
  
  Object.values(kingdom.barrack.soldiers).forEach(shiftSoldiers => {
    shiftSoldiers.forEach(soldier => {
      if (soldier.image.id === imageId && soldier.image.items) {
        soldier.image.items.forEach(item => items.add(item))
      }
    })
  })
  
  return Array.from(items)
}

// Update datalist for bulk add (uses same items as main datalist)
globalThis.updateBulkAddDatalist = function() {
  const datalist = document.getElementById("bulk-add-datalist")
  const availableItems = getAllAvailableItems()
  
  datalist.innerHTML = ""
  availableItems.forEach(item => {
    datalist.innerHTML += `<option value="${item}">`
  })
}

// Update datalist for bulk remove (uses items from selected image soldiers)
globalThis.updateBulkRemoveDatalist = function() {
  const selectedImageId = document.getElementById("soldier-image-select-remove").value
  const datalist = document.getElementById("bulk-remove-datalist")
  
  if (!selectedImageId) {
    datalist.innerHTML = ""
    return
  }
  
  const imageItems = getItemsForImageId(selectedImageId)
  datalist.innerHTML = ""
  imageItems.forEach(item => {
    datalist.innerHTML += `<option value="${item}">`
  })
}

globalThis.bulkAddItem = function() {
  const selectedImageId = document.getElementById("soldier-image-select").value
  const itemToAdd = document.getElementById("bulk-add-item").value.trim()
  
  if (!selectedImageId || !itemToAdd) {
    alert("Please select a soldier image and enter an item name")
    return
  }
  
  let addedCount = 0
  
  // Add item to all soldiers with matching image ID across all shifts
  Object.keys(kingdom.barrack.soldiers).forEach(shift => {
    kingdom.barrack.soldiers[shift].forEach(soldier => {
      if (soldier.image.id === selectedImageId) {
        if (!soldier.image.items) {
          soldier.image.items = []
        }
        // Check if item already exists to avoid duplicates
        if (!soldier.image.items.includes(itemToAdd)) {
          soldier.image.items.push(itemToAdd)
          addedCount++
        }
      }
    })
  })
  
  if (addedCount > 0) {
    saveKingdoms(kingdoms)
    loadSoldierShiftsContainer()
    setItemsTable(kingdom.barrack.ammoPriceChange)
    alert(`Added "${itemToAdd}" to ${addedCount} soldiers with image "${selectedImageId}"`)
    document.getElementById("bulk-add-item").value = ""
    // Update remove datalist in case the same image is selected there
    updateBulkRemoveDatalist()
  } else {
    alert(`No soldiers found with image "${selectedImageId}" or item already exists`)
  }
}

globalThis.bulkRemoveItem = function() {
  const selectedImageId = document.getElementById("soldier-image-select-remove").value
  const itemToRemove = document.getElementById("bulk-remove-item").value.trim()
  
  if (!selectedImageId || !itemToRemove) {
    alert("Please select a soldier image and enter an item name")
    return
  }
  
  let removedCount = 0
  
  // Remove item from all soldiers with matching image ID across all shifts
  Object.keys(kingdom.barrack.soldiers).forEach(shift => {
    kingdom.barrack.soldiers[shift].forEach(soldier => {
      if (soldier.image.id === selectedImageId && soldier.image.items) {
        const itemIndex = soldier.image.items.indexOf(itemToRemove)
        if (itemIndex > -1) {
          soldier.image.items.splice(itemIndex, 1)
          removedCount++
        }
      }
    })
  })
  
  if (removedCount > 0) {
    saveKingdoms(kingdoms)
    loadSoldierShiftsContainer()
    setItemsTable(kingdom.barrack.ammoPriceChange)
    alert(`Removed "${itemToRemove}" from ${removedCount} soldiers with image "${selectedImageId}"`)
    document.getElementById("bulk-remove-item").value = ""
    // Update the datalist to reflect the removal
    updateBulkRemoveDatalist()
  } else {
    alert(`No soldiers found with image "${selectedImageId}" or item doesn't exist`)
  }
}

globalThis.copyFromShiftToShift = function() {
  const sourceShift = document.getElementById("copy-from-shift-select").value
  const targetShift = document.getElementById("copy-to-shift-select").value
  
  if (!sourceShift || !targetShift) {
    alert("Please select both source and target shifts")
    return
  }
  
  if (sourceShift === targetShift) {
    alert("Source and target shifts cannot be the same")
    return
  }
  
  // Check if target shift has existing items and confirm overwrite
  let hasExistingItems = false
  kingdom.barrack.soldiers[targetShift].forEach(soldier => {
    if (soldier.image?.items?.length > 0) {
      hasExistingItems = true
    }
  })
  
  if (hasExistingItems) {
    if (!confirm(`This will overwrite existing items in ${targetShift} shift. Are you sure?`)) {
      return
    }
  }
  
  let copiedCount = 0
  
  // Copy items from source shift to target shift for matching soldier images
  kingdom.barrack.soldiers[targetShift].forEach(targetSoldier => {
    const sourceSoldier = kingdom.barrack.soldiers[sourceShift].find(s => s.image.id === targetSoldier.image.id)
    
    if (sourceSoldier && sourceSoldier.image?.items) {
      // Deep copy the items array to avoid reference issues
      targetSoldier.image.items = [...sourceSoldier.image.items]
      copiedCount++
    } else {
      // Clear items if no matching soldier found in source shift
      targetSoldier.image.items = []
    }
  })
  
  if (copiedCount > 0) {
    saveKingdoms(kingdoms)
    loadSoldierShiftsContainer()
    setItemsTable(kingdom.barrack.ammoPriceChange)
    alert(`Successfully copied items from ${sourceShift} to ${targetShift} shift for ${copiedCount} matching soldiers`)
  } else {
    alert(`No matching soldiers found between ${sourceShift} and ${targetShift} shifts`)
  }
}

globalThis.copyFromAnotherKingdom = function() {
  let abort = null
  Object.keys(kingdom.barrack.soldiers).forEach(shift => {
    if (abort !== null) return
    const soldiers = kingdom.barrack.soldiers[shift]
    soldiers.forEach(soldier => {
      if (soldier.image?.items?.length > 0) {
        if (!confirm('It will overwrite existing items. Are you sure?')) {
          abort = true
        }
        else {
          abort = false
        }
      }
    })
  })

  if (abort === true) return
  const selectedKingdom = kingdoms[document.getElementById("copy-from-kingdom-select").value]
  if (selectedKingdom) {
    Object.entries(kingdom.barrack.soldiers).forEach(([shift, soldiers]) => {
      soldiers.forEach(soldier => {
        const relatedSoldier = selectedKingdom.barrack.soldiers[shift].find(s => s.image.id === soldier.image.id)        
        soldier.image.items = relatedSoldier.image.items
      })
    })
    saveKingdoms(kingdoms)
    loadSoldierShiftsContainer()
    setItemsTable(kingdom.barrack.ammoPriceChange)
    alert('Copied successfully')
  }
}

function loadCopyFromKingdomSelect() { 
  const copyFromKingdomSelect = document.getElementById("copy-from-kingdom-select")
  
  copyFromKingdomSelect.innerHTML = ""
  Object.keys(kingdoms).forEach(kingdom => {
    copyFromKingdomSelect.innerHTML += `<option value="${kingdom}">${kingdom}</option>`
  })
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
  loadSoldierImageOptions()
  loadCopyFromKingdomSelect()
}
