#!/usr/bin/env node
// Pod Slug: `node slug.mjs <text> [--max <n>]` prints the text's URL slug (README.md, ARCHITECTURE.md).
// Bad input exits with 2 and one line on stderr saying what to fix. Node built-ins only.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const DEFAULT_MAX = 60;
export const MAX_LIMIT = 200;
const USAGE = 'usage: node slug.mjs <text> [--max <n>], e.g. node slug.mjs --max 40 "Crème Brûlée & Co."';

/**
 * Latin letters that Unicode normalization does not split into a base letter and an accent, lower case
 * (the text is lower-cased first). Rule 1 names `ß`; the others are folded the same way. Add a letter here.
 */
const FOLD = { ß: "ss", æ: "ae", œ: "oe", ø: "o", đ: "d", ð: "d", ł: "l", þ: "th", ı: "i", ħ: "h" };
const FOLDABLE = new RegExp(`[${Object.keys(FOLD).join("")}]`, "g");

/** Bad input: its message tells the person what to fix. */
export class SlugError extends Error {}

/** The slug of `text`, at most `max` characters; throws a SlugError when no letter or digit is left. */
export function slugify(text, max = DEFAULT_MAX) {
  const slug = text
    .normalize("NFKD") // rule 1: "é" becomes "e" and an accent, "ﬁ" becomes "fi"
    .replace(/\p{M}/gu, "") // rule 1: drop the accents
    .toLowerCase() // rule 3
    .replace(FOLDABLE, (letter) => FOLD[letter]) // rule 1: "ß" becomes "ss"
    .replace(/&/g, " and ") // rule 2
    .replace(/[^a-z0-9]+/g, "-") // rule 4: every other run is one hyphen...
    .replace(/^-|-$/g, ""); // ...and none at either end
  if (slug === "") {
    throw new SlugError(`${quote(text)} leaves nothing to make a slug from: a slug keeps only the letters a-z (accents removed) and the digits 0-9`);
  }
  return cut(slug, max);
}

/** Rule 5: the most whole words of `slug` that fit in `max` characters, or its first word cut at `max`. */
export function cut(slug, max) {
  if (slug.length <= max) return slug;
  const [first, ...rest] = slug.split("-");
  if (first.length > max) return first.slice(0, max);
  let kept = first;
  for (const word of rest) {
    if (kept.length + 1 + word.length > max) break;
    kept += `-${word}`;
  }
  return kept;
}

/** `{ text, max }` from the command line's arguments; throws a SlugError on bad input. */
export function parseArgs(args) {
  const texts = [];
  let max;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      texts.push(...args.slice(i + 1));
      break;
    }
    if (arg === "--max" || arg.startsWith("--max=")) {
      if (max !== undefined) throw new SlugError("--max is given more than once: give it once");
      max = parseMax(arg === "--max" ? args[++i] : arg.slice("--max=".length));
    } else if (arg.startsWith("-")) {
      throw new SlugError(`unknown option ${quote(arg)}: the only option is --max <n>; to slug a text that starts with a hyphen, put -- before it`);
    } else {
      texts.push(arg);
    }
  }
  if (texts.length === 0) throw new SlugError(`no text given; ${USAGE}`);
  if (texts.length > 1) {
    throw new SlugError(`takes one text, got ${texts.length}: ${texts.map(quote).join(", ")} (put a text with spaces in quotes)`);
  }
  return { text: texts[0], max: max ?? DEFAULT_MAX };
}

/** The value of --max: a whole number from 1 to MAX_LIMIT. */
function parseMax(value) {
  const wanted = `--max takes a whole number from 1 to ${MAX_LIMIT}`;
  if (value === undefined || value === "") throw new SlugError(`${wanted}, but none was given: e.g. --max 40`);
  const n = /^[0-9]+$/.test(value) ? Number(value) : NaN;
  if (!(n >= 1 && n <= MAX_LIMIT)) throw new SlugError(`${wanted}, got ${quote(value)}`);
  return n;
}

/** `text` in double quotes on one line, shortened when long, for a message. */
function quote(text) {
  const chars = [...text];
  return JSON.stringify(chars.length > 40 ? `${chars.slice(0, 40).join("")}…` : text);
}

/** Runs the command line: the slug on stdout, or one line on stderr and exit code 2. */
export function main(args) {
  try {
    const { text, max } = parseArgs(args);
    process.stdout.write(`${slugify(text, max)}\n`);
  } catch (error) {
    if (!(error instanceof SlugError)) throw error;
    process.stderr.write(`slug: ${error.message}\n`);
    process.exitCode = 2;
  }
}

// Run as a command (node slug.mjs, or the `slug` bin link), not when imported.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
