function addEffect(name, playerTag) {
  const effectsDataColumn = document.querySelector(`.${playerTag}-controle-cont .effects-data-column`)
  const html = ` <span class="effect" style="background-color:var(--fire-type-color)">Burn</span>`
  effectsDataColumn.innerHTML += html
}
function addPokeAttribute(name, value, playerTag) {
  const attributesDataRow = document.querySelector(`.${playerTag}-controle-cont .attributes-data-row`)
  attributesDataRow.innerHTML += `<span>${name}${value}</span>`
}

function setRetreatPerWave(retreat, playerTag) {
  const retreatPerWave = document.querySelector(`.${playerTag}-controle-cont .retreat-per-wave`)
  retreatPerWave.textContent = retreat
}
function setCurrentRetreat(retreat, playerTag) {
  const currentRetreat = document.querySelector(`.${playerTag}-controle-cont .current-retreat`)
  currentRetreat.textContent = retreat

}

function setTotalHealth(hp, playerTag) {
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .health-progress-bar`)
  healthProgressBar.setAttribute("data-total-hp", hp)
  healthProgressBar.setAttribute("data-current-hp", hp)
  healthProgressBar.querySelector(".inner").style.width = '100%'

}
function injectDamage(damage, playerTag) {
  const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .health-progress-bar`)
  const newHp = Number(healthProgressBar.getAttribute("data-current-hp")) - damage
  const totalHp = Number(healthProgressBar.getAttribute("data-total-hp"))
  healthProgressBar.setAttribute("data-current-hp", newHp)
  healthProgressBar.querySelector(".current-hp").textContent = newHp
  const progress = (newHp / totalHp) * 100
  healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0: progress}%`
}
function showMoveDamageInjectForm(moveName, damage, playerTag) {
  const moveDamageInjectForm = document.querySelector(`.${playerTag}-controle-cont .move-damage-inject-form`)
  moveDamageInjectForm.classList.add("active")
  const moveNameHeading = moveDamageInjectForm.querySelector(".move-name")
  const damageInp = moveDamageInjectForm.querySelector(".damage-input")
  const injectBtn = moveDamageInjectForm.querySelector(".inject-btn")
  const noBtn = moveDamageInjectForm.querySelector(".no-btn")
  moveNameHeading.textContent = moveName || "name"
  damageInp.value = damage || 0
  injectBtn.onclick = ()=> {
    moveDamageInjectForm.classList.remove("active")
    injectDamage(damageInp.value || 0, playerTag === "you" ? "enemy": "you")
  }
  noBtn.onclick = ()=> moveDamageInjectForm.classList.remove("active")


}

function loadAllMoves(movesArr, playerTag) {
  const moveCardsContainer = document.querySelector(`.${playerTag}-controle-cont .card-container`)
  //clean up old cards
  const oldMoveCards = moveCardsContainer.querySelectorAll('.card')
  for (const card of oldMoveCards) {
    moveCardsContainer.removeChild(card)
  }
  // re adding cards
  movesArr.forEach((move)=> {
    const cardHtml = ` <div class="card " data-retreat-cost="2" data-damage="300" data-move-name="Flamethrower" onclick="moveClickHandler(event,'you')">
    <div class="card-header">
    <h3>Flamethrower</h3>
    <div class="icons">
    <div class="icon"></div>
    <div class="icon"></div>
    </div>
    </div>
    <div class="card-body">
    <p>
    Category: Special
    </p>
    <p>
    Damage: 300
    </p>
    <p>
    PP: 5
    </p>
    </div>
    <div class="retreat-cost">
    2
    </div>
    </div>
    `

  })

}
function handleMoveCardSelect(card, playerTag) {
  const oponentPlayerTag = playerTag === "you" ? "enemy": "you"
  const oponentSelectedMoveCard = document.querySelector(`.${oponentPlayerTag}-controle-cont .card-container .card.selected`)
  if (oponentSelectedMoveCard){
    oponentSelectedMoveCard.classList.remove("selected")
  }else{
    card.parentElement.querySelector(".card.selected")?.classList.remove("selected")
    card.classList.add("selected")
  }
  }
function moveCardClickHandler( {
  currentTarget
}, playerTag) {
  handleMoveCardSelect(currentTarget, playerTag)

  
}
function newWave() {}