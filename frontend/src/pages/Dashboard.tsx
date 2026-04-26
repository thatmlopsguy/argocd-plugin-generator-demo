import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getDashboard } from '../api/client';
import type { DashboardResponse } from '../api/types';

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    trial: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-500',
    'de-provisioned': 'bg-red-100 text-red-700',
};

export default function Dashboard() {
    const { orgId } = useParams<{ orgId: string }>();
    const id = Number(orgId);

    const { data: dashboard, isLoading } = useQuery<DashboardResponse>({
        queryKey: ['dashboard', id],
        queryFn: () => getDashboard(id),
    });

    if (isLoading) {
        return <div className="p-6 text-gray-500">Loading dashboard...</div>;
    }

    if (!dashboard) {
        return <div className="p-6 text-gray-500">No data available.</div>;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{dashboard.organization.name}</h2>
                <p className="text-sm text-gray-500">Select a project to view its deployment dashboard</p>
            </div>

            {dashboard.projects.length === 0 ? (
                <p className="text-gray-500">No projects configured. Add projects, environments, and tenants to get started.</p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {dashboard.projects.map((project) => {
                        const totalAssignments = project.environments.reduce((sum, env) => sum + env.tenants.length, 0);
                        const uniqueTenants = new Set(project.environments.flatMap(e => e.tenants.map(t => t.tenant_id)));
                        const envSummary = project.environments.map(env => ({
                            name: env.environment_name,
                            count: env.tenants.length,
                        }));

                        return (
                            <Link
                                key={project.project_id}
                                to={`/org/${id}/projects/${project.project_id}/dashboard`}
                                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
                            >
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-800 text-lg">{project.project_name}</h3>
                                    <p className="text-sm text-gray-400">{project.project_slug}</p>
                                </div>
                                <div className="px-5 py-3 space-y-3">
                                    {/* Stats */}
                                    <div className="flex gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-400">Tenants</span>
                                            <span className="ml-1 font-semibold text-gray-700">{uniqueTenants.size}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Deployments</span>
                                            <span className="ml-1 font-semibold text-gray-700">{totalAssignments}</span>
                                        </div>
                                    </div>
                                    {/* Env breakdown */}
                                    <div className="flex gap-2 flex-wrap">
                                        {envSummary.map((env) => (
                                            <span
                                                key={env.name}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-xs text-gray-600 border"
                                            >
                                                {env.name}
                                                <span className="font-semibold">{env.count}</span>
                                            </span>
                                        ))}
                                    </div>
                                    {/* Tenant status dots */}
                                    <div className="flex gap-1 flex-wrap">
                                        {project.environments.flatMap(e => e.tenants)
                                            .filter((t, i, arr) => arr.findIndex(x => x.tenant_id === t.tenant_id) === i)
                                            .map(t => (
                                                <span
                                                    key={t.tenant_id}
                                                    className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[t.status] || 'bg-gray-100'}`}
                                                    title={`${t.tenant_name} (${t.status})`}
                                                >
                                                    {t.tenant_name}
                                                </span>
                                            ))
                                        }
                                    </div>
                                </div>
                                <div className="px-5 py-2 bg-gray-50 text-xs text-indigo-600 font-medium">
                                    View Dashboard →
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
