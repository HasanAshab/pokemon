export function processor(pipeline) {
    return data => {
        return new Proxy(data, {
            get(target, key) {
                const value = target[key]
                if (value === undefined) return undefined
                !value._isProcessed && pipeline.forEach(p => p(value, key))
                value._isProcessed = true
                return value;
            }
        })
    }
}

export function setKeyIfNotExists(obj, key, value) {
  if (!obj.hasOwnProperty(key)) {
    obj[key] = value;
  }
}