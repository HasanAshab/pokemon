// Stock CMS Management
let stockData = {};
let userData = {};
let currentUser = 'Hasan';
let currentStockName = '';
let priceChart;

// Get stock name from URL
function getStockNameFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('name');
}

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
}

// Save data to localStorage
function saveData() {
    const dataToSave = {
        stocks: stockData,
        users: userData
    };
    localStorage.setItem('stock_market', JSON.stringify(dataToSave));
}

// Switch user
function switchUser() {
    currentUser = document.getElementById('userSelect').value;
    localStorage.setItem('stock_market_current_user', currentUser);
    
    // Re-render everything for the new user
    renderStockInfo();
    updateTradingCalculations();
}

// Get current user data
function getCurrentUserData() {
    return userData[currentUser];
}

// Record portfolio value for history
function recordPortfolioValue() {
    const userdata = getCurrentUserData();
    const portfolioValue = Object.keys(userdata.portfolio).reduce((total, stockName) => {
        const shares = userdata.portfolio[stockName] || 0;
        const currentPrice = stockData[stockName]?.currentPrice || 0;
        return total + (shares * currentPrice);
    }, 0);
    
    if (!userdata.portfolioHistory) {
        userdata.portfolioHistory = [];
    }
    
    userdata.portfolioHistory.push(portfolioValue);
    
    // Keep only last 12 records
    if (userdata.portfolioHistory.length > 12) {
        userdata.portfolioHistory.shift();
    }
}

// Update price
function updatePrice() {
    const newPrice = parseFloat(document.getElementById('currentPrice').value);
    if (!newPrice || newPrice <= 0) {
        alert('Please enter a valid price');
        return;
    }
    
    const stock = stockData[currentStockName];
    stock.currentPrice = Math.round(newPrice * 100) / 100;
    stock.priceHistory.push(stock.currentPrice);
    
    // Keep only last 20 price points
    if (stock.priceHistory.length > 20) {
        stock.priceHistory.shift();
    }
    
    saveData();
    updateChart();
    renderStockInfo();
    updateTradingCalculations();
}

// Update change rates
function updateChangeRates() {
    const minChange = parseInt(document.getElementById('minChangeRate').value);
    const maxChange = parseInt(document.getElementById('maxChangeRate').value);
    
    const stock = stockData[currentStockName];
    stock.minChangeRate = minChange;
    stock.maxChangeRate = maxChange;
    
    saveData();
}

// Render stock information
function renderStockInfo() {
    const stock = stockData[currentStockName];
    if (!stock) return;
    
    document.getElementById('stockName').textContent = currentStockName;
    document.getElementById('currentPrice').value = stock.currentPrice;
    document.getElementById('currentPriceDisplay').textContent = stock.currentPrice.toFixed(2);
    document.getElementById('minChangeRate').value = stock.minChangeRate;
    document.getElementById('maxChangeRate').value = stock.maxChangeRate;
    document.getElementById('minChangeDisplay').textContent = stock.minChangeRate + '%';
    document.getElementById('maxChangeDisplay').textContent = stock.maxChangeRate + '%';
    
    // Current user info
    const userdata = getCurrentUserData();
    document.getElementById('playerCoins').textContent = userdata.coins.toLocaleString();
    const myShares = userdata.portfolio[currentStockName] || 0;
    document.getElementById('myShares').textContent = myShares;
    document.getElementById('investmentValue').textContent = (myShares * stock.currentPrice).toLocaleString();
}

// Initialize chart
function initChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const stock = stockData[currentStockName];
    
    const chartData = {
        labels: stock.priceHistory.map((_, index) => `Point ${index + 1}`),
        datasets: [{
            label: 'Stock Price ($)',
            data: stock.priceHistory,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    };
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Points'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `${currentStockName} - Price History`
                }
            }
        }
    });
}

// Update chart
function updateChart() {
    const stock = stockData[currentStockName];
    priceChart.data.labels = stock.priceHistory.map((_, index) => `Point ${index + 1}`);
    priceChart.data.datasets[0].data = stock.priceHistory;
    priceChart.update();
}

// Update trading calculations
function updateTradingCalculations() {
    const stock = stockData[currentStockName];
    const buyShares = parseInt(document.getElementById('buyShares').value) || 0;
    const sellShares = parseInt(document.getElementById('sellShares').value) || 0;
    
    document.getElementById('buyCost').textContent = (buyShares * stock.currentPrice).toFixed(2);
    document.getElementById('sellRevenue').textContent = (sellShares * stock.currentPrice).toFixed(2);
}

// Buy stock
function buyStock() {
    const shares = parseInt(document.getElementById('buyShares').value);
    if (!shares || shares <= 0) {
        alert('Please enter a valid number of shares');
        return;
    }
    
    const stock = stockData[currentStockName];
    const totalCost = shares * stock.currentPrice;
    
    const userdata = getCurrentUserData();
    
    if (userdata.coins < totalCost) {
        alert('Insufficient funds!');
        return;
    }
    
    userdata.coins -= totalCost;
    userdata.portfolio[currentStockName] = (userdata.portfolio[currentStockName] || 0) + shares;
    
    // Record portfolio value change
    recordPortfolioValue();
    
    saveData();
    renderStockInfo();
    document.getElementById('buyShares').value = '';
    updateTradingCalculations();
    
    alert(`Successfully bought ${shares} shares for $${totalCost.toFixed(2)}`);
}

// Sell stock
function sellStock() {
    const shares = parseInt(document.getElementById('sellShares').value);
    if (!shares || shares <= 0) {
        alert('Please enter a valid number of shares');
        return;
    }
    
    const userdata = getCurrentUserData();
    const myShares = userdata.portfolio[currentStockName] || 0;
    if (shares > myShares) {
        alert('You don\'t have enough shares to sell!');
        return;
    }
    
    const stock = stockData[currentStockName];
    const totalRevenue = shares * stock.currentPrice;
    
    userdata.coins += totalRevenue;
    userdata.portfolio[currentStockName] = myShares - shares;
    
    // Remove from portfolio if no shares left
    if (userdata.portfolio[currentStockName] === 0) {
        delete userdata.portfolio[currentStockName];
    }
    
    // Record portfolio value change
    recordPortfolioValue();
    
    saveData();
    renderStockInfo();
    document.getElementById('sellShares').value = '';
    updateTradingCalculations();
    
    alert(`Successfully sold ${shares} shares for $${totalRevenue.toFixed(2)}`);
}

// Go back to main market
function goBack() {
    window.location.href = 'index.html';
}

// Initialize the CMS
function init() {
    currentStockName = getStockNameFromURL();
    if (!currentStockName) {
        alert('No stock specified');
        goBack();
        return;
    }
    
    loadData();
    
    // Load saved current user or default to Hasan
    const savedUser = localStorage.getItem('stock_market_current_user');
    if (savedUser && userData[savedUser]) {
        currentUser = savedUser;
    }
    document.getElementById('userSelect').value = currentUser;
    
    if (!stockData[currentStockName]) {
        alert('Stock not found');
        goBack();
        return;
    }
    
    renderStockInfo();
    initChart();
    
    // Add event listeners
    document.getElementById('minChangeRate').oninput = function() {
        document.getElementById('minChangeDisplay').textContent = this.value + '%';
        updateChangeRates();
    };
    
    document.getElementById('maxChangeRate').oninput = function() {
        document.getElementById('maxChangeDisplay').textContent = this.value + '%';
        updateChangeRates();
    };
    
    document.getElementById('buyShares').oninput = updateTradingCalculations;
    document.getElementById('sellShares').oninput = updateTradingCalculations;
    
    updateTradingCalculations();
}

// Start the application when page loads
window.onload = init;