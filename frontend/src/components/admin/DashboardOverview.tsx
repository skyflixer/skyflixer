import { useState, useEffect } from 'react';
import { TrendingUp, Github, Play, Loader2 } from 'lucide-react';
import { BACKEND_URL } from '../../config';

export default function DashboardOverview() {
    const [stats, setStats] = useState({
        posts: 0,
        connected: false,
        defaultPlayer: 'streamp2p'
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        // Refresh stats when user returns to dashboard
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchStats();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const fetchStats = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            // Fetch GitHub status and player settings in parallel
            const [githubRes, playerRes] = await Promise.all([
                fetch(`${BACKEND_URL}/admin/github-status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${BACKEND_URL}/admin/player-settings`)
            ]);

            const githubData = await githubRes.json();
            const playerData = await playerRes.json();

            setStats({
                posts: githubData.success ? githubData.data.manualPostsCount || 0 : 0,
                connected: githubData.success ? githubData.data.connected : false,
                defaultPlayer: playerData.success ? playerData.data.defaultPlayer : 'streamp2p'
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h2>
                <p className="text-slate-400">Welcome to your admin panel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-purple-400">Manual Posts</h3>
                        <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-4xl font-bold text-white">{stats.posts}</p>
                    <p className="text-sm text-slate-400 mt-2">Stored in GitHub</p>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-purple-400">GitHub Status</h3>
                        <Github className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className={`text-4xl font-bold ${stats.connected ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.connected ? 'Connected' : 'Disconnected'}
                    </p>
                    <p className="text-sm text-slate-400 mt-2">Repository sync status</p>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-purple-400">Default Player</h3>
                        <Play className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white capitalize">{stats.defaultPlayer}</p>
                    <p className="text-sm text-slate-400 mt-2">Primary video player</p>
                </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">📋 Quick Start Guide</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                    <li>• <strong>Edit Posts:</strong> Search and edit movie/TV show metadata, add player links</li>
                    <li>• <strong>Player Settings:</strong> Set the default video player for all users</li>
                    <li>• <strong>GitHub Status:</strong> Monitor repository connection and recent activity</li>
                </ul>
            </div>
        </div>
    );
}
