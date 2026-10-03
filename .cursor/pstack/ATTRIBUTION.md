# pstack attribution

These files are Lauren Tan's pstack, vendored so every Cursor agent on this
repository can load them without a marketplace install.

- Source: https://github.com/cursor/plugins/tree/main/pstack
- Commit: `23e4138daa01c42d4969f7a5465f82704e64f798`
- Version: 0.15.6 (`plugin.json`)
- Author: Lauren Tan
- License: MIT. The copyright notice and permission notice are in `LICENSE`
  next to this file. That license covers the skills and agents copied below.

## What is in this repo

| Upstream path | Repo path |
| --- | --- |
| `pstack/skills/` | `.cursor/skills/` |
| `pstack/agents/` | `.cursor/agents/` |
| `pstack/LICENSE` | `.cursor/pstack/LICENSE` |
| `pstack/README.md` | `.cursor/pstack/README.md` |
| `pstack/.cursor-plugin/plugin.json` | `.cursor/pstack/plugin.json` |

`.cursor/skills/` and `.cursor/agents/` are the directories Cursor discovers
for project skills and project subagents. Cloud Agents load project skills
from the repo. They do not need a personal skill sync or a team plugin install.

## What was left upstream

`docs/` and `automations/benny/` are not part of the plugin manifest's
`skills` or `agents` paths. They are not required for `/poteto-mode` or
`poteto-agent`. `skills/poteto-mode/scripts/bun.lock` was omitted. The script
sources are unchanged.

Do not edit the vendored skills in place. Update them by copying a newer
upstream commit and changing the commit line in this file.
