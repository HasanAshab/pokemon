import pokemons from "../../../data/pokemons.js"
import moves from "../../../data/moves.js"
import natures from "../../../data/natures.js"
import { Pokemon } from "./models.js";



export function loadPokemonsDatalist(id) {
  const dataList = document.getElementById(id);
  const html = Object.keys(pokemons)
    .map(id => `<option value="${id}">${pokemons[id].name} (${pokemons[id].types.join(", ")})</option>`)
    .join("")
  dataList.innerHTML = html;
}

export function loadMovesDatalist(id) {
  const dataList = document.getElementById(id);
  const html = Object.keys(moves)
    .map(id => `<option value="${id}">${moves[id].name} (${moves[id].type})</option>`)
    .join("")
  dataList.innerHTML = html;
}

export function loadNaturesDataList(id){
  const dataList = document.getElementById(id);
  const html = Object.keys(natures)
    .map(id => `<option value="${id}">${natures[id].name} | ${natures[id].description}</option>`)
    .join("")
  dataList.innerHTML =  html
}


export class PopupMsgQueue {
    queue = []
    isRunning = false

    constructor(elemIdSuffix, limit = 7) {
        this.elemIdSuffix = "popup-msg-cont";
        this.limit = limit
    }

    add(msg, playerTag, cb = (() => null)) {
        if (this.queue.length === this.limit) return
        this.queue.push({ msg, playerTag, cb });
        this.runQueue();
    }

    async runQueue() {
        if (this.isRunning || this.queue.length === 0) return;

        this.isRunning = true;

        while (this.queue.length > 0) {
            const { msg, playerTag, cb } = this.queue.shift();
            await this.showPopupMsg(msg, playerTag, cb);
        }

        this.isRunning = false;
    }

    showPopupMsg(msg, playerTag, cb) {
        return new Promise(resolve => {
            const popupMsgCont = document.getElementById(playerTag + "-" + this.elemIdSuffix);

            // Add random tilt
            //const tiltClass = Math.random() > 0.5 ? "tilt-left" : "tilt-right";
            popupMsgCont.classList.add("active");

            popupMsgCont.querySelector(".msg").innerHTML = msg;

            setTimeout(() => {
                popupMsgCont.classList.remove("active");
                popupMsgCont.classList.remove("enemy-side");
                cb();
                resolve();
            }, 1000); // Adjust duration if needed
        });
    }
}

export async function getUserPokemonsMeta(name){
  const prom = await fetch(`./users/sessions/1/${name}.json`)
  const enemiesMeta = await prom.json()
  return enemiesMeta
}
export function startBattle(enemiesMeta, fields = [], system) {
    const enemiesBase64List = enemiesMeta.map(meta => {
        return new Pokemon(meta.id, meta).toBase64()
    })
    window.location = `battle.html?enemy=${enemiesBase64List.join(",")}&fields=${fields.join(',')}${system ? "&system=" + system : ''}`;
}

export async function startUserBattle(name,popList=[],fields =[], system) {
   try {
       const userPokemonsMeta = await getUserPokemonsMeta(name)
       startBattle(userPokemonsMeta, fields, system)
   }
   catch(e) {
       console.error(e)
   }
}
