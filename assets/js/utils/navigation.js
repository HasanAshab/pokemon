// Navigation utility to replace URL parameters with localStorage
export const Navigation = {
  // Pokemon details navigation
  goToPokemonDetails(pokemonName) {
    localStorage.setItem('$last_poke_details', pokemonName);
    window.location.href = 'poke_details.html';
  },

  // Battle navigation
  goToBattle(fields, system = null) {
    localStorage.setItem('$battle_fields', JSON.stringify(fields));
    if (system) {
      localStorage.setItem('$battle_system', system);
    } else {
      localStorage.removeItem('$battle_system');
    }
    window.location.href = 'battle.html';
  },

  // Enemy selection navigation
  goToEnemySelect(pokemonName) {
    localStorage.setItem('$enemy_select_pokemon', pokemonName);
    window.location.href = 'enemy.html';
  },

  // Data page navigation
  goToDataPage(pokemonName) {
    localStorage.setItem('$data_page_pokemon', pokemonName);
    window.location.href = 'data.html';
  },

  // Kingdom navigation
  goToKingdom(kingdomName) {
    localStorage.setItem('$current_kingdom', kingdomName);
    window.location.href = '/kingdoms/cms/';
  },

  goToKingdomSection(kingdomName, section) {
    localStorage.setItem('$current_kingdom', kingdomName);
    window.location.href = `/kingdoms/cms/${section}/`;
  },

  goToKingdomMilitiaSection(kingdomName, section) {
    localStorage.setItem('$current_kingdom', kingdomName);
    window.location.href = `/kingdoms/cms/militia/${section}/`;
  },

  goToBarrackAmmo(kingdomName) {
    localStorage.setItem('$current_kingdom', kingdomName);
    window.location.href = '/kingdoms/cms/militia/barrack/ammo/';
  },

  // Stock market navigation
  goToStockCMS(stockName) {
    localStorage.setItem('$current_stock', stockName);
    window.location.href = 'cms.html';
  },

  // Company navigation
  goToCompany(companyName) {
    localStorage.setItem('$current_company', companyName);
    window.location.href = './cms.html';
  },

  // Utility functions to get stored values
  getCurrentPokemon() {
    return localStorage.getItem('$last_poke_details');
  },

  getCurrentKingdom() {
    return localStorage.getItem('$current_kingdom');
  },

  getCurrentStock() {
    return localStorage.getItem('$current_stock');
  },

  getCurrentCompany() {
    return localStorage.getItem('$current_company');
  },

  getBattleFields() {
    const fields = localStorage.getItem('$battle_fields');
    return fields ? JSON.parse(fields) : [];
  },

  getBattleSystem() {
    return localStorage.getItem('$battle_system');
  },

  getEnemySelectPokemon() {
    return localStorage.getItem('$enemy_select_pokemon');
  },

  getDataPagePokemon() {
    return localStorage.getItem('$data_page_pokemon');
  }
};