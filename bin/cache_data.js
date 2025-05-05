import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

const DIR_PATH = path.resolve('./data/lazy');
const CACHE_DIR = path.resolve('./data/cache');

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

// Generate JavaScript-safe export code (not JSON)
function serializeToJs(obj) {
  const entries = Object.entries(obj).map(([key, value]) => {
    if (typeof value === 'function') {
      return `${key}: ${value.toString()}`;
    } else {
      return `${key}: ${JSON.stringify(value, null, 2)}`;
    }
  });
  return `export default {\n  ${entries.join(',\n  ')}\n};\n`;
}

async function main(dirPath) {
  await ensureCacheDir();

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => path.join(dirPath, entry.name));

  for (const file of files) {
    const module = await import(pathToFileURL(file).href);

    let exportedValue = null;
    for (const key in module) {
      exportedValue = module[key]; // use default or named export
    }

    if (typeof exportedValue !== 'object' || exportedValue === null) {
      throw new Error(`Export from ${file} must be an object`);
    }

    const content = serializeToJs(exportedValue);
    const baseName = path.basename(file);
    const targetPath = path.join(CACHE_DIR, baseName);

    await fs.writeFile(targetPath, content);
  }
}

main(DIR_PATH)
  .then(() => console.log('Done'))
  .catch(console.error);
