import React from 'react';

// --- SVG Icons for Viewer Panel ---
const EyeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const GavelIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m14 13-7.5 7.5"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>
);


const ViewerPanel = ({ currentPlayer }) => {
  return (
    <div className="p-1">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <EyeIcon className="h-5 w-5 text-indigo-400" />
            <span>Viewer Mode</span>
        </h3>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-center">
            {currentPlayer ? (
                <div>
                    <div className="text-sm text-slate-400 mb-1">Current Bid</div>
                    <div className="text-3xl font-bold text-cyan-400">
                        ${currentPlayer.currentPrice?.toLocaleString()}
                    </div>
                </div>
            ) : (
                <div className="text-slate-500 py-2">
                    <GavelIcon className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm">Waiting for the next player...</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ViewerPanel;
