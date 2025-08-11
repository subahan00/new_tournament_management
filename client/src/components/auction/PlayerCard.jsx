import React, { useState } from 'react';

// --- SVG Icons for Player Positions ---
const GoalkeeperIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18"></path><path d="M15 3v18"></path><path d="M3 9h18"></path><path d="M3 15h18"></path></svg>
);
const DefenderIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
const MidfielderIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 2-2.5 5-5-1 2 4.5-3.5 3.5 4.5 2-1 5 5-2.5 5 2.5-1-5 4.5-2-3.5-3.5 2-4.5-5 1z"/></svg>
);
const ForwardIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const UserIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const PlayerCard = ({ player, userType, userStatus, onBid, canBid }) => {
  const [bidAmount, setBidAmount] = useState('');

  const handleCustomBid = (e) => {
    e.preventDefault();
    if (bidAmount && parseInt(bidAmount) > player.currentPrice) {
      onBid(bidAmount);
      setBidAmount('');
    }
  };

  const getPositionStyle = (position) => {
    switch (position) {
      case 'Goalkeeper': return { colorClass: 'bg-amber-500/10 text-amber-400', Icon: GoalkeeperIcon };
      case 'Defender': return { colorClass: 'bg-blue-500/10 text-blue-400', Icon: DefenderIcon };
      case 'Midfielder': return { colorClass: 'bg-green-500/10 text-green-400', Icon: MidfielderIcon };
      case 'Forward': return { colorClass: 'bg-red-500/10 text-red-400', Icon: ForwardIcon };
      default: return { colorClass: 'bg-slate-500/10 text-slate-400', Icon: UserIcon };
    }
  };

  const { colorClass, Icon } = getPositionStyle(player.position);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Side: Player Info */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 flex flex-col items-center text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${colorClass}`}>
                <Icon className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-1">{player.name}</h1>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
                {player.position}
            </div>
            <div className="w-full my-6">
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Rating</span>
                    <span className="font-semibold text-white">{player.rating}/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div 
                        className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${player.rating}%` }}
                    ></div>
                </div>
            </div>
            <div className="w-full text-sm text-slate-400 flex justify-between border-t border-slate-700 pt-4">
                <span>Base Price:</span>
                <span className="font-mono text-white">${player.basePrice?.toLocaleString()}</span>
            </div>
        </div>

        {/* Right Side: Bidding Section */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 flex flex-col justify-center text-center">
            <div className="mb-6">
                <div className="text-slate-400 mb-1">Current Bid</div>
                <div className="text-6xl font-bold text-cyan-400 animate-pulse">
                    ${player.currentPrice?.toLocaleString()}
                </div>
            </div>

            {/* Bidding Controls */}
            {userType === 'bidder' && canBid && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[50000, 100000, 200000].map(increment => (
                    <button
                      key={increment}
                      onClick={() => onBid(player.currentPrice + increment)}
                      className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 py-3 px-2 rounded-md transition-colors font-semibold"
                    >
                      +${(increment / 1000)}k
                    </button>
                  ))}
                </div>
                <form onSubmit={handleCustomBid} className="flex space-x-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Custom bid"
                    min={player.currentPrice + 1}
                    className="flex-1 p-3 border border-slate-600 rounded-md bg-slate-800 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!bidAmount || parseInt(bidAmount) <= player.currentPrice}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-400 text-white px-6 py-3 rounded-md font-semibold transition-colors"
                  >
                    Bid
                  </button>
                </form>
              </div>
            )}

            {/* Status Messages */}
            {userType === 'bidder' && !canBid && (
                <div className="text-yellow-400 bg-yellow-500/10 p-4 rounded-lg">
                    {userStatus === 'pending' ? 'Waiting for admin approval' : 'Bidding is paused'}
                </div>
            )}
            {userType === 'viewer' && (
                <div className="text-indigo-400 bg-indigo-500/10 p-4 rounded-lg">
                    You are viewing the auction.
                </div>
            )}
            {userType === 'admin' && (
                <div className="text-amber-400 bg-amber-500/10 p-4 rounded-lg">
                    Manage this player using the admin controls.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
