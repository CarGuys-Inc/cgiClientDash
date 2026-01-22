# Git & UI Development Conventions

Follow these rules strictly for all branch creation, commit messages, and UI component development.

## 1. Branch Naming
All branches must be prefixed with the user's identifier followed by the change type.
Pattern: `{user}/<type>/<short-description>`

- Format: Lowercase, kebab-case, use slashes for hierarchy.
- Types: feat, fix, docs, style, refactor, perf, test, chore.
- Example: `jdoe/feat/ui-login-screen`

## 2. Commit Messages
All commit messages must follow the `{user}: <type>(<scope>): <description>` pattern.

- User Prefix: Always start with `{user}: `
- UI Scopes: When working on the interface, use scopes like `(ui)`, `(component)`, or `(layout)`.
- Imperative Mood: Use "add" not "added", "fix" not "fixes".
- Example: `jdoe: feat(ui): implement glassmorphism card component`
- Example: `jdoe: fix(ui): resolve padding issue on mobile headers`

## 3. UI Feature Guidelines
When a "feat" involves UI changes:
- Consistency: Ensure new UI elements match the existing design tokens (colors, spacing, typography).
- Responsive: Always consider mobile-first styles for `feat(ui)` tasks.
- Accessibility: Include ARIA labels and keyboard navigation for new interactive elements.

## 4. Workflow Instructions
- Retrieve the `user.name` from the local `.gitconfig` to determine the `{user}` prefix.
- If the task involves a visual change, suggest a branch using the `feat/ui-...` or `fix/ui-...` pattern.
- Always validate commit messages against these rules before finalizing.
