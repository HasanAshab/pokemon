function injectDamage(damage, playerTag) {
    const healthProgressBar = document.querySelector(`.${playerTag}-controle-cont .health-progress-bar`)
    const newHp = Number(healthProgressBar.getAttribute("data-current-hp")) - damage
    const totalHp = Number(healthProgressBar.getAttribute("data-total-hp"))
    healthProgressBar.setAttribute("data-current-hp", newHp)
    healthProgressBar.querySelector(".current-hp").textContent = newHp
    const progress = (newHp / totalHp) * 100
    healthProgressBar.querySelector(".inner").style.width = `${progress < 0 ? 0 : progress}%`

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
        injectDamage(damageInp.value || 0, playerTag === "you" ? "enemy" : "you")
    }
    noBtn.onclick = ()=> moveDamageInjectForm.classList.remove("active")


}

function moveClickHandler( {
    currentTarget
}, playerTag) {
    try {
        if (!currentTarget.classList.contains("disabled")) {
            const moveName = currentTarget.getAttribute("data-move-name")
            const damage = currentTarget.getAttribute("data-damage")
            showMoveDamageInjectForm(moveName, damage, playerTag)
        }
    }catch(e) {
        alert(e)
    }
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