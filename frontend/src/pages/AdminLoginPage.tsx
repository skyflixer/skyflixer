import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { BACKEND_URL } from '../config';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            // Verify token
            verifyToken(token);
        }
    }, []);

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/admin/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Token is valid, redirect to dashboard
                navigate('/zends3389/dashboard');
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('admin_token');
            }
        } catch (error) {
            localStorage.removeItem('admin_token');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store token and redirect
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_token_expiry', String(Date.now() + 30 * 60 * 1000)); // 30 min
                navigate('/zends3389/dashboard');
            } else {
                setError(data.message || 'Invalid password');
                setPassword('');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error instanceof Error ? error.message : 'Login failed. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl p-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-center text-white mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-center text-slate-400 mb-8">
                        Enter your password to continue
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="••••••••••••"
                                required
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                                <p className="text-sm text-red-400 text-center">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="mt-6 text-center text-xs text-slate-500">
                        Admin access only. Unauthorized access is prohibited.
                    </p>
                </div>
            </div>
        </div>
    );
}
