// components/auction/ManageAuctions.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const ManageAuctions = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
      setMessage('Failed to load auctions');
      setLoading(false);
    }
  };

  const updateAuctionStatus = async (auctionId, newStatus) => {
    try {
      await axios.patch(`${process.env.REACT_APP_BACKEND_URL}/api/auctions/${auctionId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAuctions(auctions.map(auction => 
        auction._id === auctionId ? { ...auction, status: newStatus } : auction
      ));
      setMessage(`Auction status updated to ${newStatus}`);
    } catch (error) {
      setMessage('Failed to update auction status');
    }
  };

  const deleteAuction = async (auctionId) => {
    if (!window.confirm('Are you sure you want to delete this auction? This will also delete all related data.')) {
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/auctions/${auctionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAuctions(auctions.filter(auction => auction._id !== auctionId));
      setMessage('Auction deleted successfully');
    } catch (error) {
      setMessage('Failed to delete auction');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'paused': return 'bg-yellow-600';
      case 'completed': return 'bg-red-600';
      default: return 'bg-gray-600';
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gold-300">Manage Auctions</h1>
            <p className="text-gold-400 mt-2">Create, edit, and manage your player auctions</p>
          </div>
          <Link
            to="/admin/create-auction"
            className="bg-gold-600 hover:bg-gold-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Create New Auction</span>
          </Link>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') || message.includes('updated') || message.includes('deleted') ? 
            'bg-green-900 text-green-300 border border-green-700' :
            'bg-red-900 text-red-300 border border-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Auctions List */}
        {auctions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏟️</div>
            <div className="text-2xl text-gold-300 mb-4">No Auctions Created Yet</div>
            <Link
              to="/admin/create-auction"
              className="bg-gold-600 hover:bg-gold-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Your First Auction
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {auctions.map(auction => (
              <div key={auction._id} className="bg-slate-800 border border-gold-600 rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-xl font-bold text-gold-300">{auction.name}</h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getStatusColor(auction.status)}`}>
                          {getStatusIcon(auction.status)} {auction.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {auction.description && (
                        <p className="text-gray-300 mb-2">{auction.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <span>Created: {new Date(auction.createdAt).toLocaleDateString()}</span>
                        <span>Budget: ${auction.totalBudget?.toLocaleString()}</span>
                        <span>Admin: {auction.adminId?.username}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {/* Status Controls */}
                    {auction.status === 'draft' && (
                      <button
                        onClick={() => updateAuctionStatus(auction._id, 'active')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    
                    {auction.status === 'active' && (
                      <button
                        onClick={() => updateAuctionStatus(auction._id, 'paused')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Pause
                      </button>
                    )}
                    
                    {auction.status === 'paused' && (
                      <>
                        <button
                          onClick={() => updateAuctionStatus(auction._id, 'active')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Resume
                        </button>
                        <button
                          onClick={() => updateAuctionStatus(auction._id, 'completed')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Mark Complete
                        </button>
                      </>
                    )}

                    {/* Navigation Buttons */}
                    <Link
                      to={`/auction/${auction._id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      View Public Page
                    </Link>
                    
                    <Link
                      to={`/auction/${auction._id}/room?type=admin&token=${token}`}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Enter as Admin
                    </Link>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteAuction(auction._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors ml-auto"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <AuctionStats auctionId={auction._id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Quick stats component for each auction
const AuctionStats = ({ auctionId }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [auctionId]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auctions/${auctionId}`);
      const { players, bidders } = response.data;
      
      const soldPlayers = players?.filter(p => p.status === 'sold') || [];
      const approvedBidders = bidders?.filter(b => b.status === 'approved') || [];
      const totalValue = soldPlayers.reduce((sum, player) => sum + (player.soldPrice || 0), 0);

      setStats({
        totalPlayers: players?.length || 0,
        soldPlayers: soldPlayers.length,
        totalBidders: bidders?.length || 0,
        approvedBidders: approvedBidders.length,
        totalValue
      });
    } catch (error) {
      console.error('Error fetching auction stats:', error);
    }
  };

  if (!stats) {
    return <div className="text-gray-400 text-sm">Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
      <div>
        <div className="text-lg font-bold text-white">{stats.totalPlayers}</div>
        <div className="text-xs text-gray-400">Total Players</div>
      </div>
      <div>
        <div className="text-lg font-bold text-green-400">{stats.soldPlayers}</div>
        <div className="text-xs text-gray-400">Sold</div>
      </div>
      <div>
        <div className="text-lg font-bold text-blue-400">{stats.approvedBidders}</div>
        <div className="text-xs text-gray-400">Active Bidders</div>
      </div>
      <div>
        <div className="text-lg font-bold text-yellow-400">{stats.totalBidders}</div>
        <div className="text-xs text-gray-400">Total Requests</div>
      </div>
      <div>
        <div className="text-lg font-bold text-gold-400">${(stats.totalValue / 1000000).toFixed(1)}M</div>
        <div className="text-xs text-gray-400">Total Sales</div>
      </div>
    </div>
  );
};

export default ManageAuctions;