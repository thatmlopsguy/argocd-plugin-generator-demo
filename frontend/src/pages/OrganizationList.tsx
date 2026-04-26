import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listOrganizations, createOrganization, deleteOrganization } from '../api/client';

export default function OrganizationList() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');

    const { data: orgs = [], isLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: listOrganizations,
    });

    const createMut = useMutation({
        mutationFn: () => createOrganization({ name, slug }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            setShowForm(false);
            setName('');
            setSlug('');
        },
    });

    const deleteMut = useMutation({
        mutationFn: deleteOrganization,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
    });

    return (
        <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Organizations</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                    {showForm ? 'Cancel' : 'New Organization'}
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
                    className="mb-6 p-4 bg-white rounded shadow space-y-3"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={createMut.isPending}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                    >
                        {createMut.isPending ? 'Creating...' : 'Create'}
                    </button>
                    {createMut.isError && (
                        <p className="text-red-600 text-sm">{(createMut.error as Error).message}</p>
                    )}
                </form>
            )}

            {isLoading ? (
                <p className="text-gray-500">Loading...</p>
            ) : orgs.length === 0 ? (
                <p className="text-gray-500">No organizations yet. Create one to get started.</p>
            ) : (
                <div className="space-y-2">
                    {orgs.map((org) => (
                        <div
                            key={org.id}
                            className="flex items-center justify-between p-4 bg-white rounded shadow hover:shadow-md cursor-pointer"
                            onClick={() => navigate(`/org/${org.id}/dashboard`)}
                        >
                            <div>
                                <h3 className="font-semibold text-gray-800">{org.name}</h3>
                                <p className="text-sm text-gray-500">{org.slug}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/org/${org.id}/dashboard`);
                                    }}
                                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    Open
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Delete this organization and all its data?')) {
                                            deleteMut.mutate(org.id);
                                        }
                                    }}
                                    className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
