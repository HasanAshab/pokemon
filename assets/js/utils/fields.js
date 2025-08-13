class Field {
    constructor(battle) {
        this.battle = battle;
    }
}

class GenericField extends Field {
    constructor(battle, type) {
        super(battle)
        this.type = type
        
        battle.on("scene", (...args) => this.onScene(...args))
    }

    onScene(senario) {
        this.battle.actives().forEach(pokemon => {
            const move = senario.get(pokemon)
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
