import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { listProjects, createProject, deleteProject } from '../api/client';

export default function Projects() {
    const { orgId } = useParams<{ orgId: string }>();
    const id = Number(orgId);
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '', repo_url: '', chart: '', target_revision: '' });

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects', id],
        queryFn: () => listProjects(id),
    });

    const createMut = useMutation({
        mutationFn: () => createProject(id, form),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            setShowForm(false);
            setForm({ name: '', slug: '', repo_url: '', chart: '', target_revision: '' });
        },
    });

    const deleteMut = useMutation({
        mutationFn: (projectId: number) => deleteProject(id, projectId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', id] }),
    });

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                    {showForm ? 'Cancel' : 'New Project'}
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
                    className="mb-6 p-4 bg-white rounded shadow grid grid-cols-2 gap-3"
                >
                    {(['name', 'slug', 'repo_url', 'chart', 'target_revision'] as const).map((field) => (
                        <div key={field} className={field === 'repo_url' ? 'col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                {field.replace('_', ' ')}
                            </label>
                            <input
                                value={form[field]}
                                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                                className="w-full border rounded px-3 py-2 text-sm"
                                required={field === 'name' || field === 'slug'}
                            />
                        </div>
                    ))}
                    <div className="col-span-2">
                        <button
                            type="submit"
                            disabled={createMut.isPending}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                        >
                            {createMut.isPending ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            )}

            {isLoading ? (
                <p className="text-gray-500">Loading...</p>
            ) : projects.length === 0 ? (
                <p className="text-gray-500">No projects yet.</p>
            ) : (
                <table className="w-full bg-white rounded shadow text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Chart</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Revision</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((p) => (
                            <tr key={p.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">
                                    <Link to={`/org/${id}/projects/${p.id}/dashboard`} className="text-indigo-600 hover:underline">
                                        {p.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{p.slug}</td>
                                <td className="px-4 py-3 text-gray-500">{p.chart || '-'}</td>
                                <td className="px-4 py-3 text-gray-500">{p.target_revision || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => { if (confirm('Delete this project?')) deleteMut.mutate(p.id); }}
                                        className="text-red-600 hover:underline text-sm"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
