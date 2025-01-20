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
        
        battle.on("turn", (...args) => this.onTurn(...args))
    }
    
    onTurn(_, senario) {
        this.battle.actives().forEach(pokemon => {
            const move = senario.get(pokemon)
            /*const effectiveness = typeChart[this.type][move.type] ?? 1
            
            if (effectiveness < 1) {
                state.damage.chainModify(2)
            }
            else if (effectiveness > 1) {
                state.damage.chainModify(1.15)
            }*/
            if (pokemon.isTypeOf(this.type)) {
                pokemon.state.stats.chainModify("spe", 1.15)
            }
            if (move.type === this.type) {
                pokemon.state.damage.chainModifyCrit(1.5)
            }
        })
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
