import type {
    Organization,
    Project,
    Environment,
    Tenant,
    Assignment,
    DashboardResponse,
} from './types';

const BASE = '/api/v1';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
}

// --- Organizations ---
export const listOrganizations = () =>
    request<Organization[]>(`${BASE}/organizations`);

export const createOrganization = (data: { name: string; slug: string }) =>
    request<Organization>(`${BASE}/organizations`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateOrganization = (id: number, data: Partial<Organization>) =>
    request<Organization>(`${BASE}/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const deleteOrganization = (id: number) =>
    request<void>(`${BASE}/organizations/${id}`, { method: 'DELETE' });

// --- Projects ---
export const listProjects = (orgId: number) =>
    request<Project[]>(`${BASE}/organizations/${orgId}/projects`);

export const createProject = (orgId: number, data: Partial<Project>) =>
    request<Project>(`${BASE}/organizations/${orgId}/projects`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateProject = (orgId: number, id: number, data: Partial<Project>) =>
    request<Project>(`${BASE}/organizations/${orgId}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const deleteProject = (orgId: number, id: number) =>
    request<void>(`${BASE}/organizations/${orgId}/projects/${id}`, { method: 'DELETE' });

// --- Environments ---
export const listEnvironments = (orgId: number) =>
    request<Environment[]>(`${BASE}/organizations/${orgId}/environments`);

export const createEnvironment = (orgId: number, data: Partial<Environment>) =>
    request<Environment>(`${BASE}/organizations/${orgId}/environments`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateEnvironment = (orgId: number, id: number, data: Partial<Environment>) =>
    request<Environment>(`${BASE}/organizations/${orgId}/environments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const deleteEnvironment = (orgId: number, id: number) =>
    request<void>(`${BASE}/organizations/${orgId}/environments/${id}`, { method: 'DELETE' });

// --- Tenants ---
export const listTenants = (orgId: number) =>
    request<Tenant[]>(`${BASE}/organizations/${orgId}/tenants`);

export const createTenant = (orgId: number, data: Partial<Tenant>) =>
    request<Tenant>(`${BASE}/organizations/${orgId}/tenants`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateTenant = (orgId: number, id: number, data: Partial<Tenant>) =>
    request<Tenant>(`${BASE}/organizations/${orgId}/tenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const deleteTenant = (orgId: number, id: number) =>
    request<void>(`${BASE}/organizations/${orgId}/tenants/${id}`, { method: 'DELETE' });

// --- Assignments ---
export const listProjectAssignments = (orgId: number, projectId: number) =>
    request<Assignment[]>(`${BASE}/organizations/${orgId}/projects/${projectId}/assignments`);

export const bulkUpdateAssignments = (
    orgId: number,
    projectId: number,
    assignments: { tenant_id: number; environment_id: number; enabled: boolean }[]
) =>
    request<Assignment[]>(`${BASE}/organizations/${orgId}/projects/${projectId}/assignments`, {
        method: 'PUT',
        body: JSON.stringify({ assignments }),
    });

export const createAssignment = (
    orgId: number,
    data: { tenant_id: number; project_id: number; environment_id: number; enabled?: boolean }
) =>
    request<Assignment>(`${BASE}/organizations/${orgId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const deleteAssignment = (orgId: number, id: number) =>
    request<void>(`${BASE}/organizations/${orgId}/assignments/${id}`, { method: 'DELETE' });

// --- Dashboard ---
export const getDashboard = (orgId: number) =>
    request<DashboardResponse>(`${BASE}/organizations/${orgId}/dashboard`);
