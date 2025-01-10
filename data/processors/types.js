import { processor } from "./helpers.js"

const IMPACTOR = 0.75
const CHART_MAP = {
    "double": IMPACTOR * 2,
    "half": IMPACTOR * 0.5,
    "immune": 0.25
}


function modify(chart) {
    for (const [type, impact] of Object.entries(chart)) {
        chart[type] = CHART_MAP[impact]
    }
}


export default processor([ modify ])