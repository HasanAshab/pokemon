const kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");

const container = document.getElementById("cardContainer");

Object.keys(kingdoms).forEach(name => {
  const card = document.createElement("div");
  card.className = "card";

  const label = document.createElement("div");
  label.textContent = name;
  label.className = "card-name";

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.className = "remove-btn";
  removeBtn.onclick = (e) => {
    e.stopPropagation(); // prevent card click
    if (confirm(`Delete kingdom "${name}"?`)) {
      delete kingdoms[name];
      localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
      location.reload();
    }
  };

  card.appendChild(label);
  card.appendChild(removeBtn);

  card.onclick = () => {
    const encodedName = encodeURIComponent(name);
    window.location.href = `/kingdoms/cms/?name=${encodedName}`;
  };

  container.appendChild(card);
});

document.getElementById("addKingdomBtn").onclick = () => {
  const name = prompt("Enter new kingdom name:");
  if (!name) return;

  if (kingdoms[name]) {
    alert("Kingdom already exists.");
    return;
  }

  kingdoms[name] = {
    landArea: 1000,
    density: 100
  };

  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  location.reload();
};
