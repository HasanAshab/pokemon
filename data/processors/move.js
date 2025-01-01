import { processor } from "./helpers.js"
import { MOVE_CTX } from "../../assets/js/utils/ctx.js"


function mergeDefault(move) {
    const defaultProps = {
        onAfterMove(pokemon, target, move) {
            move.heal && this.heal(pokemon.maxhp * move.healRate(), pokemon)
        }
    }
    Object.assign(move, defaultProps, move)
}

function modifyPP(move) {
    if (![null, undefined].includes(move.pp)) {
      move.pp = Math.round(move.pp / 3) || 1;
    }
}

function setOffensiveness(move) {
    if ("isOffensive" in move) return
    move.isOffensive = true
}

function setEffects(move) {
    move.effects = {
        self: [],
        target: []
    }
    
    move.self?.status && move.effects.self.push({
        name: move.self.status,
        chance: move.self.chance ?? 100,
        isVolatile: false
    })
    move.self?.volatileStatus && move.effects.self.push({
        name: move.self.volatileStatus,
        chance: move.self.chance ?? 100,
        isVolatile: true
    })

    move.status && move.effects.target.push({
        name: move.status,
        chance: 100,
        isVolatile: false
    })
    move.volatileStatus && move.effects.target.push({
        name: move.volatileStatus,
        chance: 100,
        isVolatile: true
    })

    move.secondary?.status && move.effects.target.push({
        name: move.secondary.status,
        chance: move.secondary.chance ?? 100,
        isVolatile: false
    })
    move.secondary?.volatileStatus && move.effects.target.push({
        name: move.secondary.volatileStatus,
        chance: move.secondary.chance ?? 100,
        isVolatile: true
    })
    move.secondaries?.forEach(secondary => {
        secondary.status && move.effects.target.push({
            name: secondary.status,
            chance: secondary.chance ?? 100,
            isVolatile: false
        })
        secondary.volatileStatus && move.effects.target.push({
            name: secondary.volatileStatus,
            chance: secondary.chance ?? 100,
            isVolatile: true
        })
    })
    
    move.stallingMove && move.effects.target.push({
        name: "stall",
        chance: 80,
        isVolatile: true
    })
}

function setStatChanges(move) {
    move.statChanges = {
        chance: 100,
        self: {},
        target: {}
    }
    if (move.category === "Status" && move.boosts) {
        if (move.target === "self")
            move.statChanges.self = move.boosts
        else
            move.statChanges.target = move.boosts
    }
    else if (move.self?.boosts) {
        move.statChanges.self = move.self.boosts
    }
    else if(move.secondary?.boosts) {
        move.statChanges.chance = move.secondary.chance ?? 100
        move.statChanges.target = move.secondary.boosts
    }
    else if(move.secondary?.self?.boosts) {
        move.statChanges.chance = move.secondary.chance ?? 100
        move.statChanges.self = move.secondary.self.boosts
    }
    
    else if(move.secondaries) {
        move.secondaries.forEach(secondary => {
            if (!secondary.boosts) return
            move.statChanges.chance = secondary.chance ?? 100
            move.statChanges.target = secondary.boosts
        })
    }
}

function setRetreat(move) {
  if("retreat" in move) return
  const retreats = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.5, 6];
  const thresholds = [0, 10, 20, 30, 50, 60, 70, 80, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250];
  let retreat;
  
  const adjustToClosestRetreat = num => {
    return retreats.reduce((prev, curr) => 
        Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    )
  }

  for (let i = 0; i < thresholds.length; i++) {
      if (move.basePower <= thresholds[i]) {
        retreat = retreats[i];
        break;
      }
  }
  
  if(move.category === "Status") {
      retreat = 0.25
  }

  if (move.stallingMove) {
      retreat += 0.25
  }

  const selfStatEffectBonus = Object.keys(move.statChanges.target).reduce((acc, stat) => {
      return acc - move.statChanges.target[stat]
  }, 0)

  const targetStatEffectBonus = Object.keys(move.statChanges.self).reduce((acc, stat) => {
      return acc + move.statChanges.self[stat]
  }, 0)

  const multiplier = (
      move.effects.target.length
      - move.effects.self.length
      + selfStatEffectBonus
      + targetStatEffectBonus
  )
  retreat += 0.25 * multiplier
  
  if("multihit" in move) {
      const avgHits = Array.isArray(move.multihit)
        ? (move.multihit[0] + move.multihit[1]) / 2
        : move.multihit
      retreat += 0.25 * avgHits
  }
  
  if ("heal" in move) {
      retreat += 3 * (move.heal[0] / move.heal[1])
  }

  if ("drain" in move) {
      retreat += 1.05 * (move.drain[0] / move.drain[1])
  }

  if ("recoil" in move) {
      retreat -= 2 * (move.recoil[0] / move.recoil[1])
  }
  
  retreat = adjustToClosestRetreat(retreat)
  
  if (retreat <= 0.50 && move.category !== "Status") {
      // we failed to detect its speciality
      retreat = retreats[3]
  }
  
  move.retreat = retreat
}

function setCustomCTX(move) {
  for (const key of Object.keys(move)) {
    if (typeof move[key] === 'function') {
      move[key] = move[key].bind(MOVE_CTX);
    }
  }
}

export default processor([
    mergeDefault,
    modifyPP,
    setOffensiveness,
    setEffects,
    setStatChanges,
    setRetreat,
    setCustomCTX,
])