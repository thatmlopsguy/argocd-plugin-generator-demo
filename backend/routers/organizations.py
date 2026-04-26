from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Organization
from schemas import OrganizationCreate, OrganizationUpdate, OrganizationResponse

router = APIRouter(prefix="/api/v1/organizations", tags=["organizations"])


@router.get("", response_model=list[OrganizationResponse])
def list_organizations(db: Session = Depends(get_db)):
    return db.query(Organization).all()


@router.post("", response_model=OrganizationResponse, status_code=201)
def create_organization(data: OrganizationCreate, db: Session = Depends(get_db)):
    if db.query(Organization).filter(Organization.slug == data.slug).first():
        raise HTTPException(status_code=409, detail="Organization slug already exists")
    org = Organization(name=data.name, slug=data.slug)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(org_id: int, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    org_id: int, data: OrganizationUpdate, db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if data.name is not None:
        org.name = data.name
    if data.slug is not None:
        existing = (
            db.query(Organization)
            .filter(Organization.slug == data.slug, Organization.id != org_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=409, detail="Organization slug already exists"
            )
        org.slug = data.slug
    db.commit()
    db.refresh(org)
    return org


@router.delete("/{org_id}", status_code=204)
def delete_organization(org_id: int, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    db.delete(org)
    db.commit()
