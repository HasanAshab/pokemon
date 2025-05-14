const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get("name");

const kingdomName = document.getElementById("kingdomName");
kingdomName.textContent = name || "Unknown Kingdom";

document.querySelectorAll(".info-card").forEach((card) => {
  card.addEventListener("click", () => {
    const target = card.getAttribute("data-target");
    if (!name || !target) return;
    const encoded = encodeURIComponent(name);
    window.location.href = `/kingdoms/cms/militia/${target}/?name=${encoded}`;
  });
});
