# /audit

Re-run the full codebase audit.

Read every file in server/, client/src/, nginx/, all Dockerfiles,
docker-compose.dev.yml, docker-compose.prod.yml, and .github/workflows/.

Then regenerate docs/BUG_REPORT.md with all findings using the same
format: severity (Critical/High/Medium/Low), file path + line number,
category, description, current code snippet, and recommended fix.
