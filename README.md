# ArgoCD Plugin Generator — Multi-Tenant Dashboard

A custom [ArgoCD ApplicationSet Plugin Generator](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Plugin/)
that externalizes ApplicationSet generation logic into a database-backed service,
replacing complex hardcoded generator configurations with a managed API and dashboard.

## Why?

ArgoCD's built-in generators (cluster, git, matrix, merge) work well for simple setups,
but they quickly become unwieldy when managing a large fleet of Kubernetes clusters across
**multiple cloud providers**, **geographic regions**, **tenants**, and **cluster types**.

A typical real-world ApplicationSet ends up looking like this — a deeply nested merge of
matrix generators pulling overrides from different paths at environment, region, and
cluster level:

```yaml
generators:
  - merge:
      mergeKeys: [server]
      generators:
        # Priority 1: defaults for all enabled clusters
        - clusters:
            values:
              addonChart: rustfs
              addonChartVersion: 0.0.84
            selector:
              matchExpressions:
                - key: enable_rustfs
                  operator: In
                  values: ['true']
        # Priority 2: per-environment overrides from git
        - matrix:
            generators:
              - git:
                  files:
                    - path: configs/appsets/environments/*/rustfs.json
              - clusters:
                  selector:
                    matchLabels:
                      env: '{{ .environment }}'
        # Priority 3: per-region overrides (e.g. promote prod region-by-region)
        - matrix:
            generators:
              - git:
                  files:
                    - path: configs/appsets/regions/*/rustfs.json
              - clusters:
                  selector:
                    matchLabels:
                      region: '{{ .cluster_region }}'
                      env: 'prod'
        # Priority 4: per-cluster overrides (single-cluster canaries)
        - matrix:
            generators:
              - git:
                  files:
                    - path: configs/appsets/clusters/*/addons.json
              - clusters:
                  selector:
                    matchExpressions:
                      - key: cluster_name
                        operator: In
                        values: ['{{ .cluster_name }}']
```

This approach has significant drawbacks:

- **Promotion logic is scattered** across git files and YAML templates
- **Adding a new dimension** (e.g. cluster type, cloud provider) requires restructuring the entire generator tree
- **Visibility is poor** — there's no easy way to see which version is deployed where
- **Rollbacks and targeted promotions** require editing files and waiting for git sync

This project replaces all of that with a single plugin generator call:

```yaml
generators:
  - plugin:
      configMapRef:
        name: plugin-generator
      input:
        parameters:
          organization: "acme-org"
```

The promotion logic, environment ordering, tenant assignments, and version targeting
are all managed through an external service (PostgreSQL + FastAPI) with a React dashboard
for visibility and control.

## Architecture

```text
┌─────────────────┐       ┌──────────────────────────┐       ┌─────────────────┐
│ React Dashboard │──────▶│  FastAPI Plugin Service  │◀──────│  ArgoCD         │
│ (Vite + TS)     │  API  │  /api/v1/...             │ POST  │  ApplicationSet │
└─────────────────┘       └──────────┬───────────────┘       └────────┬────────┘
                                     │                                │
                                     ▼                                ▼
                              ┌──────────────┐              ┌─────────────────┐
                              │  PostgreSQL  │              │  K8s Application│
                              │  (5 tables)  │              │  per tenant/env │
                              └──────────────┘              └─────────────────┘
```

## Data Model

- **Organization** — top-level grouping
- **Project** — a deployable app (chart, repo URL, revision)
- **Environment** — deployment stage (dev, stg, prod, or custom)
- **Tenant** — a customer/instance with a status (active, trial, inactive, de-provisioned)
- **Assignment** — links a tenant to a project × environment combination

## Quick Start

### Prerequisites

- Kind cluster with ArgoCD installed
- Docker, kubectl, Node.js 22+, Python 3.13+, uv

### Deploy to cluster

```sh
# 1. Create the cluster and install ArgoCD
make kind-create-cluster
make argo-cd-install

# 2. Deploy PostgreSQL with seed data
kubectl apply -f manifests/postgres-manifests.yaml -n argocd

# 3. Build and load the plugin image
make kind-load-image

# 4. Deploy the plugin service
kubectl apply -f manifests/plugin-manifests.yaml -n argocd

# 5. Apply the ApplicationSet
kubectl apply -f manifests/applicationset.yaml -n argocd
```

### Local development

```sh
# Backend (requires PostgreSQL running on localhost:5432)
make start-dev

# Frontend (proxies API to localhost:4355)
make install-frontend
make start-frontend
```

Then open `http://localhost:5173` for the dashboard.

### Docker Compose

```sh
# Start all services (postgres, backend, frontend)
make docker-compose-up

# Stop services
make docker-compose-down
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4355`

## API Endpoints

### Organizations

| Method | Path                              | Description      |
|--------|-----------------------------------|------------------|
| GET    | `/api/v1/organizations`           | List all          |
| POST   | `/api/v1/organizations`           | Create            |
| GET    | `/api/v1/organizations/{id}`      | Get by ID         |
| PUT    | `/api/v1/organizations/{id}`      | Update            |
| DELETE | `/api/v1/organizations/{id}`      | Delete            |

### Projects

| Method | Path                                                  | Description      |
|--------|-------------------------------------------------------|------------------|
| GET    | `/api/v1/organizations/{id}/projects`                 | List all          |
| POST   | `/api/v1/organizations/{id}/projects`                 | Create            |
| GET    | `/api/v1/organizations/{id}/projects/{pid}`           | Get by ID         |
| PUT    | `/api/v1/organizations/{id}/projects/{pid}`           | Update            |
| DELETE | `/api/v1/organizations/{id}/projects/{pid}`           | Delete            |

### Environments

| Method | Path                                                  | Description                      |
|--------|-------------------------------------------------------|----------------------------------|
| GET    | `/api/v1/organizations/{id}/environments`             | List all (ordered by sort_order) |
| POST   | `/api/v1/organizations/{id}/environments`             | Create                           |
| GET    | `/api/v1/organizations/{id}/environments/{eid}`       | Get by ID                        |
| PUT    | `/api/v1/organizations/{id}/environments/{eid}`       | Update                           |
| DELETE | `/api/v1/organizations/{id}/environments/{eid}`       | Delete                           |

### Tenants

| Method | Path                                       | Description |
|--------|--------------------------------------------|-------------|
| GET    | `/api/v1/organizations/{id}/tenants`       | List all    |
| POST   | `/api/v1/organizations/{id}/tenants`       | Create      |
| GET    | `/api/v1/organizations/{id}/tenants/{tid}` | Get by ID   |
| PUT    | `/api/v1/organizations/{id}/tenants/{tid}` | Update      |
| DELETE | `/api/v1/organizations/{id}/tenants/{tid}` | Delete      |

### Assignments

| Method | Path                                                           | Description             |
|--------|----------------------------------------------------------------|-------------------------|
| GET    | `/api/v1/organizations/{id}/projects/{pid}/assignments`        | List project assignments |
| PUT    | `/api/v1/organizations/{id}/projects/{pid}/assignments`        | Bulk update assignments  |
| POST   | `/api/v1/organizations/{id}/assignments`                       | Create single assignment |
| DELETE | `/api/v1/organizations/{id}/assignments/{aid}`                 | Delete assignment        |

### Dashboard

| Method | Path                                        | Description          |
|--------|---------------------------------------------|----------------------|
| GET    | `/api/v1/organizations/{id}/dashboard`      | Dashboard matrix data |

### ArgoCD Plugin

| Method | Path                          | Description                              |
|--------|-------------------------------|------------------------------------------|
| POST   | `/api/v1/getparams.execute`   | ArgoCD plugin endpoint (Bearer auth)     |

## License

This project is licensed under Apache 2.0. See the [LICENSE](LICENSE) file for details.
