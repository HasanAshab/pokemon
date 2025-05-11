export function calculateSize(baseSize, level) {
  return Math.round(baseSize * Math.pow(1.2, level - 1));
}

export function upgradePrice(basePrice, level) {
  return Math.round(basePrice * Math.pow(1.5, level - 1));
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

export function calculateTax(population, pci, taxRate) {
  const totalIncome = population * pci;
  return Math.floor(totalIncome * taxRate);
}
