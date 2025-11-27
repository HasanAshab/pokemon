export const FOOD_BUDGET = {
  "low-1": 300,
  "low-2": 700,
  "low-3": 1000,
  "low-4": 1500,
  "mid-1": 2500,
  "mid-2": 3500,
  "mid-3": 4500,
  "high-1": 6000,
  "high-2": 8000,
  "high-3": 10000,
  "bulk": 15000
}

export const DISASTERS = {
  "Earthquake": {
    description: "Sudden shaking of the ground caused by the movement of tectonic plates.",
    related: ["Tsunami", "Landslide"] // Removed "Structural Collapse"
  },
  "Tsunami": {
    description: "Giant waves usually caused by an underwater earthquake, volcanic eruption, or landslide.",
    related: ["Earthquake", "Volcanic Eruption", "Landslide"] // Added "Landslide", Removed "Coastal Flooding"
  },
  "Volcanic Eruption": {
    description: "The release of magma, ash, and gases from a volcano.",
    related: ["Tsunami", "Landslide", "Earthquake"] // Added "Earthquake" and "Landslide", Removed "Ashfall", "Lava Flow", "Lahars"
  },
  "Landslide": {
    description: "Downslope movement of rock, debris, earth, or snow.",
    related: ["Earthquake", "Volcanic Eruption", "Soil Erosion", "Flood"] // Added "Flood", Removed "Heavy Rainfall"
  },
  "Cyclone": {
    description: "Rotating storm systems forming over warm ocean waters, bringing strong winds, heavy rain, and storm surges.",
    related: ["Flood", "Severe Storm"] // Removed "Storm Surge", "Wind Damage"
  },
  "Tornado": {
    description: "Violent, rotating columns of air extending from a thunderstorm to the ground.",
    related: ["Severe Storm"] // Removed "Hail", "High Winds"
  },
  "Flood": {
    description: "Overflow of a large amount of water beyond its normal limits, especially over what is normally dry land.",
    related: ["Cyclone", "Tsunami", "Severe Storm", "Landslide", "Soil Erosion"] // Added "Severe Storm", "Landslide", "Soil Erosion", Removed "Heavy Rainfall", "Dam Failure"
  },
  "Drought": {
    description: "Prolonged periods of abnormally low rainfall, leading to water shortage.",
    related: ["Wildfire", "Heat Wave", "Soil Erosion"] // Added "Soil Erosion", Removed "Famine", "Water Scarcity"
  },
  "Severe Storm": {
    description: "Includes major events like blizzards, hailstorms, and extreme thunderstorms.",
    related: ["Tornado", "Flood", "Cold Wave", "Cyclone"] // Added "Cyclone", Removed "High Winds"
  },
  "Heat Wave": {
    description: "Extremely hot temperatures in a short period of time",
    related: ["Drought", "Wildfire"] // Removed "Dehydration"
  },
  "Cold Wave": {
    description: "Extremely cold temperatures in a short period of time",
    related: ["Severe Storm"] // Removed "Blizzard", "Hypothermia"
  },
  "Wildfire": {
    description: "Uncontrolled fires in a natural area, often accelerated by drought and heat.",
    related: ["Drought", "Heat Wave", "Landslide"] // Removed "Air Pollution"
  },
  "Soil Erosion": {
    description: "The loss of soil and rock in river area due to the action of water, wind, or other forces.",
    related: ["Landslide", "Flood", "Drought", "Wildfire"] // Added "Wildfire", Removed "Deforestation"
  },
};