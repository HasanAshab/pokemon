import { AttackWave, DefenseWave, SoldierStack, WAR_SYSTEMS } from "../../kingdoms/war.js";
import { Pokemon } from "./utils/models.js";


let student = new Pokemon("student", {
    "xp": 500,
    // "items": ["ironarmor"]
})

let rookie = new Pokemon("rookie", {
    "xp": 1000,
    // "items": ["ironarmor"]
})

let genin = new Pokemon("genin", {
    "xp": 2000,
})

const com1 = {
  image: genin, // image means assume another genin the commander
  iq: {
    // 10 is max iq for any kind
    offensive: 3,
    defensive: 1.5,
  }
}
const com2 = {
  image: genin, // image means assume another student the commander
  iq: {
    // 10 is max iq for any kind
    offensive: 1,
    defensive: 3,
  }
}

let wave1 = new AttackWave(com1, new SoldierStack([
  [genin, 2],
]), {luck: 1})

let wave2 = new DefenseWave(com2, new SoldierStack([
  [rookie, 3],
  [genin, 1],
]), {luck: 1},)


let war = new WAR_SYSTEMS["sabotage"](wave1, wave2)
console.log(war.result.scores.atk, war.result.scores.def)
// console.log(war.comments())