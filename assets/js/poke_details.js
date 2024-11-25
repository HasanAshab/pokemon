function setStat(name, value) {
  const stat = document.querySelector(`.stats .stat.${name}`)
  stat.setAttribute("data-value", value)
}
function statClickHandler( {
  currentTarget
}) {
  const statUpdateForm = document.querySelector(".stat-update-form")
  const statNameElm = statUpdateForm.querySelector(".stat-name")
  const statValueInp = statUpdateForm.querySelector(".stat-value-inp")
  const saveBtn = statUpdateForm.querySelector(".save-btn")
  const cancelBtn = statUpdateForm.querySelector(".cancel-btn")

  statUpdateForm.parentNode.classList.add("active")
  statNameElm.textContent = currentTarget.querySelector("strong").textContent
  statValueInp.value = currentTarget.getAttribute("data-value")

  saveBtn.onclick = ()=> {
    setStat(currentTarget.classList[1], statValueInp.value)
  statUpdateForm.parentNode.classList.remove("active")
  }
  cancelBtn.onclick = ()=>{
      statUpdateForm.parentNode.classList.remove("active")
  }
}
function showMoveChooseInterface() {
  
}