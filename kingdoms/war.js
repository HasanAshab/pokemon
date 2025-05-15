import { Pokemon } from "../assets/js/utils/models.js";


export class SoldierStack extends Map {
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
    const stack = this.entries().find(([image]) => image.id === id) ?? [0]
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
        if ("armor" in item)
          ahp += item.armor.hp * (item.armor.covers / 100)
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

export class AttackWave extends Wave {
  constructor() {
    super(...arguments)
    this._setIqModifier()
  }
  
  _setIqModifier() {
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
    this.meta.iqModifier = 1 + (this.commander.iq.defensive / 10)
    this._cpModifiers.push(this.meta.iqModifier)
  }
}


class War {
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
    if (attackersScore > defendersScore !== attackersCP > defendersCP) {
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
      atk: new Map(),
      def: new Map()
    }
    if (this.result.raisedWhiteFlag)
      return wounded

    if (this.result.win) {
      const per = (this.result.scores.def * 100) / this.result.scores.atk;
      wounded.atk = this.attackers.soldiers.resize(per);
      wounded.def = this.defenders.soldiers;
    } else {
      const per = (this.result.scores.atk * 100) / this.result.scores.def;
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
    const manPowerModifier = this._calcManPowerMod(w1)
    const phyScore = w1.statOf('def') - w2.statOf('atk')
    const spScore = w1.statOf('spd') - w2.statOf('spa')
    const otherScore = w1.statOf('hp') + w1.statOf('spe') + w1.soldiers.armorScore()    
    return (phyScore + spScore + otherScore) * manPowerModifier
  }
  
  _calcManPowerMod(w1) {
    const w2 = this._opponentOf(w1)
    const MP_BONUS_FACTOR = 0.07;
    const w1Count = w1.soldiers.count();
    const w2Count = w2.soldiers.count();
  
    return w1Count > w2Count
      ? 1 + ((w1Count - w2Count) / w2Count) * MP_BONUS_FACTOR
      : 1;
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
  _canWin() {
    return this.result.scores.atk * 0.7 > this.result.scores.def
  }
}

class HarvestingWar extends War {
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

export const WAR_SYSTEMS = {
  "sabotage": War,
  "occupy": OccupationWar,
  "harvest": HarvestingWar,
}
