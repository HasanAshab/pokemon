import { processor } from "./helpers.js"
import { sumObj, modObj } from "../../assets/js/utils/helpers.js"


const makeCtx = (ability) => ({
    ability,
    _contacted: false,
    debug: console.log,
    popup: (msg, poke) => {
      globalThis.abilitiesPopupQueue.add(`${ability.id}: ${msg}`, poke._tag)
    },
    deactivate() {
        this.ability._shouldDeactivate = true
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

function mergeDefault(ability, key) {
    const defaultProps = {
        id: key,
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
        getOpponentTokenChanges() {
          const tokenChanges = this.ability.opponentTokenChanges || {}
          if ('opponentTokenChangesPercent' in this.ability) {
            for (const [stat, per] of Object.entries(this.ability.opponentTokenChangesPercent)) {
                if (stat in tokenChanges) continue
                tokenChanges[stat] = opponent.stats[stat] * (per / 100)
            }
          }
          return tokenChanges
        },
        onActivate(pokemon, opponent) {
            if ('statChanges' in this.ability) {
                pokemon.state.stats._statChanges = sumObj(pokemon.state.stats._statChanges, this.ability.statChanges)
            }
            const tokenChanges = this.ability.getTokenChanges()
            pokemon.tokens = sumObj(pokemon.tokens, tokenChanges)

            if ('opponentStatChanges' in this.ability) {
                opponent.state.stats._statChanges = sumObj(opponent.state.stats._statChanges, this.ability.opponentStatChanges)
            }
            const opponentTokenChanges = this.ability.getOpponentTokenChanges()
            opponent.tokens = sumObj(opponent.tokens, opponentTokenChanges)
        },
        onDeactivate(pokemon, opponent) {
            if ('statChanges' in this.ability) {
                pokemon.state.stats._statChanges = sumObj(pokemon.state.stats._statChanges, modObj(this.ability.statChanges, -1))
            }
            const tokenChanges = this.ability.getTokenChanges()
            pokemon.tokens = sumObj(pokemon.tokens, modObj(tokenChanges, -1))

            if ('opponentStatChanges' in this.ability) {
                opponent.state.stats._statChanges = sumObj(opponent.state.stats._statChanges, modObj(this.ability.opponentStatChanges, -1))
            }
            const opponentTokenChanges = this.ability.getOpponentTokenChanges()
            opponent.tokens = sumObj(opponent.tokens, modObj(opponentTokenChanges, -1))
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

function setRetreat(ability) {
    if ("retreat" in ability) return
    ability.retreat = Math.max(ability.rating ?? 0, 0)
}

export default processor([
    mergeDefault,
    bindMethods,
    addCtxMixer,
    setRetreat,
])