import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getDashboard, listTenants, listProjectAssignments, createAssignment, deleteAssignment } from '../api/client';
import type { DashboardResponse, Tenant, Assignment } from '../api/types';

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-300',
    trial: 'bg-blue-100 text-blue-800 border-blue-300',
    inactive: 'bg-gray-100 text-gray-500 border-gray-300',
    'de-provisioned': 'bg-red-100 text-red-700 border-red-300',
};

export default function ProjectDashboard() {
    const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
    const orgIdNum = Number(orgId);
    const projectIdNum = Number(projectId);
    const queryClient = useQueryClient();

    const { data: dashboard, isLoading } = useQuery<DashboardResponse>({
        queryKey: ['dashboard', orgIdNum],
        queryFn: () => getDashboard(orgIdNum),
    });

    const { data: allTenants = [] } = useQuery<Tenant[]>({
        queryKey: ['tenants', orgIdNum],
        queryFn: () => listTenants(orgIdNum),
    });

    const { data: assignments = [] } = useQuery<Assignment[]>({
        queryKey: ['project-assignments', orgIdNum, projectIdNum],
        queryFn: () => listProjectAssignments(orgIdNum, projectIdNum),
    });

    const addMut = useMutation({
        mutationFn: (data: { tenant_id: number; project_id: number; environment_id: number }) =>
            createAssignment(orgIdNum, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', orgIdNum] });
            queryClient.invalidateQueries({ queryKey: ['project-assignments', orgIdNum, projectIdNum] });
        },
    });

    const removeMut = useMutation({
        mutationFn: (assignmentId: number) => deleteAssignment(orgIdNum, assignmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', orgIdNum] });
            queryClient.invalidateQueries({ queryKey: ['project-assignments', orgIdNum, projectIdNum] });
        },
    });

    const toggleAssignment = (tenantId: number, envId: number, isAssigned: boolean) => {
        if (isAssigned) {
            const assignment = assignments.find(
                a => a.tenant_id === tenantId && a.project_id === projectIdNum && a.environment_id === envId
            );
            if (assignment) removeMut.mutate(assignment.id);
        } else {
            addMut.mutate({ tenant_id: tenantId, project_id: projectIdNum, environment_id: envId });
        }
    };

    if (isLoading) {
        return <div className="p-6 text-gray-500">Loading dashboard...</div>;
    }

    const project = dashboard?.projects.find(p => p.project_id === projectIdNum);

    if (!project) {
        return <div className="p-6 text-gray-500">Project not found.</div>;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link to={`/org/${orgIdNum}/dashboard`} className="text-sm text-indigo-600 hover:underline mb-2 inline-block">
                    ← All Projects
                </Link>
                <h2 className="text-2xl font-bold text-gray-800">{project.project_name}</h2>
                <p className="text-sm text-gray-500">Environments × Tenants</p>
            </div>

            {project.environments.length === 0 ? (
                <p className="text-gray-500">No environments configured.</p>
            ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${project.environments.length}, minmax(220px, 1fr))` }}>
                    {project.environments.map((envCell) => {
                        const assignedTenantIds = new Set(envCell.tenants.map(t => t.tenant_id));
                        return (
                            <div key={envCell.environment_id} className="bg-gray-50 rounded-lg border border-gray-200">
                                {/* Column header */}
                                <div className="px-4 py-3 bg-gray-100 rounded-t-lg border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-700">{envCell.environment_name}</h3>
                                    <span className="text-xs text-gray-400">{envCell.environment_slug}</span>
                                </div>

                                {/* Tenant cards */}
                                <div className="p-3 space-y-2 min-h-[120px]">
                                    {envCell.tenants.map((t) => (
                                        <div
                                            key={t.tenant_id}
                                            className={`flex items-center justify-between px-3 py-2 rounded border text-sm ${STATUS_COLORS[t.status] || 'bg-gray-50'}`}
                                        >
                                            <div>
                                                <span className="font-medium">{t.tenant_name}</span>
                                                <span className="block text-xs opacity-70">{t.status}</span>
                                            </div>
                                            <button
                                                onClick={() => toggleAssignment(t.tenant_id, envCell.environment_id, true)}
                                                className="ml-2 text-gray-400 hover:text-red-600 text-lg leading-none"
                                                title="Remove assignment"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}

                                    {envCell.tenants.length === 0 && (
                                        <p className="text-xs text-gray-400 italic py-2">No tenants assigned</p>
                                    )}

                                    {/* Add tenant */}
                                    {allTenants.filter(t => !assignedTenantIds.has(t.id)).length > 0 && (
                                        <select
                                            className="w-full border rounded px-2 py-1.5 text-xs text-gray-400 bg-white"
                                            value=""
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    toggleAssignment(Number(e.target.value), envCell.environment_id, false);
                                                }
                                            }}
                                        >
                                            <option value="">+ Add tenant</option>
                                            {allTenants
                                                .filter(t => !assignedTenantIds.has(t.id))
                                                .map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                                                ))
                                            }
                                        </select>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="mt-6 flex gap-4 text-xs">
                <span className="font-medium text-gray-600">Status:</span>
                {Object.entries(STATUS_COLORS).map(([status, cls]) => (
                    <span key={status} className={`px-2 py-1 rounded border ${cls}`}>{status}</span>
                ))}
            </div>
        </div>
    );
}
