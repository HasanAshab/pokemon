import { AttackWave, DefenseWave, SoldierStack, WAR_SYSTEMS } from "../../kingdoms/war.js";
import { Pokemon } from "./utils/models.js";

function assert(w1, w2, expectedWinner) {
  const com1 = {
    image: genin, // image means assume another genin the commander
    iq: {
      // 10 is max iq for any kind
      offensive: 3,
      defensive: 3,
    }
  }
  const com2 = {
    image: genin, // image means assume another student the commander
    iq: {
      // 10 is max iq for any kind
      offensive: 3,
      defensive: 3,
    }
  }

  let wave1 = new AttackWave(com1, new SoldierStack(w1), {luck: 1})

  let wave2 = new DefenseWave(com2, new SoldierStack(w2), {luck: 1})

  

  let war = new WAR_SYSTEMS["sabotage"](wave1, wave2)

  let actualWinner
  if (war.result.scores.atk === war.result.scores.def) {
    actualWinner = 0
  }
  else if (war.result.scores.atk > war.result.scores.def) {
    actualWinner = 1
  }
  else {
    actualWinner = 2
  }

  const assertResult = actualWinner === expectedWinner
  
  const getSTR = (w1) => w1.map(([p, q]) => `${q}${p.id.charAt(0).toUpperCase()}`).join(', ')
  console.log(`${assertResult ? "PASS" : "FAIL"}: ${getSTR(w1)} vs ${getSTR(w2)} : ${actualWinner}`);
  console.log(war.result.scores.atk, war.result.scores.def)
  // console.log(war.comments())
  console.log('');
}



let rookie = new Pokemon("rookie", {
    "xp": 1000,
    // "items": ["ironarmor"]
})

let genin = new Pokemon("genin", {
    "xp": 2000,
})

let chunin = new Pokemon("chunin", {
    "xp": 3000,
})


assert(
[
  [genin, 1]
],
[
  [rookie, 3]
],
0
)

assert(
[
  [chunin, 1]
],
[
  [genin, 3]
],
0
)

assert(
[
  [chunin, 1]
],
[
  [rookie, 7]
],
0
)

assert(
[
  [chunin, 1],
  [rookie, 2]
],
[
  [rookie, 9]
],
1
)

assert(
[
  [genin, 2]
],
[
  [rookie, 7]
],
0
)

