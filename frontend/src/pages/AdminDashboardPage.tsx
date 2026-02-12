import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Edit, Play, Settings, Github, Activity, LogOut, Menu, X } from 'lucide-react';

// Import sections (will create these next)
import EditPostsSection from '@/components/admin/EditPostsSection';
import PlayerSettingsSection from '@/components/admin/PlayerSettingsSection';
import GitHubStatusSection from '@/components/admin/GitHubStatusSection';
import DashboardOverview from '@/components/admin/DashboardOverview';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://skyflixer1-skyflixer-backend.hf.space';

type Section = 'dashboard' | 'edit' | 'player' | 'status';

export default function AdminDashboardPage() {
    const [activeSection, setActiveSection] = useState<Section>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const navigate = useNavigate();

    // Check authentication on mount
    useEffect(() => {
        checkAuth();
        // Setup auto-logout on token expiry
        const checkExpiry = setInterval(() => {
            const expiry = localStorage.getItem('admin_token_expiry');
            if (expiry && Date.now() > parseInt(expiry)) {
                handleLogout();
            }
        }, 60000); // Check every minute

        return () => clearInterval(checkExpiry);
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('admin_token');

        if (!token) {
            navigate('/zends3389');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                handleLogout();
            } else {
                setIsCheckingAuth(false);
            }
        } catch (error) {
            handleLogout();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_token_expiry');
        navigate('/zends3389');
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white">Verifying authentication...</div>
            </div>
        );
    }

    const menuItems = [
        { id: 'dashboard' as Section, label: 'Dashboard', icon: Home },
        { id: 'edit' as Section, label: 'Edit Posts', icon: Edit },
        { id: 'player' as Section, label: 'Player Settings', icon: Play },
        { id: 'status' as Section, label: 'GitHub Status', icon: Github },
    ];

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-0'
                    } bg-slate-800 border-r border-slate-700 transition-all duration-300 overflow-hidden flex flex-col`}
            >
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5" />
                        </div>
                        Admin
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        {isSidebarOpen ? (
                            <X className="w-6 h-6 text-slate-300" />
                        ) : (
                            <Menu className="w-6 h-6 text-slate-300" />
                        )}
                    </button>

                    <h2 className="text-xl font-semibold text-white">
                        {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                    </h2>

                    <div className="text-sm text-slate-400">
                        Admin Panel
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    {activeSection === 'dashboard' && <DashboardOverview />}
                    {activeSection === 'edit' && <EditPostsSection />}
                    {activeSection === 'player' && <PlayerSettingsSection />}
                    {activeSection === 'status' && <GitHubStatusSection />}
                </main>
            </div>
        </div>
    );
}
