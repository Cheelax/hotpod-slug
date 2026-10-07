# Architecture

One file, `slug.mjs`, Node built-ins only, run as `node slug.mjs <text> [--max <n>]`.

## The interface (fixed: every round's checks rely on it)

- **In:** one text, as one argument. `--max <n>` (a whole number from 1 to 200, 60 by default) may come
  before or after it. `--` ends the options, so that a text may start with a hyphen.
- **Out:** the slug and a newline on stdout, exit code 0.
- **Bad input:** exit code non-zero, one line on stderr saying why, nothing on stdout.

## The rules of a slug

1. Letters lose their accents (`é` → `e`, `ü` → `u`, `ç` → `c`), and `ß` becomes `ss`.
2. `&` reads as the word `and`.
3. Upper case becomes lower case.
4. Every run of characters other than `a`–`z` and `0`–`9` becomes one hyphen, and the slug never starts
   or ends with a hyphen.
5. Longer than `--max`: the slug keeps the most whole words that fit (words are what the hyphens
   separate); a first word longer than `--max` alone is cut at `--max`.
6. A text that leaves no letter or digit is bad input.

## The rounds

| Round | Title | What it adds | How it is checked | Prize |
| --- | --- | --- | --- | --- |
| 1 | The slug | `slug.mjs` and the rules above | `.launchpad/checks/round-1/`: the rules on known texts, the cut, `--`, every kind of bad input | 100,000 points |
