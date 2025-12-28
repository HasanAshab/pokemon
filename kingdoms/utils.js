import { getItemsOfType } from "../assets/js/utils/dom.js";
import { Pokemon } from "../assets/js/utils/models.js";
import humans from "../data/humans.js";
import { SoldierStack } from "./war.js";

export function foo (size,kingdom){

}
export function getPopulation(kingdom) {
  return kingdom.landArea * kingdom.density;
}

export function calculateBirthCount(kingdom) {
  const population = getPopulation(kingdom)
  const annualBirths = population * (kingdom.birthRate ?? 0.02);
  return Math.round(annualBirths)
  return Math.floor(annualBirths / 12);
}

export function getPopulationGrowth(kingdom){
  return calculateBirthCount(kingdom) - getTotalDeathCount(kingdom)
}

export function getTotalDeathCount(kingdom){
  return getDiedForAge(kingdom)
    + getDiedForHospital(kingdom)
    + getDiedForSecurity(kingdom)
}

export function getDiedForAge(kingdom) {
  const population = getPopulation(kingdom);
  const deathRatePer1000 = 5; // realistic average
  const annualDeaths = (population * deathRatePer1000) / 1000;
  return Math.round(annualDeaths)
  return Math.floor(annualDeaths / 12);
}

export function getDiedForHospital(kingdom) {
  const population = getPopulation(kingdom);
  const doctorsCount = getStorage(kingdom).doctor || 0;
  const target = 0.05343511450381679;
  const ratio = doctorsCount / population;

  // Otherwise, calculate deaths normally
  const deathRate = (1 - (ratio / target)) * 0.039;
  
  const annualDeaths = population * deathRate;
  return Math.max(0, Math.round(annualDeaths))

  const monthlyDeaths = Math.floor(annualDeaths / 12);  
  return monthlyDeaths;
}


export function getDiedForSecurity(kingdom) {
  const securityRate = getTotalSecurityRate(kingdom)
  const deathRate = (1 - (securityRate / 100)) * 0.05
  const death = Math.round(getPopulation(kingdom) * deathRate)
  return death
}

export function getTotalSecurityRate(kingdom){
  return Math.min(
      getSecurityRate(kingdom, "polices")
    + getSecurityRate(kingdom, "soldiers")
  , 100)
}

export function getSecurityRate(kingdom, forceType){
  const target = 15.35671;
  const might = (getMight(kingdom, forceType, "day")
    + getMight(kingdom, forceType, "night")) / 2
  const ratio = might / getPopulation(kingdom)  
  const closeness = (ratio / target) * 100;
  return Number(closeness.toFixed(2))
}

export function getMight(kingdom, forceType, shift) {
  const soldiers = kingdom.barrack[forceType]?.[shift]
  if (!soldiers) return 0
  const stack = new SoldierStack(soldiers.map(s => [s.image, s.quantity]))
  if (stack.cp() === 0) return 0

  const forceTypeMod = forceType === "soldiers" ? 0.08 : 1
  const countMod = (stack.cp() / stack.count()) * 0.006
  const imbalanceMod = Math.min(1, (1 - (getForceImbalanceRate(kingdom, forceType, shift) / 100) + 0.005) * 1.005)
  const might = stack.cp() * forceTypeMod * countMod * imbalanceMod
  return might
}

export function calculateLandPrice(
  area,       // want land area (km²)
  kingdom,
  method,
  quality = 5,
  k = 2       // balancing factor
) {
  // Clamp quality to valid range
  quality = Math.min(9, Math.max(1, quality));

  const landArea = kingdom.landArea;
  const density = kingdom.density;
  const population = landArea * density;
  const perCapitaIncome = kingdom.pci;
  const taxRate = kingdom.taxRate;

  const totalUsedLand =
    calculateBuildUsedLandArea(kingdom) +
    calculatePeopleUsedLandArea(population, perCapitaIncome, taxRate);

  const freeLandArea = Math.max(landArea - totalUsedLand, 1); // avoid infinity
  const densityMod = Math.pow(density * 3.2, 2);

  // Step 1: Base price from PCI
  let basePrice = perCapitaIncome * k * densityMod;

  // Step 2: Adjust for density
  let adjustedPrice = basePrice * ((1 + density) * 0.5);

  // Step 3: Adjust for tax (lower tax → higher price)
  let afterTaxPrice = adjustedPrice * (1 - taxRate);

  // Step 4: Scarcity factor
  let scarcityFactor = landArea / freeLandArea;

  // Step 5: Quality scaling (power-based, centered at 5)
  const qualityMultiplier = Math.pow(2, (quality - 5) / 2);

  let finalPrice =
    area *
    afterTaxPrice *
    scarcityFactor *
    qualityMultiplier;

  
  if (method === "rent")
    finalPrice /= 24;

  return Math.round(finalPrice);
}


export function saveKingdoms(kingdoms) {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
}

export const soldiersAcademy = {
  getDefaultData:  function getDefaultData(){
  const data = {}
  for (const key in humans ){
       data[key] = 0
   }
  return data
},
  getSoldierCost: function(lvl,index){
  return lvl <= 0 ? 0 : 1000 * lvl * Math.pow(index,2)
  },
  getAcademyCost: function(kingdom){
    const academyData = kingdom.barrack.academyData
   let cost = 0
  let index = 1
  for (const key in academyData){
    const lvl = academyData[key]
   cost += this.getSoldierCost(lvl,index++)
  }
  return cost
  },
  isRankValid: function(rankNum,soldierslist){
    const ranksIdMap = new Map()
    for (const key in humans){
      ranksIdMap.set(humans[key].num,key)
    }    
    // console.log(kingdom.barrack.soldiers[type]);
    
    //  let senseiRankImage = null
    //  for (const key in humans){
    //    if (humans[key].num === rankNum + 1){
    //      senseiRankImage = humans[key]
    //      break;
    //    }
    //  }
     
    
    //  console.log(kingdom.barrack.soldiers[type]);
    
    //  for (const soldier of kingdom.barrack.soldiers[type]){
    //   console.log(soldier.id);
      
    //  }

  }
}

export const sumObj = (obj1, obj2) => {
  const obj = Object.assign({}, obj2);
  for (const key in obj1) {
    obj[key] = obj1[key] + (obj2[key] || 0);
  }
  return obj;
};

export const sumMap = (map1, map2) => {
  const result = new map2.constructor(map2);

  for (const [key, value] of map1) {
    result.set(key, value + (map2.get(key) || 0));
  }

  return result;
};

export const calculateBuildDefenceScore = (kingdom, areaPercentage) => {
  const buildDefence = (getStorage(kingdom).defence || 0) * (areaPercentage / 100);
  return buildDefence;
}


export const modObj = (obj, mod) => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = obj[key] * mod;
    return acc;
  }, {});
};

export const modMap = (map, mod) => {
  const result = new Map();

  for (const [key, value] of map) {
    result.set(key, value * mod);
  }

  return result;
};

export function calculateSize(baseSize, level) {
  return Math.round(baseSize * Math.pow(1.2, level - 1));
}

export function calculateMaintains(baseMaintains, level) {
  const maintains = {};
  for (const item in baseMaintains) {
      const amount = baseMaintains[item] * Math.pow(1.5, level - 1)

      maintains[item] = amount > 10
        ? Math.round(amount)
        : parseFloat(amount.toFixed(2));      
  }
  return maintains
}

export function upgradePrice(basePrice, level, rate = 1.5) {
  return Math.round(basePrice * Math.pow(rate, level - 1));
}

export function calculatePeopleUsedLandArea(population, pci, taxRate) {
  const perPerson = (pci - (taxRate * pci)) * 0.00002;
  return population * perPerson;
}

export function calculateBuildUsedLandArea(kingdom) {
  return kingdom.buildings.reduce((acc, build) => {
    return (
      acc + calculateSize(build.baseSize, build.currentLevel) * build.quantity
    );
  }, 0);
}

export function calcPopulation(kingdom) {
  return kingdom.landArea * kingdom.density;
}

export function calculateTax(kingdom) {
  const totalIncome = calcPopulation(kingdom) * kingdom.pci;
  return Math.floor(totalIncome * kingdom.taxRate);
}

export function calcCommandersSalary(kingdom) {
  if (!kingdom?.commanders) return 0;
  const actualSalary = Object.entries(kingdom.commanders).reduce((total, [_, commander]) => {
    return total + commander.salary;
  }, 0);
  const warMod = kingdom.underWar ? 2 : 1;
  return actualSalary * warMod;
}

export function calcSoldiersSalary(kingdom, type) {
  if (!kingdom?.barrack?.soldiers) return 0;

  if (type) {
    return kingdom.barrack.soldiers[type].reduce((total, soldier) => {
      const ivSalary = kingdom.pci * (soldier.ivSalaryPercent || 0) / 100;
      const soldierTotal = (soldier.quantity || 0) * (ivSalary || 0);
      return total + soldierTotal;
    }, 0);
  }
  return (
    calcSoldiersSalary(kingdom, "day") +
    calcSoldiersSalary(kingdom, "night") +
    calcSoldiersSalary(kingdom, "emergency")
  );
}

export function calcPoliceSalary(kingdom, type) {
  if (!kingdom?.barrack?.polices) return 0;

  if (type) {
    return kingdom.barrack.polices[type].reduce((total, soldier) => {
      const ivSalary = kingdom.pci * (soldier.ivSalaryPercent || 0) / 100;
      const soldierTotal = (soldier.quantity || 0) * (ivSalary || 0);
      return total + soldierTotal;
    }, 0);
  }
  return (
    calcPoliceSalary(kingdom, "day") +
    calcPoliceSalary(kingdom, "night")
  );
}

export function getEnabledBuildings(kingdom) {
  return kingdom.buildings.filter((build) => build.state === "enabled");
}

export function getHospitalCapacity(kingdom) {
  const reviveCapacity = getStorage(kingdom).revive || 0;
  return Math.floor(reviveCapacity);
}

export function calcBuildProduction(kingdom) {
  return getEnabledBuildings(kingdom).reduce((prod, build) => {
    return sumObj(prod, modObj(build.produces, build.quantity));
  }, {});
}

export function calcBuildConsumtion(kingdom) {
  return getEnabledBuildings(kingdom).reduce((cons, build) => {   
    return sumObj(cons, modObj(build.consumes, build.quantity));
  }, {});
}

export function calcBuildNetProd(kingdom) {
  const prod = calcBuildProduction(kingdom);  
  const cons = modObj(calcBuildConsumtion(kingdom), -1);  
  return sumObj(prod, cons);
}

export function getMaintainedStorage(kingdom) {
  return getEnabledBuildings(kingdom).reduce((acc, build) => {
    const maintains = build.baseMaintains
      ? calculateMaintains(build.baseMaintains, build.currentLevel)
      : {};
    return sumObj(acc, modObj(maintains, build.quantity));
  }, {});  
}

export function getStorage(kingdom) {
  const buildMaintains = getMaintainedStorage(kingdom);
  return sumObj(buildMaintains, kingdom.storage);
}


export function getTransLogs(kingdom, itemName) {
  const logs = [];

  if (itemName === "coins") {
    logs.push(`TAX &#x2192; <span style="color: green; font-weight: bold">${calculateTax(kingdom).toLocaleString()}</span>`);
    logs.push(`Land Tax &#x2192; <span style="color: green; font-weight: bold">${calcLandTax(kingdom).toLocaleString()}</span>`);
    logs.push(`Rented Land &#x2190; <span style="color: red; font-weight: bold">${calcLandRent(kingdom).toLocaleString()}</span>`);
    logs.push(`Military Ammo &#x2190; <span style="color: red; font-weight: bold">${calcAmmoCost(kingdom).toLocaleString()}</span>`);
    logs.push(`Commanders Salary &#x2190; <span style="color: red; font-weight: bold">${calcCommandersSalary(kingdom).toLocaleString()}</span>`);
    logs.push(`Soldiers Salary &#x2190; <span style="color: red; font-weight: bold">${calcSoldiersSalary(kingdom).toLocaleString()}</span>`);
    logs.push(`Police Salary &#x2190; <span style="color: red; font-weight: bold">${calcPoliceSalary(kingdom).toLocaleString()}</span>`);
  }

  getEnabledBuildings(kingdom).forEach(build => {
    if (build.produces[itemName]) {
      const q = build.produces[itemName] * build.quantity
      logs.push(`${build.name} &#x2192; <span style="color: green; font-weight: bold">+${q.toLocaleString()}</span>`);
    }
    if (build.consumes[itemName]) {
      const q = build.consumes[itemName] * build.quantity
      logs.push(`${build.name} &#x2190; <span style="color: red; font-weight: bold">-${q.toLocaleString()}</span>`);
    }
  });
  return logs;
}

export function calcLandTax(kingdom) {
  return kingdom.buildings
    .filter(build => build.ownedBy !== kingdom.id)
    .filter(build => build.property === "rent")
    .reduce((total, build) => {
      const size = calculateSize(build.baseSize, build.currentLevel) * build.quantity
      const rent = calculateLandPrice(size, kingdom, "rent");
      return total + rent;
    }, 0)
}

export function calcLandRent(kingdom) {  
  const kingdoms = Object.values(JSON.parse(localStorage.getItem("kingdoms")));
  return kingdoms
    .filter(k => k.id !== kingdom.id)
    .reduce((cost, k) => {
      return cost + k.buildings
        .filter(build => build.ownedBy === kingdom.id)
        .filter(build => build.property === "rent")
        .reduce((total, build) => {
          const size = calculateSize(build.baseSize, build.currentLevel) * build.quantity
          const rent = calculateLandPrice(size, k, "rent");
          return total + rent;
        }, 0)
  }, 0)
}

export function getAmmoWithQuantity(kingdom){  
  const calcAmmoOfShift = (shift) => kingdom.barrack.soldiers[shift].reduce((acc, s) => {
    if (!s.image.items) return acc
    const itemsWithQuantity = Object.fromEntries(s.image.items.map(key => [key, s.quantity]));    
    return sumObj(acc, itemsWithQuantity)
  }, {})

  return Object.keys(kingdom.barrack.soldiers).reduce((acc, shift) => sumObj(acc, calcAmmoOfShift(shift)), {})
}

export function calcAmmoCost(kingdom) {
  const ammo = getAmmoWithQuantity(kingdom);  
  return Object.keys(ammo).reduce((acc, key) => {
    const basePrice = kingdom.barrack.ammo[key]
    const actualCost = basePrice + (basePrice * (kingdom.barrack.ammoPriceChange / 100))
    return acc + (ammo[key] * actualCost)
  }, 0)
}

export function calcNetProd(kingdom, localize = false) {  
  const sysProd = {
    coins: calcLandTax(kingdom) + calculateTax(kingdom),
  };
  const sysCons = {
    coins:
      calcLandRent(kingdom) +
      calcSoldiersSalary(kingdom) +
      calcPoliceSalary(kingdom) +
      calcAmmoCost(kingdom) +
      calcCommandersSalary(kingdom),
  };
  
  const buildProd = calcBuildNetProd(kingdom);
  const prod = sumObj(sumObj(sysProd, buildProd), modObj(sysCons, -1));
  
  if (!localize) return prod;
  return Object.keys(prod).reduce((acc, key) => {
    acc[key] = prod[key].toLocaleString();
    return acc;
  }, {});
}

export function prepareCommander(kingdom, commanderName) {
  if (!commanderName) 
    throw new Error(`Defender may need to prepare defence wave first`);
    
  const commander = structuredClone(kingdom.commanders[commanderName]);
  commander.name = commanderName;
  commander.image = new Pokemon(commander.image);
  return commander;
}

export function getMilitaryTensionMod(kingdom, direction) {  
  const mapping = {
    2: 1,
    4: 2,
    8: 3.5,
    16: 7
  }
  return mapping[kingdom.militaryTension[direction]];
}

export function prepareSoldiers(
  kingdom,
  soldiers,
  areaPercentage = 100,
  shift,
  direction = null
) {
  const data = soldiers.map((soldier) => {
    const { image, quantity: total } = kingdom.barrack.soldiers[shift].find(
      (s) => s.image.id === soldier.image,
    );
    image.items = soldier.items;

    const tensionMod = direction 
      ? getMilitaryTensionMod(kingdom, direction) 
      : 1    
    const quantity = Math.min(total, Math.round(total * (soldier.percentage / 100) * (areaPercentage / 100) * tensionMod));    
    return [image, quantity];
  });
  return new SoldierStack(data);
}

export function prepareDefenceCommanders(kingdom, direction) {
  return kingdom.defenceWaves.map((wave) => {
    return prepareCommander(kingdom, kingdom.directionCommanders[direction]);
    // return prepareCommander(kingdom, wave.commander);
  });
}

export function prepareDefenceSoldiers(kingdom, areaPercentage = 100, shift, direction) {
  return kingdom.defenceWaves.map((wave) => {
    return prepareSoldiers(kingdom, wave.soldiers, areaPercentage, shift, direction);
  });
}

export function prepareDefenceWaves(kingdom, areaPercentage = 100, shift, direction) {
  const commanders = prepareDefenceCommanders(kingdom, direction);
  const soldiers = prepareDefenceSoldiers(kingdom, areaPercentage, shift, direction);
  return kingdom.defenceWaves.map((wave, index) => {
    return {
      ...wave,
      commander: commanders[index],
      soldiers: soldiers[index],
    };
  });
}

export function removeSoldiers(kingdom, soldierStack, shift) {
  kingdom.barrack.soldiers[shift] = kingdom.barrack.soldiers[shift].map((s) => {
    const quantity = soldierStack.find(s.image.id);
    if (quantity) {
      s.quantity -= quantity;
    }
    return s;
  });
}

export function reducePopulation(kingdom, quantity) {
  kingdom.density = kingdom.density - (quantity / kingdom.landArea)
}


export function handleWoundedSoldiers(kingdom, soldierStack, shift) {
  let hospitalCap = getHospitalCapacity(kingdom);

  kingdom.barrack.soldiers[shift] = kingdom.barrack.soldiers[shift].map((s) => {
    
    if (!soldierStack.has(s.image.id))
      return s
    
    let [image, quantity] = soldierStack.get(s.image.id);
    quantity = Math.min(s.quantity, quantity)
    hospitalCap -= quantity;
    if (hospitalCap < 0) {
      const woundedCount = Math.abs(hospitalCap)
      s.quantity -= woundedCount;
      reducePopulation(kingdom, woundedCount);
      // image.items._items.forEach(item => {
      //   console.log(item.id, "-", woundedCount);
      //   if (!kingdom.storage[item.id]) return
      //   kingdom.storage[item.id] -= woundedCount
      // });
      hospitalCap = 0;
    }
    return s;
  });
}


export function getForceImbalanceRate(kingdom, forceType, type, totalExtraStudent = null) {
  if (totalExtraStudent === null) {
  const ranksIdList = Object.keys(humans).slice(forceType === "soldiers" ? 1 : 0);
   const forceList = kingdom.barrack[forceType][type];
    if (forceList.length === 0) return null
    const quantityMap = new Map();
    const imbalanceDataList = [];

    for (const rankId of ranksIdList) {
      const q = forceList.reduce(
        (sum, s) => sum + (s.image.id === rankId ? s.quantity : 0),
        0,
      );
      quantityMap.set(rankId, q);
    }

    quantityMap.forEach((q, rankId) => {      
      if (q > 0) {
        const rankIndex = ranksIdList.indexOf(rankId);
        const senseiRankId = ranksIdList[rankIndex + 1];
        const senseiQ = quantityMap.get(senseiRankId);
        const extraStudent = q - senseiQ * 3;

        if (senseiQ > 0 && extraStudent !== 0) {
          imbalanceDataList.push({ extraStudent, student:{ rankId, q}, sensei:{ rankId: senseiRankId, q: senseiQ} });
        }
      }
    });
    totalExtraStudent = imbalanceDataList.reduce((sum, d) => sum + d.extraStudent, 0);
  return Math.abs((totalExtraStudent / kingdom.barrack[forceType][type].reduce((sum, s) => sum + s.quantity, 0)) * 100 )
 }
  return Math.abs((totalExtraStudent / kingdom.barrack[forceType][type].reduce((sum, s) => sum + s.quantity, 0)) * 100 ) 
}

export function getSoldierImbalancePenalty(kingdom, shift) {
  const rate = getForceImbalanceRate(kingdom, 'soldiers', shift);
  const penaltyMod = (1 - (rate / 100)) * 1.5
  return penaltyMod
}

export function getFoodTierForBudget(budget) {
  const foodGenItems = getItemsOfType('food_genetics')
  let lastTier = null
  for (const tier in foodGenItems) {
    if (budget < foodGenItems[tier].meta.budget) break
    lastTier = tier
  }
  return lastTier
}

export function getCommanderDirections(kingdom, commanderName) {  
  return Object.keys(kingdom.directionCommanders).filter(dir => kingdom.directionCommanders[dir] === commanderName);
}

export function getCommandedArea(kingdom, commanderName) {
  const directionCount = getCommanderDirections(kingdom, commanderName).length;
  return (kingdom.landArea / 8) * directionCount;
}

export function getEffectiveDefensiveIQ(iq, commandingArea) {  
  const penalty = Math.floor(commandingArea / 100) * 0.1;
  return parseFloat(Math.max(0, iq - penalty).toFixed(1));
}

export function getEffectiveOffensiveIQ(iq, attackedArea) {
  const penalty = Math.floor(attackedArea / 10) * 0.1;
  return parseFloat(Math.max(0, iq - penalty).toFixed(1));
}