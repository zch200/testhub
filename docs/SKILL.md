# TestHub — Agent Integration Guide

> TestHub is a local-first test management tool. This guide helps AI agents (Claude Code, Cursor, etc.) interact with its REST API.

## Authentication

Every request to `/api/v1/*` must include the header:

```
x-testhub-token: <TOKEN>
```

You can also identify yourself:

```
x-testhub-operator: my-agent-name
x-testhub-source: api
```

## Data Model

```
Project
├── Library (code: 4-char identifier, e.g. "CORE")
│   ├── Directory (tree structure, parentId=null means root)
│   ├── Case (title, priority P0-P3, type, content, steps, tags)
│   └── Tag (scoped to library)
└── Plan (status: draft → in_progress → completed → archived)
    └── PlanCase (execution: pending/passed/failed/blocked/skipped)
        └── Remarks (multiple per plan-case)
```

## Quick Reference

| Resource | List | Create | Get | Update | Delete |
|----------|------|--------|-----|--------|--------|
| Project | `GET /projects` | `POST /projects` | `GET /projects/:id` | `PUT /projects/:id` | `DELETE /projects/:id` |
| Library | `GET /projects/:pid/libraries` | `POST /projects/:pid/libraries` | `GET /libraries/:id` | `PUT /libraries/:id` | `DELETE /libraries/:id` |
| Directory | `GET /libraries/:lid/directories` | `POST /libraries/:lid/directories` | `GET /directories/:id` | `PUT /directories/:id` | `DELETE /directories/:id` |
| Case | `GET /libraries/:lid/cases` | `POST /libraries/:lid/cases` | `GET /cases/:id` | `PUT /cases/:id` | `DELETE /cases/:id` |
| Tag | `GET /libraries/:lid/tags` | `POST /libraries/:lid/tags` | — | — | `DELETE /tags/:id` |
| Plan | `GET /projects/:pid/plans` | `POST /projects/:pid/plans` | `GET /plans/:id` | `PUT /plans/:id` | `DELETE /plans/:id` |
| PlanCase | `GET /plans/:pid/cases` | `POST /plans/:pid/cases` | — | `PUT /plans/:pid/cases/:pcid` | `DELETE /plans/:pid/cases/:pcid` |

All endpoints are prefixed with `/api/v1`. All list endpoints support pagination: `?page=1&pageSize=20`.

---

## Workflow 1: Create Project → Library → Cases

The most common agent workflow: set up a project structure and populate test cases.

```bash
# Step 1: Create a project
curl -X POST {{baseUrl}}/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{"name": "My App", "description": "Mobile app project"}'
# Returns: {"id": 1, "name": "My App", ...}

# Step 2: Create a library under the project
curl -X POST {{baseUrl}}/api/v1/projects/1/libraries \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{"name": "Core Features", "code": "CORE"}'
# Returns: {"id": 1, "name": "Core Features", "code": "CORE", ...}

# Step 3: (Optional) Create a directory for organizing cases
curl -X POST {{baseUrl}}/api/v1/libraries/1/directories \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{"name": "Login Module", "parentId": null}'
# Returns: {"id": 1, "name": "Login Module", ...}

# Step 4: Create a test case (text mode)
curl -X POST {{baseUrl}}/api/v1/libraries/1/cases \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{
    "title": "User can login with valid credentials",
    "directoryId": 1,
    "priority": "P0",
    "caseType": "functional",
    "contentType": "text",
    "textContent": "Enter valid username and password, click login button",
    "textExpected": "User is redirected to dashboard",
    "tags": ["login", "smoke"]
  }'
```

## Workflow 2: Batch Import Cases (Most Common for Agents)

Use batch endpoint to create multiple cases at once — more efficient than one-by-one.

```bash
curl -X POST {{baseUrl}}/api/v1/libraries/1/cases/batch \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -H "x-testhub-operator: claude-code" \
  -d '{
    "cases": [
      {
        "title": "Login with valid credentials",
        "priority": "P0",
        "caseType": "functional",
        "contentType": "text",
        "textContent": "Enter valid credentials and submit",
        "textExpected": "Login successful, redirected to home",
        "tags": ["login", "smoke"]
      },
      {
        "title": "Login with invalid password",
        "priority": "P1",
        "caseType": "functional",
        "contentType": "step",
        "steps": [
          {"stepOrder": 1, "action": "Enter valid username", "expected": "Username accepted"},
          {"stepOrder": 2, "action": "Enter wrong password", "expected": "Field shows input"},
          {"stepOrder": 3, "action": "Click login", "expected": "Error: invalid credentials"}
        ],
        "tags": ["login", "negative"]
      }
    ]
  }'
```

**Case content types:**
- `text`: Free-form text with `textContent` (required) and `textExpected` (optional)
- `step`: Structured steps array with `stepOrder`, `action` (required), `expected` (optional)

**Priority levels:** `P0` (critical) > `P1` (high) > `P2` (medium) > `P3` (low)

**Case types:** `functional`, `performance`, `api`, `ui`, `other`

## Workflow 3: Create and Execute a Test Plan

```bash
# Step 1: Create a plan
curl -X POST {{baseUrl}}/api/v1/projects/1/plans \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{
    "name": "Sprint 1 Regression",
    "startDate": "2026-03-08",
    "endDate": "2026-03-15",
    "status": "draft"
  }'
# Returns: {"id": 1, ...}

# Step 2: Add cases to the plan (by case IDs)
curl -X POST {{baseUrl}}/api/v1/plans/1/cases \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{"caseIds": [1, 2, 3]}'

# Or add all cases from a directory (recursive by default)
curl -X POST {{baseUrl}}/api/v1/plans/1/cases/by-directory \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{"directoryId": 1, "recursive": true}'

# Step 3: Update execution status
curl -X PUT {{baseUrl}}/api/v1/plans/1/cases/1 \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{"executionStatus": "passed"}'

# Step 4: Batch update status
curl -X POST {{baseUrl}}/api/v1/plans/1/cases/batch-status \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{"planCaseIds": [1, 2, 3], "executionStatus": "passed"}'

# Step 5: Add a remark to a plan-case
curl -X POST {{baseUrl}}/api/v1/plans/1/cases/1/remarks \
  -H "Content-Type: application/json" \
  -H "x-testhub-token: {{token}}" \
  -d '{"content": "Verified on Chrome 120, all assertions passed"}'

# Step 6: Check plan statistics
curl {{baseUrl}}/api/v1/plans/1/stats \
  -H "x-testhub-token: {{token}}"
# Returns: {"total": 10, "pending": 3, "passed": 5, "failed": 1, "blocked": 0, "skipped": 1}
```

**Execution statuses:** `pending` → `passed` | `failed` | `blocked` | `skipped` (reversible, can change back to any status)

## Workflow 4: Query and Filter Cases

```bash
# Filter by directory
curl "{{baseUrl}}/api/v1/libraries/1/cases?directoryId=1" \
  -H "x-testhub-token: {{token}}"

# Filter by priority and type
curl "{{baseUrl}}/api/v1/libraries/1/cases?priority=P0&type=functional" \
  -H "x-testhub-token: {{token}}"

# Search by keyword
curl "{{baseUrl}}/api/v1/libraries/1/cases?keyword=login" \
  -H "x-testhub-token: {{token}}"

# Filter by tag
curl "{{baseUrl}}/api/v1/libraries/1/cases?tag=smoke" \
  -H "x-testhub-token: {{token}}"

# Combine filters with pagination and sorting
curl "{{baseUrl}}/api/v1/libraries/1/cases?priority=P0&tag=smoke&page=1&pageSize=50&sortBy=priority&sortOrder=asc" \
  -H "x-testhub-token: {{token}}"
```

## Workflow 5: View Execution History

```bash
# History of a specific plan-case
curl "{{baseUrl}}/api/v1/plans/1/cases/1/history" \
  -H "x-testhub-token: {{token}}"

# History of the entire plan
curl "{{baseUrl}}/api/v1/plans/1/history" \
  -H "x-testhub-token: {{token}}"
```

---

## Important Notes

1. **Pagination**: All list endpoints return `{ items, page, pageSize, total, totalPages }`. Default page size is 20.
2. **Cascade deletes**: Deleting a project removes all its libraries, cases, and plans. Deleting a library removes its directories, cases, and tags.
3. **Case versioning**: Each case update auto-increments the version. View history via `GET /cases/:id/versions`.
4. **Tags are library-scoped**: Tag names must be unique within a library. Pass tags as string arrays when creating cases — tags are auto-created if they don't exist.
5. **Directory tree**: `GET /libraries/:lid/directories` returns the full tree with nested `children` arrays.
6. **OpenAPI spec**: For complete endpoint details, parameter schemas, and response types, fetch `{{baseUrl}}/api/docs/json`.
7. **Swagger UI**: Interactive API explorer available at `{{baseUrl}}/api/docs`.
