import { processor } from "./helpers.js"


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

  move.retreat = retreat + categoryBonus[move.category];
}


export default processor([
    modifyPP,
    setRetreat,
])