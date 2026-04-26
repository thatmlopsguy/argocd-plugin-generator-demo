from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Organization, Tenant
from schemas import TenantCreate, TenantUpdate, TenantResponse

router = APIRouter(prefix="/api/v1/organizations/{org_id}/tenants", tags=["tenants"])


def _get_org(org_id: int, db: Session):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("", response_model=list[TenantResponse])
def list_tenants(org_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    return db.query(Tenant).filter(Tenant.organization_id == org_id).all()


@router.post("", response_model=TenantResponse, status_code=201)
def create_tenant(org_id: int, data: TenantCreate, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    if (
        db.query(Tenant)
        .filter(Tenant.organization_id == org_id, Tenant.slug == data.slug)
        .first()
    ):
        raise HTTPException(
            status_code=409, detail="Tenant slug already exists in this organization"
        )
    tenant = Tenant(organization_id=org_id, **data.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(org_id: int, tenant_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id, Tenant.organization_id == org_id)
        .first()
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    org_id: int, tenant_id: int, data: TenantUpdate, db: Session = Depends(get_db)
):
    _get_org(org_id, db)
    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id, Tenant.organization_id == org_id)
        .first()
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tenant, field, value)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", status_code=204)
def delete_tenant(org_id: int, tenant_id: int, db: Session = Depends(get_db)):
    _get_org(org_id, db)
    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id, Tenant.organization_id == org_id)
        .first()
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    db.delete(tenant)
    db.commit()
