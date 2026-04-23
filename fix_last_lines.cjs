const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const fixes = [
    { line: 413, text: "            {currentLang === 'EN' ? 'Activation complete' : '활성화 완료'}" },
    { line: 977, text: "            한국어" },
    { line: 1860, text: "                            {currentLang === 'EN' ? 'Activation complete' : '활성화 완료'}" },
    { line: 1901, text: "                              {currentLang === 'EN' ? 'Activation Art' : '의식 활성화 도구'}" }
];

fixes.forEach(f => {
    if (lines[f.line - 1]) {
        lines[f.line - 1] = f.text;
    }
});

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Final line-by-line restoration complete.');
