export const DISASTERS = {
  "Earthquake": {
    description: "Sudden shaking of the ground caused by the movement of tectonic plates.",
    related: ["Tsunami", "Landslide"] // Removed "Structural Collapse"
  },
  "Tsunami": {
    description: "Giant waves usually caused by an underwater earthquake, volcanic eruption, or landslide.",
    related: ["Landslide", "Flood"] // Added "Landslide", Removed "Coastal Flooding"
  },
  "Volcanic Eruption": {
    description: "The release of magma, ash, and gases from a volcano.",
    related: ["Tsunami", "Landslide", "Earthquake"] // Added "Earthquake" and "Landslide", Removed "Ashfall", "Lava Flow", "Lahars"
  },
  "Landslide": {
    description: "Downslope movement of rock, debris, earth, or snow.",
    related: [] // Added "Flood", Removed "Heavy Rainfall"
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
    related: [] // Added "Severe Storm", "Landslide", "Soil Erosion", Removed "Heavy Rainfall", "Dam Failure"
  },
  "Drought": {
    description: "Prolonged periods of abnormally low rainfall, leading to water shortage.",
    related: ["Wildfire", "Heat Wave"] // Added "Soil Erosion", Removed "Famine", "Water Scarcity"
  },
  "Severe Storm": {
    description: "Includes major events like blizzards, hailstorms, and extreme thunderstorms.",
    related: ["Flood", "Cold Wave"] // Added "Cyclone", Removed "High Winds"
  },
  "Heat Wave": {
    description: "Extremely hot temperatures in a short period of time",
    related: ["Drought", "Wildfire"] // Removed "Dehydration"
  },
  "Cold Wave": {
    description: "Extremely cold temperatures in a short period of time",
    related: [] // Removed "Blizzard", "Hypothermia"
  },
  "Wildfire": {
    description: "Uncontrolled fires in a natural area, often accelerated by drought and heat.",
    related: [] // Removed "Air Pollution"
  },
  "Soil Erosion": {
    description: "The loss of soil and rock in river area due to the action of water, wind, or other forces.",
    related: [] // Added "Wildfire", Removed "Deforestation"
  },
};