import { processor, setKeyIfNotExists } from "./helpers.js"


function generalizeTarget(move) {
  const targetMapping = {
    "self": "self",

    "normal": "normal",
    "any": "normal",
    "scripted": "normal",
    "adjacentFoe": "normal",
    "randomNormal": "normal",

    "allAdjacent": "allAdjacent",
    "all": "allAdjacent",
    
    "allySide": "allySide",
    "adjacentAllyOrSelf": "allySide",
    "allyTeam": "allySide",
    "adjacentAlly": "allySide",
    "allies": "allySide",
    
    "foeSide": "foeSide",
    "allAdjacentFoes": "foeSide",
  }  
  move.target = targetMapping[move.target]
}

function handleComboMoves(move, id) {  
  if (!move.flags.combo) return
  move.basePowerCallback = function(pokemon, target) {
    const pastFiveMoves = pokemon.state._data.movesHistory.filter(m => m !== "staythere").slice(-4)
    let hitCount = 0
    for (let i = pastFiveMoves.length - 1; i >= 0; i--) {
      if (pastFiveMoves[i] !== id) break
      hitCount++
    }

    return move.basePower * Math.pow(2, hitCount)
  };
  delete move.onAfterMove
}


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
   } catch (e){}
   return isTwoTurn
}

function mergeDefault(move) {
    const defaultProps = {
        tokenChanges: {},
        multihit: 1,
        canUse(pokemon) {
            return true
        },
        onAfterMove(pokemon, target, move) {            
            if ('heal' in move) {
                let healTarget
                if (move.target === "normal")
                    healTarget = pokemon
                else if (move.target === "allySide" && pokemon.state.isAlly(target))
                    healTarget = target
                else if (move.target === "allySide" && pokemon.state.isFoe(target))
                    healTarget = pokemon
                else if (move.target === "foeSide" && pokemon.state.isFoe(target))
                    healTarget = target

                healTarget?.state.increaseHealth(healTarget.maxhp * move.healRate())
            }
            if ('healTarget' in move) {
                target.state.increaseHealth(target.maxhp * move.targetHealRate())
            }

            move.selfdestruct === "ifHit" && pokemon.state.decreaseHealth(pokemon.hp, true)
        },
        finally(pokemon, target, move) {
            move.selfdestruct === "always" && pokemon.state.decreaseHealth(pokemon.hp, true)
        },
    }
    
    for (const key in defaultProps) {
      if (key in move) continue
      else move[key] = defaultProps[key]
    }
}

function bindMethods(move) {
    const exclude = ["onBeforeMove"]
    const ctx = {
        add: (...args) => null, // todo
        debug: console.log,
        runEvent: () => true, //todo
        dex: {
            conditions: {
                get: () => null
            }
        },
        tokenChanges: {},
        onAfterMove(pokemon, target, move) {
            move.heal && pokemon.state.increaseHealth(pokemon.maxhp * move.healRate())
        },
        damage(amount, target) {
          target.state.decreaseHealth(amount)
        }
    }
    
    for (const key in move) {
      if (typeof move[key] !== "function" || exclude.includes(key)) continue
      else move[key] = move[key].bind(ctx)
    }
}

function addFlags(move) {
    const flags = move.flags

    setKeyIfNotExists(flags, "offensive", 1)
    isTwoTurnMove(move) && setKeyIfNotExists(flags, "twoturn", 1)

    
    if (move.stallingMove) {      
        flags.stall = 1
        flags.offensive = 0
    }
}

function modifyPP(move) {
    if (![null, undefined].includes(move.pp)) {
      move.pp = move.flags.combo ? 5 : Math.round(move.pp / 6) || 1;
    }

    // TEMP
    if (move.flags.weapon) {
      move.pp = 9
    }

    if (move.isOneTime) {
      move.pp = 1
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
        chance: move.stallingChance ?? 65,
        isVolatile: true
    })
}

function setStatChanges(move) {
    if ("statChanges" in move) return

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
    0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0,
    5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0,
    10.5, 11.0, 11.5, 12.0, 12.5, 13.0
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
      retreat = 1
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
      retreat += 1
  }
  
  
  const statEffectChanceMod = (move.statChanges.chance / 100)

  const selfStatEffectBonus = statEffectChanceMod * Object.keys(move.statChanges.target).reduce((acc, stat) => {
      return acc - move.statChanges.target[stat]
  }, 0)

  const targetStatEffectBonus = statEffectChanceMod * Object.keys(move.statChanges.self).reduce((acc, stat) => {
      return acc + move.statChanges.self[stat]
  }, 0) 
  

  const critRatioBonus = move.critRatio > 1 
    ? move.critRatio * 0.5
    : 0

  let multiplier = (
      move.effects.target.length
  //  - move.effects.self.length
      + selfStatEffectBonus
      + targetStatEffectBonus
      + critRatioBonus
  )
  if (move.category === "Status" && move.target === "foeSide")
      multiplier += 2
  if (move.category === "Status" && move.target === "allAdjacent")
      multiplier += 1.5

  retreat += 0.5 * multiplier
  
  if("multihit" in move) {
      const avgHits = Array.isArray(move.multihit)
        ? (move.multihit[0] + move.multihit[1]) / 2
        : move.multihit
      retreat += 0.5 * avgHits
  }

  if ("heal" in move) {
      retreat += 4 * (move.heal[0] / move.heal[1])
  }

  if ("drain" in move) {
      retreat += 1.5 * (move.drain[0] / move.drain[1])
  }

  if ("recoil" in move) {
      retreat -= 3 * (move.recoil[0] / move.recoil[1])
  }

  if (move.accuracy === true) {
    retreat += 0.5
  }
    
//   retreat = adjustToClosestRetreat(retreat)

  // we failed to detect its speciality
  if (retreat <= 1 && move.category !== "Status") {
      retreat = retreats[5]
  }

  move.retreat = retreat + (move.retreatBonus || 0)
}

function setCapacity(move) {
  if ("capacity" in move) return

  const multiTarget = ["allAdjacent", "allySide", "foeSide"]

  if (!multiTarget.includes(move.target))
      return move.capacity = 1

  move.basePower = Math.round(move.basePower * 0.66668)
  
  move.capacity = move.category === "Status" ? Infinity : Math.max(Math.round(move.basePower / 10), 2)
}

function modifyAccuracy(move) {
    if (move.accuracy === true) return 
    if (move.category === "Status") {
        move.accuracy -= Math.round(move.accuracy * 0.10)
    }
}

function addKoHandler(move) {
  const cb = move.basePowerCallback
  move.basePowerCallback = function(pokemon, target) {
    const bp = cb ? cb(...arguments) : move.basePower;

    const levelDiff = pokemon.level - target.level;

    // Sigmoid centered at 0, returns values between ~0.0067 and ~0.993
    const baseSigmoid = 1 / (1 + Math.exp(-0.4 * levelDiff));

    // Map sigmoid output (~0.0067–0.993) to range ~0.005–1
    const koChance = baseSigmoid * 0.95 + 0.005;

    const finalChance = Math.min(1, koChance * (move.koRatio ?? 0)) - 0.05;
    
    finalChance > 0 && console.log(`${move.name} KO chance: ${finalChance}`);
    
    return Math.random() < finalChance ? Infinity : bp;
  };
}

export default processor([
    generalizeTarget,
    handleComboMoves,
    mergeDefault,
    bindMethods,
    addFlags,
    modifyPP,
    setEffects,
    setStatChanges,
    setRetreat,
    setCapacity,
    modifyAccuracy,
    addKoHandler,
])