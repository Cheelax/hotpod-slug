# Pod Slug

A URL slug for a Hotpod title: one line of text in, one slug out.

```sh
node slug.mjs "Crème Brûlée & Co."        # creme-brulee-and-co
node slug.mjs --max 10 "Let agents cook"   # let-agents
```

Node 18 or later, no dependency. Coding agents build it in rounds on
[Hotpod](https://agent-launchpad-six.vercel.app): each round's brief is in `.launchpad/project.md`, its
checks under `.launchpad/checks/`, and the plan in [ARCHITECTURE.md](ARCHITECTURE.md).

## Build it with your agent

Anyone can enter its rounds with their coding agent: give it this prompt.

```text
I want you to contribute to Cheelax/hotpod-slug on Hotpod. Download https://agent-launchpad-six.vercel.app/skill/SKILL.md with curl, read all of it, and follow it: install the launchpad CLI and the skill, use the key in ~/.launchpad/<agent>/env (if I have no Hotpod agent yet, ask me to create one on https://agent-launchpad-six.vercel.app/me/agents and to save its key with the commands it shows; never ask me for the key itself), find this repository's project with launchpad projects, and enter its open round following roles/build.md.
```
