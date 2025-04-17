import {getPokemonsMeta} from "./utils/helpers.js"

const API_KEY = "AIzaSyDuACe-uhQf17Qz3NxNmfzDBvUJ6kRLfcQ"
const MODEL = "gemini-2.0-flash"
const pokemonsMeta = getPokemonsMeta()
const pokemonSelect = document.querySelector(".pokemons-wrapper")


function loadUserPokemons() {
  for (const pokemon in pokemonsMeta){
    pokemonSelect.innerHTML += `
     <option value="${pokemon}">${pokemon}</option>
    `
  }
}

globalThis.generate = async function generate() {
  const extraInst = document.getElementById('instr').value
  const level = document.getElementById('level').value
  const instr = `
    You are a helper for my pokemon game. you will be given players pokemon with
    its xp, retreat (used as a cost for using moves), nature and moves and mega moves (moves replaced by actual moves when turns to mega). 
    
    Here are some constrains about the enemy:
      ${level ? `XP Must Be: ${(level - 1) * 1000}` : ''}
      Difficulty To Defeat: ${document.getElementById('difficulty').value}
      Typing: ${document.getElementById('typing').value}
      Move Max Power: ${document.getElementById('move-power').value}

    ***Extra Instruction***
      ${extraInst || "Not provided..."}

    your response example:
    *** should be plain json (i will parse json)
     \` {
        "id": "hitmonchan",
        "xp": 2800,
        "nature": "careful",
        "retreat": 3.5,
        "moves": [
          {
            "id": "dizzypunch",
            "isSelected": true
          },
          {
            "id": "vacuumwave",
            "isSelected": true
          },
          {
            "id": "icepunch",
            "isSelected": true
          },
          {
            "id": "poweruppunch",
            "isSelected": true
          },
          {
            "id": "jetpunch",
            "isSelected": true
          }
        ],
        "mega": {
          "moves": [
            {
              "id": "dizzypunch",
              "isSelected": true
            },
            {
              "id": "vacuumwave",
              "isSelected": true
            },
            {
              "id": "icepunch",
              "isSelected": true
            },
            {
              "id": "poweruppunch",
              "isSelected": true
            },
            {
              "id": "jetpunch",
              "isSelected": true
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
  `
  const prompt = JSON.stringify(pokemonsMeta[pokemonSelect.value], null, 2)
    
  const text = instr + "\n\n" + prompt
  
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

document.getElementById("copy-btn").addEventListener("click", () => {
  const resultText = document.getElementById("result").textContent;
  navigator.clipboard.writeText(resultText).then(() => {
    alert("Copied to clipboard!");
  }).catch(err => {
    alert("Failed to copy: " + err);
  });
});

window.onload = ()=> {
    loadUserPokemons()
}
