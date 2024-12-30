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
    constructor(elemIdSuffix) {
        this.elemIdSuffix = "popup-msg-cont";
        this.queue = [];
        this.isRunning = false;
    }

    add(msg, playerTag, cb = (() => null)) {
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
            }, 1500); // Adjust duration if needed
        });
    }
}


export function startBattle(enemiesMeta) {
    const enemiesBase64List = Object.entries(enemiesMeta).map(([id, meta]) => {
        return new Pokemon(id, meta).toBase64()
    })
    window.location = `battle.html?enemy=${enemiesBase64List.join(",")}`;
}

export async function startUserBattle(name) {
   const prom = await fetch(`./users/${name}.json`)
   const enemiesMeta = await prom.json()
   const enemiesBase64List = Object.entries(enemiesMeta).map(([id, meta]) => {
        return new Pokemon(id, meta).toBase64()
    })
    window.location = `battle.html?enemy=${enemiesBase64List.join(",")}`;
}
