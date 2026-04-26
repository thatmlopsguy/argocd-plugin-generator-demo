from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Organization, Project, TenantProjectEnvironment
from schemas import AssignmentCreate, AssignmentResponse, BulkAssignmentRequest

router = APIRouter(prefix="/api/v1/organizations/{org_id}", tags=["assignments"])


def _get_org(org_id: int, db: Session):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get(
    "/projects/{project_id}/assignments", response_model=list[AssignmentResponse]
)
def list_project_assignments(
    org_id: int, project_id: int, db: Session = Depends(get_db)
):
    _get_org(org_id, db)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return (
        db.query(TenantProjectEnvironment)
        .filter(TenantProjectEnvironment.project_id == project_id)
        .all()
    )


@router.put(
    "/projects/{project_id}/assignments", response_model=list[AssignmentResponse]
)
def bulk_update_assignments(
    org_id: int,
    project_id: int,
    data: BulkAssignmentRequest,
    db: Session = Depends(get_db),
):
    _get_org(org_id, db)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete existing assignments for this project
    db.query(TenantProjectEnvironment).filter(
        TenantProjectEnvironment.project_id == project_id
    ).delete()

    # Create new assignments
    new_assignments = []
    for item in data.assignments:
        assignment = TenantProjectEnvironment(
            tenant_id=item.tenant_id,
            project_id=project_id,
            environment_id=item.environment_id,
            enabled=item.enabled,
        )
        db.add(assignment)
        new_assignments.append(assignment)

    db.commit()
    for a in new_assignments:
        db.refresh(a)
    return new_assignments


@router.post("/assignments", response_model=AssignmentResponse, status_code=201)
def create_assignment(
    org_id: int, data: AssignmentCreate, db: Session = Depends(get_db)
):
    _get_org(org_id, db)
    existing = (
        db.query(TenantProjectEnvironment)
        .filter(
            TenantProjectEnvironment.tenant_id == data.tenant_id,
            TenantProjectEnvironment.project_id == data.project_id,
            TenantProjectEnvironment.environment_id == data.environment_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Assignment already exists")
    assignment = TenantProjectEnvironment(**data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/assignments/{assignment_id}", status_code=204)
def delete_assignment(org_id: int, assignment_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    assignment = (
        db.query(TenantProjectEnvironment)
        .filter(TenantProjectEnvironment.id == assignment_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
