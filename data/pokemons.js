import humans from "./humans.js";
import entities from "./default/entities.js";
import beasts from "./beasts.js";


for (const entity of Object.values(entities)) {
  entity.type = "entity"
  entity.abilities = {}
  for (const stat in entity.baseStats) {
    entity.baseStats[stat] = Math.floor(entity.baseStats[stat] * 0.5)
  }
}

for (const beast of Object.values(beasts)) {
  beast.type = "beast"
  for (const stat in beast.baseStats) {
    beast.baseStats[stat] = Math.floor(beast.baseStats[stat] * 1.5)
  }
}

export default {
  ...humans,
  ...entities,
  ...beasts
}