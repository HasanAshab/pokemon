import process from './processors/move.js'
import defaultMoves from './default/moves.js'
import extraMoves from './extras/moves.js'

// Export processed moves
export default process({
    ...defaultMoves,
    ...extraMoves
});
