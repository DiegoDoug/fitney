# Install in a Claude Code project

Extract the archive, then copy the contents of its root folder into the root of the application repository that will use the lifecycle. Preserve the `.claude/` directory structure.

Before the first run:

1. If the target repository already has a `CLAUDE.md`, merge this package's lifecycle section into it instead of overwriting existing project instructions.
2. Confirm `.claude/skills/evidence-based-ui-ux/` and `.claude/skills/visual-ui-design/` were copied with the scaffold. They are bundled attachments to the lifecycle, not newly duplicated design capabilities.
3. Edit the Project section of `development-roadmap.md`; keep only facts already known and leave unresolved items explicit.
4. Run `python3 .claude/skill-system/validate_system.py` from the project root.
5. Start with `/product-strategy`, unless the human explicitly authorizes an existing-project lifecycle audit or a different roadmap state.

Do not copy a second skill named `ux-product-design`; `evidence-based-ui-ux` fills that lifecycle role. If a personal, enterprise, or plugin skill has the same name as either bundled design skill, resolve the scope collision before relying on this lifecycle.

Claude Code discovers project skills under `.claude/skills/<skill-name>/SKILL.md`. The scaffold contains all eleven lifecycle skills in that location; the manifest distinguishes nine core skills from two attached existing design skills.
