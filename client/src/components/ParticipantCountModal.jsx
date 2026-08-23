import React, { useState } from 'react';
import { X, Users, AlertCircle, Loader2 } from 'lucide-react';
import { changeParticipantCount } from '../services/competitionService';

const ParticipantCountModal = ({ competition, onClose, onUpdate }) => {
    const currentCount = competition.playersPerClan || 5;
    const newCount = currentCount === 5 ? 4 : 5;
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modifications, setModifications] = useState({});

    // For 5 -> 4, admin selects 1 player to remove from each clan
    // For 4 -> 5, admin enters 1 new player name for each clan

    const handleModificationChange = (clanId, value) => {
        setModifications(prev => ({
            ...prev,
            [clanId]: value
        }));
    };

    const isFormValid = () => {
        if (!competition.clans) return false;
        return competition.clans.every(clan => {
            const val = modifications[clan._id || clan.id];
            return val && val.trim() !== '';
        });
    };

    const handleSubmit = async () => {
        if (!isFormValid()) {
            setError('Please complete the form for all clans.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const modsArray = competition.clans.map(clan => {
                const clanId = clan._id || clan.id;
                if (newCount === 4) {
                    return { clanId, playerIdToRemove: modifications[clanId] };
                } else {
                    return { clanId, newPlayerName: modifications[clanId] };
                }
            });

            const competitionId = competition._id || competition.id;
            await changeParticipantCount(competitionId, newCount, modsArray);
            
            onUpdate();
        } catch (err) {
            setError(err.message || 'Failed to update participant count');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full border border-amber-500/20 shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Users className="text-amber-400" />
                        Change Participant Count to {newCount}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500/30 rounded-lg p-3 mb-6 flex items-center text-red-300">
                        <AlertCircle className="mr-3 flex-shrink-0" size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="mb-4 text-gray-300">
                    {newCount === 4 ? (
                        <p>You are changing the tournament from 5 participants to 4. Please select which player to <strong>remove</strong> from each clan.</p>
                    ) : (
                        <p>You are changing the tournament from 4 participants to 5. Please enter the name of the new player to <strong>add</strong> to each clan. They will be paired against each other in fixtures.</p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {competition.clans?.map(clan => (
                        <div key={clan._id || clan.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <h4 className="text-lg font-medium text-amber-400 mb-3">{clan.name}</h4>
                            
                            {newCount === 4 ? (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Select Player to Remove:</label>
                                    <select 
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none focus:border-amber-500"
                                        value={modifications[clan._id || clan.id] || ''}
                                        onChange={(e) => handleModificationChange(clan._id || clan.id, e.target.value)}
                                    >
                                        <option value="">-- Select Player --</option>
                                        {clan.members?.map(member => (
                                            <option key={member._id || member.id} value={member._id || member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">New Player Name:</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter player name"
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none focus:border-amber-500"
                                        value={modifications[clan._id || clan.id] || ''}
                                        onChange={(e) => handleModificationChange(clan._id || clan.id, e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
                    <button onClick={onClose} disabled={loading} className="w-full sm:w-1/2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={loading || !isFormValid()} 
                        className={`w-full sm:w-1/2 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                            isFormValid() ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        {loading ? 'Updating...' : 'Confirm Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParticipantCountModal;
