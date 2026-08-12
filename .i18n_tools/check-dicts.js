/*
 * Verifies every translated dictionary against en.json:
 *   - identical key set (no missing keys, no stray keys)
 *   - identical value shape (string vs array, array length)
 *   - identical HTML tag sequence inside each value
 *   - untranslated values (identical to English) flagged for review
 *
 * Usage: node .i18n_tools/check-dicts.js
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'jekyll', 'i18n');
const en = JSON.parse(fs.readFileSync(path.join(DIR, 'en.json'), 'utf8'));

/* Values whose English form is a proper noun, acronym, or number and is
   expected to stay identical in every language. */
const ALLOW_IDENTICAL = new Set([
    'nav.ai',
    'home.hero.linkAi',
    'about.team.andy.name',
    'about.team.pete.name',
    'about.team.robbie.name'
]);

function flatten(node, prefix, out) {
    Object.keys(node).forEach((key) => {
        if (key === '_readme') return;
        const full = prefix ? prefix + '.' + key : key;
        const value = node[key];
        if (Array.isArray(value)) {
            out.set(full, { type: 'array', length: value.length, value });
        } else if (value && typeof value === 'object') {
            flatten(value, full, out);
        } else {
            out.set(full, { type: 'string', value: String(value) });
        }
    });
    return out;
}

/* <br> is presentational line balancing, and where a line break falls is a
   per-language decision, so it is excluded from the tag comparison. Every
   other tag must survive translation exactly. */
function tags(text) {
    return (String(text).match(/<[^>]+>/g) || [])
        .map((t) => t.replace(/\s+/g, ' ').trim())
        .filter((t) => !/^<br\s*\/?>$/i.test(t))
        .join('|');
}

const base = flatten(en, '', new Map());
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'en.json');

let failures = 0;

files.forEach((file) => {
    const lang = file.replace(/\.json$/, '');
    let dict;
    try {
        dict = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
    } catch (e) {
        console.log(`${lang}: INVALID JSON - ${e.message}`);
        failures++;
        return;
    }
    const flat = flatten(dict, '', new Map());
    const problems = [];
    const identical = [];

    base.forEach((expected, key) => {
        if (!flat.has(key)) {
            problems.push(`missing key: ${key}`);
            return;
        }
        const actual = flat.get(key);
        if (actual.type !== expected.type) {
            problems.push(`type mismatch (${expected.type} -> ${actual.type}): ${key}`);
            return;
        }
        if (expected.type === 'array') {
            if (actual.length !== expected.length) {
                problems.push(`array length ${expected.length} -> ${actual.length}: ${key}`);
                return;
            }
            expected.value.forEach((item, i) => {
                if (tags(item) !== tags(actual.value[i])) {
                    problems.push(`html tags differ: ${key}[${i}]`);
                }
                if (String(item) === String(actual.value[i])) identical.push(`${key}[${i}]`);
            });
            return;
        }
        if (tags(expected.value) !== tags(actual.value)) {
            problems.push(
                `html tags differ: ${key}\n    en: ${tags(expected.value)}\n    ${lang}: ${tags(actual.value)}`
            );
        }
        if (expected.value === actual.value && !ALLOW_IDENTICAL.has(key)) identical.push(key);
    });

    flat.forEach((_, key) => {
        if (!base.has(key)) problems.push(`extra key not in en.json: ${key}`);
    });

    if (problems.length) {
        failures++;
        console.log(`\n${lang}: ${problems.length} problem(s)`);
        problems.forEach((p) => console.log(`  - ${p}`));
    } else {
        console.log(`${lang}: OK (${flat.size} keys)`);
    }
    if (identical.length) {
        console.log(`  untranslated (same as English): ${identical.join(', ')}`);
    }
});

console.log(`\n${files.length} dictionaries checked, ${failures} with problems.`);
process.exit(failures ? 1 : 0);
