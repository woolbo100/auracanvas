const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = '<div className="aura-hero-aurora" />';
const replacement = `<div className="aura-hero-aurora" />
                <div className="aura-hero-mist" />
                <div className="aura-hero-vignette" />`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', content, 'utf8');
    console.log('App.tsx updated successfully.');
} else {
    console.log('Target not found in App.tsx');
}
