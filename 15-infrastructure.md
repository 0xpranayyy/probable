# Infrastructure

## Local Setup
We run the following local services inside Docker:
* **PostgreSQL**: Standard relational store (similar to our production Neon setup).
* **Redis**: Simple queue storage and event broker.
* **ClickHouse**: Fast columnar database used for quote storage and audit logs.

## Cloud Services
* **Neon**: Serverless PostgreSQL database.
* **Upstash**: Serverless Redis for task queuing.
* **Axiom / Datadog**: Log collection and platform health monitoring.
