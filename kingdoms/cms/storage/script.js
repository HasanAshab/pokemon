import { sumObj, calcNetProd, getStorage, getTransLogs, getPopulation, getPopulationGrowth, getMaintainedStorage } from '../../utils.js';

// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("name");
})();
const kingdomNameEl = document.getElementById("kingdomName");
const itemsContainer = document.getElementById("itemsContainer");
const addItemBtn = document.getElementById("addItemBtn");

kingdomNameEl.textContent = name ? `${name}'s Storage` : "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].storage) kingdoms[name].storage = {};
if (!kingdoms[name].lifetime) kingdoms[name].lifetime = { years: 0, months: 0 };
if (!kingdoms[name].marketplace) kingdoms[name].marketplace = [];

function saveAndRefresh(storage) {
  Object.keys(getMaintainedStorage(kingdoms[name])).forEach(item => {
    storage[item] = 0;
  })

  kingdoms[name].storage = storage;
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderItems();
}

function renderItems() {
  const storage = getStorage(kingdoms[name]);
  const netProd = calcNetProd(kingdoms[name]);

  // Add missing netProd items to storage with 0 quantity
  Object.keys(netProd).forEach(key => {
    if (!(key in storage)) {
      storage[key] = 0;
    }
  });

  itemsContainer.innerHTML = "";

  Object.keys(storage).forEach(itemName => {
    const div = document.createElement("div");
    div.className = "item";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Item Name";

    const nameInput = document.createElement("input");
    nameInput.value = itemName;

    const qtyLabel = document.createElement("label");
    qtyLabel.textContent = "Quantity";

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.value = storage[itemName];

    const prodSpan = document.createElement("span");
    prodSpan.className = "production";
    const rawVal = parseInt(netProd[itemName] || 0);
    prodSpan.textContent = rawVal >= 0 ? `+${rawVal.toLocaleString()}` : rawVal.toLocaleString();
    prodSpan.classList.add(rawVal >= 0 ? "prod-positive" : "prod-negative");

    const itemActions = document.createElement("div");
    itemActions.className = "item-actions";

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn primary-btn";
    saveBtn.textContent = "Save";
    saveBtn.onclick = () => {
      const newName = nameInput.value.trim();
      let quantity = parseInt(qtyInput.value) || 0;

      if (newName !== itemName) {
        delete storage[itemName];
      }

      if (newName === "coins") {
        quantity = parseInt(quantity)
      }

      storage[newName] = quantity;

      saveAndRefresh(storage);
    };
    
    const operateBtn = document.createElement("button");
    operateBtn.className = "btn special-btn";
    operateBtn.textContent = "Operate (+)";
    operateBtn.onclick = () => {
      const quantity = parseInt(qtyInput.value) || 0;
      const amount = window.prompt("Enter the amount to add:");
      if (!amount) return
        
      qtyInput.value = quantity + parseInt(amount);
      saveBtn.click();
    };

    const delBtn = document.createElement("button");
    delBtn.className = "btn secondary-btn";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      delete storage[itemName];
      saveAndRefresh(storage);
    };

    itemActions.appendChild(saveBtn);
    itemActions.appendChild(operateBtn);
    itemActions.appendChild(delBtn);

    const logs = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Logs";
    const logsList = document.createElement("ul");
    const logItems = getTransLogs(kingdoms[name], itemName);
    logItems.forEach(item => {
      const logItem = document.createElement("li");
      logItem.innerHTML = item;
      logsList.appendChild(logItem);
    });
    logs.appendChild(summary);
    logs.appendChild(logsList);

    div.appendChild(nameLabel);
    div.appendChild(nameInput);
    div.appendChild(qtyLabel);
    div.appendChild(qtyInput);
    div.appendChild(prodSpan);
    div.appendChild(logs);
    div.appendChild(itemActions);

    itemsContainer.appendChild(div);
  });
}

addItemBtn.onclick = () => {
  kingdoms[name].storage["New Item"] = 0;
  saveAndRefresh(kingdoms[name].storage);
};

const newMonthBtn = document.getElementById("newMonthBtn");
newMonthBtn.onclick = () => {
  const netProd = calcNetProd(kingdoms[name]);
  kingdoms[name].storage = sumObj(kingdoms[name].storage, netProd)

  const newDensity = (getPopulation(kingdoms[name]) + getPopulationGrowth(kingdoms[name])) / kingdoms[name].landArea
  kingdoms[name].density = newDensity 

  // Update building expiry
  if (kingdoms[name].buildings) {
    kingdoms[name].buildings.forEach(building => {
      if (building.lifespan !== undefined && building.lifespan > 0) {
        building.lifespan--;
        if (building.lifespan <= 0) {
          building.state = "disabled";
          building.expired = true;
        }
      }
    });
  }

  // Reduce event countdowns
  if (kingdoms[name].events && kingdoms[name].events.future) {
    kingdoms[name].events.future.forEach(event => {
      event.remainingMonths = Math.max(0, event.remainingMonths - 1);
    });
  }

  // Increment lifetime counter
  kingdoms[name].lifetime.months++;
  if (kingdoms[name].lifetime.months >= 12) {
    kingdoms[name].lifetime.years++;
    kingdoms[name].lifetime.months = 0;
  }

  saveAndRefresh(kingdoms[name].storage);
  updateLifetimeDisplay();
};

// Lifetime tracking functions
function updateLifetimeDisplay() {
  const yearsInput = document.getElementById('lifetimeYears');
  const monthsInput = document.getElementById('lifetimeMonths');
  
  if (yearsInput && monthsInput) {
    yearsInput.value = kingdoms[name].lifetime.years;
    monthsInput.value = kingdoms[name].lifetime.months;
  }
}

function updateLifetime() {
  const years = parseInt(document.getElementById('lifetimeYears').value) || 0;
  const months = parseInt(document.getElementById('lifetimeMonths').value) || 0;
  
  if (months >= 12) {
    alert('Months should be less than 12. Use years for values 12 and above.');
    document.getElementById('lifetimeMonths').value = kingdoms[name].lifetime.months;
    return;
  }
  
  kingdoms[name].lifetime.years = years;
  kingdoms[name].lifetime.months = months;
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
}

// Auto-save lifetime on blur
function setupLifetimeAutoSave() {
  const yearsInput = document.getElementById('lifetimeYears');
  const monthsInput = document.getElementById('lifetimeMonths');
  
  if (yearsInput && monthsInput) {
    yearsInput.addEventListener('blur', updateLifetime);
    monthsInput.addEventListener('blur', updateLifetime);
    
    yearsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        yearsInput.blur();
      }
    });
    
    monthsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        monthsInput.blur();
      }
    });
  }
}


renderItems();
updateLifetimeDisplay();
setupLifetimeAutoSave();
setupTabs();
setupMarketplace();

// Tab functionality
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      document.getElementById(targetTab + 'Tab').classList.add('active');
      
      // Update marketplace items dropdown when switching to marketplace tab
      if (targetTab === 'marketplace') {
        updateMarketplaceItemsDropdown();
      }
    });
  });
}

// Marketplace functionality
function setupMarketplace() {
  const sellAllCheckbox = document.getElementById('sellAll');
  const quantityGroup = document.getElementById('quantityGroup');
  const addMarketItemBtn = document.getElementById('addMarketItemBtn');
  
  // Toggle quantity input based on "Sell All" checkbox
  sellAllCheckbox.addEventListener('change', () => {
    if (sellAllCheckbox.checked) {
      quantityGroup.style.display = 'none';
    } else {
      quantityGroup.style.display = 'block';
    }
  });
  
  // Add marketplace item
  addMarketItemBtn.addEventListener('click', addMarketplaceItem);
  
  // Initial render
  updateMarketplaceItemsDropdown();
  renderMarketplace();
}

function updateMarketplaceItemsDropdown() {
  const select = document.getElementById('marketItemSelect');
  const storage = getStorage(kingdoms[name]);
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="">Select an item</option>';
  
  // Add storage items to dropdown
  Object.keys(storage).forEach(itemName => {
    const option = document.createElement('option');
    option.value = itemName;
    option.textContent = `${itemName} (${storage[itemName].toLocaleString()})`;
    select.appendChild(option);
  });
}

function addMarketplaceItem() {
  const itemSelect = document.getElementById('marketItemSelect');
  const unitPriceInput = document.getElementById('unitPrice');
  const sellAllCheckbox = document.getElementById('sellAll');
  const quantityInput = document.getElementById('quantity');
  
  const itemName = itemSelect.value;
  const unitPrice = parseFloat(unitPriceInput.value);
  const sellAll = sellAllCheckbox.checked;
  const quantity = parseInt(quantityInput.value) || 1;
  
  if (!itemName) {
    alert('Please select an item');
    return;
  }
  
  if (isNaN(unitPrice)) {
    alert('Please enter a valid unit price');
    return;
  }
  
  const storage = getStorage(kingdoms[name]);
  if (!storage[itemName] || storage[itemName] <= 0) {
    alert('Item not available in storage or quantity is 0');
    return;
  }
  
  if (!sellAll && (quantity <= 0 || quantity > storage[itemName])) {
    alert(`Invalid quantity. Available: ${storage[itemName]}`);
    return;
  }
  
  // Check if item already exists in marketplace
  const existingIndex = kingdoms[name].marketplace.findIndex(item => item.itemName === itemName);
  
  const marketItem = {
    itemName,
    unitPrice,
    sellAll,
    quantity: sellAll ? storage[itemName] : quantity
  };
  
  if (existingIndex !== -1) {
    // Update existing item
    kingdoms[name].marketplace[existingIndex] = marketItem;
  } else {
    // Add new item
    kingdoms[name].marketplace.push(marketItem);
  }
  
  // Clear form
  itemSelect.value = '';
  unitPriceInput.value = '';
  sellAllCheckbox.checked = false;
  quantityInput.value = '1';
  quantityInput.parentElement.style.display = 'block';
  
  // Save and refresh
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderMarketplace();
}

function removeMarketplaceItem(index) {
  if (confirm('Remove this item from marketplace?')) {
    kingdoms[name].marketplace.splice(index, 1);
    localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
    renderMarketplace();
  }
}

function renderMarketplace() {
  const tableBody = document.getElementById('marketplaceTableBody');
  const overallProfitValue = document.getElementById('overallProfitValue');
  const storage = getStorage(kingdoms[name]);
  
  tableBody.innerHTML = '';
  let totalProfit = 0;
  
  kingdoms[name].marketplace.forEach((item, index) => {
    const row = document.createElement('tr');
    
    // Update quantity if "Sell All" is checked
    const actualQuantity = item.sellAll ? (storage[item.itemName] || 0) : item.quantity;
    const totalItemProfit = actualQuantity * item.unitPrice;
    totalProfit += totalItemProfit;
    
    // Determine profit class
    let profitClass = 'profit-neutral';
    if (totalItemProfit > 0) profitClass = 'profit-positive';
    else if (totalItemProfit < 0) profitClass = 'profit-negative';
    
    row.innerHTML = `
      <td>${item.itemName}</td>
      <td>${item.unitPrice >= 0 ? '$' : '-$'}${Math.abs(item.unitPrice).toLocaleString()}</td>
      <td>${actualQuantity.toLocaleString()}${item.sellAll ? ' (All)' : ''}</td>
      <td class="${profitClass}">${totalItemProfit >= 0 ? '$' : '-$'}${Math.abs(totalItemProfit).toLocaleString()}</td>
      <td>
        <button class="btn danger-btn" onclick="removeMarketplaceItem(${index})" style="padding: 4px 8px; font-size: 12px;">Remove</button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Update overall profit
  let overallProfitClass = 'profit-neutral';
  if (totalProfit > 0) overallProfitClass = 'profit-positive';
  else if (totalProfit < 0) overallProfitClass = 'profit-negative';
  
  overallProfitValue.textContent = `${totalProfit >= 0 ? '$' : '-$'}${Math.abs(totalProfit).toLocaleString()}`;
  overallProfitValue.className = overallProfitClass;
  
  // Show message if no items
  if (kingdoms[name].marketplace.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" style="text-align: center; color: #6c757d; font-style: italic;">No items in marketplace</td>';
    tableBody.appendChild(row);
  }
}

// Make removeMarketplaceItem globally available
globalThis.removeMarketplaceItem = removeMarketplaceItem;