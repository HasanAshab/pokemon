import db from "./db.js"


export class Pokemon {
    static XP_PER_LEVEL = 100;

    static async make(name, meta) {
        const data = await db.pokemons.get(name);
        return new this(name, data, meta);
    }

    constructor(name, data, meta) {
        this.name = name;
        this.data = data;
        this.meta = meta;
    }

    isTypeOf(type) {
        return this.data.types.includes(type);
    }

    statOf(name) {
        return this.data.stats[name];
    }

    effortOf(name) {
        return this.data.efforts[name];
    }

    async effectiveness(type) {
        const types = await db.types.all()
        let effectiveness = 1;
        this.data.types.forEach(tType => {
            if (types[type] && types[type][tType]) {
                effectiveness *= types[type][tType];
            }
        });
        return effectiveness;
    }

    get level() {
        const xp = this.meta.xp;
        return Math.floor(xp / Pokemon.XP_PER_LEVEL) + 1; // Level starts at 1
    }
}

export class Move {
    static async make(name) {
        const data = await db.moves.get(name);
        return new this(name, data);
    }

    constructor(name, data) {
        this.name = name;
        this._data = data;
        Object.assign(this, data)
    }

    async effectiveness(type) {
        const typeMap = await db.types.get(this.type)
        return typeMap[type] || 1
    }
}
