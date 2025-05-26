import process from './processors/abilities.js'
import defaultAbilities from './default/abilities.js'
import extraAbillities from './extras/abilities.js'


// Export processed moves
export default process({
    ...defaultAbilities,
    ...extraAbillities
});
