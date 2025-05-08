import { Pokemon, Move } from "./utils/models.js";


let charmander = new Pokemon("charmander", {
    "xp": 500,
    "nature": "calm",
    "token_used": {
          "hp":0,
          "spe":0,
          "atk":0,
          "def":0,
          "spa":0,
          "spd":0
    },
    "items": ["ironarmor"]
})

let charizard = new Pokemon("charizard", {
    "xp": 3000,
    "nature": "calm",
    "token_used": {
          "hp":0,
          "spe":0,
          "atk":0,
          "def":0,
          "spa":0,
          "spd":0
      }
})


function canWin(attackers, defenders) {
  // Sum soldier CPs
  let attackersCP = Array.from(attackers.soldier.entries()).reduce((sum, [pokemon, quantity]) => {
    return sum + pokemon.cp() * quantity;
  }, 0);

  let defendersCP = Array.from(defenders.soldier.entries()).reduce((sum, [pokemon, quantity]) => {
    return sum + pokemon.cp() * quantity;
  }, 0);

  // Add commander's CP
  attackersCP += attackers.commander.image.cp();
  defendersCP += defenders.commander.image.cp();

  // IQ multipliers
  const attackerIQMultiplier = 1 + (attackers.commander.iq.offensive / 10);
  const defenderIQMultiplier = 1 + (defenders.commander.iq.defensive / 10);

  // Use explicit luck if provided, else random
  const attackerLuck = attackers.options?.luck ?? (0.9 + Math.random() * 0.2);
  const defenderLuck = defenders.options?.luck ?? (0.9 + Math.random() * 0.2);

  // Adjusted CP
  const adjustedAttackersCP = attackersCP * attackerIQMultiplier * attackerLuck;
  const adjustedDefendersCP = defendersCP * defenderIQMultiplier * defenderLuck;

  console.log("Raw Attackers CP:", attackersCP);
  console.log("Raw Defenders CP:", defendersCP);

  const luckDiff = (attackerLuck - defenderLuck).toFixed(2);
  const iqDiff = (attackerIQMultiplier - defenderIQMultiplier).toFixed(2) * 10;

  if (luckDiff > 0) {
    console.log(`Attackers are luckier by +${luckDiff}`);
  } else if (luckDiff < 0) {
    console.log(`Defenders are luckier by +${Math.abs(luckDiff)}`);
  } else {
    console.log("Both sides have equal luck");
  }

  if (iqDiff > 0) {
    console.log(`Attackers have higher IQ by +${iqDiff}`);
  } else if (iqDiff < 0) {
    console.log(`Defenders have higher IQ by +${Math.abs(iqDiff)}`);
  } else {
    console.log("Both sides have equal strategic IQ");
  }

  console.log("Adjusted Attackers CP:", adjustedAttackersCP.toFixed(2));
  console.log("Adjusted Defenders CP:", adjustedDefendersCP.toFixed(2));

  return adjustedAttackersCP > adjustedDefendersCP;
}


const atk = {
  commander: {
    image: charizard, // image means assume another charizard the commander
    iq: {
      // 10 is max iq for any kind
      offensive: 3,
      defensive: 1.5,
    }
  },
  soldier: new Map([
    [charizard, 10],
    [charmander, 100],
  ]),
  options: {
    //luck: 1
  }
}
const def = {
  commander: {
    image: charmander, // image means assume another charmander the commander
    iq: {
      // 10 is max iq for any kind
      offensive: 1,
      defensive: 5,
    }
  },
  soldier: new Map([
    [charizard, 40],
  ]),
  options: {}
}


console.log(canWin(atk, def))