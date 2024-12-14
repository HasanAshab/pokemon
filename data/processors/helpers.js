export function processor(pipeline) {
    return data => {
        for (const key in data) {
            const obj = data[key]
            pipeline.forEach(p => p(obj, key))
        }
        return data
    }
}