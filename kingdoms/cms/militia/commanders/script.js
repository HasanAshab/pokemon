import pokemons from '../../../../data/pokemons.js'

const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const commandersContainer = document.getElementById("commandersContainer");
const addCommanderBtn = document.getElementById("addCommanderBtn");

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
filterButtons.style.display = "flex";
filterButtons.style.gap = "10px";

let currentFilter = 'all';

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

document.body.insertBefore(landAreaContainer, commandersContainer);
document.body.insertBefore(filterContainer, commandersContainer);


let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].commanders) kingdoms[name].commanders = {};
if (!kingdoms[name].directionCommanders) kingdoms[name].directionCommanders = {};
if (!kingdoms[name].landArea) kingdoms[name].landArea = 800; // Default land area


function save() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderCommanders();
  updateLandAreaInput();
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

function getCommanderDirections(commanderName) {
  return directions.filter(dir => kingdoms[name].directionCommanders[dir] === commanderName);
}

function getCommandedArea(commanderName) {
  const directionCount = getCommanderDirections(commanderName).length;
  return (kingdoms[name].landArea / 8) * directionCount;
}

function renderCommanders() {
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

    // Direction assignment section
    const directionContainer = document.createElement("div");
    directionContainer.className = "direction-container";

    const directionLabel = document.createElement("div");
    directionLabel.textContent = "Assigned Directions:";
    directionLabel.style.fontWeight = "bold";
    directionLabel.style.marginTop = "10px";

    // Check if this is an attacker commander
    const isAttacker = commanderType === 'attacker';

    if (isAttacker) {
      // Remove any existing direction assignments for attackers
      directions.forEach(dir => {
        if (kingdoms[name].directionCommanders[dir] === commanderName) {
          delete kingdoms[name].directionCommanders[dir];
        }
      });

      const attackerNotice = document.createElement("div");
      attackerNotice.textContent = "Attackers cannot be assigned to directions (Mobile Unit)";
      attackerNotice.style.color = "#DC2626";
      attackerNotice.style.fontStyle = "italic";
      attackerNotice.style.marginTop = "5px";
      directionContainer.appendChild(directionLabel);
      directionContainer.appendChild(attackerNotice);
    } else {
      const directionGrid = document.createElement("div");
      directionGrid.className = "direction-grid";
      directionGrid.style.display = "grid";
      directionGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
      directionGrid.style.gap = "5px";
      directionGrid.style.marginTop = "5px";

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

      directionContainer.appendChild(directionLabel);
      directionContainer.appendChild(directionGrid);
    }

    const commandedDirections = getCommanderDirections(commanderName);
    const commandedArea = getCommandedArea(commanderName);

    const statsDiv = document.createElement("div");
    statsDiv.className = "commander-stats";
    statsDiv.style.marginTop = "10px";
    statsDiv.style.fontSize = "0.9em";

    if (isAttacker) {
      statsDiv.innerHTML = `
        <div><strong>Type:</strong> <span style="color: ${typeColors[commanderType]}">${commanderType.toUpperCase()}</span></div>
        <div><strong>Role:</strong> Mobile Strike Force</div>
        <div><strong>Area Commanded:</strong> N/A (Mobile Unit)</div>
      `;
    } else {
      statsDiv.innerHTML = `
        <div><strong>Type:</strong> <span style="color: ${typeColors[commanderType]}">${commanderType.toUpperCase()}</span></div>
        <div><strong>Directions:</strong> ${commandedDirections.join(', ') || 'None'}</div>
        <div><strong>Area Commanded:</strong> ${commandedArea.toFixed(1)} sq. km</div>
      `;
    }

    directionContainer.appendChild(statsDiv);

    const iqContainer = document.createElement("div");
    iqContainer.className = "iq-container";
    const renderIQFields = () => {
      iqContainer.innerHTML = "";
      Object.entries(commanderData.iq).forEach(([key, value]) => {
        const row = document.createElement("div");
        row.className = "iq-entry";

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
    card.appendChild(directionContainer);
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
renderCommanders();
