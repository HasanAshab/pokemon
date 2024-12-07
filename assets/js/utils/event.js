export class EventEmitter {
    constructor() {
        this._events = {};
    }

    on(event, listener) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(listener);
    }

    emit(event, ...args) {
        if (this._events[event]) {
            this._events[event].forEach(listener => listener(...args));
        }
    }

    removeListener(event, listener) {
        if (this._events[event]) {
            this._events[event].splice(this._events[event].indexOf(listener), 1);
        }
    }
}


export class Observable extends EventEmitter {
    constructor() {
        super();
        // Wrap the instance in a Proxy
        return this._createProxy(this);
    }

    _createProxy(obj) {
        const self = this; // Preserve context for event emission
        return new Proxy(obj, {
            get(target, key) {
                const value = target[key];
                // Recursively wrap nested objects
                if (typeof value === "object" && value !== null && !(value instanceof EventEmitter)) {
                    return self._createProxy(value);
                }
                return value;
            },
            set(target, key, value) {
                const oldValue = target[key];
                if (oldValue !== value) {
                    target[key] = value;
                    // Emit a "change" event with details
                    self.emit("change", self);
                }
                return true;
            },
        });
    }
}
