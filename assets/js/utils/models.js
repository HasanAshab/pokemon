import db from "./db.js"


export class Pokemon {
    static XP_PER_LEVEL = 100;

    static async make(name, meta) {
        const data = await db.pokemons.get(name);
        return new this(name, meta, data);
    }

    constructor(name, meta, data) {
        this.name = name;
        this.meta = meta;
        this.data = data;
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
