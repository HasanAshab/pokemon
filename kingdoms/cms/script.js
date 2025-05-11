import { calculateTax, calculateBuildUsedLandArea, calculatePeopleUsedLandArea } from '../utils.js'


const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');

const landAreaInput = document.getElementById('landArea');
const densityInput = document.getElementById('density');
const pciInput = document.getElementById('pci');
const taxRateInput = document.getElementById('taxRate');
const taxRateValue = document.getElementById('taxRateValue');

const kingdomName = document.getElementById('kingdomName');
const populationLabel = document.getElementById('populationLabel');
const populationBar = document.getElementById('populationBar');
const taxLabel = document.getElementById('taxLabel');
const taxBar = document.getElementById('taxBar');
const usedLandLabel = document.getElementById('usedLandLabel');
const freeLandLabel = document.getElementById('freeLandLabel');
const saveBtn = document.getElementById('saveBtn');

kingdomName.textContent = name || 'Unknown Kingdom';

let kingdoms = JSON.parse(localStorage.getItem('kingdoms') || '{}');
let kingdom = kingdoms[name] || {
  landArea: 1000,
  density: 100,
  pci: 50,
  taxRate: 0.3
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
  const totalUsedLand = calculateBuildUsedLandArea(kingdom) + calculatePeopleUsedLandArea(population, pci, taxRate);
  const freeLand = Math.max(area - totalUsedLand, 0);

  const tax = calculateTax(kingdom);

  taxRateValue.textContent = taxRateInput.value;

  populationLabel.textContent = population.toLocaleString();
  populationBar.style.width = Math.min(population / 10000 * 100, 100) + '%';

  taxLabel.textContent = tax.toLocaleString();
  taxBar.style.width = Math.min(tax / 2000 * 100, 100) + '%';

  usedLandLabel.textContent = totalUsedLand.toFixed(2);
  freeLandLabel.textContent = freeLand.toFixed(2);
}

landAreaInput.addEventListener('input', updateDisplay);
densityInput.addEventListener('input', updateDisplay);
pciInput.addEventListener('input', updateDisplay);
taxRateInput.addEventListener('input', updateDisplay);

saveBtn.addEventListener('click', () => {
  const area = parseFloat(landAreaInput.value) || 0;
  const density = parseFloat(densityInput.value) || 0;
  const pci = parseFloat(pciInput.value) || 0;
  const taxRate = (parseFloat(taxRateInput.value) || 0) / 100;

  kingdom.landArea = area
  kingdom.density = density
  kingdom.pci = pci
  kingdom.taxRate = taxRate
  localStorage.setItem('kingdoms', JSON.stringify(kingdoms));
  alert('Kingdom saved!');
});

document.querySelectorAll('.info-card').forEach(card => {
  card.addEventListener('click', () => {
    const target = card.getAttribute('data-target');
    if (!name || !target) return;
    const encoded = encodeURIComponent(name);
    window.location.href = `/kingdoms/cms/${target}/?name=${encoded}`;
  });
});


updateDisplay();
