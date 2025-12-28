import { flagsToObj, objToFlags } from '../../../assets/js/utils/helpers.js';
import { calculateMaintains, calculateSize, upgradePrice } from '../../utils.js'

// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("name");
})();
const kingdomNameEl = document.getElementById("kingdomName");
const buildingsContainer = document.getElementById("buildingsContainer");
const addBuildingBtn = document.getElementById("addBuildingBtn");
const companies = JSON.parse(localStorage.getItem("companies"))

kingdomNameEl.textContent = name ? `${name}'s Buildings` : "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].buildings) kingdoms[name].buildings = [];

function saveAndRefresh() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderBuildings();
}

function renderBuildings() {
  buildingsContainer.innerHTML = "";
  kingdoms[name].buildings.forEach((building, index) => {
    
    const div = document.createElement("div");
    div.className = "building";
    div.id = building.name;
    
    // Add enabled/disabled state visual indicator
    if (building.state === "disabled") {
      div.style.opacity = "0.6";
      div.style.backgroundColor = "#f8f8f8";
    }

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Building Name";

    const nameInput = document.createElement("input");
    nameInput.value = building.name;
    nameInput.disabled = true;

    const ownedByLabel = document.createElement("label");
    ownedByLabel.textContent = "Owned By";

    const ownedBySelect = document.createElement("select");
    const ownedBy = building.ownedBy || name;
    if (!building.ownedBy){
      building.ownedBy = ownedBy;
    }
    ownedBySelect.style.width = "100%";
    ownedBySelect.style.padding = "5px";
    ownedBySelect.innerHTML += Object.keys(companies).concat(Object.keys(kingdoms)).map((owner) =>  `<option ${ownedBy === owner ? "selected" : ""} value="${owner}">${owner}</option>`).join("");
    ownedBySelect.disabled = true;

    const propertyLabel = document.createElement("label");
    propertyLabel.textContent = "Property";

    const propertySelect = document.createElement("select");
    const property = building.property || "govt";
    if (!building.property){
      building.property = property;
    }
    propertySelect.style.width = "100%";
    propertySelect.style.padding = "5px";
    ownedBySelect.onchange = () => {
      if (ownedBySelect.value === name) {
        propertySelect.value = "govt";
      } else {
        propertySelect.value = "rent";
      }
    }
    propertySelect.onchange = () => {
      if (ownedBySelect.value === name) {
        propertySelect.value = "govt";
      }
    }

    propertySelect.innerHTML = `
    <option ${property === "govt" ? "selected" : ""} value="govt">govt</option>
    <option ${property === "private" ? "selected" : ""} value="private">private</option>
    <option ${property === "rent" ? "selected" : ""} value="rent">rent</option>
    `;
    propertySelect.disabled = true;

    // Status display (enabled/disabled)
    const statusLabel = document.createElement("label");
    statusLabel.textContent = "Status";
    
    const statusDisplay = document.createElement("div");
    statusDisplay.textContent = building.state === "disabled" ? "Disabled" : "Enabled";
    statusDisplay.style.fontWeight = "bold";
    statusDisplay.style.color = building.state === "disabled" ? "#ff4444" : "#44ff44";

    const levelLabel = document.createElement("label");
    levelLabel.textContent = "Current Level";

    const levelDisplay = document.createElement("div");
    levelDisplay.textContent = `Level ${building.currentLevel}`;

    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = "Current Size";

    const sizeDisplay = document.createElement("div");
    sizeDisplay.textContent = `${calculateSize(building.baseSize, building.currentLevel)} sq.m`;
    
    const MaintainsLabel = document.createElement("label");
    MaintainsLabel.textContent = "Maintains";

    const MaintainsDisplay = document.createElement("div");
    MaintainsDisplay.textContent = objToFlags(calculateMaintains(building.baseMaintains || {}, building.currentLevel));

    const quantityLabel = document.createElement("label");
    quantityLabel.textContent = "Quantity: " + building.quantity || 1;

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = building.quantity || 1;
    quantityInput.className = "editable";
    quantityInput.style.display = "none";

    const basePriceInput = document.createElement("input");
    basePriceInput.value = building.basePrice;
    basePriceInput.className = "editable price-input";
    basePriceInput.style.setProperty("border-color", "gold");
    basePriceInput.style.setProperty("border-radius", "3vw");
    basePriceInput.style.display = "none";

    const baseSizeInput = document.createElement("input");
    baseSizeInput.value = building.baseSize;
    baseSizeInput.className = "editable";
    baseSizeInput.style.display = "none";

    const baseMaintainsInput = document.createElement("input");
    baseMaintainsInput.value = objToFlags(building.baseMaintains || {});
    baseMaintainsInput.className = "editable";
    baseMaintainsInput.style.display = "none";

    function renderKeyValueSection(container, items, label) {
      container.innerHTML = "";

      Object.entries(items).forEach(([key, value]) => {
        if (typeof value === "object")
          value = value.value;
        const pairDiv = document.createElement("div");
        pairDiv.className = "item-pair";

        const keyInput = document.createElement("input");
        keyInput.placeholder = "Item";
        keyInput.value = key;

        const valInput = document.createElement("input");
        valInput.type = "number";
        valInput.placeholder = "Amount";
        valInput.value = value;

        const delBtn = document.createElement("button");
        delBtn.textContent = "−";
        delBtn.onclick = () => {
          delete items[key];
          renderKeyValueSection(container, items, label);
        };

        pairDiv.appendChild(keyInput);
        pairDiv.appendChild(valInput);
        pairDiv.appendChild(delBtn);
        container.appendChild(pairDiv);
      });

      const addBtn = document.createElement("button");
      addBtn.textContent = `+ Add ${label}`;
      addBtn.onclick = () => {
        items[""] = 0;
        renderKeyValueSection(container, items, label);
      };
      container.appendChild(addBtn);
    }

    const producesLabel = document.createElement("label");
    producesLabel.textContent = "Produces";

    const producesContainer = document.createElement("div");
    renderKeyValueSection(producesContainer, building.produces, "Produce");

    const consumesLabel = document.createElement("label");
    consumesLabel.textContent = "Consumes";

    const consumesContainer = document.createElement("div");
    renderKeyValueSection(consumesContainer, building.consumes, "Consume");

    const upgradeBtn = document.createElement("button");
    upgradeBtn.className = "btn primary-btn";
    const upgradeCost = upgradePrice(building.basePrice, building.currentLevel) * building.quantity;
    upgradeBtn.textContent = building.quantity > 1 
    ? `Upgrade (${(upgradeCost / building.quantity).toLocaleString()} X ${building.quantity} = ${upgradeCost.toLocaleString()}$)`
    : `Upgrade (${upgradeCost.toLocaleString()}$)`

    if (upgradeCost === 0)
      upgradeBtn.style.display = "none";

    // Disable upgrade button if building is disabled
    if (building.state === "disabled") {
      upgradeBtn.disabled = true;
      upgradeBtn.style.opacity = "0.5";
    }

    upgradeBtn.onclick = () => {
      if (building.state === "disabled") {
        alert("Cannot upgrade a disabled building!");
        return;
      }
      
      const storage = kingdoms[name].storage;
      if ((storage.coins || 0) >= upgradeCost) {
        storage.coins -= upgradeCost;
        building.currentLevel++;
        saveAndRefresh();
      } else {
        alert("Not enough coins!");
      }
    };

    // Toggle Enable/Disable Button
    const toggleStatusBtn = document.createElement("button");
    toggleStatusBtn.className = building.state === "disabled" ? "btn success-btn" : "btn warning-btn";
    toggleStatusBtn.textContent = building.state === "disabled" ? "Enable" : "Disable";
    
    toggleStatusBtn.onclick = () => {
      building.state = building.state === "disabled" ? "enabled" : "disabled";
      saveAndRefresh();
    };

    const itemActions = document.createElement("div");
    itemActions.className = "building-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn primary-btn";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => {
      nameInput.disabled = false;
      propertySelect.disabled = false;
      ownedBySelect.disabled = false;

      basePriceInput.style.display = "block";
      baseSizeInput.style.display = "block";
      baseMaintainsInput.style.display = "block";
      quantityInput.style.display = "block";
      
      editBtn.textContent = "Save";
      editBtn.onclick = () => {
        building.name = nameInput.value.trim();
        building.ownedBy = ownedBySelect.value;
        building.property = propertySelect.value;
        building.basePrice = parseFloat(basePriceInput.value);
        building.baseSize = parseFloat(baseSizeInput.value);
        building.baseMaintains = flagsToObj(baseMaintainsInput.value);
        building.quantity = parseInt(quantityInput.value) || 1;

        const extractValues = (container) => {
          const result = {};
          [...container.querySelectorAll(".item-pair")].forEach(pair => {
            const inputs = pair.querySelectorAll("input");
            const k = inputs[0].value.trim();
            const v = parseFloat(inputs[1].value);
            if (k) result[k] = isNaN(v) ? 0 : v;
          });
          return result;
        };

        building.produces = extractValues(producesContainer);
        building.consumes = extractValues(consumesContainer);
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
    itemActions.appendChild(toggleStatusBtn); // Add the toggle button
    itemActions.appendChild(delBtn);

    div.appendChild(nameLabel);
    div.appendChild(nameInput);
    
    div.appendChild(ownedByLabel);
    div.appendChild(ownedBySelect);

    div.appendChild(propertyLabel);
    div.appendChild(propertySelect);

    div.appendChild(statusLabel);
    div.appendChild(statusDisplay);

    div.appendChild(levelLabel);
    div.appendChild(levelDisplay);

    div.appendChild(sizeLabel);
    div.appendChild(sizeDisplay);
    div.appendChild(baseSizeInput);

    div.appendChild(MaintainsLabel);
    div.appendChild(MaintainsDisplay);
    div.appendChild(baseMaintainsInput);

    div.appendChild(quantityLabel);
    div.appendChild(quantityInput);
    div.appendChild(document.createElement("br"));
    div.appendChild(basePriceInput);
   
    div.appendChild(producesLabel);
    div.appendChild(producesContainer);
    div.appendChild(consumesLabel);
    div.appendChild(consumesContainer);
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
    baseMaintains: { defence: 0 },
    currentLevel: 1,
    quantity: 1,
    produces: {},
    consumes: {},
    state: "enabled" // Default to enabled
  };
  kingdoms[name].buildings.push(newBuilding);
  saveAndRefresh();
};

renderBuildings();

globalThis.hideQuickFindForm = () => {
  const quickFindForm = document.getElementById("quickFindForm");
  quickFindForm.classList.remove("active");
}

function renderQuickBuildingLinks(quickFindForm, ownedBySel, propertySel, sortBySizeCheckBox, showSizeCheckBox, showQuantityCheckBox) {
  const linksContainer = quickFindForm.querySelector(".links-container");
  linksContainer.innerHTML = "";
  let buildings = kingdoms[name].buildings;
  
  if (ownedBySel.value !== "all")
    buildings = buildings.filter(b => b.ownedBy === ownedBySel.value);
  
  if (propertySel.value !== "all")
    buildings = buildings.filter(b => b.property === propertySel.value);
  
  if (sortBySizeCheckBox.checked) {
    buildings = [...buildings].sort((b1, b2) => {
      let size1 = calculateSize(b1.baseSize, b1.currentLevel);
      let size2 = calculateSize(b2.baseSize, b2.currentLevel);
      if (showQuantityCheckBox.checked) {
        size1 = size1 * b1.quantity;
        size2 = size2 * b2.quantity;
      }
      return size2 - size1;
    });
  }
  
  buildings.forEach((building) => {
    const btn = document.createElement("button");
    // Add status indicator to quick find
    const statusIndicator = building.state === "disabled" ? " 🔴" : " 🟢";
    btn.textContent = `${building.name}${statusIndicator} ${showQuantityCheckBox.checked ? "( " + building.quantity + " )" : ""} ${showSizeCheckBox.checked ? calculateSize(building.baseSize, building.currentLevel) + " sq.m" : ""}`;
    btn.onclick = () => {
      const id = CSS.escape(building.name); // ensures valid selector
      const targetedBuilding = buildingsContainer.querySelector(`#${id}`);
      if (targetedBuilding) {
        targetedBuilding.scrollIntoView({ behavior: "smooth", block: "center" });
        hideQuickFindForm();
      }
    };
    linksContainer.appendChild(btn);
  });
}

function setupOwnedBySelect(ownedBySel) {
  ownedBySel.innerHTML = "<option selected value='all'>all</option>";
  ownedBySel.innerHTML += Object.keys(companies).concat(Object.keys(kingdoms)).map((owner) => `<option value="${owner}">${owner}</option>`).join("");
}

globalThis.showQuickFindForm = () => {
  const quickFindForm = document.getElementById("quickFindForm");
  quickFindForm.classList.add("active");
  const controlerBar = quickFindForm.querySelector(".controler-bar");
  const ownedBySel = controlerBar.querySelector(".owned-by");
  const propertySel = controlerBar.querySelector(".property");
  const sortBySizeCheckBox = controlerBar.querySelector(".sort-by-size");
  const showSizeCheckBox = controlerBar.querySelector(".show-size");
  const showQuantityCheckBox = controlerBar.querySelector(".show-quantity");
  setupOwnedBySelect(ownedBySel);
  renderQuickBuildingLinks(quickFindForm, ownedBySel, propertySel, sortBySizeCheckBox, showSizeCheckBox, showQuantityCheckBox);
  const controlers = [ownedBySel, propertySel, sortBySizeCheckBox, showSizeCheckBox, showQuantityCheckBox];
  controlers.forEach(el => {
    el.onchange = () => renderQuickBuildingLinks(quickFindForm, ownedBySel, propertySel, sortBySizeCheckBox, showSizeCheckBox, showQuantityCheckBox);
  });
}