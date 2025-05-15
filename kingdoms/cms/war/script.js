import { SoldierStack, WAR_SYSTEMS, AttackWave, DefenseWave } from "../../war.js";
import { prepareDefenceWaves, prepareSoldiers, prepareCommander } from "../../utils.js";

var i = 0;
const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');
const attackerSelect = document.getElementById('attacker');
const defenderSelect = document.getElementById('defender');
const strategySelect = document.getElementById('warStrategy')
const kingdomName = document.getElementById('kingdomName');
kingdomName.textContent = name || 'Unknown Kingdom';

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
const attackWaves = [];


function renderStrategySelect() {
  Object.keys(WAR_SYSTEMS).forEach(strategy => {
    const option = document.createElement('option');
    option.value = strategy;
    option.textContent = strategy;
    strategySelect.appendChild(option);
  });
}

function renderKingdomSelects() {
  const kingdomsList = Object.keys(kingdoms);
  const defenderOption = document.createElement('option');
  defenderOption.value = name;
  defenderOption.textContent = name;
  defenderSelect.appendChild(defenderOption);
  
  kingdomsList.forEach(kingdom => {
    if (kingdom === name) return;
    const attackerOption = document.createElement('option');
    attackerOption.value = kingdom;
    attackerOption.textContent = kingdom;
    attackerSelect.appendChild(attackerOption);
  });
}

function renderWaves() {
  const wavesList = document.getElementById("wavesList");
  wavesList.innerHTML = "";

  attackWaves.forEach((wave, index) => {
    const waveDiv = document.createElement("div");
    waveDiv.className = "wave-item";

    const commanderSelect = document.createElement("select");
    Object.keys(kingdoms[attackerSelect.value].commanders || {}).forEach((commanderId) => {
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
      const total = kingdoms[attackerSelect.value].barrack.soldiers.find(
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

      attackWaves[index] = newWave;
      renderWaves();
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete Wave";
    deleteBtn.onclick = () => {
      attackWaves.splice(index, 1);
      renderWaves();
    };

    waveDiv.appendChild(commanderSelect);
    waveDiv.appendChild(soldiersDiv);
    waveDiv.appendChild(saveBtn);
    waveDiv.appendChild(deleteBtn);
    wavesList.appendChild(waveDiv);
  });
}

function getActualDefenders() {  
  return prepareDefenceWaves(kingdoms[defenderSelect.value], parseInt(areaPercentageInput.value));
}

function generateDefendersReport(expLvl = 0) {
  const actualDefenders = getActualDefenders();
  const reportLines = [];
  const totalUnits = actualDefenders.reduce((total, wave) => total += wave.soldiers.count(), 0)

  reportLines.push("Total"); 
  reportLines.push("Waves: " + actualDefenders.length);
  expLvl && reportLines.push("Units: " + totalUnits);

  expLvl > 1 && actualDefenders.forEach((defenders, index) => {  
    reportLines.push("");
    reportLines.push(`Wave ${(index + 1)}:`);
    expLvl > 4 && reportLines.push(`Commander: ${defenders.commander.name} (IQ ${defenders.commander.iq.defensive})`);
    expLvl > 2 && defenders.soldiers.forEach((quantity, image) => {
      const items = image.items.names().join(", ") || "foo, bar";
      const level = `(lvl ${image.level})`;
      const moreData = `${level} ${items && (" with " + items)}`
      reportLines.push(`${quantity} ${image.id}'s ${expLvl > 3 ? moreData : ""}`);
    })
    reportLines.push(`Units: ${defenders.soldiers.count()}`);
  });
  return reportLines.join("<br>");
}

function getDataBoxData(containerId) {
  const container = document.querySelector(`.container.data-box#${containerId}`);
  const dataRowsWrapper = container.querySelector(".data-rows-wrapper");
  const data = {};
  dataRowsWrapper.querySelectorAll(".data-row").forEach(row => {
    const key = row.querySelector(".key").value;
    const value = row.querySelector(".value").value;
    const maybeNumber = Number(value);
    data[key] = Number.isNaN(maybeNumber) ? value : maybeNumber;
  });
  return data;
}

globalThis.showDefenderData = () => {
  const exposureLevel = document.getElementById("expose-level-inp").value;
  document.getElementById("defender-data").innerHTML = generateDefendersReport(parseInt(exposureLevel));
}
globalThis.addDataRow = (containerId) => {
  const container = document.querySelector(`.container.data-box#${containerId}`);
  const dataRowsWrapper = container.querySelector(".data-rows-wrapper");
  const rowIndex = dataRowsWrapper.children.length;
  const dataRow = document.createElement("div");
  dataRow.className = "data-row";
  dataRow.innerHTML = `
        <input type="text" class="key" placeholder="Key"/>
        <input type="text" class="value" placeholder="Value"/>
        <button class="remove-btn" onclick="removeRow('${containerId}',event)">-</button> 
        `;
  dataRowsWrapper.appendChild(dataRow);
}

globalThis.removeRow = (containerId, {currentTarget}) => {
  const container = document.querySelector(`.container.data-box#${containerId}`);
  const dataRowsWrapper = container.querySelector(".data-rows-wrapper");
  dataRowsWrapper.removeChild(currentTarget.parentElement);  
}


document.getElementById("addWaveBtn").onclick = () => {
  attackWaves.push({
    commander: Object.keys(kingdoms[attackerSelect.value].commanders || {})[0] || "",
    soldiers: [],
  });
  renderWaves();
};

const areaPercentageInput = document.getElementById('areaPercentage');
const areaPercentageLabel = document.getElementById('areaPercentageLabel');

areaPercentageInput.oninput = () => {
  const percent = areaPercentageInput.value;
  const totalArea = kingdoms[name].landArea;
  const actualArea = Math.round((totalArea * percent) / 100);
  areaPercentageLabel.textContent = `${percent}% (${actualArea.toLocaleString()} sq/km)`;
  showDefenderData();
};

const startWarBtn = document.getElementById('startWar')

startWarBtn.onclick = () => {
  startWarBtn.disabled = true;
  const resultDiv = document.getElementById("war-data");
  const defenceWaves = getActualDefenders()
  const attackerOpts = getDataBoxData('attacker');
  const defenderOpts = getDataBoxData('defender');
  const results = [];

  const handleWave = (wave, index) => {
    resultDiv.innerHTML += `<h3>Wave ${index + 1}</h3>`
    const dwave = defenceWaves[index];
    const kingdom = kingdoms[attackerSelect.value];
    const soldierStack = prepareSoldiers(kingdom, wave.soldiers);
    const commander = prepareCommander(kingdom, wave.commander);    
    const atkWave = new AttackWave(commander, soldierStack, attackerOpts);
    const defWave = new DefenseWave(dwave.commander, dwave.soldiers, defenderOpts);
    
    const war = new WAR_SYSTEMS[strategySelect.value](atkWave, defWave);
    results.push(war.result);
  
    resultDiv.innerHTML += war.comments().join("<br>");
    return new Promise((resolve, _) => {      
      setTimeout(() => {
        resultDiv.innerHTML += `
          <br>
          <h5>Outcome: <span style="color: ${war.result.win ? "green" : "red"}">${war.result.win ? "Success" : "Failour"}</span></h5><br>
          ${war.result.raisedWhiteFlag ? "Defender raised White Flag!<br>" : ""}

          Wounded Units: <br>
          Attacker:<br>
          ${war.result.wounded.atk.reduce((str, [k, v]) => str += `${k.id}: ${v}<br>`, "")}<br>
          Defender:<br>
          ${war.result.wounded.def.reduce((str, [k, v]) => str += `${k.id}: ${v}<br>`, "")}<br>
        `
        resolve()
      }, 2000)
    })
  }
  if (i < attackWaves.length) {
  handleWave(attackWaves[i], i).then(() => {
    startWarBtn.disabled = false;
  })
  }
  else {
    const outcome = results.filter(r => r.win).length > results.filter(r => !r.win).length ? "Success" : "Failour";
    resultDiv.innerHTML += `<h2>Outcome: ${outcome}</h2>`
  }
  i++
};

renderStrategySelect();
renderKingdomSelects();
renderWaves();
showDefenderData()

