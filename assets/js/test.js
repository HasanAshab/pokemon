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
  constructor(commander, soldiers, options = {}) {
    this.commander = commander
    this.soldiers = soldiers
    this._processOptions(options)
  }
  

  soldiersCp() {
    return Array.from(this.soldiers.entries()).reduce((sum, [image, quantity]) => {
      return sum + image.cp() * quantity;
    }, 0);
  }
  
  soldiersCount() {
    return Array.from(this.soldiers.entries()).reduce((sum, [image, quantity]) => {
      return sum + quantity;
    }, 0);
  }
  
  soldiersStat(stat) {
    return Array.from(this.soldiers.entries()).reduce((sum, [soldier, quantity]) => {
      return sum + (soldier.stats[stat] * quantity);
    }, 0);
  }
  
  pluckSoldiers(percent) {
    const result = new Map();
    const mod = percent / 100
    for (const [image, quantity] of this.soldiers.entries()) {
      result.set(image, Math.ceil(quantity * mod));
    }
    return result;
  }

  cp() {
    return this.commander.image.cp() + this.soldiersCp()
  }

  statOf(stat) {
    const commanderStat = this.commander.image.stats[stat]
    const totalCp = commanderStat + this.soldiersCp(stat)
    return totalCp * this.cpModifier()
  }
  
  cpModifier() {
    return this._cpModifiers.reduce((acc, mod) => acc * mod, 1)
  }
  
  
  _processOptions(options) {
    this.options = options
    this._cpModifiers = options.cpModifiers || []
    this.meta = {}
    
    this.meta.luckModifier = options?.luck ?? (0.9 + Math.random() * 0.2)
    this._cpModifiers.push(this.meta.luckModifier)
    
    this.meta.morality = options.morality ?? 100;
    this.meta.moralityFactor = (this.meta.morality / 100) * 1 + ((100 - this.meta.morality) / 100) * 0.6;
    this._cpModifiers.push(this.meta.moralityFactor);
  }
}

class AttackWave extends Wave {
  constructor() {
    super(...arguments)
    this._setIqModifier()
  }
  
  _setIqModifier() {
    this.meta.iqModifier = 1 + (this.commander.iq.offensive / 10)
    this._cpModifiers.push(this.meta.iqModifier)
  }
}

class DefenseWave extends Wave {
  constructor() {
    super(...arguments)
    this._setIqModifier()
  }
  
  _setIqModifier() {
    this.meta.iqModifier = 1 + (this.commander.iq.defensive / 10)
    this._cpModifiers.push(this.meta.iqModifier)
  }
}


function vsQuantStr(attackers, defenders) {
  const atk = attackers.soldiersCount()
  const def = defenders.soldiersCount()
  
  const atkQuant = atk > def
    ? `${Math.ceil(atk / def)} Attackers`
    : "1 Attacker"
    
  const defQuant = def > atk
    ? `${Math.ceil(def / atk)} Defenders`
    : "1 Defender"
  return `${atkQuant} vs ${defQuant}`
}


function calculateScore(w1, w2) {
  const phyScore = w1.statOf('def') - w2.statOf('atk')
  const spScore = w1.statOf('spd') - w2.statOf('spa')
  const otherScore = w1.statOf('hp') + w1.statOf('spe')
  return phyScore + spScore + otherScore
}

function calculateWaveOutcome(attackers, defenders) {
  const atkCount = attackers.soldiersCount();
  const defCount = defenders.soldiersCount();
  const HANDS_BONUS_FACTOR = 0.1;

  const atkHandsModifier = atkCount > defCount
    ? 1 + ((atkCount - defCount) / defCount) * HANDS_BONUS_FACTOR
    : 1;

  const defHandsModifier = defCount > atkCount
    ? 1 + ((defCount - atkCount) / atkCount) * HANDS_BONUS_FACTOR
    : 1;

  const attackersScore = calculateScore(attackers, defenders) * atkHandsModifier;
  const defendersScore = calculateScore(defenders, attackers) * defHandsModifier;

  const win = attackersScore > defendersScore;

  const attackersCP = attackers.soldiersCp();
  const defendersCP = defenders.soldiersCp();

  const luckDiff = attackers.meta.luckModifier - defenders.meta.luckModifier;
  const iqDiff = attackers.meta.iqModifier - defenders.meta.iqModifier;
  const cpDiff = attackersCP - defendersCP;

  const commentLines = [];

  // Units quantity
  if (atkCount !== defCount) {
    commentLines.push(vsQuantStr(attackers, defenders));
  }

  // Stronger units
  if (cpDiff > 0) {
    commentLines.push("Attacker has stronger units");
  } else {
    commentLines.push("Defender has stronger units");
  }

  // Units advantage
  if (attackersScore > defendersScore !== attackers.cp() > defenders.cp()) {
    if (attackersScore > defendersScore) {
      commentLines.push("Attacker units got advantage");
    } else {
      commentLines.push("Defender units got advantage");
    }
  }

  // Better luck
  if (luckDiff > 0) {
    commentLines.push("Attacker has better luck");
  } else {
    commentLines.push("Defender has better luck");
  }

  // Better commander IQ
  if (iqDiff > 0) {
    commentLines.push("Attacker has better commander");
  } else {
    commentLines.push("Defender has better commander");
  }

  const wounded = {};

  if (win) {
    const per = (defendersScore * 100) / attackersScore;
    wounded.atk = attackers.pluckSoldiers(per);
    wounded.def = defenders.soldiers;
  } else {
    const per = (attackersScore * 100) / defendersScore;
    wounded.def = defenders.pluckSoldiers(per);
    wounded.atk = attackers.soldiers;
  }

  return {
    win,
    comment: commentLines.join('\n'),
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


const wave1 = new AttackWave(com1, new Map([
  [charizard, 10],
  [charmander, 100],
]))

const wave2 = new DefenseWave(com2, new Map([
  [charizard, 40],
]), { morality: 70 })



const res = calculateWaveOutcome(wave1, wave2)
console.log(res)

// console.log('atk')
// res.wounded.atk.forEach(console.log)
// console.log('def')
// res.wounded.def.forEach(console.log)

