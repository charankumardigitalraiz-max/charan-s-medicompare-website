const fs = require('fs');
const path = require('path');

const profileDir = path.join(__dirname, 'src', 'pages', 'profile');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else {
      callback(filepath);
    }
  }
}

let filesUpdated = 0;

walk(profileDir, (filepath) => {
  const ext = path.extname(filepath);
  if (!['.js', '.jsx', '.ts', '.tsx', '.css'].includes(ext)) {
    return;
  }

  let content = fs.readFileSync(filepath, 'utf8');
  let originalContent = content;

  // Simple direct class swaps for the specific buttons in profile pages
  content = content.replace(/bg-primary hover:bg-\[#6b1fe6\]/g, 'bg-primary-dark hover:bg-primary');
  content = content.replace(/bg-primary hover:bg-\[#6a4ab0\]/g, 'bg-primary-dark hover:bg-primary');
  content = content.replace(/bg-primary hover:bg-\[#6f42c1\]/g, 'bg-primary-dark hover:bg-primary');
  content = content.replace(/bg-primary hover:bg-\[#6d46b8\]/g, 'bg-primary-dark hover:bg-primary');

  // Handle the long button styles
  const searchStyle = 'bg-primary text-white border border-primary transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]';
  const targetStyle = 'bg-primary-dark text-white border border-primary-dark transition-all duration-200 no-underline shadow-none hover:bg-primary hover:border-primary focus:bg-primary focus:border-primary';
  content = content.replace(new RegExp(escapeRegExp(searchStyle), 'g'), targetStyle);

  // For CartOrderCard and AppointmentOrderCard where it might be slightly different
  content = content.replace(/bg-primary text-white border border-primary transition-all duration-200 no-underline shadow-none hover:bg-\[#6f42c1\] hover:border-\[#6f42c1\]/g, 'bg-primary-dark text-white border border-primary-dark transition-all duration-200 no-underline shadow-none hover:bg-primary hover:border-primary');

  // Other isolated occurrences
  content = content.replace(/!bg-primary (![a-zA-Z0-9-/\[\]_]+ )*border border-primary/g, '!bg-primary-dark $1border border-primary-dark');

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Refactored button colors in: ${filepath}`);
    filesUpdated++;
  }
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log(`Finished refactoring profile buttons. Updated ${filesUpdated} files.`);
