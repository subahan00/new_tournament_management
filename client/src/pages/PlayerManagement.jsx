import React, { useEffect, useState } from 'react';
import playerService from '../services/playerService';

const PlayerManagement = () => {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlayers = async () => {
    try {
      const res = await playerService.getAllPlayers();
      setPlayers(res.data);
    } catch (err) {
      setError('Failed to fetch players');
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await playerService.createPlayer({ name });
      await fetchPlayers();
      setName('');
    } catch (err) {
      setError('Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await playerService.deletePlayer(id);
      setPlayers(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      setError('Failed to delete player');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Player Management</h2>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player Name"
          required
          className="border p-2 w-full"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded"
        >
          {loading ? 'Adding...' : 'Add Player'}
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      <div>
        <h3 className="text-xl font-semibold mb-2">Registered Players</h3>
        <ul className="space-y-2">
          {players.map(player => (
            <li
              key={player._id}
              className="border p-4 rounded shadow flex justify-between items-center"
            >
              <span>{player.name}</span>
              <button
                onClick={() => handleDelete(player._id)}
                className="bg-red-500 text-white px-4 py-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PlayerManagement;
