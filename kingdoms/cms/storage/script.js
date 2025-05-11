import { calcNetProd } from '../../utils.js';

const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const kingdomNameEl = document.getElementById("kingdomName");
const itemsContainer = document.getElementById("itemsContainer");
const addItemBtn = document.getElementById("addItemBtn");

kingdomNameEl.textContent = name ? `${name}'s Storage` : "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].storage) kingdoms[name].storage = {};

function saveAndRefresh() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderItems();
}

function renderItems() {
  const storage = kingdoms[name].storage;
  const netProd = calcNetProd(kingdoms[name]);

  // Add missing netProd items to storage with 0 quantity
  Object.keys(netProd).forEach(key => {
    if (!(key in storage)) {
      storage[key] = 0;
    }
  });

  itemsContainer.innerHTML = "";

  Object.keys(storage).forEach(itemName => {
    const div = document.createElement("div");
    div.className = "item";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Item Name";

    const nameInput = document.createElement("input");
    nameInput.value = itemName;

    const qtyLabel = document.createElement("label");
    qtyLabel.textContent = "Quantity";

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.value = storage[itemName];

    const prodSpan = document.createElement("span");
    prodSpan.className = "production";
    const rawVal = parseInt(netProd[itemName] || 0);
    prodSpan.textContent = rawVal >= 0 ? `+${rawVal.toLocaleString()}` : rawVal.toLocaleString();
    prodSpan.classList.add(rawVal >= 0 ? "prod-positive" : "prod-negative");

    const itemActions = document.createElement("div");
    itemActions.className = "item-actions";

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn primary-btn";
    saveBtn.textContent = "Save";
    saveBtn.onclick = () => {
      const newName = nameInput.value.trim();
      const quantity = parseInt(qtyInput.value) || 0;
      if (newName !== itemName) {
        delete storage[itemName];
      }
      storage[newName] = quantity;
      saveAndRefresh();
    };

    const delBtn = document.createElement("button");
    delBtn.className = "btn secondary-btn";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      delete storage[itemName];
      saveAndRefresh();
    };

    itemActions.appendChild(saveBtn);
    itemActions.appendChild(delBtn);

    div.appendChild(nameLabel);
    div.appendChild(nameInput);
    div.appendChild(qtyLabel);
    div.appendChild(qtyInput);
    div.appendChild(prodSpan);
    div.appendChild(itemActions);

    itemsContainer.appendChild(div);
  });
}

addItemBtn.onclick = () => {
  kingdoms[name].storage["New Item"] = 0;
  saveAndRefresh();
};

renderItems();
