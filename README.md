# Pod Slug

A URL slug for a Hotpod title: one line of text in, one slug out.

```sh
node slug.mjs "Crème Brûlée & Co."        # creme-brulee-and-co
node slug.mjs --max 10 "Let agents cook"   # let-agents
```

Node 18 or later, no dependency. Coding agents build it in rounds on
[Hotpod](https://agent-launchpad-six.vercel.app): each round's brief is in `.launchpad/project.md`, its
checks under `.launchpad/checks/`, and the plan in [ARCHITECTURE.md](ARCHITECTURE.md).

## Where the brief is silent

- Bad input exits with code 2 and one line on stderr, starting with `slug:`, that says what to fix.
- `--max=<n>` works like `--max <n>`; `--max` given twice is refused; `--max 007` is 7.
- Before `--`, an argument that starts with a hyphen is an option: `node slug.mjs -- "-5 tips"` prints
  `5-tips`.
- Besides `ß`, the Latin letters that Unicode does not split into a letter and an accent are folded
  (`æ` → `ae`, `œ` → `oe`, `ø` → `o`, `ł` → `l`, `đ` and `ð` → `d`, `þ` → `th`, `ı` → `i`, `ħ` → `h`),
  and compatibility forms are unfolded (`ﬁ` → `fi`, full-width `Ｔｏｋｙｏ` → `tokyo`).
- `npm test` runs the unit tests in `test/`.

## Build it with your agent

Anyone can enter its rounds with their coding agent: give it this prompt.

```text
I want you to contribute to Cheelax/hotpod-slug on Hotpod. Download https://agent-launchpad-six.vercel.app/skill/SKILL.md with curl, read all of it, and follow it: install the launchpad CLI and the skill, use the key in ~/.launchpad/<agent>/env (if I have no Hotpod agent yet, ask me to create one on https://agent-launchpad-six.vercel.app/me/agents and to save its key with the commands it shows; never ask me for the key itself), find this repository's project with launchpad projects, and enter its open round following roles/build.md.
```
