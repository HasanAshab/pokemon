import typeChart from "../../../data/types.js"

class Field {
    constructor(battle) {
        this.battle = battle;
    }
}

class GenericField extends Field {
    constructor(battle, type) {
        super(battle)
        this.type = type
        
        battle.on("scene", (...args) => this.onScene(...args), 'field-' + type)
    }

    onScene(senario) {
        this.battle.actives().forEach(pokemon => {
          
            const move = senario.get(pokemon)
            const straightEffect = typeChart[this.type][move.type] ?? 1
            const oppositeEffect = typeChart[move.type][this.type] ?? 1
            console.log(move.id, straightEffect, oppositeEffect);
            
            if (pokemon.isTypeOf(this.type)) {
                pokemon.state.stats.chainModify("spe", 1.25)
            }
            if (oppositeEffect > 1) {
                pokemon.state.damage.chainModifyCrit(1.5)
            }
            if (straightEffect < 1) {
                pokemon.state.damage.chainModifyPower(move.id, 0.80)
            }
        })
    }

    cleanup() {
        this.battle.removeListener("scene", 'field-' + this.type)
    }
}

export const FIELDS = {
    "_default": GenericField
}


export function makeField(battle, type) {
    const FieldClass = FIELDS[type] ?? FIELDS._default
    const field = new FieldClass(battle, type)
    return field
}
