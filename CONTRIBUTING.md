# Contributing to GSD

We're glad you're here. Contributions are welcome across the entire codebase. We hold a high bar for what gets merged — not to be gatekeepers, but because every change ships to real users and stability matters.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/gsd-build/get-shit-done.git
cd get-shit-done

# Install dependencies
npm install

# Run tests
npm test
```

## Before You Start

1. **Check existing issues.** Someone may already be working on it.
2. **Claim the issue.** Comment on the issue to get it assigned to you before writing code. This prevents duplicate work and wasted effort.
3. **No issue? Create one first** for new features. Bug fixes for obvious problems can skip this step.
4. **Architectural changes require discussion.** If your change touches core systems (agent definitions, workflow engine, tool infrastructure), open an issue describing your approach and get approval before writing code.

## Branching and Commits

Always work on a dedicated branch. Never push directly to `main`.

**Branch naming:** `<type>/<short-description>`

| Type | When to use |
|------|-------------|
| `feat/` | New functionality |
| `fix/` | Bug or defect correction |
| `refactor/` | Code restructuring, no behavior change |
| `test/` | Adding or updating tests |
| `docs/` | Documentation only |
| `chore/` | Dependencies, tooling, housekeeping |
| `ci/` | CI/CD configuration |

**Commit messages** must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

Valid types: `feat` `fix` `docs` `chore` `refactor` `test` `ci` `perf` `build` `revert`

Examples:

```
feat(tools): add milestone status command
fix(security): resolve path traversal on Windows
chore(deps): bump node minimum to 22
docs(contributing): add branch naming conventions
```

Keep branches current by rebasing onto `main` — do not merge `main` into your feature branch:

```bash
git fetch origin
git rebase origin/main
```

## Pull Request Guidelines

### Requirements

- **One concern per PR** — bug fixes, features, and refactors should be separate PRs
- **No drive-by formatting** — don't reformat code unrelated to your change
- **Link issues** — use `Fixes #123` or `Closes #123` in PR body for auto-close
- **CI must pass** — all matrix jobs (Ubuntu, macOS, Windows × Node 22, 24) must be green

### PR Description Format

Every PR needs a **TL;DR** and a **detailed explanation**. Use this structure:

```
## TL;DR

**What:** One sentence — what does this change?
**Why:** One sentence — why is it needed?
**How:** One sentence — what's the approach?

## What

Detailed description of the change. What files, modules, or systems are affected?

## Why

The motivation. What problem does this solve? What was broken, missing, or suboptimal?
Link issues where applicable: `Closes #123`

## How

The approach. How does the implementation work? What were the key decisions?
If this is a non-trivial change, explain the design and any alternatives you considered.
```

### Change Type Checklist

Include in your PR:

- [ ] `feat` — New feature or capability
- [ ] `fix` — Bug fix
- [ ] `refactor` — Code restructuring (no behavior change)
- [ ] `test` — Adding or updating tests
- [ ] `docs` — Documentation only
- [ ] `chore` — Build, CI, or tooling changes

### Breaking Changes

If your PR changes any public API, CLI behavior, config format, or file structure, say so explicitly. Breaking changes need extra scrutiny and may need migration guidance.

## Code Review Process

PRs go through automated CI first, then human review. To help us review efficiently:

- Keep PRs focused and reasonably sized. Massive PRs take longer to review and are more likely to be sent back.
- Respond to review comments. If you disagree, explain why — discussion is welcome.
- If your PR has been open for a while without review, ping the maintainers.

### What Reviewers Verify

1. **Build the branch** — a diff that doesn't build is not reviewable.
2. **Run the test suite** — CI status is a signal, not a substitute for local verification.
3. **Trace root cause for bug fixes** — confirm the diff addresses the root cause, not just the symptom.
4. **Check for regression tests** — bug fixes must include a test that would have caught the original bug.

### What Contributors Must Provide

- **Bug fixes** — include a regression test. A fix without a test is an assertion, not a proof.
- **Features** — include tests covering the primary success path and at least one failure path.
- **Behavior changes** — update or replace any existing tests that cover the changed behavior. Don't leave passing-but-wrong tests in place.

## AI-Assisted Contributions

AI-generated PRs are welcome. We just ask for transparency:

- **Disclose it.** Note that the PR is AI-assisted in your description. Do not credit the AI tool as an author or co-author in the commit or PR.
- **Test it.** AI-generated code must be tested to the same standard as human-written code. "The AI said it works" is not a test plan.
- **Understand it.** You should be able to explain what the code does and why. If a reviewer asks a question, "I'll ask the AI" is not an answer.

AI agents opening PRs must follow the same workflow as human contributors: clean working tree, new branch per task, CI passing before requesting review.

## Architecture Guidelines

Before writing code, understand these principles:

- **Simplicity wins.** Don't add abstractions, helpers, or utilities for one-time operations. Don't design for hypothetical future requirements.
- **Tests are the contract.** Changed behavior? The test suite tells you what you broke.
- **No external dependencies in core.** Keep the core dependency-free. If you need something, implement it or justify the addition.

## Testing Standards

All tests use Node.js built-in test runner (`node:test`) and assertion library (`node:assert`). **Do not use Jest, Mocha, Chai, or any external test framework.**

### Required Imports

```javascript
const { describe, it, test, beforeEach, afterEach, before, after } = require('node:test');
const assert = require('node:assert/strict');
```

### Setup and Cleanup: Use Hooks, Not try/finally

**Always use `beforeEach`/`afterEach` for setup and cleanup.** Do not use `try/finally` blocks for test cleanup — they are verbose, error-prone, and can mask test failures.

```javascript
// GOOD — hooks handle setup/cleanup
describe('my feature', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('does the thing', () => {
    // test body focuses only on the assertion
    assert.strictEqual(result, expected);
  });
});
```

```javascript
// BAD — try/finally is verbose and masks failures
test('does the thing', () => {
  const tmpDir = createTempProject();
  try {
    // test body
    assert.strictEqual(result, expected);
  } finally {
    cleanup(tmpDir);
  }
});
```

### Use Centralized Test Helpers

Import helpers from `tests/helpers.cjs` instead of inlining temp directory creation:

```javascript
const { createTempProject, createTempGitProject, createTempDir, cleanup, runGsdTools } = require('./helpers.cjs');
```

| Helper | Creates | Use When |
|--------|---------|----------|
| `createTempProject(prefix?)` | tmpDir with `.planning/phases/` | Testing GSD tools that need planning structure |
| `createTempGitProject(prefix?)` | Same + git init + initial commit | Testing git-dependent features |
| `createTempDir(prefix?)` | Bare temp directory | Testing features that don't need `.planning/` |
| `cleanup(tmpDir)` | Removes directory recursively | Always use in `afterEach` |
| `runGsdTools(args, cwd, env?)` | Executes gsd-tools.cjs | Testing CLI commands |

### Test Structure

```javascript
describe('featureName', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Additional setup specific to this suite
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('handles normal case', () => {
    // Arrange
    // Act
    // Assert
  });

  test('handles edge case', () => {
    // ...
  });

  describe('sub-feature', () => {
    // Nested describes can have their own hooks
    beforeEach(() => {
      // Additional setup for sub-feature
    });

    test('sub-feature works', () => {
      // ...
    });
  });
});
```

### Node.js Version Compatibility

Tests must pass on:
- **Node 22** (LTS)
- **Node 24** (Current)

Forward-compatible with Node 26. Do not use:
- Deprecated APIs
- Version-specific features not available in Node 22

Safe to use:
- `node:test` — stable since Node 18, fully featured in 22+
- `describe`/`it`/`test` — all supported
- `beforeEach`/`afterEach`/`before`/`after` — all supported
- `t.plan()` — available since Node 22.2
- Snapshot testing — available since Node 22.3

### Assertions

Use `node:assert/strict` for strict equality by default:

```javascript
const assert = require('node:assert/strict');

assert.strictEqual(actual, expected);      // ===
assert.deepStrictEqual(actual, expected);  // deep ===
assert.ok(value);                          // truthy
assert.throws(() => { ... }, /pattern/);   // throws
assert.rejects(async () => { ... });       // async throws
```

### Running Tests

```bash
# Run all tests
npm test

# Run a single test file
node --test tests/core.test.cjs

# Run with coverage
npm run test:coverage
```

## Code Style

- **CommonJS** (`.cjs`) — the project uses `require()`, not ESM `import`
- **No external dependencies in core** — `gsd-tools.cjs` and all lib files use only Node.js built-ins
- **Conventional commits** — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `ci:`

## File Structure

```
bin/install.js          — Installer (multi-runtime)
get-shit-done/
  bin/lib/              — Core library modules (.cjs)
  workflows/            — Workflow definitions (.md)
  references/           — Reference documentation (.md)
  templates/            — File templates
agents/                 — Agent definitions (.md)
commands/gsd/           — Slash command definitions (.md)
tests/                  — Test files (.test.cjs)
  helpers.cjs           — Shared test utilities
docs/                   — User-facing documentation
```

## Security

- **Path validation** — use `validatePath()` from `security.cjs` for any user-provided paths
- **No shell injection** — use `execFileSync` (array args) over `execSync` (string interpolation)
- **No `${{ }}` in GitHub Actions `run:` blocks** — bind to `env:` mappings first

If you find a security vulnerability, **do not open a public issue.** Use GitHub's private vulnerability reporting instead.

## Questions?

Open a discussion on GitHub or file an issue with the `question` label.
