import competitionService from '../services/competitionService';
import { useEffect, useState } from 'react';
import React from 'react';
const CompetitionManagement = () => {
  const [competitions, setCompetitions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'KO_REGULAR',
    numberOfPlayers: 0,
    players: [],
    rounds: 3
  });
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [existingPlayers, setExistingPlayers] = useState([]);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const competitions = await competitionService.getAllCompetitions();

      if (Array.isArray(competitions)) {
        setCompetitions(competitions);
      } else {
        console.warn('Unexpected competitions format:', competitions);
        setError('Could not parse competitions data');
        setCompetitions([]);
      }
    } catch (err) {
      console.error('Fetch competitions error:', err);
      setError(err.message || 'Failed to fetch competitions. Please try again.');
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const players = await competitionService.getAllPlayers();
        console.log('Fetched players:', players);
        setExistingPlayers(players);
      } catch (err) {
        console.error('Fetch players error:', err);
        setError('Failed to fetch players');
      }
    };

    fetchCompetitions();
    fetchPlayers(); // Fetch players when component mounts
  }, []);
  useEffect(() => {
    fetchCompetitions();
  }, []);

 const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfPlayers' || name === 'rounds' 
        ? Math.max(1, parseInt(value) || 1) 
        : value
    }));
  };

  const handleAddPlayer = (playerId) => { // ✅ Changed from playerName to playerId
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
      players: [...prev.players, playerId] // ✅ Store IDs instead of names
    }));
  };

  const handleRemovePlayer = (index) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }));
  };

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
      console.log('Creating competition with payload:', payload);
      const response = await competitionService.createCompetition(payload);
      if (response && response.data) {
        setSuccess('Competition created successfully!');
        await fetchCompetitions();
        setFormData({
          name: '',
          type: 'KO_REGULAR',
          numberOfPlayers: 0,
          players: [],
          rounds: 3
        });
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      console.error('Create competition error:', err);
      setError(err.response?.data?.message || 'Failed to create competition. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this competition?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await competitionService.deleteCompetition(id);

      if (result.success) {
        setSuccess(result.message);
        await fetchCompetitions();
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

  const handleViewDetails = (competition) => {
    setSelectedCompetition(competition);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedCompetition(null);
  };

  return (
    <div className="min-h-screen bg-black text-gold-100 p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 border-b border-gold-500 pb-4">
          <h2 className="text-4xl font-bold text-gold-400 mb-2">Competition Management</h2>
          <p className="text-gold-300">Create and manage elite gaming competitions</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/80 border border-red-700 text-red-100 rounded-lg shadow-lg">
            <div className="flex items-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 4.143L18 21l-6-3.857L6 21l2.714-4.857L3 12l6.714-2.143L12 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/80 border border-green-700 text-green-100 rounded-lg shadow-lg">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <option value="GNG">GNG</option>
                <option value="NEW_TYPE">New Type</option>
              </select>
            </div>

            {/* Number of Rounds Field - Only for League Competitions */}
            {formData.type === 'LEAGUE' && (
              <div>
                <label className="block text-gold-300 mb-2 font-medium">
                  Number of Rounds (each player plays others this many times)
                </label>
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
                <p className="text-sm text-gold-500 mt-1">
                  Each player will play against every other player {formData.rounds} time(s)
                </p>
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

            <label className="block text-gold-300 mb-2 font-medium">
              Add Players <span className="text-gold-400">({formData.players.length}/{formData.numberOfPlayers})</span>
            </label>
            <div className="mb-4">
              <p className="text-sm text-gold-500 mb-2">Select from existing players:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {existingPlayers.map(player => (
                  <button
                    type="button"
                    key={player._id}
                    onClick={() => handleAddPlayer(player._id)}
                    disabled={formData.players.includes(player._id) ||
                      formData.players.length >= formData.numberOfPlayers}
                    className={`text-sm p-2 rounded-lg transition-colors
                  ${formData.players.includes(player._id)
                        ? 'bg-gold-600 text-black cursor-not-allowed'
                        : 'bg-gray-800 hover:bg-gray-700 border border-gold-700/50'}
                  ${formData.players.length >= formData.numberOfPlayers
                        ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>

            {formData.players.length > 0 && (
              <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-4">
                <h4 className="text-gold-300 font-medium mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Current Players
                </h4>
                <ul className="space-y-2">
                  {formData.players.map((id, idx) => {
                    const player = existingPlayers.find(p => p._id === id);

                    return (
                      <li key={idx} className="flex justify-between items-center bg-gray-700/50 px-3 py-2 rounded">
                        <span className="text-gold-200">
                          {player ? player.name : 'Unknown Player'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(idx)}
                          className="text-red-400 hover:text-red-300 flex items-center"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 disabled:opacity-50 text-black font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Competition
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Competitions Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gold-700/30 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6 border-b border-gold-800 pb-3">
            <h3 className="text-2xl font-semibold text-gold-300">Existing Competitions</h3>
            <button
              onClick={fetchCompetitions}
              className="text-gold-300 hover:text-gold-200 flex items-center text-sm"
            >
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
              <svg className="mx-auto h-12 w-12 text-gold-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="mt-2 text-lg font-medium text-gold-300">No competitions found</h4>
              <p className="mt-1 text-gold-500">Create your first competition to get started</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map(c => (
                <div key={c._id} className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-5 hover:border-gold-500/50 transition-all duration-200 group">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">{c.name}</h4>
                    <span className="bg-gold-900/50 text-gold-300 text-xs px-2 py-1 rounded">
                      {c.type}
                    </span>
                  </div>
                  <div className="flex items-center text-gold-400 mb-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{c.players?.length || 0} Players</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="flex-1 bg-red-900/50 hover:bg-red-800/70 text-red-300 hover:text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center transition-all"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                    <button
                      onClick={() => handleViewDetails(c)}
                      className="flex-1 bg-blue-900/50 hover:bg-blue-800/70 text-blue-300 hover:text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center transition-all"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
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
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gold-300 break-words">
                  {selectedCompetition.name}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gold-500 hover:text-gold-300 ml-2"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Competition Info - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gold-700/30">
                  <h4 className="text-sm sm:text-base text-gold-400 font-medium mb-2 sm:mb-3">Competition Info</h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gold-300">Type:</span>
                      <span className="text-gold-200">{selectedCompetition.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gold-300">Status:</span>
                      <span className={`font-medium ${selectedCompetition.status === 'completed'
                        ? 'text-green-400'
                        : selectedCompetition.status === 'ongoing'
                          ? 'text-yellow-400'
                          : 'text-blue-400'
                        }`}>
                        {selectedCompetition.status?.toUpperCase() || 'NOT STARTED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gold-300">Created:</span>
                      <span className="text-gold-200">
                        {new Date(selectedCompetition.createdAt.$date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Winner Section - Conditionally Rendered */}
                {selectedCompetition.status === 'completed' && selectedCompetition.winner && (
                  <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gold-700/30">
                    <h4 className="text-sm sm:text-base text-gold-400 font-medium mb-2 sm:mb-3">Winner</h4>
                    <div className="flex items-center justify-center p-2 sm:p-4 bg-gold-900/20 rounded-lg">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-1 sm:mb-2 rounded-full bg-gold-600/20 flex items-center justify-center border-2 border-gold-500">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <h5 className="text-lg sm:text-xl font-bold text-gold-300 break-words">
                          {selectedCompetition.winner.name || 'Winner'}
                        </h5>
                        <p className="text-xs sm:text-sm text-gold-400">Champion</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Players List - Responsive */}
              <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gold-700/30 mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base text-gold-400 font-medium mb-2 sm:mb-3">
                  Players ({selectedCompetition.players?.length || 0})
                </h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                  {selectedCompetition.players?.map((player, index) => {
                    const playerId = player.name||player?.$oid || player?._id || '';
                    const shortId = playerId.slice();
                    const winnerId = selectedCompetition.winner?.$oid || 
                                    selectedCompetition.winner?._id || 
                                    selectedCompetition.winner || '';
                    const isWinner = winnerId === playerId;

                    return (
                      <div
                        key={playerId || index}
                        className={`flex items-center p-2 sm:p-3 rounded-lg ${
                          isWinner
                            ? 'bg-gold-900/30 border border-gold-600/50'
                            : 'bg-gray-700/50'
                        }`}
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-600 flex items-center justify-center mr-2 sm:mr-3">
                          <span className="text-xs sm:text-sm text-gold-300 font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs sm:text-sm text-gold-200 font-medium truncate">
                            Player {index + 1} (ID: {shortId})
                          </h5>
                          {isWinner && (
                            <span className="text-xs bg-gold-600/30 text-gold-200 px-1.5 py-0.5 rounded-full">
                              Winner
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Section - Conditionally Rendered */}
              {selectedCompetition.status !== 'completed' && (
                <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gold-700/30">
                  <h4 className="text-sm sm:text-base text-gold-400 font-medium mb-2 sm:mb-3">Competition Progress</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-xs sm:text-sm">
                        <span className="text-gold-300">Completion</span>
                        <span className="text-gold-300">
                          {selectedCompetition.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 sm:h-2.5">
                        <div
                          className="bg-gold-600 h-full rounded-full"
                          style={{ width: `${selectedCompetition.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <button className="text-xs sm:text-sm bg-gold-600 hover:bg-gold-500 text-black font-medium py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg">
                        {selectedCompetition.status === 'ongoing'
                          ? 'Continue Competition'
                          : 'Start Competition'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionManagement;