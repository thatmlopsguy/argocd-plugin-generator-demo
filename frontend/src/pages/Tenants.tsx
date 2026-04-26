import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { listTenants, createTenant, deleteTenant } from '../api/client';

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    trial: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-600',
    'de-provisioned': 'bg-red-100 text-red-800',
};

export default function Tenants() {
    const { orgId } = useParams<{ orgId: string }>();
    const id = Number(orgId);
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '', status: 'active' });

    const { data: tenants = [], isLoading } = useQuery({
        queryKey: ['tenants', id],
        queryFn: () => listTenants(id),
    });

    const createMut = useMutation({
        mutationFn: () => createTenant(id, form),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants', id] });
            setShowForm(false);
            setForm({ name: '', slug: '', status: 'active' });
        },
    });

    const deleteMut = useMutation({
        mutationFn: (tenantId: number) => deleteTenant(id, tenantId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants', id] }),
    });

    return (
        <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Tenants</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                    {showForm ? 'Cancel' : 'New Tenant'}
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
                    className="mb-6 p-4 bg-white rounded shadow grid grid-cols-3 gap-3"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <input
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="inactive">Inactive</option>
                            <option value="de-provisioned">De-provisioned</option>
                        </select>
                    </div>
                    <div className="col-span-3">
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
            ) : tenants.length === 0 ? (
                <p className="text-gray-500">No tenants yet.</p>
            ) : (
                <table className="w-full bg-white rounded shadow text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map((t) => (
                            <tr key={t.id} className="border-t">
                                <td className="px-4 py-3 font-medium">{t.name}</td>
                                <td className="px-4 py-3 text-gray-500">{t.slug}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[t.status] || 'bg-gray-100'}`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => { if (confirm('Delete this tenant?')) deleteMut.mutate(t.id); }}
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
