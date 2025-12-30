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
  return kingdoms[name].events.future.filter(event => event.remainingMonths <= 0).length;
}

// Add new event
function addEvent() {
  const title = document.getElementById('eventTitle').value.trim();
  const years = parseInt(document.getElementById('eventYears').value) || 0;
  const months = parseInt(document.getElementById('eventMonths').value) || 0;
  const isSecret = document.getElementById('eventSecret').checked;
  
  if (!title) {
    alert('Please enter an event title');
    return;
  }
  
  const totalMonths = calculateTotalMonths(years, months);
  if (totalMonths <= 0) {
    alert('Event must be scheduled for at least 1 month in the future');
    return;
  }
  
  const event = {
    id: Date.now(), // Simple ID generation
    title: isSecret ? encodeSecret(title) : title,
    remainingMonths: totalMonths,
    isSecret,
    isHappened: false
  };
  
  kingdoms[name].events.future.push(event);
  saveKingdoms();
  
  // Clear form
  document.getElementById('eventTitle').value = '';
  document.getElementById('eventYears').value = '0';
  document.getElementById('eventMonths').value = '1';
  document.getElementById('eventSecret').checked = false;
  
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

// Render events
function renderEvents() {
  renderFutureEvents();
  renderPastEvents();
  updateEventCounts();
}

function renderFutureEvents() {
  const container = document.getElementById('futureEventsList');
  container.innerHTML = '';
  
  // Sort by remaining months (ascending)
  const sortedEvents = [...kingdoms[name].events.future].sort((a, b) => a.remainingMonths - b.remainingMonths);
  
  sortedEvents.forEach(event => {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event-item ${event.remainingMonths <= 0 ? 'happening' : ''} ${event.isSecret ? 'secret' : ''}`;
    
    const displayTitle = event.title;
    const countdownText = getCountdownDisplay(event.remainingMonths);
    
    eventDiv.innerHTML = `
      <div class="event-header">
        <div class="event-title ${event.isSecret ? 'event-description' : ''}">${displayTitle}</div>
        <div class="event-countdown ${event.remainingMonths <= 0 ? 'happening' : ''}">${countdownText}</div>
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
    
    container.appendChild(eventDiv);
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
    
    eventDiv.innerHTML = `
      <div class="event-header">
        <div class="event-title ${event.isSecret ? 'event-description' : ''}">${displayTitle}</div>
        <div class="event-countdown">Completed</div>
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
    event.remainingMonths = Math.max(0, event.remainingMonths - 1);
  });
  saveKingdoms();
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

// Initial render
renderEvents();