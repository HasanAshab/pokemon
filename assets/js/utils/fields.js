import typeChart from "../../../data/types.js"

class Field {
    constructor(battle) {
        this.battle = battle;
    }

    impacts() {
      return []
    }
}

class GenericField extends Field {
    constructor(battle, type, lifetime = null) {
        super(battle)
        this.type = type
        this.lifetime = lifetime
        
        battle.tailListener("scene", (...args) => this.onScene(...args), 'field-scene-' + type)
        battle.tailListener("turn", (...args) => this.onTurn(...args), 'field-scene-' + type)

        
    }

    onScene(senario) {
        this.battle.actives().forEach(pokemon => {
          
            const move = senario.get(pokemon)
            const straightEffect = typeChart[this.type][move.type] ?? 1
            const oppositeEffect = typeChart[move.type][this.type] ?? 1
            
            if (pokemon.isTypeOf(this.type)) {
                pokemon.state.stats.chainModify("spe", 1.25)
            }
            if (oppositeEffect > 1) {
                pokemon.state.damage.chainModifyCrit(1.5)
            }
            if (move.type !== this.type) {
              if (oppositeEffect < 1) {
                  pokemon.state.damage.chainModifyPower(move.id, 1 - 0.15)
              }
              if (straightEffect > 1) {                
                  pokemon.state.damage.chainModifyPower(move.id, 1 - 0.15)
              }
            }
        })
    }

    onTurn() {
        if (!this.lifetime) return
        this.lifetime.turns--
        if (this.lifetime.turns === 0) {
            this.remove()
        }
    }

    cleanup() {
        this.battle.removeListener("scene", 'field-' + this.type)
        this.battle.removeListener("turn", 'field-' + this.type)
    }

    remove() {
      this.battle.removeField(this.type)
      this.cleanup()
    }

    impacts() {
      const critRatioTypes = []
      const powerReducedTypes = []
     
      Object.entries(typeChart).forEach(([key, value]) => {
        if (value[this.type] > 1) {
          critRatioTypes.push(key)
        }
        if (key !== this.type) {
          if (value[this.type] < 1) {
            powerReducedTypes.push(key)
          }
        }
      })

      Object.entries(typeChart[this.type]).forEach(([key, value]) => {
        if (key !== this.type) {
          if (value > 1) {
            powerReducedTypes.push(key)
          }
        }
      })


      return [
        {
          placeholder: "Speed increased by 25%",
          type: "good",
          targetObj: "pokemon",
          targets: [ this.type ]
        },
        {
          placeholder: "Critical ratio increased by 50%",
          type: "good",
          targetObj: "move",
          targets: critRatioTypes
        },
        {
          placeholder: "Power reduced by 15%",
          type: "bad",
          targetObj: "move",
          targets: powerReducedTypes
        }
      ]
    }
}

export const FIELDS = {
    "_default": GenericField
}


export function makeField(battle, type, lifetime = null) {
    const FieldClass = FIELDS[type] ?? FIELDS._default
    const field = new FieldClass(battle, type, lifetime)
    return field
}
