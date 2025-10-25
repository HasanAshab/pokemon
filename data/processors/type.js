import { processor } from "./helpers.js"

const HALF = 0.75
export const CHART_MAP = {
    "double": 1 / HALF,
    "half": HALF,
    "immune": HALF * 0.5
}


function modify(chart) {
    for (const [type, impact] of Object.entries(chart)) {
        chart[type] = CHART_MAP[impact]
    }
}


export default processor([ modify ])