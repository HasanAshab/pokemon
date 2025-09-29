import { loadPokemonsDatalist } from "../../../../assets/js/utils/dom.js";
import pokemons from "../../../../data/pokemons.js";
import { calcAcademyCost, soldiersAcademy } from "../../../utils.js";
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
    soldiersAcademy.isRankValid(pokemons[soldier.image.id].num, kingdom)
    // console.log(soldier);
    
    const imageSelect = document.createElement("input");
    imageSelect.type = "text";
    imageSelect.setAttribute("list", "pokemon-data-list");
    imageSelect.value = soldier.image.id;
    // const shinobiImages = Object.keys(pokemons).splice(
    //   0,
    //   kingdom.barrack.academyLevel + 1,
    // );
    // const beastImages = Object.keys(pokemons).filter((id) => pokemons[id].type === "beast")
    // const images = [...shinobiImages, ...beastImages];
    // images.forEach((opt) => {
    //   const option = document.createElement("option");
    //   option.value = opt;
    //   option.textContent = opt.split(".")[0];
    //   if (soldier.image.id === opt) option.selected = true;
    //   imageSelect.appendChild(option);
    // });
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
      const imageCapacity =  kingdom.barrack.academyData[soldier.image.id] * 30;
      
      soldier.quantity = Math.min((parseInt(quantityInput.value) || 0), imageCapacity);
      save();
      renderAllSoldiers();
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
  typeTotalEl.textContent = `Total ${type.charAt(0).toUpperCase() + type.slice(1)} Soldiers Salary: ${typeTotalSalary.toLocaleString()}$`;
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

  // Calculate Total Might across all shifts
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


renderAcademy();
renderAllSoldiers();

loadPokemonsDatalist("pokemon-data-list");


globalThis.redirectToAcademyPage = ()=>{  
  const encoded = encodeURIComponent(name);
    window.location.href = `/kingdoms/cms/militia/barrack/academy/?name=${encoded}`;
    
}

