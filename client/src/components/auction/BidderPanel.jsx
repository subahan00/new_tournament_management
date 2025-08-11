import React, { useState } from 'react';

// --- SVG Icons for Bidder Panel ---
const WalletIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/></svg>
);
const GavelIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m14 13-7.5 7.5"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>
);
const TrophyIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const HourglassIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>
);


const BidderPanel = ({ bidder, currentPlayer, canBid, onBid }) => {
  const [bidAmount, setBidAmount] = useState('');

  const handleBid = (e) => {
    e.preventDefault();
    if (bidAmount && parseInt(bidAmount) > 0) {
      onBid(bidAmount);
      setBidAmount('');
    }
  };

  const quickBidAmounts = currentPlayer ? [
    currentPlayer.currentPrice + 50000,
    currentPlayer.currentPrice + 100000,
    currentPlayer.currentPrice + 200000
  ] : [];

  if (!bidder) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <HourglassIcon className="h-12 w-12 text-yellow-400/50 mb-4" />
        <h4 className="font-semibold text-yellow-400">Waiting for Approval</h4>
        <p className="text-sm text-slate-500">Your request to join is pending admin review.</p>
      </div>
    );
  }

  return (
    <div className="p-1">
      {/* Bidder Info Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{bidder.name}</h3>
          <p className="text-sm text-slate-400">{bidder.teamName}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-cyan-400">Remaining Budget</div>
          <div className="text-2xl font-semibold text-white">
            ${bidder.remainingBudget?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bidding Controls */}
      {canBid && currentPlayer && (
        <div className="space-y-3 bg-slate-900/50 border border-slate-700 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-white">Place Your Bid</h4>
          <form onSubmit={handleBid} className="flex space-x-2">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter amount"
              min={currentPlayer.currentPrice + 1}
              max={bidder.remainingBudget}
              className="flex-1 p-2 border border-slate-600 rounded-md bg-slate-800 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!bidAmount || parseInt(bidAmount) <= currentPlayer.currentPrice || parseInt(bidAmount) > bidder.remainingBudget}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors font-semibold flex items-center gap-2"
            >
              <GavelIcon className="h-4 w-4" />
              Bid
            </button>
          </form>

          {/* Quick Bid Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickBidAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => onBid(amount)}
                disabled={amount > bidder.remainingBudget}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 disabled:bg-slate-700/50 disabled:text-slate-500 disabled:cursor-not-allowed text-cyan-300 py-2 px-2 rounded-md text-sm transition-colors font-medium"
              >
                ${(amount / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>
      )}
      
      {!canBid && currentPlayer && (
        <div className="text-center text-yellow-400 bg-yellow-500/10 p-3 rounded-lg">
          {bidder.status === 'pending' ? 'Waiting for approval...' : 'Bidding is currently paused'}
        </div>
      )}

      {/* Players Won List */}
      {bidder.playersWon && bidder.playersWon.length > 0 && (
        <div className="mt-4">
          <h4 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-amber-400" />
            Players Won ({bidder.playersWon.length})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
            {bidder.playersWon.map((player, index) => (
              <div key={index} className="text-sm text-slate-300 bg-slate-800/60 p-2 rounded-md flex justify-between">
                <span>{player.name}</span>
                <span className="font-medium text-slate-400">${player.soldPrice?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default BidderPanel;
