import { processor } from "./helpers.js"



function bindMethods(ability) {
    const exclude = []
    const ctx = {
        _contacted: false,
        debug: console.log,
        checkMoveMakesContact() {
            return this._contacted
        },
        randomChance(numerator, denominator) {
            return Math.floor(Math.random() * denominator) < numerator;
        },
    }
    for (const key in ability) {
      if (typeof ability[key] !== "function" || exclude.includes(key)) continue
      ability[key] = ability[key].bind(ctx)
      ability[key]._ctx = ctx
    }
}


function addCtxMixer(ability) {
  for (const key in ability) {
      if (typeof ability[key] !== "function") continue
      ability[key].callWithExtraCtx = function (extraCtx, ...args) {
        const mergedCtx = Object.assign(this._ctx, extraCtx)
        return ability[key].apply(mergedCtx, args)
      }
    }
}


export default processor([
    bindMethods,
    addCtxMixer,
])