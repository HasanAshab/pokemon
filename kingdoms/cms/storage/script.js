import { sumObj, calcNetProd, getStorage, getTransLogs, getPopulation, getPopulationGrowth, getMaintainedStorage, predictNextDisasters, searchForBeasts } from '../../utils.js';

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
    const netVal = parseInt(netProd[itemName] || 0);
    
    // Calculate base production and marketplace impact for breakdown display
    let baseProduction = netVal;
    let marketplaceImpact = 0;
    let marketplaceCoinProfit = 0;
    
    if (kingdoms[name].marketplace) {
      kingdoms[name].marketplace.forEach(marketItem => {
        if (marketItem.itemName === itemName) {
          if (marketItem.actionType === 'sell') {
            const actualQuantity = marketItem.sellAll ? (storage[itemName] || 0) : marketItem.quantity;
            marketplaceImpact -= actualQuantity; // Items being sold (negative)
          } else if (marketItem.actionType === 'buy') {
            const actualQuantity = marketItem.buyWholeDemand ? 
              Math.abs(calcNetProd(kingdoms[name])[itemName] || 0) : 
              marketItem.quantity;
            marketplaceImpact += actualQuantity; // Items being bought (positive)
          }
        }
        
        // Calculate coin profit/cost from all transactions
        if (itemName === 'coins' && marketItem.itemName !== 'coins') {
          let actualQuantity;
          if (marketItem.actionType === 'sell') {
            actualQuantity = marketItem.sellAll ? (storage[marketItem.itemName] || 0) : marketItem.quantity;
            marketplaceCoinProfit += actualQuantity * marketItem.unitPrice; // Coin profit from sales
          } else if (marketItem.actionType === 'buy') {
            actualQuantity = marketItem.buyWholeDemand ? 
              Math.abs(calcNetProd(kingdoms[name])[marketItem.itemName] || 0) : 
              marketItem.quantity;
            marketplaceCoinProfit -= actualQuantity * marketItem.unitPrice; // Coin cost from purchases
          }
        }
      });
      
      // Calculate base production correctly
      if (itemName === 'coins' && marketplaceCoinProfit !== 0) {
        baseProduction = netVal - marketplaceCoinProfit;
        marketplaceImpact = marketplaceCoinProfit;
      } else if (marketplaceImpact !== 0) {
        baseProduction = netVal - marketplaceImpact; // Subtract marketplace impact to get base production
      }
    }
    
    const displayText = netVal >= 0 ? `+${netVal.toLocaleString()}` : netVal.toLocaleString();
    
    // Show breakdown if marketplace impact exists
    if (marketplaceImpact !== 0) {
      const productionText = baseProduction >= 0 ? `+${baseProduction.toLocaleString()}` : baseProduction.toLocaleString();
      const marketText = marketplaceImpact >= 0 ? `+${marketplaceImpact.toLocaleString()}` : marketplaceImpact.toLocaleString();
      prodSpan.innerHTML = `${displayText} <small style="color: #666;">(${productionText} ${marketText})</small>`;
    } else {
      prodSpan.textContent = displayText;
    }
    
    prodSpan.classList.add(netVal >= 0 ? "prod-positive" : "prod-negative");

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

  // Process marketplace transactions - both sales and purchases
  if (kingdoms[name].marketplace && kingdoms[name].marketplace.length > 0) {
    kingdoms[name].marketplace.forEach(item => {
      if (item.actionType === 'sell') {
        // Handle selling - remove items from storage
        const actualQuantity = item.sellAll ? (kingdoms[name].storage[item.itemName] || 0) : item.quantity;
        if (kingdoms[name].storage[item.itemName]) {
          kingdoms[name].storage[item.itemName] = Math.max(0, kingdoms[name].storage[item.itemName] - actualQuantity);
        }
      } else if (item.actionType === 'buy') {
        // Handle buying - add items to storage
        const actualQuantity = item.buyWholeDemand ? 
          Math.abs(netProd[item.itemName] || 0) : // Use absolute value of negative production
          item.quantity;
        
        if (!kingdoms[name].storage[item.itemName]) {
          kingdoms[name].storage[item.itemName] = 0;
        }
        kingdoms[name].storage[item.itemName] += actualQuantity;
      }
    });
  }

  // Reduce event countdowns
  if (kingdoms[name].events && kingdoms[name].events.future) {
    kingdoms[name].events.future.forEach(event => {
      if (event.hasCountdown) {
        event.remainingMonths = Math.max(0, event.remainingMonths - 1);
      }
    });
  }

  // Increment lifetime counter
  kingdoms[name].lifetime.months++;
  if (kingdoms[name].lifetime.months >= 12) {
    kingdoms[name].lifetime.years++;
    kingdoms[name].lifetime.months = 0;
  }

  pushDisasterEvents(kingdoms[name]);
  pushBeastCounterEvents(kingdoms[name]);

  saveAndRefresh(kingdoms[name].storage);
  updateLifetimeDisplay();
  renderMarketplace();
};

function pushDisasterEvents(kingdom) {
  const disasters = predictNextDisasters(kingdom);
  for (const i in disasters) {
    const disasterList = disasters[i];
    for (const disaster of disasterList) {
      const title = `Expecting ${disaster.name} (~ ${disaster.power}) From ${disaster.source} in ${disaster.direction} direction`;      
      const event = {
        id: Date.now(),
        title: title,
        remainingMonths: parseInt(i) + 1,
        isSecret: false,
        isHappened: false
      };
      kingdom.events.future.push(event);
    }
  }
}


function pushBeastCounterEvents(kingdom) {
  const beasts = searchForBeasts(kingdom);

  if (beasts) {
    const title = `Found ${beasts.quantity} ${beasts.id} beast!`;
    const event = {
      id: Date.now(),
      title: title,
      remainingMonths: 2,
      isSecret: false,
      isHappened: false
    };
    kingdom.events.future.push(event);
  }
}


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
  const actionTypeSelect = document.getElementById('actionType');
  const sellAllCheckbox = document.getElementById('sellAll');
  const buyWholeDemandCheckbox = document.getElementById('buyWholeDemand');
  const sellAllGroup = document.getElementById('sellAllGroup');
  const buyWholeDemandGroup = document.getElementById('buyWholeDemandGroup');
  const quantityGroup = document.getElementById('quantityGroup');
  const addMarketItemBtn = document.getElementById('addMarketItemBtn');
  
  // Toggle between sell/buy options
  actionTypeSelect.addEventListener('change', () => {
    const isBuying = actionTypeSelect.value === 'buy';
    
    if (isBuying) {
      sellAllGroup.style.display = 'none';
      buyWholeDemandGroup.style.display = 'block';
      sellAllCheckbox.checked = false;
    } else {
      sellAllGroup.style.display = 'block';
      buyWholeDemandGroup.style.display = 'none';
      buyWholeDemandCheckbox.checked = false;
    }
    
    // Reset quantity visibility
    quantityGroup.style.display = 'block';
  });
  
  // Toggle quantity input based on "Sell All" checkbox
  sellAllCheckbox.addEventListener('change', () => {
    quantityGroup.style.display = sellAllCheckbox.checked ? 'none' : 'block';
  });
  
  // Toggle quantity input based on "Buy Whole Demand" checkbox
  buyWholeDemandCheckbox.addEventListener('change', () => {
    quantityGroup.style.display = buyWholeDemandCheckbox.checked ? 'none' : 'block';
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
  const netProd = calcNetProd(kingdoms[name]);
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="">Select an item</option>';
  
  // Get all unique items from storage and netProd
  const allItems = new Set([...Object.keys(storage), ...Object.keys(netProd)]);
  
  // Add items to dropdown
  Array.from(allItems).sort().forEach(itemName => {
    const option = document.createElement('option');
    option.value = itemName;
    const currentQty = storage[itemName] || 0;
    const monthlyChange = netProd[itemName] || 0;
    option.textContent = `${itemName} (${currentQty.toLocaleString()}, ${monthlyChange >= 0 ? '+' : ''}${monthlyChange.toLocaleString()}/month)`;
    select.appendChild(option);
  });
}

function addMarketplaceItem() {
  const itemSelect = document.getElementById('marketItemSelect');
  const unitPriceInput = document.getElementById('unitPrice');
  const actionTypeSelect = document.getElementById('actionType');
  const sellAllCheckbox = document.getElementById('sellAll');
  const buyWholeDemandCheckbox = document.getElementById('buyWholeDemand');
  const quantityInput = document.getElementById('quantity');
  
  const itemName = itemSelect.value;
  const unitPrice = parseFloat(unitPriceInput.value);
  const actionType = actionTypeSelect.value;
  const sellAll = sellAllCheckbox.checked;
  const buyWholeDemand = buyWholeDemandCheckbox.checked;
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
  const netProd = calcNetProd(kingdoms[name]);
  
  // Validation for selling
  if (actionType === 'sell') {
    if (!storage[itemName] || storage[itemName] <= 0) {
      alert('Item not available in storage or quantity is 0');
      return;
    }
    
    if (!sellAll && (quantity <= 0 || quantity > storage[itemName])) {
      alert(`Invalid quantity. Available: ${storage[itemName]}`);
      return;
    }
  }
  
  // Validation for buying
  if (actionType === 'buy') {
    if (!buyWholeDemand && quantity <= 0) {
      alert('Please enter a valid quantity to buy');
      return;
    }
  }
  
  // Calculate quantity for "Buy Whole Demand"
  let finalQuantity = quantity;
  if (actionType === 'buy' && buyWholeDemand) {
    const monthlyDecrease = netProd[itemName] || 0;
    if (monthlyDecrease >= 0) {
      alert('This item is not decreasing monthly. Cannot calculate demand.');
      return;
    }
    finalQuantity = Math.abs(monthlyDecrease); // Convert negative to positive
  } else if (actionType === 'sell' && sellAll) {
    finalQuantity = storage[itemName] || 0;
  }
  
  // Check if item already exists in marketplace
  const existingIndex = kingdoms[name].marketplace.findIndex(item => 
    item.itemName === itemName && item.actionType === actionType
  );
  
  const marketItem = {
    itemName,
    unitPrice,
    actionType,
    sellAll: actionType === 'sell' ? sellAll : false,
    buyWholeDemand: actionType === 'buy' ? buyWholeDemand : false,
    quantity: finalQuantity
  };
  
  if (existingIndex !== -1) {
    // Update existing item
    kingdoms[name].marketplace[existingIndex] = marketItem;
  } else {
    // Add new item
    kingdoms[name].marketplace.push(marketItem);
  }
  
  // Clear form
  resetMarketplaceForm();
  
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

function editMarketplaceItem(index) {
  const item = kingdoms[name].marketplace[index];
  if (!item) return;
  
  // Populate form with existing values
  document.getElementById('marketItemSelect').value = item.itemName;
  document.getElementById('unitPrice').value = item.unitPrice;
  document.getElementById('actionType').value = item.actionType || 'sell';
  
  // Handle sell/buy specific fields
  if (item.actionType === 'sell') {
    document.getElementById('sellAll').checked = item.sellAll || false;
    document.getElementById('buyWholeDemand').checked = false;
    document.getElementById('sellAllGroup').style.display = 'block';
    document.getElementById('buyWholeDemandGroup').style.display = 'none';
    document.getElementById('quantityGroup').style.display = item.sellAll ? 'none' : 'block';
  } else {
    document.getElementById('sellAll').checked = false;
    document.getElementById('buyWholeDemand').checked = item.buyWholeDemand || false;
    document.getElementById('sellAllGroup').style.display = 'none';
    document.getElementById('buyWholeDemandGroup').style.display = 'block';
    document.getElementById('quantityGroup').style.display = item.buyWholeDemand ? 'none' : 'block';
  }
  
  document.getElementById('quantity').value = item.quantity;
  
  // Change button text to indicate editing
  const addBtn = document.getElementById('addMarketItemBtn');
  addBtn.textContent = 'Update Item';
  addBtn.onclick = () => updateMarketplaceItem(index);
  
  // Switch to marketplace tab if not already there
  const marketplaceTab = document.querySelector('[data-tab="marketplace"]');
  if (!marketplaceTab.classList.contains('active')) {
    marketplaceTab.click();
  }
}

function updateMarketplaceItem(index) {
  const itemSelect = document.getElementById('marketItemSelect');
  const unitPriceInput = document.getElementById('unitPrice');
  const actionTypeSelect = document.getElementById('actionType');
  const sellAllCheckbox = document.getElementById('sellAll');
  const buyWholeDemandCheckbox = document.getElementById('buyWholeDemand');
  const quantityInput = document.getElementById('quantity');
  
  const itemName = itemSelect.value;
  const unitPrice = parseFloat(unitPriceInput.value);
  const actionType = actionTypeSelect.value;
  const sellAll = sellAllCheckbox.checked;
  const buyWholeDemand = buyWholeDemandCheckbox.checked;
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
  const netProd = calcNetProd(kingdoms[name]);
  
  // Validation for selling
  if (actionType === 'sell') {
    if (!storage[itemName] || storage[itemName] <= 0) {
      alert('Item not available in storage or quantity is 0');
      return;
    }
    
    if (!sellAll && (quantity <= 0 || quantity > storage[itemName])) {
      alert(`Invalid quantity. Available: ${storage[itemName]}`);
      return;
    }
  }
  
  // Validation for buying
  if (actionType === 'buy') {
    if (!buyWholeDemand && quantity <= 0) {
      alert('Please enter a valid quantity to buy');
      return;
    }
  }
  
  // Calculate quantity for "Buy Whole Demand"
  let finalQuantity = quantity;
  if (actionType === 'buy' && buyWholeDemand) {
    const monthlyDecrease = netProd[itemName] || 0;
    if (monthlyDecrease >= 0) {
      alert('This item is not decreasing monthly. Cannot calculate demand.');
      return;
    }
    finalQuantity = Math.abs(monthlyDecrease);
  } else if (actionType === 'sell' && sellAll) {
    finalQuantity = storage[itemName] || 0;
  }
  
  // Update the item
  kingdoms[name].marketplace[index] = {
    itemName,
    unitPrice,
    actionType,
    sellAll: actionType === 'sell' ? sellAll : false,
    buyWholeDemand: actionType === 'buy' ? buyWholeDemand : false,
    quantity: finalQuantity
  };
  
  // Reset form
  resetMarketplaceForm();
  
  // Save and refresh
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderMarketplace();
}

function resetMarketplaceForm() {
  document.getElementById('marketItemSelect').value = '';
  document.getElementById('unitPrice').value = '';
  document.getElementById('actionType').value = 'sell';
  document.getElementById('sellAll').checked = false;
  document.getElementById('buyWholeDemand').checked = false;
  document.getElementById('quantity').value = '1';
  document.getElementById('quantityGroup').style.display = 'block';
  document.getElementById('sellAllGroup').style.display = 'block';
  document.getElementById('buyWholeDemandGroup').style.display = 'none';
  
  const addBtn = document.getElementById('addMarketItemBtn');
  addBtn.textContent = 'Add to Marketplace';
  addBtn.onclick = addMarketplaceItem;
}

function renderMarketplace() {
  const tableBody = document.getElementById('marketplaceTableBody');
  const overallProfitValue = document.getElementById('overallProfitValue');
  const storage = getStorage(kingdoms[name]);
  const netProd = calcNetProd(kingdoms[name]);
  
  tableBody.innerHTML = '';
  let totalProfit = 0;
  
  // Sort marketplace items by total profit (highest first)
  const sortedMarketplace = [...kingdoms[name].marketplace].sort((a, b) => {
    const aQuantity = a.actionType === 'sell' 
      ? (a.sellAll ? (storage[a.itemName] || 0) : a.quantity)
      : (a.buyWholeDemand ? Math.abs(netProd[a.itemName] || 0) : a.quantity);
    const bQuantity = b.actionType === 'sell'
      ? (b.sellAll ? (storage[b.itemName] || 0) : b.quantity)
      : (b.buyWholeDemand ? Math.abs(netProd[b.itemName] || 0) : b.quantity);
    
    const aProfit = aQuantity * a.unitPrice * (a.actionType === 'sell' ? 1 : -1);
    const bProfit = bQuantity * b.unitPrice * (b.actionType === 'sell' ? 1 : -1);
    return bProfit - aProfit; // Descending order
  });
  
  sortedMarketplace.forEach((item, originalIndex) => {
    // Find original index for editing
    const actualIndex = kingdoms[name].marketplace.findIndex(original => 
      original.itemName === item.itemName && 
      original.unitPrice === item.unitPrice && 
      original.actionType === item.actionType &&
      ((original.sellAll === item.sellAll && item.actionType === 'sell') ||
       (original.buyWholeDemand === item.buyWholeDemand && item.actionType === 'buy'))
    );
    
    const row = document.createElement('tr');
    
    // Calculate actual quantity and profit
    let actualQuantity;
    if (item.actionType === 'sell') {
      actualQuantity = item.sellAll ? (storage[item.itemName] || 0) : item.quantity;
    } else {
      actualQuantity = item.buyWholeDemand ? Math.abs(netProd[item.itemName] || 0) : item.quantity;
    }
    
    const totalItemProfit = actualQuantity * item.unitPrice * (item.actionType === 'sell' ? 1 : -1);
    totalProfit += totalItemProfit;
    
    // Determine profit class
    let profitClass = 'profit-neutral';
    if (totalItemProfit > 0) profitClass = 'profit-positive';
    else if (totalItemProfit < 0) profitClass = 'profit-negative';
    
    // Create quantity display text
    let quantityText = actualQuantity.toLocaleString();
    if (item.actionType === 'sell' && item.sellAll) {
      quantityText += ' (All)';
    } else if (item.actionType === 'buy' && item.buyWholeDemand) {
      quantityText += ' (Demand)';
    }
    
    row.innerHTML = `
      <td>${item.itemName}</td>
      <td><span style="color: ${item.actionType === 'sell' ? '#dc3545' : '#28a745'}; font-weight: bold;">${(item.actionType ?? 'sell').toUpperCase()}</span></td>
      <td>${item.unitPrice >= 0 ? '$' : '-$'}${Math.abs(item.unitPrice).toLocaleString()}</td>
      <td>${quantityText}</td>
      <td class="${profitClass}">${totalItemProfit >= 0 ? '$' : '-$'}${Math.abs(totalItemProfit).toLocaleString()}</td>
      <td>
        <button class="btn primary-btn" onclick="editMarketplaceItem(${actualIndex})" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;">Edit</button>
        <button class="btn danger-btn" onclick="removeMarketplaceItem(${actualIndex})" style="padding: 4px 8px; font-size: 12px;">Remove</button>
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
    row.innerHTML = '<td colspan="6" style="text-align: center; color: #6c757d; font-style: italic;">No items in marketplace</td>';
    tableBody.appendChild(row);
  }
}

// Make functions globally available
globalThis.removeMarketplaceItem = removeMarketplaceItem;
globalThis.editMarketplaceItem = editMarketplaceItem;