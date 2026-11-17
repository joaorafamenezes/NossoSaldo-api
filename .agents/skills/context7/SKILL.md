---
name: context7
description: >-
  Fetch up-to-date, version-specific documentation and code examples for backend API libraries using Context7 MCP (https://context7.com/).
  Activate when implementing, updating, or debugging backend dependencies (Express 5, Prisma 7, PostgreSQL/MariaDB adapters, Jest 30, TypeScript 6, Joi, Pino) to avoid hallucinations and deprecated patterns.
---

# Context7 - Backend API Library Documentation

Context7 serves real-time, version-specific documentation and verified code snippets for API libraries directly from authoritative sources.

## Backend Libraries in Focus (NossoSaldo API)
- **Express 5 (`express@^5.2.1`):** Native promise handling in routing, changes in query parser and route matchers.
- **Prisma 7 (`prisma@^7.9.1`):** Driver adapters (`@prisma/adapter-pg`, `@prisma/adapter-mariadb`), updated schema configuration and client generator.
- **Jest 30 (`jest@^30.3.0`):** Modern ESM/TypeScript configuration with `ts-jest`.
- **TypeScript 6 (`typescript@^6.0.3`):** Latest compiler options and strict typing.

## MCP Tools Workflow
1. **`resolve-library-id`**:
   - Resolve package name to Context7 canonical library ID (e.g., `prisma` -> `/prisma/prisma`, `express` -> `/expressjs/express`).
2. **`query-docs`**:
   - Query version-specific documentation and code examples.

## CLI Fallback
```bash
npx -y ctx7 docs /prisma/prisma "adapter-pg configuration client"
npx -y ctx7 docs /expressjs/express "async route handler error handling"
```
