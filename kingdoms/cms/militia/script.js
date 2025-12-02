// Get kingdom name from localStorage (new method) or URL params (fallback)
const name = localStorage.getItem('$current_kingdom') || (() => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("name");
})();

const kingdomName = document.getElementById("kingdomName");
kingdomName.textContent = name || "Unknown Kingdom";

document.querySelectorAll(".info-card").forEach((card) => {
  card.addEventListener("click", () => {
    const target = card.getAttribute("data-target");
    console.log(target);
    if (!name || !target) return;
    // Import navigation utility dynamically
    import('../../../assets/js/utils/navigation.js').then(({ Navigation }) => {
      Navigation.goToKingdomMilitiaSection(name, target);
    });
  });
});
