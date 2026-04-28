# Data Model

MongoDB collections (target):

| Collection | Purpose |
|---|---|
| `users` | All accounts (Student, Parent, Psychiatrist, Admin) with role discriminator |
| `assessments` | Handwriting analysis submissions + ML output |
| `learningPlans` | Personalized curricula generated post-assessment |
| `progressReports` | Per-student tracked metrics over time |
| `consultations` | Scheduled sessions with psychiatrists |
| `auditLogs` | Sensitive-action audit trail |

## Required indexes (target)
- `users.email` — unique
- `users.role`
- `assessments.studentId + createdAt` — compound for timeline queries
- `consultations.psychiatristId + scheduledAt`
- `consultations.studentId + scheduledAt`

## Relationships
- `assessments.studentId` → `users._id`
- `learningPlans.studentId` → `users._id`
- `learningPlans.assessmentId` → `assessments._id`
- `consultations.studentId` → `users._id`
- `consultations.psychiatristId` → `users._id`

> Current schema is fragmented (separate `User`, `Patient`, `Psychiatrist`, `Admin`, `Account`, `authModel` models). See BUG_REPORT.md for consolidation recommendations.
