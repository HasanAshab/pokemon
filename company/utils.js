import { calculateLandPrice, calculateSize } from "../kingdoms/utils.js";


export function getAssetLandArea(companyId, kingdom) {  
  return kingdom.buildings
  .filter(build => build.ownedBy === companyId)
  .filter(build => build.property === "rent")
  .reduce((total, build) => {
    return total + (calculateSize(build.baseSize, build.currentLevel) * build.quantity);
  }, 0)
}

export function getAssetCost(companyId) {
  const kingdoms = JSON.parse(localStorage.getItem("kingdoms"));

  return Object.values(kingdoms).reduce((total, kingdom) => {
    const area = getAssetLandArea(companyId, kingdom);    
    const landPrice = calculateLandPrice(area, kingdom, "rent");
    return total + landPrice
  }, 0);
}