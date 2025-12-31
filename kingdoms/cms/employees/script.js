import { calcEmployeeSalary, saveKingdoms } from '../../utils.js';

// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("name");
})();

const kingdomNameEl = document.getElementById("kingdomName");
const employeesTableBody = document.querySelector("#employeesTable tbody");
const totalEmployeeSalaryEl = document.getElementById("totalEmployeeSalary");
const addEmployeeBtn = document.getElementById("addEmployeeBtn");

kingdomNameEl.textContent = name ? `${name}'s Employees` : "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].employees) kingdoms[name].employees = [];

function saveAndRefresh() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderEmployees();
}

function calculatePerManSalary(salaryPercent) {
  const pci = kingdoms[name].pci || 0;
  return Math.round(pci * (salaryPercent / 100));
}

function calculateTotalPostSalary(salaryPercent, quantity) {
  return calculatePerManSalary(salaryPercent) * quantity;
}

function calculateTotalEmployeeSalary() {
  return kingdoms[name].employees.reduce((total, employee) => {
    return total + calculateTotalPostSalary(employee.salaryPercent, employee.quantity);
  }, 0);
}

function updateTotalSalaryDisplay() {
  const totalSalary = calculateTotalEmployeeSalary();
  totalEmployeeSalaryEl.textContent = totalSalary.toLocaleString();
}

function renderEmployees() {
  employeesTableBody.innerHTML = "";
  
  // Sort employees by salary percentage (highest first)
  const sortedEmployees = [...kingdoms[name].employees].sort((a, b) => b.salaryPercent - a.salaryPercent);
  
  sortedEmployees.forEach((employee) => {
    // Find original index for update/remove operations
    const originalIndex = kingdoms[name].employees.findIndex(emp => 
      emp.postName === employee.postName && 
      emp.salaryPercent === employee.salaryPercent && 
      emp.quantity === employee.quantity
    );
    const row = document.createElement("tr");
    
    const perManSalary = calculatePerManSalary(employee.salaryPercent);
    const totalPostSalary = calculateTotalPostSalary(employee.salaryPercent, employee.quantity);
    
    row.innerHTML = `
      <td>
        <input type="text" class="editable-input post-name" value="${employee.postName}" 
               onblur="updateEmployee(${originalIndex}, 'postName', this.value)"
               onkeydown="handleEnterKey(event)">
      </td>
      <td>
        <input type="number" class="editable-input" value="${employee.salaryPercent}" 
               onblur="updateEmployee(${originalIndex}, 'salaryPercent', this.value)"
               onkeydown="handleEnterKey(event)">
      </td>
      <td>
        <input type="number" class="editable-input" value="${employee.quantity}"
               onblur="updateEmployee(${originalIndex}, 'quantity', this.value)"
               onkeydown="handleEnterKey(event)">
      </td>
      <td class="salary-display">$${perManSalary.toLocaleString()}</td>
      <td class="salary-display">$${totalPostSalary.toLocaleString()}</td>
      <td class="actions-cell">
        <button class="btn btn-danger" onclick="removeEmployee(${originalIndex})">Remove</button>
      </td>
    `;
    
    employeesTableBody.appendChild(row);
  });
  
  updateTotalSalaryDisplay();
}

function updateEmployee(index, field, value) {
  const employee = kingdoms[name].employees[index];
  
  if (field === 'postName') {
    if (!value.trim()) {
      alert('Post name cannot be empty');
      renderEmployees();
      return;
    }
    employee[field] = value.trim();
  } else if (field === 'salaryPercent') {
    const numValue = parseFloat(value);
    employee[field] = numValue;
  } else if (field === 'quantity') {
    const numValue = parseInt(value);
    employee[field] = numValue;
  }
  
  saveAndRefresh();
}

function removeEmployee(index) {
  const employee = kingdoms[name].employees[index];
  if (confirm(`Remove ${employee.postName}? This cannot be undone.`)) {
    kingdoms[name].employees.splice(index, 1);
    saveAndRefresh();
  }
}

function addNewEmployee() {
  const newEmployee = {
    postName: "New Position",
    salaryPercent: 5.0,
    quantity: 1
  };
  
  kingdoms[name].employees.push(newEmployee);
  saveAndRefresh();
}

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.target.blur();
  }
}

// Global functions
globalThis.updateEmployee = updateEmployee;
globalThis.removeEmployee = removeEmployee;
globalThis.handleEnterKey = handleEnterKey;

// Event listeners
addEmployeeBtn.addEventListener('click', addNewEmployee);

// Initialize
renderEmployees();