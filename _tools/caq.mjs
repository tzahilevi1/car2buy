/**
 * Finds unescaped double quotes inside HTML attribute values.
 *
 * Hebrew writes its abbreviations with a gershayim that keyboards produce as a
 * plain ASCII double quote: בע"מ, ש"ח, ח"פ, ת"י. Inside an attribute delimited
 * by the same character it closes the value early, and everything after it in
 * that element is re-read as new attributes. The tag still ends at the next
 * `>`, so the page looks fine and validates as "HTML"; what actually happens
 * is that the text after the quote opens a new quoted value that runs to the
 * next quote anywhere in the document, swallowing whatever sits between.
 *
 * On this site one of these in a meta description silently removed the
 * canonical link and the h1 from every parser's view of the page — nothing
 * rendered wrong, and two audit findings pointed at the page rather than at
 * the quote.
 *
 * Usage:
 *   node _tools/check-attr-quotes.mjs          (report)
 *   node _tools/check-attr-quotes.mjs --fix    (replace with the real gershayim)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const SKIP = new Set(['_dist', '_wp-archive', '_tools', '_shots', '.git', 'node_modules', '.wrangler']);
const FIX = process.argv.includes('--fix');

/* U+05F4 is the Hebrew punctuation gershayim. It is the correct character for
   these abbreviations, it renders identically, and it is not the attribute
   delimiter — so it cannot break a tag. */
const GERSHAYIM = '״';

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

/**
 * Walks a tag's attributes tracking which delimiter is open.
 *
 * The first version matched Hebrew-quote-Hebrew anywhere inside a tag, which
 * is wrong in the one case that matters most: `data-v='חברה בע"מ'` is
 * perfectly valid, because a double quote inside a single-quoted value is
 * just a character. Rewriting it there does not fix markup, it edits a value
 * — and that value travelled with the lead into the CRM, where it would no
 * longer match the same answer sent from the other code path.
 *
 * Only a double quote inside a double-quoted value can end the value early,
 * so only that is reported.
 */
function breakingQuotes(attrs) {
  const out = [];
  let quote = null;
  for (let i = 0; i < attrs.length; i++) {
    const c = attrs[i];
    if (!quote) { if (c === '"' || c === "'") quote = c; continue; }
    if (c !== quote) continue;
    /* The closing delimiter, unless a Hebrew letter sits on both sides — in
       which case it is a gershayim inside the value and it ends the value by
       accident. */
    const before = attrs[i - 1] || '';
    const after = attrs[i + 1] || '';
    const heb = ch => /[֐-׿]/.test(ch);
    if (quote === '"' && heb(before) && heb(after)) { out.push(i); continue; }
    quote = null;
  }
  return out;
}

let files = 0;
let hits = 0;
const report = [];

for (const file of htmlFiles(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let out = src;
  let touched = 0;

  /* Walk the whole file rather than the attribute matches, because the point
     is the quotes the attribute regex cannot see: once a value is broken, the
     rest of the tag is no longer an attribute to match against. */
  out = out.replace(/<([a-z][a-z0-9]*)([^>]*)>/gi, (whole, tag, attrs) => {
    const at = breakingQuotes(attrs);
    if (!at.length) return whole;
    const chars = [...attrs];
    for (const i of at) {
      report.push(`${rel}  <${tag}>  ${attrs.slice(Math.max(0, i - 3), i + 4)}`);
      chars[i] = GERSHAYIM;
      touched++;
    }
    return `<${tag}${chars.join('')}>`;
  });

  files++;
  if (touched) {
    hits += touched;
    if (FIX) fs.writeFileSync(file, out);
  }
}

console.log(`נסרקו ${files} קבצים.`);
if (!hits) { console.log('לא נמצאו גרשיים לא מוברחים בתוך תכונות.'); process.exit(0); }
console.log(`${hits} גרשיים שוברי-תגית ב-${new Set(report.map(r => r.split('  ')[0])).size} קבצים:`);
for (const r of report) console.log('  ' + r);
if (FIX) console.log(`\nתוקנו. הוחלפו ב-U+05F4 (גרשיים עברי) שנראה זהה ולא סוגר תכונה.`);
else console.log('\nהרצה עם --fix כדי להחליף.');
process.exit(FIX ? 0 : 1);
