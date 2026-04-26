from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    organizations,
    projects,
    environments,
    tenants,
    assignments,
    dashboard,
)

app = FastAPI(title="ArgoCD Plugin Tenant Generator — Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(organizations.router)
app.include_router(projects.router)
app.include_router(environments.router)
app.include_router(tenants.router)
app.include_router(assignments.router)
app.include_router(dashboard.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
