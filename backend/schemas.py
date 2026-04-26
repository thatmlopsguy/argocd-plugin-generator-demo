from datetime import datetime

from pydantic import BaseModel


# --- Organization ---
class OrganizationCreate(BaseModel):
    name: str
    slug: str


class OrganizationUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Project ---
class ProjectCreate(BaseModel):
    name: str
    slug: str
    repo_url: str | None = None
    chart: str | None = None
    target_revision: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    repo_url: str | None = None
    chart: str | None = None
    target_revision: str | None = None


class ProjectResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    slug: str
    repo_url: str | None
    chart: str | None
    target_revision: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Environment ---
class EnvironmentCreate(BaseModel):
    name: str
    slug: str
    sort_order: int = 0


class EnvironmentUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    sort_order: int | None = None


class EnvironmentResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    slug: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Tenant ---
class TenantCreate(BaseModel):
    name: str
    slug: str
    status: str = "active"


class TenantUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    status: str | None = None


class TenantResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    slug: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Assignment ---
class AssignmentCreate(BaseModel):
    tenant_id: int
    project_id: int
    environment_id: int
    enabled: bool = True


class AssignmentResponse(BaseModel):
    id: int
    tenant_id: int
    project_id: int
    environment_id: int
    enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BulkAssignmentItem(BaseModel):
    tenant_id: int
    environment_id: int
    enabled: bool = True


class BulkAssignmentRequest(BaseModel):
    assignments: list[BulkAssignmentItem]


# --- Dashboard ---
class DashboardTenant(BaseModel):
    tenant_id: int
    tenant_name: str
    tenant_slug: str
    status: str
    enabled: bool


class DashboardEnvironmentCell(BaseModel):
    environment_id: int
    environment_name: str
    environment_slug: str
    tenants: list[DashboardTenant]


class DashboardProjectRow(BaseModel):
    project_id: int
    project_name: str
    project_slug: str
    environments: list[DashboardEnvironmentCell]


class DashboardResponse(BaseModel):
    organization: OrganizationResponse
    projects: list[DashboardProjectRow]
