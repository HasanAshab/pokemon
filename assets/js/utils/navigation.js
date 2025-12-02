// Navigation utility to replace URL parameters with localStorage
export const Navigation = {
  prefix: this.isLocalhost() ? '' : '/pokemon',
  isLocalhost() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  },  
  navigateTo(url) {
    window.location.href = this.prefix + url;
  },
  // Pokemon details navigation
  goToPokemonDetails(pokemonName) {
    localStorage.setItem('$last_poke_details', pokemonName);
    this.navigateTo('/poke_details.html');
  },

  // Battle navigation
  goToBattle(fields, system = null) {
    localStorage.setItem('$battle_fields', JSON.stringify(fields));
    if (system) {
      localStorage.setItem('$battle_system', system);
    } else {
      localStorage.removeItem('$battle_system');
    }
    this.navigateTo('/battle.html');
  },

  // Enemy selection navigation
  goToEnemySelect(pokemonName) {
    localStorage.setItem('$enemy_select_pokemon', pokemonName);
    this.navigateTo('/enemy.html');
  },

  // Data page navigation
  goToDataPage(pokemonName) {
    localStorage.setItem('$data_page_pokemon', pokemonName);
    this.navigateTo('/data.html');
  },

  // Kingdom navigation
  goToKingdom(kingdomName) {
    localStorage.setItem('$current_kingdom', kingdomName);
    this.navigateTo('/kingdoms/cms/');
  },

  goToKingdomSection(kingdomName, section) {
    localStorage.setItem('$current_kingdom', kingdomName);
    this.navigateTo(`/kingdoms/cms/${section}/`);
  },

  goToKingdomMilitiaSection(kingdomName, section) {
    localStorage.setItem('$current_kingdom', kingdomName);
    this.navigateTo(`/kingdoms/cms/militia/${section}/`);
  },

  goToBarrackAmmo(kingdomName) {
    localStorage.setItem('$current_kingdom', kingdomName);
    this.navigateTo('/kingdoms/cms/militia/barrack/ammo/');
  },

  // Stock market navigation
  goToStockCMS(stockName) {
    localStorage.setItem('$current_stock', stockName);
    this.navigateTo('/stock_market/cms.html');
  },

  // Company navigation
  goToCompany(companyName) {
    localStorage.setItem('$current_company', companyName);
    this.navigateTo('/company/cms.html');
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