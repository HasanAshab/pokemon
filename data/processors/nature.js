import { processor } from "./helpers.js"



function setDescription(nature) {
    nature.description = nature.plus && nature.minus
        ? `${nature.plus.toUpperCase()} +10%, ${nature.minus.toUpperCase()} -10% `
        : "No Effect"
}


export default processor([
    setDescription,
])