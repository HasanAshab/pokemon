import pokemons from '../../../../data/pokemons.js'

const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const commandersContainer = document.getElementById("commandersContainer");
const addCommanderBtn = document.getElementById("addCommanderBtn");


let kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");
if (!kingdoms[name]) kingdoms[name] = {};
if (!kingdoms[name].commanders) kingdoms[name].commanders = {};


function save() {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  renderCommanders();
}

function renderCommanders() {
  commandersContainer.innerHTML = "";
  const commanders = kingdoms[name].commanders;

  Object.entries(commanders).forEach(([commanderName, commanderData]) => {
    const card = document.createElement("div");
    card.className = "commander-card";

    const nameInput = document.createElement("input");
    nameInput.value = commanderName;
    nameInput.onblur = () => {
      const newName = nameInput.value.trim();
      if (newName && newName !== commanderName) {
        kingdoms[name].commanders[newName] = commanderData;
        delete kingdoms[name].commanders[commanderName];
        save();
      }
    };
      
    // Add inside Object.entries loop after imageSelect
const salaryInput = document.createElement("input");
salaryInput.type = "number";
salaryInput.placeholder = "Salary (coins)";
salaryInput.value = commanderData.salary ?? 0;
salaryInput.onblur = () => {
  commanderData.salary = parseFloat(salaryInput.value) || 0;
  save();
};

    const imageSelect = document.createElement("select");
    Object.keys(pokemons).forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (commanderData.image === opt) option.selected = true;
      imageSelect.appendChild(option);
    });
    imageSelect.onblur = () => {
      commanderData.image = imageSelect.value;
      save();
    };

    const iqContainer = document.createElement("div");
    iqContainer.className = "iq-container";
    const renderIQFields = () => {
      iqContainer.innerHTML = "";
      Object.entries(commanderData.iq).forEach(([key, value]) => {
        const row = document.createElement("div");
        row.className = "iq-entry";

        const keyInput = document.createElement("input");
        keyInput.value = key;
        keyInput.placeholder = "Trait";
        keyInput.onblur = () => {
          const newKey = keyInput.value.trim();
          if (newKey && newKey !== key) {
            commanderData.iq[newKey] = commanderData.iq[key];
            delete commanderData.iq[key];
            save();
            renderIQFields(); // re-render to bind new listeners
          }
        };

        const valInput = document.createElement("input");
        valInput.type = "number";
        valInput.value = value;
        valInput.placeholder = "Value";
        valInput.onblur = () => {
          commanderData.iq[keyInput.value.trim()] = parseFloat(valInput.value) || 0;
          save();
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "−";
        delBtn.onclick = () => {
          delete commanderData.iq[key];
          save();
          renderIQFields();
        };

        row.appendChild(keyInput);
        row.appendChild(valInput);
        row.appendChild(delBtn);
        iqContainer.appendChild(row);
      });

      const addBtn = document.createElement("button");
      addBtn.textContent = "+ Add IQ Field";
      addBtn.onclick = () => {
        commanderData.iq[""] = 0;
        renderIQFields();
      };
      iqContainer.appendChild(addBtn);
    };
    renderIQFields();

    const jsonEditor = document.createElement("textarea");
    jsonEditor.className = "json-editor";
    jsonEditor.value = JSON.stringify(commanderData, null, 2);
    jsonEditor.onblur = () => {
      try {
        const parsed = JSON.parse(jsonEditor.value);
        kingdoms[name].commanders[commanderName] = parsed;
        save();
      } catch {
        alert("Invalid JSON");
      }
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      delete kingdoms[name].commanders[commanderName];
      save();
    };

    card.appendChild(nameInput);
    card.appendChild(imageSelect);
    card.appendChild(salaryInput);  // place this after imageSelect, before iqContainer
    card.appendChild(iqContainer);
    card.appendChild(jsonEditor);
    card.appendChild(delBtn);

    commandersContainer.appendChild(card);
  });
}

addCommanderBtn.onclick = () => {
  const newCommanderName = prompt("Commander name?");
  if (!newCommanderName) return;
  kingdoms[name].commanders[newCommanderName] = { iq: {}, salary: 0, image: "student" };
  save();
};

renderCommanders();
