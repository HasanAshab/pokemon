import { processor } from "./helpers.js"

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
        baseStats[stat] = parseFloat((baseStats[stat] + share).toFixed(2));
    }
}

export default processor([
    modifyBaseStats,
]);
