import pokemons from "../../../../data/pokemons.js";
import { calcSoldiersSalary, calcAcademyCost } from "../../../utils.js";

const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const barrackTitle = document.getElementById("barrackTitle");
barrackTitle.textContent = name ? `${name}'s Barrack` : "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].barrack)
  kingdoms[name].barrack = { academyLevel: 1, soldiers: [] };
const kingdom = kingdoms[name];

const academyLevelEl = document.getElementById("academyLevel");
const academyCostEl = document.getElementById("academyCost");
const soldiersContainer = document.getElementById("soldiersContainer");

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
  renderSoldiers();
  save();
};

document.getElementById("decrAcademy").onclick = () => {
  if (kingdoms[name].barrack.academyLevel > 1) {
    kingdoms[name].barrack.academyLevel--;
    renderAcademy();
    renderSoldiers();
    save();
  }
};

// Instead of <br>, wrap label+input in divs
const createField = (labelText, inputEl) => {
  const wrapper = document.createElement("div");
  wrapper.className = "soldier-field";

  const label = document.createElement("label");
  label.textContent = labelText;

  wrapper.appendChild(label);
  wrapper.appendChild(inputEl);

  return wrapper;
};

function renderSoldiers() {
  soldiersContainer.innerHTML = "";

  kingdoms[name].barrack.soldiers.forEach((soldier, index) => {
    const div = document.createElement("div");
    div.className = "soldier-card";

    const imageSelect = document.createElement("select");
    const images = Object.keys(pokemons).splice(
      0,
      kingdom.barrack.academyLevel,
    );
    images.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt.split(".")[0];
      if (soldier.image.id === opt) option.selected = true;
      imageSelect.appendChild(option);
    });
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
      renderSoldiers();
    };

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = soldier.quantity;
    quantityInput.onblur = () => {
      soldier.quantity = parseInt(quantityInput.value) || 0;
      save();
      renderSoldiers();
    };

    const ivSalaryInput = document.createElement("input");
    ivSalaryInput.type = "number";
    ivSalaryInput.value = soldier.ivSalary;
    ivSalaryInput.onblur = () => {
      soldier.ivSalary = parseFloat(ivSalaryInput.value) || 0;
      save();
      renderSoldiers();
    };

    const totalSalary = soldier.quantity * soldier.ivSalary;

    const totalSalaryEl = document.createElement("div");
    totalSalaryEl.className = "total-salary";
    totalSalaryEl.textContent = `Total Salary: ${totalSalary.toLocaleString()}$`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      kingdoms[name].barrack.soldiers.splice(index, 1);
      save();
      renderSoldiers();
    };

    div.appendChild(imageSelect);
    div.appendChild(createField("Level:", levelInput));
    div.appendChild(createField("Quantity:", quantityInput));
    div.appendChild(createField("Salary/person:", ivSalaryInput));
    div.appendChild(totalSalaryEl);
    div.appendChild(delBtn);

    soldiersContainer.appendChild(div);
  });

  // Render Grand Total Salary
  const grandTotalEl = document.createElement("div");
  grandTotalEl.className = "grand-total-salary";
  grandTotalEl.textContent = `All Soldiers Total Salary: ${calcSoldiersSalary(kingdom).toLocaleString()} coins`;

  soldiersContainer.appendChild(grandTotalEl);
}

document.getElementById("addSoldierBtn").onclick = () => {
  kingdoms[name].barrack.soldiers.push({
    image: { id: "student", xp: 0 },
    quantity: 0,
    ivSalary: 0,
  });
  save();
  renderSoldiers();
};

renderAcademy();
renderSoldiers();
