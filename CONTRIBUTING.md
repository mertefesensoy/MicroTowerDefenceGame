# Contributing to MicroTowerDefenceGame

## Project Philosophy

This project follows a strict **constitution-driven development** approach:
- **Separation of Concerns**: Core simulation is pure Swift (zero UI dependencies)
- **Deterministic Gameplay**: Seeded RNG ensures reproducibility
- **Data-Driven Design**: All balance in JSON, no magic numbers
- **Mission-Based Development**: Work is delivered in atomic, verifiable missions

## Branch Naming Convention

### Format
`mission/<number>-<short-description>`

### Examples
- `mission/1-core` - Core simulation layer
- `mission/2-sprite-shell` - SpriteKit rendering
- `mission/3-mvp-run-loop` - MVP game loop
- `mission/4-relic-choices` - Roguelite relics
- `mission/5-meta-progression` - Shop and unlocks
- `mission/6-rewarded-ads` - Ad integration

### Rules
- ❌ Never commit directly to `main`
- ✅ One branch per mission
- ✅ Merge via Pull Request only
- ✅ Delete branch after merge

## Commit Style

We use **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `test` - Adding or updating tests
- `chore` - Build, CI, tooling
- `docs` - Documentation only
- `refactor` - Code restructuring (no behavior change)
- `perf` - Performance improvement

### Scopes
- `core` - MicroTDCore package
- `sprite` - SpriteKit rendering
- `ui` - SwiftUI views
- `ci` - CI/CD workflows
- `mission<N>` - Mission-specific work

### Examples
```bash
feat(core): add deterministic RNG
fix(core): stable spawn sorting with (tick, index)
test(core): add golden seed coverage
chore(ci): add no-ui-import check
docs(mission1): add walkthrough
refactor(core): extract combat logic to system
```

### Commit Rules
- **Atomic commits**: One logical change per commit
- **Small commits**: Easier to review and revert
- **Clear messages**: Explain *why*, not just *what*
- **Mission finale**: Last commit = `chore(mission<N>): finalize Mission <N> deliverables`

## How to Run Tests

### Core Package Tests
```bash
cd MicroTDCore
swift build    # Build package
swift test     # Run all tests
swift test --filter <TestName>  # Run specific test
```

### Expected Output
```
✅ Build succeeded
✅ All tests passed
✅ No UI imports in Core
```

### CI Verification
Tests also run automatically in GitHub Actions on every push and PR.

## Development Workflow

### 1. Start New Mission
```bash
git checkout main
git pull
git checkout -b mission/<N>-<description>
```

### 2. Make Changes
- Write code following constitution
- Make atomic commits
- Run tests locally

### 3. Prepare for PR
```bash
git status
git log --oneline  # Review commits
```

### 4. Push Branch
```bash
git push -u origin mission/<N>-<description>
```

### 5. Create Pull Request
- Go to GitHub → Pull Requests → New
- Use PR template (see `MISSION<N>_PR.md`)
- Fill in:
  - Summary
  - Files changed
  - How to verify
  - Acceptance checklist
  - Risks / mitigations
  - Next steps

### 6. Wait for CI
- GitHub Actions will run automatically
- Verify all checks pass (green ✅)
- If fails, fix and push more commits

### 7. Merge
- After CI green + review (if applicable)
- Squash or Merge commits
- Delete branch after merge

### 8. Tag Milestone
```bash
git checkout main
git pull
git tag m<N>-<description>
git push --tags
```

## Mission Acceptance Criteria

Each mission must demonstrate:
- ✅ CI passes (build + tests)
- ✅ No UI imports in Core (enforced by CI)
- ✅ Determinism maintained (golden seeds pass)
- ✅ Constitution compliance
- ✅ Documentation updated

## Code Style

### Core Package Rules
- **No UI imports**: Mechanically enforced by package structure
- **Pure functions**: Prefer stateless where possible
- **Dependency injection**: No global singletons
- **Small files**: Keep under 300 lines
- **Document assumptions**: Add comment block at top of each system

### Example
```swift
// CombatSystem.swift
// Combat logic with instant damage application
//
// Assumptions:
// - Targeting: highest path progress in range
// - Damage: instant (no projectile simulation)
// - Slow: refresh duration, no stack, strongest wins

import Foundation

public final class CombatSystem {
    // ...
}
```

## Testing Philosophy

### Must Have
- Unit tests for core logic
- Golden seed tests for determinism
- Integration tests for system interactions

### Nice to Have
- Performance benchmarks
- Property-based tests
- Fuzz testing

## Questions?

Check these documents:
- `implementation_plan.md` - Technical architecture
- `walkthrough.md` - Mission 1 details
- `github_workflow.md` - Detailed git workflow
- Constitution (original requirements) - The law

## Quick Reference

```bash
# Start mission
git checkout -b mission/<N>-<desc>

# Commit
git add <files>
git commit -m "feat(scope): description"

# Run tests
cd MicroTDCore && swift test

# Push
git push -u origin mission/<N>-<desc>

# After merge
git tag m<N>-<desc>
git push --tags
```

---

**Remember**: The constitution is law. When in doubt, refer to it.
