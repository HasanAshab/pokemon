import items from "../../data/items.js";
import { DISASTERS } from "../constraints.js";
import {
  calculateTax,
  calculateBuildUsedLandArea,
  calculatePeopleUsedLandArea,
  calculateLandPrice,
  getPopulationGrowth,
  getDiedForHospital,
  getDiedForSecurity,
  getTotalDeathCount,
  getDiedForAge,
  calculateBirthCount,
  getFoodTierForBudget
} from "../utils.js";

// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("name");
})();

const landAreaInput = document.getElementById("landArea");
const densityInput = document.getElementById("density");
const birthRateInput = document.getElementById("birthRate");
const birthCountLabel = document.getElementById("birthCount")
const pciInput = document.getElementById("pci");
const taxRateInput = document.getElementById("taxRate");
const taxRateValue = document.getElementById("taxRateValue");
const kingdomName = document.getElementById("kingdomName");
const populationLabel = document.getElementById("populationLabel");
const populationBar = document.getElementById("populationBar");
const populationGrowthLabel = document.getElementById("populationGrowthLabel");
const populationGrowthBar = document.getElementById("populationGrowthBar");

const totalDeathCountLabel = document.getElementById("totalDied");
const diedForAgeLabel = document.getElementById("diedForAgeLabel");
const diedForAgeBar = document.getElementById("diedForAgeBar");
const diedForHospitalLabel = document.getElementById("diedForHospitalLabel");
const diedForHospitalBar = document.getElementById("diedForHospitalBar");
const diedForSecurityLabel = document.getElementById("diedForSecurityLabel");
const diedForSecurityBar = document.getElementById("diedForSecurityBar");

const taxLabel = document.getElementById("taxLabel");
const taxBar = document.getElementById("taxBar");
const usedLandLabel = document.getElementById("usedLandLabel");
const freeLandLabel = document.getElementById("freeLandLabel");
const priceForAreaInput = document.getElementById("price-for-area-input")
const landCostLabel = document.getElementById("landCostLabel");
const landCostMethod = document.getElementById("landCostMethod")
const landQuality = document.getElementById("landQuality")
const saveBtn = document.getElementById("saveBtn");

kingdomName.textContent = name || "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
let kingdom = kingdoms[name] || {
  id: name,
  landArea: 1000,
  density: 100,
  pci: 50,
  taxRate: 0.3,
  buildings: [],
  storage: {},
  disaster: {
    geoState: {}
  }
};

// Ensure disaster object exists for existing kingdoms
if (!kingdom.disaster) {
  kingdom.disaster = { geoState: {} };
}
if (!kingdom.disaster.geoState) {
  kingdom.disaster.geoState = {};
}

// Ensure closerKingdoms array exists
if (!kingdom.closerKingdoms) {
  kingdom.closerKingdoms = [];
}

landAreaInput.value = kingdom.landArea;
densityInput.value = kingdom.density;
pciInput.value = kingdom.pci;
taxRateInput.value = (kingdom.taxRate * 100).toFixed(0);
taxRateValue.textContent = taxRateInput.value;

function loadDisasterCheckboxes() {
  const disasterContainer = document.getElementById("disasterCheckboxes");
  disasterContainer.innerHTML = "";

  Object.entries(DISASTERS).forEach(([disasterName, { description }]) => {
    const disasterWrapper = document.createElement("div");
    disasterWrapper.className = "disaster-item";

    const label = document.createElement("label");
    label.textContent = disasterName;
    label.title = description;
    label.className = "disaster-label";

    const select = document.createElement("select");
    select.id = `disaster-${disasterName.replace(/\s+/g, '-').toLowerCase()}`;
    select.className = "disaster-select";

    const states = [
      { value: "normal", text: "Normal" },
      { value: "prone", text: "Prone" },
      { value: "immune", text: "Immune" }
    ];

    states.forEach(state => {
      const option = document.createElement("option");
      option.value = state.value;
      option.textContent = state.text;
      select.appendChild(option);
    });

    const currentState = (kingdom.disaster && kingdom.disaster.geoState && kingdom.disaster.geoState[disasterName]) || "normal";
    select.value = currentState;

    select.addEventListener("change", (e) => {
      if (!kingdom.disaster) kingdom.disaster = { geoState: {} };
      kingdom.disaster.geoState[disasterName] = e.target.value;
      updateDisasterDescriptions();
    });

    disasterWrapper.appendChild(label);
    disasterWrapper.appendChild(select);
    disasterContainer.appendChild(disasterWrapper);
  });

  updateDisasterDescriptions();
}

function updateDisasterDescriptions() {
  const descriptionsContainer = document.getElementById("disasterDescriptions");
  descriptionsContainer.innerHTML = "";

  const proneDisasters = Object.entries(kingdom.disaster.geoState)
    .filter(([name, state]) => state === "prone");

  if (proneDisasters.length === 0) {
    descriptionsContainer.innerHTML = "<p class='no-disasters'>No disasters marked as prone</p>";
    return;
  }

  proneDisasters.forEach(([disasterName, state]) => {
    const { description, related } = DISASTERS[disasterName];
    if (description) {
      const descriptionItem = document.createElement("div");
      descriptionItem.className = "disaster-description-item disaster-prone";
      descriptionItem.innerHTML = `
        <h5>${disasterName}</h5>
        <p>${description}</p>
        <h6>Can also trigger:</h6>
        <small><ul>
          ${related.map(item => `<li>${item}</li>`).join("")}
        </ul></small>
      `;
      descriptionsContainer.appendChild(descriptionItem);
    }
  });
}

function loadCloserKingdomsCheckboxes() {
  const closerKingdomsContainer = document.getElementById("closerKingdomsCheckboxes");
  const currentCloserKingdomsContainer = document.getElementById("currentCloserKingdoms");
  
  closerKingdomsContainer.innerHTML = "";
  currentCloserKingdomsContainer.innerHTML = "";

  // Get all other kingdoms (excluding current one)
  const otherKingdoms = Object.keys(kingdoms).filter(kingdomName => kingdomName !== name);

  if (otherKingdoms.length === 0) {
    closerKingdomsContainer.innerHTML = "<p class='no-kingdoms'>No other kingdoms available</p>";
    return;
  }

  // Create checkboxes for each kingdom
  otherKingdoms.forEach(kingdomName => {
    const checkboxWrapper = document.createElement("div");
    checkboxWrapper.className = "closer-kingdom-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `closer-${kingdomName.replace(/\s+/g, '-').toLowerCase()}`;
    checkbox.value = kingdomName;
    checkbox.checked = kingdom.closerKingdoms.includes(kingdomName);

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = kingdomName;
    label.className = "closer-kingdom-label";

    checkbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        // Add connection from current kingdom to selected kingdom
        if (!kingdom.closerKingdoms.includes(kingdomName)) {
          kingdom.closerKingdoms.push(kingdomName);
        }
        
        // Add bidirectional connection - add current kingdom to the selected kingdom's closerKingdoms
        if (kingdoms[kingdomName]) {
          if (!kingdoms[kingdomName].closerKingdoms) {
            kingdoms[kingdomName].closerKingdoms = [];
          }
          if (!kingdoms[kingdomName].closerKingdoms.includes(name)) {
            kingdoms[kingdomName].closerKingdoms.push(name);
          }
        }
      } else {
        // Remove connection from current kingdom to selected kingdom
        kingdom.closerKingdoms = kingdom.closerKingdoms.filter(k => k !== kingdomName);
        
        // Remove bidirectional connection - remove current kingdom from selected kingdom's closerKingdoms
        if (kingdoms[kingdomName] && kingdoms[kingdomName].closerKingdoms) {
          kingdoms[kingdomName].closerKingdoms = kingdoms[kingdomName].closerKingdoms.filter(k => k !== name);
        }
      }
      updateCurrentCloserKingdomsDisplay();
    });

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(label);
    closerKingdomsContainer.appendChild(checkboxWrapper);
  });

  updateCurrentCloserKingdomsDisplay();
}

function updateCurrentCloserKingdomsDisplay() {
  const currentCloserKingdomsContainer = document.getElementById("currentCloserKingdoms");
  
  if (kingdom.closerKingdoms.length === 0) {
    currentCloserKingdomsContainer.innerHTML = "<p class='no-connections'>No closer kingdoms selected</p>";
    return;
  }

  const connectionsDiv = document.createElement("div");
  connectionsDiv.className = "current-connections";
  connectionsDiv.innerHTML = `
    <h4>Current Connections:</h4>
    <div class="connections-list">
      ${kingdom.closerKingdoms.map(kingdomName => 
        `<span class="connection-tag">🔗 ${kingdomName}</span>`
      ).join('')}
    </div>
    <p class="connection-info">
      <small>Disasters can spread between connected kingdoms with 50% chance and 60% power.</small>
    </p>
  `;
  
  currentCloserKingdomsContainer.innerHTML = '';
  currentCloserKingdomsContainer.appendChild(connectionsDiv);
}

function loadFoodConsumptionTier() {
  const tax = pciInput.value * (taxRateInput.value / 100)
  const landRent = calculateLandPrice(3.5, kingdom, "rent")
  const savedIncome = pciInput.value - tax - landRent
  const foodBudget = savedIncome * 0.5
  const foodConsumptionTier = getFoodTierForBudget(foodBudget)
  const tierLabel = document.getElementById("peopleFoodBudget");
  const tier = foodConsumptionTier.replace("gen-food-", "").replace("-", " - ")
  tierLabel.innerHTML = `<b>${tier}</b> ($${items[foodConsumptionTier].meta.budget})`;
}

function updateDisplay() {
  const area = parseFloat(landAreaInput.value) || 0;
  const density = parseFloat(densityInput.value) || 0;
  const pci = parseFloat(pciInput.value) || 0;
  const taxRate = (parseFloat(taxRateInput.value) || 0) / 100;
  const population = Math.floor(area * density);
  const populationGrowth = getPopulationGrowth(kingdom)
  const birthCount = calculateBirthCount(kingdom)
  const totalDeathCount = getTotalDeathCount(kingdom)
  const diedForAge = getDiedForAge(kingdom)
  const diedForHospital = getDiedForHospital(kingdom)
  const diedForSecurity = getDiedForSecurity(kingdom)

  const totalUsedLand =
    calculateBuildUsedLandArea(kingdom) +
    calculatePeopleUsedLandArea(population, pci, taxRate);
  const freeLand = Math.max(area - totalUsedLand, 0);
  const landCost = calculateLandPrice(
    parseInt(priceForAreaInput.value),
    kingdom,
    parseInt(landCostMethod.value),
    landQuality.value
  );
  const tax = calculateTax(kingdom);

  birthRateInput.value = kingdom.birthRate
  birthCountLabel.textContent = birthCount.toLocaleString();


  priceForAreaInput.max = freeLand
  taxRateValue.textContent = taxRateInput.value;

  populationLabel.textContent = population.toLocaleString();
  populationBar.style.width = Math.min((population / (totalUsedLand * 2)) * 100, 100) + "%";

  populationGrowthLabel.textContent = populationGrowth.toLocaleString();

  //populationGrowthBar.style.width = ( populationGrowth / population) * 100 + "%";
  let populationGrowthRatio = (populationGrowth + population) / (2 * population);
  let populationGrowthBarWidth = populationGrowthRatio * 100;
  // clamp to 0–100 just in case
  populationGrowthBarWidth = Math.max(0, Math.min(100, populationGrowthBarWidth));
  populationGrowthBar.style.width = populationGrowthBarWidth + "%";

  if (populationGrowth < 0) {
    populationGrowthBar.classList.add("red")
  } else {
    populationGrowthBar.classList.remove("red")
  }

  totalDeathCountLabel.textContent = totalDeathCount.toLocaleString();

  diedForAgeLabel.textContent = diedForAge.toLocaleString()
  diedForAgeBar.style.width = ((diedForAge * 100) / totalDeathCount) + "%";

  diedForHospitalLabel.textContent = diedForHospital.toLocaleString()
  diedForHospitalBar.style.width = ((diedForHospital * 100) / totalDeathCount) + "%";

  diedForSecurityLabel.textContent = diedForSecurity.toLocaleString()
  diedForSecurityBar.style.width = ((diedForSecurity * 100) / totalDeathCount) + "%";


  taxLabel.textContent = tax.toLocaleString();
  taxBar.style.width = Math.min((tax / 2000) * 100, 100) + "%";

  usedLandLabel.textContent = totalUsedLand.toFixed(2);
  freeLandLabel.textContent = freeLand.toFixed(2);
  landCostLabel.textContent = landCost.toLocaleString();

  loadFoodConsumptionTier();
}

priceForAreaInput.addEventListener("change", updateDisplay);
landAreaInput.addEventListener("input", updateDisplay);
densityInput.addEventListener("input", updateDisplay);
pciInput.addEventListener("input", updateDisplay);
taxRateInput.addEventListener("input", updateDisplay);
landCostMethod.addEventListener("change", updateDisplay);

birthRateInput.onchange = () => {
  kingdom.birthRate = birthRateInput.value
  updateDisplay()
}
saveBtn.addEventListener("click", () => {
  const area = parseFloat(landAreaInput.value) || 0;
  const density = parseFloat(densityInput.value) || 0;
  const pci = parseFloat(pciInput.value) || 0;
  const taxRate = (parseFloat(taxRateInput.value) || 0) / 100;

  const kingdoms = localStorage.getItem("kingdoms")
    ? JSON.parse(localStorage.getItem("kingdoms"))
    : {};
  const kingdom = kingdoms[name];

  // Update the kingdom
  kingdom.id = name;
  kingdom.landArea = area;
  kingdom.density = density;
  kingdom.pci = pci;
  kingdom.taxRate = taxRate;
  
  // Update the kingdoms object
  kingdoms[name] = kingdom;
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  alert("Kingdom saved!");
});

globalThis.updateCostForLand = function ({ currentTarget }) {
  const landAreaLabel = document.getElementById("landAreaLabel")
  const area = currentTarget.value

  const landCost = calculateLandPrice(
    area,
    kingdom,
    landCostMethod.value
  );

  landAreaLabel.textContent = area
  landCostLabel.textContent = landCost.toLocaleString()
}

document.querySelectorAll(".info-card").forEach((card) => {
  card.addEventListener("click", () => {
    const target = card.getAttribute("data-target");
    if (!name || !target) return;
    // Import navigation utility dynamically
    import('../../assets/js/utils/navigation.js').then(({ Navigation }) => {
      Navigation.goToKingdomSection(name, target);
    });
  });
});

loadDisasterCheckboxes();
loadCloserKingdomsCheckboxes();
updateDisplay();
