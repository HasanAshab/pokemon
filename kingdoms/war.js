import { Pokemon } from "../assets/js/utils/models.js";
import { getTierOf } from "./utils.js";

function getTierMod(tier) {
  return Math.pow(1.05, tier * 22.6) * 0.5;
}

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

  has (id) {
    return this.get(id) !== null
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

  baseCP() {
    return this.reduce((sum, [image, quantity]) => {      
      return sum + image.baseCP() * quantity;
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
          ahp += Object.values(item.tokens).reduce((sum, stat) => sum + stat, 0)
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
  constructor(commander, soldiers, options = {}, artilleries = []) {
    this.commander = commander
    this.soldiers = soldiers
    this.artilleries = artilleries
    this._processOptions(options)
  }

  resize(percent) {
    const soldiers = this.soldiers.resize(percent)
    return new Wave(this.commander, soldiers, this.options)
  }

  cp() {
    return this.soldiers.cp()
  }

  statOf(stat) {    
    return this.soldiers.statOf(stat) * this.cpModifier()
  }
  
  cpModifier() {    
    return this._cpModifiers.reduce((acc, mod) => acc * mod, 1)
  }

  getSoldiersScore() {
    return this.soldiers.reduce((score, [image, quantity]) => {
      const tierMod = getTierMod(getTierOf(image.id));
      return score + (image.cp() * quantity * tierMod)
    }, 0)
  }

  getArtilleriesScore() {
    return this.artilleries.reduce((score, artillery) => {
      const tierMod = getTierMod(getTierOf(artillery.defence));      
      return score + (artillery.defence * artillery.quantity * tierMod)
    }, 0)
  }

  _processOptions(options) {
    this.options = options
    this._cpModifiers = options.cpModifiers || []
    this.meta = {}

    this.meta.luckModifier = options?.luck ?? (Math.random() * (1.15 - 0.85) + 0.85);
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
    good: `Maximum destruction`,
    bad: `No direct profit`
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
    // const attackersScore = this.result.scores.atk;
    // const defendersScore = this.result.scores.def;
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
      this.result._woundedPer = Math.max((this.result.scores.def * 100) / this.result.scores.atk, 0);      
      wounded.atk = this.attackers.soldiers.resize(this.result._woundedPer);
      wounded.def = this.defenders.soldiers;
    } else {
      this.result._woundedPer = Math.max((this.result.scores.atk * 100) / this.result.scores.def, 0);
      wounded.def = this.defenders.soldiers.resize(this.result._woundedPer);
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
    // const baseScore = w1.soldiers.cp() + w1.soldiers.armorScore()
    return w1.getSoldiersScore() + w1.getArtilleriesScore()

    // const w2 = this._opponentOf(w1)
    // const imageBonusMod = this._getImageBonusMod(w1)    
    // const phyScore = (w1.statOf('def') * imageBonusMod) - w2.statOf('atk')
    // const spScore = (w1.statOf('spd') * imageBonusMod) - w2.statOf('spa')
    // const otherScore = w1.statOf('hp') + w1.statOf('spe') + w1.soldiers.armorScore() + w1._extraScore    
    // return phyScore + spScore + otherScore
  }

  _getImageBonusMod(w1) {
    const w2 = this._opponentOf(w1)

    return w1.soldiers.reduce((mod, [image1, quantity1]) => {
        const baseCP1 = image1.baseCP()

        return mod * w2.soldiers.reduce((mod, [image2, quantity2]) => {
          const baseCP2 = image2.baseCP()
          let ratio = (baseCP1 / baseCP2)
          if (ratio > 1) {
            ratio *= Math.pow(quantity1 * 2, 1.1)
          }
          else {
            ratio *= Math.pow(quantity2 * 0.8, 0.6)
          }
          return mod * ratio
        }, 1)
    }, 1)
  }

  _getFriendBonusMod(w1) {
     return w1.soldiers.reduce((mod, [image, quantity]) => {
        if (quantity <= 1) return mod
        const ratio = Math.pow(1.1, quantity * 0.35)
        console.log(ratio);
         
        return mod * ratio
    }, 1)
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

  scoreDiff() {
    return this.result.scores.atk - this.result.scores.def;
  }

  scoreDiffPercent() {
    const atk = this.result.scores.atk;
    const def = this.result.scores.def;
  
    if (atk === 0 && def === 0) return 0; // avoid NaN
  
    // percent relative to defender
    return ((atk - def) / Math.max(def, 1)) * 100;
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

export const WAR_SYSTEMS = {
  "sabotage": War,
  "occupy": OccupationWar,
  "harvest": HarvestingWar,
}
