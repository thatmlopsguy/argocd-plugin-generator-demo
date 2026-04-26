from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Organization, Project, Environment, Tenant, TenantProjectEnvironment
from schemas import (
    DashboardResponse,
    DashboardProjectRow,
    DashboardEnvironmentCell,
    DashboardTenant,
    OrganizationResponse,
)

router = APIRouter(
    prefix="/api/v1/organizations/{org_id}/dashboard", tags=["dashboard"]
)


@router.get("", response_model=DashboardResponse)
def get_dashboard(org_id: int, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    projects = db.query(Project).filter(Project.organization_id == org_id).all()
    environments = (
        db.query(Environment)
        .filter(Environment.organization_id == org_id)
        .order_by(Environment.sort_order)
        .all()
    )
    tenants = db.query(Tenant).filter(Tenant.organization_id == org_id).all()
    tenant_map = {t.id: t for t in tenants}

    # Get all assignments for this org's projects
    project_ids = [p.id for p in projects]
    assignments = (
        db.query(TenantProjectEnvironment)
        .filter(TenantProjectEnvironment.project_id.in_(project_ids))
        .all()
        if project_ids
        else []
    )

    # Build lookup: (project_id, environment_id) -> list of assignments
    assignment_map: dict[tuple[int, int], list[TenantProjectEnvironment]] = {}
    for a in assignments:
        key = (a.project_id, a.environment_id)
        assignment_map.setdefault(key, []).append(a)

    project_rows = []
    for project in projects:
        env_cells = []
        for env in environments:
            env_assignments = assignment_map.get((project.id, env.id), [])
            tenant_entries = []
            for a in env_assignments:
                t = tenant_map.get(a.tenant_id)
                if t:
                    tenant_entries.append(
                        DashboardTenant(
                            tenant_id=t.id,
                            tenant_name=t.name,
                            tenant_slug=t.slug,
                            status=t.status,
                            enabled=a.enabled,
                        )
                    )
            env_cells.append(
                DashboardEnvironmentCell(
                    environment_id=env.id,
                    environment_name=env.name,
                    environment_slug=env.slug,
                    tenants=tenant_entries,
                )
            )
        project_rows.append(
            DashboardProjectRow(
                project_id=project.id,
                project_name=project.name,
                project_slug=project.slug,
                environments=env_cells,
            )
        )

    return DashboardResponse(
        organization=OrganizationResponse.model_validate(org),
        projects=project_rows,
    )
