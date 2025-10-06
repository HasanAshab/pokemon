import { flagsToObj, objToFlags } from '../../../assets/js/utils/helpers.js';
import { calculateMaintains, calculateSize, upgradePrice } from '../../utils.js'


const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const kingdomNameEl = document.getElementById("kingdomName");
const buildingsContainer = document.getElementById("buildingsContainer");
const addBuildingBtn = document.getElementById("addBuildingBtn");

kingdomNameEl.textContent = name ? `${name}'s Buildings` : "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].buildings) kingdoms[name].buildings = [];

function saveAndRefresh() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderBuildings();
}



function renderBuildings() {
  buildingsContainer.innerHTML = "";
  kingdoms[name].buildings.forEach((building, index) => {
    
    const div = document.createElement("div");
    div.className = "building";
    div.id = building.name
    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Building Name";

    const nameInput = document.createElement("input");
    nameInput.value = building.name;
    nameInput.disabled = true;

    const levelLabel = document.createElement("label");
    levelLabel.textContent = "Current Level";

    const levelDisplay = document.createElement("div");
    levelDisplay.textContent = `Level ${building.currentLevel}`;

    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = "Current Size";

    const sizeDisplay = document.createElement("div");
    sizeDisplay.textContent = `${calculateSize(building.baseSize, building.currentLevel)} sq.m`;
    
    const MaintainsLabel = document.createElement("label");
    MaintainsLabel.textContent = "Maintains";

    const MaintainsDisplay = document.createElement("div");
    MaintainsDisplay.textContent = objToFlags(calculateMaintains(building.baseMaintains || {}, building.currentLevel));

    const quantityLabel = document.createElement("label");
    quantityLabel.textContent = "Quantity: " + building.quantity || 1;

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = building.quantity || 1;
    quantityInput.className = "editable";
    quantityInput.style.display = "none";

    const basePriceInput = document.createElement("input");
    basePriceInput.value = building.basePrice;
    basePriceInput.className = "editable price-input";
    basePriceInput.style.setProperty("border-color", "gold");
    basePriceInput.style.setProperty("border-radius", "3vw");
    
    basePriceInput.style.display = "none";

    const baseSizeInput = document.createElement("input");
    baseSizeInput.value = building.baseSize;
    baseSizeInput.className = "editable";
    baseSizeInput.style.display = "none";

    const baseMaintainsInput = document.createElement("input");
    baseMaintainsInput.value = objToFlags(building.baseMaintains || {});
    baseMaintainsInput.className = "editable";
    baseMaintainsInput.style.display = "none";

    function renderKeyValueSection(container, items, label) {
     
      container.innerHTML = "";
       console.log(items);
       
      Object.keys(items).forEach((key) => {
        if (typeof items[key] === 'number') {
          items[key] = {value: items[key], isHML: false}
          
        } 
       const {value,isHML} = items[key]

        const pairDiv = document.createElement("div");
        pairDiv.className = "item-pair";

        const keyInput = document.createElement("input");
        keyInput.placeholder = "Item";
        keyInput.className = "key";
        keyInput.value = key;
        

        const delBtn = document.createElement("button");
        delBtn.textContent = "−";
        delBtn.onclick = () => {
          delete items[key];
          renderKeyValueSection(container, items, label);
        };

        pairDiv.appendChild(keyInput);
         if (isHML){ 
          pairDiv.classList.add("hml");
         const lowValInput = document.createElement("input");
         lowValInput.classList.add("low");
         lowValInput.type = "number";
         lowValInput.placeholder = "Amount";
         lowValInput.value = value;
         const medValInput = document.createElement("input");
         medValInput.classList.add("med");
         medValInput.type = "number";
         medValInput.placeholder = "Amount";
         medValInput.value = value;
         const highValInput = document.createElement("input");
         highValInput.classList.add("high");
         highValInput.type = "number";
         highValInput.placeholder = "Amount";
         highValInput.value = value;
        pairDiv.append(highValInput, medValInput, lowValInput);
        }else {
        const valInput = document.createElement("input");
        valInput.type = "number";
        valInput.placeholder = "Amount";
        valInput.value = value;
        pairDiv.appendChild(valInput);
        
        }
        pairDiv.appendChild(delBtn);
        container.appendChild(pairDiv);
      });

      const addBtn = document.createElement("button");
      addBtn.textContent = `+ Add ${label}`;
      addBtn.onclick = () => {
      const isHMl = window.prompt("Is Hign Medium Low ? (y/n)", "n") === "y";
        items[""] = {value:0, isHML: isHMl};
        renderKeyValueSection(container, items, label);
      };
      container.appendChild(addBtn);
    }
    
    const producesLabel = document.createElement("label");
    producesLabel.textContent = "Produces";

    const producesContainer = document.createElement("div");
    renderKeyValueSection(producesContainer, building.produces, "Produce");
    
    const consumesLabel = document.createElement("label");
    consumesLabel.textContent = "Consumes";

    const consumesContainer = document.createElement("div");
    renderKeyValueSection(consumesContainer, building.consumes, "Consume");


    
    const upgradeBtn = document.createElement("button");
    upgradeBtn.className = "btn primary-btn";
    const upgradeCost = upgradePrice(building.basePrice, building.currentLevel);
    upgradeBtn.textContent = `Upgrade (Cost: ${upgradeCost} coins)`;

    upgradeBtn.onclick = () => {
      const storage = kingdoms[name].storage;
      if ((storage.coins || 0) >= upgradeCost) {
        storage.coins -= upgradeCost;
        building.currentLevel++;
        saveAndRefresh();
      } else {
        alert("Not enough coins!");
      }
    };

    const itemActions = document.createElement("div");
    itemActions.className = "building-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn primary-btn";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => {
      nameInput.disabled = false;
      basePriceInput.style.display = "block";
      baseSizeInput.style.display = "block";
      baseMaintainsInput.style.display = "block";
      quantityInput.style.display = "block";
      
      editBtn.textContent = "Save";
      editBtn.onclick = () => {
        building.name = nameInput.value.trim();
        building.basePrice = parseFloat(basePriceInput.value);
        building.baseSize = parseFloat(baseSizeInput.value);
        building.baseMaintains =  flagsToObj(baseMaintainsInput.value);
        building.quantity = parseInt(quantityInput.value) || 1;

        const extractValues = (container) => {
          const result = {};
          [...container.querySelectorAll(".item-pair")].forEach(pair => {
            const inputs = pair.querySelectorAll("input");
            const k = inputs[0].value.trim();
            if (pair.classList.contains("hml")) {
              if (k){
                result[k] = {value:{low: 0, med: 0, high: 0},isHML: true};
              const low = pair.querySelector(".low").value.trim();
              const med = pair.querySelector(".med").value.trim();
              const high = pair.querySelector(".high").value.trim();
              if (low) result[k].value.low = isNaN(low) ? 0 : low;
              if (med) result[k].value.med = isNaN(med) ? 0 : med;
              if (high) result[k].value.high = isNaN(high) ? 0 : high;
              }
            }else {
            const v = parseFloat(inputs[1].value);
            if (k) result[k] = { value:isNaN(v) ? 0 : v, isHML: false };
            }
          });
          return result;
        };

        building.produces = extractValues(producesContainer);
        building.consumes = extractValues(consumesContainer);
        saveAndRefresh();
      };
    };

    const delBtn = document.createElement("button");
    delBtn.className = "btn secondary-btn";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      kingdoms[name].buildings.splice(index, 1);
      saveAndRefresh();
    };

    itemActions.appendChild(editBtn);
    itemActions.appendChild(delBtn);

    div.appendChild(nameLabel);
    div.appendChild(nameInput);

    div.appendChild(levelLabel);
    div.appendChild(levelDisplay);

    div.appendChild(sizeLabel);
    div.appendChild(sizeDisplay);
     div.appendChild(baseSizeInput);

    div.appendChild(MaintainsLabel);
    div.appendChild(MaintainsDisplay);
    div.appendChild(baseMaintainsInput);

    div.appendChild(quantityLabel);
    div.appendChild(quantityInput);
    div.appendChild(document.createElement("br"));
    div.appendChild(basePriceInput);
   
    div.appendChild(producesLabel);
    div.appendChild(producesContainer);
    div.appendChild(consumesLabel);
    div.appendChild(consumesContainer);
    div.appendChild(upgradeBtn);
    div.appendChild(itemActions);

    buildingsContainer.appendChild(div);
  });
}

addBuildingBtn.onclick = () => {
  const newBuilding = {
    name: "New Building",
    basePrice: 100,
    baseSize: 50,
    baseMaintains: { defence: 0 },
    currentLevel: 1,
    quantity: 1,
    produces: {},
    consumes: {}
  };
  kingdoms[name].buildings.push(newBuilding);
  saveAndRefresh();
};

renderBuildings();
globalThis.hideQuickFindForm = ()=>{
   const quickFindForm = document.getElementById("quickFindForm")
 quickFindForm.classList.remove("active")

}

globalThis.showQuickFindForm = ()=>{
   const quickFindForm = document.getElementById("quickFindForm")
 quickFindForm.classList.add("active")
  const linksContainer =  quickFindForm.querySelector(".links-container")
   linksContainer.innerHTML = "" 
    kingdoms[name].buildings.forEach((building) => {
    const btn = document.createElement("button")
     btn.textContent = building.name
     btn.onclick = ()=>{
     const id = CSS.escape(building.name); // ensures valid selector
     const targetedBuilding = buildingsContainer.querySelector(`#${id}`);
     if (targetedBuilding) {
    targetedBuilding.scrollIntoView({ behavior: "smooth", block: "center" });
      hideQuickFindForm()
     }       
     }
     linksContainer.appendChild(btn)
    })
}