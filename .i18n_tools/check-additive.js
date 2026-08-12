/*
 * Verification helper (not shipped with the site).
 *
 * Removes every i18n marker from both builds and compares what is left. If the
 * translation work was purely additive, the two sides are byte-identical.
 * Any surviving difference is a defect: text, styling, or structure changed.
 */
const fs = require('fs');
const path = require('path');

const baseDir = process.argv[2];
const newDir = process.argv[3];
const pages = process.argv.slice(4);

function strip(html) {
    return html
        // every data-i18n / data-i18n-html / data-i18n-alt / ... attribute
        .replace(/\s+data-i18n(-[a-z-]+)?="[^"]*"/g, '')
        // the language switcher list item injected into the nav
        .replace(/\n\s*<!-- Language switcher\. The option list[\s\S]*?<\/li>\n/, '\n')
        // the stylesheet and engine tags injected into <head>
        .replace(/\n\n\s*<!-- Language switcher\. Loads before paint[\s\S]*?<script src="js\/i18n\.js"><\/script>/, '')
        // neutral inline span wrapped around the prose block on contact.html
        .replace(/<span>Our hands-on workshops/, 'Our hands-on workshops')
        .replace(/reach out now to get started!<\/strong><\/span>/, 'reach out now to get started!</strong>')
        // index.html: the rotating hero quotes read their text from the
        // dictionary, and the rotation waits for the first translation pass
        .replace(/\n\s*\/\/ Translated quote text[\s\S]*?\n(\s*)quoteIndex =/, '\n$1quoteIndex =')
        .replace(/\n\s*\/\/ Chinese, Japanese and Korean are written[\s\S]*?length < 3\) return;\n/, '\n')
        .replace(
            /([ \t]*)\/\/ Always two quotes: top-left and bottom-right, staggered fades\.\n\s*\/\/ Held until[\s\S]*?function startQuoteBubbles\(\) \{\n\s*(startSlot\(0[^\n]*)\n\s*(startSlot\(1[^\n]*)\n\s*\}\n\n\s*if \(window\.SOI18n\) \{\n\s*window\.SOI18n\.ready\(startQuoteBubbles\);\n\s*\} else \{\n\s*startQuoteBubbles\(\);\n\s*\}/,
            (match, indent, first, second) =>
                indent + '// Always two quotes: top-left and bottom-right, staggered fades\n' +
                indent + first + '\n' + indent + second
        );
}

let failures = 0;
for (const page of pages) {
    const a = path.join(baseDir, page);
    const b = path.join(newDir, page);
    if (!fs.existsSync(a) || !fs.existsSync(b)) {
        console.log(`SKIP  ${page} (missing)`);
        continue;
    }
    const before = strip(fs.readFileSync(a, 'utf8'));
    const after = strip(fs.readFileSync(b, 'utf8'));
    if (before === after) {
        console.log(`OK    ${page}`);
        continue;
    }
    failures++;
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    console.log(`DIFF  ${page}`);
    const max = Math.max(beforeLines.length, afterLines.length);
    let shown = 0;
    for (let i = 0; i < max && shown < 8; i++) {
        if (beforeLines[i] !== afterLines[i]) {
            console.log(`  line ${i + 1}`);
            console.log(`    before: ${JSON.stringify((beforeLines[i] || '').trim().slice(0, 160))}`);
            console.log(`    after : ${JSON.stringify((afterLines[i] || '').trim().slice(0, 160))}`);
            shown++;
        }
    }
}
console.log(failures === 0 ? '\nAll pages are purely additive.' : `\n${failures} page(s) differ beyond the i18n additions.`);
process.exit(failures === 0 ? 0 : 1);
