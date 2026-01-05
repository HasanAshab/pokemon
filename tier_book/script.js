import { getTiers } from "../kingdoms/utils.js";


// Function to create tier display
function createTierDisplay() {
    const tiers = getTiers();
    
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
        tierNumber.textContent = `Tier ${i + 1}`;
        
        const tierRange = document.createElement('div');
        tierRange.className = 'tier-range';
        
        // Calculate range
        const lowerBound = i === 0 ? 0 : tiers[i - 1] + 1;
        const upperBound = tiers[i];
        
        // Format numbers with toLocaleString()
        const formattedLower = lowerBound.toLocaleString();
        const formattedUpper = upperBound.toLocaleString();
        
        tierRange.textContent = `(${formattedLower} - ${formattedUpper})`;
        
        tierItem.appendChild(tierNumber);
        tierItem.appendChild(tierRange);
        tierListElement.appendChild(tierItem);
    }
    
    // Add a final tier for anything above the highest tier
    if (tiers.length > 0) {
        const finalTierItem = document.createElement('div');
        finalTierItem.className = 'tier-item';
        
        const finalTierNumber = document.createElement('div');
        finalTierNumber.className = 'tier-number';
        finalTierNumber.textContent = `Tier ${tiers.length + 1}`;
        
        const finalTierRange = document.createElement('div');
        finalTierRange.className = 'tier-range';
        const finalLowerBound = (tiers[tiers.length - 1] + 1).toLocaleString();
        finalTierRange.textContent = `(${finalLowerBound}+)`;
        
        finalTierItem.appendChild(finalTierNumber);
        finalTierItem.appendChild(finalTierRange);
        tierListElement.appendChild(finalTierItem);
    }
}

// Initialize the tier display when the page loads
document.addEventListener('DOMContentLoaded', function() {
    createTierDisplay();
    
    // Log the tiers array for debugging
    console.log('Generated tiers:', getTiers());
});