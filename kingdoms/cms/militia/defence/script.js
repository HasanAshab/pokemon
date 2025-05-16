import { prepareDefenceSoldiers } from "../../../utils.js";

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get("name");

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].defenceWaves) kingdoms[name].defenceWaves = [];


const shiftSelect = document.getElementById("shift");
const kingdomName = document.getElementById("kingdomName");
kingdomName.textContent = name || "Unknown Kingdom";

function renderWaves() {
  const wavesList = document.getElementById("wavesList");
  wavesList.innerHTML = "";
  const actualSoldiers = prepareDefenceSoldiers(kingdoms[name], 100, shiftSelect.value);

  kingdoms[name].defenceWaves.forEach((wave, index) => {
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
      const soldiers = kingdoms[name].barrack?.soldiers[shiftSelect.value] || [];
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

        // Create new soldier entry
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
      const actualQuantity = actualSoldiers[index]?.find(soldier.image) || 0;
      percentageLabel.textContent = `${percentageInput.value}% (${actualQuantity} soldiers)`;

      // Update label when the range changes
      percentageInput.oninput = () => {
        const total = kingdoms[name].barrack.soldiers[shiftSelect.value].find(s => s.image.id === soldier.image).quantity;
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

    // Add existing soldiers
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

        newWave.soldiers.push({ image: image, percentage, items });
      });

      kingdoms[name].defenceWaves[index] = newWave;
      localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
      renderWaves();
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
    soldiers: [],
  });
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderWaves();
};

shiftSelect.onchange = () => renderWaves();
renderWaves();
