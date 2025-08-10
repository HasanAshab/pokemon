export class EventEmitter {
    constructor() {
        this._events = {};
        this._debouncedEmitters = {};
        this._onceEvents = {};
        this._tailListeners = {};
    }

    on(events, listener) {
        if (!Array.isArray(events)) {
            events = [events]; // Convert single event to an array
        }

        events.forEach(event => {
            if (!this._events[event]) {
                this._events[event] = [];
            }
            this._events[event].push(listener);
        });
    }

    once(events, listener) {
        if (!Array.isArray(events)) {
            events = [events]; // Convert single event to an array
        }

        events.forEach(event => {
            if (!this._onceEvents[event]) {
                this._onceEvents[event] = [];
            }
            
            this._onceEvents[event].push(listener);
        });
    }

    tailListener(events, listener) {
        if (!Array.isArray(events)) {
            events = [events]; // Convert single event to an array
        }

        events.forEach(event => {
            if (!this._tailListeners[event]) {
                this._tailListeners[event] = [];
            }
            this._tailListeners[event].push(listener);
        });
    }

    // BUG: Unconsistent CTX
    emit(event, ...args) {
        if (this._events[event]) {
            const ctx = {
                _event: event,
            }
            this._events[event].forEach(listener => listener.apply(ctx, args));
        }

        if (this._onceEvents[event]) {
            this._onceEvents[event].forEach(listener => listener.apply(this, args));
            delete this._onceEvents[event];
        }
        if (this._tailListeners[event]) {
            this._tailListeners[event].forEach(listener => listener.apply(this, args));
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

    removeListener(events, listener) {
        if (!Array.isArray(events)) {
            events = [events]; // Convert single event to an array
        }

        events.forEach(event => {
            if (this._events[event]) {
                this._events[event] = this._events[event].filter(fn => fn !== listener);
            }
            if (this._onceEvents[event]) {
                this._onceEvents[event] = this._onceEvents[event].filter(fn => fn !== listener);
            }
            if (this._tailListeners[event]) {
                this._tailListeners[event] = this._tailListeners[event].filter(fn => fn !== listener);
            }
        });
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
                    self.debounceEmit("change", 100, self);
                }
                return true;
            },
        });
    }
}
