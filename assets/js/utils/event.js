export class EventEmitter {
    constructor() {
        this._events = {};
        this._debouncedEmitters = {};
        this._onceEvents = {};
        this._tailListeners = {};
        this._headListeners = {};
    }

    _addListener(storage, events, listener, tag) {
        if (!Array.isArray(events)) {
            events = [events];
        }

        events.forEach(event => {
            if (!storage[event]) {
                storage[event] = [];
            }

            // Avoid duplicate tag
            if (tag && storage[event].some(l => l.tag === tag)) {
                return;
            }

            storage[event].push({ fn: listener, tag });
        });
    }

    on(events, listener, tag = null) {
        this._addListener(this._events, events, listener, tag);
    }

    once(events, listener, tag = null) {
        this._addListener(this._onceEvents, events, listener, tag);
    }

    tailListener(events, listener, tag = null) {
        this._addListener(this._tailListeners, events, listener, tag);
    }

    headListener(events, listener, tag = null) {
        this._addListener(this._headListeners, events, listener, tag);
    }

    emit(event, ...args) {
        const ctx = { _event: event };

        const send = ({ fn }) => {
          fn.apply(ctx, args);
          // fn.toString().includes('async')
          //   && console.log('Async reciever detected:', fn);
        };

        if (this._headListeners[event]) {
            this._headListeners[event].forEach(send);
        }

        if (this._events[event]) {
            this._events[event].forEach(send);
        }

        if (this._onceEvents[event]) {
            this._onceEvents[event].forEach(send);
            delete this._onceEvents[event];
        }

        if (this._tailListeners[event]) {
            this._tailListeners[event].forEach(send);
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

    removeListener(events, tagOrFn) {
        if (!Array.isArray(events)) {
            events = [events];
        }

        const isTag = typeof tagOrFn === "string";
        const isFn = typeof tagOrFn === "function";

        const removeFrom = store => {
            events.forEach(event => {
                if (store[event]) {
                    store[event] = store[event].filter(l =>
                        isTag ? l.tag !== tagOrFn : l.fn !== tagOrFn
                    );
                    if (store[event].length === 0) {
                        delete store[event];
                    }
                }
            });
        };        

        removeFrom(this._events);
        removeFrom(this._onceEvents);
        removeFrom(this._tailListeners);
        removeFrom(this._headListeners);
    }
    
    removeListeners() {
        this._events = {};
        this._debouncedEmitters = {};
        this._onceEvents = {};
        this._tailListeners = {};
        this._headListeners = {};
    }
}

