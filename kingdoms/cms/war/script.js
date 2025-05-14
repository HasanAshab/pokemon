
import { SoldierStack, WAR_SYSTEMS, AttackWave, DefenseWave } from "../../war.js";

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');

const kingdomName = document.getElementById('kingdomName');
kingdomName.textContent = name || 'Unknown Kingdom';

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].attackWaves) kingdoms[name].attackWaves = [];

function renderStrategySelect() {
  const select = document.getElementById('warStrategy');
  Object.keys(WAR_SYSTEMS).forEach(strategy => {
    const option = document.createElement('option');
    option.value = strategy;
    option.textContent = strategy;
    select.appendChild(option);
  });
}

function renderKingdomSelects() {
  const kingdomsList = Object.keys(kingdoms);
  const attackerSelect = document.getElementById('attacker');
  const defenderSelect = document.getElementById('defender');
  
  kingdomsList.forEach(kingdom => {
    const attackerOption = document.createElement('option');
    attackerOption.value = kingdom;
    attackerOption.textContent = kingdom;
    if (kingdom === name) attackerOption.selected = true;
    attackerSelect.appendChild(attackerOption);

    const defenderOption = document.createElement('option');
    defenderOption.value = kingdom;
    defenderOption.textContent = kingdom;
    if (kingdom === name) defenderOption.selected = true;
    defenderSelect.appendChild(defenderOption);
  });
}

function renderWaves() {
  const wavesList = document.getElementById("wavesList");
  wavesList.innerHTML = "";

  kingdoms[name].attackWaves.forEach((wave, index) => {
    const waveDiv = document.createElement("div");
    waveDiv.className = "wave-item";

    const commanderSelect = document.createElement("select");
    Object.keys(kingdoms[name].commanders || {}).forEach((commanderId) => {
      const option = document.createElement("option");
      option.value = commanderId;
      option.textContent = commanderId;
      if (wave.commander === commanderId) option.selected = true;
      commanderSelect.appendChild(option);
    });

    const soldiersDiv = document.createElement("div");
    soldiersDiv.className = "soldiers-list";

    const addSoldierBtn = document.createElement("button");
    addSoldierBtn.className = "add-soldier-btn";
    addSoldierBtn.innerHTML = "+";
    addSoldierBtn.onclick = () => {
      const modal = document.createElement("div");
      modal.className = "modal";

      const modalContent = document.createElement("div");
      modalContent.className = "modal-content";

      const soldierSelect = document.createElement("select");
      const soldiers = kingdoms[name].barrack?.soldiers || [];
      soldiers.forEach((soldier) => {
        const option = document.createElement("option");
        option.value = soldier.image.id;
        option.textContent = soldier.image.id;
        soldierSelect.appendChild(option);
      });

      const addBtn = document.createElement("button");
      addBtn.textContent = "Add";
      addBtn.onclick = () => {
        const selectedImage = soldierSelect.value;
        const soldierDiv = createSoldierEntry(
          {
            image: selectedImage,
            percentage: 0,
            items: [],
          },
          index,
        );

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
      percentageInput.type = "range";
      percentageInput.min = "0";
      percentageInput.max = "100";
      percentageInput.value = soldier.percentage || 0;

      const percentageLabel = document.createElement("span");
      const total = kingdoms[name].barrack.soldiers.find(
        s => s.image.id === soldier.image
      ).quantity;
      const quantity = Math.ceil(total * (percentageInput.value / 100));
      percentageLabel.textContent = `${percentageInput.value}% (${quantity} soldiers)`;

      percentageInput.oninput = () => {
        const quantity = Math.ceil(total * (percentageInput.value / 100));
        percentageLabel.textContent = `${percentageInput.value}% (${quantity} soldiers)`;
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
      soldierDiv.appendChild(document.createElement("br"));
      soldierDiv.appendChild(percentageInput);
      soldierDiv.appendChild(percentageLabel);
      soldierDiv.appendChild(document.createElement("br"));
      soldierDiv.appendChild(itemsInput);
      soldierDiv.appendChild(document.createElement("br"));
      soldierDiv.appendChild(removeBtn);

      return soldierDiv;
    }

    wave.soldiers.forEach((soldier) => {
      soldiersDiv.appendChild(createSoldierEntry(soldier, index));
    });

    soldiersDiv.appendChild(addSoldierBtn);

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Wave";
    saveBtn.onclick = () => {
      const newWave = {
        commander: commanderSelect.value,
        soldiers: [],
      };

      const soldierEntries = soldiersDiv.querySelectorAll(".soldier-entry");
      soldierEntries.forEach((entry) => {
        const image = entry.querySelector("span").textContent;
        const percentage = parseInt(entry.querySelector('input[type="range"]').value) || 0;
        const items = entry
          .querySelector('input[type="text"]')
          .value.split(",")
          .map((item) => item.trim())
          .filter((item) => item);

        newWave.soldiers.push({ image, percentage, items });
      });

      kingdoms[name].attackWaves[index] = newWave;
      localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
      renderWaves();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete Wave";
    deleteBtn.onclick = () => {
      kingdoms[name].attackWaves.splice(index, 1);
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
  kingdoms[name].attackWaves.push({
    commander: Object.keys(kingdoms[name].commanders || {})[0] || "",
    soldiers: [],
  });
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderWaves();
};

const areaPercentageInput = document.getElementById('areaPercentage');
const areaPercentageLabel = document.getElementById('areaPercentageLabel');

areaPercentageInput.oninput = () => {
  const percent = areaPercentageInput.value;
  const totalArea = kingdoms[name].landArea;
  const actualArea = Math.round((totalArea * percent) / 100);
  areaPercentageLabel.textContent = `${percent}% (${actualArea.toLocaleString()} sq/km)`;
};

document.getElementById('startWar').onclick = () => {
  const defender = document.getElementById('defender').value;
  const strategy = document.getElementById('warStrategy').value;
  const areaPercentage = parseInt(areaPercentageInput.value);
  // Implementation for war execution will go here
};

renderStrategySelect();
renderKingdomSelects();
renderWaves();
