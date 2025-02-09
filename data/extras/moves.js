
export default {
    staythere: {
      num: 100001,
      accuracy: true,
      basePower: 0,
      category: "None",
      name: "Stay There",
      pp: null,
      priority: 0,
      flags: {offensive: 0},
      secondary: null,
      target: "normal",
      type: "Normal",
      retreat: 0,
    },
    dodge: {
      num: 100002,
      accuracy: true,
      basePower: 0,
      category: "None",
      name: "Dodge",
      pp: null,
      priority: 0,
      flags: { offensive: 0 },
      secondary: null,
      target: "normal",
      type: "Normal",
      isOffensive: false,
      retreat: 0.25,
      onTryMove(attacker, defender, move) {
        if (move.accuracy === true || !defender.state.effects.canMove()) {
            return null;
        }

        // Get speed stats
        const attackerSpd = attacker.state.stats.get("spe");
        const defenderSpd = defender.state.stats.get("spe");
        
        // Get accuracy and evasion stats
        const attackerAccuracy = attacker.state.stats.get("accuracy")
        const defenderEvasion = defender.state.stats.get("evasion")

        // Base dodge chance using a modified speed ratio
        const speedRatio = defenderSpd / attackerSpd;
        const dodgeChance = Math.max(0.05, Math.min(speedRatio * 0.3, 0.7)); // Clamp between 5% and 70%
    
        // Accuracy and evasion modifiers
        const accuracyModifier = attackerAccuracy / defenderEvasion;
    
        // Calculate final hit chance
        const finalHitChance = move.accuracy * accuracyModifier * (1 - dodgeChance) * 0.70;
        console.log(defender.id, finalHitChance)
    
        // Simulate random factor for dodge mechanics
        const randomFactor = Math.random() * 100;

        // Return true if defender dodges, false if the move hits
        const dodged = randomFactor > finalHitChance;
        //dodged && defender.state.emit("dodged", move)

        if (!dodged) return null
      }
    },
    doubleteam: {
      num: 104,
      accuracy: true,
      basePower: 0,
      category: "Status",
      name: "Double Team",
      pp: 15,
      priority: 0,
      flags: { snatch: 1, metronome: 1 },
      secondary: null,
      target: "self",
      type: "Normal",
      contestType: "Cool",
      effects: {
        self: [{
          name: "doubleteam",
          chance: 100,
          isVolatile: true 
        }],
        target: []
      },
      retreat: 3,
    },
}