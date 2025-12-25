import { saveKingdoms } from "../../utils.js";

let kingdoms = {};
let currentKingdom = null;
let originalJson = '';

// DOM elements
const kingdomSelect = document.getElementById('kingdom-select');
const kingdomInfo = document.getElementById('kingdom-info');
const jsonEditor = document.getElementById('json-editor');
const jsonPreview = document.getElementById('json-preview');
const jsonPath = document.getElementById('json-path');
const statusDiv = document.getElementById('status');
const formatBtn = document.getElementById('format-btn');
const validateBtn = document.getElementById('validate-btn');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const previewTab = document.getElementById('preview-tab');
const editTab = document.getElementById('edit-tab');

let currentMode = 'preview'; // Default to preview mode

// Initialize the editor
function init() {
    loadKingdoms();
    setupEventListeners();
    
    // Load current kingdom if set
    const currentKingdomName = localStorage.getItem('$current_kingdom');
    if (currentKingdomName) {
        kingdomSelect.value = encodeURIComponent(currentKingdomName);
        loadKingdom(encodeURIComponent(currentKingdomName));
    }
}

// Load kingdoms from localStorage
function loadKingdoms() {
    try {
        kingdoms = JSON.parse(localStorage.getItem("kingdoms")) || {};
        populateKingdomSelect();
    } catch (error) {
        showStatus('Error loading kingdoms: ' + error.message, 'error');
    }
}

// Populate kingdom dropdown
function populateKingdomSelect() {
    kingdomSelect.innerHTML = '<option value="">Choose a kingdom...</option>';
    
    Object.keys(kingdoms).forEach(encodedName => {
        const decodedName = decodeURIComponent(encodedName);
        const option = document.createElement('option');
        option.value = encodedName;
        option.textContent = decodedName;
        kingdomSelect.appendChild(option);
    });
}

// Load selected kingdom
function loadKingdom(encodedName) {
    if (!encodedName || !kingdoms[encodedName]) {
        clearEditor();
        return;
    }
    
    currentKingdom = encodedName;
    const decodedName = decodeURIComponent(encodedName);
    const kingdom = kingdoms[encodedName];
    
    // Update info
    kingdomInfo.textContent = `Editing: ${decodedName}`;
    jsonPath.textContent = `kingdoms["${encodedName}"]`;
    
    // Load JSON into editor
    originalJson = JSON.stringify(kingdom, null, 2);
    jsonEditor.value = originalJson;
    
    // Update preview
    updatePreview();
    
    // Switch to preview mode by default
    switchMode('preview');
    
    showStatus('Kingdom loaded successfully', 'success');
}

// Clear editor
function clearEditor() {
    currentKingdom = null;
    originalJson = '';
    jsonEditor.value = '';
    jsonPreview.innerHTML = '';
    kingdomInfo.textContent = '';
    jsonPath.textContent = '';
    hideStatus();
}

// Switch between preview and edit modes
function switchMode(mode) {
    currentMode = mode;
    
    if (mode === 'preview') {
        previewTab.classList.add('active');
        editTab.classList.remove('active');
        jsonPreview.classList.add('active');
        jsonEditor.classList.remove('active');
        updatePreview();
    } else {
        editTab.classList.add('active');
        previewTab.classList.remove('active');
        jsonEditor.classList.add('active');
        jsonPreview.classList.remove('active');
        // Sync editor content when switching to edit mode
        if (jsonEditor.value !== originalJson) {
            updatePreview();
        }
    }
}

// Update preview panel
function updatePreview() {
    try {
        const jsonText = jsonEditor.value.trim();
        if (!jsonText) {
            jsonPreview.innerHTML = '<em style="color: #7f8c8d;">No content to preview</em>';
            return;
        }
        
        const parsed = JSON.parse(jsonText);
        const formatted = JSON.stringify(parsed, null, 2);
        
        // Syntax highlighting for preview mode
        const highlighted = syntaxHighlight(formatted);
        jsonPreview.innerHTML = highlighted;
        
    } catch (error) {
        jsonPreview.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">Invalid JSON:</span>\n<span style="color: #e74c3c;">${error.message}</span>`;
    }
}

// Basic syntax highlighting
function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// Format JSON
function formatJson() {
    try {
        const jsonText = jsonEditor.value.trim();
        if (!jsonText) {
            showStatus('No content to format', 'warning');
            return;
        }
        
        const parsed = JSON.parse(jsonText);
        const formatted = JSON.stringify(parsed, null, 2);
        jsonEditor.value = formatted;
        updatePreview();
        showStatus('JSON formatted successfully', 'success');
    } catch (error) {
        showStatus('Invalid JSON: ' + error.message, 'error');
    }
}

// Validate JSON
function validateJson() {
    try {
        const jsonText = jsonEditor.value.trim();
        if (!jsonText) {
            showStatus('No content to validate', 'warning');
            return;
        }
        
        JSON.parse(jsonText);
        showStatus('JSON is valid', 'success');
    } catch (error) {
        showStatus('Invalid JSON: ' + error.message, 'error');
    }
}

// Save changes
function saveChanges() {
    if (!currentKingdom) {
        showStatus('No kingdom selected', 'warning');
        return;
    }
    
    try {
        const jsonText = jsonEditor.value.trim();
        if (!jsonText) {
            showStatus('Cannot save empty content', 'error');
            return;
        }
        
        const parsed = JSON.parse(jsonText);
        
        // Update kingdoms object
        kingdoms[currentKingdom] = parsed;
        
        // Save to localStorage
        saveKingdoms(kingdoms);
        
        // Update original JSON
        originalJson = JSON.stringify(parsed, null, 2);
        
        showStatus('Kingdom saved successfully', 'success');
        
    } catch (error) {
        showStatus('Cannot save invalid JSON: ' + error.message, 'error');
    }
}

// Reset to original
function resetChanges() {
    if (!currentKingdom) {
        showStatus('No kingdom selected', 'warning');
        return;
    }
    
    if (confirm('Are you sure you want to reset all changes? This cannot be undone.')) {
        jsonEditor.value = originalJson;
        updatePreview();
        showStatus('Changes reset', 'success');
    }
}

// Show status message
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status status-${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-hide after 3 seconds for success messages
    if (type === 'success') {
        setTimeout(hideStatus, 3000);
    }
}

// Hide status message
function hideStatus() {
    statusDiv.style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    kingdomSelect.addEventListener('change', (e) => {
        loadKingdom(e.target.value);
    });
    
    jsonEditor.addEventListener('input', () => {
        if (currentMode === 'preview') {
            updatePreview();
        }
    });
    
    // Mode switching
    previewTab.addEventListener('click', () => {
        switchMode('preview');
    });
    
    editTab.addEventListener('click', () => {
        switchMode('edit');
    });
    
    formatBtn.addEventListener('click', formatJson);
    validateBtn.addEventListener('click', validateJson);
    saveBtn.addEventListener('click', saveChanges);
    resetBtn.addEventListener('click', resetChanges);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveChanges();
        }
        
        // Ctrl+Shift+F to format
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            formatJson();
        }
        
        // Ctrl+E to switch to edit mode
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            switchMode('edit');
        }
        
        // Ctrl+P to switch to preview mode
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            switchMode('preview');
        }
    });
    
    // Tab key for indentation in edit mode
    jsonEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.substring(0, start) + '  ' + e.target.value.substring(end);
            e.target.selectionStart = e.target.selectionEnd = start + 2;
        }
    });
}

// Add CSS for syntax highlighting
const style = document.createElement('style');
style.textContent = `
    .string { color: #27ae60; }
    .number { color: #3498db; }
    .boolean { color: #9b59b6; }
    .null { color: #95a5a6; }
    .key { color: #e74c3c; font-weight: bold; }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
window.addEventListener('load', init);