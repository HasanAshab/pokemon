import { flagsToObj, objToFlags } from '../../../assets/js/utils/helpers.js';
import { calculateMaintains, calculateSize, upgradePrice, getRequiredArchLevel, getArchCost, getMaterialCost, getBuildCost, calculateArtilleryPrice, getRequiredMechanicLevel, getMechanicCost, getArtilleryMaterialCost } from '../../utils.js'

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
if (!kingdoms[name].events) kingdoms[name].events = { future: [], past: [] };

// Event modal variables
let currentEventCallback = null;
let currentEventTitle = "";

// Event creation functions
function createEvent(title, years, months) {
  const totalMonths = (years * 12) + months;
  if (totalMonths <= 0) return false;
  
  const event = {
    id: Date.now(),
    title: title,
    remainingMonths: totalMonths,
    isSecret: false,
    isHappened: false
  };
  
  kingdoms[name].events.future.push(event);
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  return true;
}

function showEventModal(title, message, callback) {
  currentEventCallback = callback;
  currentEventTitle = title;
  
  document.getElementById('eventModalTitle').textContent = title;
  document.getElementById('eventModalMessage').textContent = message;
  document.getElementById('eventModalYears').value = '0';
  document.getElementById('eventModalMonths').value = '1';
  document.getElementById('eventModal').style.display = 'block';
}

function closeEventModal() {
  document.getElementById('eventModal').style.display = 'none';
  currentEventCallback = null;
  currentEventTitle = "";
}

function confirmEventModal() {
  const years = parseInt(document.getElementById('eventModalYears').value) || 0;
  const months = parseInt(document.getElementById('eventModalMonths').value) || 0;
  
  if (years === 0 && months === 0) {
    alert('Please enter at least 1 month');
    return;
  }
  
  if (createEvent(currentEventTitle, years, months)) {
    closeEventModal();
    // No callback execution needed - events are just for tracking
  } else {
    alert('Failed to create event');
  }
}

// Make modal functions globally available
globalThis.closeEventModal = closeEventModal;
globalThis.confirmEventModal = confirmEventModal;

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
    durabilityLabel.textContent = "Durability Level: " + building.durability;
    
    const durabilityInput = document.createElement("input");
    durabilityInput.type = "number";
    durabilityInput.min = "1";
    durabilityInput.value = building.durability;
    durabilityInput.className = "editable";
    durabilityInput.style.display = "none";

    const levelLabel = document.createElement("label");
    levelLabel.textContent = "Current Level";

    const levelDisplay = document.createElement("div");
    levelDisplay.textContent = `Level ${building.currentLevel}`;
    levelDisplay.style.fontWeight = "bold";
    levelDisplay.style.color = "darkblue";

    // Floor attribute display and controls
    const floorLabel = document.createElement("label");
    floorLabel.textContent = "Floor: " + building.floor;
    

    
    const floorInput = document.createElement("input");
    floorInput.type = "number";
    floorInput.min = "1";
    floorInput.value = building.floor;
    floorInput.className = "editable";
    floorInput.style.display = "none";

    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = `Current Size: ${calculateSize(building.baseSize, building.currentLevel)} sq.m`;

 
    const MaintainsLabel = document.createElement("label");
    MaintainsLabel.textContent = "Maintains";

    const MaintainsDisplay = document.createElement("div");
    MaintainsDisplay.textContent = objToFlags(calculateMaintains(building.baseMaintains || {}, building.currentLevel));

    const quantityLabel = document.createElement("label");
    quantityLabel.textContent = "Quantity: " + (building.quantity || 1);

    // Broken quantity display and controls
    const brokenQuantityLabel = document.createElement("label");
    brokenQuantityLabel.textContent = "Broken Quantity";
    
    const brokenQuantityDisplay = document.createElement("div");
    // Set default brokenQuantity if not exists
    if (building.brokenQuantity === undefined) {
      building.brokenQuantity = 0;
    }
    
    const workingQuantity = (building.quantity || 1) - building.brokenQuantity;
    brokenQuantityDisplay.textContent = building.brokenQuantity > 0 ? 
      `${building.brokenQuantity} broken (${workingQuantity} working)` : 
      "All working";
    brokenQuantityDisplay.style.fontWeight = "bold";
    brokenQuantityDisplay.style.color = building.brokenQuantity > 0 ? "#ff4444" : "#44ff44";
    
    const brokenQuantityInput = document.createElement("input");
    brokenQuantityInput.type = "number";
    brokenQuantityInput.min = "0";
    brokenQuantityInput.max = building.quantity || 1;
    brokenQuantityInput.value = building.brokenQuantity;
    brokenQuantityInput.className = "editable";
    brokenQuantityInput.style.display = "none";
    brokenQuantityInput.style.width = "80px";

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
        // Show event modal for upgrade
        const eventTitle = `${building.name} Upgrade Complete!`;
        showEventModal(
          "Set Upgrade Time",
          `How long will it take to upgrade ${building.name}?`,
          null // No callback needed
        );
        // Update the current event title for the modal
        currentEventTitle = eventTitle;
        
        // Perform upgrade immediately
        storage.coins -= upgradeCost;
        building.currentLevel++;
        saveAndRefresh();
      } else {
        alert("Not enough coins!");
      }
    };

    // Repair Button (only show if there are broken buildings)
    const repairBtn = document.createElement("button");
    repairBtn.className = "btn warning-btn";
    
    if (building.brokenQuantity > 0) {
      const repairCostPerUnit = Math.round(upgradePrice(building.basePrice, building.currentLevel - 1) / 4);
      const totalRepairCost = repairCostPerUnit * building.brokenQuantity;
      
      repairBtn.textContent = building.brokenQuantity > 1 ? 
        `Repair All (${repairCostPerUnit.toLocaleString()} X ${building.brokenQuantity} = ${totalRepairCost.toLocaleString()}$)` :
        `Repair (${repairCostPerUnit.toLocaleString()}$)`;
      
      repairBtn.onclick = () => {
        if (building.state === "disabled") {
          alert("Cannot repair a disabled building!");
          return;
        }
        
        let quantityToRepair = building.brokenQuantity;
        
        // If more than 1 broken, ask how many to repair
        if (building.brokenQuantity > 1) {
          const input = prompt(`How many buildings do you want to repair? (1-${building.brokenQuantity})`);
          const parsed = parseInt(input);
          
          if (isNaN(parsed) || parsed < 1 || parsed > building.brokenQuantity) {
            alert("Invalid quantity!");
            return;
          }
          
          quantityToRepair = parsed;
        }
        
        const finalRepairCost = repairCostPerUnit * quantityToRepair;
        const storage = kingdoms[name].storage;
        
        if ((storage.coins || 0) >= finalRepairCost) {
          if (confirm(`Repair ${quantityToRepair} building(s) for ${finalRepairCost.toLocaleString()} coins?`)) {
            // Deduct repair cost
            storage.coins -= finalRepairCost;
            
            // Reduce broken quantity
            building.brokenQuantity -= quantityToRepair;
            
            saveAndRefresh();
            alert(`Successfully repaired ${quantityToRepair} building(s)!`);
          }
        } else {
          alert(`Not enough coins! Need ${finalRepairCost.toLocaleString()} but only have ${(storage.coins || 0).toLocaleString()}.`);
        }
      };
    } else {
      repairBtn.style.display = "none";
    }

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
      floorInput.style.display = "block";
      brokenQuantityInput.style.display = "block";
      lifespanControls.style.display = "flex";
      
      editBtn.textContent = "Save";
      editBtn.onclick = () => {
        const buildingName = nameInput.value.trim();
        
        // Save building changes first
        saveBuildingChanges();
        
        // Ask if construction is required
        if (confirm("Does it require construction?")) {
          const eventTitle = `${buildingName} Construction Complete!`;
          showEventModal(
            "Set Construction Time",
            `How long will it take to construct ${buildingName}?`,
            null // No callback needed
          );
          // Update the current event title for the modal
          currentEventTitle = eventTitle;
        }
        
        function saveBuildingChanges() {
          building.name = buildingName;
          building.ownedBy = ownedBySelect.value;
          building.property = propertySelect.value;
          building.basePrice = parseFloat(basePriceInput.value);
          building.baseSize = parseFloat(baseSizeInput.value);
          building.baseMaintains = flagsToObj(baseMaintainsInput.value);
          building.quantity = parseInt(quantityInput.value) || 1;
          building.durability = parseInt(durabilityInput.value) || 1;
          building.floor = parseInt(floorInput.value) || 1;
          building.brokenQuantity = Math.min(parseInt(brokenQuantityInput.value) || 0, building.quantity);

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
        }
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

    div.appendChild(levelDisplay);

    div.appendChild(lifespanLabel);
    div.appendChild(lifespanDisplay);
    div.appendChild(lifespanControls);

    div.appendChild(durabilityLabel);
    div.appendChild(durabilityInput);


   
    div.appendChild(floorLabel);
    div.appendChild(floorInput);
    div.appendChild(sizeLabel);
    div.appendChild(baseSizeInput);

    div.appendChild(MaintainsLabel);
    div.appendChild(MaintainsDisplay);
    div.appendChild(baseMaintainsInput);

    div.appendChild(quantityLabel);
    div.appendChild(quantityInput);
    
    div.appendChild(brokenQuantityLabel);
    div.appendChild(brokenQuantityDisplay);
    div.appendChild(brokenQuantityInput);
    
    div.appendChild(document.createElement("br"));
    div.appendChild(basePriceInput);
   
    div.appendChild(producesLabel);
    div.appendChild(producesContainer);
    div.appendChild(consumesLabel);
    div.appendChild(consumesContainer);
    div.appendChild(upgradeBtn);
    div.appendChild(repairBtn);
    div.appendChild(itemActions);

    buildingsContainer.appendChild(div);
  });
}

addBuildingBtn.onclick = () => {
  // Check if cost estimator has been used
  const hasEstimation = window.currentConstructionCost && 
                       document.getElementById('costResults').style.display !== 'none';
  
  let newBuilding;
  
  if (hasEstimation) {
    // Use values from cost estimator inputs
    const size = parseInt(document.getElementById('sizeInput').value) || 0;
    const floor = parseInt(document.getElementById('floorInput').value) || 1;
    const durability = parseInt(document.getElementById('durabilityInput').value) || 1;
    const quantity = parseInt(document.getElementById('quantityInput').value) || 1;
    
    // Calculate per-unit base price from total estimated cost
    const totalCost = window.currentConstructionCost;
    const basePrice = Math.round(totalCost / quantity);
    
    newBuilding = {
      name: "New Building",
      basePrice: basePrice,
      baseSize: size,
      baseMaintains: { defence: 0, station: 0, doctor: 0, revive: 0, dRes: 0, bRes: 0 },
      currentLevel: 1,
      quantity: quantity,
      durability: durability,
      floor: floor,
      brokenQuantity: 0,
      produces: {},
      consumes: {},
      state: "enabled"
    };
  } else {
    // Use default values
    newBuilding = {
      name: "New Building",
      basePrice: 100,
      baseSize: 50,
      baseMaintains: { defence: 0, station: 0, doctor: 0, revive: 0, dRes: 0, bRes: 0 },
      currentLevel: 1,
      quantity: 1,
      durability: 1,
      floor: 1,
      brokenQuantity: 0,
      produces: {},
      consumes: {},
      state: "enabled"
    };
  }
  
  kingdoms[name].buildings.push(newBuilding);
  saveAndRefresh();
  
  // Auto-scroll to bottom after adding new building
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }, 100); // Small delay to ensure DOM is updated
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
  const quantity = parseInt(document.getElementById('quantityInput').value) || 1;
  
  if (size <= 0) {
    alert('Please enter a valid size greater than 0');
    return;
  }
  
  if (quantity <= 0) {
    alert('Please enter a valid quantity greater than 0');
    return;
  }
  
  const kingdom = kingdoms[name];
  if (!kingdom) {
    alert('Kingdom data not found');
    return;
  }
  
  // Calculate costs using utility functions (per unit)
  const requiredArchLevel = getRequiredArchLevel(floor, durability);
  const archCostPerUnit = getArchCost(kingdom, requiredArchLevel, size, floor);
  const materialCostPerUnit = getMaterialCost(kingdom, size, floor, durability);
  const totalCostPerUnit = getBuildCost(kingdom, size, floor, durability);
  
  // Calculate total costs for all quantities
  const totalArchCost = archCostPerUnit * quantity;
  const totalMaterialCost = materialCostPerUnit * quantity;
  const totalCost = totalCostPerUnit * quantity;
  
  // Display results
  document.getElementById('archLevel').textContent = requiredArchLevel;
  document.getElementById('archCost').textContent = quantity > 1 ? 
    `${archCostPerUnit.toLocaleString()} × ${quantity} = ${totalArchCost.toLocaleString()}` :
    `${totalArchCost.toLocaleString()}`;
  document.getElementById('materialCost').textContent = quantity > 1 ?
    `${materialCostPerUnit.toLocaleString()} × ${quantity} = ${totalMaterialCost.toLocaleString()}` :
    `${totalMaterialCost.toLocaleString()}`;
  document.getElementById('totalCost').textContent = quantity > 1 ?
    `${totalCostPerUnit.toLocaleString()} × ${quantity} = ${totalCost.toLocaleString()}` :
    `${totalCost.toLocaleString()}`;
  
  // Show results section and pay button
  document.getElementById('costResults').style.display = 'block';
  document.getElementById('payButtonContainer').style.display = 'flex';
  
  // Store current calculation for payment
  window.currentConstructionCost = totalCost;
}

// Payment function for construction
function payForConstruction() {
  if (!window.currentConstructionCost) {
    alert('Please calculate cost first');
    return;
  }
  
  const kingdom = kingdoms[name];
  const storage = kingdom.storage || {};
  const totalCost = window.currentConstructionCost;
  
  if ((storage.coins || 0) < totalCost) {
    alert(`Insufficient funds! You need ${totalCost.toLocaleString()} coins but only have ${(storage.coins || 0).toLocaleString()}.`);
    return;
  }
  
  if (confirm(`Pay ${totalCost.toLocaleString()} coins for construction?`)) {
    // Deduct cost from kingdom storage
    if (!kingdom.storage) kingdom.storage = {};
    kingdom.storage.coins = (kingdom.storage.coins || 0) - totalCost;
    
    // Save changes
    localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
    
    // Clear current cost and hide pay button
    window.currentConstructionCost = null;
    document.getElementById('payButtonContainer').style.display = 'none';
    
    alert(`Payment successful! ${totalCost.toLocaleString()} coins deducted. Remaining balance: ${kingdom.storage.coins.toLocaleString()} coins.`);
  }
}

// Make payForConstruction globally available
globalThis.payForConstruction = payForConstruction;

// Add event listeners for cost estimator
document.getElementById('calculateBtn').addEventListener('click', calculateConstructionCost);

// Auto-calculate on input change
['sizeInput', 'floorInput', 'durabilityInput', 'quantityInput'].forEach(id => {
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
// Smart scroll functionality
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
}

function smartScroll() {
  const scrollPosition = window.pageYOffset;
  const documentHeight = document.body.scrollHeight;
  const windowHeight = window.innerHeight;
  const scrollPercentage = scrollPosition / (documentHeight - windowHeight);
  
  // If we're in the top half, scroll to bottom; if in bottom half, scroll to top
  if (scrollPercentage < 0.5) {
    scrollToBottom();
  } else {
    scrollToTop();
  }
}

// Show/hide smart scroll button and update icon based on scroll position
function toggleSmartScrollButton() {
  const smartScrollBtn = document.getElementById('smartScrollBtn');
  const scrollPosition = window.pageYOffset;
  const documentHeight = document.body.scrollHeight;
  const windowHeight = window.innerHeight;
  const scrollPercentage = scrollPosition / (documentHeight - windowHeight);
  
  // Show button after scrolling 300px
  if (scrollPosition > 300) {
    smartScrollBtn.classList.add('show');
    
    // Update button icon and title based on position
    if (scrollPercentage < 0.5) {
      smartScrollBtn.innerHTML = '↓';
      smartScrollBtn.title = 'Go to bottom';
    } else {
      smartScrollBtn.innerHTML = '↑';
      smartScrollBtn.title = 'Go to top';
    }
  } else {
    smartScrollBtn.classList.remove('show');
  }
}

// Add scroll event listener
window.addEventListener('scroll', toggleSmartScrollButton);

// Make functions globally available
globalThis.scrollToTop = scrollToTop;
globalThis.scrollToBottom = scrollToBottom;
globalThis.smartScroll = smartScroll;

// Cost Estimator toggle
function toggleCostEstimator() {
  const estimator = document.getElementById('costEstimator');
  estimator.classList.toggle('expanded');
}
globalThis.toggleCostEstimator = toggleCostEstimator;

// Artillery Calculator toggle
function toggleArtilleryCalculator() {
  const calculator = document.getElementById('artilleryCalculator');
  calculator.classList.toggle('expanded');
}
globalThis.toggleArtilleryCalculator = toggleArtilleryCalculator;

// Artillery price calculation
function calculateArtilleryTotalPrice() {
  const power = parseInt(document.getElementById('artilleryPowerInput').value) || 0;
  const lifetime = parseInt(document.getElementById('artilleryLifetimeInput').value) || 0;
  const size = parseInt(document.getElementById('artillerySizeInput').value) || 0;
  const quantity = parseInt(document.getElementById('artilleryQuantityInput').value) || 1;
  
  const kingdom = kingdoms[name];
  
  // Calculate breakdown for single unit
  const requiredMechanicLevel = getRequiredMechanicLevel(power, size);
  const mechanicCost = getMechanicCost(kingdom, requiredMechanicLevel);
  const materialCost = getArtilleryMaterialCost(kingdom, lifetime, size);
  const unitPrice = calculateArtilleryPrice(kingdom, power, lifetime, size);
  const totalPrice = unitPrice * quantity;
  
  // Update display
  document.getElementById('artilleryMechanicLevel').textContent = requiredMechanicLevel.toFixed(2);
  document.getElementById('artilleryMechanicCost').textContent = (mechanicCost * quantity).toLocaleString();
  document.getElementById('artilleryMaterialCost').textContent = (materialCost * quantity).toLocaleString();
  document.getElementById('artilleryTotalPrice').textContent = totalPrice.toLocaleString();
  
  // Show results
  document.getElementById('artilleryResults').style.display = 'block';
  
  window.currentArtilleryPrice = totalPrice;
}

// Payment function for artillery
function payForArtillery() {
  if (!window.currentArtilleryPrice || window.currentArtilleryPrice <= 0) {
    alert('Please enter valid artillery parameters');
    return;
  }
  
  const kingdom = kingdoms[name];
  const storage = kingdom.storage || {};
  const totalPrice = window.currentArtilleryPrice;
  
  if ((storage.coins || 0) < totalPrice) {
    alert(`Insufficient funds! You need ${totalPrice.toLocaleString()} coins but only have ${(storage.coins || 0).toLocaleString()}.`);
    return;
  }
  
  if (confirm(`Pay ${totalPrice.toLocaleString()} coins for artillery?`)) {
    // Deduct cost from kingdom storage
    if (!kingdom.storage) kingdom.storage = {};
    kingdom.storage.coins = (kingdom.storage.coins || 0) - totalPrice;
    
    // Save changes
    localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
    
    alert(`Payment successful! ${totalPrice.toLocaleString()} coins deducted. Remaining balance: ${kingdom.storage.coins.toLocaleString()} coins.`);
  }
}
globalThis.payForArtillery = payForArtillery;

// Add event listeners for artillery calculator
document.getElementById('calculateArtilleryBtn').addEventListener('click', calculateArtilleryTotalPrice);

// Auto-calculate on input change if results are already visible
['artilleryPowerInput', 'artilleryLifetimeInput', 'artillerySizeInput', 'artilleryQuantityInput'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    if (document.getElementById('artilleryResults').style.display !== 'none') {
      calculateArtilleryTotalPrice();
    }
  });
});

// Remove initial artillery calculation
// calculateArtilleryTotalPrice();