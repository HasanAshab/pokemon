class DB {
    constructor(dir) {
        this._dir = dir
        this.types = new SingleFileTable(dir, "types")
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
    async all(name) {
        try {
            const file = `${this._tableDir}.json`
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
    
    async get(name) {
        data = await this.all()
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
            alert(1)
            console.error(e)
        }
    }
}

var db = new DB("db")
