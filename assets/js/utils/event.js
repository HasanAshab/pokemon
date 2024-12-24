export class EventEmitter {
    constructor() {
        this._events = {};
        this._debouncedEmitters = {};
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

    debounceEmit(event, delay, ...args) {
        if (this._debouncedEmitters[event]) {
            clearTimeout(this._debouncedEmitters[event]);
        }

        this._debouncedEmitters[event] = setTimeout(() => {
            this.emit(event, ...args);
            delete this._debouncedEmitters[event];
        }, delay);
    }

    removeListener(event, listener) {
        if (this._events[event]) {
            this._events[event] = this._events[event].filter(fn => fn !== listener);
        }
    }
}

export class Observable extends EventEmitter {
    constructor() {
        super();
        return this._createProxy(this);
    }

    _createProxy(obj) {
        const self = this;
        return new Proxy(obj, {
            get(target, key) {
                const value = target[key];
                if (typeof value === "object" && value !== null && !(value instanceof EventEmitter)) {
                    return self._createProxy(value);
                }
                return value;
            },
            set(target, key, value) {
                const oldValue = target[key];
                if (oldValue !== value) {
                    target[key] = value;
                    // Use the debounced emit instead of immediate emit
                    self.emit("change", self);
                }
                return true;
            },
        });
    }
}
