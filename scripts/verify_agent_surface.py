#!/usr/bin/env python3
"""Fail unless pstack is in the directories Cursor actually discovers.

Project skills load from `.cursor/skills/<name>/SKILL.md`.
Project subagents load from `.cursor/agents/*.md`.
Cloud Agents read those paths from the repo. A copy anywhere else is not
the same thing.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / ".cursor" / "skills"
AGENTS = ROOT / ".cursor" / "agents"
PSTACK = ROOT / ".cursor" / "pstack"


def fail(message: str) -> None:
    print(f"FAIL agent-surface: {message}")
    sys.exit(1)


def frontmatter(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        fail(f"{path.relative_to(ROOT)} has no YAML frontmatter")
    end = text.find("\n---\n", 4)
    if end == -1:
        fail(f"{path.relative_to(ROOT)} frontmatter does not close")
    return text[4:end]


def require_fields(path: Path, body: str, fields: tuple[str, ...]) -> None:
    for field in fields:
        if f"{field}:" not in body:
            fail(f"{path.relative_to(ROOT)} frontmatter is missing {field}")


def main() -> None:
    if not SKILLS.is_dir():
        fail(".cursor/skills is missing")
    if not AGENTS.is_dir():
        fail(".cursor/agents is missing")

    skill_files = sorted(SKILLS.glob("*/SKILL.md"))
    if not skill_files:
        fail(".cursor/skills has no SKILL.md files")

    names: list[str] = []
    for path in skill_files:
        body = frontmatter(path)
        require_fields(path, body, ("name", "description"))
        names.append(path.parent.name)

    if "poteto-mode" not in names:
        fail("poteto-mode skill is not under .cursor/skills")
    if "review-lessons" not in names:
        fail("review-lessons skill is not under .cursor/skills")

    agent_path = AGENTS / "poteto-agent.md"
    if not agent_path.is_file():
        fail(".cursor/agents/poteto-agent.md is missing")
    agent_body = frontmatter(agent_path)
    require_fields(agent_path, agent_body, ("name", "description"))
    if "name: poteto-agent" not in agent_body:
        fail("poteto-agent.md name field is not poteto-agent")

    license_path = PSTACK / "LICENSE"
    if not license_path.is_file():
        fail(".cursor/pstack/LICENSE is missing")
    license_text = license_path.read_text(encoding="utf-8")
    if "MIT License" not in license_text or "Lauren Tan" not in license_text:
        fail("pstack LICENSE is not the MIT grant from Lauren Tan")

    attribution = PSTACK / "ATTRIBUTION.md"
    if not attribution.is_file():
        fail(".cursor/pstack/ATTRIBUTION.md is missing")

    rule = ROOT / ".cursor" / "rules" / "poteto-mode.mdc"
    if not rule.is_file():
        fail(".cursor/rules/poteto-mode.mdc is missing")
    rule_body = frontmatter(rule)
    if "alwaysApply: true" not in rule_body:
        fail("poteto-mode rule is not alwaysApply")

    print(f"PASS agent-surface: {len(names)} skills, poteto-agent present")


if __name__ == "__main__":
    main()
