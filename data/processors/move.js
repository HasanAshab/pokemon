import { processor, setKeyIfNotExists } from "./helpers.js"

function isTwoTurnMove(move) {
    let isTwoTurn = false
    const attacker = {
        removeVolatile() {
            return false
        },
        addVolatile(name) {
            isTwoTurn = name === "twoturnmove"
        },
        hasType() {},
    }
   try {
   move.onTryMove?.(attacker, null, {})
   } catch (e){console.log(e)}
   return isTwoTurn
}

function mergeDefault(move) {
    const defaultProps = {
        add: (...args) => null, // todo
        debug: console.log,
        runEvent: () => true, //todo
        dex: {
            conditions: {
                get: () => null
            }
        },
        onAfterMove(pokemon, target, move) {
            move.heal && pokemon.state.increaseHealth(pokemon.maxhp * move.healRate())
        }
    }
    Object.assign(move, defaultProps, move)
}

function addFlags(move) {
    const flags = move.flags
    
    setKeyIfNotExists(flags, "offensive", 1)
    isTwoTurnMove(move) && setKeyIfNotExists(flags, "twoturn", 1)
}

function modifyPP(move) {
    if (![null, undefined].includes(move.pp)) {
      move.pp = Math.round(move.pp / 3) || 1;
    }
}

function setEffects(move) {
    if ("effects" in move) return

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
    if ("volatileStatus" in move) {
        move.target === "self"
            ? move.effects.self.push({
                name: move.volatileStatus,
                chance: 100,
                isVolatile: true
            })  
            : move.effects.target.push({
                name: move.volatileStatus,
                chance: 100,
                isVolatile: true
            });
    }
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
    
    move.stallingMove && move.effects.self.push({
        name: "stall",
        chance: 65,
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
    const retreats = [
    0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0,
    2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0,
    4.2, 4.4, 4.6, 4.8, 5.0, 5.2
  ];
  
  const thresholds = [
    0, 10, 20, 30, 40, 50, 60, 70, 80, 90,
    100, 110, 120, 130, 140, 150, 160, 170, 180, 190,
    200, 210, 220, 230, 240, 250
  ];
  let retreat;
  const adjustToClosestRetreat = num => {
    return retreats.reduce((prev, curr) => 
        Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    )
  }
  
  if(move.category === "Status") {
      retreat = 0.4
  }
  else {
    for (let i = 0; i < thresholds.length; i++) {
        if (move.basePower <= thresholds[i]) {
          retreat = retreats[i];
          break;
        }
    }
  }

  if (move.stallingMove) {
      retreat += 0.2
  }

  const selfStatEffectBonus = Object.keys(move.statChanges.target).reduce((acc, stat) => {
      return acc - move.statChanges.target[stat]
  }, 0)

  const targetStatEffectBonus = Object.keys(move.statChanges.self).reduce((acc, stat) => {
      return acc + move.statChanges.self[stat]
  }, 0)
  
  const critRatioBonus = move.critRatio > 1 
    ? move.critRatio * 0.2
    : 0
    
  const targetBonus = move.target.startsWith("allAdjacent")
    ? 0.2
    : 0

  const multiplier = (
      move.effects.target.length
      - move.effects.self.length
      + selfStatEffectBonus
      + targetStatEffectBonus
      + critRatioBonus
  )
  retreat += 0.2 * multiplier
  
  if("multihit" in move) {
      const avgHits = Array.isArray(move.multihit)
        ? (move.multihit[0] + move.multihit[1]) / 2
        : move.multihit
      retreat += 0.2 * avgHits
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

  if (move.accuracy === true) {
    retreat += 0.2
  }
    
  retreat = adjustToClosestRetreat(retreat)

  // we failed to detect its speciality
  if (retreat <= 0.4 && move.category !== "Status") {
      retreat = retreats[5]
  }
  
  move.retreat = retreat
}


function modifyAccuracy(move) {
    if (move.accuracy === true) return
    else if (move.flags.twoturn) {
        move.accuracy -= move.accuracy * 0.30
    }
    else if (move.category === "Status") {
        move.accuracy -= move.accuracy * 0.15
    }
}

export default processor([
    mergeDefault,
    addFlags,
    modifyPP,
    setEffects,
    setStatChanges,
    setRetreat,
    modifyAccuracy,
])