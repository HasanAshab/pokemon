const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get("name");

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].defenceWaves) kingdoms[name].defenceWaves = [];

const kingdomName = document.getElementById("kingdomName");
kingdomName.textContent = name || "Unknown Kingdom";

function calculateTotalPercentage(imageId, excludeIndex = -1) {
  return kingdoms[name].defenceWaves.reduce((total, wave, idx) => {
    if (idx === excludeIndex) return total;
    return total + (wave.soldiers.find(s => s.image === imageId)?.percentage || 0);
  }, 0);
}

function validateItems(items) {
  const storage = kingdoms[name].storage || {};
  return items.every(item => (storage[item] || 0) > 0);
}

function renderWaves() {
  const wavesList = document.getElementById("wavesList");
  wavesList.innerHTML = "";

  kingdoms[name].defenceWaves.forEach((wave, index) => {
    const waveDiv = document.createElement("div");
    waveDiv.className = "wave-item";

    const commanderSelect = document.createElement("select");
    Object.keys(kingdoms[name].commanders || {}).forEach(commanderId => {
      const option = document.createElement("option");
      option.value = commanderId;
      option.textContent = commanderId;
      if (wave.commander === commanderId) option.selected = true;
      commanderSelect.appendChild(option);
    });

    const soldiersDiv = document.createElement("div");
    soldiersDiv.className = "soldiers-list";

    const soldiers = kingdoms[name].barrack?.soldiers || [];
    soldiers.forEach(soldier => {
      const existingSoldier = wave.soldiers.find(s => s.image === soldier.image.id);
      
      const soldierDiv = document.createElement("div");
      soldierDiv.className = "soldier-entry";

      const percentageInput = document.createElement("input");
      percentageInput.type = "number";
      percentageInput.min = "0";
      percentageInput.max = "100";
      percentageInput.value = existingSoldier?.percentage || 0;

      const itemsInput = document.createElement("input");
      itemsInput.type = "text";
      itemsInput.placeholder = "Items (comma-separated)";
      itemsInput.value = existingSoldier?.items?.join(",") || "";

      soldierDiv.innerHTML = `
        <span>${soldier.image.id}</span>
        <label>Percentage: </label>
      `;
      soldierDiv.appendChild(percentageInput);
      soldierDiv.innerHTML += `<label>Items: </label>`;
      soldierDiv.appendChild(itemsInput);

      soldiersDiv.appendChild(soldierDiv);
    });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Wave";
    saveBtn.onclick = () => {
      const newWave = {
        commander: commanderSelect.value,
        soldiers: []
      };

      let valid = true;
      soldiersDiv.querySelectorAll(".soldier-entry").forEach((entry, idx) => {
        const imageId = soldiers[idx].image.id;
        const percentage = parseInt(entry.querySelector('input[type="number"]').value) || 0;
        const items = entry.querySelector('input[type="text"]').value
          .split(",")
          .map(item => item.trim())
          .filter(item => item);

        if (percentage > 0) {
          const totalPercentage = calculateTotalPercentage(imageId, index) + percentage;
          if (totalPercentage > 100) {
            alert(`Total percentage for ${imageId} exceeds 100%`);
            valid = false;
            return;
          }

          if (items.length > 0 && !validateItems(items)) {
            alert(`Some items are not available in storage`);
            valid = false;
            return;
          }

          newWave.soldiers.push({ image: imageId, percentage, items });
        }
      });

      if (valid) {
        kingdoms[name].defenceWaves[index] = newWave;
        localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
        renderWaves();
      }
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete Wave";
    deleteBtn.onclick = () => {
      kingdoms[name].defenceWaves.splice(index, 1);
      localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
      renderWaves();
    };

    waveDiv.appendChild(commanderSelect);
    waveDiv.appendChild(soldiersDiv);
    waveDiv.appendChild(saveBtn);
    waveDiv.appendChild(deleteBtn);
    wavesList.appendChild(waveDiv);
  });
}

document.getElementById("addWaveBtn").onclick = () => {
  kingdoms[name].defenceWaves.push({
    commander: Object.keys(kingdoms[name].commanders || {})[0] || "",
    soldiers: []
  });
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderWaves();
};

renderWaves();
