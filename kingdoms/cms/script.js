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
  calculateBirthCount
} from "../utils.js";

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get("name");

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
};

landAreaInput.value = kingdom.landArea;
densityInput.value = kingdom.density;
pciInput.value = kingdom.pci;
taxRateInput.value = (kingdom.taxRate * 100).toFixed(0);
taxRateValue.textContent = taxRateInput.value;

function updateDisplay() {
  const area = parseFloat(landAreaInput.value) || 0;
  const density = parseFloat(densityInput.value) || 0;
  const pci = parseFloat(pciInput.value) || 0;
  const taxRate = (parseFloat(taxRateInput.value) || 0) / 100;
  const population = area * density;
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
    landCostMethod.value 
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
   
   if (populationGrowth < 0){
    populationGrowthBar.classList.add("red")
  }else {
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
}

priceForAreaInput.addEventListener("change", updateDisplay);
landAreaInput.addEventListener("input", updateDisplay);
densityInput.addEventListener("input", updateDisplay);
pciInput.addEventListener("input", updateDisplay);
taxRateInput.addEventListener("input", updateDisplay);
landCostMethod.addEventListener("change", updateDisplay);

birthRateInput.onchange = ()=>{
  kingdom.birthRate = birthRateInput.value
  updateDisplay()
}
saveBtn.addEventListener("click", () => {
  const area = parseFloat(landAreaInput.value) || 0;
  const density = parseFloat(densityInput.value) || 0;
  const pci = parseFloat(pciInput.value) || 0;
  const taxRate = (parseFloat(taxRateInput.value) || 0) / 100;

  kingdom.id = name;
  kingdom.landArea = area;
  kingdom.density = density;
  kingdom.pci = pci;
  kingdom.taxRate = taxRate;
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  alert("Kingdom saved!");
});

globalThis.updateCostForLand = function({currentTarget}){
  const landAreaLabel =  document.getElementById("landAreaLabel")
  const area = currentTarget.value
  const totalKigndomArea = parseFloat(landAreaInput.value) || 0;
  const density = parseFloat(densityInput.value) || 0;
  const pci = parseFloat(pciInput.value) || 0;
  const taxRate = (parseFloat(taxRateInput.value) || 0) / 100;
  const population = totalKigndomArea * density;
  const totalUsedLand =
    calculateBuildUsedLandArea(kingdom) +
    calculatePeopleUsedLandArea(population, pci, taxRate);
  const freeLand = Math.max(totalKigndomArea - totalUsedLand, 0);
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
    const encoded = encodeURIComponent(name);
    window.location.href = `/kingdoms/cms/${target}/?name=${encoded}`;
  });
});

updateDisplay();
