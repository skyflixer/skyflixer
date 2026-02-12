import { useState, useEffect } from 'react';
import { Github, RefreshCw, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { BACKEND_URL } from '../../config';

interface GitHubStatus {
    connected: boolean;
    repository?: string;
    manualPostsCount?: number;
    lastSync?: string;
    updatedAt?: string;
    error?: string;
}

interface Commit {
    message: string;
    author: string;
    date: string;
    sha: string;
}

export default function GitHubStatusSection() {
    const [status, setStatus] = useState<GitHubStatus | null>(null);
    const [commits, setCommits] = useState<Commit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchStatus();
        fetchRecentActivity();
    }, []);

    const fetchStatus = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/github-status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setStatus(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch GitHub status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRecentActivity = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/recent-activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setCommits(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch recent activity:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchStatus(), fetchRecentActivity()]);
        setIsRefreshing(false);
        toast.success('Status refreshed');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
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
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">GitHub Sync Status</h2>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Status Card */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${status?.connected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {status?.connected ? (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                            <XCircle className="w-6 h-6 text-red-400" />
                        )}
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-3">
                            {status?.connected ? 'Connected' : 'Not Connected'}
                        </h3>

                        {status?.connected ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Github className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-300">Repository:</span>
                                    <span className="text-white font-mono">{status.repository}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-300">Manual Posts:</span>
                                    <span className="text-purple-400 font-semibold">{status.manualPostsCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-300">Last Sync:</span>
                                    <span className="text-slate-400">{status.lastSync ? formatDate(status.lastSync) : 'Never'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-red-400 text-sm">
                                {status?.error || 'Please configure GITHUB_USERNAME and GITHUB_REPO in backend .env file'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>

                {commits.length > 0 ? (
                    <div className="space-y-3">
                        {commits.map((commit, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex-shrink-0 w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-mono text-purple-400">{commit.sha}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{commit.message}</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {commit.author} · {formatDate(commit.date)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm">No recent activity found</p>
                )}
            </div>

            {/* Configuration Help */}
            {!status?.connected && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                    <h4 className="text-yellow-400 font-semibold mb-2">⚙️ Configuration Required</h4>
                    <p className="text-sm text-yellow-300/80 mb-2">
                        To enable GitHub integration, update your backend <code className="bg-black/30 px-1 rounded">.env</code> file:
                    </p>
                    <pre className="text-xs bg-black/30 p-3 rounded text-yellow-200 overflow-x-auto">
                        {`GITHUB_USERNAME=your-username
GITHUB_REPO=your-repo-name`}
                    </pre>
                </div>
            )}
        </div>
    );
}
