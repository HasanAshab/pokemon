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
  dropdownMenu.appendChild(removeBtn);
  menuContainer.appendChild(moreBtn);
  menuContainer.appendChild(dropdownMenu);

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
    disaster: {
      current: {},
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
    return state === 'prone' ? 15 : 7; // related prone: 30%, related normal: 15%
  } else {
    return state === 'prone' ? 5 : 2; // prone: 10%, normal: 5%
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
      current: {},
      geoState: generateRandomGeoState()
    };
  }
  
  // Clear current disasters
  kingdom.disaster.current = {};
  
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
      
      kingdom.disaster.current[disaster] = primaryPower;
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
        kingdom.disaster.current[relatedDisaster] = relatedPower;
      }
    }
  }
  
  // Save to localStorage
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
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
    
    const currentDisasters = kingdom.disaster.current;
    
    if (Object.keys(currentDisasters).length === 0) {
      const noDisaster = document.createElement('p');
      noDisaster.textContent = '✅ No disasters currently affecting this kingdom';
      noDisaster.style.color = '#28a745';
      noDisaster.style.margin = '0';
      kingdomDiv.appendChild(noDisaster);
    } else {
      Object.entries(currentDisasters).forEach(([disaster, power]) => {
        const disasterDiv = document.createElement('div');
        disasterDiv.style.marginBottom = '5px';
        
        const powerColor = power >= 7 ? '#dc3545' : power >= 4 ? '#fd7e14' : '#ffc107';
        const powerEmoji = power >= 7 ? '🔴' : power >= 4 ? '🟠' : '🟡';
        
        disasterDiv.innerHTML = `
          ${powerEmoji} <strong>${disaster}</strong> - Power: ${power}/10
          <br><small style="color: #666;">${DISASTERS[disaster].description}</small>
        `;
        disasterDiv.style.color = powerColor;
        kingdomDiv.appendChild(disasterDiv);
      });
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

// Initialize disaster data for existing kingdoms that don't have it
Object.keys(kingdoms).forEach(name => {
  if (!kingdoms[name].disaster) {
    kingdoms[name].disaster = {
      current: {},
      geoState: generateRandomGeoState()
    };
  }
});

// Save updated kingdoms data
localStorage.setItem("kingdoms", JSON.stringify(kingdoms));