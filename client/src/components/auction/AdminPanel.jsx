import React, { useState } from 'react';

// --- SVG Icons for Admin Controls ---
const PlayIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const PauseIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
);
const SkipForwardIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
);
const GavelIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m14 13-7.5 7.5"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>
);
const UserCheckIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
);
const CheckIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const XIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);


const AdminPanel = ({ 
  auction, 
  currentPlayer, 
  bidders, 
  onStart, 
  onPause, 
  onNext, 
  onSell, 
  onApproveBidder,
  onSkip // new prop
}) => {
  const [showBidders, setShowBidders] = useState(false);
  const pendingBidders = bidders.filter(b => b.status === 'pending');

  const controlButtonClasses = "flex items-center justify-center gap-2 text-sm font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100";
  const primaryButtonClasses = "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20";
  const destructiveButtonClasses = "bg-red-500/10 text-red-400 hover:bg-red-500/20";
  const warningButtonClasses = "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20";

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">Admin Control Deck</h3>
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* Main Controls */}
        {/* I've added 'flex-wrap' here to allow buttons to wrap onto the next line on smaller screens */}
        <div className="flex-1 flex flex-wrap gap-2">
            {auction.status === 'draft' && (
              <button onClick={onStart} className={`${controlButtonClasses} ${primaryButtonClasses}`}>
                <PlayIcon className="h-4 w-4" /> Start Auction
              </button>
            )}
            
            {auction.status === 'active' && (
              <button onClick={() => onPause(true)} className={`${controlButtonClasses} ${warningButtonClasses}`}>
                <PauseIcon className="h-4 w-4" /> Pause
              </button>
            )}
            
            {auction.status === 'paused' && (
              <button onClick={() => onPause(false)} className={`${controlButtonClasses} ${primaryButtonClasses}`}>
                <PlayIcon className="h-4 w-4" /> Resume
              </button>
            )}

            <button onClick={onNext} disabled={auction.status === 'draft' || !!currentPlayer} className={`${controlButtonClasses} bg-slate-700/80 text-slate-300 hover:bg-slate-700`}>
                <SkipForwardIcon className="h-4 w-4" /> Next Player
            </button>

            <button onClick={onSell} disabled={!currentPlayer} className={`${controlButtonClasses} ${destructiveButtonClasses}`}>
                <GavelIcon className="h-4 w-4" /> Sell Player
            </button>
            <button
              onClick={() => {
                if (!currentPlayer) return;
                // Note: window.confirm can be problematic in some environments. 
                // Consider a custom modal component for a better user experience.
                const ok = window.confirm(`Force-skip "${currentPlayer.name || currentPlayer.playerName || 'this player'}"? This will remove them from bidding.`);
                if (ok && typeof onSkip === 'function') onSkip(currentPlayer._id);
              }}
              disabled={!currentPlayer}
              className={`${controlButtonClasses} ${warningButtonClasses}`}
              title="Force-skip current player"
            >
              <XIcon className="h-4 w-4" /> Skip Player
            </button>
        </div>

        {/* Bidder Management */}
        <div className="flex-shrink-0">
            <button
                onClick={() => setShowBidders(!showBidders)}
                className="w-full md:w-auto flex items-center justify-center gap-2 text-sm font-semibold py-3 px-5 rounded-lg transition-colors bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 relative"
            >
                <UserCheckIcon className="h-4 w-4" />
                Manage Bidders
                {pendingBidders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-800">
                    {pendingBidders.length}
                </span>
                )}
            </button>
        </div>
      </div>

      {/* Pending Bidders List */}
      {showBidders && (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <h4 className="text-indigo-300 font-semibold mb-3">Pending Approval</h4>
          {pendingBidders.length > 0 ? (
            <div className="space-y-3">
              {pendingBidders.map(bidder => (
                <div key={bidder._id} className="flex items-center justify-between bg-slate-800/60 p-3 rounded-lg transition-all hover:bg-slate-800">
                  <div>
                    <div className="text-white font-medium">{bidder.name}</div>
                    <div className="text-slate-400 text-sm">{bidder.teamName}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onApproveBidder(bidder._id, true)}
                      className="p-2 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                      aria-label="Approve"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onApproveBidder(bidder._id, false)}
                      className="p-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      aria-label="Reject"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No pending bidders to approve.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
