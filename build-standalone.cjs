const fs = require('fs');
const path = require('path');
const ROOT = '/home/user/lts-pricing-calculator';
const r = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString('base64');

// IMPORTANT: use FUNCTION replacements so '$' / '$$' in JS content is inserted
// literally (a string replacement would treat $$ as a special pattern).
const put = (hay, find, replacement) => {
  if (!hay.includes(find)) throw new Error('missing: ' + find);
  return hay.replace(find, () => replacement);
};

let html = r('index.html');
let css = r('css/styles.css');

const heroPatternUri = 'data:image/svg+xml;base64,' + b64('assets/hero-pattern.svg');
css = put(css, 'url("../assets/hero-pattern.svg")', `url("${heroPatternUri}")`);

html = put(html, '<link rel="stylesheet" href="css/styles.css" />', '<style>\n' + css + '\n</style>');

const calcUri = 'data:image/svg+xml;base64,' + b64('assets/hero-calculator.svg');
html = put(html, 'src="assets/hero-calculator.svg"', `src="${calcUri}"`);

for (const f of ['js/data.js', 'js/calculator.js', 'js/export.js', 'js/app.js']) {
  html = put(html, `<script src="${f}"></script>`, '<script>\n' + r(f) + '\n</script>');
}

const leftovers = [/href="css\//, /src="js\//, /src="assets\//].filter((re) => re.test(html));
if (leftovers.length) throw new Error('unreplaced local refs remain');

const outDir = path.join(ROOT, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'LTS-Pricing-Calculator.html');
fs.writeFileSync(outFile, html);

// self-check: $$ helper must survive intact, and no double-declared $
const dist = fs.readFileSync(outFile, 'utf8');
if (!dist.includes('const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));'))
  throw new Error('SELF-CHECK FAILED: $$ helper was corrupted');
console.log('WROTE ' + outFile + ' (' + (dist.length/1024).toFixed(1) + ' KB) — $$ helper intact');
