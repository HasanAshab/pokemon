/**
 * KINGDOM MAP SYSTEM
 * 
 * ASSUMPTIONS:
 * - Grid cell size: 1 sq km
 * - Map dimensions: 2000x2000 cells (2000km x 2000km)
 * - Grid is deterministic and never changes
 * - Territory coordinates are stored as {x, y} objects
 * - Colors are stored as hex strings
 * - All changes persist immediately to localStorage
 */

// ===== CONSTANTS =====
const GRID_SIZE = 2; // pixels per cell (reduced from 20)
const MAP_WIDTH = 2000; // cells
const MAP_HEIGHT = 2000; // cells
const CANVAS_WIDTH = MAP_WIDTH * GRID_SIZE; // 4000px instead of 40000px
const CANVAS_HEIGHT = MAP_HEIGHT * GRID_SIZE; // 4000px instead of 40000px

// ===== STATE =====
let kingdoms = {};
let selectedKingdom = '';
let captureMode = 'default'; // 'default', 'edit', 'conflict'
let captureMultiplier = 1;
let showGrid = false;
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let mapOffset = { x: 0, y: 0 };

// ===== DOM ELEMENTS =====
const mapContainer = document.getElementById('mapContainer');
const mapViewport = document.getElementById('mapViewport');
const mapCanvas = document.getElementById('mapCanvas');
const gridCanvas = document.getElementById('gridCanvas');
const labelsCanvas = document.getElementById('labelsCanvas');
const kingdomSelect = document.getElementById('kingdomSelect');
const captureMultiplierSelect = document.getElementById('captureMultiplier');
const statusMessage = document.getElementById('statusMessage');
const legendContent = document.getElementById('legendContent');

// Canvas contexts
const mapCtx = mapCanvas.getContext('2d');
const gridCtx = gridCanvas.getContext('2d');
const labelsCtx = labelsCanvas.getContext('2d');

// ===== INITIALIZATION =====
function init() {
  loadKingdoms();
  setupCanvases();
  setupEventListeners();
  populateKingdomSelect();
  render();
  showStatus('Map loaded successfully', 'success');
}

function loadKingdoms() {
  const stored = localStorage.getItem('kingdoms');
  kingdoms = stored ? JSON.parse(stored) : {};
  
  // Initialize map data for kingdoms that don't have it
  Object.keys(kingdoms).forEach(name => {
    if (!kingdoms[name].map) {
      kingdoms[name].map = {
        color: generateRandomColor(),
        territory: [],
        locked: false
      };
    }
  });
  
  saveKingdoms();
}

function saveKingdoms() {
  localStorage.setItem('kingdoms', JSON.stringify(kingdoms));
}

function generateRandomColor() {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#10ac84', '#ee5a24', '#0abde3', '#3867d6', '#8854d0'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function setupCanvases() {
  // Set canvas dimensions
  [mapCanvas, gridCanvas, labelsCanvas].forEach(canvas => {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.width = CANVAS_WIDTH + 'px';
    canvas.style.height = CANVAS_HEIGHT + 'px';
  });
  
  // Ensure canvases have transparent backgrounds
  mapCtx.globalCompositeOperation = 'source-over';
  gridCtx.globalCompositeOperation = 'source-over';
  labelsCtx.globalCompositeOperation = 'source-over';
  
  // Set initial viewport position (start at 0,0 - no transform initially)
  mapOffset.x = 0;
  mapOffset.y = 0;
  updateViewportTransform();
}

function updateViewportTransform() {
  // Temporarily disable transform to debug
  // mapViewport.style.transform = `translate(${mapOffset.x}px, ${mapOffset.y}px)`;
  console.log('Transform would be:', `translate(${mapOffset.x}px, ${mapOffset.y}px)`);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Mode buttons
  document.getElementById('modeDefault').addEventListener('click', () => setMode('default'));
  document.getElementById('modeEdit').addEventListener('click', () => setMode('edit'));
  document.getElementById('modeConflict').addEventListener('click', () => setMode('conflict'));
  
  // Controls
  kingdomSelect.addEventListener('change', (e) => {
    selectedKingdom = e.target.value;
    updateLockButton();
  });
  
  captureMultiplierSelect.addEventListener('change', (e) => {
    captureMultiplier = parseInt(e.target.value);
  });
  
  document.getElementById('toggleGrid').addEventListener('click', toggleGrid);
  document.getElementById('lockKingdom').addEventListener('click', toggleKingdomLock);
  document.getElementById('clearTerritory').addEventListener('click', clearTerritory);
  
  // Map interactions
  mapContainer.addEventListener('mousedown', handleMouseDown);
  mapContainer.addEventListener('mousemove', handleMouseMove);
  mapContainer.addEventListener('mouseup', handleMouseUp);
  mapContainer.addEventListener('click', handleMapClick);
  
  // Touch events for mobile
  mapContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
  mapContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
  mapContainer.addEventListener('touchend', handleTouchEnd);
  
  // Prevent context menu
  mapContainer.addEventListener('contextmenu', (e) => e.preventDefault());
}

function setMode(mode) {
  captureMode = mode;
  
  // Update button states
  document.querySelectorAll('.mode-buttons button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeButton = {
    'default': 'modeDefault',
    'edit': 'modeEdit',
    'conflict': 'modeConflict'
  }[mode];
  
  document.getElementById(activeButton).classList.add('active');
  
  showStatus(`Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`, 'success');
}

// ===== MOUSE/TOUCH HANDLING =====
function handleMouseDown(e) {
  if (e.button === 0) { // Left click
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
    mapContainer.style.cursor = 'grabbing';
  }
}

function handleMouseMove(e) {
  if (isDragging) {
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    mapOffset.x += deltaX;
    mapOffset.y += deltaY;
    
    // Constrain to map bounds
    constrainMapOffset();
    updateViewportTransform();
    
    lastMousePos = { x: e.clientX, y: e.clientY };
  }
}

function handleMouseUp(e) {
  isDragging = false;
  mapContainer.style.cursor = 'crosshair';
}

function handleMapClick(e) {
  if (isDragging) return;
  
  const rect = mapContainer.getBoundingClientRect();
  const x = e.clientX - rect.left - mapOffset.x;
  const y = e.clientY - rect.top - mapOffset.y;
  
  const gridX = Math.floor(x / GRID_SIZE);
  const gridY = Math.floor(y / GRID_SIZE);
  
  handleCellClick(gridX, gridY);
}

function handleTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    isDragging = true;
    lastMousePos = { x: touch.clientX, y: touch.clientY };
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (isDragging && e.touches.length === 1) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastMousePos.x;
    const deltaY = touch.clientY - lastMousePos.y;
    
    mapOffset.x += deltaX;
    mapOffset.y += deltaY;
    
    constrainMapOffset();
    updateViewportTransform();
    
    lastMousePos = { x: touch.clientX, y: touch.clientY };
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  if (e.touches.length === 0) {
    isDragging = false;
    
    // Handle tap for territory capture
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const rect = mapContainer.getBoundingClientRect();
      const x = touch.clientX - rect.left - mapOffset.x;
      const y = touch.clientY - rect.top - mapOffset.y;
      
      const gridX = Math.floor(x / GRID_SIZE);
      const gridY = Math.floor(y / GRID_SIZE);
      
      handleCellClick(gridX, gridY);
    }
  }
}

function constrainMapOffset() {
  const containerWidth = mapContainer.clientWidth;
  const containerHeight = mapContainer.clientHeight;
  
  mapOffset.x = Math.min(0, Math.max(containerWidth - CANVAS_WIDTH, mapOffset.x));
  mapOffset.y = Math.min(0, Math.max(containerHeight - CANVAS_HEIGHT, mapOffset.y));
}

// ===== TERRITORY CAPTURE =====
function handleCellClick(x, y) {
  if (!selectedKingdom) {
    showStatus('Please select a kingdom first', 'error');
    return;
  }
  
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
    return; // Out of bounds
  }
  
  const kingdom = kingdoms[selectedKingdom];
  if (!kingdom) return;
  
  if (kingdom.map.locked) {
    showStatus('Kingdom is locked', 'error');
    return;
  }
  
  switch (captureMode) {
    case 'default':
      handleSmartCapture(x, y);
      break;
    case 'edit':
      handleEditCapture(x, y);
      break;
    case 'conflict':
      handleConflictCapture(x, y);
      break;
  }
}

function handleSmartCapture(x, y) {
  const owner = getCellOwner(x, y);
  
  if (!owner) {
    // Cell is uncaptured, capture it directly
    captureCells([{x, y}]);
  } else if (owner !== selectedKingdom) {
    // Cell is owned by another kingdom, find closest uncaptured cells
    const uncapturedCells = findClosestUncapturedCells(x, y, captureMultiplier);
    if (uncapturedCells.length > 0) {
      captureCells(uncapturedCells);
    } else {
      showStatus('No uncaptured cells nearby', 'error');
    }
  } else {
    // Already owned by selected kingdom
    showStatus('Already owned by this kingdom', 'error');
  }
}

function handleEditCapture(x, y) {
  const cellsToCapture = getCellsInRadius(x, y, captureMultiplier);
  captureCells(cellsToCapture);
}

function handleConflictCapture(x, y) {
  const owner = getCellOwner(x, y);
  
  if (owner && owner !== selectedKingdom) {
    if (confirm(`Capture territory from ${owner}?`)) {
      const cellsToCapture = getCellsInRadius(x, y, captureMultiplier);
      captureCells(cellsToCapture);
    }
  } else {
    const cellsToCapture = getCellsInRadius(x, y, captureMultiplier);
    captureCells(cellsToCapture);
  }
}

function getCellOwner(x, y) {
  for (const [kingdomName, kingdom] of Object.entries(kingdoms)) {
    if (kingdom.map.territory.some(cell => cell.x === x && cell.y === y)) {
      return kingdomName;
    }
  }
  return null;
}

function findClosestUncapturedCells(centerX, centerY, count) {
  const uncaptured = [];
  const maxRadius = Math.max(MAP_WIDTH, MAP_HEIGHT);
  
  for (let radius = 1; radius <= maxRadius && uncaptured.length < count; radius++) {
    const cellsAtRadius = getCellsInRadius(centerX, centerY, radius * radius);
    
    for (const cell of cellsAtRadius) {
      if (uncaptured.length >= count) break;
      if (!getCellOwner(cell.x, cell.y)) {
        uncaptured.push(cell);
      }
    }
  }
  
  return uncaptured.slice(0, count);
}

function getCellsInRadius(centerX, centerY, count) {
  const cells = [];
  const radius = Math.ceil(Math.sqrt(count));
  
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const x = centerX + dx;
      const y = centerY + dy;
      
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        const distance = dx * dx + dy * dy;
        cells.push({ x, y, distance });
      }
    }
  }
  
  // Sort by distance and take the closest cells
  cells.sort((a, b) => a.distance - b.distance);
  return cells.slice(0, count).map(cell => ({ x: cell.x, y: cell.y }));
}

function captureCells(cells) {
  const kingdom = kingdoms[selectedKingdom];
  if (!kingdom) return;
  
  // Remove cells from other kingdoms
  Object.values(kingdoms).forEach(k => {
    k.map.territory = k.map.territory.filter(cell => 
      !cells.some(newCell => newCell.x === cell.x && newCell.y === cell.y)
    );
  });
  
  // Add cells to selected kingdom (avoid duplicates)
  cells.forEach(cell => {
    if (!kingdom.map.territory.some(existing => existing.x === cell.x && existing.y === cell.y)) {
      kingdom.map.territory.push(cell);
    }
  });
  
  saveKingdoms();
  render();
  updateLegend();
  
  showStatus(`Captured ${cells.length} cell(s)`, 'success');
}

// ===== RENDERING =====
function render() {
  clearCanvases();
  if (showGrid) renderGrid();
  renderTerritories();
  renderLabels();
}

function clearCanvases() {
  // Clear canvases properly without filling with black
  mapCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gridCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  labelsCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function renderGrid() {
  gridCtx.strokeStyle = '#333';
  gridCtx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x <= MAP_WIDTH; x += 10) {
    gridCtx.beginPath();
    gridCtx.moveTo(x * GRID_SIZE, 0);
    gridCtx.lineTo(x * GRID_SIZE, CANVAS_HEIGHT);
    gridCtx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y <= MAP_HEIGHT; y += 10) {
    gridCtx.beginPath();
    gridCtx.moveTo(0, y * GRID_SIZE);
    gridCtx.lineTo(CANVAS_WIDTH, y * GRID_SIZE);
    gridCtx.stroke();
  }
}

function renderTerritories() {
  Object.entries(kingdoms).forEach(([name, kingdom]) => {
    if (kingdom.map.territory.length === 0) return;
    
    mapCtx.fillStyle = kingdom.map.color + '80'; // Semi-transparent
    
    kingdom.map.territory.forEach(cell => {
      mapCtx.fillRect(
        cell.x * GRID_SIZE,
        cell.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
      );
    });
    
    // Border
    mapCtx.strokeStyle = kingdom.map.color;
    mapCtx.lineWidth = 1;
    
    kingdom.map.territory.forEach(cell => {
      mapCtx.strokeRect(
        cell.x * GRID_SIZE,
        cell.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
      );
    });
  });
}

function renderLabels() {
  Object.entries(kingdoms).forEach(([name, kingdom]) => {
    if (kingdom.map.territory.length < 10) return; // Hide small territories
    
    const centroid = calculateCentroid(kingdom.map.territory);
    if (!centroid) return;
    
    const x = centroid.x * GRID_SIZE + GRID_SIZE / 2;
    const y = centroid.y * GRID_SIZE + GRID_SIZE / 2;
    
    // Text styling
    labelsCtx.font = 'bold 14px Arial';
    labelsCtx.textAlign = 'center';
    labelsCtx.textBaseline = 'middle';
    
    // Text shadow
    labelsCtx.fillStyle = '#000';
    labelsCtx.fillText(name, x + 1, y + 1);
    
    // Main text
    labelsCtx.fillStyle = getContrastColor(kingdom.map.color);
    labelsCtx.fillText(name, x, y);
  });
}

function calculateCentroid(territory) {
  if (territory.length === 0) return null;
  
  const sum = territory.reduce((acc, cell) => ({
    x: acc.x + cell.x,
    y: acc.y + cell.y
  }), { x: 0, y: 0 });
  
  return {
    x: Math.round(sum.x / territory.length),
    y: Math.round(sum.y / territory.length)
  };
}

function getContrastColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000' : '#fff';
}

// ===== UI UPDATES =====
function populateKingdomSelect() {
  kingdomSelect.innerHTML = '<option value="">Select Kingdom</option>';
  
  Object.keys(kingdoms).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    kingdomSelect.appendChild(option);
  });
}

function updateLegend() {
  const sortedKingdoms = Object.entries(kingdoms)
    .map(([name, kingdom]) => ({
      name,
      area: kingdom.map.territory.length,
      color: kingdom.map.color,
      locked: kingdom.map.locked
    }))
    .sort((a, b) => b.area - a.area);
  
  legendContent.innerHTML = sortedKingdoms.map(kingdom => `
    <div class="kingdom-item">
      <div class="kingdom-info">
        <div class="kingdom-color" style="background-color: ${kingdom.color}"></div>
        <div class="kingdom-name">${kingdom.name}</div>
        ${kingdom.locked ? '<div class="kingdom-locked">🔒</div>' : ''}
      </div>
      <div class="kingdom-area">${kingdom.area} km²</div>
    </div>
  `).join('');
}

function updateLockButton() {
  const button = document.getElementById('lockKingdom');
  if (!selectedKingdom || !kingdoms[selectedKingdom]) {
    button.textContent = 'Lock Kingdom';
    button.disabled = true;
    return;
  }
  
  const isLocked = kingdoms[selectedKingdom].map.locked;
  button.textContent = isLocked ? 'Unlock Kingdom' : 'Lock Kingdom';
  button.disabled = false;
}

// ===== CONTROL FUNCTIONS =====
function toggleGrid() {
  showGrid = !showGrid;
  render();
  showStatus(`Grid ${showGrid ? 'enabled' : 'disabled'}`, 'success');
}

function toggleKingdomLock() {
  if (!selectedKingdom || !kingdoms[selectedKingdom]) return;
  
  const kingdom = kingdoms[selectedKingdom];
  kingdom.map.locked = !kingdom.map.locked;
  
  saveKingdoms();
  updateLockButton();
  updateLegend();
  
  const status = kingdom.map.locked ? 'locked' : 'unlocked';
  showStatus(`${selectedKingdom} ${status}`, 'success');
}

function clearTerritory() {
  if (!selectedKingdom || !kingdoms[selectedKingdom]) return;
  
  const kingdom = kingdoms[selectedKingdom];
  if (kingdom.map.locked) {
    showStatus('Cannot clear locked kingdom', 'error');
    return;
  }
  
  if (confirm(`Clear all territory for ${selectedKingdom}?`)) {
    kingdom.map.territory = [];
    saveKingdoms();
    render();
    updateLegend();
    showStatus(`Territory cleared for ${selectedKingdom}`, 'success');
  }
}

function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', init);