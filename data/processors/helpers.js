export function processor(pipeline) {
    return data => {
        return new Proxy(data, {
            get(target, key) {
                const value = target[key]
                !value._isProcessed && pipeline.forEach(p => p(value, key))
                value._isProcessed = true
                return value;
            }
        })
    }
}