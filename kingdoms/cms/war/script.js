import { WAR_SYSTEMS, AttackWave, DefenseWave } from "../../war.js";
import { getEffectiveDefensiveIQ, sumObj, modObj, prepareDefenceWaves, prepareSoldiers, prepareCommander, handleWoundedSoldiers, calculateBuildDefenceScore, getSoldierImbalancePenalty, getForceImbalanceRate, getPopulation, getTotalSecurityRate, reducePopulation, getCommandedArea, getEffectiveOffensiveIQ, getArtilleriesAtDefence, getArtilleriesBroken } from "../../utils.js";

globalThis.wars = []
var i = 0;
var netWin = 0;
// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('name');
})();
const attackerSelect = document.getElementById('attacker');
const defenderSelect = document.getElementById('defender');
const strategySelect = document.getElementById('warStrategy')
const shiftSelect = document.getElementById('shift')
const directionSelect = document.getElementById('direction')
const kingdomName = document.getElementById('kingdomName');
kingdomName.textContent = name || 'Unknown Kingdom';

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
const attackWaves = [];

strategySelect.onchange = () => {
  const goodMsgEl = document.querySelector(".msg.good")
  const badMsgEl = document.querySelector(".msg.bad")
  const good = WAR_SYSTEMS[strategySelect.value].details.good
  const bad = WAR_SYSTEMS[strategySelect.value].details.bad
  goodMsgEl.textContent = good
  badMsgEl.textContent = bad
}

defenderSelect.onchange = () => {
  showDefenderData();
  loadDirectionData();
}
directionSelect.onchange = () => {
  showDefenderData();
};

function loadDirectionData() {
  const defender = kingdoms[defenderSelect.value];
  const directionList = document.getElementById("direction");
  directionList.innerHTML = "";
  Object.keys(defender.militaryTension).forEach(direction => {
    if (direction.includes('.')) return
    const option = document.createElement('option');    
    option.value = direction;
    option.textContent = direction;
    directionList.appendChild(option);
  });
}

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
  kingdomsList.toReversed().forEach(kingdom => {
    const attackerOption = document.createElement('option');
    attackerOption.value = kingdom;
    attackerOption.textContent = kingdom;
    attackerSelect.appendChild(attackerOption);
  });
  kingdomsList.forEach(kingdom => {
    const defenderOption = document.createElement('option');
    defenderOption.value = kingdom;
    defenderOption.textContent = kingdom;
    defenderSelect.appendChild(defenderOption);
  })
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
    const setCommanderIQ = () => {
      const atkKingdom = kingdoms[attackerSelect.value]
      const defKingdom = kingdoms[defenderSelect.value]
      const actualIQ = atkKingdom.commanders[commanderSelect.value].iq.offensive;
      const attackedArea = defKingdom.landArea * (parseInt(areaPercentageInput.value) / 100)
      const effectiveIQ = getEffectiveOffensiveIQ(actualIQ, attackedArea)
      iqLabel.textContent = `IQ: ${effectiveIQ}`;
    };

    const iqLabel = document.createElement("label");
    setCommanderIQ();
    commanderSelect.onchange = setCommanderIQ
    setInterval(setCommanderIQ, 1000)

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
      const soldiers = kingdoms[attackerSelect.value].barrack?.soldiers.emergency || [];
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
      percentageLabel.textContent = `${percentageInput.value}% (0 soldiers)`;

      percentageInput.oninput = () => {
        const total = kingdoms[attackerSelect.value].barrack.soldiers.emergency.find(
          s => s.image.id === soldier.image
        ).quantity;
        const quantity = Math.ceil(total * (percentageInput.value / 100));
        percentageLabel.textContent = `${percentageInput.value}% (${quantity} soldiers)`;
      };

      // const itemsInput = document.createElement("input");
      // itemsInput.type = "text";
      // itemsInput.className = "items-inp";
      // itemsInput.placeholder = "Items (comma-separated)";
      // itemsInput.value = soldier.items?.join(",") || "";

      // const abilitiesInput = document.createElement("input");
      // abilitiesInput.type = "text";
      // abilitiesInput.className = "abilities-inp";
      // abilitiesInput.placeholder = "Abilities (comma-separated)";
      // abilitiesInput.value = soldier.abilities?.join(",") || "";

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-soldier-btn";
      removeBtn.innerHTML = "×";
      removeBtn.onclick = () => soldierDiv.remove();

      soldierDiv.innerHTML = `<span>${soldier.image}</span>`;
      soldierDiv.appendChild(document.createElement("br"));
      soldierDiv.appendChild(percentageInput);
      soldierDiv.appendChild(percentageLabel);
      soldierDiv.appendChild(document.createElement("br"));
      // soldierDiv.appendChild(itemsInput);
      // soldierDiv.appendChild(document.createElement("br"));
      // soldierDiv.appendChild(abilitiesInput);
      // soldierDiv.appendChild(document.createElement("br"));
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
        const items = kingdoms[attackerSelect.value].barrack.soldiers.emergency.find(s => s.image.id === image).image.items || []
        // const items = entry
        //   .querySelector('input.items-inp')
        //   .value.split(",")
        //   .map((item) => item.trim())
        //   .filter((item) => item);
        const abilities = []
        // const abilities = entry
        //   .querySelector('input.abilities-inp')
        //   .value.split(",")
        //   .map((ability) => ability.trim())
        //   .filter((ability) => ability);

        newWave.soldiers.push({ image, percentage, items, abilities });
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
    waveDiv.appendChild(iqLabel);
    waveDiv.appendChild(soldiersDiv);
    waveDiv.appendChild(saveBtn);
    waveDiv.appendChild(deleteBtn);
    wavesList.appendChild(waveDiv);
  });
}

function getActualDefenders() {
  return prepareDefenceWaves(kingdoms[defenderSelect.value], parseInt(areaPercentageInput.value), shiftSelect.value, directionSelect.value);
}

function generateDefendersReport(expLvl = 0) {
  const defKingdom = kingdoms[defenderSelect.value];
  const actualDefenders = getActualDefenders();
  const artillaries = getArtilleriesAtDefence(defKingdom, parseInt(areaPercentageInput.value), directionSelect.value);

  const reportLines = [];
  const totalUnits = actualDefenders.reduce((total, wave) => total += wave.soldiers.count(), 0)

  reportLines.push("Total");
  reportLines.push("Waves: " + actualDefenders.length);
  expLvl && reportLines.push("Units: " + totalUnits);
  expLvl > 4 && reportLines.push(`Imbalance: ${getForceImbalanceRate(defKingdom, 'soldiers', shiftSelect.value).toFixed(2)}%`);

  expLvl > 1 && actualDefenders.forEach((defenders, index) => {
    reportLines.push("");
    reportLines.push(`Wave ${(index + 1)}:`);
    expLvl > 4 && reportLines.push(`Commander: ${defenders.commander.name} (IQ ${getEffectiveDefensiveIQ(defenders.commander.iq.defensive, getCommandedArea(defKingdom, defenders.commander.name))})`);
    reportLines.push(`Units: ${defenders.soldiers.count()}`);
    expLvl > 2 && defenders.soldiers.forEach((quantity, image) => {

      const items = image.items.names().join(", ");

      const level = `(lvl ${image.level})`;
      const moreData = `${level} ${items && (" with " + items)}`
      reportLines.push(`${quantity} ${image.id}'s ${expLvl > 3 ? moreData : ""}`);
    })
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
  const dataRow = document.createElement("div");
  dataRow.className = "data-row";
  dataRow.innerHTML = `
        <input type="text" class="key" placeholder="Key"/>
        <input type="text" class="value" placeholder="Value"/>
        <button class="remove-btn" onclick="removeRow('${containerId}',event)">-</button> 
        `;
  dataRowsWrapper.appendChild(dataRow);
}

globalThis.removeRow = (containerId, { currentTarget }) => {
  const container = document.querySelector(`.container.data-box#${containerId}`);
  const dataRowsWrapper = container.querySelector(".data-rows-wrapper");
  dataRowsWrapper.removeChild(currentTarget.parentElement);
}

shiftSelect.onchange = () => renderWaves();

document.getElementById("addWaveBtn").onclick = () => {
  attackWaves.push({
    commander: Object.keys(kingdoms[attackerSelect.value].commanders || {})[0] || "",
    soldiers: [],
  });
  renderWaves();
};

const areaPercentageInput = document.getElementById('areaPercentage');
const areaPercentageLabel = document.getElementById('areaPercentageLabel');
const actualAreaInput = document.getElementById('actualArea');
areaPercentageInput.oninput = () => {
  const percent = areaPercentageInput.value;
  const totalArea = kingdoms[defenderSelect.value].landArea;
  const actualArea = Math.round((totalArea * percent) / 100);
  actualAreaInput.value = actualArea
  areaPercentageLabel.textContent = `${percent}% (${actualArea.toLocaleString()} sq/km)`;
  showDefenderData();
};
actualAreaInput.oninput = () => {
  const actualArea = actualAreaInput.value;
  const totalArea = kingdoms[defenderSelect.value].landArea;
  const percent = Math.round((actualArea * 100) / totalArea);
  areaPercentageInput.value = percent;
  areaPercentageLabel.textContent = `${percent}% (${actualArea.toLocaleString()} sq/km)`;
}
const startWarBtn = document.getElementById('startWar')

startWarBtn.onclick = () => {
  startWarBtn.disabled = true;
  const atkKingdom = kingdoms[attackerSelect.value]
  const defKingdom = kingdoms[defenderSelect.value]
  const resultDiv = document.getElementById("war-data");
  const defenceWaves = getActualDefenders()
  const attackerOpts = getDataBoxData('atk');
  const defenderOpts = getDataBoxData('def');

  if (!attackerOpts.cpModifiers)
    attackerOpts.cpModifiers = []
  if (!defenderOpts.cpModifiers)
    defenderOpts.cpModifiers = []

  attackerOpts.cpModifiers.push(
    getSoldierImbalancePenalty(atkKingdom, 'emergency'),
  )
  defenderOpts.cpModifiers.push(
    getSoldierImbalancePenalty(defKingdom, shiftSelect.value),
  )

  const handleWave = (wave, index) => {
    resultDiv.innerHTML += `<h3>Wave ${index + 1}</h3>`
    const dwave = defenceWaves[index];
    const kingdom = kingdoms[attackerSelect.value];
    const soldierStack = prepareSoldiers(kingdom, wave.soldiers, 100, "emergency");
    const commander = prepareCommander(kingdom, wave.commander);
    const attackedArea = defKingdom.landArea * (parseInt(areaPercentageInput.value) / 100)
    commander.iq.offensive = getEffectiveOffensiveIQ(commander.iq.offensive, attackedArea);
    dwave.commander.iq.defensive = getEffectiveDefensiveIQ(dwave.commander.iq.defensive, getCommandedArea(defKingdom, dwave.commander.name));
    
    const atkWave = new AttackWave(commander, soldierStack, attackerOpts);
    const buildDefenceScore = calculateBuildDefenceScore(defKingdom, parseInt(areaPercentageInput.value), directionSelect.value);

    const defWave = new DefenseWave(dwave.commander, dwave.soldiers, defenderOpts, buildDefenceScore);

    const war = new WAR_SYSTEMS[strategySelect.value](atkWave, defWave);
    netWin += war.result.win ? 1 : -1;

    const defArtilleries = getArtilleriesAtDefence(defKingdom, parseInt(areaPercentageInput.value), directionSelect.value);
    const defArtilleriesBroken = getArtilleriesBroken;

    resultDiv.innerHTML += war.comments().join("<br>");
    return new Promise((resolve, _) => {
      setTimeout(() => {
        resultDiv.innerHTML += `
          <br>
          <h5>Outcome: <span style="color: ${war.result.win ? "green" : "red"}">${war.result.win ? "Success" : "Failour"}</span></h5><br>
          ${war.result.raisedWhiteFlag ? "Defender raised White Flag!<br>" : ""}
          Scores: <br>
          Attacker: ${Math.round(war.result.scores.atk).toLocaleString()}<br>
          Defender: ${Math.round(war.result.scores.def - buildDefenceScore).toLocaleString()}<br>
          Defence Artillery: ${Math.round(buildDefenceScore).toLocaleString()}<br>
          Diff (ATK view): ${Math.round(war.scoreDiff()).toLocaleString()} (${parseInt(war.scoreDiffPercent())}%) <br>
          Wounded Units: <br>
          Attacker:<br>
          ${war.result.wounded.atk.reduce((str, [k, v]) => str += `${k.id}: ${v}<br>`, "")}<br>
          Defender:<br>
          ${war.result.wounded.def.reduce((str, [k, v]) => str += `${k.id}: ${v}<br>`, "")}<br>
          <button style="background-color: blue; color: white" onclick="confirmResult(this)">Confirm</button>
        `
        globalThis.confirmResult = (btn) => {
          handleWoundedSoldiers(atkKingdom, war.result.wounded.atk, "emergency")
          handleWoundedSoldiers(defKingdom, war.result.wounded.def, shiftSelect.value)
          resolve(war)
          btn.disabled = true
        }
      }, 1)
    })
  }
  if (i < attackWaves.length) {
    handleWave(attackWaves[i], i).then((war) => {
      startWarBtn.disabled = false;
      globalThis.wars.push(war)
    })
  }
  else {
    const win = netWin > 0
    const outcome = win ? "Success" : "Failour";
    resultDiv.innerHTML += `<br><br><h2>Outcome: ${outcome}</h2>`

    const percentageInp = document.getElementById("areaPercentage")
    if (win) {
      if (strategySelect.value === "harvest") {
        const items = getDataBoxData('harvest')
        atkKingdom.storage = sumObj(atkKingdom.storage, items)
        defKingdom.storage = sumObj(atkKingdom.storage, modObj(items, -1))
      }
      else if (strategySelect.value === "occupy") {
        const occupiedArea = defKingdom.landArea * (parseInt(percentageInp.value) / 100)
        atkKingdom.landArea += occupiedArea
        defKingdom.landArea -= occupiedArea
      }
    }
    if (strategySelect.value === "sabotage") {
      const totalCiviliansInRange = getPopulation(defKingdom) * (percentageInp.value / 100)
      const scoreLapsAvgRate = globalThis.wars
        .map(war => -war.scoreDiffPercent())
        .reduce((a, b) => a + b, 0) / globalThis.wars.length
      const securityRate = getTotalSecurityRate(defKingdom)
      const civilianSavedRate = scoreLapsAvgRate + (securityRate / 2)
      const civiliansLostRate = 100 - Math.max(0, Math.min(civilianSavedRate, 100))
      const civiliansLost = Math.round(totalCiviliansInRange * (civiliansLostRate / 100))
      reducePopulation(defKingdom, civiliansLost)
      resultDiv.innerHTML += `<br>${civiliansLost.toLocaleString()} civilians lost.<br>`
    }
  }


  localStorage.setItem('kingdoms', JSON.stringify(kingdoms))
  i++
};

renderStrategySelect();
renderKingdomSelects();
loadDirectionData();
renderWaves();
showDefenderData()
