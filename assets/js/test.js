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

class Wave {
  constructor(commander, soldiers, options) {
    this.commander = commander
    this.soldiers = soldiers
    this.options = options
  }

  cp() {
    const commanderCp = this.commander.image.cp()
    const soldiersCp = Array.from(this.soldiers.entries()).reduce((sum, [pokemon, quantity]) => {
      return sum + pokemon.cp() * quantity;
    }, 0);
    
    return commanderCp + soldiersCp
  }
}


function calculateWaveOutcome(attackers, defenders) {
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

  // Calculate differences
  const luckDiff = attackerLuck - defenderLuck;
  const iqDiff = attackerIQMultiplier - defenderIQMultiplier;
  const cpDiff = attackersCP - defendersCP;

  // Determine the main cause of win/loss
  let cause = '';
  if (Math.abs(luckDiff) > Math.abs(iqDiff) && Math.abs(luckDiff) > Math.abs(cpDiff) / Math.max(attackersCP, defendersCP)) {
    cause = luckDiff > 0 ? 'Attackers won due to better luck.' : 'Defenders won due to better luck.';
  } else if (Math.abs(iqDiff) > Math.abs(cpDiff) / Math.max(attackersCP, defendersCP)) {
    cause = iqDiff > 0 ? 'Attackers won with better strategic IQ.' : 'Defenders won with better strategic IQ.';
  } else {
    cause = cpDiff > 0 ? 'Attackers overpowered the defenders with stronger units.' : 'Defenders overpowered the attackers with stronger units.';
  }

  const win = adjustedAttackersCP > adjustedDefendersCP;

  // Wounded estimation (simple 20% of soldiers lost for the loser)
  function calculateWounded(soldiers, percent) {
    const result = new Map();
    for (const [pokemon, quantity] of soldiers.entries()) {
      result.set(pokemon, Math.ceil(quantity * percent));
    }
    return result;
  }

  const wounded = {
    atk: win ? calculateWounded(attackers.soldier, 0.1) : calculateWounded(attackers.soldier, 0.2),
    def: win ? calculateWounded(defenders.soldier, 0.2) : calculateWounded(defenders.soldier, 0.1),
  };

  return {
    win,
    cause,
    wounded,
  };
}


const com1 = {
    image: charizard, // image means assume another charizard the commander
    iq: {
      // 10 is max iq for any kind
      offensive: 3,
      defensive: 1.5,
    }
}
const com2 = {
    image: charmander, // image means assume another charmander the commander
    iq: {
      // 10 is max iq for any kind
      offensive: 1,
      defensive: 5,
    }
  }


const wave1 = {
  commander: com1,
  soldier: new Map([
    [charizard, 10],
    [charmander, 100],
  ]),
  options: {
    //luck: 1
  }
}
const wave2 = {
  commander: com2,
  soldier: new Map([
    [charizard, 40],
  ]),
  options: {}
}


console.log(calculateWaveOutcome(wave1, wave1))