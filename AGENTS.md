# AI Edit Guidelines

To ensure consistent, readable code when using AI-assisted edits, follow these mandatory rules:

- When making code changes using AI, do not add explanatory comments.
- If a comment is absolutely necessary for developer understanding, add a single short comment in English, plain and direct, no more than 15 words.
- All code must be written in English.
- After finishing code edits, always verify there are no ESLint errors before committing.
- Before adding or upgrading a dependency, review its exact version, source, maintenance, engines, lifecycle scripts, and dependency tree.
- Never use `npm audit fix --force`.
- After dependency changes, run `npm ci`, `npm audit --audit-level=low`, `npm audit signatures`, ESLint, and all tests.
- Do not install external skills with warnings, failures, stale audits, or unreviewed referenced files and scripts.
- Security reviews must not expose secrets or run destructive or live-target tests without explicit authorization.
- Only create documentation or reference files (markdown, JSON, YAML, etc.) when the user explicitly asks you to do so (e.g., "create a guide", "document this", "write a README", "generate a reference"). Do NOT create supporting files, summaries, or reference documents unprompted—deliver the work directly.
- When providing explanations or summaries to the user, keep them extremely concise, objective and direct — use the minimum text necessary unless the user explicitly asks for more.

These rules are project-wide and should be followed by human and AI contributors.

- Always translate the user's instruction to English before using AI; regardless of the chat language, translate input to English for AI processing.
