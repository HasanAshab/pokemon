import { WAR_SYSTEMS, AttackWave, DefenseWave } from "../../war.js";
import { getEffectiveDefensiveIQ, sumObj, modObj, prepareDefenceWaves, prepareSoldiers, prepareCommander, handleWoundedSoldiers, getSoldierImbalancePenalty, getForceImbalanceRate, getPopulation, getTotalSecurityRate, reducePopulation, getCommandedArea, getEffectiveOffensiveIQ, getArtilleriesAtDefence, getEspionageRisk, getEspionageCost } from "../../utils.js";

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

function createDefaultWave() {
  const attackerKingdom = kingdoms[attackerSelect.value];
  if (!attackerKingdom || !attackerKingdom.barrack?.soldiers?.emergency) {
    return {
      commander: Object.keys(attackerKingdom?.commanders || {})[0] || "",
      soldiers: [],
      isAnonymous: false
    };
  }

  // Create soldiers array with all available soldiers at 100%
  const soldiers = attackerKingdom.barrack.soldiers.emergency.map(soldier => ({
    image: soldier.image.id,
    percentage: 100,
    items: soldier.image.items || [],
    abilities: []
  }));

  return {
    commander: Object.keys(attackerKingdom.commanders || {})[0] || "",
    soldiers: soldiers,
    isAnonymous: false
  };
}

function refreshWavesForNewAttacker() {
  // Clear existing waves
  attackWaves.length = 0;
  
  // Add default wave with all soldiers at 100%
  attackWaves.push(createDefaultWave());
  
  // Re-render waves
  renderWaves();
}

function renderWaves() {
  const wavesList = document.getElementById("wavesList");
  wavesList.innerHTML = "";

  attackWaves.forEach((wave, index) => {
    const waveDiv = document.createElement("div");
    waveDiv.className = "wave-item";

    // Commander selection section
    const commanderSection = document.createElement("div");
    commanderSection.className = "commander-section";
    
    // Toggle between named and anonymous commander
    const commanderTypeToggle = document.createElement("label");
    commanderTypeToggle.innerHTML = `
      <input type="checkbox" ${wave.isAnonymous ? 'checked' : ''} onchange="toggleCommanderType(${index}, this.checked)">
      Use Anonymous Commander
    `;
    commanderSection.appendChild(commanderTypeToggle);

    // Named commander select (shown when not anonymous)
    const namedCommanderDiv = document.createElement("div");
    namedCommanderDiv.className = "named-commander";
    namedCommanderDiv.style.display = wave.isAnonymous ? 'none' : 'block';
    
    const commanderSelect = document.createElement("select");
    Object.keys(kingdoms[attackerSelect.value].commanders || {}).forEach((commanderId) => {
      const option = document.createElement("option");
      option.value = commanderId;
      option.textContent = commanderId;
      if (wave.commander === commanderId) option.selected = true;
      commanderSelect.appendChild(option);
    });
    
    namedCommanderDiv.appendChild(commanderSelect);

    // Anonymous commander IQ input (shown when anonymous)
    const anonymousCommanderDiv = document.createElement("div");
    anonymousCommanderDiv.className = "anonymous-commander";
    anonymousCommanderDiv.style.display = wave.isAnonymous ? 'block' : 'none';
    
    const iqLabel = document.createElement("label");
    iqLabel.textContent = "Offensive IQ:";
    const iqInput = document.createElement("input");
    iqInput.type = "number";
    iqInput.min = "1";
    iqInput.max = "100";
    iqInput.value = wave.iq?.offensive || 50;
    iqInput.style.width = "80px";
    iqInput.style.marginLeft = "10px";
    
    anonymousCommanderDiv.appendChild(iqLabel);
    anonymousCommanderDiv.appendChild(iqInput);

    // IQ display
    const iqDisplayLabel = document.createElement("label");
    iqDisplayLabel.className = "iq-display";
    
    const updateIQDisplay = () => {
      if (wave.isAnonymous) {
        const customIQ = parseInt(iqInput.value) || 50;
        const atkKingdom = kingdoms[attackerSelect.value];
        const defKingdom = kingdoms[defenderSelect.value];
        const attackedArea = defKingdom.landArea * (parseInt(areaPercentageInput.value) / 100);
        const effectiveIQ = getEffectiveOffensiveIQ(customIQ, attackedArea);
        iqDisplayLabel.textContent = `Effective IQ: ${effectiveIQ}`;
      } else {
        const atkKingdom = kingdoms[attackerSelect.value];
        const defKingdom = kingdoms[defenderSelect.value];
        const actualIQ = atkKingdom.commanders[commanderSelect.value]?.iq.offensive || 0;
        const attackedArea = defKingdom.landArea * (parseInt(areaPercentageInput.value) / 100);
        const effectiveIQ = getEffectiveOffensiveIQ(actualIQ, attackedArea);
        iqDisplayLabel.textContent = `Effective IQ: ${effectiveIQ}`;
      }
    };

    updateIQDisplay();
    commanderSelect.onchange = updateIQDisplay;
    iqInput.oninput = updateIQDisplay;
    setInterval(updateIQDisplay, 1000);

    commanderSection.appendChild(namedCommanderDiv);
    commanderSection.appendChild(anonymousCommanderDiv);
    commanderSection.appendChild(iqDisplayLabel);

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

      // Get total available soldiers for this type
      const total = kingdoms[attackerSelect.value].barrack.soldiers.emergency.find(
        s => s.image.id === soldier.image
      ).quantity;
      
      // Calculate initial quantity from percentage
      const initialQuantity = Math.ceil(total * ((soldier.percentage || 0) / 100));

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.min = "0";
      quantityInput.max = total.toString();
      quantityInput.value = initialQuantity;
      quantityInput.style.width = "80px";
      
      const quantityLabel = document.createElement("span");
      quantityLabel.textContent = ` / ${total} soldiers`;

      quantityInput.oninput = () => {
        const quantity = Math.max(0, Math.min(total, parseInt(quantityInput.value) || 0));
        quantityInput.value = quantity; // Ensure value stays within bounds
        quantityLabel.textContent = ` / ${total} soldiers`;
      };

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-soldier-btn";
      removeBtn.innerHTML = "×";
      removeBtn.onclick = () => soldierDiv.remove();

      soldierDiv.innerHTML = `<span>${soldier.image}</span>`;
      soldierDiv.appendChild(document.createElement("br"));
      soldierDiv.appendChild(quantityInput);
      soldierDiv.appendChild(quantityLabel);
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
        soldiers: [],
      };

      // Handle commander data based on type
      if (wave.isAnonymous) {
        newWave.isAnonymous = true;
        newWave.iq = {
          offensive: parseInt(iqInput.value) || 50
        };
      } else {
        newWave.commander = commanderSelect.value;
        newWave.isAnonymous = false;
      }

      const soldierEntries = soldiersDiv.querySelectorAll(".soldier-entry");
      soldierEntries.forEach((entry) => {
        const image = entry.querySelector("span").textContent;
        const quantity = parseInt(entry.querySelector('input[type="number"]').value) || 0;
        
        // Convert quantity back to percentage for storage compatibility
        const total = kingdoms[attackerSelect.value].barrack.soldiers.emergency.find(s => s.image.id === image).quantity;
        const percentage = total > 0 ? Math.round((quantity / total) * 100) : 0;
        
        const items = kingdoms[attackerSelect.value].barrack.soldiers.emergency.find(s => s.image.id === image).image.items || []
        const abilities = []

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

    waveDiv.appendChild(commanderSection);
    waveDiv.appendChild(soldiersDiv);
    waveDiv.appendChild(saveBtn);
    waveDiv.appendChild(deleteBtn);
    wavesList.appendChild(waveDiv);
  });
}

function getActualDefenders() {
  return prepareDefenceWaves(kingdoms[defenderSelect.value], parseInt(areaPercentageInput.value), shiftSelect.value, directionSelect.value);
}

function getCommonUnitItems(soldiers) {
  const allItems = [];

  soldiers.forEach(([unit]) => {
    allItems.push(new Set(unit.items.names()));
  });

  if (!allItems.length) return [];

  return [...allItems[0]].filter(item =>
    allItems.every(set => set.has(item))
  );
}


function generateDefendersReport(expLvl = 0) {
  if (expLvl <= 0) return "";

  const defKingdom = kingdoms[defenderSelect.value];
  const defenders = getActualDefenders();
  defenders.length = 1; // single-wave workaround

  const artilleries = getArtilleriesAtDefence(
    defKingdom,
    parseInt(areaPercentageInput.value),
    directionSelect.value
  );

  const totalUnits = defenders.reduce(
    (sum, wave) => sum + wave.soldiers.count(),
    0
  );

  let html = `<section class="esp-report">`;

  // ───────────────────────────
  // SUMMARY
  // ───────────────────────────
  html += `
    <section>
      <div>Total Units: <strong>${totalUnits}</strong></div>
  `;

  if (expLvl >= 5) {
    html += `
      <div>
        Imbalance: 
        <strong>
          ${getForceImbalanceRate(
            defKingdom,
            "soldiers",
            shiftSelect.value
          ).toFixed(2)}%
        </strong>
      </div>
    `;
  }

  html += `</section>`;

  // ───────────────────────────
  // WAVE DETAILS
  // ───────────────────────────
  if (expLvl >= 2) {
    defenders.forEach(wave => {
      const iq = getEffectiveDefensiveIQ(
        wave.commander.iq.defensive,
        getCommandedArea(defKingdom, wave.commander.name)
      );

      html += `
        <section>
        <div>
            Commander: <i>${wave.commander.name}</i> · <strong>${iq}</strong> IQ
          </div>
          <br>
      `;

      let commonItems = [];
      if (expLvl >= 4) {
        commonItems = getCommonUnitItems(wave.soldiers);
        if (commonItems.length) {
          html += `
            <div>
              Common Gear:
              <strong>${commonItems.join(", ")}</strong>
            </div>
          `;
        }
      }

      if (expLvl >= 3) {
        html += `<ul>`;
        wave.soldiers.forEach(([unit, quantity]) => {
          
          let extra = "";

          if (expLvl >= 4) {
            const uniqueItems = unit.items
              .names()
              .filter(i => !commonItems.includes(i));

            if (uniqueItems.length) {
              extra = ` · <pre>${uniqueItems.join(",  ")} </pre>`;
            }
          }

          html += `
            <li>
              <strong>${quantity}</strong> × ${unit.id}${extra}
            </li>
          `;
        });
        html += `</ul>`;
      }

      html += `</section>`;
    });
  }

  // ───────────────────────────
  // ARTILLERY
  // ───────────────────────────
  if (expLvl >= 6 && artilleries.length) {
    html += `
      <section>
        <h4>Artillery</h4>
        <ul>
    `;
    artilleries.forEach(art => {
      html += `
        <li>
          <strong>${art.quantity}</strong> × ${art.name}
          · ${art.defence} AP
        </li>
      `;
    });
    html += `
        </ul>
      </section>
    `;
  }

  html += `</section>`;
  return html;
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

// Toggle between named and anonymous commander
globalThis.toggleCommanderType = (waveIndex, isAnonymous) => {
  const wave = attackWaves[waveIndex];
  if (isAnonymous) {
    // Switch to anonymous
    wave.isAnonymous = true;
    wave.iq = { offensive: 50 };
    delete wave.commander;
  } else {
    // Switch to named
    wave.isAnonymous = false;
    wave.commander = Object.keys(kingdoms[attackerSelect.value].commanders || {})[0] || "";
    delete wave.iq;
  }
  renderWaves();
}

// Espionage functionality
let useSecurityOverride = false;

function updateEspionageInfo() {
  const targetSecurity = parseInt(document.getElementById('targetSecurity').value);
  const dataLevel = parseInt(document.getElementById('dataLevel').value);
  const manCount = parseInt(document.getElementById('manCount').value);
  
  // Use manual security override if enabled, otherwise use defender kingdom's security
  let actualTargetSecurity = targetSecurity;
  if (!useSecurityOverride && defenderSelect.value && kingdoms[defenderSelect.value]) {
    actualTargetSecurity = getTotalSecurityRate(kingdoms[defenderSelect.value]);
  }
  
  const risk = getEspionageRisk(actualTargetSecurity, dataLevel, manCount);
  const cost = getEspionageCost(kingdoms[attackerSelect.value], actualTargetSecurity, dataLevel, manCount);
  
  document.getElementById('riskDisplay').textContent = `${risk}%`;
  document.getElementById('costDisplay').textContent = cost.toLocaleString();
}

function toggleSecurityOverride() {
  const securityOverride = document.getElementById('securityOverride');
  const setSecurityBtn = document.getElementById('setSecurityBtn');
  
  if (useSecurityOverride) {
    // Hide security override
    securityOverride.style.display = 'none';
    setSecurityBtn.textContent = 'Set Security Rate';
    useSecurityOverride = false;
  } else {
    // Show security override
    securityOverride.style.display = 'flex';
    setSecurityBtn.textContent = 'Use Auto Security';
    useSecurityOverride = true;
  }
  
  updateEspionageInfo();
}

function sendEspionage() {
  const targetSecurity = parseInt(document.getElementById('targetSecurity').value);
  const dataLevel = parseInt(document.getElementById('dataLevel').value);
  const manCount = parseInt(document.getElementById('manCount').value);
  const resultDiv = document.getElementById('espionageResult');
  
  // Use manual security override if enabled, otherwise use defender kingdom's security
  let actualTargetSecurity = targetSecurity;
  if (!useSecurityOverride && defenderSelect.value && kingdoms[defenderSelect.value]) {
    actualTargetSecurity = getTotalSecurityRate(kingdoms[defenderSelect.value]);
  }
  
  const risk = getEspionageRisk(actualTargetSecurity, dataLevel, manCount);
  const cost = getEspionageCost(kingdoms[attackerSelect.value], actualTargetSecurity, dataLevel, manCount);
  
  // // Check if attacker has enough resources
  const attackerKingdom = kingdoms[attackerSelect.value];
  // if (!attackerKingdom.storage || !attackerKingdom.storage.coins || attackerKingdom.storage.coins < cost) {
  //   resultDiv.innerHTML = `<div style="color: red; padding: 10px; background: #ffe6e6; border: 1px solid #ff9999; border-radius: 4px; margin-top: 10px;">
  //     <strong>Insufficient Funds!</strong><br>
  //     Required: ${cost.toLocaleString()}<br>
  //     Available: ${(attackerKingdom.storage?.coins || 0).toLocaleString()}
  //   </div>`;
  //   return;
  // }
  
  // Deduct cost
  attackerKingdom.storage.coins -= cost;
  
  // Determine success/failure based on risk
  const random = Math.random() * 100;
  const success = random > risk;
  
  if (success) {
    // Success - show espionage data
    document.getElementById('expose-level-inp').value = dataLevel;
    showDefenderData();
    
    resultDiv.innerHTML = `<div style="color: green; padding: 10px; background: #e6ffe6; border: 1px solid #99ff99; border-radius: 4px; margin-top: 10px;">
      <strong>Espionage Successful!</strong><br>
      Cost: ${cost.toLocaleString()}<br>
      Data Level ${dataLevel} intelligence gathered.<br>
      Check the Espionage Report below for details.
    </div>`;
  } else {
    // Failure - caught
    resultDiv.innerHTML = `<div style="color: red; padding: 10px; background: #ffe6e6; border: 1px solid #ff9999; border-radius: 4px; margin-top: 10px;">
      <strong>Espionage Failed - Agents Caught!</strong><br>
      Cost: ${cost.toLocaleString()}<br>
      ${manCount} agent(s) were captured.<br>
      No intelligence gathered.
    </div>`;
  }
  
  // Save kingdoms data
  localStorage.setItem('kingdoms', JSON.stringify(kingdoms));
}

shiftSelect.onchange = () => renderWaves();

document.getElementById("addWaveBtn").onclick = () => {
  attackWaves.push(createDefaultWave());
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

    // if (!commander.isAnonymous)
      commander.iq.offensive = getEffectiveOffensiveIQ(commander.iq.offensive, attackedArea);

    // if (!dwave.commander.isAnonymous)
      dwave.commander.iq.defensive = getEffectiveDefensiveIQ(dwave.commander.iq.defensive, getCommandedArea(defKingdom, dwave.commander.name));

    const atkWave = new AttackWave(commander, soldierStack, attackerOpts);
    const artillaries = getArtilleriesAtDefence(
      defKingdom,
      parseInt(areaPercentageInput.value),
      directionSelect.value
    )
    const defWave = new DefenseWave(dwave.commander, dwave.soldiers, defenderOpts, artillaries);

    const war = new WAR_SYSTEMS[strategySelect.value](atkWave, defWave);
    netWin += war.result.win ? 1 : -1;

    resultDiv.innerHTML += war.comments().join("<br>");
    return new Promise((resolve, _) => {
      setTimeout(() => {
        resultDiv.innerHTML += `
          <br>
          <h5>Outcome: <span style="color: ${war.result.win ? "green" : "red"}">${war.result.win ? "Success" : "Failour"}</span></h5><br>
          ${war.result.raisedWhiteFlag ? "Defender raised White Flag!<br>" : ""}
          Scores: <br>
          Attacker: ${Math.round(war.result.scores.atk).toLocaleString()}<br>
          Defender: ${Math.round(war.result.scores.def).toLocaleString()}<br>
          Diff (ATK view): ${Math.round(war.scoreDiff()).toLocaleString()} (${parseInt(war.scoreDiffPercent())}%) <br>
          Wounded Units: <br>
            Attacker:<br>
            ${war.result.wounded.atk.reduce((str, [k, v]) => str += `${k.id}: ${v}<br>`, "")}<br>
            Defender:<br>
            ${war.result.wounded.def.reduce((str, [k, v]) => str += `${k.id}: ${v}<br>`, "")}<br>
          Artilleries Broken: <br>
            ${war.result.brokenArtilleries.def.reduce((str, ar) => str += `${ar.name}: ${ar.quantity}<br>`, "")}<br>
          <button style="background-color: blue; color: white" onclick="confirmResult(this)">Confirm</button>
          <button style="background-color: orange; color: white; margin-left: 10px;" onclick="retryWar(this)">Retry</button>
        `
        globalThis.confirmResult = (btn) => {
          handleWoundedSoldiers(atkKingdom, war.result.wounded.atk, "emergency")
          handleWoundedSoldiers(defKingdom, war.result.wounded.def, shiftSelect.value)
          resolve(war)
          btn.disabled = true
          localStorage.setItem('kingdoms', JSON.stringify(kingdoms))
        }

        globalThis.retryWar = (btn) => {
          // Reset war state
          i = 0;
          netWin = 0;
          globalThis.wars = [];
          
          // Clear the result div
          resultDiv.innerHTML = "";
          
          // Re-enable the start war button
          startWarBtn.disabled = false;
          
          // Disable the retry button to prevent multiple clicks
          btn.disabled = true;
          
          // Automatically start the war again with same settings
          startWarBtn.click();
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

// Add event handler for attacker select to refresh waves
attackerSelect.addEventListener('change', () => {
  if (attackerSelect.value) {
    refreshWavesForNewAttacker();
  }
});

// Initialize with default wave if attacker is selected
if (attackerSelect.value) {
  attackWaves.push(createDefaultWave());
}

renderWaves();
showDefenderData();

// Initialize espionage functionality
const targetSecurityInput = document.getElementById('targetSecurity');
const targetSecurityLabel = document.getElementById('targetSecurityLabel');
const dataLevelInput = document.getElementById('dataLevel');
const manCountInput = document.getElementById('manCount');
const sendEspionageBtn = document.getElementById('sendEspionageBtn');
const setSecurityBtn = document.getElementById('setSecurityBtn');

// Set security rate button
setSecurityBtn.onclick = toggleSecurityOverride;

// Update target security display
targetSecurityInput.oninput = () => {
  targetSecurityLabel.textContent = targetSecurityInput.value;
  updateEspionageInfo();
};

// Update espionage info when inputs change
dataLevelInput.oninput = updateEspionageInfo;
manCountInput.oninput = updateEspionageInfo;

// Update espionage info when defender changes (only if not using override)
const originalDefenderChange = defenderSelect.onchange;
defenderSelect.onchange = () => {
  originalDefenderChange();
  if (!useSecurityOverride) {
    updateEspionageInfo();
  }
};

// Send espionage button
sendEspionageBtn.onclick = sendEspionage;

// Initial espionage info update
updateEspionageInfo();
