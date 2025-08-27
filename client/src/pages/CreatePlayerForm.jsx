import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from '../services/api';
import { FiCopy, FiSearch, FiTrash } from 'react-icons/fi';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreatePlayerForm = () => {
  const [name, setName] = useState('');
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);
    
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch data with cleanup
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [compRes, playersRes] = await Promise.all([
          axios.get('/competitions', { signal: controller.signal }),
          axios.get('/players', { signal: controller.signal }),
        ]);
        setCompetitions(compRes.data);
        setPlayers(playersRes.data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching data:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    return () => controller.abort();
  }, []);

  // Memoized filtered players
  const filteredPlayers = useMemo(() => {
    if (!debouncedSearchTerm) return players;
    
    const term = debouncedSearchTerm.toLowerCase();
    return players.filter(player => 
      player.name.toLowerCase().includes(term) || 
      player._id.toLowerCase().includes(term)
    );
  }, [players, debouncedSearchTerm]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Player name is required');

    try {
      const res = await axios.post('/players', {
        name,
        competitionId: selectedCompetitionId,
      });
      
      setPlayers(prev => [...prev, res.data]);
      setName('');
      setSelectedCompetitionId('');
      alert(`Player "${res.data.name}" created successfully`);
    } catch (error) {
      console.error('Error creating player:', error);
      alert('Failed to create player');
    }
  }, [name, selectedCompetitionId]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }, []);

  const handleDelete = useCallback(async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    
    try {
      await axios.delete(`/players/${playerId}`);
      setPlayers(prev => prev.filter(player => player._id !== playerId));
      alert('Player deleted successfully');
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player');
    }
  }, []);

  // NEW CODE START: Function to handle deleting duplicate players
  const handleDeleteDuplicates = useCallback(async () => {
    // Group players by their normalized name (trimmed and lowercased)
    const nameMap = new Map();
    players.forEach(player => {
      const normalizedName = player.name.trim().toLowerCase();
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName).push(player);
    });

    // Find all players that are duplicates (i.e., not the first one in their group)
    const playersToDelete = [];
    for (const group of nameMap.values()) {
      if (group.length > 1) {
        // Keep the first player, mark the rest for deletion
        playersToDelete.push(...group.slice(1));
      }
    }

    if (playersToDelete.length === 0) {
      alert('No duplicate players found. ✨');
      return;
    }

    const idsToDelete = playersToDelete.map(p => p._id);
    const confirmation = window.confirm(
      `Found ${idsToDelete.length} duplicate player(s). Are you sure you want to delete them? This action cannot be undone.`
    );

    if (!confirmation) return;

    try {
      // Send all delete requests in parallel for efficiency
      await Promise.all(
        idsToDelete.map(id => axios.delete(`/players/${id}`))
      );

      // Update the local state by filtering out the deleted players
      setPlayers(prevPlayers => 
        prevPlayers.filter(player => !idsToDelete.includes(player._id))
      );
      
      alert(`${idsToDelete.length} duplicate player(s) deleted successfully!`);
    } catch (error) {
      console.error('Error deleting duplicate players:', error);
      alert('Failed to delete some or all duplicate players. Please check the console and try again.');
    }
  }, [players]);
  // NEW CODE END

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-6 sm:px-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-8 p-5 sm:p-6 bg-gray-800/30 rounded-xl border border-gray-700/30"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-yellow-500 mb-6">Create New Player</h2>

        <div className="mb-4">
          <label className="block text-yellow-400 mb-2">Player Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter player name"
            className="w-full bg-gray-800/40 border border-gray-700/50 rounded-lg px-4 py-3 text-sm sm:text-base text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-yellow-400 mb-2">Competition</label>
          <select
            value={selectedCompetitionId}
            onChange={(e) => setSelectedCompetitionId(e.target.value)}
            className="w-full bg-gray-800/40 border border-gray-700/50 rounded-lg px-4 py-3 text-sm sm:text-base text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
          >
            <option value="">Select a competition</option>
            {competitions.map(comp => (
              <option key={comp._id} value={comp._id}>{comp.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 px-6 py-3 rounded-lg font-medium transition-all text-gray-900"
        >
          Create Player
        </button>
      </form>

      <div className="bg-gray-800/30 rounded-xl border border-gray-700/30 p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-yellow-500 mb-6">Player List</h2>

        {/* NEW CODE START: Container for search and new button */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/80" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/40 border border-gray-700/50 rounded-lg px-4 py-3 pl-10 text-sm sm:text-base text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
            />
          </div>
          <button
            onClick={handleDeleteDuplicates}
            className="flex items-center justify-center gap-2 bg-red-600/20 border border-red-500/30 px-4 py-3 sm:py-0 rounded-lg text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all duration-200"
            title="Delete all players with duplicate names"
          >
            <FiTrash className="w-4 h-4" />
            <span>Delete Duplicates</span>
          </button>
        </div>
        {/* NEW CODE END */}

        {isLoading ? (
          <div className="text-center text-yellow-500">Loading players...</div>
        ) : (
          <div className="border border-gray-700/30 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm sm:text-base">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-yellow-400">Name</th>
                  <th className="px-4 py-3 text-left text-yellow-400 hidden sm:table-cell">Player ID</th>
                  <th className="px-4 py-3 text-left text-yellow-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <tr
                      key={player._id}
                      className="border-t border-gray-700/30 hover:bg-gray-800/20 transition-colors"
                    >
                      <td className="px-4 py-3">{player.name}</td>
                      <td className="px-4 py-3 font-mono text-yellow-400/80 hidden sm:table-cell">
                        {player._id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => copyToClipboard(player._id)}
                            className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
                            title="Copy Player ID"
                          >
                            <FiCopy className="w-5 h-5" />
                            <span className="hidden xs:inline">Copy</span>
                          </button>
                          <button
                            onClick={() => handleDelete(player._id)}
                            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
                            title="Delete Player"
                          >
                            <FiTrash className="w-5 h-5" />
                            <span className="hidden xs:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-6 text-center text-gray-400">
                      {players.length === 0 ? 'No players available' : 'No matching players found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePlayerForm;