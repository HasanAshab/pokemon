import { flagsToObj, objToFlags } from '../../../assets/js/utils/helpers.js';
import { calculateMaintains, calculateSize, upgradePrice, getRequiredArchLevel, getArchCost, getMaterialCost, getBuildCost } from '../../utils.js'

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

// Auto-save function for produce/consume changes
function autoSaveProduceConsume(building, producesContainer, consumesContainer) {
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
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
}

// Check and update building expiry
function updateBuildingExpiry() {
  kingdoms[name].buildings.forEach(building => {
    if (building.lifespan !== undefined && building.lifespan > 0) {
      building.lifespan--;
      if (building.lifespan <= 0) {
        building.state = "disabled";
        building.expired = true;
      }
    }
  });
}

// Calculate remaining lifespan display
function getLifespanDisplay(building) {
  if (building.lifespan === undefined) return "";
  if (building.lifespan <= 0) return "Expired";
  
  const years = Math.floor(building.lifespan / 12);
  const months = building.lifespan % 12;
  
  if (years > 0 && months > 0) {
    return `${years}y ${months}m`;
  } else if (years > 0) {
    return `${years}y`;
  } else {
    return `${months}m`;
  }
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
    const statusText = building.state === "disabled" ? 
      (building.expired ? "Expired" : "Disabled") : "Enabled";
    statusDisplay.textContent = statusText;
    statusDisplay.style.fontWeight = "bold";
    statusDisplay.style.color = building.state === "disabled" ? 
      (building.expired ? "#ff8800" : "#ff4444") : "#44ff44";

    // Lifespan display and controls (only show for non-permanent buildings)
    const lifespanLabel = document.createElement("label");
    lifespanLabel.textContent = "Lifespan";
    
    const lifespanDisplay = document.createElement("div");
    const lifespanText = getLifespanDisplay(building);
    lifespanDisplay.textContent = lifespanText;
    lifespanDisplay.style.fontWeight = "bold";
    lifespanDisplay.style.color = building.lifespan !== undefined && building.lifespan <= 3 ? "#ff4444" : "#333";
    
    // Hide lifespan section for permanent buildings
    const isExpirable = building.lifespan !== undefined;
    if (!isExpirable) {
      lifespanLabel.style.display = "none";
      lifespanDisplay.style.display = "none";
    }
    
    const lifespanControls = document.createElement("div");
    lifespanControls.style.display = "none";
    lifespanControls.style.gap = "5px";
    lifespanControls.style.alignItems = "center";
    
    const lifespanYearsInput = document.createElement("input");
    lifespanYearsInput.type = "number";
    lifespanYearsInput.placeholder = "Years";
    lifespanYearsInput.min = "0";
    lifespanYearsInput.style.width = "60px";
    lifespanYearsInput.value = building.lifespan ? Math.floor(building.lifespan / 12) : 0;
    
    const lifespanMonthsInput = document.createElement("input");
    lifespanMonthsInput.type = "number";
    lifespanMonthsInput.placeholder = "Months";
    lifespanMonthsInput.min = "0";
    lifespanMonthsInput.max = "11";
    lifespanMonthsInput.style.width = "60px";
    lifespanMonthsInput.value = building.lifespan ? building.lifespan % 12 : 0;
    
    const permanentCheckbox = document.createElement("input");
    permanentCheckbox.type = "checkbox";
    permanentCheckbox.checked = building.lifespan === undefined;
    
    const permanentLabel = document.createElement("label");
    permanentLabel.textContent = "Permanent";
    permanentLabel.style.fontSize = "12px";
    
    lifespanControls.appendChild(lifespanYearsInput);
    lifespanControls.appendChild(document.createTextNode("y "));
    lifespanControls.appendChild(lifespanMonthsInput);
    lifespanControls.appendChild(document.createTextNode("m "));
    lifespanControls.appendChild(permanentCheckbox);
    lifespanControls.appendChild(permanentLabel);

    // Durability level display and controls
    const durabilityLabel = document.createElement("label");
    durabilityLabel.textContent = "Durability Level";
    
    const durabilityDisplay = document.createElement("div");
    // Set default durability if not exists
    if (building.durability === undefined) {
      building.durability = 1;
    }
    durabilityDisplay.textContent = `Level ${building.durability}`;
    durabilityDisplay.style.fontWeight = "bold";
    
    const durabilityInput = document.createElement("input");
    durabilityInput.type = "number";
    durabilityInput.min = "1";
    durabilityInput.value = building.durability;
    durabilityInput.className = "editable";
    durabilityInput.style.display = "none";
    durabilityInput.style.width = "80px";

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

        // Auto-save on blur for both inputs
        keyInput.addEventListener('blur', () => autoSaveProduceConsume(building, producesContainer, consumesContainer));
        valInput.addEventListener('blur', () => autoSaveProduceConsume(building, producesContainer, consumesContainer));

        const delBtn = document.createElement("button");
        delBtn.textContent = "−";
        delBtn.onclick = () => {
          delete items[key];
          renderKeyValueSection(container, items, label);
          autoSaveProduceConsume(building, producesContainer, consumesContainer);
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
      durabilityInput.style.display = "block";
      lifespanControls.style.display = "flex";
      
      editBtn.textContent = "Save";
      editBtn.onclick = () => {
        building.name = nameInput.value.trim();
        building.ownedBy = ownedBySelect.value;
        building.property = propertySelect.value;
        building.basePrice = parseFloat(basePriceInput.value);
        building.baseSize = parseFloat(baseSizeInput.value);
        building.baseMaintains = flagsToObj(baseMaintainsInput.value);
        building.quantity = parseInt(quantityInput.value) || 1;
        building.durability = parseInt(durabilityInput.value) || 1;

        // Handle lifespan
        if (permanentCheckbox.checked) {
          delete building.lifespan;
          delete building.expired;
        } else {
          const years = parseInt(lifespanYearsInput.value) || 0;
          const months = parseInt(lifespanMonthsInput.value) || 0;
          building.lifespan = years * 12 + months;
          if (building.lifespan <= 0) {
            building.state = "disabled";
            building.expired = true;
          } else {
            building.expired = false;
          }
        }

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

    div.appendChild(lifespanLabel);
    div.appendChild(lifespanDisplay);
    div.appendChild(lifespanControls);

    div.appendChild(durabilityLabel);
    div.appendChild(durabilityDisplay);

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
    div.appendChild(durabilityInput);
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
    durability: 1,
    produces: {},
    consumes: {},
    state: "enabled" // Default to enabled
  };
  kingdoms[name].buildings.push(newBuilding);
  saveAndRefresh();
};

// Bulk delete functions
document.getElementById("deleteDisabledBtn").onclick = () => {
  const disabledBuildings = kingdoms[name].buildings.filter(b => b.state === "disabled");
  if (disabledBuildings.length === 0) {
    alert("No disabled buildings to delete.");
    return;
  }
  
  if (confirm(`Delete ${disabledBuildings.length} disabled buildings? This cannot be undone.`)) {
    kingdoms[name].buildings = kingdoms[name].buildings.filter(b => b.state !== "disabled");
    saveAndRefresh();
    alert(`Deleted ${disabledBuildings.length} disabled buildings.`);
  }
};

document.getElementById("deleteExpiredBtn").onclick = () => {
  const expiredBuildings = kingdoms[name].buildings.filter(b => b.expired === true);
  if (expiredBuildings.length === 0) {
    alert("No expired buildings to delete.");
    return;
  }
  
  if (confirm(`Delete ${expiredBuildings.length} expired buildings? This cannot be undone.`)) {
    kingdoms[name].buildings = kingdoms[name].buildings.filter(b => b.expired !== true);
    saveAndRefresh();
    alert(`Deleted ${expiredBuildings.length} expired buildings.`);
  }
};

renderBuildings();

// Cost Estimator functionality
function calculateConstructionCost() {
  const size = parseInt(document.getElementById('sizeInput').value) || 0;
  const floor = parseInt(document.getElementById('floorInput').value) || 1;
  const durability = parseInt(document.getElementById('durabilityInput').value) || 1;
  
  if (size <= 0) {
    alert('Please enter a valid size greater than 0');
    return;
  }
  
  const kingdom = kingdoms[name];
  if (!kingdom) {
    alert('Kingdom data not found');
    return;
  }
  
  // Calculate costs using utility functions
  const requiredArchLevel = getRequiredArchLevel(floor, durability);
  const archCost = getArchCost(kingdom, requiredArchLevel, size, floor);
  const materialCost = getMaterialCost(kingdom, size, floor, durability);
  const totalCost = getBuildCost(kingdom, size, floor, durability);
  
  // Display results
  document.getElementById('archLevel').textContent = requiredArchLevel;
  document.getElementById('archCost').textContent = `$${archCost.toLocaleString()}`;
  document.getElementById('materialCost').textContent = `$${materialCost.toLocaleString()}`;
  document.getElementById('totalCost').textContent = `$${totalCost.toLocaleString()}`;
  
  // Show results section
  document.getElementById('costResults').style.display = 'block';
}

// Add event listeners for cost estimator
document.getElementById('calculateBtn').addEventListener('click', calculateConstructionCost);

// Auto-calculate on input change
['sizeInput', 'floorInput', 'durabilityInput'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    if (document.getElementById('costResults').style.display !== 'none') {
      calculateConstructionCost();
    }
  });
});

globalThis.hideQuickFindForm = () => {
  const quickFindForm = document.getElementById("quickFindForm");
  quickFindForm.classList.remove("active");
}

function renderQuickBuildingLinks(quickFindForm, ownedBySel, propertySel, sortBySizeCheckBox, showSizeCheckBox, showQuantityCheckBox, showOnlyExpirableCheckBox, sortByDurabilityCheckBox) {
  const linksContainer = quickFindForm.querySelector(".links-container");
  linksContainer.innerHTML = "";
  let buildings = kingdoms[name].buildings;
  
  if (ownedBySel.value !== "all")
    buildings = buildings.filter(b => b.ownedBy === ownedBySel.value);
  
  if (propertySel.value !== "all")
    buildings = buildings.filter(b => b.property === propertySel.value);
  
  // Filter to show only expirable buildings if checkbox is checked
  if (showOnlyExpirableCheckBox.checked) {
    buildings = buildings.filter(b => b.lifespan !== undefined);
  }
  
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
  
  if (sortByDurabilityCheckBox.checked) {
    buildings = [...buildings].sort((b1, b2) => {
      const durability1 = b1.durability || 1;
      const durability2 = b2.durability || 1;
      return durability2 - durability1; // Sort highest durability first
    });
  }
  
  buildings.forEach((building) => {
    const btn = document.createElement("button");
    // Add status indicator to quick find
    const statusIndicator = building.state === "disabled" ? 
      (building.expired ? " 🟠" : " 🔴") : " 🟢";
    
    let buttonText = `${building.name}${statusIndicator}`;
    
    if (showQuantityCheckBox.checked) {
      buttonText += ` (${building.quantity})`;
    }
    
    if (showSizeCheckBox.checked) {
      buttonText += ` ${calculateSize(building.baseSize, building.currentLevel)} sq.m`;
    }
    
    // Always show expiry for expirable buildings in quick find
    const lifespanText = getLifespanDisplay(building);
    if (lifespanText) {
      buttonText += ` [${lifespanText}]`;
    }
    
    btn.textContent = buttonText;
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
  const showOnlyExpirableCheckBox = controlerBar.querySelector(".show-only-expirable");
  const sortByDurabilityCheckBox = controlerBar.querySelector(".sort-by-durability");
  setupOwnedBySelect(ownedBySel);
  renderQuickBuildingLinks(quickFindForm, ownedBySel, propertySel, sortBySizeCheckBox, showSizeCheckBox, showQuantityCheckBox, showOnlyExpirableCheckBox, sortByDurabilityCheckBox);
  const controlers = [ownedBySel, propertySel, sortBySizeCheckBox, showSizeCheckBox, showQuantityCheckBox, showOnlyExpirableCheckBox, sortByDurabilityCheckBox];
  controlers.forEach(el => {
    el.onchange = () => renderQuickBuildingLinks(quickFindForm, ownedBySel, propertySel, sortBySizeCheckBox, showSizeCheckBox, showQuantityCheckBox, showOnlyExpirableCheckBox, sortByDurabilityCheckBox);
  });
}
// Go to top functionality
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Show/hide go to top button based on scroll position
function toggleGoToTopButton() {
  const goToTopBtn = document.getElementById('goToTopBtn');
  if (window.pageYOffset > 300) {
    goToTopBtn.classList.add('show');
  } else {
    goToTopBtn.classList.remove('show');
  }
}

// Add scroll event listener
window.addEventListener('scroll', toggleGoToTopButton);

// Make scrollToTop function globally available
globalThis.scrollToTop = scrollToTop;