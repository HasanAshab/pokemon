import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

const DIR_PATH = path.resolve('./data/lazy');
const CACHE_DIR = path.resolve('./data/cache');

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create cache directory:', err);
    throw err;
  }
}

async function main(dirPath) {
  await ensureCacheDir();

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => path.join(dirPath, entry.name));

  for (const file of files) {
    console.log(pathToFileURL(file).href)
    const data = await import(pathToFileURL(file).href);

    let exportedValue = null;
    for (const key in data) {
      exportedValue = data[key]; // triggers proxies if present
    }

    const content = `export default ${JSON.stringify(exportedValue, null, 2)};\n`;
    const baseName = path.basename(file);
    const targetPath = path.join(CACHE_DIR, baseName);

    await fs.writeFile(targetPath, content);
  }
}

main(DIR_PATH)
  .then(() => console.log('Done'))
  .catch(console.error);
