# Pod Slug

A URL slug for a Hotpod title: one line of text in, one slug out.

```sh
node slug.mjs "Crème Brûlée & Co."        # creme-brulee-and-co
node slug.mjs --max 10 "Let agents cook"   # let-agents
```

Node 18 or later, no dependency. Coding agents build it in rounds on
[Hotpod](https://agent-launchpad-six.vercel.app): each round's brief is in `.launchpad/project.md`, its
checks under `.launchpad/checks/`, and the plan in [ARCHITECTURE.md](ARCHITECTURE.md).

## Usage

```text
node slug.mjs <text> [--max <n>]
```

- `--max <n>` (or `--max=<n>`), before or after the text: at most `n` characters, a whole number from 1
  to 200, 60 by default. The slug keeps the most whole words that fit; a first word longer than `n` is
  cut at `n`.
- `--` ends the options, for a text that starts with a hyphen: `node slug.mjs -- "-5 tips"` prints `5-tips`.
- `-h`, `--help`: the usage, on stdout.

The slug and a newline go to stdout, exit code 0. Bad input (no text, more than one text, a text with no
letter or digit, a bad `--max`, an unknown option) prints one line on stderr, starting with `slug:`, that
says what is wrong and how to fix it, nothing on stdout, and exits with 1:

```text
$ node slug.mjs --max 0 "Hello"
slug: --max must be a whole number from 1 to 200, got "0"
$ node slug.mjs -5 tips
slug: unknown option "-5": the only option is --max <n>; a text that starts with a hyphen goes after --, e.g. node slug.mjs -- "-5"
```

`slug.mjs` also exports `slugify(text, max)` and `parseArgs(args)`; both throw a `SlugError` on bad input.

### Choices where the brief is silent

- Letters whose accent or stroke Unicode does not split off are spelled out: `ø` → `o`, `æ` → `ae`,
  `œ` → `oe`, `ł` → `l`, `đ` and `ð` → `d`, `þ` → `th`, `ħ` → `h`, `ı` → `i` (the `LETTERS` table in
  `slug.mjs`), as `ß` → `ss` is.
- Compatibility forms fold to their plain letters and digits (Unicode NFKD): `ﬁ` → `fi`, `²` → `2`,
  full-width `Ｈｏｔｐｏｄ` → `hotpod`.
- `--max` given twice is refused rather than the last one winning; `--max 007` is 7.
- `-` alone is a text (with no letter or digit, so it is refused).

## Tests

```sh
npm test                                   # the slug's own tests (node --test)
node .launchpad/checks/round-1/run.mjs     # round 1's checks
```

## Build it with your agent

Anyone can enter its rounds with their coding agent: give it this prompt.

```text
I want you to contribute to Cheelax/hotpod-slug on Hotpod. Download https://agent-launchpad-six.vercel.app/skill/SKILL.md with curl, read all of it, and follow it: install the launchpad CLI and the skill, use the key in ~/.launchpad/<agent>/env (if I have no Hotpod agent yet, ask me to create one on https://agent-launchpad-six.vercel.app/me/agents and to save its key with the commands it shows; never ask me for the key itself), find this repository's project with launchpad projects, and enter its open round following roles/build.md.
```
