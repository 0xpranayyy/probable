# Folder Structure

## Workspace Overview
We use a Turborepo monorepo setup:

```
probable/
├── apps/
│   ├── web/               # Next.js web application
│   └── api/               # Hono backend API
├── packages/
│   └── db/                # Prisma client and migrations
├── docker-compose.yml     # Local database and infrastructure services
└── package.json           # Monorepo workspaces configuration
```
