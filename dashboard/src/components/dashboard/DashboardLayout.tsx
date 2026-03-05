import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Building2, Target, BarChart3, Settings, ChevronLeft, TrendingUp, Search, Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Target, label: 'Pipeline' },
];

export function DashboardLayout({ children, activeTab, onTabChange }: Props) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <motion.aside
                animate={{ width: collapsed ? 72 : 240 }}
                transition={{ duration: 0.2 }}
                className={`gradient-dark flex-shrink-0 flex-col border-r border-sidebar-border z-50 hidden lg:flex`}
            >
                <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
                    {!collapsed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-display font-bold text-sidebar-foreground text-sm">M&A Thesis Research Tool</span>
                        </motion.div>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mx-auto">
                            <TrendingUp className="w-4 h-4 text-primary-foreground" />
                        </div>
                    )}
                    <button onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors hidden lg:block">
                        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                <nav className="flex-1 py-4 space-y-1 px-3">
                    {navItems.map(item => (
                        <button
                            key={item.label}
                            onClick={() => onTabChange(item.label)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === item.label
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                                }`}
                        >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            {!collapsed && <span className="font-medium">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {!collapsed && (
                    <div className="p-4 border-t border-sidebar-border">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                                {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name || 'User'}</p>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${user?.role === 'admin' ? 'text-primary' : 'text-sidebar-foreground/50'
                                    }`}>{user?.role || 'viewer'}</span>
                            </div>
                            <button
                                onClick={logout}
                                title="Log out"
                                className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors flex-shrink-0"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div className="p-3 border-t border-sidebar-border flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <button
                            onClick={logout}
                            title="Log out"
                            className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </motion.aside>

            {/* Mobile sidebar */}
            <motion.aside
                initial={{ x: -280 }}
                animate={{ x: mobileOpen ? 0 : -280 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-y-0 left-0 w-64 gradient-dark z-50 flex flex-col lg:hidden"
            >
                <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-display font-bold text-sidebar-foreground text-sm">M&A Thesis Research Tool</span>
                </div>
                <nav className="flex-1 py-4 space-y-1 px-3">
                    {navItems.map(item => (
                        <button
                            key={item.label}
                            onClick={() => { onTabChange(item.label); setMobileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === item.label
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </motion.aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground">
                            <Menu className="w-5 h-5" />
                        </button>

                    </div>
                    <div className="flex items-center gap-3">

                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold lg:hidden">JD</div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
