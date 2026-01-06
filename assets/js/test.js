import { AttackWave, DefenseWave, SoldierStack, WAR_SYSTEMS } from "../../kingdoms/war.js";
import { Pokemon } from "./utils/models.js";

function assert(w1, w2, expectedWinner, art1 = [], art2 = []) {
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

  let wave1 = new AttackWave(com1, new SoldierStack(w1), {luck: 1}, art1)

  let wave2 = new DefenseWave(com2, new SoldierStack(w2), {luck: 1}, art2)

  

  let war = new WAR_SYSTEMS["sabotage"](wave1, wave2)

  war.result.scores.atk = Math.round(war.result.scores.atk)
  war.result.scores.def = Math.round(war.result.scores.def)

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
  console[assertResult ? "log" : "warn"](`${assertResult ? "PASS" : "FAIL"}: ${getSTR(w1)} vs ${getSTR(w2)} : ${expectedWinner} -> ${actualWinner}`);
  console.log(war.result.scores.atk, war.result.scores.def)
  // console.log(war.comments())
  console.log("score diff", war.scoreDiffPercent())
  console.log(`Wounded Units:
          Attacker:
          ${war.result.wounded.atk.reduce((str, [k, v]) => str += `${k.id}: ${v}`, "")}
          Defender:
          ${war.result.wounded.def.reduce((str, [k, v]) => str += `${k.id}: ${v}`, "")}
       `);
  console.log('');
}



let rookie = new Pokemon("rookie", {
    "xp": 1000,
    "items": []
})

let genin = new Pokemon("genin", {
    "xp": 2000,
    // "items": ["ninjablade"]
})

let chunin = new Pokemon("chunin", {
    "xp": 3000,
})

let elchunin = new Pokemon("elitechunin", {
    "xp": 4000,
})
let jonin = new Pokemon("jonin", {
    "xp": 5000,
})


// assert(
// [
//   [genin, 1]
// ],
// [
//   // [rookie, 4]
// ],
// 0,
// [],
// [{
//       name: "test",
//       defence: 399,
//       quantity: 1,
// }]
// )

assert(
[
  [genin, 5]
],
[
  [chunin, 2]
],
0
)

assert(
[
  [chunin, 2]
],
[
  [genin, 10]
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
  [jonin, 1]
],
[
  [elchunin, 3]
],
0
)

assert(
[
  [genin, 1]
],
[
  [rookie, 6]
],
0
)

// assert(
// [
//   [genin, 1]
// ],
// [
//   [new Pokemon("laimonk"), 1]
// ],
// 0
// )
