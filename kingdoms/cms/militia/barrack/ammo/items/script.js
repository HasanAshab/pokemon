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

// State
let currentItems = items;
let currentSearch = '';
let currentSort = 'cheap';

// Initialize the page
function init() {
  setupEventListeners();
  renderItems();
}

// Setup event listeners
function setupEventListeners() {
  searchInput.addEventListener('input', handleSearch);
  sortSelect.addEventListener('change', handleSort);
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
    if (["age_genetics", "nation_genetics"].includes(item.type))
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
  
  type = type.replace('_', ' ');
  return `
    <div class="type-group">
      <div class="type-header">
        ${type} (${itemCount} items)
      </div>
      <div class="items-grid">
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

// Make showItemDetails globally available
globalThis.showItemDetails = showItemDetails;

// Initialize when DOM is loaded
init();