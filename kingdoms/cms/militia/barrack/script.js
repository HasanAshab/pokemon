import { loadPokemonsDatalist } from "../../../../assets/js/utils/dom.js";
import pokemons from "../../../../data/pokemons.js";
import humans from "../../../../data/humans.js";
import {
  calcAcademyCost,
  // calcHospitalCost,
  getHospitalCapacity,
  getSoldierImbalanceRate,
  soldiersAcademy,
} from "../../../utils.js";
import { SoldierStack } from "../../../war.js";

const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const barrackTitle = document.getElementById("barrackTitle");
barrackTitle.textContent = name ? `${name}'s Barrack` : "Unknown Kingdom";

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
  };
const kingdom = kingdoms[name];

const academyLevelEl = document.getElementById("academyLevel");
const academyCostEl = document.getElementById("academyCost");
const hospitalLevelEl = document.getElementById("hospitalLevel");
const hospitalCostEl = document.getElementById("hospitalCost");
const hospitalCapacityEl = document.getElementById("hospitalCapacity");

function save() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
}

function renderAcademy() {
  const level = kingdoms[name].barrack.academyLevel;
  academyLevelEl.textContent = level;
  academyCostEl.textContent = calcAcademyCost(kingdom).toLocaleString();
}

document.getElementById("incrAcademy").onclick = () => {
  kingdoms[name].barrack.academyLevel++;
  renderAcademy();
  renderAllSoldiers();
  save();
};

document.getElementById("decrAcademy").onclick = () => {
  if (kingdoms[name].barrack.academyLevel > 1) {
    kingdoms[name].barrack.academyLevel--;
    renderAcademy();
    renderAllSoldiers();
    save();
  }
};

const createField = (labelText, inputEl) => {
  const wrapper = document.createElement("div");
  wrapper.className = "soldier-field";

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
    return [image, soldier.quantity];
  });
  return new SoldierStack(stackData);
}
globalThis.balanceSoldiers = (action,amount, shift, rankId) => {
  const soldiersList = kingdom.barrack.soldiers[shift];
  const soldiers = soldiersList.filter((s) => s.image.id === rankId);
   if (action === "Remove"){ 
  soldiers.forEach((s) => {
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
      soldiers[0].quantity += amount
    }

  renderAllSoldiers();  
  save();
  showImbalanceData();
}
globalThis.showImbalanceData = () => {
  const ranksIdList = Object.keys(humans).slice(1);
  
    const shiftsDataWrapper = document.querySelector(
      "#imbalance-section  .shifts-data-wrapper",
    );
shiftsDataWrapper.innerHTML = "";
  for (const type in kingdom.barrack.soldiers) {
    const soldierList = kingdom.barrack.soldiers[type];
    if (soldierList.length === 0) continue;
    const quantityMap = new Map();
    const imbalanceDataList = [];

    for (const rankId of ranksIdList) {
      const q = soldierList.reduce(
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
      
       const imbalanceRate = getSoldierImbalanceRate(kingdom,type,extraStudentsCount)
       
       
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
         <li><strong style="color:${actionForStudent === "Add" ? "green" : "red"}" onclick="balanceSoldiers('${actionForStudent}',${studentAmount}, '${type}', '${student.rankId}') ">${actionForStudent}</strong> ${studentAmount} <strong>${student.rankId}s</strong> or <strong  onclick="balanceSoldiers('${actionForSensei}',${senseiAmount}, '${type}', '${sensei.rankId}') " style="color:${actionForSensei === "Add" ? "green" : "red"}">${actionForSensei}</strong> ${senseiAmount} <strong>${sensei.rankId}s</strong> in ${type} shift</li>
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

function calcTypeSalary(soldiers) {
  return soldiers.reduce((total, soldier) => {
    return total + (soldier.quantity || 0) * (soldier.ivSalary || 0);
  }, 0);
}

function renderSoldierSection(type) {
  const container = document.getElementById(`${type}SoldiersContainer`);
  container.innerHTML = "";

  kingdoms[name].barrack.soldiers[type].forEach((soldier, index) => {
    const div = document.createElement("div");
    div.className = "soldier-card";

    const imageSelect = document.createElement("input");
    imageSelect.type = "text";
    imageSelect.setAttribute("list", "pokemon-data-list");
    imageSelect.value = soldier.image.id;
    imageSelect.onblur = () => {
      soldier.image.id = imageSelect.value;
      save();
    };

    const levelInput = document.createElement("input");
    levelInput.type = "number";
    levelInput.value = soldier.image.xp / 100 + 1;
    levelInput.onblur = () => {
      const newLevel = parseInt(levelInput.value) || 1;
      soldier.image.xp = (newLevel - 1) * 100;
      save();
      renderAllSoldiers();
    };

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = soldier.quantity;
    quantityInput.onblur = () => {
      const imageCapacity =
        kingdom.barrack.academyData[soldier.image.id] * 30;
      soldier.quantity = Math.min(
        parseInt(quantityInput.value) || 0,
        imageCapacity,
      );
      save();
      renderAllSoldiers();
      showImbalanceData();
    };

    const ivSalaryInput = document.createElement("input");
    ivSalaryInput.type = "number";
    ivSalaryInput.value = soldier.ivSalary;
    ivSalaryInput.onblur = () => {
      soldier.ivSalary = parseFloat(ivSalaryInput.value) || 0;
      save();
      renderAllSoldiers();
    };

    const totalSalary = soldier.quantity * soldier.ivSalary;
    const totalSalaryEl = document.createElement("div");
    totalSalaryEl.className = "total-salary";
    totalSalaryEl.textContent = `Total Salary: ${totalSalary.toLocaleString()}$`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      kingdoms[name].barrack.soldiers[type].splice(index, 1);
      save();
      renderAllSoldiers();
    };

    div.appendChild(imageSelect);
    div.appendChild(createField("Level:", levelInput));
    div.appendChild(createField("Quantity:", quantityInput));
    div.appendChild(createField("Salary/person:", ivSalaryInput));
    div.appendChild(totalSalaryEl);
    div.appendChild(delBtn);

    container.appendChild(div);
  });

  const typeTotalSalary = calcTypeSalary(kingdoms[name].barrack.soldiers[type]);
  const typeTotalEl = document.createElement("div");
  typeTotalEl.className = "type-total-salary";
  typeTotalEl.textContent = `Total ${
    type.charAt(0).toUpperCase() + type.slice(1)
  } Soldiers Salary: ${typeTotalSalary.toLocaleString()}$`;
  container.appendChild(typeTotalEl);

  const stack = getSoldierStack(kingdoms[name].barrack.soldiers[type]);
  const might = stack.cp();
  const mightEl = document.getElementById(`${type}SoldiersMight`);
  mightEl.textContent = might.toLocaleString();
}

function renderAllSoldiers() {
  renderSoldierSection("day");
  renderSoldierSection("night");
  renderSoldierSection("emergency");

  const totalSalary = ["day", "night", "emergency"].reduce((total, type) => {
    return total + calcTypeSalary(kingdoms[name].barrack.soldiers[type]);
  }, 0);

  const totalSalaryEl =
    document.getElementById("totalSalaryContainer") ||
    document.createElement("div");
  totalSalaryEl.id = "totalSalaryContainer";
  totalSalaryEl.className = "total-salary-container";
  totalSalaryEl.textContent = `Total Army Salary: ${totalSalary.toLocaleString()}$`;

  document.querySelector("body").appendChild(totalSalaryEl);

  let totalMight = 0;
  ["day", "night", "emergency"].forEach((type) => {
    const stack = getSoldierStack(kingdoms[name].barrack.soldiers[type]);
    totalMight += stack.cp();
  });

  const totalMightEl = document.getElementById("soldiersMight");
  totalMightEl.textContent = totalMight.toLocaleString();
}

document.getElementById("addDaySoldierBtn").onclick = () => {
  kingdoms[name].barrack.soldiers.day.push({
    image: { id: "student", xp: 0 },
    quantity: 0,
    ivSalary: 0,
  });
  save();
  renderSoldierSection("day");
};

document.getElementById("addNightSoldierBtn").onclick = () => {
  kingdoms[name].barrack.soldiers.night.push({
    image: { id: "student", xp: 0 },
    quantity: 0,
    ivSalary: 0,
  });
  save();
  renderSoldierSection("night");
};

document.getElementById("addEmergencySoldierBtn").onclick = () => {
  kingdoms[name].barrack.soldiers.emergency.push({
    image: { id: "student", xp: 0 },
    quantity: 0,
    ivSalary: 0,
  });
  save();
  renderSoldierSection("emergency");
};

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

renderAcademy();
// renderHospital();
renderAllSoldiers();

loadPokemonsDatalist("pokemon-data-list");
showImbalanceData();
globalThis.redirectToAcademyPage = () => {
  const encoded = encodeURIComponent(name);
  window.location.href = `/kingdoms/cms/militia/barrack/academy/?name=${encoded}`;
};
