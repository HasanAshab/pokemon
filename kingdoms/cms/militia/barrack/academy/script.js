import humans from "../../../../../data/humans.js";

const params = new URLSearchParams(window.location.search);
const name = params.get("name");
 const encodedName =  encodeURIComponent(name);
const academyData =  JSON.parse(localStorage.getItem(`${encodedName}-soldiers-academy`))

function loadMainHeading(){
document.getElementById("main-heading")
.textContent = `${encodedName}'s Academy`
}
function loadTotalAcademyCost(){
  let cost = 0
  let index = 1
  for (const key in academyData){
    const lvl = academyData[key]
   cost += getSoldierCost(lvl,index++)
  }
  document.getElementById("total-academy-cost")
  .textContent = `Total Academy Cost - ${cost}`
}
function getDefaultAcademyData(){
   const data = {}
   for (const key in humans ){
     data[key] = 0
    }
    return data
}

function getSoldierLevel(id){
 const academyData =  JSON.parse(localStorage.getItem(`${encodedName}-soldiers-academy`))
 return Number(academyData[id])
}
function getSoldierCost(lvl,index){
  
  return lvl <= 0 ? 0 : 2000 * lvl * index
}
function loadSoldiers(){
  const soldiersContainer = document.querySelector(".soldiers-container")
  soldiersContainer.innerHTML = ""
   for (const key in humans ){
     const human = humans[key]
     const level = academyData[key]
     const currentCapacity = 30 * level
     const currentCost = getSoldierCost(level,human.num)
   soldiersContainer.innerHTML += `
       <div class="soldier">
      <strong class="rank-primary-data">${human.name}</strong> 
      <span data-value="${level}" class="level">Level:</span>
      <span data-value="${currentCapacity}" class="current-capacity">Capacity:</span>
      <span data-value="${currentCost}" class="current-cost">Cost:</span>
      <div class="btns-wrapper">
        <button onclick="gradeSoldier('${key}',1)" data-value="( ${getSoldierCost(level + 1,human.num)} )" class="upgrade-btn">Upgrade</button>
        <button onclick="gradeSoldier('${key}',-1)" data-value="( ${getSoldierCost(level - 1,human.num)} )" class="downgrade-btn">Downgrade</button>
      </div>
    </div>

   
   `
  }
  
}
globalThis.gradeSoldier = (id,value)=>{
   academyData[id] = academyData[id] + value
   localStorage.setItem(`${encodedName}-soldiers-academy`,JSON.stringify(academyData)) 
   loadSoldiers()
   loadTotalAcademyCost()
}


window.onload = ()=>{
 if (!localStorage.getItem(`${encodedName}-soldiers-academy`)){
   localStorage.setItem(`${encodedName}-soldiers-academy`,JSON.stringify(getDefaultAcademyData())) 
  }
  
  loadMainHeading()
  loadSoldiers()
  loadTotalAcademyCost()
  
}