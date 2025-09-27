import { Pokemon, Move } from "./utils/models.js";


export class SoldierStack extends Map {
  constructor(data = []) {
    if (data instanceof Map)
      data = [...data.entries()]
    data = data.map(([imageMeta, quantity]) => {      
      const image = imageMeta instanceof Pokemon
        ? imageMeta
        : new Pokemon(imageMeta.id, imageMeta)
      return [image, quantity]
    })
    super(data)
  }
  
  get (id) {
    return this.entries().find(([image]) => image.id === id) ?? null
  }

  find(id) {
    const stack = this.entries().find(([image]) => image.id === id) ?? [0, 0]
    return stack[1]
  }
  
  reduce() {
    return Array.from(this.entries()).reduce(...arguments)
  }
  
  cp() {
    return this.reduce((sum, [image, quantity]) => {
      return sum + image.cp() * quantity;
    }, 0);
  }
  
  count() {
    return this.reduce((sum, [image, quantity]) => {
      return sum + quantity;
    }, 0);
  }
  
  statOf(stat) {
    return this.reduce((sum, [image, quantity]) => {      
      return sum + (image.stats[stat] * quantity);
    }, 0);
  }
  
  armorScore() {
    return this.reduce((score, [image, quantity]) => {
      const ahp = image.items._items.reduce((ahp, item) => {
        if (item.type === "armor") {
          const totalStat = Object.values(item.stats).reduce((sum, stat) => sum + stat, 0)
          ahp += totalStat * (item.covers / 100)
        }
        return ahp
      }, 0)
      return score + (ahp * quantity)
    }, 0)
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
    return this.soldiers.statOf(stat) * this.cpModifier()
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

export class AttackWave extends Wave {
  constructor() {
    super(...arguments)
    this._setIqModifier()
  }
  
  _setIqModifier() {
    if (!this.commander.iq.offensive)
      throw new Error('This commander is unable to attack!')
    this.meta.iqModifier = 1 + (this.commander.iq.offensive / 10)
    this._cpModifiers.push(this.meta.iqModifier)
  }
}

export class DefenseWave extends Wave {
  constructor() {
    super(...arguments)
    this._setIqModifier()
  }
  
  _setIqModifier() {
     if (!this.commander.iq.defensive)
      throw new Error('This commander is unable to defend!')
    this.meta.iqModifier = 1 + (this.commander.iq.defensive / 10)
    this._cpModifiers.push(this.meta.iqModifier)
  }
}



class War {
  static details = {
    good: `Destruct as much as possible`,
    bad: `No profit`
  }

  constructor(attackers, defenders) {
    if (!(attackers instanceof AttackWave && defenders instanceof DefenseWave))
      throw new Error('Invalid waves!')
    this.attackers = attackers
    this.defenders = defenders
    this.result = {
      scores: {}
    }
    this._generateResult()
  }

  comments() {
    const commentLines = [];
    const attackersScore = this.result.scores.atk;
    const defendersScore = this.result.scores.def;
    const attackersCP = this.attackers.soldiers.cp();
    const defendersCP = this.defenders.soldiers.cp();
    const luckDiff = this.attackers.meta.luckModifier - this.defenders.meta.luckModifier;
    const iqDiff = this.attackers.meta.iqModifier - this.defenders.meta.iqModifier;
    const cpDiff = attackersCP - defendersCP;
    

    // Units quantity
    commentLines.push(this._vsQuantStr());
  
    // Stronger units
    if (cpDiff > 0) {
      commentLines.push("Attacker has stronger units");
    } else {
      commentLines.push("Defender has stronger units");
    }


    // Units advantage
    // if (attackersScore > defendersScore !== attackersCP > defendersCP) {
    //   if (attackersScore > defendersScore) {
    //     commentLines.push("Attacker units got advantage");
    //   } else {
    //     commentLines.push("Defender units got advantage");
    //   }
    // }
  
    // Better luck
    if (luckDiff > 0) {
      commentLines.push("Attacker has better luck");
    } else {
      commentLines.push("Defender has better luck");
    }
    
    
    // Better commander IQ
    if (iqDiff > 0) {
      commentLines.push("Attacker has better commander");
    } 
    else if (iqDiff < 0) {
      commentLines.push("Defender has better commander");
    }
    return commentLines
  }
  
  _generateResult() {
    this.result.scores.atk = this._calcScore(this.attackers);
    this.result.scores.def = this._calcScore(this.defenders);    
    this.result.raisedWhiteFlag = this._raisedWhiteFlag()
    this.result.win = this.result.raisedWhiteFlag || this._canWin()
    this.result.wounded = this._calcWounded()
  }
  
  _raisedWhiteFlag() {
    return false
  }
  
  _canWin() {
    return this.result.scores.atk > this.result.scores.def;
  }
  
  _calcWounded() {
    const wounded = {
      atk: new SoldierStack(),
      def: new SoldierStack()
    }
    if (this.result.raisedWhiteFlag)
      return wounded

    if (this.result.win) {
      const per = Math.max((this.result.scores.def * 100) / this.result.scores.atk, 0);      
      wounded.atk = this.attackers.soldiers.resize(per);
      wounded.def = this.defenders.soldiers;
    } else {
      const per = Math.max((this.result.scores.atk * 100) / this.result.scores.def, 0);
      wounded.def = this.defenders.soldiers.resize(per);
      wounded.atk = this.attackers.soldiers;
    }
    return wounded
  }

  _opponentOf(w) {
    return w === this.attackers
      ? this.defenders
      : this.attackers
  }

  _calcScore(w1) {
    const w2 = this._opponentOf(w1)
    const phyScore = w1.statOf('def') - w2.statOf('atk')
    const spScore = w1.statOf('spd') - w2.statOf('spa')
    const otherScore = w1.statOf('hp') + w1.statOf('spe') + w1.soldiers.armorScore()        
    return (phyScore + spScore + otherScore)
  }
  
  _vsQuantStr() {
    const atk = this.attackers.soldiers.count()
    const def = this.defenders.soldiers.count()
    
    const atkQuant = atk > def
      ? `${Math.ceil(atk / def)} Attackers`
      : "1 Attacker"
      
    const defQuant = def > atk
      ? `${Math.ceil(def / atk)} Defenders`
      : "1 Defender"
    return `${atkQuant} vs ${defQuant}`
  }
}

class OccupationWar extends War {
  static details = {
    good: `Occupy the attacked land`,
    bad: `Have to send 30% stronger might`
  }

  _canWin() {
    return this.result.scores.atk * 0.7 > this.result.scores.def
  }
}

class HarvestingWar extends War {
  static details = {
    good: `Sending large amount of might than opponent results peaceful win`,
    bad: `Sending almost equal might results war`
  }

  _raisedWhiteFlag() {
    const whiteFlagChance = Math.min(
      Math.max(
        ((this.result.scores.atk / this.result.scores.def) * 0.7) - 1,
        0
      ),
      0.95
    )
    return Math.random() < whiteFlagChance
  }
}


let student = new Pokemon("student", {
    "xp": 500,
    // "items": ["ironarmor"]
})

let rookie = new Pokemon("rookie", {
    "xp": 1000,
    // "items": ["ironarmor"]
})

let genin = new Pokemon("genin", {
    "xp": 2000,
})

const com1 = {
  image: genin, // image means assume another genin the commander
  iq: {
    // 10 is max iq for any kind
    offensive: 3,
    defensive: 1.5,
  }
}
const com2 = {
  image: genin, // image means assume another student the commander
  iq: {
    // 10 is max iq for any kind
    offensive: 1,
    defensive: 3,
  }
}

let wave1 = new AttackWave(com1, new SoldierStack([
  // [genin, 40],
  [rookie, 3],
]), {luck: 1})
let wave2 = new DefenseWave(com2, new SoldierStack([
  [genin, 1],
]), {luck: 1})


let war = new HarvestingWar(wave1, wave2)
console.log(war.result.scores.atk, war.result.scores.def)
console.log(war.comments())


wave1 = new AttackWave(com1, new SoldierStack([
  // [genin, 40],
  [rookie, 8],
]), {luck: 1})
wave2 = new DefenseWave(com2, new SoldierStack([
  [genin, 2],
]), {luck: 1})


war = new HarvestingWar(wave1, wave2)
console.log(war.result.scores.atk, war.result.scores.def)
console.log(war.comments())

// console.log('atk')
// res.wounded.atk.forEach(console.log)
// console.log('def')
// res.wounded.def.forEach(console.log)


//wave1.resize(10)
//wave1.soldiers.forEach(console.log)
