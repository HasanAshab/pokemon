              const urlParams = new URLSearchParams(window.location.search);
            const companyName = urlParams.get('company');
            const companies  = JSON.parse(localStorage.getItem("companies")) || {};
            const company = companies[companyName];
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
        };

        // Contract Management
        let contracts = company.contracts || [];

        // Asset Management
        let assets = company.assets || [];
       function saveAllData() {
         localStorage.setItem('companies', JSON.stringify(companies));
       }
        function updateWorth() {
            const medium = parseFloat(document.getElementById('medium').value);
            const worth = !isNaN(medium) ? medium * 70 : 0;
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

        function saveEstimates() {
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

        function addRevenue() {
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
        }

        function clearData() {
            if (confirm('Are you sure you want to clear all data?')) {
                ;
                console.log(companies);
                
              company.revenue =  {
           labels: [],
           data: []
         }
         company.contracts =  []
           company.assets = [],
            company.employees = [],
            company.revenueEstimates = {
             low: 0,
             medium: 0,
             high: 0
           }
                saveAllData();
                document.getElementById('companyWorth').textContent = 'Total Worth $: 0';
                revenueChart.update();
            }
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
                    <td>${emp.post}</td>
                    <td>${emp.mans}</td>
                    <td>${formatNumber(emp.salary)}</td>
                    <td>${formatNumber(totalSalary)}</td>
                    <td><button class="delete-btn" onclick="removeRow(${index})">Remove</button></td>
                `;
                tbody.appendChild(row);
            });

            document.getElementById("totalSalary").textContent = formatNumber(total);
            localStorage.setItem("employees", JSON.stringify(employees));
        }

        function addRow() {
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

        function removeRow(index) {
            employees.splice(index, 1);
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
                    <td>${contract.name}</td>
                    <td>${formatNumber(contract.profit)}</td>
                    <td><button class="delete-btn" onclick="removeContract(${index})">Remove</button></td>
                `;
                tbody.appendChild(row);
            });

            document.getElementById("totalProfit").textContent = formatNumber(totalProfit);
            localStorage.setItem("contracts", JSON.stringify(contracts));
        }

        function addContract() {
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

        function removeContract(index) {
            contracts.splice(index, 1);
            renderContractsTable();
        }

        // Asset Management Functions
        function renderAssetsTable() {
            const tbody = document.querySelector("#assetTable tbody");
            tbody.innerHTML = "";
            let totalRent = 0;

            assets.forEach((asset, index) => {
                const row = document.createElement("tr");
                totalRent += asset.rent;

                row.innerHTML = `
                    <td>${asset.name}</td>
                    <td>${formatNumber(asset.rent)}</td>
                    <td><button class="delete-btn" onclick="removeAsset(${index})">Remove</button></td>
                `;
                tbody.appendChild(row);
            });

            document.getElementById("totalAssetRent").textContent = formatNumber(totalRent);
            localStorage.setItem("assets", JSON.stringify(assets));
        }

        function addAsset() {
            const name = document.getElementById("assetName").value.trim();
            const rent = parseFloat(document.getElementById("assetRent").value);

            if (!name || isNaN(rent)) {
                alert("Please enter valid asset name and rent.");
                return;
            }

            assets.push({ name, rent });
            renderAssetsTable();

            document.getElementById("assetName").value = "";
            document.getElementById("assetRent").value = "";
        }

        function removeAsset(index) {
            assets.splice(index, 1);
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
                nameDiv.appendChild(nameLabel);
                nameDiv.appendChild(nameInput);

                const quantityDiv = document.createElement('div');
                const quantityLabel = document.createElement('label');
                quantityLabel.textContent = 'Quantity';
                const quantityInput = document.createElement('input');
                quantityInput.type = 'number';
                quantityInput.value = storage[itemName];
                quantityDiv.appendChild(quantityLabel);
                quantityDiv.appendChild(quantityInput);

                const changeDiv = document.createElement('div');
                const changeLabel = document.createElement('label');
                changeLabel.textContent = 'Monthly Change';
                const changeInput = document.createElement('input');
                changeInput.type = 'number';
                changeInput.value = monthlyChanges[itemName] || 0;
                changeInput.placeholder = '0';
                changeDiv.appendChild(changeLabel);
                changeDiv.appendChild(changeInput);

                const changeDisplay = document.createElement('div');
                const changeValue = monthlyChanges[itemName] || 0;
                changeDisplay.className = 'monthly-change';
                if (changeValue > 0) {
                    changeDisplay.className += ' change-positive';
                    changeDisplay.textContent = `+${changeValue}`;
                } else if (changeValue < 0) {
                    changeDisplay.className += ' change-negative';
                    changeDisplay.textContent = `${changeValue}`;
                } else {
                    changeDisplay.className += ' change-neutral';
                    changeDisplay.textContent = '0';
                }

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'storage-actions';

                const saveBtn = document.createElement('button');
                saveBtn.className = 'btn primary-btn';
                saveBtn.textContent = 'Save';
                saveBtn.onclick = () => {
                    const newName = nameInput.value.trim();
                    const quantity = parseInt(quantityInput.value) || 0;
                    const change = parseInt(changeInput.value) || 0;

                    if (!newName) {
                        alert('Item name cannot be empty');
                        return;
                    }

                    // If name changed, remove old entry
                    if (newName !== itemName) {
                        delete storage[itemName];
                        delete monthlyChanges[itemName];
                    }

                    storage[newName] = quantity;
                    monthlyChanges[newName] = change;
                    
                    company.storage = storage;
                    company.monthlyChanges = monthlyChanges;
                    saveAllData();
                    renderStorageItems();
                };

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

                actionsDiv.appendChild(saveBtn);
                actionsDiv.appendChild(deleteBtn);

                itemDiv.appendChild(nameDiv);
                itemDiv.appendChild(quantityDiv);
                itemDiv.appendChild(changeDiv);
                itemDiv.appendChild(changeDisplay);
                itemDiv.appendChild(actionsDiv);

                itemsContainer.appendChild(itemDiv);
            });
        }

        function addNewStorageItem() {
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

        function processMonthlyChanges() {
            if (confirm('Process monthly changes? This will update all item quantities based on their monthly change values.')) {
                Object.keys(storage).forEach(itemName => {
                    const change = monthlyChanges[itemName] || 0;
                    storage[itemName] = Math.max(0, storage[itemName] + change);
                });

                company.storage = storage;
                saveAllData();
                renderStorageItems();
                alert('Monthly changes processed successfully!');
            }
        }

        // Initialize everything on page load
        window.onload = function () {
        //   setting company name
            document.getElementById('companyName').textContent = companyName;
    
          loadData();
            renderTable();
            renderContractsTable();
            renderAssetsTable();
            renderStorageItems();
            
            // Add event listeners for storage system
            document.getElementById('addItemBtn').onclick = addNewStorageItem;
            document.getElementById('newMonthBtn').onclick = processMonthlyChanges;
            
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