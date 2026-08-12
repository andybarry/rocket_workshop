const fs = require('fs');

function strip(html) {
    return html.replace(/\s+data-i18n(-[a-z-]+)?="[^"]*"/g, '');
}

const a = strip(fs.readFileSync(process.argv[2], 'utf8')).split('\n');
const b = strip(fs.readFileSync(process.argv[3], 'utf8')).split('\n');
console.log('line counts:', a.length, b.length);
for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
        console.log('line ' + (i + 1));
        console.log('  base: ' + JSON.stringify(a[i]));
        console.log('  new : ' + JSON.stringify(b[i]));
    }
}
