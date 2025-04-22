import {getPokemonsMeta} from "./utils/helpers.js"
import {getUserPokemonsMeta, loadPokemonsDatalist} from "./utils/dom.js"

const models = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.5-pro-exp-03-25",
]
const API_KEY = "AIzaSyDuACe-uhQf17Qz3NxNmfzDBvUJ6kRLfcQ"
const MODEL = models[2]
const pokemonsMeta = getPokemonsMeta()
const pokemonSelect = document.getElementById("poke")
const charSelect = document.getElementById("char")


window.onload = ()=> {
    loadUserPokemons()
    loadChars()
    loadPokemonsDatalist("pokemons-data-list")
}


function loadUserPokemons() {
  for (const pokemon in pokemonsMeta){
    pokemonSelect.innerHTML += `
     <option value="${pokemon}">${pokemon}</option>
    `
  }
}

async function loadChars() {
  const res = await fetch("../../users/sessions/1/_names.json") 
  const data = await res.json()
  for (const char of data){
    charSelect.innerHTML += `
     <option value="${char}">${char}</option>
    `
  }
}

document.getElementById("copy-btn").addEventListener("click", () => {
  const resultText = document.getElementById("result").textContent;
  navigator.clipboard.writeText(resultText).then(() => {
    alert("Copied to clipboard!");
  }).catch(err => {
    alert("Failed to copy: " + err);
  });
});
document.getElementById("copy-btn-2").addEventListener("click", () => {
  const resultText = document.getElementById("result-ch").textContent;
  navigator.clipboard.writeText(resultText).then(() => {
    alert("Copied to clipboard!");
  }).catch(err => {
    alert("Failed to copy: " + err);
  });
});



globalThis.generateEnemy = async function() {
  const extraInst = document.getElementById('instr').value
  const level = document.getElementById('level').value
  const name = document.getElementById('name').value
  const def = {}
  
  if (name) def.id = name
  if (level) def.xp = (level - 1) * 1000
  
  if (Object.keys(def).length) {
    def["Rest of the properties"] = "..."
  }
  
  const text = `
    You are a enemy generator for my pokemon game. you will be given players pokemon with
    its xp, retreat (used as a cost for using moves), nature and moves and mega moves (moves replaced by actual moves when turns to mega). 
    
    *** You have to generate the enemy pokemon with some constrains:
      ${def.id ? '' : `Typing: ${document.getElementById('typing').value}`}
      Difficulty To Defeat: ${document.getElementById('difficulty').value}
      Move Max Power: ${document.getElementById('move-power').value}
    
    ${Object.keys(def).length
      ? `
      *** Here is default object that you have to start filling with:
      ${JSON.stringify(def, null, 2)}
      `
      : ''
    }

    ${extraInst ? `***Extra Instruction***\n\t${extraInst}` : ''}
    
    
    your response example:
    *** should be plain json (i will parse json)
     \` {
        "id": "hitmonchan",
        "xp": 2800,
        "nature": "careful",
        "retreat": 3,
        "moves": [
          {
            "id": "dizzypunch",
          },
          {
            "id": "vacuumwave",
          },
          {
            "id": "icepunch",
          },
          {
            "id": "poweruppunch",
          },
          {
            "id": "jetpunch",
          }
        ],
        "mega": {
          "moves": [
            {
              "id": "dizzypunch",
            },
            {
              "id": "vacuumwave",
            },
            {
              "id": "icepunch",
            },
            {
              "id": "poweruppunch",
            },
            {
              "id": "jetpunch",
            }
          ],
          "suffix": "mega"
        },
        "token_used": {
          "spe": 2,
          "atk": 1
        }
      }\`
    

    Here is players pokemon
    ${JSON.stringify(pokemonsMeta[pokemonSelect.value], null, 2)}
  `


  console.log(text)
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL })
 
  const resultEl = document.getElementById("result");
  resultEl.textContent = "Finding a worthy opponent...";
  const result = await model.generateContent(text);
  const fullText = result.response.text();
  const lines = fullText.split('\n');
  const trimmedText = lines.slice(1, -1).join('\n');
  resultEl.textContent = `startBattle([${trimmedText}], [], 'single')`;
}

globalThis.syncChar = async function() {
  const ribelsMeta = await getUserPokemonsMeta(charSelect.value)
  const extraInst = document.getElementById('instr-ch').value
  const maxLevel = document.getElementById('max-level').value
  const maxMovePower = document.getElementById('move-power-ch').value
  const text = `
    You are a ribel syncronizer for my pokemon game. you will be given player's and ribel's all pokemons(xp, retreat (used as a cost for using moves), nature and moves and mega moves (moves replaced by actual moves when turns to mega)). 
    and you have to increase the ribels progress with keeping some constrains:
      ${maxLevel ? `Max XP: ${(maxLevel - 1) * 1000}` : ''}
      ${maxLevel ? `Max XP: ${(maxLevel - 1) * 1000}` : ''}
      Difficulty To Defeat: ${document.getElementById('difficulty').value}
      Typing: ${document.getElementById('typing').value}
      Move Max Power: ${document.getElementById('move-power').value}

    ***Extra Instruction***
      ${extraInst || "Not provided..."}

    your response example:
    *** should be plain json (i will parse json)
     \` 
      [
    {
      "id": "pupitar",
      "xp": 1900,
      "nature": "brave",
      "retreat": 3.5,
      "moves": [
        {
          "id": "harden",
          "isSelected": true
        },
        {
          "id": "rockthrow",
          "isSelected": true
        },
        {
          "id": "heavyslam",
          "isSelected": true
        },
        {
          "id": "scaryface",
          "isSelected": true
        },
        {
          "id": "tackle",
          "isSelected": true
        }
      ],
      "stats": {},
      "token_used": {}
    },
    {
      "id": "magneton",
      "xp": 1800,
      "nature": "serious",
      "retreat": 4,
      "moves": [
        {
          "id": "spark",
          "isSelected": true
        },
        {
          "id": "gyroball",
          "isSelected": true
        },
        {
          "id": "thundershock",
          "isSelected": true
        },
        {
          "id": "tackle",
          "isSelected": true
        },
        {
          "id": "supersonic",
          "isSelected": true
        }
      ],
      "stats": {},
      "token_used": {}
    },
    {
      "id": "greninja",
      "xp": 3000,
      "nature": "hasty",
      "retreat": 3.5,
      "moves": [
        {
          "id": "slash",
          "isSelected": true
        },
        {
          "id": "knockoff",
          "isSelected": true
        },
        {
          "id": "icepunch",
          "isSelected": true
        },
        {
          "id": "waterpulse",
          "isSelected": true
        },
        {
          "id": "doubleteam",
          "isSelected": true
        }
      ],
      "mega": {
        "moves": [
          {
            "id": "slash",
            "isSelected": true
          },
          {
            "id": "knockoff",
            "isSelected": true
          },
          {
            "id": "icepunch",
            "isSelected": true
          },
          {
            "id": "waterpulse",
            "isSelected": true
          },
          {
            "id": "doubleteam",
            "isSelected": true
          }
        ],
        "suffix": "mega"
      },
      "stats": {},
      "token_used": {}
    },
    {
      "id": "emboar",
      "xp": 3000,
      "nature": "calm",
      "retreat": 3.5,
      "moves": [
        {
          "id": "firespin",
          "isSelected": true
        },
        {
          "id": "flamecharge",
          "isSelected": true
        },
        {
          "id": "forcepalm",
          "isSelected": true
        },
        {
          "id": "bulkup",
          "isSelected": true
        },
        {
          "id": "flamewheel",
          "isSelected": true
        }
      ],
      "mega": {
        "moves": [
          {
            "id": "firespin",
            "isSelected": true
          },
          {
            "id": "flamecharge",
            "isSelected": true
          },
          {
            "id": "forcepalm",
            "isSelected": true
          },
          {
            "id": "bulkup",
            "isSelected": true
          },
          {
            "id": "flamewheel",
            "isSelected": true
          }
        ],
        "suffix": "mega"
      },
      "stats": {},
      "token_used": {}
    }
    ]
    \`
      
    
    Here is players pokemons:
    ${JSON.stringify(pokemonsMeta, null, 2)}
    
    Here is ribels pokemons:
    ${JSON.stringify(ribelsMeta, null, 2)}
  `


  console.log(text)
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL })
 
  const resultEl = document.getElementById("result-ch");
  resultEl.textContent = "Thinking...";
  setTimeout(() => {
    resultEl.textContent = "Syncronising it...";
  }, 700)
  const result = await model.generateContent(text);
  const fullText = result.response.text();
  const lines = fullText.split('\n');
  const trimmedText = lines.slice(1, -1).join('\n');
  resultEl.textContent = trimmedText
}
