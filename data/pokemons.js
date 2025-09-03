import humans from "./humans.js";
import entities from "./default/entities.js";
import beasts from "./beasts.js";


for (const entity of Object.values(entities)) {
  entity.type = "entity"
  for (const stat in entity.baseStats) {
    entity.baseStats[stat] = Math.floor(entity.baseStats[stat] * 0.65)
  }
}

for (const beast of Object.values(beasts)) {
  beast.type = "beast"
}


export default {
  ...humans,
  ...entities,
  ...beasts
}