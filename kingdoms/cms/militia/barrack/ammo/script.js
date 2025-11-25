// import humans from "../../../../../data/humans.js";
// import { saveKingdoms, soldiersAcademy } from "../../../../utils.js";
import {initAllMultyInputBox,getMultyInputValues, loadPokemonsDatalist, loadNaturesDataList, loadMovesDatalist, startBattle } from "../../../../../assets/js/utils/dom.js";

// //delete humans["student"]
const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const encodedName =  encodeURIComponent(name);
// const kingdoms = JSON.parse(localStorage.getItem("kingdoms"))
// const kingdom = kingdoms[encodedName]

function loadMainHeading(){
document.getElementById("main-heading")
.textContent = `${encodedName}'s Ammo`
}
function loadTotalAcademyCost(){
  document.getElementById("total-academy-cost")
  .textContent = `Total Academy Cost - ${soldiersAcademy.getAcademyCost(kingdom)}`
}


// function loadSoldiers(){
//   const soldiersContainer = document.querySelector(".soldiers-container")
//   soldiersContainer.innerHTML = ""
//  const academyData = kingdom.barrack.academyData
//   for (const key in humans ){
//      const human = humans[key]
//      const level = academyData[key]
//      const currentCapacity = 30 * level
//      const currentCost = soldiersAcademy.getSoldierCost(level,human.num)
//    soldiersContainer.innerHTML += `
//        <div class="soldier">
//       <strong class="rank-primary-data">${human.name}</strong> 
//       <span data-value="${level}" class="level">Level:</span>
//       <span data-value="${currentCapacity}" class="current-capacity">Capacity:</span>
//       <span data-value="${currentCost}" class="current-cost">Cost:</span>
//       <div class="btns-wrapper">
//         <button onclick="gradeSoldier('${key}',1)" data-value="( ${soldiersAcademy.getSoldierCost(level + 1,human.num)} )" class="upgrade-btn">Upgrade</button>
//         <button onclick="gradeSoldier('${key}',-1)" data-value="( ${soldiersAcademy.getSoldierCost(level - 1,human.num)} )" class="downgrade-btn">Downgrade</button>
//       </div>
//     </div>

   
//    `
//   }
  
// }
// globalThis.gradeSoldier = (id,value)=>{
//    kingdom.barrack.academyData[id] = kingdom.barrack.academyData[id] + value
//    saveKingdoms(kingdoms)
//    loadSoldiers()
//    loadTotalAcademyCost()
// }


window.onload = ()=>{
  // if (!kingdom.barrack.academyData){
  //   kingdom.barrack.academyData = soldiersAcademy.getDefaultData()
  //   saveKingdoms(kingdoms)
  // }
  loadMainHeading()
  initAllMultyInputBox()
  // loadSoldiers()
  // loadTotalAcademyCost()

}