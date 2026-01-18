import { WAR_SYSTEMS, AttackWave, DefenseWave, SoldierStack } from "../war.js";
import { prepareSoldiers, prepareCommander, handleWoundedSoldiers, getSoldierImbalancePenalty, getStorage } from "../utils.js";
import pokemons from "../../data/pokemons.js";

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

// Get all available pokemon IDs for datalist
const allPokemonIds = Object.keys(pokemons).filter(id => id !== '$artillery');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  loadKingdomSelects();
  createDatalist();
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
    if (team1Select.value && !teams[1].isAnonymous) {
      loadAllKingdomTroops(1);
    }
    updateSoldierSelects();
    renderTeamSoldiers(1);
  });
  
  team2Select.addEventListener('change', () => {
    teams[2].kingdom = team2Select.value;
    if (team2Select.value && !teams[2].isAnonymous) {
      loadAllKingdomTroops(2);
    }
    updateSoldierSelects();
    renderTeamSoldiers(2);
  });
}

function createDatalist() {
  // Create datalist for anonymous team soldier selection
  const datalist = document.createElement('datalist');
  datalist.id = 'pokemonList';
  
  allPokemonIds.forEach(id => {
    const option = document.createElement('option');
    option.value = id;
    datalist.appendChild(option);
  });
  
  document.body.appendChild(datalist);
}

function loadAllKingdomTroops(teamNum) {
  const team = teams[teamNum];
  if (!team.kingdom || team.isAnonymous) return;
  
  const kingdom = kingdoms[team.kingdom];
  if (!kingdom.barrack?.soldiers?.emergency) return;
  
  // Clear existing soldiers
  team.soldiers = [];
  
  // Add all emergency soldiers with their available quantities
  kingdom.barrack.soldiers.emergency.forEach(soldier => {
    if (soldier.quantity > 0) {
      team.soldiers.push({
        image: soldier.image.id,
        quantity: soldier.quantity
      });
    }
  });
}

function updateSoldierSelects() {
  updateTeamSoldierSelect(1);
  updateTeamSoldierSelect(2);
}

function updateTeamSoldierSelect(teamNum) {
  const selectContainer = document.querySelector(`#team${teamNum}SoldierSelect`).parentElement;
  const team = teams[teamNum];
  
  // Remove existing input/select
  const existingElement = selectContainer.querySelector('select, input');
  if (existingElement) {
    existingElement.remove();
  }
  
  if (team.isAnonymous) {
    // Create text input with datalist for anonymous teams
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `team${teamNum}SoldierSelect`;
    input.placeholder = 'Type soldier name...';
    input.setAttribute('list', 'pokemonList');
    input.style.flex = '1';
    input.style.margin = '0';
    selectContainer.insertBefore(input, selectContainer.firstChild);
  } else {
    // Create select dropdown for kingdom teams
    const select = document.createElement('select');
    select.id = `team${teamNum}SoldierSelect`;
    select.style.flex = '1';
    select.style.margin = '0';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Soldier';
    select.appendChild(defaultOption);
    
    if (team.kingdom && kingdoms[team.kingdom]) {
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
    
    selectContainer.insertBefore(select, selectContainer.firstChild);
  }
}

globalThis.toggleTeamType = (teamNum, isAnonymous) => {
  const team = teams[teamNum];
  team.isAnonymous = isAnonymous;
  
  const kingdomDiv = document.getElementById(`team${teamNum}Kingdom`);
  kingdomDiv.style.display = isAnonymous ? 'none' : 'block';
  
  // Clear soldiers when switching type
  team.soldiers = [];
  
  // If switching to kingdom mode and a kingdom is selected, load all troops
  if (!isAnonymous && team.kingdom) {
    loadAllKingdomTroops(teamNum);
  }
  
  updateSoldierSelects();
  renderTeamSoldiers(teamNum);
};

globalThis.addSoldier = (teamNum) => {
  const soldierElement = document.getElementById(`team${teamNum}SoldierSelect`);
  const quantityInput = document.getElementById(`team${teamNum}Quantity`);
  const team = teams[teamNum];
  
  const soldierId = soldierElement.value;
  const quantity = parseInt(quantityInput.value) || 1;
  
  if (!soldierId) {
    alert('Please select a soldier');
    return;
  }
  
  // Validate soldier ID exists in pokemons data for anonymous teams
  if (team.isAnonymous && !allPokemonIds.includes(soldierId)) {
    alert('Invalid soldier ID. Please select from the list.');
    return;
  }
  
  // For kingdom teams, validate soldier exists and check availability
  if (!team.isAnonymous && team.kingdom) {
    const kingdom = kingdoms[team.kingdom];
    const availableSoldier = kingdom.barrack?.soldiers?.emergency?.find(s => s.image.id === soldierId);
    if (!availableSoldier) {
      alert('Soldier not found in kingdom emergency forces');
      return;
    }
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
  soldierElement.value = '';
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
    
    // Get max available quantity for kingdom teams
    let maxQuantity = null;
    let availabilityText = '';
    if (!team.isAnonymous && team.kingdom) {
      const kingdom = kingdoms[team.kingdom];
      const availableSoldier = kingdom.barrack?.soldiers?.emergency?.find(s => s.image.id === soldier.image);
      if (availableSoldier) {
        maxQuantity = availableSoldier.quantity;
        availabilityText = ` (max: ${maxQuantity})`;
      }
    }
    
    soldierDiv.innerHTML = `
      <div class="soldier-name">${soldier.image}${availabilityText}</div>
      <div class="soldier-controls">
        <input type="number" min="1" ${maxQuantity ? `max="${maxQuantity}"` : ''} value="${soldier.quantity}" 
               onchange="updateSoldierQuantity(${teamNum}, ${index}, this.value)"
               onblur="validateSoldierQuantity(${teamNum}, ${index}, this)"
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

globalThis.validateSoldierQuantity = (teamNum, index, inputElement) => {
  const team = teams[teamNum];
  const soldier = team.soldiers[index];
  const requestedQuantity = parseInt(inputElement.value) || 1;
  
  // For kingdom teams, validate against available quantity
  if (!team.isAnonymous && team.kingdom) {
    const kingdom = kingdoms[team.kingdom];
    const availableSoldier = kingdom.barrack?.soldiers?.emergency?.find(s => s.image.id === soldier.image);
    
    if (availableSoldier) {
      const maxAvailable = availableSoldier.quantity;
      if (requestedQuantity > maxAvailable) {
        // Auto-fix to maximum available
        inputElement.value = maxAvailable;
        soldier.quantity = maxAvailable;
        
        // Show feedback
        inputElement.style.backgroundColor = '#ffe6e6';
        setTimeout(() => {
          inputElement.style.backgroundColor = '';
        }, 1000);
        
        return;
      }
    }
  }
  
  // Ensure minimum quantity of 1
  if (requestedQuantity < 1) {
    inputElement.value = 1;
    soldier.quantity = 1;
    
    inputElement.style.backgroundColor = '#ffe6e6';
    setTimeout(() => {
      inputElement.style.backgroundColor = '';
    }, 1000);
  } else {
    soldier.quantity = requestedQuantity;
  }
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