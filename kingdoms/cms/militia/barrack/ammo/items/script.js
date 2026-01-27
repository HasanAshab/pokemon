import items from '../../../../../../data/items.js';

// DOM elements
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const itemsContainer = document.getElementById('itemsContainer');
const noResults = document.getElementById('noResults');
const modal = document.getElementById('itemModal');
const modalItemName = document.getElementById('modalItemName');
const modalItemJson = document.getElementById('modalItemJson');
const closeModal = document.querySelector('.close');
const toggleAllBtn = document.getElementById('toggleAllBtn');

// State
let currentItems = items;
let currentSearch = '';
let currentSort = 'cheap';
let allCollapsed = true; // Start with all groups collapsed

// Initialize the page
function init() {
  setupEventListeners();
  renderItems();
}

// Setup event listeners
function setupEventListeners() {
  searchInput.addEventListener('input', handleSearch);
  sortSelect.addEventListener('change', handleSort);
  toggleAllBtn.addEventListener('click', toggleAllGroups);
  closeModal.addEventListener('click', hideModal);
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });
}

// Handle search input
function handleSearch(e) {
  currentSearch = e.target.value.toLowerCase();
  renderItems();
}

// Handle sort change
function handleSort(e) {
  currentSort = e.target.value;
  renderItems();
}

// Filter items based on search
function filterItems() {  
  const filtered = {};
  for (const [itemId, item] of Object.entries(items)) {  
    if (["nation_genetics"].includes(item.type))
        continue;
    if (itemId.startsWith("$")) continue;
    if (!item.type) continue;

    if (!currentSearch) {
      filtered[itemId] = item;
    }
    else if (itemId.toLowerCase().includes(currentSearch) ||
        (item.type && item.type.toLowerCase().includes(currentSearch))) {
      filtered[itemId] = item;
    }
  }
  return filtered;
}

// Sort items by price
function sortItems(itemsObj) {
  const entries = Object.entries(itemsObj);
  
  entries.sort(([idA, itemA], [idB, itemB]) => {
    const priceA = itemA.meta?.budget || 0;
    const priceB = itemB.meta?.budget || 0;
    
    if (currentSort === 'expensive') {
      return priceB - priceA; // Descending
    } else {
      return priceA - priceB; // Ascending (cheap first)
    }
  });
  
  return Object.fromEntries(entries);
}

// Group items by type
function groupItemsByType(itemsObj) {
  const groups = {};
  
  for (const [itemId, item] of Object.entries(itemsObj)) {
    const type = item.type || 'unknown';
    if (!groups[type]) {
      groups[type] = {};
    }
    groups[type][itemId] = item;
  }
  
  return groups;
}

// Format price for display
function formatPrice(price) {
  if (price === 0) return 'Free';
  return `$${price.toLocaleString()}`;
}

// Create item card HTML
function createItemCard(itemId, item) {
  const price = item.meta?.budget || 0;
  
  return `
    <div class="item-card" onclick="showItemDetails('${itemId}')">
      <div class="item-type">${item.type || 'unknown'}</div>
      <div class="item-name">${itemId}</div>
      <div class="item-price">${formatPrice(price)}</div>
    </div>
  `;
}

// Create type group HTML
function createTypeGroup(type, items) {
  const itemCards = Object.entries(items)
    .map(([itemId, item]) => createItemCard(itemId, item))
    .join('');
  
  const itemCount = Object.keys(items).length;
  const typeId = type.replace(/[^a-zA-Z0-9]/g, '_'); // Create safe ID for type
  
  type = type.replace('_', ' ');
  return `
    <div class="type-group">
      <div class="type-header" onclick="toggleGroup('${typeId}')">
        <span>${type} (${itemCount} items)</span>
        <span class="collapse-icon ${allCollapsed ? 'collapsed' : ''}">▼</span>
      </div>
      <div class="items-grid ${allCollapsed ? 'collapsed' : ''}" id="group-${typeId}">
        ${itemCards}
      </div>
    </div>
  `;
}

// Render all items
function renderItems() {
  // Filter and sort items
  const filteredItems = filterItems();
  const sortedItems = sortItems(filteredItems);
  const groupedItems = groupItemsByType(sortedItems);
  
  // Check if no results
  if (Object.keys(filteredItems).length === 0) {
    itemsContainer.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  
  noResults.style.display = 'none';
  
  // Create HTML for each type group
  const groupsHtml = Object.entries(groupedItems)
    .sort(([typeA], [typeB]) => typeA.localeCompare(typeB)) // Sort type names alphabetically
    .map(([type, items]) => createTypeGroup(type, items))
    .join('');
  
  itemsContainer.innerHTML = groupsHtml;
  
  // Update toggle button text after rendering
  updateToggleAllButton();
}

// Toggle individual group
function toggleGroup(typeId) {
  const group = document.getElementById(`group-${typeId}`);
  const icon = group.parentElement.querySelector('.collapse-icon');
  
  if (group.classList.contains('collapsed')) {
    group.classList.remove('collapsed');
    icon.classList.remove('collapsed');
  } else {
    group.classList.add('collapsed');
    icon.classList.add('collapsed');
  }
  
  // Update toggle all button text based on current state
  updateToggleAllButton();
}

// Toggle all groups
function toggleAllGroups() {
  const allGroups = document.querySelectorAll('.items-grid');
  const allIcons = document.querySelectorAll('.collapse-icon');
  
  if (allCollapsed) {
    // Expand all
    allGroups.forEach(group => group.classList.remove('collapsed'));
    allIcons.forEach(icon => icon.classList.remove('collapsed'));
    allCollapsed = false;
    toggleAllBtn.textContent = 'Collapse All';
  } else {
    // Collapse all
    allGroups.forEach(group => group.classList.add('collapsed'));
    allIcons.forEach(icon => icon.classList.add('collapsed'));
    allCollapsed = true;
    toggleAllBtn.textContent = 'Expand All';
  }
}

// Update toggle all button text based on current state
function updateToggleAllButton() {
  const allGroups = document.querySelectorAll('.items-grid');
  const collapsedGroups = document.querySelectorAll('.items-grid.collapsed');
  
  if (collapsedGroups.length === allGroups.length) {
    allCollapsed = true;
    toggleAllBtn.textContent = 'Expand All';
  } else if (collapsedGroups.length === 0) {
    allCollapsed = false;
    toggleAllBtn.textContent = 'Collapse All';
  } else {
    // Mixed state - show expand all to make it consistent
    toggleAllBtn.textContent = 'Expand All';
  }
}

// Show item details in modal
function showItemDetails(itemId) {
  const item = items[itemId];
  if (!item) return;
  
  modalItemName.textContent = itemId;
  modalItemJson.textContent = JSON.stringify(item, null, 2);
  modal.style.display = 'block';
}

// Hide modal
function hideModal() {
  modal.style.display = 'none';
}

// Make functions globally available
globalThis.showItemDetails = showItemDetails;
globalThis.toggleGroup = toggleGroup;

// Initialize when DOM is loaded
init();