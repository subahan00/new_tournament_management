// components/auction/AuctionList.jsx - Public page to view all auctions
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auctions`);
      setAuctions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-600 text-white';
      case 'paused': return 'bg-yellow-600 text-white';
      case 'completed': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'paused': return '⏸️';
      case 'completed': return '🏁';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-gold-300 text-xl">Loading auctions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold-300 mb-2">Player Auctions</h1>
          <p className="text-gold-400">Join live auctions and build your dream team</p>
        </div>

        {/* Auctions Grid */}
        {auctions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏟️</div>
            <div className="text-2xl text-gold-300 mb-2">No Auctions Available</div>
            <div className="text-gold-400">Check back later for upcoming auctions</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map(auction => (
              <Link 
                key={auction._id} 
                to={`/auction/${auction._id}`}
                className="group"
              >
                <div className="bg-slate-800 border border-gold-600 rounded-xl overflow-hidden transition-transform group-hover:scale-105 group-hover:border-gold-400">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(auction.status)}`}>
                        {getStatusIcon(auction.status)} {auction.status.toUpperCase()}
                      </span>
                      <div className="text-gold-400 text-sm">
                        {new Date(auction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gold-300 mb-2 group-hover:text-gold-200">
                      {auction.name}
                    </h2>
                    
                    {auction.description && (
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {auction.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gold-300">
                          ${(auction.totalBudget / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-gray-400 text-sm">Budget</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-300">
                          {auction.playerCount || '?'}
                        </div>
                        <div className="text-gray-400 text-sm">Players</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-center space-x-2 text-gold-400 group-hover:text-gold-300">
                        <span>Join Auction</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionList;