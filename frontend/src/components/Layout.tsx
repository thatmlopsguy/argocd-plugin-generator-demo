import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
    { to: '/', label: 'Organizations', icon: '🏢' },
];

const orgNavItems = [
    { to: 'dashboard', label: 'Dashboard', icon: '📊' },
    { to: 'projects', label: 'Projects', icon: '📦' },
    { to: 'environments', label: 'Environments', icon: '🌐' },
    { to: 'tenants', label: 'Tenants', icon: '👥' },
];

export default function Layout({ orgId }: { orgId?: number }) {
    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col">
                <div className="px-4 py-4 border-b border-gray-700">
                    <h1 className="text-lg font-bold tracking-tight">ArgoCD Deploy</h1>
                    <p className="text-xs text-gray-400">Plugin Generator</p>
                </div>
                <nav className="flex-1 px-2 py-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
                                }`
                            }
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                    {orgId && (
                        <>
                            <div className="pt-3 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">
                                Organization
                            </div>
                            {orgNavItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={`/org/${orgId}/${item.to}`}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
                                        }`
                                    }
                                >
                                    <span>{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>
            </aside>
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
