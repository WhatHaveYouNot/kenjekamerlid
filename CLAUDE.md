# CLAUDE.md — AI Assistant Guide for kenjekamerlid

This file provides guidance for AI assistants (Claude, Copilot, etc.) working in this repository. Update it as the project evolves.

---

## Repository Overview

- **Owner/Org**: WhatHaveYouNot
- **Repo**: kenjekamerlid
- **Remote**: `http://local_proxy@127.0.0.1:46413/git/WhatHaveYouNot/kenjekamerlid`
- **Status**: Newly initialized — no source files yet committed.

This document should be updated as soon as the project type, stack, and conventions are established.

---

## Branch Conventions

- AI-generated feature branches follow the pattern: `claude/<task-slug>-<session-id>`
  - Example: `claude/claude-md-mmnc4s4ut6lfeitf-EZ8QB`
- Never push directly to `main` or `master` without explicit permission.
- Always push to the designated feature branch with:
  ```bash
  git push -u origin <branch-name>
  ```

---

## Git Workflow

1. **Create** the feature branch locally if it does not exist.
2. **Develop** all changes on the designated branch.
3. **Commit** frequently with clear, descriptive messages.
4. **Push** to origin when changes are complete.
5. **Never** amend published commits — create new ones instead.
6. **Never** skip hooks (`--no-verify`) unless explicitly instructed.

---

## Project Structure

> This section is a placeholder. Update it once the project has been scaffolded.

```
kenjekamerlid/
├── CLAUDE.md          # This file
├── README.md          # (to be created)
├── src/               # Application source code
├── tests/             # Test files
├── .github/           # CI/CD workflows (GitHub Actions)
└── ...
```

---

## Development Setup

> Fill in once the stack is chosen. Example placeholders below.

```bash
# Install dependencies
# npm install   (Node/JS)
# pip install -r requirements.txt  (Python)
# cargo build   (Rust)

# Run dev server
# npm run dev

# Run tests
# npm test
```

---

## Testing

- Run all tests before committing changes.
- Do not leave failing tests in a committed state.
- When adding new features, add corresponding tests.

---

## Code Style & Conventions

> Fill in once linting/formatting tools are configured.

- Follow the formatting enforced by the project's linter/formatter (e.g., ESLint + Prettier, Black, rustfmt).
- Run the formatter before committing.
- Prefer small, focused functions and modules.
- Avoid over-engineering: solve the problem at hand, not hypothetical future problems.

---

## Security

- Never commit secrets, API keys, or credentials.
- Use environment variables (`.env`) for sensitive configuration — never commit `.env` files.
- Validate all external inputs at system boundaries.

---

## For AI Assistants

- Read this file at the start of every session.
- Read relevant source files before modifying them.
- Keep changes minimal and focused on the task at hand.
- Do not add unrequested features, refactors, or "improvements."
- Do not create documentation files unless explicitly asked.
- Confirm before taking destructive or irreversible actions (force push, deleting files, dropping data).
- Update this CLAUDE.md whenever the project structure, stack, or conventions change significantly.

---

*Last updated: 2026-03-12*
