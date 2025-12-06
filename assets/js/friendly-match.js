import { Pokemon } from "./utils/models.js";
import { getPokemonsMeta } from "./utils/helpers.js";
import { startBattle } from "./utils/dom.js";

// Team management
let team1 = [];
let team2 = [];
let allPokemon = {};

// Initialize the friendly match interface
document.addEventListener('DOMContentLoaded', function() {
    loadPokemonCollection();
    updateTeamDisplays();
    updateStartBattleButton();
});

// Load all Pokemon from localStorage
function loadPokemonCollection() {
    allPokemon = getPokemonsMeta();
    const pokemonGrid = document.getElementById('pokemon-collection');
    
    if (Object.keys(allPokemon).length === 0) {
        pokemonGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">
                <h3>No Pokemon Found</h3>
                <p>You need to add some Pokemon to your collection first.</p>
                <button onclick="goBack()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Go Back to Add Pokemon
                </button>
            </div>
        `;
        return;
    }
    
    pokemonGrid.innerHTML = '';
    
    Object.entries(allPokemon).forEach(([name, meta]) => {
        const pokemon = new Pokemon(meta.id, meta);
        const pokemonCard = createPokemonCard(name, pokemon, meta);
        pokemonGrid.appendChild(pokemonCard);
    });
}

// Create a Pokemon card element
function createPokemonCard(name, pokemon, meta) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    card.dataset.pokemonName = name;
    
    // Check if Pokemon is already in a team
    const inTeam1 = team1.some(p => p.name === name);
    const inTeam2 = team2.some(p => p.name === name);
    
    if (inTeam1) card.classList.add('in-team1');
    if (inTeam2) card.classList.add('in-team2');
    
    const level = Pokemon.calculateLevel(meta.xp);
    const hp = pokemon.maxhp;
    const currentHp = meta.stats.hp || hp;
    const healthPercent = Math.round((currentHp / hp) * 100);
    
    card.innerHTML = `
        ${inTeam1 ? '<div class="team-indicator team1-indicator">Team 1</div>' : ''}
        ${inTeam2 ? '<div class="team-indicator team2-indicator">Team 2</div>' : ''}
        
        <div class="pokemon-card-header">
            <div class="pokemon-name">${name.charAt(0).toUpperCase() + name.slice(1)}</div>
            <div class="pokemon-level">LVL ${level}</div>
        </div>
        
        <div class="pokemon-stats">
            <span>HP: ${currentHp}/${hp} (${healthPercent}%)</span>
            <span>CP: ${pokemon.cp()}</span>
        </div>
        
        <div class="pokemon-info">
            <div style="margin-bottom: 8px;">
                <strong>Nature:</strong> ${meta.nature || 'Unknown'}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Types:</strong> ${meta.types.length > 0 ? meta.types.join(', ') : 'None'}
            </div>
        </div>
        
        <div class="team-assignment">
            <button class="assign-team-btn assign-team1-btn" onclick="assignToTeam('${name}', 1)" ${inTeam1 ? 'disabled' : ''}>
                ${inTeam1 ? 'In Team 1' : 'Add to Team 1'}
            </button>
            <button class="assign-team-btn assign-team2-btn" onclick="assignToTeam('${name}', 2)" ${inTeam2 ? 'disabled' : ''}>
                ${inTeam2 ? 'In Team 2' : 'Add to Team 2'}
            </button>
        </div>
    `;
    
    return card;
}

// Assign Pokemon to a team
globalThis.assignToTeam = function(pokemonName, teamNumber) {
    const meta = allPokemon[pokemonName];
    if (!meta) return;
    
    const pokemon = new Pokemon(meta.id, meta);
    const pokemonData = {
        ...meta,
        name: pokemonName
    };
    
    // Remove from other team if already assigned
    if (teamNumber === 1) {
        team2 = team2.filter(p => p.name !== pokemonName);
        if (!team1.some(p => p.name === pokemonName)) {
            team1.push(pokemonData);
        }
    } else {
        team1 = team1.filter(p => p.name !== pokemonName);
        if (!team2.some(p => p.name === pokemonName)) {
            team2.push(pokemonData);
        }
    }
    
    // Add animation class
    const card = document.querySelector(`[data-pokemon-name="${pokemonName}"]`);
    card.classList.add('team-assigned');
    setTimeout(() => card.classList.remove('team-assigned'), 300);
    
    updateTeamDisplays();
    updateStartBattleButton();
    loadPokemonCollection(); // Refresh to update button states
};

// Remove Pokemon from team
globalThis.removeFromTeam = function(pokemonName, teamNumber) {
    if (teamNumber === 1) {
        team1 = team1.filter(p => p.name !== pokemonName);
    } else {
        team2 = team2.filter(p => p.name !== pokemonName);
    }
    
    updateTeamDisplays();
    updateStartBattleButton();
    loadPokemonCollection(); // Refresh to update button states
};

// Update team displays
function updateTeamDisplays() {
    updateTeamDisplay(1, team1);
    updateTeamDisplay(2, team2);
}

function updateTeamDisplay(teamNumber, team) {
    const teamList = document.getElementById(`team${teamNumber}-list`);
    const teamCount = document.querySelector(`[data-team="${teamNumber}"] .team-count`);
    
    teamCount.textContent = `${team.length} Pokemon`;
    
    if (team.length === 0) {
        teamList.innerHTML = `
            <div class="empty-team-message">
                <p>Select Pokemon from your collection below</p>
            </div>
        `;
        return;
    }
    
    teamList.innerHTML = '';
    
    team.forEach(pokemonData => {
        const pokemon = new Pokemon(pokemonData.id, pokemonData);
        const level = Pokemon.calculateLevel(pokemonData.xp);
        
        const teamCard = document.createElement('div');
        teamCard.className = 'team-pokemon-card';
        teamCard.innerHTML = `
            <div class="team-pokemon-info">
                <div class="team-pokemon-name">${pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1)}</div>
                <div class="team-pokemon-level">Level ${level} • CP: ${pokemon.cp()}</div>
            </div>
            <button class="remove-from-team-btn" onclick="removeFromTeam('${pokemonData.name}', ${teamNumber})">
                Remove
            </button>
        `;
        
        teamList.appendChild(teamCard);
    });
}

// Update start battle button state
function updateStartBattleButton() {
    const startBtn = document.querySelector('.start-battle-btn');
    const canStart = team1.length > 0 && team2.length > 0;
    
    startBtn.disabled = !canStart;
    
    if (canStart) {
        startBtn.textContent = `Start Battle (${team1.length} vs ${team2.length})`;
    } else {
        startBtn.textContent = 'Select Pokemon for both teams';
    }
}

// Clear all teams
globalThis.clearAllTeams = function() {
    if (confirm('Are you sure you want to clear both teams?')) {
        team1 = [];
        team2 = [];
        updateTeamDisplays();
        updateStartBattleButton();
        loadPokemonCollection();
    }
};

// Auto balance teams
globalThis.autoBalanceTeams = function() {
    const allPokemonArray = Object.entries(allPokemon).map(([name, meta]) => ({
        ...meta,
        name: name,
        cp: new Pokemon(meta.id, meta).cp()
    }));
    
    if (allPokemonArray.length < 2) {
        alert('You need at least 2 Pokemon to auto-balance teams.');
        return;
    }
    
    // Sort by CP for balanced distribution
    allPokemonArray.sort((a, b) => b.cp - a.cp);
    
    team1 = [];
    team2 = [];
    
    // Alternate assignment to balance teams
    allPokemonArray.forEach((pokemon, index) => {
        if (index % 2 === 0) {
            team1.push(pokemon);
        } else {
            team2.push(pokemon);
        }
    });
    
    updateTeamDisplays();
    updateStartBattleButton();
    loadPokemonCollection();
};

// Start the friendly battle
globalThis.startFriendlyBattle = function() {
    if (team1.length === 0 || team2.length === 0) {
        alert('Both teams must have at least one Pokemon!');
        return;
    }
    
    const battleField = document.getElementById('battle-field').value;
    const fields = battleField ? [battleField] : [];
    
    // Prepare the battle data
    // For friendly matches, we'll use team1 as "you" and team2 as "enemy"
    const team1Data = team1.map(pokemon => ({
        id: pokemon.id,
        name: pokemon.name,
        xp: pokemon.xp,
        nature: pokemon.nature,
        retreat: pokemon.retreat,
        types: pokemon.types || [],
        abilities: pokemon.abilities || [],
        items: pokemon.items || [],
        moves: pokemon.moves || [],
        mega: pokemon.mega || { moves: [], suffix: "" },
        stats: pokemon.stats || {},
        token_used: pokemon.token_used || {
            hp: 0, spe: 0, atk: 0, def: 0, spa: 0, spd: 0
        }
    }));
    
    const team2Data = team2.map(pokemon => ({
        id: pokemon.id,
        name: pokemon.name,
        xp: pokemon.xp,
        nature: pokemon.nature,
        retreat: pokemon.retreat,
        types: pokemon.types || [],
        abilities: pokemon.abilities || [],
        items: pokemon.items || [],
        moves: pokemon.moves || [],
        mega: pokemon.mega || { moves: [], suffix: "" },
        stats: pokemon.stats || {},
        token_used: pokemon.token_used || {
            hp: 0, spe: 0, atk: 0, def: 0, spa: 0, spd: 0
        }
    }));
    
    // Store team data for the battle system
    localStorage.setItem('$friendly-match-team1', JSON.stringify(team1Data));
    localStorage.setItem('$friendly-match-team2', JSON.stringify(team2Data));
    localStorage.setItem('$friendly-match-mode', 'true');
    
    // Start the battle using team2 as enemies (the battle system expects enemies)
    startBattle(team2Data, fields, "multiple");
};

// Go back to main page
globalThis.goBack = function() {
    // Clean up friendly match data
    localStorage.removeItem('$friendly-match-team1');
    localStorage.removeItem('$friendly-match-team2');
    localStorage.removeItem('$friendly-match-mode');
    
    window.location.href = 'index.html';
};