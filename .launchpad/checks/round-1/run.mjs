// Round 1's checks: `node slug.mjs <text> [--max <n>]` prints the text's URL slug. The entry runs in child
// processes only (lib/entry.mjs); the brief is in .launchpad/project.md.
import { check, harness } from "./lib/harness.mjs";
import { entry, refuses, succeeds } from "./lib/entry.mjs";

const { test, done } = harness();
const slug = entry("node", ["slug.mjs"]);

/** The slug the entry prints for `args`: one line, then a newline. */
async function slugOf(args) {
  const r = await succeeds(slug, args, JSON.stringify(args));
  check(r.out.endsWith("\n") && !r.out.slice(0, -1).includes("\n"), `${JSON.stringify(args)}: printed ${JSON.stringify(r.out)}, expected one line`);
  return r.out.slice(0, -1);
}

async function expect(args, want) {
  const got = await slugOf(args);
  check(got === want, `${JSON.stringify(args)}: printed ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
}

await test("turns words into a lowercase slug", async () => {
  await expect(["Pod Badge: The Badge!"], "pod-badge-the-badge");
  await expect(["Hello World 2026"], "hello-world-2026");
  await expect(["MIXED case"], "mixed-case");
});

await test("folds accents and reads & as and", async () => {
  await expect(["Crème Brûlée & Co."], "creme-brulee-and-co");
  await expect(["Straße"], "strasse");
  await expect(["Ünïcödé façade"], "unicode-facade");
  await expect(["R&D"], "r-and-d");
});

await test("collapses separators and trims hyphens", async () => {
  await expect(["  --Hello---World--  "], "hello-world");
  await expect(["a_b.c/d"], "a-b-c-d");
  await expect(["rock'n'roll"], "rock-n-roll");
  await expect(["日本 Tokyo 2026 🚀"], "tokyo-2026");
});

await test("cuts at --max on a word boundary, 60 by default", async () => {
  await expect(["--max", "10", "Let agents cook tonight"], "let-agents");
  await expect(["Let agents cook tonight", "--max", "9"], "let");
  await expect(["--max", "3", "Hotpod"], "hot");
  await expect(["--max", "200", "Let agents cook"], "let-agents-cook");
  const long = "The quick brown fox jumps over the lazy dog and keeps on running far away";
  await expect([long], "the-quick-brown-fox-jumps-over-the-lazy-dog-and-keeps-on");
  const got = await slugOf([long]);
  check(got.length <= 60, `the default cut is 60 characters at most, got ${got.length}`);
});

await test("takes a text that starts with a hyphen after --", async () => {
  await expect(["--", "-5 tips"], "5-tips");
  await expect(["--max", "1", "--", "-x-"], "x");
});

await test("refuses bad input with a reason on stderr and nothing on stdout", async () => {
  await expect(["ok"], "ok"); // an entry that refuses everything does not pass
  await refuses(slug, [], "no text");
  await refuses(slug, ["!!! ???"], "a text with no letter or digit");
  await refuses(slug, ["日本"], "a text with no letter or digit a slug can hold");
  await refuses(slug, ["one", "two"], "two texts");
  await refuses(slug, ["--max"], "--max without a number");
  await refuses(slug, ["--max", "0", "text"], "--max 0");
  await refuses(slug, ["--max", "201", "text"], "--max 201");
  await refuses(slug, ["--max", "1.5", "text"], "--max 1.5");
  await refuses(slug, ["--max", "abc", "text"], "--max abc");
  await refuses(slug, ["--wat", "text"], "an unknown flag");
  for (const args of [["!!! ???"], ["--wat", "x"]]) {
    const r = await slug(args);
    check(r.err.trim().split("\n").length === 1, `${JSON.stringify(args)}: the reason is one line, got ${JSON.stringify(r.err)}`);
  }
});

done();
