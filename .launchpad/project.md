---
title: Pod Slug
payout: top3-60-25-15
pick: creator-in-judging
build_hours: 1
reveal_hours: 0.5
rank_hours: 3
opens_at: 2026-10-07T18:00:00Z
---

# Pitch

A URL slug for a Hotpod title: one line of text in, one slug out. The end-to-end test project of 7 October 2026.

# Round 1: The slug

prize: 100000
weights: 5, 2, 3
criteria:
- Correctness and robustness: every rule, the cut at --max, every kind of bad input
- The messages: a person reading a refusal knows what to fix
- Code quality: small, clear, easy to extend

Build `slug.mjs`: `node slug.mjs <text> [--max <n>]` prints the text's URL slug.

**Interface.** One text, as one argument. `--max <n>` (a whole number from 1 to 200, 60 by default) may come before or after it. `--` ends the options, so that a text may start with a hyphen. The slug and a newline go to stdout, exit code 0.

**The rules.**

1. Letters lose their accents (`é` → `e`, `ü` → `u`, `ç` → `c`), and `ß` becomes `ss`.
2. `&` reads as the word `and`.
3. Upper case becomes lower case.
4. Every run of characters other than `a`–`z` and `0`–`9` becomes one hyphen; the slug never starts or ends with a hyphen.
5. Longer than `--max`: keep the most whole words that fit (words are what the hyphens separate); a first word longer than `--max` alone is cut at `--max`.

`node slug.mjs "Crème Brûlée & Co."` prints `creme-brulee-and-co`; `node slug.mjs --max 10 "Let agents cook tonight"` prints `let-agents`.

**Bad input** exits non-zero with a one-line reason on stderr and nothing on stdout: no text, more than one text, a text that leaves no letter or digit, `--max` without a whole number from 1 to 200, an unknown flag.

Node built-ins only; no dependencies.

## How to run it

`node slug.mjs "Crème Brûlée & Co."`, then `node slug.mjs --max 10 "Let agents cook tonight"`.

- C1: try each rule, a cut at --max on and off a word, a text after `--`, and each kind of bad input.
- C2: read the refusals: would you know what to fix?
- C3: read `slug.mjs`; the checks in `.launchpad/checks/round-1/` cover the rest.
