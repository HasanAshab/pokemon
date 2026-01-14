import { Pokemon } from "../assets/js/utils/models.js";
import { getTierOf, modObj } from "./utils.js";

function getTierMod(tier) {
  return Math.pow(1.055, tier * 38.043) * 0.2;
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

  forEach() {
    return Array.from(this.entries()).forEach(...arguments)
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

  withoutAmmoCP() {
    return this.reduce((sum, [image, quantity]) => {      
      return sum + image.withoutAmmoCP() * quantity;
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
          ahp += Object.values(item.tokens || {}).reduce((sum, stat) => sum + stat, 0)
        }
        return ahp
      }, 0)
      return score + (ahp * quantity)
    }, 0)
  }

  resize(percent, mode = 'ceil') {
    const result = new SoldierStack();
    const mod = percent / 100
    for (const [image, quantity] of this.entries()) {
      result.set(image, Math[mode](quantity * mod));
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
    const baseScore = this.soldiers.reduce((score, [image, quantity]) => {
      const tierMod = getTierMod(getTierOf(image.id));
      return score + (image.cp() * quantity * tierMod)
    }, 0)
    const mpMod = this.soldiers.count() * 2
    return baseScore * mpMod
  }

  // Get soldiers score with localized counter penalties applied
  getSoldiersScoreWithCounters(counterPenalties) {
    let shinobiScore = 0
    let beastScore = 0
    let otherScore = 0 // For units that are neither shinobi nor beast
    
    this.soldiers.forEach(([image, quantity]) => {
      const tierMod = getTierMod(getTierOf(image.id))
      const unitScore = image.cp() * quantity * tierMod
      
      if (image.type === "human") {
        shinobiScore += unitScore
      } else if (image.type === "beast") {
        beastScore += unitScore
      } else {
        otherScore += unitScore
      }
    })
    
    // Apply counter penalties only to affected unit types
    const effectiveShinobiScore = shinobiScore * (1 - counterPenalties.shinobi)
    const effectiveBeastScore = beastScore * (1 - counterPenalties.beast)
    
    const totalEffectiveScore = effectiveShinobiScore + effectiveBeastScore + otherScore
    const mpMod = this.soldiers.count() * 2
    return totalEffectiveScore * mpMod
  }

  getArtilleriesScore() {
    return this.artilleries.reduce((score, artillery) => {
      const tierMod = getTierMod(getTierOf(artillery.defence));      
      return score + (artillery.defence * artillery.quantity * tierMod)
    }, 0)
  }

  // Get artillery score with localized counter penalties applied
  getArtilleriesScoreWithCounters(counterPenalties) {
    const baseScore = this.getArtilleriesScore()
    // Apply counter penalty only to artillery
    return baseScore * (1 - counterPenalties.artillery)
  }
  
  countings() {
     let shinobi = this.soldiers.reduce((acc, [image, quantity]) => {
      if (image.type !== "human") return acc
      return acc + quantity
    }, 0)
    
    let beast = this.soldiers.reduce((acc, [image, quantity]) => {
      if (image.type !== "beast") return acc
      return acc + quantity
    }, 0)

    let artillery = this.artilleries.reduce((acc, artillery) => {
      return acc + artillery.quantity
    }, 0)

    return {
      shinobi,
      beast,
      artillery
    }
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
      scores: {},
      meta: {}
    }
    this.beforeResult()
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
    // if (cpDiff > 0) {
    //   commentLines.push("Attacker has stronger units");
    // } else {
    //   commentLines.push("Defender has stronger units");
    // }

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

    // Counter Effect - now shows localized penalties instead of global modifiers
    const atkPenalties = this.result.meta.counterPenalties.atk
    const defPenalties = this.result.meta.counterPenalties.def
    
    // Calculate average penalty for display purposes
    const atkAvgPenalty = (atkPenalties.shinobi + atkPenalties.beast + atkPenalties.artillery) / 3
    const defAvgPenalty = (defPenalties.shinobi + defPenalties.beast + defPenalties.artillery) / 3
    
    if (atkAvgPenalty < defAvgPenalty) {
      commentLines.push(`Attacker has better unit composition (${((1 - atkAvgPenalty) * 100).toFixed(0)}% vs ${((1 - defAvgPenalty) * 100).toFixed(0)}%)`);
    } else if (atkAvgPenalty > defAvgPenalty) {
      commentLines.push(`Defender has better unit composition (${((1 - defAvgPenalty) * 100).toFixed(0)}% vs ${((1 - atkAvgPenalty) * 100).toFixed(0)}%)`);
    }
    return commentLines
  }

  beforeResult() {
    // Calculate localized counter penalties for each unit type
    this.result.meta.counterPenalties = {
      atk: this._getCounterPenalties(this.attackers),
      def: this._getCounterPenalties(this.defenders),
    }
  }

  // Calculate localized counter penalties for each unit type
  // Shinobi > Artillery > Beast > Shinobi (cyclic dominance)
  _getCounterPenalties(wave) {
    const enemy = this._opponentOf(wave)
    const waveCount = wave.countings()
    const enemyCount = enemy.countings()

    return {
      shinobi: this._calculateUnitPenalty(enemyCount.beast, waveCount.shinobi),     // Beast counters Shinobi
      beast: this._calculateUnitPenalty(enemyCount.artillery, waveCount.beast),     // Artillery counters Beast
      artillery: this._calculateUnitPenalty(enemyCount.shinobi, waveCount.artillery) // Shinobi counters Artillery
    }
  }

  // Calculate penalty using exponential dampening formula
  // penalty = min(0.7, 1 - e^(-counterCount / targetCount))
  _calculateUnitPenalty(counterCount, targetCount) {
    if (targetCount === 0 || counterCount === 0) {
      return 0 // No penalty if no targets or no counters
    }
    
    const ratio = counterCount / targetCount
    const penalty = Math.min(0.7, 1 - Math.exp(-ratio))
    return penalty
  }

  _generateResult() {
    this.result.scores.atk = this._calcScore(this.attackers);
    this.result.scores.def = this._calcScore(this.defenders);    
    this.result.raisedWhiteFlag = this._raisedWhiteFlag()
    this.result.win = this.result.raisedWhiteFlag || this._canWin()
    this.result.wounded = this._calcWounded()
    this.result.brokenArtilleries = this._calcBrokenArtilleries()
  }

  _raisedWhiteFlag() {
    return false
  }
  
  _canWin() {
    return this.result.scores.atk > this.result.scores.def;
  }

  _calcWoundedPercent() {
    const per = {
      atk: 0,
      def: 0
    }
    const looserWoundPercent = Math.floor(Math.random() * (100 - 95 + 1)) + 95;
    const scoreDiff = this.scoreDiffPercent()
    const woundedPercent = Math.max(0, 100 - Math.abs(scoreDiff))    
    if (this.result.win) {
      per.atk = woundedPercent;
      per.def = looserWoundPercent;
    } else {
      per.def = woundedPercent;
      per.atk = looserWoundPercent;
    }
    return per
  }

  _calcWounded() {
    const wounded = {
      atk: new SoldierStack(),
      def: new SoldierStack()
    }
    if (this.result.raisedWhiteFlag)
      return wounded

    const woundedPercents = this._calcWoundedPercent()
    const winnerMode = 'floor'
    const looserMode = ['floor', 'ceil'][Math.floor(Math.random() * 2)]
    
    wounded.atk = this.attackers.soldiers.resize(woundedPercents.atk, this.result.win ? winnerMode : looserMode);
    wounded.def = this.defenders.soldiers.resize(woundedPercents.def, this.result.win ? looserMode : winnerMode);
    return wounded
  }

  _calcBrokenArtilleries() {
    const brokenArtilleries = {
      atk: [],
      def: []
    }

    if (this.result.raisedWhiteFlag)
      return brokenArtilleries

    const woundedPercents = this._calcWoundedPercent()
    
    const brokenPercents = modObj(woundedPercents, 0.75)
    const mode = ['floor', 'ceil'][Math.floor(Math.random() * 2)]
    
    this.attackers.artilleries.forEach(artillery => {
      brokenArtilleries.atk.push({
        name: artillery.name,
        quantity: Math[mode](artillery.quantity * (brokenPercents.atk / 100))
      })
    })

    this.defenders.artilleries.forEach(artillery => {
        brokenArtilleries.def.push({
          name: artillery.name,
          quantity: Math[mode](artillery.quantity * (brokenPercents.def / 100))
        })
    })    
    return brokenArtilleries
  }

  _opponentOf(w) {
    return w === this.attackers
      ? this.defenders
      : this.attackers
  }

  _calcScore(wave) {
    // Get counter penalties for this wave
    const penalties = wave === this.attackers 
      ? this.result.meta.counterPenalties.atk 
      : this.result.meta.counterPenalties.def
    
    // Calculate scores with localized counter penalties
    const soldiersScore = wave.getSoldiersScoreWithCounters(penalties)
    const artilleriesScore = wave.getArtilleriesScoreWithCounters(penalties)
    
    // Apply other modifiers (morale, IQ, luck) but NOT counter modifiers
    return (soldiersScore + artilleriesScore) * wave.cpModifier()
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
  
    return ((100 * atk) / def) - 100;
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
