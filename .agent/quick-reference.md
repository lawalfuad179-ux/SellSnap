# Quick Reference: When to Load What

> Load ONLY what you need. Do NOT load all files at once.

## Task → Required Files Mapping

| Task | Primary File | Secondary (if needed) |
|------|------------|---------------------|
| Build UI component | `skills/component-builder/SKILL.md` | `rules/design-system.md` |
| Build API route | `skills/api-route-scaffolder/SKILL.md` | `rules/architecture.md` |
| Build server action | `skills/api-route-scaffolder/SKILL.md` | None |
| Database migration | `skills/db-migration-runner/SKILL.md` | `rules/architecture.md` |
| Payment/webhook | `skills/flutterwave-integration/SKILL.md` | `rules/security.md` |
| New component (workflow) | `workflows/new-component.md` | `skills/component-builder/SKILL.md` |
| New API route (workflow) | `workflows/new-api-route.md` | `skills/api-route-scaffolder/SKILL.md` |

---

## Files to NEVER Load Together

Do NOT load all rules + all skills at once. This wastes context.

**Good:** "Building a button" → Load only `skills/component-builder/SKILL.md` + `rules/design-system.md`  
**Bad:** Loading 8 files "just in case"

---

## Always-Loaded (Trigger: always_on)

These have `trigger: always_on` and should be referenced, not fully loaded:
- `rules/architecture.md` - for stack questions only
- `rules/security.md` - for payment questions only
- `rules/code-style.md` - for naming/convention questions only

---

## Context Size Guidelines

| Scenario | Max Files | Approx Tokens |
|----------|-----------|--------------|
| Simple question | 1 | ~500 |
| Single task | 2 | ~1,500 |
| Multi-step feature | 3-4 | ~3,000 |
| Full app audit | 6+ | ~6,000+ |

**If your context exceeds 6,000 tokens from agent files, you're doing it wrong.**

---

## Rule of Thumb

> Load files when you NEED them, not before.
> The skill file tells you what else to load.