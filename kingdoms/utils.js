import { SoldierStack } from "./war.js";


export const sumObj = (obj1, obj2) => {
  const obj = Object.assign({}, obj2)
  for (const key in obj1) {
    obj[key] = obj1[key] + (obj2[key] || 0)
  }
  return obj
}
  
export const modObj = (obj, mod) => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = obj[key] * mod
    return acc
  }, {})
}

export function calculateSize(baseSize, level) {
  return Math.round(baseSize * Math.pow(1.2, level - 1));
}

export function upgradePrice(basePrice, level, rate = 1.5) {
  return Math.round(basePrice * Math.pow(rate, level - 1));
}

export function calculatePeopleUsedLandArea(population, pci, taxRate) {
  const perPerson = (pci - (taxRate * pci)) * 0.0002;
  return population * perPerson
}

export function calculateBuildUsedLandArea(kingdom) {
  return kingdom.buildings.reduce((acc, build) => {
    return acc + calculateSize(build.baseSize, build.currentLevel) * build.quantity
  }, 0)
}

export function calcPopulation(kingdom) {
  return kingdom.landArea * kingdom.density;
}

export function calculateTax(kingdom) {
  const totalIncome = calcPopulation(kingdom) * kingdom.pci;
  return Math.floor(totalIncome * kingdom.taxRate);
}

export function calcSoldiersSalary(kingdom) {
  if (!kingdom?.barrack?.soldiers) return 0;

  return kingdom.barrack.soldiers.reduce((total, soldier) => {
    const soldierTotal = (soldier.quantity || 0) * (soldier.ivSalary || 0);
    return total + soldierTotal;
  }, 0);
}

export function calcAcademyCost(kingdom) {
  const level = kingdom.barrack.academyLevel
  return upgradePrice(30_000, level, 3);
}

export function calcBuildProduction(kingdom) {
  return kingdom.buildings.reduce((prod, build) => {
    return modObj(
      sumObj(prod, build.produces),
      build.quantity
    )
  }, {})
}

export function calcBuildConsumtion(kingdom) {
  return kingdom.buildings.reduce((prod, build) => {
    return modObj(
      sumObj(prod, build.consumes),
      build.quantity
    )
  }, {})
}

export function calcBuildNetProd(kingdom) {
  const prod = calcBuildProduction(kingdom)
  const cons = modObj(calcBuildConsumtion(kingdom), -1)
  return sumObj(prod, cons)
}

export function calcNetProd(kingdom, localize = false) {
  const sysProd = {
    coins: calculateTax(kingdom),
  }
  const sysCons = {
    coins: calcSoldiersSalary(kingdom) + calcAcademyCost(kingdom)
  }
  const buildProd = calcBuildNetProd(kingdom)
  const prod = sumObj(
    sumObj(sysProd, buildProd),
    modObj(sysCons, -1)
  )

  if (!localize) return prod
  return Object.keys(prod).reduce((acc, key) => {
    acc[key] = prod[key].toLocaleString()
    return acc
  }, {})
}


export function prepareDefenceSoldiers(kingdom, areaPercentage = 100) {
  return kingdom.defenceWaves.map((wave) => {
    const data = wave.soldiers.map((soldier) => {
      const { image, quantity: total } = kingdom.barrack.soldiers.find(
        (s) => s.image.id === soldier.image,
      );
      image.items = soldier.items;

      const quantity = Math.ceil(total * (soldier.percentage / 100));
      return [image, quantity];
    });
    return new SoldierStack(data).resize(areaPercentage);
  });
}
