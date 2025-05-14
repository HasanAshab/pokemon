const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get("name");

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].defenceWaves) kingdoms[name].defenceWaves = [];

const kingdomName = document.getElementById("kingdomName");
kingdomName.textContent = name || "Unknown Kingdom";

function validateItems(items, waveIndex) {
  const storage = kingdoms[name].storage || {};
  const itemCounts = {};
  
  // Count items from other waves
  kingdoms[name].defenceWaves.forEach((wave, idx) => {
    if (idx !== waveIndex) {
      wave.soldiers.forEach(soldier => {
        soldier.items.forEach(item => {
          itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
      });
    }
  });

  // Add current items
  items.forEach(item => {
    itemCounts[item] = (itemCounts[item] || 0) + 1;
  });

  // Check if we have enough in storage
  return Object.entries(itemCounts).every(([item, count]) => (storage[item] || 0) >= count);
}

function calculateTotalPercentage(imageId, excludeIndex = -1, includePercentage = 0) {
  const total = kingdoms[name].defenceWaves.reduce((total, wave, idx) => {
    if (idx === excludeIndex) return total;
    const soldierPercentages = wave.soldiers
      .filter(s => s.image === imageId)
      .reduce((sum, s) => sum + (s.percentage || 0), 0);
    return total + soldierPercentages;
  }, 0);

  return total + includePercentage;
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

    // Create add soldier button
    const addSoldierBtn = document.createElement("button");
    addSoldierBtn.className = "add-soldier-btn";
    addSoldierBtn.innerHTML = "+";
    addSoldierBtn.onclick = () => {
      // Create soldier selection modal
      const modal = document.createElement("div");
      modal.className = "modal";

      const modalContent = document.createElement("div");
      modalContent.className = "modal-content";

      const soldierSelect = document.createElement("select");
      const soldiers = kingdoms[name].barrack?.soldiers || [];
      soldiers.forEach(soldier => {
        const option = document.createElement("option");
        option.value = soldier.image.id;
        option.textContent = soldier.image.id;
        soldierSelect.appendChild(option);
      });

      const addBtn = document.createElement("button");
      addBtn.textContent = "Add";
      addBtn.onclick = () => {
        const selectedImage = soldierSelect.value;

        // Create new soldier entry
        const soldierDiv = createSoldierEntry({
          image: selectedImage,
          percentage: 0,
          items: []
        }, index);

        soldiersDiv.appendChild(soldierDiv);
        modal.remove();
      };

      modalContent.appendChild(soldierSelect);
      modalContent.appendChild(addBtn);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
    };

    function createSoldierEntry(soldier, waveIndex) {
      const soldierDiv = document.createElement("div");
      soldierDiv.className = "soldier-entry";

      const percentageInput = document.createElement("input");
      percentageInput.type = "number";
      percentageInput.min = "0";
      percentageInput.max = "100";
      percentageInput.value = soldier.percentage;

      // Add percentage validation
      percentageInput.onchange = () => {
        const newPercentage = parseInt(percentageInput.value) || 0;
        const totalPercentage = calculateTotalPercentage(soldier.image, waveIndex, newPercentage);
        if (totalPercentage > 100) {
          alert(`Total percentage for ${soldier.image} cannot exceed 100%`);
          percentageInput.value = soldier.percentage;
          return;
        }
      };

      const itemsInput = document.createElement("input");
      itemsInput.type = "text";
      itemsInput.placeholder = "Items (comma-separated)";
      itemsInput.value = soldier.items?.join(",") || "";

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-soldier-btn";
      removeBtn.innerHTML = "×";
      removeBtn.onclick = () => soldierDiv.remove();

      soldierDiv.innerHTML = `<span>${soldier.image}</span>`;
      soldierDiv.appendChild(percentageInput);
      soldierDiv.appendChild(itemsInput);
      soldierDiv.appendChild(removeBtn);

      return soldierDiv;
    }

    // Add existing soldiers
    wave.soldiers.forEach(soldier => {
      soldiersDiv.appendChild(createSoldierEntry(soldier, index));
    });

    soldiersDiv.appendChild(addSoldierBtn);

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Wave";
    saveBtn.onclick = () => {
      const newWave = {
        commander: commanderSelect.value,
        soldiers: []
      };

      let valid = true;
      const soldierEntries = soldiersDiv.querySelectorAll(".soldier-entry");
      soldierEntries.forEach((entry) => {
        const image = entry.querySelector('span').textContent;
        const percentage = parseInt(entry.querySelector('input[type="number"]').value) || 0;
        const items = entry.querySelector('input[type="text"]').value
          .split(",")
          .map(item => item.trim())
          .filter(item => item);

        if (percentage > 0) {
          const totalPercentage = calculateTotalPercentage(image, index, percentage);
          if (totalPercentage > 100) {
            alert(`Total percentage for ${image} exceeds 100% (Current: ${totalPercentage}%)`);
            valid = false;
            return;
          }

          if (items.length > 0 && !validateItems(items, index)) {
            alert(`Some items are not available in storage`);
            valid = false;
            return;
          }

          newWave.soldiers.push({ image: image, percentage, items });
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