const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Fix the broken button structure
lines[976] = "            한국어";
lines[977] = "          </button>";
lines[978] = "        </div>";

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('JSX structure fixed.');
