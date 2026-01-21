// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("name");
})();

const kingdomNameEl = document.getElementById("kingdomName");
kingdomNameEl.textContent = name ? `${name}'s Events` : "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].events) kingdoms[name].events = { future: [], past: [] };


function getIconForEvent(event) {
  if (event.isSecret) return '🔒';
  if (!event.hasCountdown) return '⚠️';
  const mapping = {
    'construction': '🏗️',
    'upgrade': '⏫',
    'disaster': '🌪️',
    'beast': '👹',
    'heal': '❤️‍🩹',
  };
  return mapping[event.eventType] || '📅';
}

// Migrate existing events to include hasCountdown property
function migrateEvents() {
  let needsSave = false;
  
  kingdoms[name].events.future.forEach(event => {
    if (event.hasCountdown === undefined) {
      event.hasCountdown = event.remainingMonths !== null && event.remainingMonths !== undefined;
      needsSave = true;
    }
  });
  
  kingdoms[name].events.past.forEach(event => {
    if (event.hasCountdown === undefined) {
      event.hasCountdown = true; // Assume past events had countdown
      needsSave = true;
    }
  });
  
  if (needsSave) {
    saveKingdoms();
  }
}

migrateEvents();

function saveKingdoms() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
}

// Base64 encoding/decoding for secret events
function encodeSecret(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeSecret(encodedText) {
  try {
    return decodeURIComponent(escape(atob(encodedText)));
  } catch (e) {
    return encodedText; // Return as-is if decoding fails
  }
}

// Calculate months from years and months
function calculateTotalMonths(years, months) {
  return (years * 12) + months;
}

// Convert total months back to years and months
function monthsToYearsMonths(totalMonths) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return { years, months };
}

// Get countdown display
function getCountdownDisplay(remainingMonths) {
  if (remainingMonths <= 0) return "Happening Now!";
  
  const { years, months } = monthsToYearsMonths(remainingMonths);
  
  if (years > 0 && months > 0) {
    return `${years}y ${months}m`;
  } else if (years > 0) {
    return `${years}y`;
  } else {
    return `${months}m`;
  }
}

// Check for happening events (events with 0 or negative remaining months)
function getHappeningEventsCount() {
  return kingdoms[name].events.future.filter(event => 
    event.hasCountdown && event.remainingMonths <= 0
  ).length;
}

// Add new event
function addEvent() {
  const title = document.getElementById('eventTitle').value.trim();
  const hasCountdown = document.getElementById('hasCountdown').checked;
  const years = parseInt(document.getElementById('eventYears').value) || 0;
  const months = parseInt(document.getElementById('eventMonths').value) || 0;
  const isSecret = document.getElementById('eventSecret').checked;
  
  if (!title) {
    alert('Please enter an event title');
    return;
  }
  
  let totalMonths = null;
  if (hasCountdown) {
    totalMonths = calculateTotalMonths(years, months);
    if (totalMonths <= 0) {
      alert('Event with countdown must be scheduled for at least 1 month in the future');
      return;
    }
  }
  
  const event = {
    id: Date.now(), // Simple ID generation
    title: isSecret ? encodeSecret(title) : title,
    remainingMonths: totalMonths,
    hasCountdown,
    isSecret,
    isHappened: false,
    eventType: 'custom'
  };
  
  kingdoms[name].events.future.push(event);
  saveKingdoms();
  
  // Clear form
  document.getElementById('eventTitle').value = '';
  document.getElementById('hasCountdown').checked = true;
  document.getElementById('eventYears').value = '0';
  document.getElementById('eventMonths').value = '1';
  document.getElementById('eventSecret').checked = false;
  toggleCountdownInputs(); // Reset form state
  
  renderEvents();
}

// Toggle event secret status
function toggleEventSecret(eventId, isFuture = true) {
  const eventsList = isFuture ? kingdoms[name].events.future : kingdoms[name].events.past;
  const event = eventsList.find(e => e.id === eventId);
  
  if (event) {
    if (event.isSecret) {
      // Decode from base64
      event.title = decodeSecret(event.title);
      event.isSecret = false;
    } else {
      // Encode to base64
      event.title = encodeSecret(event.title);
      event.isSecret = true;
    }
    
    saveKingdoms();
    renderEvents();
  }
}

// Mark event as happened
function markEventHappened(eventId) {
  const eventIndex = kingdoms[name].events.future.findIndex(e => e.id === eventId);
  
  if (eventIndex !== -1) {
    const event = kingdoms[name].events.future.splice(eventIndex, 1)[0];
    event.isHappened = true;
    
    
    // Handle building-related events
    if (event.buildingId && event.eventType) {
      const building = kingdoms[name].buildings?.find(b => b.name === event.buildingId);
      console.log(building);
      
      if (building) {
        if (event.eventType === 'upgrade') {
          // Complete the upgrade
          if (building.upgradeInProgress && building.targetLevel) {
            building.currentLevel = building.targetLevel;
            delete building.upgradeInProgress;
            delete building.targetLevel;
          }
          building.state = "enabled";
          alert(`${building.name} upgrade completed! Building re-enabled.`);
        } else if (event.eventType === 'construction') {
          // Complete the construction
          if (building.constructionInProgress) {
            delete building.constructionInProgress;
          }
          building.state = "enabled";
          alert(`${building.name} construction completed! Building is now operational.`);
        }
        
        // Save the updated building data
        localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
      }
    }
    
    kingdoms[name].events.past.push(event);
    saveKingdoms();
    renderEvents();
  }
}

// Delete event
function deleteEvent(eventId, isFuture = true) {
  const eventsList = isFuture ? kingdoms[name].events.future : kingdoms[name].events.past;
  const eventIndex = eventsList.findIndex(e => e.id === eventId);
  
  if (eventIndex !== -1) {
    if (confirm('Are you sure you want to delete this event?')) {
      eventsList.splice(eventIndex, 1);
      saveKingdoms();
      renderEvents();
    }
  }
}

// Bulk Operations
function deleteAllPastEvents() {
  if (kingdoms[name].events.past.length === 0) {
    alert('No past events to delete.');
    return;
  }
  
  const count = kingdoms[name].events.past.length;
  if (confirm(`Are you sure you want to delete all ${count} past events? This action cannot be undone.`)) {
    kingdoms[name].events.past = [];
    saveKingdoms();
    renderEvents();
    alert(`Deleted ${count} past events.`);
  }
}

function reduceAllEventsByOneMonth() {
  const futureEventsWithCountdown = kingdoms[name].events.future.filter(event => event.hasCountdown);
  
  if (futureEventsWithCountdown.length === 0) {
    alert('No future events with countdown to reduce.');
    return;
  }
  
  const count = futureEventsWithCountdown.length;
  if (confirm(`Reduce ${count} future events by 1 month? This will advance time for all events.`)) {
    kingdoms[name].events.future.forEach(event => {
      if (event.hasCountdown && event.remainingMonths > 0) {
        event.remainingMonths = Math.max(0, event.remainingMonths - 1);
      }
    });
    
    saveKingdoms();
    renderEvents();
    alert(`Reduced ${count} events by 1 month.`);
  }
}

function markAllHappeningEventsAsHappened() {
  const happeningEvents = kingdoms[name].events.future.filter(event => 
    event.hasCountdown && event.remainingMonths <= 0
  );
  
  if (happeningEvents.length === 0) {
    alert('No happening events to mark as happened.');
    return;
  }
  
  const count = happeningEvents.length;
  if (confirm(`Are you sure you want to mark all ${count} happening events as happened?`)) {
    // Process building events first
    happeningEvents.forEach(event => {
      if (event.buildingId && event.eventType) {
        const building = kingdoms[name].buildings?.find(b => b.name === event.buildingId);
        
        if (building) {
          if (event.eventType === 'upgrade') {
            // Complete the upgrade
            if (building.upgradeInProgress && building.targetLevel) {
              building.currentLevel = building.targetLevel;
              delete building.upgradeInProgress;
              delete building.targetLevel;
            }
            building.state = "enabled";
          } else if (event.eventType === 'construction') {
            // Complete the construction
            if (building.constructionInProgress) {
              delete building.constructionInProgress;
            }
            building.state = "enabled";
          }
        }
      }
    });
    
    // Move happening events from future to past
    kingdoms[name].events.future = kingdoms[name].events.future.filter(event => {
      if (event.hasCountdown && event.remainingMonths <= 0) {
        event.isHappened = true;
        kingdoms[name].events.past.push(event);
        return false; // Remove from future
      }
      return true; // Keep in future
    });
    
    saveKingdoms();
    renderEvents();
    
    const buildingEventsCount = happeningEvents.filter(e => e.buildingId && e.eventType).length;
    if (buildingEventsCount > 0) {
      alert(`Marked ${count} happening events as happened. ${buildingEventsCount} buildings have been completed and re-enabled.`);
    } else {
      alert(`Marked ${count} happening events as happened.`);
    }
  }
}

function deleteAllFutureEvents() {
  if (kingdoms[name].events.future.length === 0) {
    alert('No future events to delete.');
    return;
  }
  
  const count = kingdoms[name].events.future.length;
  if (confirm(`Are you sure you want to delete all ${count} future events? This action cannot be undone.`)) {
    kingdoms[name].events.future = [];
    saveKingdoms();
    renderEvents();
    alert(`Deleted ${count} future events.`);
  }
}

// Render events
function renderEvents() {
  renderFutureEvents();
  renderPastEvents();
  updateEventCounts();
}

function renderFutureEvents() {
  const container = document.getElementById('futureEventsList');
  container.innerHTML = '';
  
  // Sort by remaining months (ascending), reminders at the end
  const sortedEvents = [...kingdoms[name].events.future].sort((a, b) => {
    if (!a.hasCountdown && !b.hasCountdown) return 0;
    if (!a.hasCountdown) return 1;
    if (!b.hasCountdown) return -1;
    return a.remainingMonths - b.remainingMonths;
  });
  
  // Group events by remaining months
  const eventGroups = new Map();
  
  sortedEvents.forEach(event => {
    let groupKey;
    let groupLabel;
    let groupClass = '';
    
    if (!event.hasCountdown) {
      groupKey = 'reminders';
      groupLabel = 'Reminders';
      groupClass = 'reminder';
    } else if (event.remainingMonths <= 0) {
      groupKey = 'happening';
      groupLabel = 'Happening Now!';
      groupClass = 'happening';
    } else {
      groupKey = event.remainingMonths;
      const { years, months } = monthsToYearsMonths(event.remainingMonths);
      if (years > 0 && months > 0) {
        groupLabel = `In ${years}y ${months}m`;
      } else if (years > 0) {
        groupLabel = `In ${years}y`;
      } else {
        groupLabel = `In ${months}m`;
      }
    }
    
    if (!eventGroups.has(groupKey)) {
      eventGroups.set(groupKey, {
        label: groupLabel,
        class: groupClass,
        events: []
      });
    }
    
    eventGroups.get(groupKey).events.push(event);
  });
  
  // Render each group
  eventGroups.forEach((group, groupKey) => {
    const monthGroupDiv = document.createElement('div');
    monthGroupDiv.className = 'month-group';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = `month-group-header ${group.class}`;
    headerDiv.textContent = `${group.label} (${group.events.length})`;
    
    const eventsDiv = document.createElement('div');
    eventsDiv.className = 'month-group-events';
    
    group.events.forEach(event => {
      const isHappening = event.hasCountdown && event.remainingMonths <= 0;
      
      const eventDiv = document.createElement('div');
      eventDiv.className = `event-item ${isHappening ? 'happening' : ''} ${event.isSecret ? 'secret' : ''}`;
      
      const displayTitle = event.title;
      const eventIcon = getIconForEvent(event);
      
      eventDiv.innerHTML = `
        <div class="event-header">
          <div class="event-title ${event.isSecret ? 'event-description' : ''}">${displayTitle}</div>
          <div class="event-countdown">${eventIcon}</div>
        </div>
        <div class="event-controls">
          <label>
            <input type="checkbox" ${event.isSecret ? 'checked' : ''} onchange="toggleEventSecret(${event.id}, true)" />
            Secret
          </label>
          <button class="btn success-btn" onclick="markEventHappened(${event.id})">Mark as Happened</button>
          <button class="btn danger-btn" onclick="deleteEvent(${event.id}, true)">Delete</button>
        </div>
      `;
      
      eventsDiv.appendChild(eventDiv);
    });
    
    monthGroupDiv.appendChild(headerDiv);
    monthGroupDiv.appendChild(eventsDiv);
    container.appendChild(monthGroupDiv);
  });
}

function renderPastEvents() {
  const container = document.getElementById('pastEventsList');
  container.innerHTML = '';
  
  // Sort by most recent first (assuming higher ID = more recent)
  const sortedEvents = [...kingdoms[name].events.past].sort((a, b) => b.id - a.id);
  
  sortedEvents.forEach(event => {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event-item ${event.isSecret ? 'secret' : ''}`;
    
    const displayTitle = event.title;
    const eventIcon = getIconForEvent(event);
    
    eventDiv.innerHTML = `
      <div class="event-header">
        <div class="event-title ${event.isSecret ? 'event-description' : ''}">${displayTitle}</div>
        <div class="event-countdown">${eventIcon}</div>
      </div>
      <div class="event-controls">
        <label>
          <input type="checkbox" ${event.isSecret ? 'checked' : ''} onchange="toggleEventSecret(${event.id}, false)" />
          Secret
        </label>
        <button class="btn danger-btn" onclick="deleteEvent(${event.id}, false)">Delete</button>
      </div>
    `;
    
    container.appendChild(eventDiv);
  });
}

function updateEventCounts() {
  document.getElementById('futureEventsCount').textContent = kingdoms[name].events.future.length;
  document.getElementById('pastEventsCount').textContent = kingdoms[name].events.past.length;
}

// Toggle past events visibility
function togglePastEvents() {
  const pastEventsList = document.getElementById('pastEventsList');
  const toggleBtn = document.getElementById('togglePastEventsBtn');
  
  if (pastEventsList.classList.contains('show')) {
    pastEventsList.classList.remove('show');
    toggleBtn.textContent = 'Show Past Events';
  } else {
    pastEventsList.classList.add('show');
    toggleBtn.textContent = 'Hide Past Events';
  }
}

// Reduce event countdowns (called from storage page)
function reduceEventCountdowns() {
  kingdoms[name].events.future.forEach(event => {
    if (event.hasCountdown) {
      event.remainingMonths = Math.max(0, event.remainingMonths - 1);
    }
  });
  saveKingdoms();
}

// Toggle countdown inputs based on hasCountdown checkbox
function toggleCountdownInputs() {
  const hasCountdown = document.getElementById('hasCountdown').checked;
  const countdownInputs = document.querySelectorAll('.countdown-inputs');
  const yearsInput = document.getElementById('eventYears');
  const monthsInput = document.getElementById('eventMonths');
  
  countdownInputs.forEach(input => {
    if (hasCountdown) {
      input.classList.remove('disabled');
    } else {
      input.classList.add('disabled');
    }
  });
  
  yearsInput.disabled = !hasCountdown;
  monthsInput.disabled = !hasCountdown;
  
  if (!hasCountdown) {
    yearsInput.value = '0';
    monthsInput.value = '0';
  } else {
    yearsInput.value = '0';
    monthsInput.value = '1';
  }
}

// Make functions globally available
globalThis.toggleEventSecret = toggleEventSecret;
globalThis.markEventHappened = markEventHappened;
globalThis.deleteEvent = deleteEvent;
globalThis.reduceEventCountdowns = reduceEventCountdowns;
globalThis.getHappeningEventsCount = getHappeningEventsCount;

// Event listeners
document.getElementById('addEventBtn').addEventListener('click', addEvent);
document.getElementById('togglePastEventsBtn').addEventListener('click', togglePastEvents);
document.getElementById('hasCountdown').addEventListener('change', toggleCountdownInputs);

// Bulk operation event listeners
document.getElementById('reduceAllEventsBtn').addEventListener('click', reduceAllEventsByOneMonth);
document.getElementById('deleteAllPastBtn').addEventListener('click', deleteAllPastEvents);
document.getElementById('markAllHappeningBtn').addEventListener('click', markAllHappeningEventsAsHappened);
document.getElementById('deleteAllFutureBtn').addEventListener('click', deleteAllFutureEvents);

// Initialize form state
toggleCountdownInputs();

// Initial render
renderEvents();