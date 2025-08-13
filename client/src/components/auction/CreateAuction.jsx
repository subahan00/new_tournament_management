// components/auction/CreateAuction.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const CreateAuction = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // State for the main auction details
  const [auctionData, setAuctionData] = useState({
    name: '',
    description: '',
    totalBudget: 1000000
  });

  // State for the list of players to be added to the auction
  // This is updated to match the new eFootball-specific model
  const [players, setPlayers] = useState([
    {
      name: '',
      trophiesWon: 0,
      division1ReachedCount: 0,
      basePrice: 100000
    }
  ]);

  // Handler for auction detail changes
  const handleAuctionChange = (e) => {
    setAuctionData({
      ...auctionData,
      [e.target.name]: e.target.value
    });
  };

  // Handler for individual player field changes
  const handlePlayerChange = (index, field, value) => {
    const updatedPlayers = [...players];
    updatedPlayers[index][field] = value;
    setPlayers(updatedPlayers);
  };

  // Adds a new blank player form
  const addPlayer = () => {
    setPlayers([...players, {
      name: '',
      trophiesWon: 0,
      division1ReachedCount: 0,
      basePrice: 100000
    }]);
  };

  // Removes a player form
  const removePlayer = (index) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  // Handles the final form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Validation ---
    if (!auctionData.name.trim()) {
      setMessage('Please enter an auction name.');
      return;
    }

    // Validate player fields based on the new model
    const invalidPlayers = players.some(p =>
      !p.name.trim() || p.trophiesWon < 0 || p.division1ReachedCount < 0 || p.basePrice < 1
    );
    if (invalidPlayers) {
      setMessage('Please fill all player details correctly. All numbers must be positive.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Prepare the payload for the API
      const payload = {
        ...auctionData,
        players: players.map(p => ({
          ...p,
          trophiesWon: parseInt(p.trophiesWon, 10),
          division1ReachedCount: parseInt(p.division1ReachedCount, 10),
          basePrice: parseInt(p.basePrice, 10)
        }))
      };

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auctions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Auction created successfully!');
      setTimeout(() => {
        navigate(`/auction/${response.data._id}`);
      }, 2000);

    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create auction');
    }

    setLoading(false);
  };

  // Generates sample players based on the new eFootball model
  const generateSamplePlayers = () => {
    const samplePlayers = [
      { name: 'eFootball Champion', trophiesWon: 15, division1ReachedCount: 25, basePrice: 1000000 },
      { name: 'Division 1 Veteran', trophiesWon: 5, division1ReachedCount: 50, basePrice: 800000 },
      { name: 'Consistent Performer', trophiesWon: 8, division1ReachedCount: 30, basePrice: 750000 },
      { name: 'Cup Specialist', trophiesWon: 20, division1ReachedCount: 10, basePrice: 600000 },
      { name: 'Rising Star', trophiesWon: 2, division1ReachedCount: 5, basePrice: 400000 },
    ];
    setPlayers(samplePlayers);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-2xl border border-gold-600 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gold-600 to-gold-500 p-6">
            <h1 className="text-3xl font-bold text-white">Create New Auction</h1>
            <p className="text-gold-100 mt-2">Set up a new player auction for your eFootball tournament</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg text-center ${
                message.includes('success') ?
                'bg-green-900 text-green-300 border border-green-700' :
                'bg-red-900 text-red-300 border border-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* Auction Details Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gold-300 border-b border-gold-600 pb-2">
                Auction Details
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gold-300 text-sm font-medium mb-2">Auction Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={auctionData.name}
                    onChange={handleAuctionChange}
                    className="w-full p-3 border border-gray-600 rounded-lg bg-slate-700 text-white focus:border-gold-500 focus:outline-none"
                    placeholder="e.g., eFootball Championship 2024"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gold-300 text-sm font-medium mb-2">Budget per Team</label>
                  <input
                    type="number"
                    name="totalBudget"
                    value={auctionData.totalBudget}
                    onChange={handleAuctionChange}
                    className="w-full p-3 border border-gray-600 rounded-lg bg-slate-700 text-white focus:border-gold-500 focus:outline-none"
                    min="100000"
                    step="50000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gold-300 text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={auctionData.description}
                  onChange={handleAuctionChange}
                  rows={3}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-slate-700 text-white focus:border-gold-500 focus:outline-none"
                  placeholder="Describe your auction..."
                />
              </div>
            </div>

            {/* Players Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gold-300 border-b border-gold-600 pb-2 flex-1">
                  Players ({players.length})
                </h2>
                <button
                  type="button"
                  onClick={generateSamplePlayers}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Load Sample Players
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto p-2">
                {players.map((player, index) => (
                  <div key={index} className="bg-slate-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-medium">Player {index + 1}</h3>
                      {players.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlayer(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* UPDATED PLAYER FIELDS */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Player Name */}
                      <div>
                        <label className="block text-gold-300 text-xs font-medium mb-1">Name *</label>
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-600 rounded bg-slate-600 text-white text-sm focus:border-gold-500 focus:outline-none"
                          placeholder="Player name"
                          required
                        />
                      </div>

                      {/* Trophies Won */}
                      <div>
                        <label className="block text-gold-300 text-xs font-medium mb-1">Trophies Won</label>
                        <input
                          type="number"
                          value={player.trophiesWon}
                          onChange={(e) => handlePlayerChange(index, 'trophiesWon', e.target.value)}
                          className="w-full p-2 border border-gray-600 rounded bg-slate-600 text-white text-sm focus:border-gold-500 focus:outline-none"
                          min="0"
                        />
                      </div>

                      {/* Division 1 Reached Count */}
                      <div>
                        <label className="block text-gold-300 text-xs font-medium mb-1">Times Reached Div 1</label>
                        <input
                          type="number"
                          value={player.division1ReachedCount}
                          onChange={(e) => handlePlayerChange(index, 'division1ReachedCount', e.target.value)}
                          className="w-full p-2 border border-gray-600 rounded bg-slate-600 text-white text-sm focus:border-gold-500 focus:outline-none"
                          min="0"
                        />
                      </div>

                      {/* Base Price */}
                      <div>
                        <label className="block text-gold-300 text-xs font-medium mb-1">Base Price</label>
                        <input
                          type="number"
                          value={player.basePrice}
                          onChange={(e) => handlePlayerChange(index, 'basePrice', e.target.value)}
                          className="w-full p-2 border border-gray-600 rounded bg-slate-600 text-white text-sm focus:border-gold-500 focus:outline-none"
                          min="1000"
                          step="1000"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addPlayer}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg border-2 border-dashed border-blue-400 transition-colors"
              >
                + Add Another Player
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gold-600 hover:bg-gold-700 disabled:bg-gold-800 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Creating...' : 'Create Auction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;
