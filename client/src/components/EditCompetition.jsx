// components/EditCompetition.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import competitionService from '../services/competitionService';
import playerService from '../services/playerService';

const EditCompetition = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'KO_REGULAR',
    players: []
  });
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [competition, players] = await Promise.all([
          competitionService.getCompetition(id),
          playerService.getAllPlayers()
        ]);
        
        setFormData({
          name: competition.name,
          type: competition.type,
          players: competition.players.map(p => p._id)
        });
        setAllPlayers(players);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await competitionService.updateCompetition(id, formData);
      navigate('/competitions', { state: { success: 'Competition updated successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handlePlayerSelect = (playerId) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.includes(playerId)
        ? prev.players.filter(id => id !== playerId)
        : [...prev.players, playerId]
    }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold text-gold-300 mb-6">Edit Competition</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-800 text-red-100 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gold-300 mb-2">Competition Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-gray-700 text-white p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gold-300 mb-2">Competition Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full bg-gray-700 text-white p-2 rounded"
          >
            <option value="KO_REGULAR">KO Regular</option>
            <option value="LEAGUE">League</option>
            <option value="GNG">GNG</option>
          </select>
        </div>

        <div>
          <label className="block text-gold-300 mb-2">Select Players</label>
          <div className="grid grid-cols-2 gap-2">
            {allPlayers.map(player => (
              <button
                type="button"
                key={player._id}
                onClick={() => handlePlayerSelect(player._id)}
                className={`p-2 rounded ${
                  formData.players.includes(player._id)
                    ? 'bg-gold-600 text-black'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {player.name}
              </button>
            ))}
          </div>
          <div className="mt-2 text-gold-300">
            Selected: {formData.players.length} players
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gold-600 text-black py-2 px-4 rounded hover:bg-gold-500 transition"
        >
          Update Competition
        </button>
      </form>
    </div>
  );
};

export default EditCompetition;