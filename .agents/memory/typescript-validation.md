---
name: TypeScript validation limits
description: Distinguishing whole-project typecheck resource failures from successful feature checks.
---

A whole-project TypeScript check can exhaust Node's default heap in this project. With a 4 GB heap allowance, it completed and reported existing project-wide errors unrelated to the invite-code change.

**Why:** A redirected typecheck initially produced an out-of-memory stack trace rather than TypeScript diagnostics. Searching that output for changed filenames alone would have falsely suggested no errors.

**How to apply:** Inspect the check's exit status and output before interpreting filtered diagnostics. If the default heap is exhausted, a larger heap may expose the actual diagnostics; do not claim a clean whole-project typecheck based on a successful build or an empty filename filter.
