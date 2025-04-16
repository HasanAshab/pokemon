import {getPokemonsMeta} from "./utils/helpers.js"

const API_KEY = "AIzaSyDuACe-uhQf17Qz3NxNmfzDBvUJ6kRLfcQ"
const MODEL = "gemini-2.0-flash"
const pokemonsMeta = getPokemonsMeta()
const pokemonSelect = document.querySelector(".pokemons-wrapper")


function loadUserPokemons(){
  for (const pokemon in pokemonsMeta){
    pokemonSelect.innerHTML += `
     <option value="${pokemon}">${pokemon}</option>
    `
  }
}

globalThis.generate = async function generate() {
  const extraInst = document.getElementById('instr').value
  const instr = `
    You are a helper for my pokemon game. you will be given players pokemon with
    its xp, retreat (used as a cost for using moves), nature and moves and mega moves (moves replaced by actual moves when turns to mega). 
    
    Notes: 
      1. you have to predict a worthy and equal opponent for a joyful battle
      2. Balance the opponent by increasing or decreading factors like, if you want to keep opponent
      less level make something else stronger like better moves than player or something else (token, type advantage, retreat ...etc)
      3. Enemy should not be fully equal to players (enemy can be a bit more or less powerful)
      4. response should be only json
  
    ${extraInst ? `***Must Instruction***\n\t${extraInst}` : ''}

    your response example:
      {
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
        "stats": {},
        "token_used": {}
      }
  `
  const prompt = JSON.stringify(pokemonSelect.value, null, 2)
    
  const text = instr + "\n\n" + prompt
  
  console.log(text)
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL })
 
  const resultEl = document.getElementById("result");
  resultEl.textContent = "Finding a worthy opponent...";
  const result = await model.generateContent(text);
  resultEl.textContent = result.response.text();
}

window.onload = ()=>{
    loadUserPokemons()
}