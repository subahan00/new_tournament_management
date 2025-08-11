import React from 'react';

// --- SVG Icons for Bidders List ---
const UsersIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

const BidderCard = ({ bidder }) => {
  const isOnline = bidder.isOnline; // Assuming this prop exists
  return (
    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80 transition-all hover:bg-slate-800 hover:border-slate-600">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-cyan-400`}>
              {bidder.name.charAt(0)}
            </div>
            <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'} border-2 border-slate-800`}></span>
          </div>
          <div>
            <span className="text-white font-medium text-sm">{bidder.name}</span>
            <p className="text-xs text-slate-400">{bidder.teamName}</p>
          </div>
        </div>
      </div>

      <div className="space-y-1 mt-3 pt-2 border-t border-slate-700/50">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Budget:</span>
          <span className="text-cyan-400 font-mono">${bidder.remainingBudget?.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Players Won:</span>
          <span className="text-white font-semibold">{bidder.playersWon?.length || 0}</span>
        </div>
      </div>
    </div>
  );
};

const PendingBidderCard = ({ bidder }) => (
  <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/20">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center font-bold text-yellow-400">
        {bidder.name.charAt(0)}
      </div>
      <div>
        <div className="text-yellow-300 font-medium text-sm">{bidder.name}</div>
        <div className="text-xs text-yellow-400/70">{bidder.teamName}</div>
      </div>
    </div>
  </div>
);


const BiddersList = ({ bidders }) => {
  const approvedBidders = bidders.filter(b => b.status === 'approved');
  const pendingBidders = bidders.filter(b => b.status === 'pending');

  // Note: Removed layout classes (h-full, flex) from the root div.
  // The parent component in AuctionRoom.jsx now correctly controls the layout and scrolling.
  return (
    <div>
      {/* Header is now sticky to the top of its scrolling container */}
      <div className="p-4 border-b border-slate-700 sticky top-0 bg-black/20 backdrop-blur-sm z-10">
        <h3 className="text-base font-semibold text-white flex items-center gap-3">
          <UsersIcon className="h-5 w-5 text-slate-400" />
          <span>Bidders</span>
          <span className="ml-auto text-sm font-normal bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
            {approvedBidders.length} Active
          </span>
        </h3>
      </div>

      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {/* Approved Bidders */}
        {approvedBidders.map(bidder => (
          <BidderCard key={bidder._id} bidder={bidder} />
        ))}

        {/* Pending Bidders */}
        {pendingBidders.length > 0 && (
          <>
            <div className="pt-2">
              <div className="text-yellow-400 text-xs font-semibold mb-2">
                PENDING APPROVAL
              </div>
            </div>
            {pendingBidders.map(bidder => (
              <PendingBidderCard key={bidder._id} bidder={bidder} />
            ))}
          </>
        )}

        {bidders.length === 0 && (
          <div className="text-center text-slate-500 pt-16">
            <UsersIcon className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">No bidders have joined yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BiddersList;
