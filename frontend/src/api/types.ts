export interface Organization {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    organization_id: number;
    name: string;
    slug: string;
    repo_url: string | null;
    chart: string | null;
    target_revision: string | null;
    created_at: string;
    updated_at: string;
}

export interface Environment {
    id: number;
    organization_id: number;
    name: string;
    slug: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface Tenant {
    id: number;
    organization_id: number;
    name: string;
    slug: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface Assignment {
    id: number;
    tenant_id: number;
    project_id: number;
    environment_id: number;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface DashboardTenant {
    tenant_id: number;
    tenant_name: string;
    tenant_slug: string;
    status: string;
    enabled: boolean;
}

export interface DashboardEnvironmentCell {
    environment_id: number;
    environment_name: string;
    environment_slug: string;
    tenants: DashboardTenant[];
}

export interface DashboardProjectRow {
    project_id: number;
    project_name: string;
    project_slug: string;
    environments: DashboardEnvironmentCell[];
}

export interface DashboardResponse {
    organization: Organization;
    projects: DashboardProjectRow[];
}
