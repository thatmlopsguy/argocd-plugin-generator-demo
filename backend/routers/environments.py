from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Organization, Environment
from schemas import EnvironmentCreate, EnvironmentUpdate, EnvironmentResponse

router = APIRouter(
    prefix="/api/v1/organizations/{org_id}/environments", tags=["environments"]
)


def _get_org(org_id: int, db: Session):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("", response_model=list[EnvironmentResponse])
def list_environments(org_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    return (
        db.query(Environment)
        .filter(Environment.organization_id == org_id)
        .order_by(Environment.sort_order)
        .all()
    )


@router.post("", response_model=EnvironmentResponse, status_code=201)
def create_environment(
    org_id: int, data: EnvironmentCreate, db: Session = Depends(get_db)
):
    _get_org(org_id, db)
    if (
        db.query(Environment)
        .filter(Environment.organization_id == org_id, Environment.slug == data.slug)
        .first()
    ):
        raise HTTPException(
            status_code=409,
            detail="Environment slug already exists in this organization",
        )
    env = Environment(organization_id=org_id, **data.model_dump())
    db.add(env)
    db.commit()
    db.refresh(env)
    return env


@router.get("/{env_id}", response_model=EnvironmentResponse)
def get_environment(org_id: int, env_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    env = (
        db.query(Environment)
        .filter(Environment.id == env_id, Environment.organization_id == org_id)
        .first()
    )
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    return env


@router.put("/{env_id}", response_model=EnvironmentResponse)
def update_environment(
    org_id: int, env_id: int, data: EnvironmentUpdate, db: Session = Depends(get_db)
):
    _get_org(org_id, db)
    env = (
        db.query(Environment)
        .filter(Environment.id == env_id, Environment.organization_id == org_id)
        .first()
    )
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(env, field, value)
    db.commit()
    db.refresh(env)
    return env


@router.delete("/{env_id}", status_code=204)
def delete_environment(org_id: int, env_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    env = (
        db.query(Environment)
        .filter(Environment.id == env_id, Environment.organization_id == org_id)
        .first()
    )
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    db.delete(env)
    db.commit()
