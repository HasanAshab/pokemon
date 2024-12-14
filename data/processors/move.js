import { processor } from "./helpers.js"

function setEffects(move) {
    move.effects = []
    if (move.category === "Status" && move.status) {
        move.effects.push({
            name: move.status,
            chance: 100
        })
    }
    if(move.secondary?.status) {
        move.effects.push({
            name: move.secondary.status,
            chance: move.secondary.chance ?? 100
        })
    }
    if(move.secondaries) {
        move.secondaries.forEach(secondary => {
            secondary.status && move.effects.push({
                name: secondary.status,
                chance: secondary.chance ?? 100
            })
        })
    }
}

function modifyPP(move) {
    if (![null, undefined].includes(move.pp)) {
      move.pp = Math.round(move.pp / 3) || 1;
    }
}

function setRetreat(move) {
  if(move.retreat) return
  const categoryBonus = {
    Special: 0,
    Physical: 0,
    Status: -0.5,
    None: 0, 
  };

  const retreats = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
  const thresholds = [20, 50, 70, 110, 130, 150, 170, 190, 210, 230, 250, 250];
  
  let power = move.basePower;
  let retreat;

  if ([undefined, null].includes(power)) {
    retreat = retreats[2];
  } else {
    for (let i = 0; i < thresholds.length; i++) {
      if (power <= thresholds[i]) {
        retreat = retreats[i];
        break;
      }
    }
  }
  retreat = retreat + categoryBonus[move.category];
  
  if (move.category !== "Status" && move.secondary)
    retreat += 0.5
  
  if (move.secondaries)
    retreat += 0.5 * move.secondaries.length    
  
  move.retreat = Math.max(retreat, 0.5)
}


export default processor([
    setEffects,
    modifyPP,
    setRetreat,
])