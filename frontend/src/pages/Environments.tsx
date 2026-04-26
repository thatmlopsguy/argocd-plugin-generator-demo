import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { listEnvironments, createEnvironment, updateEnvironment, deleteEnvironment } from '../api/client';
import type { Environment } from '../api/types';

function SortableEnvItem({
    env,
    onDelete,
}: {
    env: Environment;
    onDelete: (id: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: env.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-4 bg-white rounded shadow"
        >
            <div className="flex items-center gap-4">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
                    title="Drag to reorder"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="3" r="1.5" />
                        <circle cx="11" cy="3" r="1.5" />
                        <circle cx="5" cy="8" r="1.5" />
                        <circle cx="11" cy="8" r="1.5" />
                        <circle cx="5" cy="13" r="1.5" />
                        <circle cx="11" cy="13" r="1.5" />
                    </svg>
                </button>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-indigo-100 text-indigo-700 text-sm font-mono">
                    {env.sort_order}
                </span>
                <div>
                    <h3 className="font-semibold text-gray-800">{env.name}</h3>
                    <p className="text-sm text-gray-500">{env.slug}</p>
                </div>
            </div>
            <button
                onClick={() => { if (confirm('Delete this environment?')) onDelete(env.id); }}
                className="text-red-600 hover:underline text-sm"
            >
                Delete
            </button>
        </div>
    );
}

export default function Environments() {
    const { orgId } = useParams<{ orgId: string }>();
    const id = Number(orgId);
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '', sort_order: 0 });

    const { data: envs = [], isLoading } = useQuery({
        queryKey: ['environments', id],
        queryFn: () => listEnvironments(id),
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const createMut = useMutation({
        mutationFn: () => createEnvironment(id, form),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['environments', id] });
            setShowForm(false);
            setForm({ name: '', slug: '', sort_order: 0 });
        },
    });

    const deleteMut = useMutation({
        mutationFn: (envId: number) => deleteEnvironment(id, envId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['environments', id] }),
    });

    const reorderMut = useMutation({
        mutationFn: async (reordered: Environment[]) => {
            await Promise.all(
                reordered.map((env, index) =>
                    updateEnvironment(id, env.id, { sort_order: index + 1 }),
                ),
            );
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['environments', id] }),
    });

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = envs.findIndex((e) => e.id === active.id);
        const newIndex = envs.findIndex((e) => e.id === over.id);
        const reordered = arrayMove(envs, oldIndex, newIndex);

        // Optimistic update
        queryClient.setQueryData(['environments', id], reordered);
        reorderMut.mutate(reordered);
    }

    return (
        <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Environments</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                    {showForm ? 'Cancel' : 'New Environment'}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input
                            type="number"
                            value={form.sort_order}
                            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
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
            ) : envs.length === 0 ? (
                <p className="text-gray-500">No environments yet.</p>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={envs.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {envs.map((env) => (
                                <SortableEnvItem
                                    key={env.id}
                                    env={env}
                                    onDelete={(envId) => deleteMut.mutate(envId)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    {reorderMut.isPending && (
                        <p className="mt-2 text-xs text-gray-400">Saving order...</p>
                    )}
                </DndContext>
            )}
        </div>
    );
}
