import competitionService from '../services/competitionService';
import { useEffect, useState } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react'; // Added Search icon

const CompetitionManagement = () => {
  const [competitions, setCompetitions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'KO_REGULAR',
    numberOfPlayers: 0,
    players: [],
    rounds: 3
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [existingPlayers, setExistingPlayers] = useState([]);
  
  // State for the player search term
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');

  // Fetch initial data (competitions and players) when the component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch players first
        const players = await competitionService.getAllPlayers();
        setExistingPlayers(players);
        
        // Then fetch competitions
        const competitionsData = await competitionService.getAllCompetitions();
        if (Array.isArray(competitionsData)) {
          setCompetitions(competitionsData);
        } else {
          console.warn('Unexpected competitions format:', competitionsData);
          setCompetitions([]);
        }

      } catch (err) {
        console.error('Fetch initial data error:', err);
        setError(err.message || 'Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Function to manually refresh the list of competitions
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const competitionsData = await competitionService.getAllCompetitions();
      if (Array.isArray(competitionsData)) {
        setCompetitions(competitionsData);
      } else {
        console.warn('Unexpected competitions format:', competitionsData);
        setCompetitions([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch competitions.');
    } finally {
      setLoading(false);
    }
  };

  // Handle changes in form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfPlayers' || name === 'rounds' 
        ? Math.max(1, parseInt(value) || 1) 
        : value
    }));
  };

  // Add a selected player to the competition's player list
  const handleAddPlayer = (playerId) => {
    if (formData.players.includes(playerId)) {
      setError('This player is already added');
      return;
    }

    if (formData.players.length >= formData.numberOfPlayers) {
      setError(`Cannot add more than ${formData.numberOfPlayers} players`);
      return;
    }

    setError(null);
    setFormData(prev => ({
      ...prev,
      players: [...prev.players, playerId]
    }));
  };

  // Remove a player from the competition's player list by their ID
  const handleRemovePlayer = (playerIdToRemove) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter((id) => id !== playerIdToRemove)
    }));
  };

  // Validate the form before submission
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Competition name is required');
      return false;
    }

    if (formData.numberOfPlayers <= 0) {
      setError('Number of players must be greater than 0');
      return false;
    }

    if (formData.players.length !== formData.numberOfPlayers) {
      setError(`Please add exactly ${formData.numberOfPlayers} players`);
      return false;
    }
    if (formData.type === 'LEAGUE' && (formData.rounds < 1 || formData.rounds > 10)) {
      setError('Number of rounds must be between 1 and 10 for league competitions');
      return false;
    }

    return true;
  };

  // Handle the form submission to create a new competition
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        numberOfPlayers: parseInt(formData.numberOfPlayers),
      };
      await competitionService.createCompetition(payload);
      setSuccess('Competition created successfully!');
      await fetchCompetitions(); // Refresh the list after creation
      setFormData({ // Reset the form
        name: '',
        type: 'KO_REGULAR',
        numberOfPlayers: 0,
        players: [],
        rounds: 3
      });
      setPlayerSearchTerm(''); // Reset search term
    } catch (err) {
      console.error('Create competition error:', err);
      setError(err.response?.data?.message || 'Failed to create competition.');
    } finally {
      setLoading(false);
    }
  };

  // Handle the deletion of a competition
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this competition? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      const result = await competitionService.deleteCompetition(id);
      if (result.success) {
        setSuccess(result.message);
        await fetchCompetitions(); // Refresh the list after deletion
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Delete competition error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show the details modal for a selected competition
  const handleViewDetails = (competition) => {
    setSelectedCompetition(competition);
    setShowDetailsModal(true);
  };

  // Close the details modal
  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedCompetition(null);
  };

  // Filter the list of existing players based on the search term and sort alphabetically
  const filteredPlayers = existingPlayers
    .filter(player =>
      player.name.toLowerCase().includes(playerSearchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-black text-gold-100 p-6">
      <div className="mb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 border-b border-gold-500 pb-4">
          <h2 className="text-4xl font-bold text-gold-400 mb-2">Competition Management</h2>
          <p className="text-gold-300">Create and manage elite gaming competitions</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/80 border border-red-700 text-red-100 rounded-lg shadow-lg">
            <div className="flex items-center gap-x-3">
              <svg className="w-6 h-6 text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900/80 border border-green-700 text-green-100 rounded-lg shadow-lg">
            <div className="flex items-center gap-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Create Competition Form */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gold-700/30 rounded-xl p-6 mb-10 shadow-xl">
          <h3 className="text-2xl font-semibold text-gold-300 mb-6 border-b border-gold-800 pb-2">Create New Competition</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gold-300 mb-2 font-medium">Competition Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter competition name"
                required
                className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white placeholder-gold-500/70 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-gold-300 mb-2 font-medium">Competition Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white appearance-none"
              >
                <option value="KO_REGULAR">KO Regular</option>
                <option value="LEAGUE">League</option>
                <option value="GROUP_STAGE">Group Stage</option>
                <option value="GNG">GNG</option>
                <option value="NEW_TYPE">New Type</option>
              </select>
            </div>
            {formData.type === 'LEAGUE' && (
              <div>
                <label className="block text-gold-300 mb-2 font-medium">Number of Rounds</label>
                <input
                  type="number"
                  name="rounds"
                  min="1"
                  max="10"
                  value={formData.rounds}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white placeholder-gold-500/70"
                />
                <p className="text-sm text-gold-500 mt-1">Each player will play every other player {formData.rounds} time(s).</p>
              </div>
            )}
            <div>
              <label className="block text-gold-300 mb-2 font-medium">Number of Players</label>
              <input
                type="number"
                name="numberOfPlayers"
                min="1"
                value={formData.numberOfPlayers}
                onChange={handleChange}
                placeholder="Enter number of players"
                required
                className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white placeholder-gold-500/70"
              />
            </div>

            {/* Player Selection with Search */}
            <div>
              <label className="block text-gold-300 mb-2 font-medium">
                Add Players <span className="text-gold-400">({formData.players.length}/{formData.numberOfPlayers})</span>
              </label>
              <div className="relative mb-4">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gold-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search for players..."
                  value={playerSearchTerm}
                  onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gold-500/70 transition-all duration-200"
                />
              </div>
              <div className="max-h-60 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-gray-800/20 rounded-lg border border-gold-800/50">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map(player => (
                    <button
                      type="button"
                      key={player._id}
                      onClick={() => handleAddPlayer(player._id)}
                      disabled={formData.players.includes(player._id) || formData.players.length >= formData.numberOfPlayers}
                      className={`text-sm p-2 rounded-lg transition-colors text-center truncate ${
                        formData.players.includes(player._id)
                          ? 'bg-gold-600 text-black cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gold-700/50'
                      } ${
                        !formData.players.includes(player._id) && formData.players.length >= formData.numberOfPlayers
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {player.name}
                    </button>
                  ))
                ) : (
                  <p className="col-span-full text-center text-gold-400 py-4">No players found matching your search.</p>
                )}
              </div>
            </div>

            {/* Selected Players List */}
            {formData.players.length > 0 && (
              <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-4">
                <h4 className="text-gold-300 font-medium mb-3 flex items-center">Selected Players</h4>
                <ul className="space-y-2">
                  {formData.players
                    .map(id => existingPlayers.find(p => p._id === id))
                    .filter(Boolean) // Filter out potential undefined players if find fails
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(player => (
                      <li key={player._id} className="flex justify-between items-center bg-gray-700/50 px-3 py-2 rounded">
                        <span className="text-gold-200">{player.name}</span>
                        <button type="button" onClick={() => handleRemovePlayer(player._id)} className="text-red-400 hover:text-red-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 disabled:opacity-50 text-black font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              {loading ? 'Creating...' : 'Create Competition'}
            </button>
          </form>
        </div>

        {/* Existing Competitions Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gold-700/30 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6 border-b border-gold-800 pb-3">
            <h3 className="text-2xl font-semibold text-gold-300">Existing Competitions</h3>
            <button onClick={fetchCompetitions} className="text-gold-300 hover:text-gold-200 flex items-center text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          {loading && competitions.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
            </div>
          ) : competitions.length === 0 ? (
            <div className="text-center py-10">
              <h4 className="mt-2 text-lg font-medium text-gold-300">No competitions found</h4>
              <p className="mt-1 text-gold-500">Create your first competition to get started</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map(c => (
                <div key={c._id} className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-5 hover:border-gold-500/50 transition-all duration-200 group">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">{c.name}</h4>
                    <span className="bg-gold-900/50 text-gold-300 text-xs px-2 py-1 rounded">{c.type}</span>
                  </div>
                  <div className="flex items-center text-gold-400 mb-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{c.players?.length || 0} Players</span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleDelete(c._id)} className="flex-1 bg-red-900/50 hover:bg-red-800/70 text-red-300 hover:text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center transition-all">
                      Delete
                    </button>
                    <button onClick={() => handleViewDetails(c)} className="flex-1 bg-blue-900/50 hover:bg-blue-800/70 text-blue-300 hover:text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center transition-all">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Competition Details Modal */}
      {showDetailsModal && selectedCompetition && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-gray-900 border border-gold-700/50 rounded-lg sm:rounded-xl w-full max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gold-300 break-words">{selectedCompetition.name}</h3>
                <button onClick={closeModal} className="text-gold-500 hover:text-gold-300 ml-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gold-700/30">
                  <h4 className="text-sm sm:text-base text-gold-400 font-medium mb-2 sm:mb-3">Competition Info</h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between"><span className="text-gold-300">Type:</span><span className="text-gold-200">{selectedCompetition.type}</span></div>
                    <div className="flex justify-between"><span className="text-gold-300">Status:</span><span className={`font-medium ${selectedCompetition.status === 'completed' ? 'text-green-400' : selectedCompetition.status === 'ongoing' ? 'text-yellow-400' : 'text-blue-400'}`}>{selectedCompetition.status?.toUpperCase() || 'NOT STARTED'}</span></div>
                    <div className="flex justify-between"><span className="text-gold-300">Created:</span><span className="text-gold-200">{new Date(selectedCompetition.createdAt.$date).toLocaleDateString()}</span></div>
                  </div>
                </div>
                {selectedCompetition.status === 'completed' && selectedCompetition.winner && (
                  <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gold-700/30">
                    <h4 className="text-sm sm:text-base text-gold-400 font-medium mb-2 sm:mb-3">Winner</h4>
                    <div className="text-center"><h5 className="text-lg sm:text-xl font-bold text-gold-300 break-words">{selectedCompetition.winner.name || 'Winner'}</h5></div>
                  </div>
                )}
              </div>
              <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gold-700/30 mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base text-gold-400 font-medium mb-2 sm:mb-3">Players ({selectedCompetition.players?.length || 0})</h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                  {selectedCompetition.players?.map((player, index) => {
                    const playerName = player.name || `Player ${index + 1}`;
                    return (<div key={index} className="flex items-center p-2 sm:p-3 rounded-lg bg-gray-700/50"><h5 className="text-xs sm:text-sm text-gold-200 font-medium truncate">{playerName}</h5></div>);
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionManagement;
