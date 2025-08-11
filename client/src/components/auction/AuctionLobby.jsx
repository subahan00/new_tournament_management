// components/auction/AuctionLobby.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AuctionLobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinType, setJoinType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    teamName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAuction();
  }, [id]);

  const fetchAuction = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auctions/${id}`);
      setAuction(response.data.auction);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching auction:', error);
      setMessage('Failed to load auction');
      setLoading(false);
    }
  };

  const handleJoinAsAdmin = () => {
    if (user && token) {
      navigate(`/auction/${id}/room?type=admin&token=${token}`);
    } else {
      navigate('/login');
    }
  };

  const handleJoinAsBidder = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.teamName) {
      setMessage('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auctions/${id}/join-bidder`, formData);
      setMessage('Request sent! Please wait for admin approval.');
      
      // Navigate to room with bidder ID
      setTimeout(() => {
        navigate(`/auction/${id}/room?type=bidder&bidderId=${response.data._id}`);
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to join auction');
    }
    setSubmitting(false);
  };

  const handleJoinAsViewer = () => {
    const viewerName = formData.name || 'Anonymous';
    navigate(`/auction/${id}/room?type=viewer&name=${viewerName}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-gold-300 text-xl">Loading auction...</div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Auction not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold-300 mb-2">{auction.name}</h1>
          <p className="text-gold-400">{auction.description}</p>
          <div className="flex justify-center items-center space-x-4 mt-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              auction.status === 'active' ? 'bg-green-600 text-white' :
              auction.status === 'paused' ? 'bg-yellow-600 text-white' :
              auction.status === 'completed' ? 'bg-red-600 text-white' :
              'bg-gray-600 text-white'
            }`}>
              {auction.status.toUpperCase()}
            </span>
            <span className="text-gold-400">Budget: ${auction.totalBudget.toLocaleString()}</span>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center ${
            message.includes('success') || message.includes('sent') ? 
            'bg-green-900 text-green-300 border border-green-700' :
            'bg-red-900 text-red-300 border border-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Join Options */}
        {!joinType && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Admin Option */}
            <div className="bg-slate-800 border border-gold-600 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gold-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gold-300 mb-2">Join as Admin</h3>
              <p className="text-gray-300 mb-4">Manage the auction, approve bidders, and control the flow</p>
              <button 
                onClick={handleJoinAsAdmin}
                className="w-full bg-gold-600 text-white py-2 px-4 rounded-lg hover:bg-gold-700 transition-colors"
              >
                Login as Admin
              </button>
            </div>

            {/* Bidder Option */}
            <div className="bg-slate-800 border border-blue-600 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-300 mb-2">Join as Bidder</h3>
              <p className="text-gray-300 mb-4">Participate in bidding and build your team</p>
              <button 
                onClick={() => setJoinType('bidder')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request to Bid
              </button>
            </div>

            {/* Viewer Option */}
            <div className="bg-slate-800 border border-green-600 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-300 mb-2">Join as Viewer</h3>
              <p className="text-gray-300 mb-4">Watch the auction and participate in chat</p>
              <button 
                onClick={() => setJoinType('viewer')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Watch Auction
              </button>
            </div>
          </div>
        )}

        {/* Bidder Form */}
        {joinType === 'bidder' && (
          <div className="max-w-md mx-auto bg-slate-800 border border-blue-600 rounded-xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-blue-300 mb-2">Join as Bidder</h3>
              <p className="text-gray-300">Please provide your details to request joining</p>
            </div>
            
            <form onSubmit={handleJoinAsBidder} className="space-y-4">
              <div>
                <label className="block text-gold-300 text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-slate-700 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gold-300 text-sm font-medium mb-2">Team Name</label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => setFormData({...formData, teamName: e.target.value})}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-slate-700 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your team name"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setJoinType('')}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Request to Join'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Viewer Form */}
        {joinType === 'viewer' && (
          <div className="max-w-md mx-auto bg-slate-800 border border-green-600 rounded-xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-green-300 mb-2">Join as Viewer</h3>
              <p className="text-gray-300">Optionally provide your name for chat</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gold-300 text-sm font-medium mb-2">Display Name (Optional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-slate-700 text-white focus:border-green-500 focus:outline-none"
                  placeholder="Enter display name or leave empty"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setJoinType('')}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleJoinAsViewer}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Join as Viewer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionLobby;