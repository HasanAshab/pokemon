import humans from "./humans.js";
import entities from "./default/entities.js";
import entitiesExtra from "./extras/entities.js";
import beasts from "./beasts.js";



function fixSpeed(pokemon) {  
    const baseWeight = 50;       // Reference weight for comparison (lighter Pokémon benefit more)
    const maxPenalty = 0.6;      // Maximum reduction percentage (60%)
    const minBonus = 0.2;        // Minimum bonus for very light Pokémon (20%)
    const multiplier = 0.75

    // Calculate the weight factor
    const weightFactor = Math.max(
        (pokemon.weightkg / baseWeight) - 1, // Penalty for heavier Pokémon
        -minBonus                           // Bonus for lighter Pokémon
    );

    // Adjust speed
    const penaltyFactor = 1 - Math.min(weightFactor, maxPenalty); // Clamp penalty to maxPenalty
    const modifiedSpeed = pokemon.baseStats.spe * penaltyFactor;
    const finalSpeed = Math.max(1, modifiedSpeed * multiplier)
    pokemon.baseStats.spe = parseFloat(finalSpeed.toFixed(2));
}

function modifyBaseStats(pokemon) {  
    const oldSpeed = pokemon.baseStats.spe;
    fixSpeed(pokemon);
    const newSpeed = pokemon.baseStats.spe;

    const speedReduced = oldSpeed - newSpeed;
    
    if (speedReduced <= 0) return; // No redistribution needed if speed didn't reduce

    const baseStats = pokemon.baseStats;
    const statKeys = Object.keys(baseStats).filter(stat => stat !== 'spe');
    const share = Math.round(speedReduced / statKeys.length);

    for (const stat of statKeys) {
        baseStats[stat] = Math.round(baseStats[stat] + share);
    }
}

function processEntity(entity) {
  entity.type = "entity"

  // entity.abilities = {}
  // for (const stat in entity.baseStats) {
  //   entity.baseStats[stat] = Math.floor(entity.baseStats[stat] * 0.5)
  // }
}

function processBeast(beast) {
  beast.type = "beast"
  for (const stat in beast.baseStats) {
    beast.baseStats[stat] = Math.floor(beast.baseStats[stat] * 1.5)
  }
}

function setTotalBaseStats(pokemon) {
  pokemon.baseStatsTotal = Math.round(
    Object.values(pokemon.baseStats).reduce((a, b) => a + b)
  );
}

for (const [id, entity] of Object.entries(entities)) {
  // TEMP: skip
  if (entity.isCosmeticForme) {
    delete entities[id]
    continue
  }
  processEntity(entity)
  modifyBaseStats(entity)
  setTotalBaseStats(entity)

}
for (const entity of Object.values(entitiesExtra)) {
  processEntity(entity)
  modifyBaseStats(entity)
  setTotalBaseStats(entity)
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