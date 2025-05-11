const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const kingdomNameEl = document.getElementById("kingdomName");
const itemsContainer = document.getElementById("itemsContainer");
const addItemBtn = document.getElementById("addItemBtn");

kingdomNameEl.textContent = name ? `${name}'s Storage` : "Unknown Kingdom";

let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].storage) kingdoms[name].storage = [];

function saveAndRefresh() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderItems();
}

function renderItems() {
  itemsContainer.innerHTML = "";
  kingdoms[name].storage.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    const nameInput = document.createElement("input");
    nameInput.value = item.name;

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.value = item.quantity;

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.onclick = () => {
      item.name = nameInput.value.trim();
      item.quantity = parseInt(qtyInput.value) || 0;
      saveAndRefresh();
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      kingdoms[name].storage.splice(index, 1);
      saveAndRefresh();
    };

    div.appendChild(nameInput);
    div.appendChild(qtyInput);
    div.appendChild(saveBtn);
    div.appendChild(delBtn);

    itemsContainer.appendChild(div);
  });
}

addItemBtn.onclick = () => {
  kingdoms[name].storage.push({ name: "New Item", quantity: 0 });
  saveAndRefresh();
};

renderItems();
