import React from 'react';

// --- Icons for the Modal ---
const XIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const UsersIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const PlayerListItem = ({ player, currentPlayerId }) => {
    const getPlayerStatus = () => {
        if (player._id === currentPlayerId) {
            return { text: 'On the Block', style: 'bg-cyan-500/20 text-cyan-400' };
        }
        if (player.soldTo) {
            return { text: 'Sold', style: 'bg-green-500/20 text-green-400' };
        }
        // Assuming a status property exists for unsold players
        if (player.status === 'unsold') {
            return { text: 'Unsold', style: 'bg-red-500/20 text-red-400' };
        }
        return { text: 'Upcoming', style: 'bg-slate-600/50 text-slate-400' };
    };

    const { text, style } = getPlayerStatus();

    return (
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-bold text-white">{player.name}</p>
                    <p className="text-xs text-slate-400">{player.position}</p>
                </div>
                <div className={`px-3 py-1 text-xs font-semibold rounded-full ${style}`}>
                    {text}
                </div>
            </div>
            {player.soldTo && (
                <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-300">
                    Sold to <span className="font-semibold text-white">{player.soldTo.name}</span> for <span className="font-semibold text-green-400">${player.soldPrice?.toLocaleString()}</span>
                </div>
            )}
        </div>
    );
};

const AllPlayersModal = ({ players = [], currentPlayerId, onClose }) => {
    // This stops the background from scrolling when the modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()} // Prevents modal from closing when clicking inside
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                        <UsersIcon className="h-5 w-5 text-slate-400" />
                        All Players ({players.length})
                    </h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Player List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {players.map(player => (
                        <PlayerListItem key={player._id} player={player} currentPlayerId={currentPlayerId} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllPlayersModal;
