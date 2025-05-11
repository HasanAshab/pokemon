import { Pokemon, Move } from "./utils/models.js";


let charmander = new Pokemon("student", {
    "xp": 500,
    "nature": "calm",
    "items": ["ironarmor"]
})

let charizard = new Pokemon("genin", {
    "xp": 3000,
    "nature": "calm"
})

class SoldierStack extends Map {
  constructor(data = []) {
    data = data.map(([imageMeta, quantity]) => {
      const image = imageMeta instanceof Pokemon
        ? imageMeta
        : new Pokemon(imageMeta.id, imageMeta)
      return [image, quantity]
    })
    super(data)
  }
  
  find(id) {
    const stack = this.entries().find(([image]) => image.id === id)
    return stack[1]
  }
  
  cp() {
    return Array.from(this.entries()).reduce((sum, [image, quantity]) => {
      return sum + image.cp() * quantity;
    }, 0);
  }
  
  count() {
    return Array.from(this.entries()).reduce((sum, [image, quantity]) => {
      return sum + quantity;
    }, 0);
  }
  
  statOf(stat) {
    return Array.from(this.entries()).reduce((sum, [image, quantity]) => {
      return sum + (image.stats[stat] * quantity);
    }, 0);
  }
  
  resize(percent) {
    const result = new SoldierStack();
    const mod = percent / 100
    for (const [image, quantity] of this.entries()) {
      result.set(image, Math.ceil(quantity * mod));
    }
    return result;
  }
}

class Wave {
  constructor(commander, soldiers, options = {}) {
    this.commander = commander
    this.soldiers = soldiers
    this._processOptions(options)
  }
  
  resize(percent) {
    const soldiers = this.soldiers.resize(percent)
    return new Wave(this.commander, soldiers, this.options)
  }

  cp() {
    return this.commander.image.cp() + this.soldiers.cp()
  }

  statOf(stat) {
    const commanderStat = this.commander.image.stats[stat]
    const totalCp = commanderStat + this.soldiers.statOf(stat)
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
  const atk = attackers.soldiers.count()
  const def = defenders.soldiers.count()
  
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
  const atkCount = attackers.soldiers.count();
  const defCount = defenders.soldiers.count();
  const HANDS_BONUS_FACTOR = 0.07;

  const atkHandsModifier = atkCount > defCount
    ? 1 + ((atkCount - defCount) / defCount) * HANDS_BONUS_FACTOR
    : 1;

  const defHandsModifier = defCount > atkCount
    ? 1 + ((defCount - atkCount) / atkCount) * HANDS_BONUS_FACTOR
    : 1;

  const attackersScore = calculateScore(attackers, defenders) * atkHandsModifier;
  const defendersScore = calculateScore(defenders, attackers) * defHandsModifier;

  const win = attackersScore > defendersScore;

  const attackersCP = attackers.soldiers.cp();
  const defendersCP = defenders.soldiers.cp();

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
    wounded.atk = attackers.soldiers.resize(per);
    wounded.def = defenders.soldiers;
  } else {
    const per = (attackersScore * 100) / defendersScore;
    wounded.def = defenders.soldiers.resize(per);
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


const wave1 = new AttackWave(com1, new SoldierStack([
  [charizard, 10],
  [charmander, 100],
]))

const wave2 = new DefenseWave(com2, new SoldierStack([
  [charizard, 40],
]), { morality: 70 })



const res = calculateWaveOutcome(wave1, wave2)
console.log(res)

// console.log('atk')
// res.wounded.atk.forEach(console.log)
// console.log('def')
// res.wounded.def.forEach(console.log)


//wave1.resize(10)
//wave1.soldiers.forEach(console.log)



function prepareSoldiers(total, percentMap) {
  const data = percentMap.map(([image, per]) => {
    const quantity = Math.ceil(total.find(image.id) * (per / 100))
    return [image, quantity]
  })
  return new SoldierStack(data)
}

charizard.meta.id = 'charizard'
charmander.meta.id = 'charmander'
const militia = new SoldierStack([
  [charmander.meta, 20],
  [charizard.meta, 5],
])
const p = [
    [charmander, 80],
    [charizard, 80]
  ]
prepareSoldiers(militia, p).resize(10).forEach(console.log)


