import { getMilitaryBudgetReport, getMilitaryStatsReport, calculateTax } from "../../utils.js";

// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("name");
})();

const kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
const kingdom = kingdoms[name];

// Function to calculate total power from stats report
function calculateTotalPower(statsReport) {
  let totalPower = 0;
  
  for (const territoryName in statsReport) {
    const territory = statsReport[territoryName];
    if (territory.Power) {
      for (const powerType in territory.Power) {
        totalPower += territory.Power[powerType] || 0;
      }
    }
  }
  
  return totalPower;
}

// Function to calculate power breakdown with percentages
function calculatePowerBreakdown(statsReport) {
  const powerTotals = {};
  let totalPower = 0;
  
  // Aggregate all power types across territories
  for (const territoryName in statsReport) {
    const territory = statsReport[territoryName];
    if (territory.Power) {
      for (const powerType in territory.Power) {
        const powerValue = territory.Power[powerType] || 0;
        powerTotals[powerType] = (powerTotals[powerType] || 0) + powerValue;
        totalPower += powerValue;
      }
    }
  }
  
  // Convert to array with percentages and sort by value
  const powerBreakdown = Object.entries(powerTotals)
    .map(([type, value]) => ({
      type,
      value,
      percentage: totalPower > 0 ? (value / totalPower * 100) : 0
    }))
    .sort((a, b) => b.value - a.value); // Sort by highest value first
  
  return { powerBreakdown, totalPower };
}

// Function to render power breakdown
function renderPowerBreakdown(statsReport) {
  const container = document.getElementById("powerBreakdown");
  const { powerBreakdown, totalPower } = calculatePowerBreakdown(statsReport);
  
  container.innerHTML = `
    <h3>Power Distribution</h3>
    <div class="power-items">
      ${powerBreakdown.map(({ type, value, percentage }) => `
        <div class="power-item">
          <span class="power-label">${type}:</span>
          <span class="power-value">
            ${formatPower(value)}
            <span class="power-percentage">(${percentage.toFixed(1)}%)</span>
          </span>
        </div>
      `).join('')}
    </div>
  `;
  
  // Update total power display
  document.getElementById("totalPower").textContent = formatPower(totalPower);
}

// Function to render stats breakdown
function renderStatsBreakdown(statsReport) {
  const container = document.getElementById("statsBreakdown");
  container.innerHTML = "";
  
  for (const territoryName in statsReport) {
    const territory = statsReport[territoryName];
    
    const territoryDiv = document.createElement("div");
    territoryDiv.className = "territory-stats";
    
    const territoryHeader = document.createElement("h3");
    territoryHeader.textContent = territoryName;
    territoryHeader.className = "territory-stats-header";
    territoryDiv.appendChild(territoryHeader);
    
    const categoriesDiv = document.createElement("div");
    categoriesDiv.className = "stats-categories";
    
    // Basic stats (Reserved, Active)
    const basicStatsDiv = document.createElement("div");
    basicStatsDiv.className = "stats-category";
    basicStatsDiv.innerHTML = `
      <h4>Personnel</h4>
      <div class="stats-items">
        <div class="stats-item">
          <span class="label">Reserved:</span>
          <span class="value">${formatPersonnel(territory.Reserved || 0)}</span>
        </div>
        <div class="stats-item">
          <span class="label">Active:</span>
          <span class="value">${formatPersonnel(territory.Active || 0)}</span>
        </div>
      </div>
    `;
    categoriesDiv.appendChild(basicStatsDiv);
    
    // Power stats
    if (territory.Power) {
      const powerStatsDiv = document.createElement("div");
      powerStatsDiv.className = "stats-category";
      powerStatsDiv.innerHTML = `
        <h4>Power</h4>
        <div class="stats-items">
          ${Object.entries(territory.Power).map(([powerType, value]) => `
            <div class="stats-item">
              <span class="label">${powerType}:</span>
              <span class="value">${formatPower(value)}</span>
            </div>
          `).join('')}
        </div>
      `;
      categoriesDiv.appendChild(powerStatsDiv);
    }
    
    territoryDiv.appendChild(categoriesDiv);
    container.appendChild(territoryDiv);
  }
}

// Function to update stats display
function updateStatsDisplay() {
  if (!kingdom) {
    console.error("Kingdom not found");
    return;
  }
  
  const statsReport = getMilitaryStatsReport(kingdom);
  
  // Update power breakdown and total
  renderPowerBreakdown(statsReport);
  
  // Update stats breakdown
  renderStatsBreakdown(statsReport);
}

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

// Function to format power (might)
function formatPower(amount) {
  return `${Math.floor(amount).toLocaleString()}`;
}

// Function to format personnel numbers
function formatPersonnel(amount) {
  return `${Math.floor(amount).toLocaleString()}`;
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

// Initialize displays
updateStatsDisplay();
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
