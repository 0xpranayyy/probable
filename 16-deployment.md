# Deployment

## Production Targets
* **Frontend (`apps/web`)**: Deployed automatically to **Vercel** on every git push.
* **Backend API (`apps/api`)**: Deployed to **Fly.io** or ECS using Docker containers.

## CI/CD Pipeline
GitHub Actions manages our pipeline:
1. Lint and format checks.
2. Build monorepo modules using Turborepo cache.
3. Push Docker images to AWS ECR and trigger deploy hooks.
