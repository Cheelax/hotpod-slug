#!/usr/bin/env node
// Pod Slug: `node slug.mjs <text> [--max <n>]` prints the text's URL slug.
//
// slugify() holds the rules of a slug and parseArgs() the command line; main() only wires them to stdout,
// stderr and the exit code. Bad input throws a SlugError: its message is the one line printed on stderr.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const DEFAULT_MAX = 60;
export const MAX_LIMIT = 200;
const USAGE = "node slug.mjs <text> [--max <n>]";
const HELP = `Usage: ${USAGE}
Prints the URL slug of <text>: accents removed, & read as "and", lower case, words of a-z and 0-9 joined by hyphens.
  --max <n>  at most n characters, a whole number from 1 to ${MAX_LIMIT} (default ${DEFAULT_MAX}), cut between words
  --         ends the options, for a text that starts with a hyphen: node slug.mjs -- "-5 tips"
`;

/** Letters whose accent or stroke Unicode does not split off (rule 1), spelled out. Add one here. */
const LETTERS = { ß: "ss", æ: "ae", œ: "oe", ø: "o", ł: "l", đ: "d", ð: "d", þ: "th", ħ: "h", ı: "i" };
const LETTER = new RegExp(`[${Object.keys(LETTERS).join("")}]`, "g");

/** Bad input: the message says what is wrong and how to fix it, on one line. */
export class SlugError extends Error {}

/**
 * The slug of `text`, at most `max` characters long. Throws a SlugError when the text leaves no letter
 * or digit to keep.
 */
export function slugify(text, max = DEFAULT_MAX) {
  const slug = text
    .normalize("NFKD") // é → e + an accent; compatibility forms too: ﬁ → fi, ² → 2, full-width Ａ → A
    .replace(/\p{M}/gu, "") // 1. letters lose their accents
    .toLowerCase() // 3. upper case becomes lower case
    .replace(LETTER, (c) => LETTERS[c]) // 1. ß → ss, and the letters Unicode does not decompose
    .replace(/&/g, " and ") // 2. & reads as the word "and"
    .replace(/[^a-z0-9]+/g, "-") // 4. every other run of characters becomes one hyphen…
    .replace(/^-|-$/g, ""); // …and none starts or ends the slug
  if (slug === "") {
    throw new SlugError(`${show(text)} has no letter or digit to make a slug of: a slug keeps only a-z and 0-9, once accents are removed`);
  }
  return cut(slug, max);
}

/** Rule 5: the most whole words that fit in `max` characters, or the first word cut at `max` if it alone does not fit. */
function cut(slug, max) {
  if (slug.length <= max) return slug;
  // The last hyphen at or before `max` ends the last word that fits (at `max` itself: the words fit exactly).
  const end = slug.lastIndexOf("-", max);
  return end === -1 ? slug.slice(0, max) : slug.slice(0, end);
}

/**
 * The command line: one text and `--max <n>` (or `--max=<n>`) in either order, `--` ending the options.
 * Returns `{ text, max }`, or `{ help: true }` for `-h` and `--help`. Throws a SlugError on bad input.
 */
export function parseArgs(args) {
  const texts = [];
  let max;
  let optionsEnded = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (optionsEnded || !arg.startsWith("-") || arg === "-") texts.push(arg);
    else if (arg === "--") optionsEnded = true;
    else if (arg === "-h" || arg === "--help") return { help: true };
    else if (arg === "--max" || arg.startsWith("--max=")) {
      if (max !== undefined) throw new SlugError(`--max is given twice: give it once, e.g. --max ${max}`);
      max = parseMax(arg === "--max" ? args[++i] : arg.slice("--max=".length));
    } else {
      throw new SlugError(`unknown option ${show(arg)}: the only option is --max <n>; a text that starts with a hyphen goes after --, e.g. node slug.mjs -- ${show(arg)}`);
    }
  }
  if (texts.length === 0) throw new SlugError(`no text given: ${USAGE}`);
  if (texts.length > 1) {
    throw new SlugError(`expected one text, got ${texts.length} (${texts.map(show).join(", ")}): quote a text that has spaces, e.g. node slug.mjs ${show(texts.join(" "))}`);
  }
  return { text: texts[0], max: max ?? DEFAULT_MAX };
}

/** The value of `--max`: a whole number from 1 to MAX_LIMIT, written with digits only. */
function parseMax(value) {
  if (value === undefined) throw new SlugError(`--max needs a whole number from 1 to ${MAX_LIMIT} after it, e.g. --max ${DEFAULT_MAX}`);
  const n = /^[0-9]+$/.test(value) ? Number(value) : NaN;
  if (!(n >= 1 && n <= MAX_LIMIT)) throw new SlugError(`--max must be a whole number from 1 to ${MAX_LIMIT}, got ${show(value)}`);
  return n;
}

/** A value as a message shows it: quoted, escaped onto one line, shortened past 40 characters. */
function show(value) {
  const chars = [...value];
  return JSON.stringify(chars.length > 40 ? `${chars.slice(0, 39).join("")}…` : value);
}

/** Runs the command line: the slug on stdout and exit code 0, or one line on stderr and exit code 1. */
export function main(args) {
  try {
    const options = parseArgs(args);
    process.stdout.write(options.help ? HELP : `${slugify(options.text, options.max)}\n`);
  } catch (e) {
    if (!(e instanceof SlugError)) throw e;
    process.stderr.write(`slug: ${e.message}\n`);
    process.exitCode = 1;
  }
}

/** Whether Node runs this file as the program (`node slug.mjs`, or a link to it), not as an import. */
function isProgram() {
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isProgram()) main(process.argv.slice(2));
