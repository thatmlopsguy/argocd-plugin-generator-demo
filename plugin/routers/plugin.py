import os

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import Organization, Project, Environment, Tenant, TenantProjectEnvironment
from schemas import PluginRequest, PluginResponse

PLUGIN_TOKEN = os.getenv("AUTH_TOKEN")

router = APIRouter(tags=["plugin"])
security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.scheme != "Bearer" or credentials.credentials != PLUGIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid or missing token")
    return credentials


@router.post("/api/v1/getparams.execute", response_model=PluginResponse)
def get_params_execute(
    body: PluginRequest | None = None,
    credentials: HTTPAuthorizationCredentials = Depends(verify_token),
    db: Session = Depends(get_db),
):
    query = (
        db.query(TenantProjectEnvironment, Tenant, Project, Environment)
        .join(Tenant, TenantProjectEnvironment.tenant_id == Tenant.id)
        .join(Project, TenantProjectEnvironment.project_id == Project.id)
        .join(Environment, TenantProjectEnvironment.environment_id == Environment.id)
        .filter(TenantProjectEnvironment.enabled.is_(True))
    )

    # Apply optional filters from the request body
    if body and body.input and body.input.parameters:
        params = body.input.parameters
        if params.organization:
            org = (
                db.query(Organization)
                .filter(Organization.slug == params.organization)
                .first()
            )
            if not org:
                return PluginResponse(output={"parameters": []})
            query = query.filter(Project.organization_id == org.id)
        if params.project:
            query = query.filter(Project.slug == params.project)
        if params.environment:
            query = query.filter(Environment.slug == params.environment)

    results = query.all()

    parameters = []
    for assignment, tenant, project, environment in results:
        parameters.append(
            {
                "tenant": tenant.slug,
                "project": project.slug,
                "environment": environment.slug,
                "status": tenant.status,
                "repo_url": project.repo_url or "",
                "chart": project.chart or "",
                "target_revision": project.target_revision or "",
            }
        )

    return PluginResponse(output={"parameters": parameters})
