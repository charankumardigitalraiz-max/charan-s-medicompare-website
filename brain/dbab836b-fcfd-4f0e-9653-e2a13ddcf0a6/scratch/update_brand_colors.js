import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../../../src');
const oldColor = /#8059ca/gi;
const newColor = '#321961';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (['.js', '.jsx', '.css', '.html'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (oldColor.test(content)) {
          console.log(`Updating colors in: ${fullPath}`);
          content = content.replace(oldColor, newColor);
          fs.writeFileSync(fullPath, content, 'utf8');
        }
      }
    }
  }
}

walk(targetDir);
console.log('Global color replacement complete!');
