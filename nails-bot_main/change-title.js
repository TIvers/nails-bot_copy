import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'dist', 'index.html');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  // Replace <title> and add meta tags
  const updatedContent = data.replace(
    /<title>.*<\/title>/,
    `<script src="https://telegram.org/js/telegram-web-app.js"></script>`
  );

  fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('Script has been updated in index.html');
  });
});