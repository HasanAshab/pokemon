import { Move } from "./utils/models.js";
import { BATTLE_SYSTEMS } from "./utils/battle.js";

function _canDodge(attacker, target, move) {
        if (move.accuracy === true || !target.state.effects.canMove()) {
            return false;
        }

        // Get speed stats
        const attackerSpd = attacker.state.stats.get("spe");
        const targetSpd = target.state.stats.get("spe");
        
        console.log("move acc", move.accuracy)
        console.log(attackerSpd, targetSpd)
        // Get accuracy and evasion stats
        const attackerAccuracy = attacker.state.stats.get("accuracy")
        const targetEvasion = target.state.stats.get("evasion")

        // Base dodge chance using a modified speed ratio
        const speedRatio = targetSpd / attackerSpd;
        const dodgeChance = Math.max(0.05, Math.min(speedRatio * 0.3, 0.5)); // Clamp between 5% and 50%
    
        // Accuracy and evasion modifiers
        const accuracyModifier = attackerAccuracy / targetEvasion;
    
        // Calculate final hit chance
        const finalHitChance = move.accuracy * accuracyModifier * (1 - dodgeChance) * 0.70;
        console.log(target.id, finalHitChance)
    
        // Simulate random factor for dodge mechanics
        const randomFactor = Math.random() * 100;

        // Return true if target dodges, false if the move hits
        const dodged = randomFactor > finalHitChance;
        dodged && target.state.emit("dodged", move)
        
        return dodged 
    }

let atk = new Pokemon("machoke", {
    "xp": 1700,
    "nature": "calm",
      "stats": {},
      "token_used":{
          "hp":0,
          "spe":0,
          "atk":0,
          "def":0,
          "spa":0,
          "spd":0
      }
})

let tar = new Pokemon("fletchinder", {
    "xp": 1800,
    "nature": "calm",
      "stats": {
          "spe": 2
      },
      "token_used":{
          "hp":0,
          "spe":0,
          "atk":0,
          "def":0,
          "spa":0,
          "spd":0
      }
})

let bs = new BATTLE_SYSTEMS["single"]([atk], [tar])
bs.activate(atk)
bs.activate(tar)
let move = new Move("lowsweep")
console.log(
    _canDodge(atk, tar, move)
    )