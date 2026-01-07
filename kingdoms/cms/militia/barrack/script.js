import { loadPokemonsDatalist } from "../../../../assets/js/utils/dom.js";
import pokemons from "../../../../data/pokemons.js";
import humans from "../../../../data/humans.js";
import {
  // calcHospitalCost,
  getHospitalCapacity,
  getForceImbalanceRate,
  getSecurityRate,
  getPoliceStationSecurityRate,
  getInitialFixedXp
} from "../../../utils.js";
import { SoldierStack } from "../../../war.js";

// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("name");
})();

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].barrack)
  kingdoms[name].barrack = {
    academyLevel: 1,
    hospitalLevel: 0,
    soldiers: {
      day: [],
      night: [],
      emergency: [],
    },
    polices: {
      day: [],
      night: [],    
    }
  };
const kingdom = kingdoms[name];

// Data migration function: convert old salary system to percentage-based
function migrateToPercentageSalaries() {
  const kingdomPCI = kingdom.pci || 50;
  let migrationNeeded = false;

  // Migrate soldiers
  ['day', 'night', 'emergency'].forEach(shift => {
    if (kingdom.barrack.soldiers[shift]) {
      kingdom.barrack.soldiers[shift].forEach(soldier => {
        if (soldier.ivSalary !== undefined && soldier.ivSalaryPercent === undefined) {
          soldier.ivSalaryPercent = kingdomPCI > 0 ? Math.round((soldier.ivSalary / kingdomPCI) * 100) : 70;
          delete soldier.ivSalary;
          migrationNeeded = true;
        }
      });
    }
  });

  // Migrate police
  ['day', 'night'].forEach(shift => {
    if (kingdom.barrack.polices[shift]) {
      kingdom.barrack.polices[shift].forEach(police => {
        if (police.ivSalary !== undefined && police.ivSalaryPercent === undefined) {
          police.ivSalaryPercent = kingdomPCI > 0 ? Math.round((police.ivSalary / kingdomPCI) * 100) : 80;
          delete police.ivSalary;
          migrationNeeded = true;
        }
      });
    }
  });

  if (migrationNeeded) {
    save();
    console.log('Migrated salary data from fixed amounts to percentages');
  }
}

// Run migration on page load
migrateToPercentageSalaries();

const academyLevelEl = document.getElementById("academyLevel");
const academyCostEl = document.getElementById("academyCost");
const hospitalLevelEl = document.getElementById("hospitalLevel");
const hospitalCostEl = document.getElementById("hospitalCost");
const hospitalCapacityEl = document.getElementById("hospitalCapacity");

globalThis.showTab = ({currentTarget},tabName) => {
  // remove & add active class
  currentTarget.parentElement.querySelector(".active").classList.remove("active");
  currentTarget.classList.add("active");

  //  hide old tabs
   document.querySelectorAll(`.tab.active`).forEach((tab) => {
    tab.classList.remove("active");
    tab.style.display = "none";
  });
  // show all current tabs
  document.querySelectorAll(`.tab-${tabName}`).forEach((tab) => {
    tab.classList.add("active");
    tab.style.display = "";
  });
  showImbalanceData();
renderAllForces(tabName);
if (tabName === "police"){
document.getElementById("addDayPoliceBtn").onclick = () => {
  kingdoms[name].barrack.polices.day.push({
    image: { id: "student", xp: getInitialXp("student") },
    quantity: 0,
    ivSalaryPercent: 80, // Default 80% of PCI for police
  });
  save();
  renderForceSection("day","police");
};

document.getElementById("addNightPoliceBtn").onclick = () => {
  kingdoms[name].barrack.polices.night.push({
    image: { id: "student", xp: getInitialXp("student") },
    quantity: 0,
    ivSalaryPercent: 85, // Default 85% of PCI for night police (higher pay)
  });
  save();
  renderForceSection("night","police");
};

}
};

function save() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
}


document.getElementById("incrAcademy").onclick = () => {
  kingdoms[name].barrack.academyLevel++;
  renderAllForces("soldier");
  save();
};

document.getElementById("decrAcademy").onclick = () => {
  if (kingdoms[name].barrack.academyLevel > 1) {
    kingdoms[name].barrack.academyLevel--;
    renderAcademy();
    renderAllForces("soldier");
    save();
  }
};

const createField = (labelText, inputEl,forceType) => {
  const wrapper = document.createElement("div");
  wrapper.className = forceType + "-field";

  const label = document.createElement("label");
  label.textContent = labelText;

  wrapper.appendChild(label);
  wrapper.appendChild(inputEl);

  return wrapper;
};

function getSoldierStack(soldiers) {
  const stackData = soldiers.map((soldier) => {
    const image = pokemons[soldier.image.id];
    image.id = soldier.image.id;
    image.xp = soldier.image.xp;
    image.items = soldier.image.items;
    return [image, soldier.quantity];
  });
  return new SoldierStack(stackData);
}
globalThis.balanceSoldiers = (action,amount, forceType, shift, rankId) => {
  if ( !forceType.endsWith("s") )
  forceType += "s" 
  const forcesList = kingdom.barrack[forceType][shift];
  const forces = forcesList.filter((s) => s.image.id === rankId);
   if (action === "Remove"){ 
  forces.forEach((s) => {
    if (amount === 0) return
      const res = s.quantity - amount
      if (res < 0){
        amount -= s.quantity
        s.quantity = 0
      }else {
        s.quantity = res
        amount = 0
      }
  })
    }else{
      forces[0].quantity += amount
    }

  renderAllForces(forceType);  
  save();
  showImbalanceData();
}
globalThis.showImbalanceData = () => {
  const forceType = document.getElementById("main-header")?.querySelector("button.active").id

  const ranksIdList = Object.keys(humans).slice(forceType === "soldiers" ? 1 : 0);
 
  const shiftsDataWrapper = document.querySelector(
      "#imbalance-section  .shifts-data-wrapper",
    );
shiftsDataWrapper.innerHTML = "";
  for (const type in kingdom.barrack[forceType]) {
    
    const forceList = kingdom.barrack[forceType][type];

    if (forceList.length === 0) continue;
    const quantityMap = new Map();
    const imbalanceDataList = [];

    for (const rankId of ranksIdList) {
      const q = forceList.reduce(
        (sum, s) => sum + (s.image.id === rankId ? s.quantity : 0),
        0,
      );
      quantityMap.set(rankId, q);
    }

    quantityMap.forEach((q, rankId) => {
      if (q > 0) {

        const rankIndex = ranksIdList.indexOf(rankId);
        
        const senseiRankId = ranksIdList[rankIndex + 1];
       
        
        const senseiQ = quantityMap.get(senseiRankId);
        const extraStudent = q - senseiQ * 3;

        if (senseiQ > 0 && extraStudent !== 0) {
          imbalanceDataList.push({ extraStudent, student:{ rankId, q}, sensei:{ rankId: senseiRankId, q: senseiQ} });
        }

      }
    });

    if (imbalanceDataList.length > 0) {
       const shiftData = document.createElement("div");
       const extraStudentsCount = imbalanceDataList.reduce((sum, d) => sum + d.extraStudent, 0);
      
       const imbalanceRate = getForceImbalanceRate(kingdom,forceType,type,extraStudentsCount)       
       
    shiftData.className = "shift-data"
    shiftData.innerHTML = `<h2 >${type}: ${imbalanceRate.toFixed(2)}%</h2>`;
      shiftData.innerHTML += `
       <h4>ranks causing imbalance: ${imbalanceDataList.map((d) => `(${d.student.rankId}, ${d.sensei.rankId})`).join(", ")}</h4>
       <h4>Actions to Balance:</h4>
        `
        const ol = document.createElement("ol")
     for (const {extraStudent,student,sensei} of imbalanceDataList.reverse()){
     const actionForStudent = extraStudent >= 0 ? "Remove" : "Add"
     const actionForSensei = extraStudent >= 0 ? "Add" : "Remove"
     const studentAmount = Math.abs(extraStudent)
     const senseiAmount = Math.round(Math.abs(extraStudent / 3))  
     ol.innerHTML +=   `
         <li><strong style="color:${actionForStudent === "Add" ? "green" : "red"}" onclick="balanceSoldiers('${actionForStudent}',${studentAmount}, '${forceType}', '${type}', '${student.rankId}') ">${actionForStudent}</strong> ${studentAmount} <strong>${student.rankId}s</strong> or <strong  onclick="balanceSoldiers('${actionForSensei}',${senseiAmount}, '${forceType}', '${type}', '${sensei.rankId}') " style="color:${actionForSensei === "Add" ? "green" : "red"}">${actionForSensei}</strong> ${senseiAmount} <strong>${sensei.rankId}s</strong> in ${type} shift</li>
          <br>
         `;
     }
     shiftData.appendChild(ol)
    shiftsDataWrapper.appendChild(shiftData);

    }

  }

  // show/hide balanced class
  if (shiftsDataWrapper.children.length > 0) {
    document.querySelector("#imbalance-section").classList.remove("balanced")
  } else{
  document.querySelector("#imbalance-section").classList.add("balanced")
  }
};

function calcTypeSalary(forces, forceType = 'soldiers') {
  const kingdomPCI = kingdom.pci || 50; // Default PCI if not set
  const isUnderWar = kingdom.underWar || false;
  // Only apply war multiplier to soldiers, not police
  const warMultiplier = (isUnderWar && forceType === 'soldiers') ? 1.1136 : 1;
  
  return forces.reduce((total, force) => {
    const salaryPercentage = force.ivSalaryPercent || 0;
    const baseSalary = (kingdomPCI * salaryPercentage) / 100;
    const actualSalary = baseSalary * warMultiplier;
    return total + (force.quantity || 0) * actualSalary;
  }, 0);
}

function renderForceSection(type,forceType) {
  if (!forceType.endsWith("s")) forceType += "s" 
  const container = document.getElementById(`${type}${forceType.charAt(0).toUpperCase() + forceType.slice(1)}Container`);
    const barrackForce = kingdoms[name].barrack[forceType]
  container.innerHTML = "";
 
   barrackForce[type].forEach((force, index) => {
    const div = document.createElement("div");
    div.className = forceType +"-card";

    const imageSelect = document.createElement("input");
    imageSelect.type = "text";
    imageSelect.setAttribute("list", "pokemon-data-list");
    imageSelect.value = force.image.id;
    imageSelect.onblur = () => {
      force.image.id = imageSelect.value;
      force.image.xp = getInitialXp(force.image.id);
      save();
    };

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = force.quantity;
    quantityInput.onblur = () => {
      force.quantity = parseInt(quantityInput.value) || 0;
      save();
      renderAllForces(forceType);
        showImbalanceData();
    };

    // Data migration: convert old ivSalary to ivSalaryPercent if needed
    if (force.ivSalary !== undefined && force.ivSalaryPercent === undefined) {
      const kingdomPCI = kingdom.pci || 50;
      force.ivSalaryPercent = kingdomPCI > 0 ? Math.round((force.ivSalary / kingdomPCI) * 100) : 70;
      delete force.ivSalary; // Remove old property
      save();
    }

    const ivSalaryPercentInput = document.createElement("input");
    ivSalaryPercentInput.className = "iv-salary-percent";
    ivSalaryPercentInput.type = "number";
    ivSalaryPercentInput.min = "0";
    ivSalaryPercentInput.max = "500";
    ivSalaryPercentInput.step = "5";
    ivSalaryPercentInput.value = force.ivSalaryPercent || 70;
    ivSalaryPercentInput.onblur = () => {
      force.ivSalaryPercent = parseFloat(ivSalaryPercentInput.value) || 70;
      save();
      renderAllForces(forceType);
    };

    const kingdomPCI = kingdom.pci || 50;
    const isUnderWar = kingdom.underWar || false;
    // Only apply war multiplier to soldiers, not police
    const warMultiplier = (isUnderWar && forceType === 'soldiers') ? 1.1136 : 1;
    const baseSalaryPerPerson = (kingdomPCI * (force.ivSalaryPercent || 70)) / 100;
    const actualSalaryPerPerson = baseSalaryPerPerson * warMultiplier;
    const totalSalary = force.quantity * actualSalaryPerPerson;
    
    const totalSalaryEl = document.createElement("div");
    totalSalaryEl.className = "total-salary";
    
    if (isUnderWar && forceType === 'soldiers') {
      const baseTotalSalary = force.quantity * baseSalaryPerPerson;
      totalSalaryEl.innerHTML = `
        <div class="war-salary">
          <span class="base-salary">${baseSalaryPerPerson.toFixed()}$</span>
          <span class="war-salary-amount">${actualSalaryPerPerson.toFixed()}$ ⚔️</span>
          <br>
          <b>Total:</b> <span class="base-salary">${baseTotalSalary.toLocaleString()}$</span>
          <span class="war-salary-amount">${Math.round(totalSalary).toLocaleString()}$ ⚔️</span>
        </div>
      `;
    } else {
      totalSalaryEl.innerHTML = `
        <div>${actualSalaryPerPerson.toFixed()}$ <br>Total: ${totalSalary.toLocaleString()}$</div>
      `;
    }

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      barrackForce[type].splice(index, 1);
      save();
      renderAllForces(forceType);
    };

    div.appendChild(imageSelect);
    div.appendChild(createField("Quantity:", quantityInput,forceType));
    div.appendChild(createField("Salary %:", ivSalaryPercentInput,forceType));
    div.appendChild(totalSalaryEl);
    div.appendChild(delBtn);

    container.appendChild(div);
  });

  const isUnderWar = kingdom.underWar || false;
  const warMultiplier = (isUnderWar && forceType === 'soldiers') ? 1.1136 : 1;
  const typeTotalSalary = calcTypeSalary(barrackForce[type], forceType);
  const typeTotalEl = document.createElement("div");
  typeTotalEl.className = "type-total-salary";
  
  if (isUnderWar && forceType === 'soldiers') {
    const baseTypeTotalSalary = typeTotalSalary / warMultiplier;
    typeTotalEl.innerHTML = `
      Total ${type.charAt(0).toUpperCase() + type.slice(1)} ${forceType.charAt(0).toUpperCase() + forceType.slice(1)} Salary: 
      <span class="base-salary">${baseTypeTotalSalary.toLocaleString()}$</span>
      <span class="war-salary-amount">${Math.round(typeTotalSalary).toLocaleString()}$ ⚔️</span>
    `;
  } else {
    typeTotalEl.textContent = `Total ${
      type.charAt(0).toUpperCase() + type.slice(1)
    } ${forceType.charAt(0).toUpperCase() + forceType.slice(1)} Salary: ${typeTotalSalary.toLocaleString()}$`;
  }
  container.appendChild(typeTotalEl);

  const stack = getSoldierStack(barrackForce[type])
  const might = stack.baseCP();
  const weaponMight = stack.cp() - might;
  const armorMight = stack.armorScore();
  const ammoMight = weaponMight + armorMight;
  const totalMight = might + ammoMight;
  
  const mightEl = document.getElementById(`${type}${forceType.charAt(0).toUpperCase() + forceType.slice(1)}Might`);
  mightEl.textContent = `${might.toLocaleString()} + ${ammoMight.toLocaleString()} = ${totalMight.toLocaleString()}`;
}

function renderAllForces(forceType) {
  if (!forceType.endsWith("s")) forceType += "s"
  renderForceSection("day",forceType);
  renderForceSection("night",forceType);
 if (forceType === "soldiers")
  renderForceSection("emergency",forceType);
  const barrackForce = kingdoms[name].barrack[forceType]
  const isUnderWar = kingdom.underWar || false;
  const warMultiplier = (isUnderWar && forceType === 'soldiers') ? 1.1136 : 1;
  const totalSalary = Object.keys(barrackForce).reduce((total, type) => {
    return total + calcTypeSalary(barrackForce[type], forceType);
  }, 0);

  const totalSalaryEl = document.getElementById("totalSalaryContainer");
  totalSalaryEl.id = "totalSalaryContainer";
  totalSalaryEl.className = "total-salary-container";
  
  if (isUnderWar && forceType === 'soldiers') {
    const baseTotalSalary = totalSalary / warMultiplier;
    totalSalaryEl.innerHTML = `
      Total Force Salary: 
      <span class="base-salary">${baseTotalSalary.toLocaleString()}$</span>
      <span class="war-salary-amount">${Math.round(totalSalary).toLocaleString()}$ ⚔️</span>
    `;
  } else {
    totalSalaryEl.textContent = `Total Force Salary: ${totalSalary.toLocaleString()}$`;
  }

  const securityRate = getSecurityRate(kingdom, forceType)
  const securityRateEl = document.getElementById("securityRate")
  securityRateEl.textContent = securityRate

  if (forceType === "polices") {
    securityRateEl.textContent = `${getSecurityRate(kingdom, "polices") + getPoliceStationSecurityRate(kingdom)} (${getSecurityRate(kingdom, "polices").toFixed()} + ${getPoliceStationSecurityRate(kingdom)})`
  }

  let forcesTotalQuantity = 0;
  Object.keys(barrackForce).forEach((type) => {
    for (const force of barrackForce[type]) {
      forcesTotalQuantity += force.quantity
    }
  })
  const forcesTotalQuantityEl = document.getElementById("forcesTotalQuantity")
  forcesTotalQuantityEl.textContent = forcesTotalQuantity

  let totalMight = 0;
  let baseMight = 0;
  let ammoMight = 0;
  Object.keys(barrackForce).forEach((type) => {
    const stack = getSoldierStack(barrackForce[type]);
    const might = stack.baseCP();
    const weaponMight = stack.cp() - might;
    const armorMight = stack.armorScore();
    baseMight += might;
    ammoMight += weaponMight + armorMight;
    totalMight += might + ammoMight;
  });
  
  const totalMightEl = document.getElementById("forcesMight");
  totalMightEl.textContent = `${baseMight.toLocaleString()} + ${ammoMight.toLocaleString()} = ${totalMight.toLocaleString()}`;
}

function getInitialXp(imageId) {
  return getInitialFixedXp(imageId);
}

// soldiers
document.getElementById("addDaySoldierBtn").onclick = () => {
  kingdoms[name].barrack.soldiers.day.push({
    image: { id: "student", xp: getInitialXp("student") },
    quantity: 0,
    ivSalaryPercent: 70, // Default 70% of PCI for day soldiers
  });
  save();
  renderForceSection("day","soldier");
};

document.getElementById("addNightSoldierBtn").onclick = () => {
  kingdoms[name].barrack.soldiers.night.push({
    image: { id: "student", xp: getInitialXp("student") },
    quantity: 0,
    ivSalaryPercent: 75, // Default 75% of PCI for night soldiers (higher pay)
  });
  save();
  renderForceSection("night","soldier");
};

document.getElementById("addEmergencySoldierBtn").onclick = () => {
  kingdoms[name].barrack.soldiers.emergency.push({
    image: { id: "student", xp: getInitialXp("student") },
    quantity: 0,
    ivSalaryPercent: 90, // Default 90% of PCI for emergency soldiers (highest pay)
  });
  save();
  renderForceSection("emergency","soldier");
};
// polices
  if (!kingdoms[name].barrack.polices)
  kingdoms[name].barrack.polices = {day:[],night:[]}



// 
function renderHospital() {
  const level = kingdoms[name].barrack.hospitalLevel;
  hospitalLevelEl.textContent = level;
  hospitalCostEl.textContent = "00" //calcHospitalCost(kingdom).toLocaleString();
  hospitalCapacityEl.textContent =
    getHospitalCapacity(kingdom).toLocaleString();
}

// document.getElementById("incrHospital").onclick = () => {
//   kingdoms[name].barrack.hospitalLevel++;
//   renderHospital();
//   save();
// };

// document.getElementById("decrHospital").onclick = () => {
//   kingdoms[name].barrack.hospitalLevel--;
//   renderHospital();
//   save();
// };

//renderAcademy();
// renderHospital();
renderAllForces("soldier");

loadPokemonsDatalist("pokemon-data-list");
showImbalanceData();
globalThis.redirectToAmmoPage = () => {
  // Import navigation utility dynamically
  import('../../../../assets/js/utils/navigation.js').then(({ Navigation }) => {
    Navigation.goToBarrackAmmo(name);
  });
};
// hide inactive tab
   document.querySelectorAll(`.tab:not(.active)`).forEach((tab) => {
    tab.classList.remove("active");
    tab.style.display = "none";
  });
  
function getActualMight() {
  return 100
}
