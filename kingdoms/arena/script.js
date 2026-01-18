import { WAR_SYSTEMS, AttackWave, DefenseWave, SoldierStack } from "../war.js";
import { prepareSoldiers, prepareCommander, handleWoundedSoldiers, getSoldierImbalancePenalty, getStorage } from "../utils.js";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");

// Team data structure
const teams = {
  1: {
    isAnonymous: false,
    kingdom: null,
    soldiers: []
  },
  2: {
    isAnonymous: false,
    kingdom: null,
    soldiers: []
  }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  loadKingdomSelects();
  updateSoldierSelects();
});

function loadKingdomSelects() {
  const team1Select = document.getElementById('team1KingdomSelect');
  const team2Select = document.getElementById('team2KingdomSelect');
  
  // Clear existing options
  team1Select.innerHTML = '<option value="">Choose Kingdom</option>';
  team2Select.innerHTML = '<option value="">Choose Kingdom</option>';
  
  // Add kingdom options
  Object.keys(kingdoms).forEach(kingdomName => {
    const option1 = document.createElement('option');
    option1.value = kingdomName;
    option1.textContent = kingdomName;
    team1Select.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = kingdomName;
    option2.textContent = kingdomName;
    team2Select.appendChild(option2);
  });
  
  // Add event listeners
  team1Select.addEventListener('change', () => {
    teams[1].kingdom = team1Select.value;
    updateSoldierSelects();
    renderTeamSoldiers(1);
  });
  
  team2Select.addEventListener('change', () => {
    teams[2].kingdom = team2Select.value;
    updateSoldierSelects();
    renderTeamSoldiers(2);
  });
}

function updateSoldierSelects() {
  updateTeamSoldierSelect(1);
  updateTeamSoldierSelect(2);
}

function updateTeamSoldierSelect(teamNum) {
  const select = document.getElementById(`team${teamNum}SoldierSelect`);
  const team = teams[teamNum];
  
  // Clear existing options
  select.innerHTML = '<option value="">Select Soldier</option>';
  
  if (team.isAnonymous) {
    // For anonymous teams, show all available soldiers
    const allSoldiers = new Set();
    Object.values(kingdoms).forEach(kingdom => {
      if (kingdom.barrack?.soldiers?.emergency) {
        kingdom.barrack.soldiers.emergency.forEach(soldier => {
          allSoldiers.add(soldier.image.id);
        });
      }
    });
    
    Array.from(allSoldiers).sort().forEach(soldierId => {
      const option = document.createElement('option');
      option.value = soldierId;
      option.textContent = soldierId;
      select.appendChild(option);
    });
  } else if (team.kingdom && kingdoms[team.kingdom]) {
    // For kingdom teams, show only emergency soldiers from that kingdom
    const kingdom = kingdoms[team.kingdom];
    if (kingdom.barrack?.soldiers?.emergency) {
      kingdom.barrack.soldiers.emergency.forEach(soldier => {
        const option = document.createElement('option');
        option.value = soldier.image.id;
        option.textContent = `${soldier.image.id} (${soldier.quantity} available)`;
        select.appendChild(option);
      });
    }
  }
}

globalThis.toggleTeamType = (teamNum, isAnonymous) => {
  const team = teams[teamNum];
  team.isAnonymous = isAnonymous;
  
  const kingdomDiv = document.getElementById(`team${teamNum}Kingdom`);
  kingdomDiv.style.display = isAnonymous ? 'none' : 'block';
  
  // Clear soldiers when switching type
  team.soldiers = [];
  
  updateSoldierSelects();
  renderTeamSoldiers(teamNum);
};

globalThis.addSoldier = (teamNum) => {
  const soldierSelect = document.getElementById(`team${teamNum}SoldierSelect`);
  const quantityInput = document.getElementById(`team${teamNum}Quantity`);
  const team = teams[teamNum];
  
  const soldierId = soldierSelect.value;
  const quantity = parseInt(quantityInput.value) || 1;
  
  if (!soldierId) {
    alert('Please select a soldier');
    return;
  }
  
  // Check if soldier already exists in team
  const existingIndex = team.soldiers.findIndex(s => s.image === soldierId);
  if (existingIndex >= 0) {
    team.soldiers[existingIndex].quantity += quantity;
  } else {
    team.soldiers.push({
      image: soldierId,
      quantity: quantity
    });
  }
  
  // Reset inputs
  soldierSelect.value = '';
  quantityInput.value = '1';
  
  renderTeamSoldiers(teamNum);
};

function renderTeamSoldiers(teamNum) {
  const container = document.getElementById(`team${teamNum}Soldiers`);
  const team = teams[teamNum];
  
  if (team.soldiers.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No soldiers added yet</div>';
    return;
  }
  
  container.innerHTML = '';
  
  team.soldiers.forEach((soldier, index) => {
    const soldierDiv = document.createElement('div');
    soldierDiv.className = 'soldier-entry';
    
    soldierDiv.innerHTML = `
      <div class="soldier-name">${soldier.image}</div>
      <div class="soldier-controls">
        <input type="number" min="1" value="${soldier.quantity}" 
               onchange="updateSoldierQuantity(${teamNum}, ${index}, this.value)"
               class="quantity-input">
        <button class="remove-soldier-btn" onclick="removeSoldier(${teamNum}, ${index})">×</button>
      </div>
    `;
    
    container.appendChild(soldierDiv);
  });
}

globalThis.updateSoldierQuantity = (teamNum, index, newQuantity) => {
  const quantity = parseInt(newQuantity) || 1;
  teams[teamNum].soldiers[index].quantity = Math.max(1, quantity);
};

globalThis.removeSoldier = (teamNum, index) => {
  teams[teamNum].soldiers.splice(index, 1);
  renderTeamSoldiers(teamNum);
};

globalThis.startBattle = () => {
  const team1 = teams[1];
  const team2 = teams[2];
  const strategy = document.getElementById('battleStrategy').value;
  
  // Validate teams
  if (team1.soldiers.length === 0 || team2.soldiers.length === 0) {
    alert('Both teams must have at least one soldier');
    return;
  }
  
  if (!team1.isAnonymous && !team1.kingdom) {
    alert('Team 1 must select a kingdom or be anonymous');
    return;
  }
  
  if (!team2.isAnonymous && !team2.kingdom) {
    alert('Team 2 must select a kingdom or be anonymous');
    return;
  }
  
  try {
    // Prepare teams for battle
    const wave1 = prepareTeamWave(1, strategy);
    const wave2 = prepareTeamWave(2, strategy);
    
    // Create battle
    const war = new WAR_SYSTEMS[strategy](wave1, wave2);
    
    // Display results
    displayBattleResults(war, team1, team2);
    
    // Handle wounded soldiers for kingdom teams
    if (!team1.isAnonymous && team1.kingdom) {
      handleWoundedSoldiers(kingdoms[team1.kingdom], war.result.wounded.atk, "emergency");
    }
    if (!team2.isAnonymous && team2.kingdom) {
      handleWoundedSoldiers(kingdoms[team2.kingdom], war.result.wounded.def, "emergency");
    }
    
    // Save kingdoms data
    localStorage.setItem('kingdoms', JSON.stringify(kingdoms));
    
  } catch (error) {
    console.error('Battle error:', error);
    alert('Error starting battle: ' + error.message);
  }
};

function prepareTeamWave(teamNum, strategy) {
  const team = teams[teamNum];
  
  // Create dummy commander for arena battles
  const dummyCommander = {
    name: `Team ${teamNum} Commander`,
    isAnonymous: true,
    iq: {
      offensive: 0.1,
      defensive: 0.1
    },
    image: { id: 'dummy' }
  };
  
  // Prepare soldiers
  let soldierStack;
  if (team.isAnonymous) {
    // For anonymous teams, create soldiers directly
    const soldierData = team.soldiers.map(soldier => [
      { id: soldier.image, type: getImageType(soldier.image) },
      soldier.quantity
    ]);
    soldierStack = new SoldierStack(soldierData);
  } else {
    // For kingdom teams, use only emergency soldiers
    const kingdom = kingdoms[team.kingdom];
    const soldierData = team.soldiers.map(soldier => {
      const kingdomSoldier = kingdom.barrack.soldiers.emergency.find(s => s.image.id === soldier.image);
      if (!kingdomSoldier) {
        throw new Error(`Soldier ${soldier.image} not found in ${team.kingdom}'s emergency forces`);
      }
      
      const availableQuantity = Math.min(soldier.quantity, kingdomSoldier.quantity);
      if (availableQuantity <= 0) {
        throw new Error(`Not enough ${soldier.image} soldiers available in ${team.kingdom}`);
      }
      
      return [kingdomSoldier.image, availableQuantity];
    });
    soldierStack = new SoldierStack(soldierData);
  }
  
  // Prepare options with imbalance penalty for kingdom teams
  const options = {
    cpModifiers: []
  };
  
  if (!team.isAnonymous && team.kingdom) {
    const kingdom = kingdoms[team.kingdom];
    options.cpModifiers.push(getSoldierImbalancePenalty(kingdom, 'emergency'));
  }
  
  // Create appropriate wave type based on strategy and team number
  if (strategy === 'occupy' || teamNum === 1) {
    return new AttackWave(dummyCommander, soldierStack, options);
  } else {
    return new DefenseWave(dummyCommander, soldierStack, options);
  }
}

function getImageType(imageId) {
  // Simple type detection - you might want to improve this
  // based on your actual data structure
  if (imageId.includes('human') || imageId.match(/^[A-Z]/)) {
    return 'human';
  }
  return 'beast';
}

function displayBattleResults(war, team1, team2) {
  const resultsDiv = document.getElementById('battleResults');
  const outputDiv = document.getElementById('battleOutput');
  
  resultsDiv.style.display = 'block';
  
  const team1Name = team1.isAnonymous ? 'Anonymous Team 1' : team1.kingdom;
  const team2Name = team2.isAnonymous ? 'Anonymous Team 2' : team2.kingdom;
  
  const winner = war.result.win ? team1Name : team2Name;
  const winnerColor = war.result.win ? '#007bff' : '#dc3545';
  
  let html = `
    <div style="text-align: center; margin-bottom: 2rem;">
      <h2 style="color: ${winnerColor};">🏆 ${winner} Wins!</h2>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
      <div style="text-align: center;">
        <h4 style="color: #007bff;">Team 1 (${team1Name})</h4>
        <div>Score: <strong>${Math.round(war.result.scores.atk).toLocaleString()}</strong></div>
      </div>
      <div style="text-align: center;">
        <h4 style="color: #dc3545;">Team 2 (${team2Name})</h4>
        <div>Score: <strong>${Math.round(war.result.scores.def).toLocaleString()}</strong></div>
      </div>
    </div>
    
    <div style="margin-bottom: 2rem;">
      <h4>Battle Analysis</h4>
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px;">
        ${war.comments().join('<br>')}
      </div>
    </div>
    
    <div style="margin-bottom: 2rem;">
      <h4>Score Difference</h4>
      <div>Difference: <strong>${Math.round(war.scoreDiff()).toLocaleString()}</strong></div>
      <div>Percentage: <strong>${parseInt(war.scoreDiffPercent())}%</strong></div>
    </div>
  `;
  
  // Show wounded soldiers
  if (war.result.wounded.atk.count() > 0 || war.result.wounded.def.count() > 0) {
    html += `
      <div style="margin-bottom: 2rem;">
        <h4>Casualties</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <strong>Team 1:</strong><br>
            ${formatWoundedSoldiers(war.result.wounded.atk)}
          </div>
          <div>
            <strong>Team 2:</strong><br>
            ${formatWoundedSoldiers(war.result.wounded.def)}
          </div>
        </div>
      </div>
    `;
  }
  
  html += `
    <div style="text-align: center; margin-top: 2rem;">
      <button class="btn btn-primary" onclick="resetArena()">New Battle</button>
    </div>
  `;
  
  outputDiv.innerHTML = html;
}

function formatWoundedSoldiers(soldierStack) {
  if (soldierStack.count() === 0) {
    return '<em>No casualties</em>';
  }
  
  const casualties = [];
  soldierStack.forEach(([image, quantity]) => {
    casualties.push(`${image}: ${quantity}`);
  });
  
  return casualties.join('<br>');
}

globalThis.resetArena = () => {
  // Reset teams
  teams[1] = { isAnonymous: false, kingdom: null, soldiers: [] };
  teams[2] = { isAnonymous: false, kingdom: null, soldiers: [] };
  
  // Reset UI
  document.getElementById('team1Anonymous').checked = false;
  document.getElementById('team2Anonymous').checked = false;
  document.getElementById('team1KingdomSelect').value = '';
  document.getElementById('team2KingdomSelect').value = '';
  document.getElementById('team1Kingdom').style.display = 'block';
  document.getElementById('team2Kingdom').style.display = 'block';
  
  // Hide results
  document.getElementById('battleResults').style.display = 'none';
  
  // Re-render soldiers
  renderTeamSoldiers(1);
  renderTeamSoldiers(2);
  
  // Update soldier selects
  updateSoldierSelects();
};