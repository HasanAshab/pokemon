// Script to add PWA meta tags to HTML files
// Run this in browser console on each page or use it as reference

const metaTags = `
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#3b82f6">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Pokedex">
  <link rel="manifest" href="./manifest.json">
`;

// Files that need meta tags updated:
const filesToUpdate = [
  'enemy.html',
  'm_enemy.html', 
  'poke_details.html',
  'storage.html',
  'compare.html',
  'data.html',
  'backup_ls.html',
  'company/index.html',
  'company/cms.html',
  'stock_market/index.html',
  'kingdoms/index.html',
  'kingdoms/cms/index.html',
  // ... and all other HTML files
];

console.log('Add these meta tags to HTML files:', metaTags);
console.log('Files to update:', filesToUpdate);