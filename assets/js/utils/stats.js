export function applyStatChanges(attacker, target, move) {
    const statChanged = move.meta.stat_chance === 0 
      || move.meta.stat_chance === 100
      || Math.random() < (move.meta.stat_chance / 100)
    
    if (!statChanged) return

    // Apply changes to target's stat stages
    for (const [stat, change] of Object.entries(move.stat_changes.target)) {
        target.state.applyStatChange(stat, change)
    }

    // Apply changes to attacker's stat stages
    for (const [stat, change] of Object.entries(move.stat_changes.self)) {
        attacker.state.applyStatChange(stat, change)
    }
}
