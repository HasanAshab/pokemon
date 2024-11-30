export function applyStatChanges(attacker, target, move) {
    // Apply changes to target's stat stages
    for (const [stat, change] of Object.entries(move.stat_changes.target)) {
        target.state.applyStatChange(stat, change)
    }

    // Apply changes to attacker's stat stages
    for (const [stat, change] of Object.entries(move.stat_changes.self)) {
        attacker.state.applyStatChange(stat, change)
    }
}
