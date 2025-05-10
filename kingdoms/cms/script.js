const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');

const landAreaInput = document.getElementById('landArea');
const densityInput = document.getElementById('density');
const kingdomName = document.getElementById('kingdomName');
const populationLabel = document.getElementById('populationLabel');
const populationBar = document.getElementById('populationBar');
const taxLabel = document.getElementById('taxLabel');
const taxBar = document.getElementById('taxBar');
const saveBtn = document.getElementById('saveBtn');
const pciInput = document.getElementById('pci');

kingdomName.textContent = name || 'Unknown Kingdom';

let kingdoms = JSON.parse(localStorage.getItem('kingdoms') || '{}');
let kingdom = kingdoms[name] || { landArea: 1000, density: 100, pci: 50 };

landAreaInput.value = kingdom.landArea;
densityInput.value = kingdom.density;
pciInput.value = kingdom.pci;

// Function to calculate tax based on population and PCI
function calculateTax(population, pci) {
  const taxRate = 0.3; // Tax rate 30%
  const totalIncome = population * pci;
  return Math.floor(totalIncome * taxRate);
}

function updateDisplay() {
  const area = parseFloat(landAreaInput.value) || 0;
  const density = parseFloat(densityInput.value) || 0;
  const population = area * density;
  const pci = parseFloat(pciInput.value) || 0; // Make sure PCI is considered in calculations

  const tax = calculateTax(population, pci);

  populationLabel.textContent = population.toLocaleString();
  populationBar.style.width = Math.min(population / 10000 * 100, 100) + '%'; // Adjust width based on population

  taxLabel.textContent = tax.toLocaleString();
  taxBar.style.width = Math.min(tax / 2000 * 100, 100) + '%'; // Adjust width based on tax
}

// Event listeners to update on input changes
landAreaInput.addEventListener('input', updateDisplay);
densityInput.addEventListener('input', updateDisplay);
pciInput.addEventListener('input', updateDisplay); // Ensure PCI updates the display as well

// Save the updated kingdom data to localStorage
saveBtn.addEventListener('click', () => {
  const area = parseFloat(landAreaInput.value) || 0;
  const density = parseFloat(densityInput.value) || 0;
  const pci = parseFloat(pciInput.value) || 0;

  kingdoms[name] = { landArea: area, density, pci };
  localStorage.setItem('kingdoms', JSON.stringify(kingdoms));
  alert('Kingdom saved!');
});

// Initialize the display
updateDisplay();
