import { Pokemon } from "../assets/js/utils/models.js";
import humans from "../data/humans.js";
import { SoldierStack } from "./war.js";


export function saveKingdoms(kingdoms) {
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
}

export const soldiersAcademy = {
  getDefaultData:  function getDefaultData(){
  const data = {}
  for (const key in humans ){
      if (key !== "student")
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
  let index = 2
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


    console.log(ranksIdMap.get(rankNum + 1),soldierslist);
    
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
  const perPerson = (pci - taxRate * pci) * 0.0002;
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
  return Object.entries(kingdom.commanders).reduce((total, [_, commander]) => {
    return total + commander.salary;
  }, 0);
}

export function calcSoldiersSalary(kingdom, type) {
  if (!kingdom?.barrack?.soldiers) return 0;

  if (type) {
    return kingdom.barrack.soldiers[type].reduce((total, soldier) => {
      const soldierTotal = (soldier.quantity || 0) * (soldier.ivSalary || 0);
      return total + soldierTotal;
    }, 0);
  }
  return (
    calcSoldiersSalary(kingdom, "day") +
    calcSoldiersSalary(kingdom, "night") +
    calcSoldiersSalary(kingdom, "emergency")
  );
}

export function calcAcademyCost(kingdom) {  
  return soldiersAcademy.getAcademyCost(kingdom)
}

export function getHospitalCapacity(kingdom) {
  const reviveCapacity = getStorage(kingdom).revive || 0;
  return Math.floor(reviveCapacity);
}

export function calcBuildProduction(kingdom) {
  return kingdom.buildings.reduce((prod, build) => {
    return sumObj(prod, modObj(build.produces, build.quantity));
  }, {});
}

export function calcBuildConsumtion(kingdom) {
  return kingdom.buildings.reduce((cons, build) => {   
    return sumObj(cons, modObj(build.consumes, build.quantity));
  }, {});
}

export function calcBuildNetProd(kingdom) {
  const prod = calcBuildProduction(kingdom);
  const cons = modObj(calcBuildConsumtion(kingdom), -1);  
  return sumObj(prod, cons);
}

export function getStorage(kingdom) {
  const buildMaintains = kingdom.buildings.reduce((acc, build) => {
    const maintains = build.baseMaintains
      ? calculateMaintains(build.baseMaintains, build.currentLevel)
      : {};
    return sumObj(acc, modObj(maintains, build.quantity));
  }, {});
  
  return sumObj(buildMaintains, kingdom.storage);
}

export function calcNetProd(kingdom, localize = false) {
  const sysProd = {
    coins: calculateTax(kingdom),
  };
  const sysCons = {
    coins:
      calcSoldiersSalary(kingdom) +
      calcAcademyCost(kingdom) +
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

export function prepareSoldiers(
  kingdom,
  soldiers,
  areaPercentage = 100,
  shift,
) {
  const data = soldiers.map((soldier) => {
    const { image, quantity: total } = kingdom.barrack.soldiers[shift].find(
      (s) => s.image.id === soldier.image,
    );
    image.items = soldier.items;

    const quantity = Math.ceil(total * (soldier.percentage / 100));
    return [image, quantity];
  });
  return new SoldierStack(data).resize(areaPercentage);
}

export function prepareDefenceCommanders(kingdom) {
  return kingdom.defenceWaves.map((wave) => {
    return prepareCommander(kingdom, wave.commander);
  });
}

export function prepareDefenceSoldiers(kingdom, areaPercentage = 100, shift) {
  return kingdom.defenceWaves.map((wave) => {
    return prepareSoldiers(kingdom, wave.soldiers, areaPercentage, shift);
  });
}

export function prepareDefenceWaves(kingdom, areaPercentage = 100, shift) {
  const commanders = prepareDefenceCommanders(kingdom);
  const soldiers = prepareDefenceSoldiers(kingdom, areaPercentage, shift);
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
    const [image, quantity] = soldierStack.get(s.image.id);
    hospitalCap -= quantity;
    if (hospitalCap < 0) {
      const woundedCount = Math.abs(hospitalCap)
      s.quantity -= woundedCount;
      reducePopulation(kingdom, woundedCount);
      image.items._items.forEach(item => {
        console.log(item.id, "-", woundedCount);
        if (!kingdom.storage[item.id]) return
        kingdom.storage[item.id] -= woundedCount
      });
      hospitalCap = 0;
    }
    return s;
  });
}


export function getSoldierImbalanceRate(totalExtraStudent, soldierList) {
    return Math.abs((totalExtraStudent / soldierList.reduce((sum, s) => sum + s.quantity, 0)) * 100 )
   
}

export function getSoldierImbalancePenalty(kingdom, shift) {
  const rate = getSoldierImbalanceRate(kingdom, shift);
  const penaltyMod = rate
  console.log(rate, penaltyMod);
  return penaltyMod
}