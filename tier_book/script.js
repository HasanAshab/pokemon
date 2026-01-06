import { Pokemon } from "../assets/js/utils/models.js";
import pokemons from "../data/pokemons.js";
import { getTierOf, getTiers } from "../kingdoms/utils.js";


  
function getBeastsWithTiers() {
    const list = [];
  
    for (const id in pokemons) {
        
        const pokemon = new Pokemon(id);
        if (pokemon.type !== "beast") continue;

        list.push({
            id,
            picture: pokemon.picture,
            tier: getTierOf(id) || getTiers().length + 1
        });        
    }
    return list;
}

// Function to create beast display for a specific tier
function createBeastDisplay(tierIndex, showBeasts) {
    if (!showBeasts) return null;
    
    const beasts = getBeastsWithTiers();
    const tierBeasts = beasts.filter(beast => beast.tier === tierIndex + 1);
    
    if (tierBeasts.length === 0) return null;
    
    const beastsContainer = document.createElement('div');
    beastsContainer.className = 'beasts-container';
    
    tierBeasts.forEach(beast => {
        const beastItem = document.createElement('div');
        beastItem.className = 'beast-item';
        
        const beastImage = document.createElement('img');
        beastImage.className = 'beast-image';
        beastImage.src = beast.picture;
        beastImage.alt = `Beast ${beast.id}`;
        beastImage.onerror = function() {
            this.style.display = 'none';
        };
        
        const beastId = document.createElement('div');
        beastId.className = 'beast-id';
        beastId.textContent = beast.id;
        
        beastItem.appendChild(beastImage);
        beastItem.appendChild(beastId);
        beastsContainer.appendChild(beastItem);
    });
    
    return beastsContainer;
}

// Function to create tier display
function createTierDisplay() {
    const tiers = getTiers();
    const showBeasts = document.getElementById('show-beasts-checkbox').checked;
    
    // Get tier list element    
    const tierListElement = document.getElementById('tier-list');
    
    // Clear existing content
    tierListElement.innerHTML = '';
    
    // Create tier items
    for (let i = 0; i < tiers.length; i++) {
        const tierItem = document.createElement('div');
        tierItem.className = 'tier-item';

        const tierNumber = document.createElement('div');
        tierNumber.className = 'tier-number';
        tierNumber.textContent = `Tier ${i + 1} - ${tiers[i].source}`;
        
        const tierRange = document.createElement('div');
        tierRange.className = 'tier-range';
        
        // Calculate range
        const lowerBound = i === 0 ? 0 : tiers[i - 1].minMight + 1;
        const upperBound = tiers[i].minMight;
        
        // Format numbers with toLocaleString()
        const formattedLower = lowerBound.toLocaleString();
        const formattedUpper = upperBound.toLocaleString();
        
        tierRange.textContent = `(${formattedLower} - ${formattedUpper})`;
        
        tierItem.appendChild(tierNumber);
        tierItem.appendChild(tierRange);
        
        // Add beasts if checkbox is checked
        const beastDisplay = createBeastDisplay(i, showBeasts);
        if (beastDisplay) {
            tierItem.appendChild(beastDisplay);
        }
        
        tierListElement.appendChild(tierItem);
    }
    
    // Add a final tier for anything above the highest tier
    if (tiers.length > 0) {
        const finalTierItem = document.createElement('div');
        finalTierItem.className = 'tier-item';
        
        const finalTierNumber = document.createElement('div');
        finalTierNumber.className = 'tier-number';
        finalTierNumber.textContent = `Tier ${tiers.length + 1} - Ultimate`;
        
        const finalTierRange = document.createElement('div');
        finalTierRange.className = 'tier-range';
        const finalLowerBound = (tiers[tiers.length - 1].minMight + 1).toLocaleString();
        finalTierRange.textContent = `(${finalLowerBound}+)`;
        
        finalTierItem.appendChild(finalTierNumber);
        finalTierItem.appendChild(finalTierRange);
        
        // Add beasts for final tier if checkbox is checked
        const finalBeastDisplay = createBeastDisplay(tiers.length, showBeasts);
        if (finalBeastDisplay) {
            finalTierItem.appendChild(finalBeastDisplay);
        }
        
        tierListElement.appendChild(finalTierItem);
    }
}

// Initialize the tier display when the page loads
document.addEventListener('DOMContentLoaded', function() {
    createTierDisplay();
    
    // Add event listener for checkbox
    const checkbox = document.getElementById('show-beasts-checkbox');
    checkbox.addEventListener('change', function() {
        createTierDisplay();
    });
});