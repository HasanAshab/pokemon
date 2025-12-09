import { DISASTERS } from './constraints.js';

const kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");

const container = document.getElementById("cardContainer");

Object.keys(kingdoms).forEach((name) => {
  const card = document.createElement("div");
  card.className = "card";

  const label = document.createElement("div");
  label.textContent = name;
  label.className = "card-name";

  // Create 3-dot menu container
  const menuContainer = document.createElement("div");
  menuContainer.className = "menu-container";

  // Create 3-dot button
  const moreBtn = document.createElement("button");
  moreBtn.className = "more-btn";
  moreBtn.innerHTML = `
    <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <g id="Menu / More_Grid_Big">
          <g id="Vector">
            <path d="M17 18C17 18.5523 17.4477 19 18 19C18.5523 19 19 18.5523 19 18C19 17.4477 18.5523 17 18 17C17.4477 17 17 17.4477 17 18Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M11 18C11 18.5523 11.4477 19 12 19C12.5523 19 13 18.5523 13 18C13 17.4477 12.5523 17 12 17C11.4477 17 11 17.4477 11 18Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M5 18C5 18.5523 5.44772 19 6 19C6.55228 19 7 18.5523 7 18C7 17.4477 6.55228 17 6 17C5.44772 17 5 17.4477 5 18Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M17 12C17 12.5523 17.4477 13 18 13C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M5 12C5 12.5523 5.44772 13 6 13C6.55228 13 7 12.5523 7 12C7 11.4477 6.55228 11 6 11C5.44772 11 5 11.4477 5 12Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5C17.4477 5 17 5.44772 17 6Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M11 6C11 6.55228 11.4477 7 12 7C12.5523 7 13 6.55228 13 6C13 5.44772 12.5523 5 12 5C11.4477 5 11 5.44772 11 6Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M5 6C5 6.55228 5.44772 7 6 7C6.55228 7 7 6.55228 7 6C7 5.44772 6.55228 5 6 5C5.44772 5 5 5.44772 5 6Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          </g>
        </g>
      </g>
    </svg>
  `;
  moreBtn.onclick = (e) => {
    e.stopPropagation();
    moreBtn.classList.toggle('active');
  };

  // Create dropdown menu
  const dropdownMenu = document.createElement("div");
  dropdownMenu.className = "dropdown-menu";

  // Create rename button
  const renameBtn = document.createElement("button");
  renameBtn.textContent = "Rename";
  renameBtn.onclick = (e) => {
    e.stopPropagation();
    renameKingdom(name);
  };

  // Create duplicate button
  const duplicateBtn = document.createElement("button");
  duplicateBtn.textContent = "Duplicate";
  duplicateBtn.onclick = (e) => {
    e.stopPropagation();
    duplicateKingdom(name);
  };

  // Create war toggle button
  const warToggleBtn = document.createElement("button");
  warToggleBtn.textContent = kingdoms[name].underWar ? "End War" : "Start War";
  warToggleBtn.className = kingdoms[name].underWar ? "war-end-option" : "war-start-option";
  warToggleBtn.onclick = (e) => {
    e.stopPropagation();
    toggleWarState(name);
  };

  // Create remove button
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.className = "remove-option";
  removeBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm(`Delete kingdom "${name}"?`)) {
      delete kingdoms[name];
      localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
      location.reload();
    }
  };

  // Assemble the menu
  dropdownMenu.appendChild(renameBtn);
  dropdownMenu.appendChild(duplicateBtn);
  dropdownMenu.appendChild(warToggleBtn);
  dropdownMenu.appendChild(removeBtn);
  menuContainer.appendChild(moreBtn);
  menuContainer.appendChild(dropdownMenu);

  // Add war state visual indicator
  if (kingdoms[name].underWar) {
    card.classList.add('under-war');
    const warIndicator = document.createElement("div");
    warIndicator.className = "war-indicator";
    warIndicator.textContent = "⚔️ AT WAR";
    card.appendChild(warIndicator);
  }

  card.appendChild(label);
  card.appendChild(menuContainer);

  card.onclick = () => {
    // Import navigation utility dynamically
    import('../assets/js/utils/navigation.js').then(({ Navigation }) => {
      Navigation.goToKingdom(name);
    });
  };

  container.appendChild(card);
});

// Draw connection lines between connected kingdoms
drawConnectionLines();

// Close dropdown menus when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-container')) {
    document.querySelectorAll('.more-btn.active').forEach(btn => {
      btn.classList.remove('active');
    });
  }
});

document.getElementById("addKingdomBtn").onclick = () => {
  const name = prompt("Enter new kingdom name:");
  if (!name) return;

  if (kingdoms[name]) {
    alert("Kingdom already exists.");
    return;
  }

  kingdoms[name] = {
    id: name,
    landArea: 1000,
    density: 100,
    pci: 50,
    taxRate: 0.3,
    buildings: [],
    storage: {},
    underWar: false,
    closerKingdoms: [],
    disaster: {
      current: [],
      geoState: generateRandomGeoState()
    }
  };

  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  location.reload();
};

// Kingdom Rename Function
function renameKingdom(oldName) {
  const kingdom = kingdoms[oldName];

  if (!kingdom) {
    alert("Kingdom not found!");
    return;
  }

  // Prompt for new name
  const newName = prompt(`Enter new name for "${oldName}":`, oldName);

  if (!newName) {
    return; // User cancelled
  }

  if (newName === oldName) {
    return; // No change needed
  }

  // Check if new name already exists
  if (kingdoms[newName]) {
    alert(`Kingdom "${newName}" already exists. Please choose a different name.`);
    return;
  }

  // Validate name (basic validation)
  if (newName.trim().length === 0) {
    alert("Kingdom name cannot be empty.");
    return;
  }

  if (newName.length > 50) {
    alert("Kingdom name is too long. Please use 50 characters or less.");
    return;
  }

  // Update the kingdom data
  const updatedKingdom = { ...kingdom };
  updatedKingdom.id = newName;

  // Remove old kingdom and add with new name
  delete kingdoms[oldName];
  kingdoms[newName] = updatedKingdom;

  // Save to localStorage
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));

  // Reload the page to reflect changes
  location.reload();
}

// Kingdom War Toggle Function
function toggleWarState(kingdomName) {
  const kingdom = kingdoms[kingdomName];

  if (!kingdom) {
    alert("Kingdom not found!");
    return;
  }

  // Toggle war state
  kingdom.underWar = !kingdom.underWar;

  // Save to localStorage
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));

  // Reload the page to reflect changes
  location.reload();
}

// Kingdom Duplication Function
function duplicateKingdom(originalName) {
  const originalKingdom = kingdoms[originalName];

  if (!originalKingdom) {
    alert("Kingdom not found!");
    return;
  }

  // Create a new name for the duplicate
  let duplicateName = originalName + "_copy";
  let counter = 1;

  // Ensure unique name
  while (kingdoms[duplicateName]) {
    duplicateName = originalName + "_copy" + counter;
    counter++;
  }

  // Create a deep copy of the original kingdom
  const duplicateKingdom = JSON.parse(JSON.stringify(originalKingdom));

  // Update the ID to match the new name
  duplicateKingdom.id = duplicateName;

  // Reset closerKingdoms for the duplicate (they should be set manually)
  duplicateKingdom.closerKingdoms = [];

  // // Add some variation to make it interesting
  // // Slightly randomize some stats (±10%)
  // const variation = 0.1;
  // duplicateKingdom.landArea = Math.floor(duplicateKingdom.landArea * (1 + (Math.random() - 0.5) * variation));
  // duplicateKingdom.density = Math.floor(duplicateKingdom.density * (1 + (Math.random() - 0.5) * variation));
  // duplicateKingdom.pci = Math.floor(duplicateKingdom.pci * (1 + (Math.random() - 0.5) * variation));

  // // Ensure minimum values
  // duplicateKingdom.landArea = Math.max(500, duplicateKingdom.landArea);
  // duplicateKingdom.density = Math.max(50, duplicateKingdom.density);
  // duplicateKingdom.pci = Math.max(25, duplicateKingdom.pci);

  // Add the duplicate to the kingdoms
  kingdoms[duplicateName] = duplicateKingdom;
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));

  // Reload the page to show the new kingdom
  location.reload();
}

// Disaster System Functions
function generateRandomGeoState() {
  const states = ['normal', 'prone', 'immune'];
  const geoState = {};

  Object.keys(DISASTERS).forEach(disaster => {
    geoState[disaster] = states[Math.floor(Math.random() * states.length)];
  });

  return geoState;
}

function getDisasterChance(disaster, geoState, isRelated = false) {
  const state = geoState[disaster];

  if (state === 'immune') return 0;

  if (isRelated) {
    return state === 'prone' ? 15 : 7; // related prone: 15%, related normal: 7%
  } else {
    return state === 'prone' ? 5 : 2; // prone: 5%, normal: 2%
  }
}

function generateDisasterPower() {
  const rand = Math.random() * 100;

  // Power distribution: 4-6 (60%), 1-3 (30%), 7-10 (10%)
  if (rand < 60) {
    return Math.floor(Math.random() * 3) + 4; // 4, 5, 6
  } else if (rand < 90) {
    return Math.floor(Math.random() * 3) + 1; // 1, 2, 3
  } else {
    return Math.floor(Math.random() * 4) + 7; // 7, 8, 9, 10
  }
}

function simulateDisasters(kingdomName) {
  const kingdom = kingdoms[kingdomName];
  if (!kingdom.disaster) {
    kingdom.disaster = {
      current: [],
      geoState: generateRandomGeoState()
    };
  }

  // Clear current disasters
  kingdom.disaster.current = [];

  // Shuffle disasters for random order
  const disasterNames = Object.keys(DISASTERS);
  const shuffledDisasters = [...disasterNames].sort(() => Math.random() - 0.5);

  let primaryDisaster = null;
  let primaryPower = 0;

  // Loop through shuffled disasters to find if one occurs
  for (const disaster of shuffledDisasters) {
    const chance = getDisasterChance(disaster, kingdom.disaster.geoState);
    const roll = Math.random() * 100;

    if (roll < chance) {
      primaryDisaster = disaster;
      primaryPower = generateDisasterPower();

      // Increase power if kingdom is prone to this disaster
      if (kingdom.disaster.geoState[disaster] === 'prone') {
        primaryPower = Math.min(10, primaryPower + 2);
      }

      // Add primary disaster to array
      kingdom.disaster.current.push({
        name: disaster,
        power: primaryPower,
        source: "nature"
      });
      break; // Stop after first disaster occurs
    }
  }

  // If a primary disaster occurred, check for related disasters
  if (primaryDisaster) {
    const relatedDisasters = DISASTERS[primaryDisaster].related;

    for (const relatedDisaster of relatedDisasters) {
      const chance = getDisasterChance(relatedDisaster, kingdom.disaster.geoState, true);
      const roll = Math.random() * 100;

      if (roll < chance) {
        const relatedPower = Math.max(1, Math.round(primaryPower / 2));
        kingdom.disaster.current.push({
          name: relatedDisaster,
          power: relatedPower,
          source: "nature"
        });
      }
    }
  }

  // Propagate disasters to nearby kingdoms
  if (primaryDisaster) {
    propagateDisastersToNearbyKingdoms(kingdomName, primaryDisaster, primaryPower);
  }

  // Save to localStorage
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
}

function propagateDisastersToNearbyKingdoms(sourceKingdom, disaster, power, visitedKingdoms = new Set(), sourceChain = "nature") {
  // Prevent infinite loops
  if (visitedKingdoms.has(sourceKingdom)) {
    return;
  }
  visitedKingdoms.add(sourceKingdom);

  const kingdom = kingdoms[sourceKingdom];

  // Check if kingdom has closer kingdoms defined
  if (!kingdom.closerKingdoms || kingdom.closerKingdoms.length === 0) {
    return;
  }

  // Propagate to each closer kingdom
  kingdom.closerKingdoms.forEach(nearbyKingdomName => {
    if (!kingdoms[nearbyKingdomName]) return; // Skip if kingdom doesn't exist
    if (visitedKingdoms.has(nearbyKingdomName)) return; // Skip if already visited

    const nearbyKingdom = kingdoms[nearbyKingdomName];

    // Initialize disaster data if not present
    if (!nearbyKingdom.disaster) {
      nearbyKingdom.disaster = {
        current: [],
        geoState: generateRandomGeoState()
      };
    }

    // Skip if nearby kingdom is immune to this disaster
    if (nearbyKingdom.disaster.geoState[disaster] === 'immune') {
      return;
    }

    // 50% chance for disaster to propagate
    const propagationChance = 50;
    const roll = Math.random() * 100;

    if (roll < propagationChance) {
      // Calculate reduced power (60% of original, rounded)
      const reducedPower = Math.max(1, Math.round(power * 0.6));

      // Check if disaster already exists with higher power
      const existingDisaster = nearbyKingdom.disaster.current.find(d => d.name === disaster);
      if (!existingDisaster || existingDisaster.power < reducedPower) {
        // Remove existing weaker disaster if present
        if (existingDisaster) {
          const index = nearbyKingdom.disaster.current.indexOf(existingDisaster);
          nearbyKingdom.disaster.current.splice(index, 1);
        }

        // Add new disaster
        nearbyKingdom.disaster.current.push({
          name: disaster,
          power: reducedPower,
          source: sourceKingdom
        });

        // Check for related disasters in the nearby kingdom
        const relatedDisasters = DISASTERS[disaster].related;

        for (const relatedDisaster of relatedDisasters) {
          const relatedChance = getDisasterChance(relatedDisaster, nearbyKingdom.disaster.geoState, true);
          const relatedRoll = Math.random() * 100;

          if (relatedRoll < relatedChance) {
            const relatedPower = Math.max(1, Math.round(reducedPower / 2));

            // Check if related disaster already exists
            const existingRelated = nearbyKingdom.disaster.current.find(d => d.name === relatedDisaster);
            if (!existingRelated || existingRelated.power < relatedPower) {
              // Remove existing weaker related disaster if present
              if (existingRelated) {
                const index = nearbyKingdom.disaster.current.indexOf(existingRelated);
                nearbyKingdom.disaster.current.splice(index, 1);
              }

              // Add related disaster
              nearbyKingdom.disaster.current.push({
                name: relatedDisaster,
                power: relatedPower,
                source: `${disaster}_${sourceKingdom}`
              });
            }
          }
        }

        // Continue propagation to connected kingdoms of connected kingdoms
        propagateDisastersToNearbyKingdoms(
          nearbyKingdomName,
          disaster,
          reducedPower,
          new Set(visitedKingdoms), // Pass copy of visited kingdoms
          sourceKingdom
        );
      }
    }
  });
}

function displayDisasterReport() {
  const reportContent = document.getElementById('disasterContent');
  reportContent.innerHTML = '';

  const kingdomNames = Object.keys(kingdoms);

  if (kingdomNames.length === 0) {
    reportContent.innerHTML = '<p>No kingdoms found. Create some kingdoms first!</p>';
    return;
  }

  // Display current disaster state (persistent)
  kingdomNames.forEach(name => {
    const kingdom = kingdoms[name];
    const kingdomDiv = document.createElement('div');
    kingdomDiv.style.marginBottom = '15px';
    kingdomDiv.style.padding = '10px';
    kingdomDiv.style.border = '1px solid #ccc';
    kingdomDiv.style.borderRadius = '5px';
    kingdomDiv.style.backgroundColor = '#f9f9f9';

    const kingdomTitle = document.createElement('h3');
    kingdomTitle.textContent = `🏰 ${name}`;
    kingdomTitle.style.margin = '0 0 10px 0';
    kingdomTitle.style.color = '#333';
    kingdomDiv.appendChild(kingdomTitle);

    let currentDisasters = kingdom.disaster.current || [];

    if (!Array.isArray(currentDisasters)) {
      currentDisasters = []
    }

    if (currentDisasters.length === 0) {
      const noDisaster = document.createElement('p');
      noDisaster.textContent = '✅ No disasters currently affecting this kingdom';
      noDisaster.style.color = '#28a745';
      noDisaster.style.margin = '0';
      kingdomDiv.appendChild(noDisaster);
    } else {
      // Group disasters by name and combine their powers and sources
      const combinedDisasters = {};

      currentDisasters.forEach(disasterObj => {
        if (!combinedDisasters[disasterObj.name]) {
          combinedDisasters[disasterObj.name] = {
            name: disasterObj.name,
            totalPower: 0,
            sources: []
          };
        }

        combinedDisasters[disasterObj.name].totalPower += disasterObj.power;
        combinedDisasters[disasterObj.name].sources.push({
          source: disasterObj.source,
          power: disasterObj.power
        });
      });

      // Display combined disasters
      Object.values(combinedDisasters).forEach(combinedDisaster => {
        const disasterDiv = document.createElement('div');
        disasterDiv.style.marginBottom = '8px';
        disasterDiv.style.padding = '8px';
        disasterDiv.style.borderLeft = '3px solid';
        disasterDiv.style.backgroundColor = '#f8f9fa';
        disasterDiv.style.borderRadius = '4px';

        const totalPower = Math.min(10, combinedDisaster.totalPower); // Cap at 10
        const powerColor = totalPower >= 7 ? '#dc3545' : totalPower >= 4 ? '#fd7e14' : '#ffc107';
        const powerEmoji = totalPower >= 7 ? '🔴' : totalPower >= 4 ? '🟠' : '🟡';

        // Format sources
        const sourcesText = combinedDisaster.sources.map(sourceObj => {
          let sourceIcon = '';
          let sourceText = '';

          if (sourceObj.source === 'nature') {
            sourceIcon = '🌍';
            sourceText = `Natural (${sourceObj.power})`;
          } else if (sourceObj.source.includes('_')) {
            sourceIcon = '🔗';
            const parts = sourceObj.source.split('_');
            sourceText = `${parts[0]} from ${parts[1]} (${sourceObj.power})`;
          } else {
            sourceIcon = '🏰';
            sourceText = `From ${sourceObj.source} (${sourceObj.power})`;
          }

          return `${sourceIcon} ${sourceText}`;
        }).join(', ');

        disasterDiv.style.borderLeftColor = powerColor;
        disasterDiv.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            <span style="font-weight: bold;">
              ${powerEmoji} <strong>${combinedDisaster.name}</strong> - Total Power: ${totalPower}/10
              ${combinedDisaster.sources.length > 1 ? `<small style="color: #666;"> (${combinedDisaster.sources.length} sources)</small>` : ''}
            </span>
          </div>
          <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">
            <strong>Sources:</strong> ${sourcesText}
          </div>
          <small style="color: #666; font-style: italic;">${DISASTERS[combinedDisaster.name].description}</small>
        `;
        disasterDiv.style.color = powerColor;
        kingdomDiv.appendChild(disasterDiv);
      });
    }

    // Show closer kingdoms info
    if (kingdom.closerKingdoms && kingdom.closerKingdoms.length > 0) {
      const closerKingdomsDiv = document.createElement('div');
      closerKingdomsDiv.style.marginTop = '8px';
      closerKingdomsDiv.style.fontSize = '12px';
      closerKingdomsDiv.style.color = '#666';
      closerKingdomsDiv.innerHTML = `🔗 Connected to: ${kingdom.closerKingdoms.join(', ')}`;
      kingdomDiv.appendChild(closerKingdomsDiv);
    }

    reportContent.appendChild(kingdomDiv);
  });
}

function generateNewDisasters() {
  const kingdomNames = Object.keys(kingdoms);

  if (kingdomNames.length === 0) {
    alert('No kingdoms found. Create some kingdoms first!');
    return;
  }

  // Simulate new disasters for all kingdoms
  kingdomNames.forEach(name => simulateDisasters(name));

  // Refresh the display
  displayDisasterReport();
}


displayDisasterReport();
document.getElementById('disasterReport').style.display = 'block';

document.getElementById('generateNewDisasters').onclick = () => {
  if (confirm('Generate new disasters for all kingdoms? This will replace current disaster states.')) {
    generateNewDisasters();
  }
};

document.getElementById('closeDisasterReport').onclick = () => {
  document.getElementById('disasterReport').style.display = 'none';
};

// Initialize disaster data and war state for existing kingdoms that don't have it
Object.keys(kingdoms).forEach(name => {
  if (!kingdoms[name].disaster) {
    kingdoms[name].disaster = {
      current: [],
      geoState: generateRandomGeoState()
    };
  }

  // Convert old disaster format to new array format
  if (kingdoms[name].disaster.current && !Array.isArray(kingdoms[name].disaster.current)) {
    const oldDisasters = kingdoms[name].disaster.current;
    kingdoms[name].disaster.current = [];

    Object.entries(oldDisasters).forEach(([disasterName, power]) => {
      kingdoms[name].disaster.current.push({
        name: disasterName,
        power: power,
        source: "nature"
      });
    });
  }

  // Initialize underWar property if it doesn't exist
  if (kingdoms[name].underWar === undefined) {
    kingdoms[name].underWar = false;
  }

  // Initialize closerKingdoms property if it doesn't exist
  if (!kingdoms[name].closerKingdoms) {
    kingdoms[name].closerKingdoms = [];
  }
});

// Save updated kingdoms data
localStorage.setItem("kingdoms", JSON.stringify(kingdoms));

// Function to draw connection lines between kingdoms (disabled for card view)
function drawConnectionLines() {
  const svg = document.getElementById('connectionLines');
  const container = document.getElementById('cardContainer');

  // Clear existing lines
  svg.innerHTML = '';

  // Remove connection styling from all cards
  const cards = container.querySelectorAll('.card');
  cards.forEach(card => {
    card.classList.remove('connected');
  });
}



// Redraw connections when window is resized
window.addEventListener('resize', () => {
  setTimeout(drawConnectionLines, 100);
  setTimeout(drawNetworkTopology, 100);
});

// View toggle functionality
document.getElementById('cardViewBtn').addEventListener('click', () => {
  document.getElementById('cardView').style.display = 'block';
  document.getElementById('networkView').style.display = 'none';
  document.getElementById('cardViewBtn').classList.add('active');
  document.getElementById('networkViewBtn').classList.remove('active');
});

document.getElementById('networkViewBtn').addEventListener('click', () => {

  document.getElementById('cardView').style.display = 'none';
  document.getElementById('networkView').style.display = 'flex';
  document.getElementById('cardViewBtn').classList.remove('active');
  document.getElementById('networkViewBtn').classList.add('active');
  setTimeout(drawNetworkTopology, 100);
});

// Network topology drawing function
function drawNetworkTopology() {
  const canvas = document.getElementById('topologyCanvas');
  const nodesContainer = document.getElementById('topologyNodes');

  if (!canvas || !nodesContainer) return;

  // Clear existing content
  canvas.innerHTML = '';
  nodesContainer.innerHTML = '';

  const containerRect = nodesContainer.getBoundingClientRect();
  canvas.style.width = containerRect.width + 'px';
  canvas.style.height = containerRect.height + 'px';

  const kingdomNames = Object.keys(kingdoms);
  if (kingdomNames.length === 0) return;

  // Calculate positions using force-directed layout
  const positions = calculateNodePositions(kingdomNames, containerRect.width, containerRect.height);

  // Draw connections first (so they appear behind nodes)
  drawTopologyConnections(canvas, positions);

  // Calculate node sizes based on land area
  const landAreas = kingdomNames.map(name => kingdoms[name].landArea || 1000);
  const minLandArea = Math.min(...landAreas);
  const maxLandArea = Math.max(...landAreas);
  const minNodeSize = 40; // Minimum node size in pixels
  const maxNodeSize = 120; // Maximum node size in pixels

  // Draw nodes
  kingdomNames.forEach(name => {
    const kingdom = kingdoms[name];
    const pos = positions[name];

    // Calculate node size based on land area
    const landArea = kingdom.landArea || 1000;
    let nodeSize;

    if (maxLandArea === minLandArea) {
      // All kingdoms have the same land area
      nodeSize = (minNodeSize + maxNodeSize) / 2;
    } else {
      // Scale node size proportionally to land area
      const normalizedArea = ((landArea - minLandArea) / (maxLandArea - minLandArea)) * 5;
      nodeSize = minNodeSize + (normalizedArea * (maxNodeSize - minNodeSize));
    }
     nodeSize *= 0.4; 
    const nodeRadius = nodeSize / 2;

    const node = document.createElement('div');
    node.className = 'topology-node';
    node.style.width = nodeSize + 'px';
    node.style.height = nodeSize + 'px';
    node.style.left = (pos.x - nodeRadius) + 'px';
    node.style.top = (pos.y - nodeRadius) + 'px';

    // Determine node state
    const hasDisasters = kingdom.disaster && kingdom.disaster.current && kingdom.disaster.current.length > 0;
    const isAtWar = kingdom.underWar;

    if (isAtWar && hasDisasters) {
      node.classList.add('war', 'disaster');
    } else if (isAtWar) {
      node.classList.add('war');
    } else if (hasDisasters) {
      node.classList.add('disaster');
    } else {
      node.classList.add('normal');
    }

    // Node content with scaled font sizes
    const icon = document.createElement('div');
    icon.className = 'topology-node-icon';
    icon.textContent = isAtWar ? '⚔️' : hasDisasters ? '⚠️' : '🏰';
    // Scale icon size based on node size (base size 24px for 80px node)
    const iconSize = Math.round((nodeSize / 80) * 24);
    icon.style.fontSize = iconSize + 'px';

    const nameLabel = document.createElement('div');
    nameLabel.className = 'topology-node-name';
    nameLabel.textContent = name;
    // Scale text size based on node size (base size 10px for 80px node)
    const textSize = Math.max(8, Math.round((nodeSize / 80) * 10));
    nameLabel.style.fontSize = textSize + 'px';
    nameLabel.style.maxWidth = (nodeSize - 10) + 'px';

    node.appendChild(icon);
    node.appendChild(nameLabel);

    // Click handler
    node.addEventListener('click', () => {
      import('../assets/js/utils/navigation.js').then(({ Navigation }) => {
        Navigation.goToKingdom(name);
      });
    });

    // Hover effects
    node.addEventListener('mouseenter', () => {
      highlightConnections(name, true);
    });

    node.addEventListener('mouseleave', () => {
      highlightConnections(name, false);
    });

    nodesContainer.appendChild(node);
  });
}

function calculateNodePositions(kingdomNames, width, height) {
  const positions = {};
  const nodeCount = kingdomNames.length;

  if (nodeCount === 1) {
    positions[kingdomNames[0]] = { x: width / 2, y: height / 2 };
    return positions;
  }

  // Use a simple circular layout for small numbers, force-directed for larger
  if (nodeCount <= 8) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    kingdomNames.forEach((name, index) => {
      const angle = (index / nodeCount) * 2 * Math.PI;
      positions[name] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });
  } else {
    // Simple grid layout for many kingdoms
    const cols = Math.ceil(Math.sqrt(nodeCount));
    const rows = Math.ceil(nodeCount / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    kingdomNames.forEach((name, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      positions[name] = {
        x: (col + 0.5) * cellWidth,
        y: (row + 0.5) * cellHeight
      };
    });
  }

  return positions;
}

function drawTopologyConnections(canvas, positions) {
  const connections = [];
  const drawnConnections = new Set();

  // Collect all connections
  Object.keys(kingdoms).forEach(kingdomName => {
    const kingdom = kingdoms[kingdomName];
    if (!kingdom.closerKingdoms) return;

    kingdom.closerKingdoms.forEach(connectedKingdom => {
      const connectionId = [kingdomName, connectedKingdom].sort().join('-');
      if (drawnConnections.has(connectionId)) return;
      drawnConnections.add(connectionId);

      const fromPos = positions[kingdomName];
      const toPos = positions[connectedKingdom];

      if (fromPos && toPos) {
        connections.push({
          from: kingdomName,
          to: connectedKingdom,
          fromPos,
          toPos,
          id: connectionId
        });
      }
    });
  });

  // Draw connections
  connections.forEach(conn => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', conn.fromPos.x);
    line.setAttribute('y1', conn.fromPos.y);
    line.setAttribute('x2', conn.toPos.x);
    line.setAttribute('y2', conn.toPos.y);
    line.setAttribute('class', 'topology-connection');
    line.setAttribute('data-connection', conn.id);
    line.setAttribute('stroke-dasharray', '10,5');

    canvas.appendChild(line);
  });
}

function highlightConnections(kingdomName, highlight) {
  const kingdom = kingdoms[kingdomName];
  if (!kingdom.closerKingdoms) return;

  kingdom.closerKingdoms.forEach(connectedKingdom => {
    const connectionId = [kingdomName, connectedKingdom].sort().join('-');
    const line = document.querySelector(`[data-connection="${connectionId}"]`);

    if (line) {
      if (highlight) {
        line.classList.add('active');
      } else {
        line.classList.remove('active');
      }
    }
  });
}

