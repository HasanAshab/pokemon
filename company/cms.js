import { getAssetCost } from "./utils.js";

  const kingdoms = JSON.parse(localStorage.getItem("kingdoms"))
// Get company name from localStorage (new method) or URL params (fallback)
const companyName = localStorage.getItem('$current_company') || (() => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('company');
})();
const companies = JSON.parse(localStorage.getItem("companies")) || {};
const company = companies[companyName];
if (!company.monthlyChanges) company.monthlyChanges = {}
if (!company.storage) company.storage = {}
let revenueChart;
let chartData = {
  labels: [],
  datasets: [{
    label: 'Monthly Revenue ($)',
    data: [],
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
    borderWidth: 2
  }]
}
let totalMPCost = 0;

// Contract Management
let contracts = company.contracts || [];

// Asset Management
let assets = company.assets || [];
function saveAllData() {
  localStorage.setItem('companies', JSON.stringify(companies));
}

globalThis.processMonthlyChanges = () => {
  const mediumRevenueEstimate = Number(company.revenueEstimates.medium);
  const totalEmployeesSalary = company.employees.reduce((total, employee) => total + (employee.mans * employee.salary), 0);
  const contractProfit = contracts.reduce((total, contract) => total + contract.profit, 0);
  const assetsCost = getAssetCost(companyName);
  const totalIncome = mediumRevenueEstimate + contractProfit - totalEmployeesSalary - assetsCost;

  company.monthlyChanges.coins =  totalIncome;

  renderStorageItems();

}

function updateCoins() {

  const revenueThisMonth = company.revenue.data[company.revenue.data.length - 1] || 0;
  const totalEmployeesSalary = company.employees.reduce((total, employee) => total + (employee.mans * employee.salary), 0);
  const contractProfit = contracts.reduce((total, contract) => total + contract.profit, 0);
  const assetsCost = getAssetCost(companyName);

  const totalIncome = revenueThisMonth + contractProfit - totalEmployeesSalary - assetsCost;
 console.log(contracts, company.employees)
  company.storage.coins = (company.storage.coins || 0) + totalIncome;
  
  renderStorageItems();

}
globalThis.updateWorth = ()=> {
  const medium = parseFloat(document.getElementById('medium').value);
  const worth = !isNaN(medium) ? (medium - totalMPCost) * 70 : 0;
  document.getElementById('companyWorth').textContent = `Total Worth $: ${worth.toLocaleString()}`;
}

function loadData() {
  const savedData = company.revenue;
  if (savedData) {
    const parsedData = savedData;
    chartData.labels = parsedData.labels;
    chartData.datasets[0].data = parsedData.data;
  }

  const savedEstimates = company.revenueEstimates;
  if (savedEstimates) {
    const { low, medium, high } = savedEstimates;
    document.getElementById('low').value = low;
    document.getElementById('medium').value = medium;
    document.getElementById('high').value = high;
    updateWorth(); // Refresh worth on load
  }
}

globalThis.saveEstimates =()=> {
  const low = document.getElementById('low').value;
  const medium = document.getElementById('medium').value;
  const high = document.getElementById('high').value;
  company.revenueEstimates = { low, medium, high };
  saveAllData();
}

function saveChartData() {
  const dataToSave = {
    labels: chartData.labels,
    data: chartData.datasets[0].data
  };
  company.revenue = dataToSave;
  saveAllData();
}

globalThis.addRevenue =()=> {
  const low = parseFloat(document.getElementById('low').value);
  const medium = parseFloat(document.getElementById('medium').value);
  const high = parseFloat(document.getElementById('high').value);

  if (!low || !medium || !high) {
    alert('Please fill all three estimates!');
    return;
  }

  const options = [low, medium, high];
  const selectedRevenue = options[Math.floor(Math.random() * options.length)];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const nextMonth = chartData.labels.length % 12;

  chartData.labels.push(monthNames[nextMonth]);
  chartData.datasets[0].data.push(selectedRevenue);

  revenueChart.update();
  saveChartData();
  updateCoins();
}

globalThis.deleteLastMonthRevenue = ()=> {
    company.revenue.labels.pop();
    company.revenue.data.pop();
    saveAllData();
    document.getElementById('companyWorth').textContent = 'Total Worth $: 0';
    revenueChart.update();
}

// Employee Salary Management
let employees = company.employees || [];

function formatNumber(num) {
  return num.toLocaleString();
}

function renderTable() {
  const tbody = document.querySelector("#salaryTable tbody");
  tbody.innerHTML = "";
  let total = 0;

  employees.forEach((emp, index) => {
    const row = document.createElement("tr");
    const totalSalary = emp.mans * emp.salary;
    total += totalSalary;

    row.innerHTML = `
                    <td contenteditable="true" data-field="post" data-index="${index}">${emp.post}</td>
                    <td contenteditable="true" data-field="mans" data-index="${index}">${emp.mans}</td>
                    <td contenteditable="true" data-field="salary" data-index="${index}">${formatNumber(emp.salary)}</td>
                    <td>${formatNumber(totalSalary)}</td>
                    <td>
                      <button class="delete-btn" onclick="removeRow(${index})">Remove</button>
                    </td>
                `;
    tbody.appendChild(row);
  });

  // Add event listeners for inline editing
  tbody.querySelectorAll('[contenteditable="true"]').forEach(cell => {
    cell.addEventListener('blur', handleEmployeeEdit);
    cell.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
  });

  document.getElementById("totalSalary").textContent = formatNumber(total);
  totalMPCost = total;
  saveAllData();
}

globalThis.addRow = function() {
  const post = document.getElementById("newPost").value;
  const mans = parseInt(document.getElementById("newMans").value);
  const salary = parseInt(document.getElementById("newSalary").value);

  if (!post || isNaN(mans) || isNaN(salary)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  employees.push({ post, mans, salary });
  renderTable();

  document.getElementById("newPost").value = "";
  document.getElementById("newMans").value = "";
  document.getElementById("newSalary").value = "";
}

globalThis.removeRow = function(index) {
  employees.splice(index, 1);
  renderTable();
}

function handleEmployeeEdit(e) {
  const index = parseInt(e.target.dataset.index);
  const field = e.target.dataset.field;
  let value = e.target.textContent.trim();

  if (field === 'mans' || field === 'salary') {
    // Remove formatting for numbers
    value = value.replace(/,/g, '');
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      alert('Please enter a valid positive number');
      renderTable();
      return;
    }
    employees[index][field] = numValue;
  } else {
    if (!value) {
      alert('Field cannot be empty');
      renderTable();
      return;
    }
    employees[index][field] = value;
  }

  renderTable();
}

// Contract Management Functions
function renderContractsTable() {
  const tbody = document.querySelector("#contractTable tbody");
  tbody.innerHTML = "";
  let totalProfit = 0;

  contracts.forEach((contract, index) => {
    const row = document.createElement("tr");
    totalProfit += contract.profit;

    row.innerHTML = `
                    <td contenteditable="true" data-field="name" data-index="${index}">${contract.name}</td>
                    <td contenteditable="true" data-field="profit" data-index="${index}">${formatNumber(contract.profit)}</td>
                    <td>
                      <button class="delete-btn" onclick="removeContract(${index})">Remove</button>
                    </td>
                `;
    tbody.appendChild(row);
  });

  // Add event listeners for inline editing
  tbody.querySelectorAll('[contenteditable="true"]').forEach(cell => {
    cell.addEventListener('blur', handleContractEdit);
    cell.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
  });

  document.getElementById("totalProfit").textContent = formatNumber(totalProfit);
  saveAllData();
}

globalThis.addContract = function() {
  const name = document.getElementById("contractName").value.trim();
  const profit = parseFloat(document.getElementById("contractProfit").value);

  if (!name || isNaN(profit)) {
    alert("Please enter valid contract name and profit.");
    return;
  }

  contracts.push({ name, profit });
  renderContractsTable();

  document.getElementById("contractName").value = "";
  document.getElementById("contractProfit").value = "";
}

globalThis.removeContract = function(index) {
  contracts.splice(index, 1);
  renderContractsTable();
}

function handleContractEdit(e) {
  const index = parseInt(e.target.dataset.index);
  const field = e.target.dataset.field;
  let value = e.target.textContent.trim();

  if (field === 'profit') {
    // Remove formatting for numbers
    value = value.replace(/,/g, '');
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      alert('Please enter a valid number');
      renderContractsTable();
      return;
    }
    contracts[index][field] = numValue;
  } else {
    if (!value) {
      alert('Field cannot be empty');
      renderContractsTable();
      return;
    }
    contracts[index][field] = value;
  }

  renderContractsTable();
}
function getAssetRent(asset) {
  const kingdom = kingdoms[asset.kingdom];
  const totalSize = Number(asset.size) * Number(asset.quantity)
  let rent = calculateLandPrice(totalSize, kingdom, "rent");

  // console.log(rent, kingdom);
  
  return rent
}
function loadKingdomsDataList() {
  const kingdomsDataList = document.getElementById("kingdoms-data-list");
  
 kingdomsDataList.innerHTML =  Object.keys(kingdoms).map(id => `<option value="${id}">${id}</option>`).join("");
}
// Asset Management Functions
function renderAssetsTable() {
  const tbody = document.querySelector("#assetTable tbody");
  tbody.innerHTML = "";
  let totalRent = 0;

  assets.forEach((asset, index) => {
    const row = document.createElement("tr");
    const rent = getAssetRent(asset);
    totalRent += rent;
    row.innerHTML = `
                    <td contenteditable="true" data-field="name" data-index="${index}">${asset.name}</td>
                    <td contenteditable="true" data-field="kingdom" data-index="${index}">${asset.kingdom}</td>
                    <td contenteditable="true" data-field="quantity" data-index="${index}">${asset.quantity}</td>
                    <td contenteditable="true" data-field="size" data-index="${index}">${asset.size}</td>
                    <td>${formatNumber(rent)}</td>
                    <td>
                      <button class="delete-btn" onclick="removeAsset(${index})">Remove</button>
                    </td>
                `;
    tbody.appendChild(row);
  });

  // Add event listeners for inline editing
  tbody.querySelectorAll('[contenteditable="true"]').forEach(cell => {
    cell.addEventListener('blur', handleAssetEdit);
    cell.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
  });

  document.getElementById("totalAssetRent").textContent = formatNumber(totalRent);
  saveAllData();
}

globalThis.addAsset = function() {
  const name = document.getElementById("assetName").value.trim();
  const kingdom = document.getElementById("assetKingdom").value;
  const quantity = parseInt(document.getElementById("assetQuantity").value);
  const km = parseInt(document.getElementById("assetKm").value);
  if (!name || !kingdom || isNaN(quantity) || isNaN(km)) {
    alert("Please enter valid asset name and rent.");
    return;
  }

  assets.push({ name, kingdom, quantity, size: km });
  renderAssetsTable();

  document.getElementById("assetName").value = "";
  document.getElementById("assetKingdom").value = "";
  document.getElementById("assetQuantity").value = "";
  document.getElementById("assetKm").value = "";
}

globalThis.removeAsset = function removeAsset(index) {
  assets.splice(index, 1);
  renderAssetsTable();
}

function handleAssetEdit(e) {
  const index = parseInt(e.target.dataset.index);
  const field = e.target.dataset.field;
  let value = e.target.textContent.trim();

  if (field === 'quantity' || field === 'size') {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      alert('Please enter a valid positive number');
      renderAssetsTable();
      return;
    }
    assets[index][field] = numValue;
  } else {
    if (!value) {
      alert('Field cannot be empty');
      renderAssetsTable();
      return;
    }
    assets[index][field] = value;
  }

  renderAssetsTable();
}

// Storage Management System
let storage = company.storage || {};
let monthlyChanges = company.monthlyChanges || {};

function renderStorageItems() {
  const itemsContainer = document.getElementById('itemsContainer');
  itemsContainer.innerHTML = '';

  // Ensure all items with monthly changes are in storage
  Object.keys(monthlyChanges).forEach(itemName => {
    if (!(itemName in storage)) {
      storage[itemName] = 0;
    }
  });

  Object.keys(storage).forEach(itemName => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'storage-item';

    const nameDiv = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Item Name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = itemName;
    nameInput.addEventListener('blur', () => handleStorageItemEdit(itemName, 'name', nameInput.value));
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameInput.blur();
      }
    });
    nameDiv.appendChild(nameLabel);
    nameDiv.appendChild(nameInput);
   
    const quantityDiv = document.createElement('div');
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Quantity';
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.value = storage[itemName];
    quantityInput.addEventListener('blur', () => handleStorageItemEdit(itemName, 'quantity', quantityInput.value));
    quantityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        quantityInput.blur();
      }
    });
    quantityDiv.appendChild(quantityLabel);
    quantityDiv.appendChild(quantityInput);

    const changeDiv = document.createElement('div');
    const changeLabel = document.createElement('label');
    changeLabel.textContent = 'Monthly Change';
    const changeInput = document.createElement('input');
    changeInput.type = 'number';
    changeInput.value = monthlyChanges[itemName] || 0;
    changeInput.placeholder = '0';
    changeInput.addEventListener('blur', () => handleStorageItemEdit(itemName, 'change', changeInput.value));
    changeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        changeInput.blur();
      }
    });
    changeDiv.appendChild(changeLabel);
    changeDiv.appendChild(changeInput);

    const changeDisplay = document.createElement('div');
    const changeValue = monthlyChanges[itemName] || 0;
    changeDisplay.className = 'monthly-change';
    if (changeValue > 0) {
      changeDisplay.className += ' change-positive';
      changeDisplay.textContent = `+${changeValue.toLocaleString()}`;
    } else if (changeValue < 0) {
      changeDisplay.className += ' change-negative';
      changeDisplay.textContent = `${changeValue.toLocaleString()}`;
    } else {
      changeDisplay.className += ' change-neutral';
      changeDisplay.textContent = '0';
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'storage-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn secondary-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
      if (confirm(`Delete item "${itemName}"?`)) {
        delete storage[itemName];
        delete monthlyChanges[itemName];
        company.storage = storage;
        company.monthlyChanges = monthlyChanges;
        saveAllData();
        renderStorageItems();
      }
    };

    actionsDiv.appendChild(deleteBtn);

    itemDiv.appendChild(nameDiv);
    itemDiv.appendChild(quantityDiv);
    itemDiv.appendChild(changeDiv);
    itemDiv.appendChild(changeDisplay);
    itemDiv.appendChild(actionsDiv);

    itemsContainer.appendChild(itemDiv);
  });
}

function handleStorageItemEdit(originalItemName, field, newValue) {
  const trimmedValue = newValue.trim();
  
  if (field === 'name') {
    if (!trimmedValue) {
      alert('Item name cannot be empty');
      renderStorageItems();
      return;
    }
    
    if (trimmedValue !== originalItemName) {
      // Check if new name already exists
      if (storage[trimmedValue] !== undefined) {
        alert('Item with this name already exists');
        renderStorageItems();
        return;
      }
      
      // Move data to new name
      storage[trimmedValue] = storage[originalItemName];
      monthlyChanges[trimmedValue] = monthlyChanges[originalItemName] || 0;
      
      // Remove old entries
      delete storage[originalItemName];
      delete monthlyChanges[originalItemName];
    }
  } else if (field === 'quantity') {
    const quantity = parseInt(trimmedValue) || 0;
    storage[originalItemName] = quantity;
  } else if (field === 'change') {
    const change = parseInt(trimmedValue) || 0;
    monthlyChanges[originalItemName] = change;
  }
  
  company.storage = storage;
  company.monthlyChanges = monthlyChanges;
  saveAllData();
  renderStorageItems();
}

globalThis.addNewStorageItem = function () {
  const itemName = prompt('Enter new item name:');
  if (!itemName || !itemName.trim()) {
    return;
  }

  const trimmedName = itemName.trim();
  if (storage[trimmedName] !== undefined) {
    alert('Item already exists');
    return;
  }

  storage[trimmedName] = 0;
  monthlyChanges[trimmedName] = 0;
  company.storage = storage;
  company.monthlyChanges = monthlyChanges;
  saveAllData();
  renderStorageItems();
}


// Initialize everything on page load
window.onload = function () {
  //   setting company name
  document.getElementById('companyName').textContent = companyName;

  renderTable();
  loadData();
  renderContractsTable();
  loadKingdomsDataList();
  // renderAssetsTable();
  processMonthlyChanges();

  // Add event listeners for storage system
  document.getElementById('addItemBtn').onclick = addNewStorageItem;

  const ctx = document.getElementById('revenueChart').getContext('2d');
  revenueChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}