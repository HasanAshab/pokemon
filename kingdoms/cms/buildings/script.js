const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const kingdomNameEl = document.getElementById("kingdomName");
const buildingsContainer = document.getElementById("buildingsContainer");
const addBuildingBtn = document.getElementById("addBuildingBtn");

kingdomNameEl.textContent = name ? `${name}'s Buildings` : "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].buildings) kingdoms[name].buildings = [];

function parseItemsInput(input) {
  try {
    return JSON.parse(input) || {};
  } catch {
    alert("Invalid JSON format in produces/consumes");
    return {};
  }
}

function saveAndRefresh() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderBuildings();
}

function renderBuildings() {
  buildingsContainer.innerHTML = "";
  kingdoms[name].buildings.forEach((building, index) => {
    const div = document.createElement("div");
    div.className = "building";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Building Name";

    const nameInput = document.createElement("input");
    nameInput.value = building.name;
    nameInput.disabled = true;

    const levelLabel = document.createElement("label");
    levelLabel.textContent = "Current Level";

    const levelDisplay = document.createElement("div");
    levelDisplay.textContent = `Level ${building.currentLevel}`;

    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = "Current Size";

    const sizeDisplay = document.createElement("div");
    sizeDisplay.textContent = `${building.baseSize * building.currentLevel} sq.m`;

    const basePriceInput = document.createElement("input");
    basePriceInput.value = building.basePrice;
    basePriceInput.className = "editable";
    basePriceInput.style.display = "none";

    const baseSizeInput = document.createElement("input");
    baseSizeInput.value = building.baseSize;
    baseSizeInput.className = "editable";
    baseSizeInput.style.display = "none";

    const producesInput = document.createElement("input");
    producesInput.value = JSON.stringify(building.produces);
    producesInput.placeholder = "Produces (e.g., {\"wood\": 10})";

    const consumesInput = document.createElement("input");
    consumesInput.value = JSON.stringify(building.consumes);
    consumesInput.placeholder = "Consumes (e.g., {\"ore\": 5})";

    const upgradeBtn = document.createElement("button");
    upgradeBtn.className = "btn primary-btn";
    const upgradeCost = building.basePrice * building.currentLevel;
    upgradeBtn.textContent = `Upgrade (Cost: ${upgradeCost} coins)`;

    upgradeBtn.onclick = () => {
      const storage = kingdoms[name].storage;
      if ((storage.coins || 0) >= upgradeCost) {
        storage.coins -= upgradeCost;
        building.currentLevel++;
        saveAndRefresh();
      } else {
        alert("Not enough coins!");
      }
    };

    const itemActions = document.createElement("div");
    itemActions.className = "building-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn primary-btn";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => {
      nameInput.disabled = false;
      basePriceInput.style.display = "block";
      baseSizeInput.style.display = "block";

      editBtn.textContent = "Save";
      editBtn.onclick = () => {
        building.name = nameInput.value.trim();
        building.basePrice = parseFloat(basePriceInput.value);
        building.baseSize = parseFloat(baseSizeInput.value);
        building.produces = parseItemsInput(producesInput.value);
        building.consumes = parseItemsInput(consumesInput.value);
        saveAndRefresh();
      };
    };

    const delBtn = document.createElement("button");
    delBtn.className = "btn secondary-btn";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      kingdoms[name].buildings.splice(index, 1);
      saveAndRefresh();
    };

    itemActions.appendChild(editBtn);
    itemActions.appendChild(delBtn);

    div.appendChild(nameLabel);
    div.appendChild(nameInput);
    div.appendChild(levelLabel);
    div.appendChild(levelDisplay);
    div.appendChild(sizeLabel);
    div.appendChild(sizeDisplay);
    div.appendChild(basePriceInput);
    div.appendChild(baseSizeInput);
    div.appendChild(producesInput);
    div.appendChild(consumesInput);
    div.appendChild(upgradeBtn);
    div.appendChild(itemActions);

    buildingsContainer.appendChild(div);
  });
}

addBuildingBtn.onclick = () => {
  const newBuilding = {
    name: "New Building",
    basePrice: 100,
    baseSize: 50,
    currentLevel: 1,
    produces: {},
    consumes: {}
  };
  kingdoms[name].buildings.push(newBuilding);
  saveAndRefresh();
};

renderBuildings();
