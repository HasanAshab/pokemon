class DB {
    constructor(dir) {
        this._dir = dir
        this.types = new SingleFileTable(dir, "types", { shouldCache: true })
        this.natures = new SingleFileTable(dir, "natures", { shouldCache: true })
        this.moves = new MultipleFileTable(dir, "moves")
        this.pokemons = new MultipleFileTable(dir, "pokemons")
    }
}

class Table {
    constructor(dir, tableName) {
        this.tableName = tableName
        this._dir = dir
        this._tableDir = `${dir}/${this.tableName}`
    }
}

class SingleFileTable extends Table {
    constructor(dir, tableName, options = {}) {
        super(dir, tableName)
        this.shouldCache = options.shouldCache || false
    }

    async all(name) {
        if (this.shouldCache && this._cache) {
            return this._cache
        }
        try {
            const file = `${this._tableDir}.json`
            const res = await fetch(file)
            if (res.status !== 200) {
                throw new Error(`file not found: ${file}`)
            }
            const data = await res.json()
            if (this.shouldCache) {
                this._cache = data
            }
            return data
        }
        catch (e) {
            console.error(e)
        }
    }
    
    async get(name) {
        const data = await this.all()
        return data[name]
    }
}

class MultipleFileTable extends Table {
    all() {
        return this.get('__all__')
    }

    async get(name) {
        try {
            const file = `${this._tableDir}/${name}.json`
            const res = await fetch(file)
            if (res.status !== 200) {
                throw new Error(`file not found: ${file}`)
            }
            const data = await res.json()
            return data
        }
        catch (e) {
            console.error(e)
        }
    }
}

export default new DB("db")

