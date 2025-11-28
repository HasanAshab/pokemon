import { DISASTERS } from './constraints.js';

const kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");

const container = document.getElementById("cardContainer");

Object.keys(kingdoms).forEach((name) => {
  const card = document.createElement("div");
  card.className = "card";

  const label = document.createElement("div");
  label.textContent = name;
  label.className = "card-name";

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.className = "remove-btn";
  removeBtn.onclick = (e) => {
    e.stopPropagation(); // prevent card click
    if (confirm(`Delete kingdom "${name}"?`)) {
      delete kingdoms[name];
      localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
      location.reload();
    }
  };

  card.appendChild(label);
  card.appendChild(removeBtn);

  card.onclick = () => {
    const encodedName = encodeURIComponent(name);
    window.location.href = `/kingdoms/cms/?name=${encodedName}`;
  };

  container.appendChild(card);
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
    return state === 'prone' ? 30 : 15; // related prone: 30%, related normal: 15%
  } else {
    return state === 'prone' ? 10 : 5; // prone: 10%, normal: 5%
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