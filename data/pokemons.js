import humans from "./humans.js";
import entities from "./default/entities.js";
import entitiesExtra from "./extras/entities.js";
import beasts from "./beasts.js";

function processHuman(human) {
  human.type = "human"
  // human.abilities = {}
  // for (const stat in human.baseStats) {
  //   human.baseStats[stat] = Math.floor(human.baseStats[stat] * 0.5)
  // }
}

function processEntity(entity) {
  entity.type = "entity"
  entity.abilities = {}
  for (const stat in entity.baseStats) {
    entity.baseStats[stat] = Math.floor(entity.baseStats[stat] * 0.5)
  }
}

function processBeast(beast) {
  beast.type = "beast"
  // for (const stat in beast.baseStats) {
  //   beast.baseStats[stat] = Math.floor(beast.baseStats[stat] * 1.5)
  // }
}

for (const human of Object.values(humans)) {
  processHuman(human)
}

for (const entity of Object.values(entities)) {
  processEntity(entity)
}
for (const entity of Object.values(entitiesExtra)) {
  processEntity(entity)
}

for (const beast of Object.values(beasts)) {
  processBeast(beast)
}

export default {
  ...humans,
  ...entities,
  ...entitiesExtra,
  ...beasts
}