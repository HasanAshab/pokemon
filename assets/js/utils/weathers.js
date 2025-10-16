import { camelize, capitalizeFirstLetter } from "./helpers.js";

class Weather {
    events = [
        "turn",
        "turn-end",
        "wave",
        "scene",
        "scene-end",
    ]

    constructor(battle, source) {
        this.battle = battle;
        this.source = source;
    }

    setup() {
        this.events.forEach(event => {
            this._subscribeTo(event)
          })
    }

    teardown() {
        this.events.forEach(event => {
            this._unsubscribeTo(event)
        })
    }

    remove() {
        return this.battle.weathers.remove(this.constructor.weatherName)
    }

    _subscribeTo(event) {
        const listener = this[`on${camelize(capitalizeFirstLetter(event))}`]
        if (listener) {
            this.battle.on(event, listener.bind(this), `weather::${this.constructor.weatherName}::${event}`)
        }
    }
    
    _unsubscribeTo(event) {
        this.battle.removeListener(event, `weather::${this.constructor.weatherName}::${event}`)
    }
}

class ExpirableWeather extends Weather {
    lifetime = { turns: null, waves: null }
    
    setup() {
        super.setup()
        this.lifetime.turns && this.lifetime.turns--
    }

    onTurn() {
        if(this.isExpired()) {
            this.remove()
        }
    }

    onTurnEnd() {
        this.lifetime.turns && this.lifetime.turns--
    }

    onWave() {
        this.lifetime.waves && this.lifetime.waves--
        if(this.isExpired()) {
            this.remove()
        }
    }

    isExpired() {
        return [null, undefined, 0].includes(this.lifetime.turns)
            && [null, undefined, 0].includes(this.lifetime.waves)
    }
}


class StandardWeather extends ExpirableWeather {
    lifetime = { turns: 6 }
    
    _accModifiedMoves = []

    onScene(senario) {
        senario.forEach((move, pokemon) => {
            const powerMod = this._getPowerMod(move)
            pokemon.state.damage.chainModifyPower(move.id, powerMod)
        })

        this.battle.groundedPokemons().forEach(pokemon => {
          pokemon.state.moves
            .filter(move => !this._accModifiedMoves.includes(move))
            .forEach(move => {                
                const acc = this._getNewAccuracy(move)                
                move.accuracy = acc
                this._accModifiedMoves.push(move)
            })
      })
    }

    teardown() {
        super.teardown()
        this._accModifiedMoves.forEach(move => {
            move.accuracy = move._ref.accuracy
        })
    }

    _getPowerMod(move) {
        return 1
    }

    _getNewAccuracy(move) {
        return move.accuracy
    }
}


class SunnyDayWeather extends StandardWeather {
    static weatherName = "sunnyday"

    _getPowerMod(move) {
        if (move.type === "Fire")
            return 1.5
        else if (move.type === "Water")
            return 0.5
        return 1
    }

    _getNewAccuracy(move) {
        const targets = ["thunder", "hurricane"]
        if (targets.includes(move.id))
            return move.accuracy * 0.5
        return move.accuracy
    }
}

class RainDanceWeather extends StandardWeather {
    static weatherName = "RainDance"

    _getPowerMod(move) {
        if (move.type === "Water")
            return 1.5
        else if (move.type === "Fire" || move.id === "solarbeam" || move.id === "solarblade")
            return 0.5
        return 1
    }

    _getNewAccuracy(move) {
        const targets = ["thunder", "hurricane"]        
        if (targets.includes(move.id))
            return true
        return move.accuracy
    }
}

const WEATHERS = makeWeathersMap([
  SunnyDayWeather,
  RainDanceWeather,
])

export class WeatherManager {
    _weather = null;

    constructor(battle) {
        this.battle = battle;
    }
  
    name() {
        return this._weather.constructor.weatherName
    }

    set(source, weatherName) {      
        if (this._freezed) return null
        const WeatherClass = WEATHERS[weatherName]
        if (WeatherClass) {
            this.remove()
            const weather = new WeatherClass(this.battle, source)
            weather.setup()
            this._weather = weather
            return weather
        }
        return null
    }

    remove(weatherName = null) {
        if (weatherName && this.name() !== weatherName) return
        this._weather?.teardown()
        this._weather = null
    }

    freeze() {
        this._freezed = true
    }
    
    unfreeze() {
        this._freezed = false
    }
}


function makeWeathersMap(weathersClass) {
    return weathersClass.reduce((map, w) => {
        map[w.weatherName] = w
        return map
    }, {})
}
