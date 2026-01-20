import { getMilitaryBudgetReport, calculateTax } from "../../utils.js";

// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("name");
})();

const kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
const kingdom = kingdoms[name];

// Function to calculate total budget from budget report
function calculateTotalBudget(budgetReport) {
  let total = 0;
  
  for (const territoryName in budgetReport) {
    const territory = budgetReport[territoryName];
    
    // Add soldiers costs
    if (territory.Soldiers) {
      total += territory.Soldiers.Salary || 0;
      total += territory.Soldiers.Ammonation || 0;
    }
  
    // Add commanders salary
    total += territory["Commanders Salary"] || 0;
    
    // Add artillery maintenance
    total += territory["Artillery Maintenance"] || 0;
    
    // Add beast costs
    if (territory.Beasts) {
      total += territory.Beasts["Researchers Salary"] || 0;
      total += territory.Beasts["Chakra Oil Import"] || 0;
    }
  }
  
  return total;
}

// Function to format currency
function formatCurrency(amount) {
  return `$${Math.floor(amount).toLocaleString()}`;
}

// Function to render budget breakdown
function renderBudgetBreakdown(budgetReport) {
  const container = document.getElementById("budgetBreakdown");
  container.innerHTML = "";
  
  for (const territoryName in budgetReport) {
    const territory = budgetReport[territoryName];
    
    const territoryDiv = document.createElement("div");
    territoryDiv.className = "territory-budget";
    
    const territoryHeader = document.createElement("h3");
    territoryHeader.textContent = territoryName;
    territoryHeader.className = "territory-header";
    territoryDiv.appendChild(territoryHeader);
    
    const categoriesDiv = document.createElement("div");
    categoriesDiv.className = "budget-categories";
    
    // Soldiers category
    if (territory.Soldiers) {
      const soldiersDiv = document.createElement("div");
      soldiersDiv.className = "budget-category";
      soldiersDiv.innerHTML = `
        <h4>Soldiers</h4>
        <div class="budget-items">
          <div class="budget-item">
            <span class="label">Salary:</span>
            <span class="value">${formatCurrency(territory.Soldiers.Salary || 0)}</span>
          </div>
          <div class="budget-item">
            <span class="label">Ammunition:</span>
            <span class="value">${formatCurrency(territory.Soldiers.Ammonation || 0)}</span>
          </div>
        </div>
      `;
      categoriesDiv.appendChild(soldiersDiv);
    }
    
    // Commanders category
    if (territory["Commanders Salary"]) {
      const commandersDiv = document.createElement("div");
      commandersDiv.className = "budget-category";
      commandersDiv.innerHTML = `
        <h4>Commanders</h4>
        <div class="budget-items">
          <div class="budget-item">
            <span class="label">Salary:</span>
            <span class="value">${formatCurrency(territory["Commanders Salary"])}</span>
          </div>
        </div>
      `;
      categoriesDiv.appendChild(commandersDiv);
    }
    
    // Artillery category
    if (territory["Artillery Maintenance"]) {
      const artilleryDiv = document.createElement("div");
      artilleryDiv.className = "budget-category";
      artilleryDiv.innerHTML = `
        <h4>Artillery</h4>
        <div class="budget-items">
          <div class="budget-item">
            <span class="label">Maintenance:</span>
            <span class="value">${formatCurrency(territory["Artillery Maintenance"])}</span>
          </div>
        </div>
      `;
      categoriesDiv.appendChild(artilleryDiv);
    }
    
    // Beasts category
    if (territory.Beasts) {
      const beastsDiv = document.createElement("div");
      beastsDiv.className = "budget-category";
      beastsDiv.innerHTML = `
        <h4>Beasts</h4>
        <div class="budget-items">
          <div class="budget-item">
            <span class="label">Researchers Salary:</span>
            <span class="value">${formatCurrency(territory.Beasts["Researchers Salary"] || 0)}</span>
          </div>
          <div class="budget-item">
            <span class="label">Chakra Oil Import:</span>
            <span class="value">${formatCurrency(territory.Beasts["Chakra Oil Import"] || 0)}</span>
          </div>
        </div>
      `;
      categoriesDiv.appendChild(beastsDiv);
    }
    
    territoryDiv.appendChild(categoriesDiv);
    container.appendChild(territoryDiv);
  }
}

// Function to update budget display
function updateBudgetDisplay() {
  if (!kingdom) {
    console.error("Kingdom not found");
    return;
  }
  
  const budgetReport = getMilitaryBudgetReport(kingdom);
  const totalBudget = calculateTotalBudget(budgetReport);
  const taxRevenue = calculateTax(kingdom);
  const budgetPercentage = taxRevenue > 0 ? (totalBudget / taxRevenue * 100) : 0;
  
  // Update summary
  document.getElementById("totalBudget").textContent = formatCurrency(totalBudget);
  document.getElementById("budgetPercentage").textContent = `${budgetPercentage.toFixed(1)}%`;
  
  // Update breakdown
  renderBudgetBreakdown(budgetReport);
}

// Initialize budget display
updateBudgetDisplay();

document.querySelectorAll(".info-card").forEach((card) => {
  card.addEventListener("click", () => {
    const target = card.getAttribute("data-target");
    console.log(target);
    if (!name || !target) return;
    // Import navigation utility dynamically
    import('../../../assets/js/utils/navigation.js').then(({ Navigation }) => {
      Navigation.goToKingdomMilitiaSection(name, target);
    });
  });
});
