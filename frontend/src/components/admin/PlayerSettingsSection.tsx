import { useState, useEffect } from 'react';
import { Check, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { BACKEND_URL } from '../../config';

type Player = 'streamp2p' | 'seekstreaming' | 'upnshare' | 'rpmshare';

const PLAYERS = [
    { id: 'streamp2p' as Player, name: 'StreamP2P', description: 'Primary streaming service' },
    { id: 'seekstreaming' as Player, name: 'SeekStreaming', description: 'Alternative streaming option' },
    { id: 'upnshare' as Player, name: 'UpnShare', description: 'File sharing platform' },
    { id: 'rpmshare' as Player, name: 'Rpmshare', description: 'RPM streaming service' },
];

export default function PlayerSettingsSection() {
    const [selectedPlayer, setSelectedPlayer] = useState<Player>('streamp2p');
    const [currentPlayer, setCurrentPlayer] = useState<Player>('streamp2p');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCurrentSettings();
    }, []);

    const fetchCurrentSettings = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/admin/player-settings`);
            const data = await response.json();

            if (data.success) {
                const player = data.data.defaultPlayer as Player;
                setSelectedPlayer(player);
                setCurrentPlayer(player);
            }
        } catch (error) {
            console.error('Failed to fetch player settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch(`${BACKEND_URL}/admin/save-player-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ defaultPlayer: selectedPlayer })
            });

            const data = await response.json();

            if (data.success) {
                setCurrentPlayer(selectedPlayer);
                toast.success('Player settings saved successfully!');
            } else {
                toast.error(data.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Failed to save player settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    const hasChanges = selectedPlayer !== currentPlayer;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Default Player Settings</h2>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <p className="text-slate-300 mb-6">
                    Select which player opens first for all users when they play a video.
                </p>

                <div className="space-y-3">
                    {PLAYERS.map((player) => {
                        const isSelected = selectedPlayer === player.id;
                        const isCurrent = currentPlayer === player.id;

                        return (
                            <button
                                key={player.id}
                                onClick={() => setSelectedPlayer(player.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${isSelected
                                    ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20'
                                    : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                            ? 'border-purple-500 bg-purple-600'
                                            : 'border-slate-500'
                                            }`}
                                    >
                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                            {player.name}
                                            {isCurrent && (
                                                <span className="ml-2 text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-slate-400">{player.description}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {hasChanges && (
                    <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                        <p className="text-sm text-yellow-400">
                            ⚠️ You have unsaved changes. Click "Save Settings" to apply them.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
