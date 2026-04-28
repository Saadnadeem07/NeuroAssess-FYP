# /fix-issue

Usage: /fix-issue [ISSUE-ID from BUG_REPORT.md]

Steps:
1. Open docs/BUG_REPORT.md and find the issue with the given ID
2. Read the exact file and line number referenced
3. Understand the root cause fully before touching any code
4. Implement the minimal correct fix — do not refactor unrelated code
5. Verify the fix does not break adjacent logic
6. Mark the issue as resolved in docs/BUG_REPORT.md with date and fix summary
7. Run npm run typecheck && npm run lint in the affected app
