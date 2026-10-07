// The slug's own tests: `npm test` (node --test). The rules through slugify(), the command line through
// `node slug.mjs` in a child process, as a person runs it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { DEFAULT_MAX, parseArgs, SlugError, slugify } from "../slug.mjs";

const SLUG = fileURLToPath(new URL("../slug.mjs", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [SLUG, ...args], { encoding: "utf8" });

/** Runs the command line and returns the slug it printed, after checking it succeeded. */
function slugOf(...args) {
  const r = run(...args);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, "");
  assert.match(r.stdout, /^[a-z0-9-]+\n$/);
  return r.stdout.slice(0, -1);
}

/** Runs the command line on bad input and returns its reason, after checking how it refused. */
function refusal(...args) {
  const r = run(...args);
  assert.notEqual(r.status, 0);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /^slug: [^\n]+\n$/, "one line on stderr");
  return r.stderr;
}

test("the brief's examples", () => {
  assert.equal(slugOf("Crème Brûlée & Co."), "creme-brulee-and-co");
  assert.equal(slugOf("--max", "10", "Let agents cook tonight"), "let-agents");
});

test("rule 1: letters lose their accents, ß becomes ss", () => {
  assert.equal(slugify("é ü ç"), "e-u-c");
  assert.equal(slugify("Straße STRAẞE"), "strasse-strasse");
  assert.equal(slugify("Ünïcödé façade"), "unicode-facade");
});

test("rule 1, a choice: letters Unicode does not decompose are spelled out", () => {
  assert.equal(slugify("Øresund Ærø Œuvre Łódź Þór Đorđe"), "oresund-aero-oeuvre-lodz-thor-dorde");
});

test("rule 1, a choice: compatibility forms fold to plain letters and digits", () => {
  assert.equal(slugify("ﬁle Ｈｏｔｐｏｄ x²"), "file-hotpod-x2");
});

test("rule 2: & reads as the word and", () => {
  assert.equal(slugify("R&D"), "r-and-d");
  assert.equal(slugify("Tom & Jerry"), "tom-and-jerry");
  assert.equal(slugify("&"), "and");
});

test("rule 3: upper case becomes lower case", () => {
  assert.equal(slugify("MIXED Case"), "mixed-case");
});

test("rule 4: every other run of characters is one hyphen, none at either end", () => {
  assert.equal(slugify("  --Hello---World--  "), "hello-world");
  assert.equal(slugify("a_b.c/d"), "a-b-c-d");
  assert.equal(slugify("日本 Tokyo 2026 🚀"), "tokyo-2026");
  assert.equal(slugify("tab\there\nnewline"), "tab-here-newline");
});

test("rule 5: --max keeps the most whole words that fit", () => {
  assert.equal(slugify("Let agents cook tonight", 10), "let-agents"); // the words fit exactly
  assert.equal(slugify("Let agents cook tonight", 9), "let"); // the cut falls inside a word
  assert.equal(slugify("Let agents cook tonight", 200), "let-agents-cook-tonight");
  assert.equal(slugify("Hotpod", 3), "hot"); // a first word longer than --max is cut at --max
  assert.equal(slugify("Hotpod rocks", 6), "hotpod");
});

test(`rule 5: the default --max is ${DEFAULT_MAX}`, () => {
  const long = "The quick brown fox jumps over the lazy dog and keeps on running far away";
  assert.equal(slugOf(long), "the-quick-brown-fox-jumps-over-the-lazy-dog-and-keeps-on");
  assert.equal(slugOf("a".repeat(70)), "a".repeat(DEFAULT_MAX));
});

test("--max comes before or after the text, as --max <n> or --max=<n>", () => {
  assert.equal(slugOf("Let agents cook", "--max", "9"), "let");
  assert.equal(slugOf("--max=9", "Let agents cook"), "let");
  assert.equal(slugOf("--max", "1", "Hotpod"), "h");
  assert.equal(slugOf("--max", "200", "Hotpod"), "hotpod");
  assert.equal(slugOf("--max", "007", "Let agents cook"), "let");
});

test("-- ends the options: a text may start with a hyphen", () => {
  assert.equal(slugOf("--", "-5 tips"), "5-tips");
  assert.equal(slugOf("--max", "1", "--", "-x-"), "x");
  assert.equal(slugOf("--", "--max"), "max");
});

test("--help prints the usage on stdout", () => {
  const r = run("--help");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^Usage: node slug\.mjs <text> \[--max <n>\]\n/);
  assert.deepEqual(parseArgs(["-h"]), { help: true });
});

test("bad input: one line on stderr that says what to fix, nothing on stdout", () => {
  assert.match(refusal(), /no text given: node slug\.mjs <text> \[--max <n>\]/);
  assert.match(refusal("one", "two"), /expected one text, got 2 \("one", "two"\): quote a text that has spaces, e\.g\. node slug\.mjs "one two"/);
  assert.match(refusal("!!! ???"), /"!!! \?\?\?" has no letter or digit/);
  assert.match(refusal("日本"), /has no letter or digit/);
  assert.match(refusal(""), /"" has no letter or digit/);
  assert.match(refusal("--max"), /--max needs a whole number from 1 to 200 after it/);
  for (const bad of ["0", "201", "1.5", "abc", "-3", "", "1e2", " 5"]) {
    assert.match(refusal("--max", bad, "text"), new RegExp(`--max must be a whole number from 1 to 200, got ${JSON.stringify(bad)}`));
  }
  assert.match(refusal("--max", "5", "--max", "6", "text"), /--max is given twice/);
  assert.match(refusal("--wat", "text"), /unknown option "--wat": the only option is --max <n>/);
  assert.match(refusal("-5 tips"), /goes after --, e\.g\. node slug\.mjs -- "-5 tips"/);
  assert.match(refusal("line one\nline two\n\n!!!", "x"), /\\n/, "a text is escaped onto the reason's one line");
});

test("a long text is shortened in a reason", () => {
  assert.match(refusal("!".repeat(100)), new RegExp(`"${"!".repeat(39)}…" has no letter`));
});

test("slugify() throws a SlugError, which main() prints", () => {
  assert.throws(() => slugify("???"), SlugError);
  assert.throws(() => parseArgs(["a", "b"]), SlugError);
});
