# Memory Bank — Usage Guide

## What is this?
The Memory Bank is a persistent knowledge base for the Image2PDF project. It captures project context, architecture decisions, patterns, and progress so that AI coding agents and human developers can quickly understand the project state without re-reading all source files.

## File Structure

```
memory-bank/
├── README.md              # ← This file: usage and maintenance guide
├── projectbrief.md        # Core purpose, goals, features, constraints
├── productContext.md      # Why the project exists, UX goals, problems solved
├── systemPatterns.md      # Architecture, design patterns, component communication
├── techContext.md         # Tech stack, libraries, testing, deployment
├── activeContext.md       # Current focus, recent changes, known issues, next steps
└── progress.md            # Feature status (✅/⚠️/❌), test coverage, bugs
```

## How to Use

### For AI Coding Agents
1. **Always start here** — Read all 6 files before making any changes.
2. **Follow documented patterns** — Refer to `systemPatterns.md` for architecture decisions.
3. **Update context after work** — Update `activeContext.md` and `progress.md` after changes.
4. **Don't reinvent** — Check `systemPatterns.md` and `progress.md` before writing new code.

### For Human Developers
1. **Onboarding** — Read all files to get up to speed with the project.
2. **Before a work session** — Read `activeContext.md` to see what's in progress.
3. **During development** — Reference `systemPatterns.md` to maintain consistency.
4. **After a work session** — Update `activeContext.md` and `progress.md`.

## File Relationships

```
projectbrief.md
    └─ defines WHAT the project builds
        └─ productContext.md ─ explains WHY (problems, UX)
        └─ systemPatterns.md ─ explains HOW (architecture, patterns)
            └─ techContext.md ─ explains WITH WHAT (stack, tools)
            └─ activeContext.md ─ explains WHERE WE ARE NOW
                └─ progress.md ─ explains HOW FAR WE'VE GONE
```

## Maintenance Rules

1. **Keep it honest** — If the code changes, update the Memory Bank. Stale docs are worse than no docs.
2. **Keep it concise** — Don't duplicate what's obvious from the code. Focus on decisions, not implementation details.
3. **Keep it current** — Update `activeContext.md` at the end of every work session.
4. **Keep it forward-looking** — `progress.md` should reflect the current reality, not aspirations.

## Git Workflow
```bash
# Memory Bank changes should be committed alongside related code changes
# Example:
git add memory-bank/ .
git commit -m "docs: update memory bank after implementing feature X"
```
