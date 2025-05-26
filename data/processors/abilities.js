import { processor } from "./helpers.js"
import { sumObj } from "../../assets/js/utils/helpers.js"


const makeCtx = (ability) => ({
    ability,
    _contacted: false,
    debug: console.log,
    popup: (msg, poke) => {
      globalThis.abilitiesPopupQueue.add(`${ability.id}: ${msg}`, poke._tag)
    },
    checkMoveMakesContact() {
        return this._contacted
    },
    randomChance(numerator, denominator) {
        return Math.floor(Math.random() * denominator) < numerator;
    },
    damage(amount, target, source) {
        target.state.decreaseHealth(amount)
        this.popup(`${source.name}'s ability caused ${amount} damage`, target)
    },
})

function mergeDefault(ability) {
    const defaultProps = {
        type: 'normal',
        getTokenChanges() {
          const tokenChanges = this.ability.tokenChanges || {}
          if ('tokenChangesPercent' in this.ability) {
            for (const [stat, per] of Object.entries(this.ability.tokenChangesPercent)) {
                if (stat in tokenChanges) continue
                tokenChanges[stat] = pokemon.stats[stat] * (per / 100)
            }
          }
          return tokenChanges
        },
        onStart(pokemon) {
            if ('statChanges' in this.ability) {
                pokemon.state.stats._statChanges = sumObj(pokemon.state.stats._statChanges, this.ability.statChanges)
            }
            const tokenChanges = this.ability.getTokenChanges()
            pokemon.tokens = sumObj(pokemon.tokens, tokenChanges)
        },
        onDeactivate(pokemon) {
            if ('statChanges' in this.ability) {
                pokemon.state.stats._statChanges = sumObj(pokemon.state.stats._statChanges, modObj(this.ability.statChanges, -1))
            }
            if ('tokenChanges' in this.ability) {
                pokemon.tokens = sumObj(pokemon.tokens, modObj(this.ability.tokenChanges, -1))
            }
        },
    }
    
    for (const key in defaultProps) {
      if (key in ability) continue
      else ability[key] = defaultProps[key]
    }
}

function bindMethods(ability) {
    const exclude = []
    for (const key in ability) {
      if (typeof ability[key] !== "function" || exclude.includes(key)) continue
      const ctx = makeCtx(ability)
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
    mergeDefault,
    bindMethods,
    addCtxMixer,
])