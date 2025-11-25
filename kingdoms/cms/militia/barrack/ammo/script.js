// import humans from "../../../../../data/humans.js";
// import { saveKingdoms, soldiersAcademy } from "../../../../utils.js";
import {initAllMultyInputBox,getMultyInputValues, loadPokemonsDatalist, loadNaturesDataList, loadMovesDatalist, startBattle } from "../../../../../assets/js/utils/dom.js";
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

function loadSoldierAmmoCards(shiftData,shiftElement){
  const soldierAmmoCardsContainer = shiftElement.querySelector(".soldier-ammo-cards-container")
  soldierAmmoCardsContainer.innerHTML = ""
  shiftData.forEach(soldier => {
    console.log(soldier);
    const items = soldier.image.items || []
    soldierAmmoCardsContainer.innerHTML +=` 
     <div class="soldier-ammo-card">
          <div class="header">
            <h3 class="rank">${soldier.image.id}</h3>
          </div>
          <div class="body">
            <div class="multy-input-box" data-property="items" data-index="${totalItemsMultyInputBox}">
              <div class="inputs-wrapper">
              </div>
              <div class="controller">

                <datalist id="multy-input-box-datalist"></datalist>
                <button class="add-input-btn">Add</button>
              </div>
            </div>
          </div>
        </div>`
       const multyInputBox = soldierAmmoCardsContainer.querySelector(`.multy-input-box[data-index="${totalItemsMultyInputBox++}"]`)
        items.forEach(item => {
       addInput(multyInputBox,item)
        })
  })
 
 
}

function getShiftElement(shift){
  const shiftData = kingdom.barrack.soldiers[shift]
  const shiftElement = document.createElement("div")
  shiftElement.className =  `shift ${shift}`
  shiftElement.innerHTML += `
      <h2>${shift}:</h2>
      <div class="soldier-ammo-cards-container"></div>
  ` 
   loadSoldierAmmoCards(shiftData,shiftElement)
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
  globalThis.addInput = initAllMultyInputBox().addInput
}


window.onload = ()=>{

  loadMainHeading()
  loadSoldierShiftsContainer()

}