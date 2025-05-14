

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');

const kingdomName = document.getElementById('kingdomName');
kingdomName.textContent = name || 'Unknown Kingdom';

