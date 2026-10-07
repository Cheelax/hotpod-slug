// Unit tests of slug.mjs (`npm test`), and the choices it makes where the brief is silent. The round's
// own checks are in .launchpad/checks/; these run the same command line in child processes too.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { cut, DEFAULT_MAX, parseArgs, SlugError, slugify } from "../slug.mjs";

const SLUG = fileURLToPath(new URL("../slug.mjs", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [SLUG, ...args], { encoding: "utf8" });

test("the brief's examples", () => {
  assert.equal(run("Crème Brûlée & Co.").stdout, "creme-brulee-and-co\n");
  assert.equal(run("--max", "10", "Let agents cook tonight").stdout, "let-agents\n");
});

test("rule 1: accents go, ß and the letters normalization cannot split are folded", () => {
  assert.equal(slugify("é ü ç Ñ Å"), "e-u-c-n-a");
  assert.equal(slugify("Straße STRAẞE"), "strasse-strasse");
  assert.equal(slugify("Ærø Œuvre Łódź Đorđe Þór İstanbul"), "aero-oeuvre-lodz-dorde-thor-istanbul");
  assert.equal(slugify("ﬁle Ｔｏｋｙｏ"), "file-tokyo"); // compatibility forms: ligatures, full-width letters
});

test("rules 2 to 4: & is and, lower case, one hyphen per run, none at the ends", () => {
  assert.equal(slugify("R&D"), "r-and-d");
  assert.equal(slugify("Tom&&Jerry"), "tom-and-and-jerry");
  assert.equal(slugify("  --Hello---World--  "), "hello-world");
  assert.equal(slugify("line\nbreak\ttab"), "line-break-tab");
  assert.equal(slugify("日本 Tokyo 2026 🚀"), "tokyo-2026");
});

test("rule 5: the most whole words that fit, or the first word cut", () => {
  assert.equal(cut("let-agents-cook", 10), "let-agents");
  assert.equal(cut("let-agents-cook", 9), "let");
  assert.equal(cut("let-agents-cook", 15), "let-agents-cook"); // exactly --max: kept whole
  assert.equal(cut("hotpod-x", 3), "hot");
  assert.equal(cut("a-verylongword-b", 5), "a"); // words are kept in order: "b" does not jump the long word
  assert.equal(slugify("x".repeat(80)).length, DEFAULT_MAX);
});

test("--max before or after the text, --max=<n> too, -- before a text with a hyphen", () => {
  assert.deepEqual(parseArgs(["--max", "9", "a b"]), { text: "a b", max: 9 });
  assert.deepEqual(parseArgs(["a b", "--max", "9"]), { text: "a b", max: 9 });
  assert.deepEqual(parseArgs(["--max=9", "a b"]), { text: "a b", max: 9 });
  assert.deepEqual(parseArgs(["--max", "007", "a"]), { text: "a", max: 7 }); // a whole number, leading zeros or not
  assert.deepEqual(parseArgs(["--", "--max"]), { text: "--max", max: DEFAULT_MAX });
  assert.equal(run("--max", "1", "--", "-x-").stdout, "x\n");
});

test("bad input: exit code 2, one line on stderr naming what to fix, nothing on stdout", () => {
  const refusals = [
    [[], /no text given; usage:/],
    [["one", "two"], /takes one text, got 2: "one", "two"/],
    [["!!! ???"], /"!!! \?\?\?" leaves nothing to make a slug from/],
    [[""], /"" leaves nothing/],
    [["日本"], /a slug keeps only the letters a-z/],
    [["--max"], /--max takes a whole number from 1 to 200, but none was given/],
    [["--max=", "text"], /but none was given/],
    [["--max", "0", "text"], /got "0"/],
    [["--max", "201", "text"], /got "201"/],
    [["--max", "1.5", "text"], /got "1.5"/],
    [["--max", "-3", "text"], /got "-3"/],
    [["--max", "Let agents cook"], /got "Let agents cook"/], // the text taken for the number
    [["--max", "5", "--max", "6", "text"], /--max is given more than once/],
    [["--wat", "text"], /unknown option "--wat": the only option is --max <n>/],
    [["-5 tips"], /put -- before it/],
    [["two\nlines!", "x"], /"two\\nlines!"/], // a newline in a text stays one line in the message
  ];
  for (const [args, reason] of refusals) {
    const r = run(...args);
    const what = JSON.stringify(args);
    assert.equal(r.status, 2, `${what}: exit code`);
    assert.equal(r.stdout, "", `${what}: stdout`);
    assert.match(r.stderr, /^slug: [^\n]+\n$/, `${what}: one line on stderr`);
    assert.match(r.stderr, reason, what);
  }
  assert.throws(() => slugify("%%%"), SlugError);
});

test("a long text is shortened in a message", () => {
  const r = run("x".repeat(500), "y");
  assert.ok(r.stderr.length < 200, r.stderr);
  assert.match(r.stderr, /"x{40}…"/);
});
