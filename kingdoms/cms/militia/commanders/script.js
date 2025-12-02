import pokemons from '../../../../data/pokemons.js'
import { getCommandedArea, getCommanderDirections, getEffectiveDefensiveIQ } from '../../../utils.js';

// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("name");
})();
const commandersContainer = document.getElementById("commandersContainer");
const addCommanderBtn = document.getElementById("addCommanderBtn");

// Add mobile responsive styles
const style = document.createElement('style');
style.textContent = `
  @media (max-width: 768px) {
    .commander-card {
      margin-bottom: 15px !important;
    }
    
    .direction-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }
    
    .direction-btn {
      padding: 8px 4px !important;
      font-size: 0.8em !important;
    }
    
    input, select {
      width: 100% !important;
      margin-bottom: 8px !important;
      box-sizing: border-box !important;
    }
    
    .iq-entry {
      flex-direction: column !important;
      gap: 5px !important;
    }
    
    .iq-entry input {
      margin-bottom: 5px !important;
    }
    
    .filter-buttons {
      flex-wrap: wrap !important;
      gap: 8px !important;
    }
    
    .filter-buttons button {
      flex: 1 1 calc(50% - 4px) !important;
      min-width: 120px !important;
    }
    
    .unassigned-directions {
      flex-wrap: wrap !important;
    }
  }
  
  @media (max-width: 480px) {
    .direction-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    
    .filter-buttons button {
      flex: 1 1 100% !important;
      margin-bottom: 5px !important;
    }
    
    body {
      padding: 10px !important;
    }
    
    .commander-card {
      padding: 10px !important;
    }
  }
`;
document.head.appendChild(style);

// Add land area control
const landAreaContainer = document.createElement("div");
landAreaContainer.style.marginBottom = "20px";
landAreaContainer.style.padding = "10px";
landAreaContainer.style.border = "1px solid #ccc";
landAreaContainer.style.borderRadius = "5px";

const landAreaLabel = document.createElement("label");
landAreaLabel.textContent = "Total Land Area: ";
landAreaLabel.style.fontWeight = "bold";

const landAreaInput = document.createElement("input");
landAreaInput.disabled = true;
landAreaInput.type = "number";
landAreaInput.placeholder = "Land area";
landAreaInput.style.marginLeft = "10px";

landAreaContainer.appendChild(landAreaLabel);
landAreaContainer.appendChild(landAreaInput);

// Add filter controls
const filterContainer = document.createElement("div");
filterContainer.style.marginBottom = "20px";
filterContainer.style.padding = "10px";
filterContainer.style.border = "1px solid #ccc";
filterContainer.style.borderRadius = "5px";

const filterLabel = document.createElement("div");
filterLabel.textContent = "Filter by Type:";
filterLabel.style.fontWeight = "bold";
filterLabel.style.marginBottom = "10px";

const filterButtons = document.createElement("div");
filterButtons.className = "filter-buttons";
filterButtons.style.display = "flex";
filterButtons.style.gap = "10px";

let currentFilter = 'all';
let openDetailsState = {}; // Track which details elements are open

const filters = [
  { key: 'all', label: 'All', color: '#6B7280' },
  { key: 'attacker', label: 'Attackers', color: '#DC2626' },
  { key: 'defender', label: 'Defenders', color: '#2563EB' },
  { key: 'generalist', label: 'Generalists', color: '#F59E0B' }
];

filters.forEach(filter => {
  const btn = document.createElement("button");
  btn.textContent = filter.label;
  btn.style.padding = "8px 16px";
  btn.style.border = "2px solid " + filter.color;
  btn.style.borderRadius = "5px";
  btn.style.cursor = "pointer";
  btn.style.fontWeight = "bold";

  const updateButtonStyle = () => {
    if (currentFilter === filter.key) {
      btn.style.backgroundColor = filter.color;
      btn.style.color = "white";
    } else {
      btn.style.backgroundColor = "white";
      btn.style.color = filter.color;
    }
  };

  btn.onclick = () => {
    currentFilter = filter.key;
    filters.forEach(f => {
      const filterBtn = filterButtons.children[filters.indexOf(f)];
      if (f.key === filter.key) {
        filterBtn.style.backgroundColor = f.color;
        filterBtn.style.color = "white";
      } else {
        filterBtn.style.backgroundColor = "white";
        filterBtn.style.color = f.color;
      }
    });
    renderCommanders();
  };

  updateButtonStyle();
  filterButtons.appendChild(btn);
});

filterContainer.appendChild(filterLabel);
filterContainer.appendChild(filterButtons);

// Add unassigned directions display
const unassignedContainer = document.createElement("div");
unassignedContainer.style.marginBottom = "20px";
unassignedContainer.style.padding = "10px";
unassignedContainer.style.border = "1px solid #ccc";
unassignedContainer.style.borderRadius = "5px";

document.body.insertBefore(landAreaContainer, commandersContainer);
document.body.insertBefore(filterContainer, commandersContainer);
document.body.insertBefore(unassignedContainer, commandersContainer);


let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].commanders) kingdoms[name].commanders = {};
if (!kingdoms[name].directionCommanders) kingdoms[name].directionCommanders = {};
if (!kingdoms[name].landArea) kingdoms[name].landArea = 800; // Default land area


function updateUnassignedDirections() {
  const assignedDirections = Object.keys(kingdoms[name].directionCommanders);
  const unassignedDirections = directions.filter(dir => !assignedDirections.includes(dir));
  
  unassignedContainer.innerHTML = "";
  
  const titleDiv = document.createElement("div");
  titleDiv.textContent = "Unassigned Directions";
  titleDiv.style.fontWeight = "bold";
  titleDiv.style.marginBottom = "10px";
  
  if (unassignedDirections.length === 0) {
    const statusDiv = document.createElement("div");
    statusDiv.textContent = "✅ All directions have commanders assigned";
    statusDiv.style.color = "#10B981";
    statusDiv.style.fontStyle = "italic";
    
    unassignedContainer.appendChild(titleDiv);
    unassignedContainer.appendChild(statusDiv);
  } else {
    const warningDiv = document.createElement("div");
    warningDiv.textContent = `⚠️ ${unassignedDirections.length} direction(s) need commanders:`;
    warningDiv.style.color = "#DC2626";
    warningDiv.style.marginBottom = "10px";
    
    const directionsGrid = document.createElement("div");
    directionsGrid.className = "unassigned-directions";
    directionsGrid.style.display = "flex";
    directionsGrid.style.gap = "8px";
    directionsGrid.style.flexWrap = "wrap";
    
    unassignedDirections.forEach(dir => {
      const dirBadge = document.createElement("span");
      dirBadge.textContent = dir;
      dirBadge.style.backgroundColor = "#FEE2E2";
      dirBadge.style.color = "#DC2626";
      dirBadge.style.padding = "4px 8px";
      dirBadge.style.borderRadius = "4px";
      dirBadge.style.fontSize = "0.9em";
      dirBadge.style.fontWeight = "bold";
      dirBadge.style.border = "1px solid #FECACA";
      
      directionsGrid.appendChild(dirBadge);
    });
    
    unassignedContainer.appendChild(titleDiv);
    unassignedContainer.appendChild(warningDiv);
    unassignedContainer.appendChild(directionsGrid);
  }
}

function save() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderCommanders();
  updateLandAreaInput();
  updateUnassignedDirections();
}

function updateLandAreaInput() {
  landAreaInput.value = kingdoms[name].landArea || 800;
}

landAreaInput.onblur = () => {
  kingdoms[name].landArea = parseFloat(landAreaInput.value) || 800;
  save();
};

const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function getCommanderType(iq) {
  const offensiveTraits = ['offensive'];
  const defensiveTraits = ['defensive'];

  // Check if commander has any IQ traits at all
  const traitKeys = Object.keys(iq);
  if (traitKeys.length === 0) return 'generalist';

  const hasOffensive = traitKeys.some(trait =>
    offensiveTraits.some(off => trait.toLowerCase().includes(off))
  );
  const hasDefensive = traitKeys.some(trait =>
    defensiveTraits.some(def => trait.toLowerCase().includes(def))
  );

  if (hasOffensive && hasDefensive) return 'generalist';
  if (hasOffensive) return 'attacker';
  if (hasDefensive) return 'defender';
  return 'generalist';
}

function calculateEffectiveDefensiveIQ(commanderData, commandedArea) {
  const commanderType = getCommanderType(commanderData.iq);
  if (commanderType !== 'defender') return null;
  
  // Get defensive IQ traits
  const defensiveTraits = ['defensive'];
  let totalDefensiveIQ = 0;
  let defensiveTraitCount = 0;
  
  Object.entries(commanderData.iq).forEach(([trait, value]) => {
    if (defensiveTraits.some(def => trait.toLowerCase().includes(def))) {
      totalDefensiveIQ += parseFloat(value) || 0;
      defensiveTraitCount++;
    }
  });
  
  if (defensiveTraitCount === 0) return null;
  
  const averageDefensiveIQ = totalDefensiveIQ / defensiveTraitCount;
  const effectiveIQ = getEffectiveDefensiveIQ(averageDefensiveIQ, commandedArea);
  return {
    original: averageDefensiveIQ,
    penalty: averageDefensiveIQ - effectiveIQ,
    effective: effectiveIQ
  };
}

function renderCommanders() {
  // Save current state of open details before clearing
  const currentDetails = commandersContainer.querySelectorAll('details[open]');
  currentDetails.forEach(details => {
    const commanderCard = details.closest('.commander-card');
    if (commanderCard) {
      const nameInput = commanderCard.querySelector('input[type="text"]');
      if (nameInput) {
        openDetailsState[nameInput.value] = true;
      }
    }
  });

  commandersContainer.innerHTML = "";
  const commanders = kingdoms[name].commanders;

  // Filter commanders based on current filter
  const filteredCommanders = Object.entries(commanders).filter(([commanderName, commanderData]) => {
    if (currentFilter === 'all') return true;
    const commanderType = getCommanderType(commanderData.iq);
    return commanderType === currentFilter;
  });

  // Show filter status
  const statusDiv = document.createElement("div");
  statusDiv.style.marginBottom = "15px";
  statusDiv.style.fontStyle = "italic";
  statusDiv.style.color = "#6B7280";
  statusDiv.textContent = `Showing ${filteredCommanders.length} of ${Object.keys(commanders).length} commanders`;
  commandersContainer.appendChild(statusDiv);

  filteredCommanders.forEach(([commanderName, commanderData]) => {
    const commanderType = getCommanderType(commanderData.iq);
    const typeColors = {
      attacker: '#DC2626',
      defender: '#2563EB',
      generalist: '#F59E0B'
    };

    const card = document.createElement("div");
    card.className = "commander-card";
    card.style.borderLeft = `4px solid ${typeColors[commanderType]}`;

    const nameInput = document.createElement("input");
    nameInput.value = commanderName;
    nameInput.onblur = () => {
      const newName = nameInput.value.trim();
      if (newName && newName !== commanderName) {
        // Update direction assignments
        directions.forEach(dir => {
          if (kingdoms[name].directionCommanders[dir] === commanderName) {
            kingdoms[name].directionCommanders[dir] = newName;
          }
        });
        kingdoms[name].commanders[newName] = commanderData;
        delete kingdoms[name].commanders[commanderName];
        save();
      }
    };

    // Add inside Object.entries loop after imageSelect
    const salaryInput = document.createElement("input");
    salaryInput.type = "number";
    salaryInput.placeholder = "Salary (coins)";
    salaryInput.value = commanderData.salary ?? 0;
    salaryInput.onblur = () => {
      commanderData.salary = parseFloat(salaryInput.value) || 0;
      save();
    };

    const imageSelect = document.createElement("select");
    Object.keys(pokemons).forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (commanderData.image === opt) option.selected = true;
      imageSelect.appendChild(option);
    });
    imageSelect.onblur = () => {
      commanderData.image = imageSelect.value;
      save();
    };

    // Check if this is an attacker commander
    const isAttacker = commanderType === 'attacker';

    // Basic stats (always shown)
    const basicStatsDiv = document.createElement("div");
    basicStatsDiv.className = "commander-stats";
    basicStatsDiv.style.marginTop = "10px";
    basicStatsDiv.style.fontSize = "0.9em";
    basicStatsDiv.innerHTML = `
      <div><strong>Type:</strong> <span style="color: ${typeColors[commanderType]}">${commanderType.toUpperCase()}</span></div>
    `;

    // Direction assignment section (only for non-attackers)
    let directionContainer = null;
    let directionStatsDiv = null;

    if (!isAttacker) {
      const commandedDirections = getCommanderDirections(kingdoms[name], commanderName);
      const commandedArea = getCommandedArea(kingdoms[name], commanderName);
      const effectiveDefIQ = calculateEffectiveDefensiveIQ(commanderData, commandedArea);

      // Always visible direction stats
      directionStatsDiv = document.createElement("div");
      directionStatsDiv.style.marginTop = "5px";
      directionStatsDiv.style.fontSize = "0.9em";
      
      let statsHTML = `
        <div><strong>Directions:</strong> ${commandedDirections.join(', ') || 'None'}</div>
        <div><strong>Area Commanding:</strong> ${commandedArea.toFixed(1)} sq. km</div>
      `;
      
      // Add defensive IQ penalty info for defenders
      if (effectiveDefIQ && commandedArea > 0) {
        statsHTML += `
          <div><strong>Defensive IQ:</strong> 
            <span style="color: #6B7280; text-decoration: line-through">${effectiveDefIQ.original.toFixed(1)}</span>
            ${effectiveDefIQ.penalty > 0 ? 
              `<span style="color: #DC2626;"> → ${effectiveDefIQ.effective}</span>` : 
              ''
            }
          </div>
        `;
      }
      
      directionStatsDiv.innerHTML = statsHTML;

      // Create collapsible details element for assignment controls
      const detailsElement = document.createElement("details");
      detailsElement.style.marginTop = "10px";

      // Restore open state if it was previously open
      if (openDetailsState[commanderName]) {
        detailsElement.open = true;
      }

      const summaryElement = document.createElement("summary");
      summaryElement.textContent = `Direction Assignment Controls`;
      summaryElement.style.fontWeight = "bold";
      summaryElement.style.cursor = "pointer";
      summaryElement.style.marginBottom = "10px";

      // Track state changes
      detailsElement.addEventListener('toggle', () => {
        if (detailsElement.open) {
          openDetailsState[commanderName] = true;
        } else {
          delete openDetailsState[commanderName];
        }
      });

      const directionGrid = document.createElement("div");
      directionGrid.className = "direction-grid";
      directionGrid.style.display = "grid";
      directionGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
      directionGrid.style.gap = "5px";
      directionGrid.style.marginTop = "10px";

      directions.forEach(dir => {
        const dirBtn = document.createElement("button");
        dirBtn.textContent = dir;
        dirBtn.className = "direction-btn";

        const isAssigned = kingdoms[name].directionCommanders[dir] === commanderName;
        const isOccupied = kingdoms[name].directionCommanders[dir] && kingdoms[name].directionCommanders[dir] !== commanderName;

        if (isAssigned) {
          dirBtn.style.backgroundColor = "#10B981";
          dirBtn.style.color = "white";
        } else if (isOccupied) {
          dirBtn.style.backgroundColor = "#EF4444";
          dirBtn.style.color = "white";
          dirBtn.disabled = true;
          dirBtn.title = `Assigned to ${kingdoms[name].directionCommanders[dir]}`;
        } else {
          dirBtn.style.backgroundColor = "#E5E7EB";
        }

        dirBtn.onclick = () => {
          if (isAssigned) {
            delete kingdoms[name].directionCommanders[dir];
          } else if (!isOccupied) {
            kingdoms[name].directionCommanders[dir] = commanderName;
          }
          save();
        };

        directionGrid.appendChild(dirBtn);
      });

      detailsElement.appendChild(summaryElement);
      detailsElement.appendChild(directionGrid);

      directionContainer = detailsElement;
    } else {
      // Remove any existing direction assignments for attackers
      directions.forEach(dir => {
        if (kingdoms[name].directionCommanders[dir] === commanderName) {
          delete kingdoms[name].directionCommanders[dir];
        }
      });
    }

    const iqContainer = document.createElement("div");
    iqContainer.className = "iq-container";
    const renderIQFields = () => {
      iqContainer.innerHTML = "";
      Object.entries(commanderData.iq).forEach(([key, value]) => {
        const row = document.createElement("div");
        row.className = "iq-entry";
        row.style.display = "flex";
        row.style.gap = "5px";
        row.style.alignItems = "center";
        row.style.marginBottom = "5px";

        const keyInput = document.createElement("input");
        keyInput.setAttribute("list", "traits");
        keyInput.value = key;
        keyInput.placeholder = "Trait";
        keyInput.onblur = () => {
          const newKey = keyInput.value.trim();
          if (newKey && newKey !== key) {
            commanderData.iq[newKey] = commanderData.iq[key];
            delete commanderData.iq[key];
            save();
            renderIQFields(); // re-render to bind new listeners
          }
        };

        const valInput = document.createElement("input");
        valInput.type = "number";
        valInput.step = "0.1";
        valInput.value = value;
        valInput.placeholder = "Value";
        valInput.onblur = () => {
          commanderData.iq[keyInput.value.trim()] = parseFloat(valInput.value) || 0;
          save();
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "−";
        delBtn.onclick = () => {
          delete commanderData.iq[key];
          save();
          renderIQFields();
        };

        row.appendChild(keyInput);
        row.appendChild(valInput);
        row.appendChild(delBtn);
        iqContainer.appendChild(row);
      });

      const addBtn = document.createElement("button");
      addBtn.textContent = "+ Add IQ Field";
      addBtn.onclick = () => {
        commanderData.iq[""] = 0;
        renderIQFields();
      };
      iqContainer.appendChild(addBtn);
    };
    renderIQFields();

    const jsonEditor = document.createElement("textarea");
    jsonEditor.style.display = "none";
    jsonEditor.className = "json-editor";

    jsonEditor.value = JSON.stringify(commanderData, null, 2);
    jsonEditor.onblur = () => {
      try {
        const parsed = JSON.parse(jsonEditor.value);
        kingdoms[name].commanders[commanderName] = parsed;
        save();
      } catch {
        alert("Invalid JSON");
      }
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      // Remove direction assignments when deleting commander
      directions.forEach(dir => {
        if (kingdoms[name].directionCommanders[dir] === commanderName) {
          delete kingdoms[name].directionCommanders[dir];
        }
      });
      delete kingdoms[name].commanders[commanderName];
      save();
    };

    card.appendChild(nameInput);
    card.appendChild(imageSelect);
    card.appendChild(salaryInput);
    card.appendChild(basicStatsDiv);
    if (directionStatsDiv) {
      card.appendChild(directionStatsDiv);
    }
    if (directionContainer) {
      card.appendChild(directionContainer);
    }
    card.appendChild(iqContainer);
    card.appendChild(jsonEditor);
    card.appendChild(delBtn);

    commandersContainer.appendChild(card);
  });
}

addCommanderBtn.onclick = () => {
  const newCommanderName = prompt("Commander name?");
  if (!newCommanderName) return;
  kingdoms[name].commanders[newCommanderName] = { iq: {}, salary: 0, image: "student" };
  save();
};

updateLandAreaInput();
updateUnassignedDirections();
renderCommanders();
