import { DISASTERS, ALLOWED_POWERS, DIRECTIONS } from "./constraints.js";
import { getItemsOfType } from "../assets/js/utils/dom.js";
import { Pokemon } from "../assets/js/utils/models.js";
import humans from "../data/humans.js";
import { SoldierStack } from "./war.js";
import pokemons from "../data/pokemons.js";
import beasts from "../data/beasts.js";

export function getPopulation(kingdom) {
  return kingdom.landArea * kingdom.density;
}

export function calculateBirthCount(kingdom) {
  const population = getPopulation(kingdom)
  const annualBirths = population * (kingdom.birthRate ?? 0.02);
  return Math.round(annualBirths)
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
  const mpSecurity = getSecurityRate(kingdom, "polices") + getSecurityRate(kingdom, "soldiers")
  const stationSecurity = getPoliceStationSecurityRate(kingdom)
  const actualSecurity = mpSecurity + Math.min(50, stationSecurity)  
  return Math.min(100, actualSecurity)
}

export function getSecurityRate(kingdom, forceType){
  const target = 15.35671;
  const might = (getMight(kingdom, forceType, "day")
    + getMight(kingdom, forceType, "night")) / 2
  const ratio = might / getPopulation(kingdom)  
  const closeness = (ratio / target) * 100;
  return Number(closeness.toFixed(2))
}

export function getPoliceStationSecurityRate(kingdom) {
  const station = getStorage(kingdom).station || 0;
  const area = kingdom.landArea;

  if (area <= 0) return 0;

  const requiredStations = area / 200;

  // 1 station per 200 area = 50 security
  const securityRate = (station / requiredStations) * 50;

  return Math.max(0, Math.min(100, Math.round(securityRate)));
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

export function getArtilleries(kingdom) {  
  return kingdom.buildings.filter((build) => calcBuildMaintains(build).defence > 0);
}

export function getArtilleriesAtDefence(kingdom, areaPercentage, direction) {
  const tensionMod = getMilitaryTensionMod(kingdom, direction);
  const artillaries = getArtilleries(kingdom);
  return artillaries.reduce((acc, build) => {
    const quantity = Math.min(build.quantity, Math.round(build.quantity * (areaPercentage / 100) * tensionMod))
    quantity > 0 && acc.push({
      name: build.name,
      defence: calcBuildMaintains(build).defence,
      quantity,
    })
    return acc
  }, [])
}

export function calculateBuildDefenceScore(kingdom, areaPercentage, direction) {
  const artillaries = getArtilleriesAtDefence(kingdom, areaPercentage, direction);
  return artillaries.reduce((acc, build) => acc + build.defence * build.quantity, 0);
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
  return Math.round(basePrice * Math.pow(rate, level));
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
  const warMod = kingdom.underWar ? 1.5 : 1;
  return actualSalary * warMod;
}

export function calcEmployeeSalary(kingdom) {
  if (!kingdom?.employees) return 0;
  
  return kingdom.employees.reduce((total, employee) => {
    const perManSalary = kingdom.pci * (employee.salaryPercent / 100);
    return total + (perManSalary * employee.quantity);
  }, 0);
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

export function calcBuildMaintains(build) {
  return build.baseMaintains
    ? calculateMaintains(build.baseMaintains, build.currentLevel)
    : {};
}

export function getMaintainedStorage(kingdom) {
  return getEnabledBuildings(kingdom).reduce((acc, build) => {
    const maintains = calcBuildMaintains(build);
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
    logs.push(`Employee Salary &#x2190; <span style="color: red; font-weight: bold">${calcEmployeeSalary(kingdom).toLocaleString()}</span>`);
  }


  // Add marketplace entries
  if (kingdom.marketplace && kingdom.marketplace.length > 0) {
    let totalMarketplaceProfit = 0;
    const storage = getStorage(kingdom);
    kingdom.marketplace.forEach(item => {
      if (item.actionType === 'sell') {
        const actualQuantity = item.sellAll ? (storage[item.itemName] || 0) : item.quantity;
        const profit = actualQuantity * item.unitPrice;
        totalMarketplaceProfit += profit;
        if (itemName === item.itemName && actualQuantity > 0) {    
          logs.push(`Marketplace &#x2190; <span style="color: red; font-weight: bold">-${actualQuantity.toLocaleString()}</span>`);
        }
      }

      if (item.actionType === 'buy') {
        const actualQuantity = item.buyWholeDemand ? Math.max(0, (calcNetProd(kingdom, false, false)[item.itemName] || 0) * -1) : item.quantity;
        const profit = actualQuantity * item.unitPrice;
        totalMarketplaceProfit -= profit;
        if (itemName === item.itemName && actualQuantity > 0) {    
          logs.push(`Marketplace &#x2192; <span style="color: green; font-weight: bold">+${actualQuantity.toLocaleString()}</span>`);
        }
      }
    });

    const profit = totalMarketplaceProfit;      
    if (itemName === "coins" && profit !== 0) {
      const arrow = profit > 0 ? "&#x2192;" : "&#x2190;";
      const color = profit > 0 ? "green" : "red";
      const sign = profit > 0 ? "+" : "";
      logs.push(`Marketplace ${arrow} <span style="color: ${color}; font-weight: bold">${sign}${profit.toLocaleString()}</span>`);
    }
  }

  if (itemName === "chakraOil") {
    logs.push(`Beasts &#x2190; <span style="color: red; font-weight: bold">${-calcTotalChakraOilConsumption(kingdom).toLocaleString()}</span>`);
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

export function calcTotalChakraOilConsumption(kingdom) {
  const calcTotalTiersOfBeasts = (shift) => {
    let totalTiers = 0
    for (const { image, quantity } of kingdom.barrack.soldiers[shift]) {
      if (!isBeastImage(image.id)) continue
      totalTiers += getTierOf(image.id) * quantity
    }
    return totalTiers
  }
  return calcTotalTiersOfBeasts("emergency")
}

export function calcNetProd(kingdom, localize = false, includeMarketplace = true) {
  const sysProd = {
    coins: calcLandTax(kingdom) + calculateTax(kingdom),
  };
  const sysCons = {
    coins:
      calcLandRent(kingdom) +
      calcSoldiersSalary(kingdom) +
      calcPoliceSalary(kingdom) +
      calcAmmoCost(kingdom) +
      calcCommandersSalary(kingdom) +
      calcEmployeeSalary(kingdom),
    chakraOil: calcTotalChakraOilConsumption(kingdom),
  };

  
  // Add marketplace profits/losses
  if (includeMarketplace && kingdom.marketplace && kingdom.marketplace.length > 0) {
    const storage = getStorage(kingdom);
    kingdom.marketplace.forEach(item => {      
      if (item.actionType === 'sell') {
        const actualQuantity = item.sellAll ? (storage[item.itemName] || 0) : item.quantity;
        const profit = actualQuantity * item.unitPrice;

        if (!sysProd.coins) sysProd.coins = 0;
        sysProd.coins += profit;

        // Subtract the sold items from production (they're being sold)
        if (item.itemName !== 'coins') {
          if (!sysCons[item.itemName]) sysCons[item.itemName] = 0;
          sysCons[item.itemName] += actualQuantity;
        }
      }

      else if (item.actionType === 'buy') {        
        const actualQuantity = item.buyWholeDemand ? Math.max(0, (calcNetProd(kingdom, false, false)[item.itemName] || 0) * -1) : item.quantity;
        const profit = actualQuantity * item.unitPrice;

        if (!sysCons.coins) sysCons.coins = 0;
        sysCons.coins += profit;
        
        // Add the bought items to production (they're being bought)
        if (item.itemName !== 'coins') {
          if (!sysProd[item.itemName]) sysProd[item.itemName] = 0;
          sysProd[item.itemName] += actualQuantity;
        }
      }
    });
  }
  
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
          imbalanceDataList.push({ extraStudent, student:{ rankId, q }, sensei:{ rankId: senseiRankId, q: senseiQ} });
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

export function getResearchersAccuracy(kingdom) {
  const area = kingdom.landArea;
  const visionRange = kingdom.disaster.visionRange || 1;  
  const researchersCount = getStorage(kingdom).dRes || 0;

  // --- Area vs Researchers (arithmetical) ---
  const areaPerResearcher = 125;
  const baseAccuracy = (researchersCount * areaPerResearcher / area) * 100;

  // --- Vision penalty (multiplicative, 1–6) ---
  let visionMultiplier;

  if (visionRange === 1) visionMultiplier = 1;
  else if (visionRange === 2) visionMultiplier = 0.7;
  else if (visionRange === 3) visionMultiplier = 0.3;
  else {
    // exponential decay for 4–6
    visionMultiplier = 0.3 * Math.pow(0.5, visionRange - 3);
  }

  const finalAccuracy = baseAccuracy * visionMultiplier;

  return Math.max(0, Math.min(100, Math.round(finalAccuracy)));
}


export const randomFrom = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function predictNextDisasters(kingdom) { 
  const chance = (p) => Math.random() * 100 < p;

  const randomizeAccuracy = (x) => {
    let min = 0.8;
    let max = 1.2;
    // 2. Generate the random multiplier
    let multiplier = Math.random() * (max - min) + min;

    // 3. Apply it to x
    let result = x * multiplier;

    return Math.max(0, Math.min(100, parseInt(result)))
  }

  const closestAllowedPower = (power) => {
    const closest = ALLOWED_POWERS.reduce((prev, curr) => {
      return Math.abs(curr - power) < Math.abs(prev - power) ? curr : prev;
    });
    return closest;
  }


  const accuracy = randomizeAccuracy(getResearchersAccuracy(kingdom));  
  const visionRange = kingdom.disaster.visionRange || 1;

  const futureDisasters =
    kingdom.disaster.current.slice(1, 1 + visionRange);

  const predictedDisasters = [];

  for (let i = 0; i < futureDisasters.length; i++) {
    const realMonth = futureDisasters[i];

    // ---- Miss entire month ----
    if (realMonth.length && chance(Math.max(0, 60 - accuracy))) {
      predictedDisasters.push([]);
      continue;
    }

    const predictedMonth = [];

    // ---- Real disasters (with faults) ----
    for (const disaster of realMonth) {
      if (chance(Math.max(0, 50 - accuracy))) continue;

      let predicted = { ...disaster };

      // name fault
      if (chance(Math.max(0, 55 - accuracy))) {
        const related = DISASTERS[disaster.name]?.related || [];
        if (related.length) predicted.name = randomFrom(related);
      }

      // power fault (step-based)
      const baseIndex = ALLOWED_POWERS.indexOf(disaster.power);
      if (baseIndex !== -1) {
        const maxShift = Math.ceil((100 - accuracy) / 15);
        const shift =
          Math.floor(Math.random() * (maxShift * 2 + 1)) - maxShift;
        predicted.power =
          ALLOWED_POWERS[
            Math.max(
              0,
              Math.min(ALLOWED_POWERS.length - 1, baseIndex + shift)
            )
          ];
      }

      // direction drift
      if (chance(Math.max(0, 60 - accuracy))) {
        const idx = DIRECTIONS.indexOf(disaster.direction);
        if (idx !== -1) {
          const drift = Math.random() < 0.5 ? -1 : 1;
          predicted.direction =
            DIRECTIONS[(idx + drift + DIRECTIONS.length) % DIRECTIONS.length];
        }
      }

      predictedMonth.push(predicted);
    }

    // ---- False positives ----
    const falsePositiveChance = Math.max(0, 45 - accuracy);
    const maxFalse = accuracy < 40 ? 2 : 1;

    if (chance(falsePositiveChance)) {
      const falseCount =
        Math.floor(Math.random() * maxFalse) + 1;

      for (let f = 0; f < falseCount; f++) {
        const base =
          realMonth[Math.floor(Math.random() * realMonth.length)];

        if (!base) continue;

        const related =
          DISASTERS[base.name]?.related || [];

        predictedMonth.push({
          name: related.length ? randomFrom(related) : base.name,
          power: closestAllowedPower(randomFrom(ALLOWED_POWERS) * kingdom.disaster.suppressMod),
          source: base.source,
          direction: randomFrom(DIRECTIONS)
        });
      }
    }

    predictedDisasters.push(predictedMonth);
  }

  return predictedDisasters;
}


export function getInitialFixedXp(imageId) {
  const image = pokemons[imageId];
  if (image.type === "human") {
    return ((image.num - 1) * 1000) + 100;
  }

  if (image.type === "beast") {
    return 0;
  }
}

export function getTiers() {
  const tiers = []
  for (const id in humans) {
    const human = humans[id]
    if (human.notMapsTier) continue    
    const pokemon = new Pokemon(id, {
      xp: getInitialFixedXp(id),
    })
    tiers.push({
      source: human.name,
      minMight: pokemon.cp()
    })
  }
  return tiers
}

export function getTierOfMight(m) {
  const tiers = getTiers()
  let currentTier = 1
  for (const tier of tiers) {
    if (m > tier.minMight) {
      currentTier++
    }
    else return currentTier
  }
}

export function getTierOf(id) {  
  if (typeof id === "number") return getTierOfMight(id)

  const tiers = getTiers()
  const pokemon = new Pokemon(id)

  if (pokemon.type === 'human') {
    for (let i = 0; i < tiers.length; i++) {
      if (pokemon.name === tiers[i].source) return i + 1
    }
    return 1
  }
  return getTierOfMight(pokemon.cp())
}

export function getMaxSearchableMightOfBeasts(kingdom) {
  const researcherScore = getStorage(kingdom).bRes || 0;
  return Math.round(researcherScore * 5);
}

export function searchForBeasts(kingdom) {
  // 40% chance to get nothing
  if (Math.random() > 0.4) return null;

  const minMight = kingdom.beasts?.researchers?.minMight || 0;
  const maxMight = getMaxSearchableMightOfBeasts(kingdom);

  const beastIds = Object.keys(beasts)
    .filter(id => new Pokemon(id).cp() <= maxMight)
    .filter(id => new Pokemon(id).cp() >= minMight);

    
  const id = randomFrom(beastIds);
  if (!id) {
    return null;
  }
  const beastCp = new Pokemon(id).cp();  
  const quantity = Math.round((maxMight + (minMight * 0.5)) / beastCp);

  return {
    id,
    quantity,
  };
}

export function getEspionageRisk(targetSecurityRate, dataLevel, manCount) { 
  // clamp & sanitize inputs
  targetSecurityRate = Math.max(1, Math.min(100, Number(targetSecurityRate)));
  dataLevel = Math.max(1, Math.min(6, Number(dataLevel)));
  manCount = Math.max(1, Number(manCount));

  // factors
  const securityFactor = targetSecurityRate / 100; // 0.01–1
  const dataFactor = dataLevel / 6;                // ~0.17–1

  // spy protection factor:
  // more spies -> less risk, diminishing effect
  // goes from ~1 (one spy → almost full risk) down toward 0
  const spyReduction = 1 / Math.log2(manCount + 1);

  // combine effects
  let risk = (
    0.6 * securityFactor +
    0.4 * dataFactor
  ) * 100 * spyReduction;

  // clamp to 1–100
  risk = Math.max(1, Math.min(100, Math.round(risk)));

  return risk;
}

export function getEspionageCost(kingdom, targetSecurityRate, dataLevel, manCount) {
  const espionageRisk = getEspionageRisk(targetSecurityRate, dataLevel, manCount)
  const costPerMan = (kingdom.pci * 2.5) * (1 + (espionageRisk / 100))
  return costPerMan * manCount
}

export function getRequiredArchLevel(floor, durability) {
  return Math.max(1,
    ((floor * 5) - 5) + (durability - 1)
  )
}

export function getArchCost(kingdom, archLevel, size, floor) {
  return (kingdom.pci * 1.5) * archLevel * (size * floor * 0.1)
}

export function getMaterialCost(kingdom, size, floor, durability) {
  return (kingdom.pci * 0.085) * size * floor * (durability * 1.3) 
}

export function getBuildCost(kingdom, size, floor, durability) {
  const reqiredArchLevel = getRequiredArchLevel(floor, durability);  
  const archCost = getArchCost(kingdom, reqiredArchLevel, size, floor);
  const materialCost = getMaterialCost(kingdom, size, floor, durability);
  return archCost + materialCost
}

export function getRequiredMechanicLevel(power, size) {
  // Prevent divide-by-zero or unrealistic size
  if (size <= 0) size = 1;

  // Tunable constants
  const powerFactor = 1.09;   // how strongly power increases level
  const sizeFactor = 0.9;    // how strongly size reduces it
  const base = 1;

  // Core formula
  const level = (base + (Math.pow(power, powerFactor) / Math.pow(size, sizeFactor))) * 0.06;

  // Round up to integer mechanic level
  return Math.round(level);
}


export function getMechanicCost(kingdom, mechanicLevel) {
  return (kingdom.pci * 2.5) * (mechanicLevel * 1.2)
}

export function getArtilleryMaterialCost(kingdom, lifetime, size) {
  return (kingdom.pci * 0.1) * (lifetime * 1.2) * size
}

export function calculateArtilleryPrice(kingdom, power, lifetime, size) {
  const requiredMechanicLevel = getRequiredMechanicLevel(power, size);
  const mechanicCost = getMechanicCost(kingdom, requiredMechanicLevel);
  const materialCost = getArtilleryMaterialCost(kingdom, lifetime, size);
  return mechanicCost + materialCost
}

export function isBeastImage(imageId) {
  const image = pokemons[imageId];
  return image.type === "beast";
}