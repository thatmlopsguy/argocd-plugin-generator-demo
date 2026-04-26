from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Organization, Project
from schemas import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/api/v1/organizations/{org_id}/projects", tags=["projects"])


def _get_org(org_id: int, db: Session):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("", response_model=list[ProjectResponse])
def list_projects(org_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    return db.query(Project).filter(Project.organization_id == org_id).all()


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(org_id: int, data: ProjectCreate, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    if (
        db.query(Project)
        .filter(Project.organization_id == org_id, Project.slug == data.slug)
        .first()
    ):
        raise HTTPException(
            status_code=409, detail="Project slug already exists in this organization"
        )
    project = Project(organization_id=org_id, **data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(org_id: int, project_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    org_id: int, project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)
):
    _get_org(org_id, db)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(org_id: int, project_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
