// Stock Market Simulation
let stockData = {};
let userData = {};
let currentUser = 'Hasan';
let portfolioChart;

// Load data from localStorage
function loadData() {
  const savedData = localStorage.getItem('stock_market');
  if (savedData) {
    const parsed = JSON.parse(savedData);
    stockData = parsed.stocks || {};
    
    // Handle migration from old single-user format to multi-user format
    if (parsed.player && !parsed.users) {
      // Migrate existing data to Hasan user
      userData = {
        'Hasan': parsed.player,
        'Hossain': { coins: 10000, portfolio: {}, portfolioHistory: [] }
      };
    } else {
      userData = parsed.users || {
        'Hasan': { coins: 10000, portfolio: {}, portfolioHistory: [] },
        'Hossain': { coins: 10000, portfolio: {}, portfolioHistory: [] }
      };
    }
  } else {
    // Initialize fresh data
    userData = {
      'Hasan': { coins: 10000, portfolio: {}, portfolioHistory: [] },
      'Hossain': { coins: 10000, portfolio: {}, portfolioHistory: [] }
    };
  }

  // Ensure portfolioHistory exists for all users
  Object.keys(userData).forEach(user => {
    if (!userData[user].portfolioHistory) {
      userData[user].portfolioHistory = [];
    }
  });

  // Initialize with some default stocks if none exist
  if (Object.keys(stockData).length === 0) {
    initializeDefaultStocks();
  }
}

// Save data to localStorage
function saveData() {
  const dataToSave = {
    stocks: stockData,
    users: userData
  };
  localStorage.setItem('stock_market', JSON.stringify(dataToSave));
}

// Initialize default stocks
function initializeDefaultStocks() {
  const defaultStocks = []

  defaultStocks.forEach(stock => {
    stockData[stock.name] = {
      currentPrice: stock.price,
      minChangeRate: stock.minChange,
      maxChangeRate: stock.maxChange,
      priceHistory: [stock.price]
    };
  });
  saveData();
}

// Switch user
function switchUser() {
  currentUser = document.getElementById('userSelect').value;
  localStorage.setItem('stock_market_current_user', currentUser);
  
  // Re-render everything for the new user
  renderWallet();
  renderStocksTable();
  updatePortfolioChart();
}

// Get current user data
function getCurrentUserData() {
  return userData[currentUser];
}

// Update coins
function updateCoins() {
  const newCoins = parseFloat(document.getElementById('coinsInput').value) || 0;
  getCurrentUserData().coins = newCoins;
  saveData();
  renderWallet();
}

// Record portfolio value for history
function recordPortfolioValue() {
  const portfolioValue = calculatePortfolioValue();
  const userdata = getCurrentUserData();
  userdata.portfolioHistory.push(portfolioValue);

  // Keep only last 12 records
  if (userdata.portfolioHistory.length > 12) {
    userdata.portfolioHistory.shift();
  }

  saveData();
}

// Calculate portfolio value
function calculatePortfolioValue() {
  let totalValue = 0;
  const userdata = getCurrentUserData();
  Object.keys(userdata.portfolio).forEach(stockName => {
    const shares = userdata.portfolio[stockName] || 0;
    const currentPrice = stockData[stockName]?.currentPrice || 0;
    totalValue += shares * currentPrice;
  });
  return totalValue;
}

// Render wallet information
function renderWallet() {
  const userdata = getCurrentUserData();
  document.getElementById('coinsInput').value = userdata.coins;
  document.getElementById('portfolioValue').textContent = calculatePortfolioValue().toLocaleString();
}

// Get price change indicator
function getPriceChangeIndicator(stock) {
  const priceHistory = stock.priceHistory;
  if (priceHistory.length < 2) {
    return { indicator: '—', class: 'price-neutral', change: 0, percent: 0 };
  }

  const currentPrice = priceHistory[priceHistory.length - 1];
  const previousPrice = priceHistory[priceHistory.length - 2];
  const change = currentPrice - previousPrice;
  const changePercent = ((change / previousPrice) * 100);

  if (change > 0) {
    return {
      indicator: '▲',
      class: 'price-positive',
      change: change,
      percent: changePercent
    };
  } else if (change < 0) {
    return {
      indicator: '▼',
      class: 'price-negative',
      change: change,
      percent: changePercent
    };
  } else {
    return {
      indicator: '—',
      class: 'price-neutral',
      change: 0,
      percent: 0
    };
  }
}

// Table sorting variables
let currentSortColumn = 1; // Default sort by price
let sortDirection = 'desc'; // 'asc' or 'desc'

// Render stocks table
function renderStocksTable() {
  const tbody = document.querySelector('#stocksTable tbody');
  tbody.innerHTML = '';

  // Get stocks as array with calculated values
  const userdata = getCurrentUserData();
  const stocksArray = Object.entries(stockData).map(([stockName, stock]) => {
    const myShares = userdata.portfolio[stockName] || 0;
    const myInvestment = myShares * stock.currentPrice;
    const priceChange = getPriceChangeIndicator(stock);

    return {
      name: stockName,
      stock: stock,
      myShares: myShares,
      myInvestment: myInvestment,
      priceChange: priceChange,
      changeValue: priceChange.change // For sorting
    };
  });

  // Sort the array based on current sort settings
  stocksArray.sort((a, b) => {
    let valueA, valueB;

    switch (currentSortColumn) {
      case 0: // Company Name
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 1: // Current Price
        valueA = a.stock.currentPrice;
        valueB = b.stock.currentPrice;
        break;
      case 2: // Change
        valueA = a.changeValue;
        valueB = b.changeValue;
        break;
      case 3: // My Shares
        valueA = a.myShares;
        valueB = b.myShares;
        break;
      case 4: // My Investment
        valueA = a.myInvestment;
        valueB = b.myInvestment;
        break;
      default:
        valueA = a.stock.currentPrice;
        valueB = b.stock.currentPrice;
    }

    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });

  // Render sorted rows
  stocksArray.forEach(item => {
    const row = document.createElement('tr');    
    row.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>$${item.stock.currentPrice.toFixed(2)}</td>
            <td class="${item.priceChange.class}">
                <span class="price-indicator">${item.priceChange.indicator}</span>
                <span class="price-change-amount">$${Math.abs(item.priceChange.change).toFixed(2)}</span>
                <span class="price-change-percent">(${item.priceChange.percent >= 0 ? '+' : ''}${item.priceChange.percent.toFixed(1)}%)</span>
            </td>
            <td>${item.myShares}</td>
            <td>$${item.myInvestment.toFixed(2)}</td>
            <td>${item.stock.minChangeRate}:${item.stock.maxChangeRate}</td>
            <td>
                <button onclick="deleteStock('${item.name}')" class="btn danger-btn" style="margin-left: 5px;">Delete</button>
            </td>
        `;
    row.onclick = () => goToStockCMS(item.name);
    // Row click removed since we have manage button
    tbody.appendChild(row);
  });

  // Update sort indicators
  updateSortIndicators();
}

// Sort table by column
function sortTable(columnIndex) {
  if (currentSortColumn === columnIndex) {
    // Toggle direction if same column
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // New column, default to descending for numbers, ascending for text
    currentSortColumn = columnIndex;
    sortDirection = columnIndex === 0 ? 'asc' : 'desc'; // Name ascending, others descending
  }

  renderStocksTable();
}

// Update sort indicators in table headers
function updateSortIndicators() {
  const headers = document.querySelectorAll('#stocksTable th .sort-indicator');
  headers.forEach((indicator, index) => {
    if (index === currentSortColumn) {
      indicator.textContent = sortDirection === 'asc' ? '↑' : '↓';
      indicator.parentElement.classList.add('sorted');
    } else {
      indicator.textContent = '↕';
      indicator.parentElement.classList.remove('sorted');
    }
  });
}

// Show create stock modal
function showCreateStockModal() {
  document.getElementById('createStockModal').style.display = 'block';

  // Add event listeners for range inputs
  const minChangeInput = document.getElementById('newStockMinChange');
  const maxChangeInput = document.getElementById('newStockMaxChange');

  minChangeInput.oninput = () => {
    document.getElementById('minChangeDisplay').textContent = minChangeInput.value + '%';
  };

  maxChangeInput.oninput = () => {
    document.getElementById('maxChangeDisplay').textContent = maxChangeInput.value + '%';
  };
}

// Hide create stock modal
function hideCreateStockModal() {
  document.getElementById('createStockModal').style.display = 'none';
}

// Create new stock
function createStock() {
  const name = document.getElementById('newStockName').value.trim();
  const price = parseFloat(document.getElementById('newStockPrice').value);
  const minChange = parseInt(document.getElementById('newStockMinChange').value);
  const maxChange = parseInt(document.getElementById('newStockMaxChange').value);

  if (!name || !price || price <= 0) {
    alert('Please enter valid company name and price');
    return;
  }

  if (stockData[name]) {
    alert('Company with this name already exists');
    return;
  }

  stockData[name] = {
    currentPrice: price,
    minChangeRate: minChange,
    maxChangeRate: maxChange,
    priceHistory: [price]
  };

  saveData();
  renderStocksTable();
  hideCreateStockModal();

  // Clear form
  document.getElementById('newStockName').value = '';
  document.getElementById('newStockPrice').value = '';
  document.getElementById('newStockMinChange').value = -10;
  document.getElementById('newStockMaxChange').value = 15;
  document.getElementById('minChangeDisplay').textContent = '-10%';
  document.getElementById('maxChangeDisplay').textContent = '15%';
}

// Delete stock
function deleteStock(stockName) {
  if (!confirm(`Are you sure you want to delete ${stockName}? This action cannot be undone.`)) {
    return;
  }

  // Check if any user has shares
  let hasShares = false;
  let shareDetails = [];
  
  Object.keys(userData).forEach(user => {
    const shares = userData[user].portfolio[stockName] || 0;
    if (shares > 0) {
      hasShares = true;
      shareDetails.push(`${user}: ${shares} shares`);
    }
  });

  if (hasShares) {
    if (!confirm(`Users have shares in ${stockName}:\n${shareDetails.join('\n')}\nDeleting will lose these shares. Continue?`)) {
      return;
    }
    // Remove shares from all user portfolios
    Object.keys(userData).forEach(user => {
      delete userData[user].portfolio[stockName];
    });
  }

  // Delete the stock
  delete stockData[stockName];

  saveData();
  renderStocksTable();
  renderWallet();
  updatePortfolioChart();

  alert(`${stockName} has been deleted.`);
}

// Simulate new month
function simulateNewMonth() {
  Object.keys(stockData).forEach(stockName => {
    const stock = stockData[stockName];
    const changePercent = Math.random() * (stock.maxChangeRate - stock.minChangeRate) + stock.minChangeRate;
    const newPrice = Math.max(1, stock.currentPrice * (1 + changePercent / 100));

    stock.currentPrice = Math.round(newPrice * 100) / 100;
    stock.priceHistory.push(stock.currentPrice);

    // Keep only last 20 price points
    if (stock.priceHistory.length > 20) {
      stock.priceHistory.shift();
    }
  });

  // Record portfolio value after price changes
  recordPortfolioValue();

  saveData();
  renderStocksTable();
  renderWallet();
  updatePortfolioChart();
}

// Initialize portfolio chart
function initPortfolioChart() {
  const ctx = document.getElementById('portfolioChart').getContext('2d');
  const userdata = getCurrentUserData();

  const chartData = {
    labels: userdata.portfolioHistory.map((_, index) => `Month ${index + 1}`),
    datasets: [{
      label: `${currentUser}'s Portfolio Value ($)`,
      data: userdata.portfolioHistory,
      backgroundColor: 'rgba(40, 167, 69, 0.2)',
      borderColor: 'rgba(40, 167, 69, 1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  portfolioChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Stock Portfolio Value ($)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time Period'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: `${currentUser}'s Portfolio Value History`
        }
      }
    }
  });
}

// Update portfolio chart
function updatePortfolioChart() {
  if (!portfolioChart) return;

  const userdata = getCurrentUserData();
  portfolioChart.data.labels = userdata.portfolioHistory.map((_, index) => `Month ${index + 1}`);
  portfolioChart.data.datasets[0].data = userdata.portfolioHistory;
  portfolioChart.data.datasets[0].label = `${currentUser}'s Portfolio Value ($)`;
  portfolioChart.options.plugins.title.text = `${currentUser}'s Portfolio Value History`;
  portfolioChart.update();
}

// Go to stock CMS
function goToStockCMS(stockName) {
  localStorage.setItem('$current_stock', stockName);
  window.location.href = 'cms.html';
}

// Initialize the application
function init() {
  loadData();

  // Load saved current user or default to Hasan
  const savedUser = localStorage.getItem('stock_market_current_user');
  if (savedUser && userData[savedUser]) {
    currentUser = savedUser;
  }
  document.getElementById('userSelect').value = currentUser;

  // Initialize portfolio history if empty for current user
  const userdata = getCurrentUserData();
  if (userdata.portfolioHistory.length === 0) {
    recordPortfolioValue();
  }

  renderWallet();
  renderStocksTable();
  initPortfolioChart();

  // Close modal when clicking outside
  window.onclick = function (event) {
    const modal = document.getElementById('createStockModal');
    if (event.target === modal) {
      hideCreateStockModal();
    }
  };
}

// Start the application when page loads
window.onload = init;