// CompetitionManagement.jsx
import competitionService from '../services/competitionService';
import clanService from '../services/clanService';
import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Minus, Users, Trophy, UserPlus, AlertTriangle } from 'lucide-react';
import axios from '../services/api';

const CompetitionManagement = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'KO_REGULAR',
    numberOfPlayers: 0,
    players: [],
    rounds: 3,
    // Clan War specific
    numberOfClans: 2,
    selectedClans: [] // Changed from 'clans' to 'selectedClans' for existing clans
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existingPlayers, setExistingPlayers] = useState([]);
  const [existingClans, setExistingClans] = useState([]);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [clanSearchTerm, setClanSearchTerm] = useState('');

  // Create Player Modal State
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [createPlayerLoading, setCreatePlayerLoading] = useState(false);

  // Warning Modal State
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [players, clans] = await Promise.all([
          competitionService.getAllPlayers(),
          clanService.getAllClans()
        ]);
        
        setExistingPlayers(players);
        setExistingClans(clans);
      } catch (err) {
        console.error('Fetch initial data error:', err);
        setError(err.message || 'Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Create Player Handler
  const handleCreatePlayer = useCallback(async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      setError('Player name is required');
      return;
    }

    setCreatePlayerLoading(true);
    setError(null);
    
    try {
      const res = await axios.post('/players', {
        name: newPlayerName,
        competitionId: selectedCompetitionId,
      });
      
      setExistingPlayers(prev => [...prev, res.data]);
      setNewPlayerName('');
      setSelectedCompetitionId('');
      setShowCreatePlayerModal(false);
      setSuccess(`Player "${res.data.name}" created successfully`);
    } catch (error) {
      console.error('Error creating player:', error);
      setError(error.response?.data?.message || 'Failed to create player');
    } finally {
      setCreatePlayerLoading(false);
    }
  }, [newPlayerName, selectedCompetitionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'type' && value === 'CLAN_WAR') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        numberOfClans: 2,
        selectedClans: [],
        players: []
      }));
    } else if (name === 'numberOfClans') {
      const clanCount = Math.max(2, parseInt(value) || 2);
      let validClanCount = 2;
      while (validClanCount < clanCount && validClanCount < 32) {
        validClanCount *= 2;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: validClanCount,
        selectedClans: prev.selectedClans.slice(0, validClanCount)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'numberOfPlayers' || name === 'rounds' 
          ? Math.max(1, parseInt(value) || 1) 
          : value
      }));
    }
  };

  const handleToggleClan = (clanId) => {
    if (formData.selectedClans.includes(clanId)) {
      setFormData(prev => ({
        ...prev,
        selectedClans: prev.selectedClans.filter(id => id !== clanId)
      }));
      setError(null);
      return;
    }

    if (formData.selectedClans.length >= formData.numberOfClans) {
      setError(`Cannot add more than ${formData.numberOfClans} clans`);
      return;
    }

    setError(null);
    setFormData(prev => ({
      ...prev,
      selectedClans: [...prev.selectedClans, clanId]
    }));
  };

  const handleRemoveClan = (clanId) => {
    setFormData(prev => ({
      ...prev,
      selectedClans: prev.selectedClans.filter(id => id !== clanId)
    }));
  };

  const handleTogglePlayer = (playerId) => {
    if (formData.players.includes(playerId)) {
      setFormData(prev => ({
        ...prev,
        players: prev.players.filter(id => id !== playerId)
      }));
      setError(null);
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

  const handleRemovePlayer = (playerIdToRemove) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter((id) => id !== playerIdToRemove)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Competition name is required');
      return false;
    }

    if (formData.type === 'CLAN_WAR') {
      if (formData.numberOfClans < 2) {
        setError('At least 2 clans are required');
        return false;
      }

      if (formData.selectedClans.length !== formData.numberOfClans) {
        setError(`Please select exactly ${formData.numberOfClans} clans`);
        return false;
      }
    } else {
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
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    // Show warning modal before proceeding
    setShowWarningModal(true);
  };

  const proceedWithCreation = async () => {
    setShowWarningModal(false);
    setLoading(true);
    
    try {
      if (formData.type === 'CLAN_WAR') {
        const payload = {
          name: formData.name,
          numberOfClans: formData.numberOfClans,
          clanIds: formData.selectedClans // Send clan IDs
        };
        // Use the new method for existing clans
        await competitionService.createClanWarCompetitionWithExistingClans(payload);
      } else {
        const payload = {
          ...formData,
          numberOfPlayers: parseInt(formData.numberOfPlayers),
        };
        await competitionService.createCompetition(payload);
      }
      
      setSuccess('Competition created successfully!');
      
      // Reset form
      const resetFormData = {
        name: '',
        type: 'KO_REGULAR',
        numberOfPlayers: 0,
        players: [],
        rounds: 3,
        numberOfClans: 2,
        selectedClans: []
      };
      setFormData(resetFormData);
      setPlayerSearchTerm('');
      setClanSearchTerm('');
    } catch (err) {
      console.error('Create competition error:', err);
      setError(err.response?.data?.message || 'Failed to create competition.');
    } finally {
      setLoading(false);
    }
  };

  const closeCreatePlayerModal = () => {
    setShowCreatePlayerModal(false);
    setNewPlayerName('');
    setSelectedCompetitionId('');
    setError(null);
  };

  const filteredPlayers = existingPlayers
    .filter(player =>
      player.name.toLowerCase().includes(playerSearchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredClans = existingClans
    .filter(clan =>
      clan.name.toLowerCase().includes(clanSearchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const getCompetitionIcon = (type) => {
    if (type === 'CLAN_WAR') return <Users className="w-4 h-4" />;
    return <Trophy className="w-4 h-4" />;
  };

  const renderClanWarForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-gold-300 mb-2 font-medium">Number of Clans</label>
        <select
          name="numberOfClans"
          value={formData.numberOfClans}
          onChange={handleChange}
          className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white appearance-none"
        >
          <option value={2}>2 Clans</option>
          <option value={4}>4 Clans</option>
          <option value={8}>8 Clans</option>
          <option value={16}>16 Clans</option>
        </select>
        <p className="text-sm text-gold-500 mt-1">Select existing clans to participate</p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-gold-300 font-medium">
            Select Clans <span className="text-gold-400">({formData.selectedClans.length}/{formData.numberOfClans})</span>
          </label>
        </div>
        <div className="relative mb-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gold-500" />
          </div>
          <input
            type="text"
            placeholder="Search for clans..."
            value={clanSearchTerm}
            onChange={(e) => setClanSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gold-500/70"
          />
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-gray-800/20 rounded-lg border border-gold-800/50">
          {filteredClans.length > 0 ? (
            filteredClans.map(clan => {
              const isSelected = formData.selectedClans.includes(clan._id);
              const isAtCapacity = formData.selectedClans.length >= formData.numberOfClans;
              const isDisabled = !isSelected && isAtCapacity;
              
              return (
                <button
                  type="button"
                  key={clan._id}
                  onClick={() => handleToggleClan(clan._id)}
                  disabled={isDisabled}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-gold-600 text-black font-medium shadow-lg'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gold-700/50 text-gold-200 hover:text-gold-100'
                  } ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-md cursor-pointer'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{clan.name}</span>
                  </div>
                  <div className="text-xs opacity-80">
                    {clan.members?.length || 0} members
                    {clan.members && clan.members.length > 0 && (
                      <span className="ml-2">
                        ({clan.members.map(m => m.name).join(', ')})
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-center text-gold-400 py-4">No clans found matching your search.</p>
          )}
        </div>
      </div>

      {formData.selectedClans.length > 0 && (
        <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-4">
          <h4 className="text-gold-300 font-medium mb-3">Selected Clans</h4>
          <ul className="space-y-2">
            {formData.selectedClans
              .map(id => existingClans.find(c => c._id === id))
              .filter(Boolean)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(clan => (
                <li key={clan._id} className="flex justify-between items-center bg-gray-700/50 px-3 py-2 rounded">
                  <div>
                    <span className="text-gold-200 font-medium">{clan.name}</span>
                    <div className="text-xs text-gold-400 mt-1">
                      {clan.members?.map(m => m.name).join(', ')}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveClan(clan._id)} 
                    className="text-red-400 hover:text-red-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderRegularForm = () => (
    <div className="space-y-6">
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
        <div className="flex justify-between items-center mb-2">
          <label className="block text-gold-300 font-medium">
            Add Players <span className="text-gold-400">({formData.players.length}/{formData.numberOfPlayers})</span>
          </label>
          <button
            type="button"
            onClick={() => setShowCreatePlayerModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-600/50 rounded-lg text-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create Player
          </button>
        </div>
        <div className="relative mb-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gold-500" />
          </div>
          <input
            type="text"
            placeholder="Search for players..."
            value={playerSearchTerm}
            onChange={(e) => setPlayerSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gold-500/70"
          />
        </div>
        <div className="max-h-60 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-gray-800/20 rounded-lg border border-gold-800/50">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map(player => {
              const isSelected = formData.players.includes(player._id);
              const isAtCapacity = formData.players.length >= formData.numberOfPlayers;
              const isDisabled = !isSelected && isAtCapacity;
              
              return (
                <button
                  type="button"
                  key={player._id}
                  onClick={() => handleTogglePlayer(player._id)}
                  disabled={isDisabled}
                  className={`text-sm p-2 rounded-lg transition-all duration-200 text-center truncate relative ${
                    isSelected
                      ? 'bg-gold-600 text-black font-medium shadow-lg transform scale-105'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gold-700/50 text-gold-200 hover:text-gold-100'
                  } ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-md cursor-pointer'
                  }`}
                  title={isSelected ? 'Click to deselect' : 'Click to select'}
                >
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {player.name}
                </button>
              );
            })
          ) : (
            <p className="col-span-full text-center text-gold-400 py-4">No players found matching your search.</p>
          )}
        </div>
      </div>

      {formData.players.length > 0 && (
        <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-4">
          <h4 className="text-gold-300 font-medium mb-3">Selected Players</h4>
          <ul className="space-y-2">
            {formData.players
              .map(id => existingPlayers.find(p => p._id === id))
              .filter(Boolean)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(player => (
                <li key={player._id} className="flex justify-between items-center bg-gray-700/50 px-3 py-2 rounded">
                  <span className="text-gold-200">{player.name}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemovePlayer(player._id)} 
                    className="text-red-400 hover:text-red-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-gold-100 p-6">
      <div className="mb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        ><ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 border-b border-gold-500 pb-4">
          <h2 className="text-4xl font-bold text-gold-400 mb-2">Competition Management</h2>
          <p className="text-gold-300">Create and manage elite gaming competitions including clan wars</p>
        </div>

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
                className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white placeholder-gold-500/70"
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
                <option value="CLAN_WAR">Clan War</option>
              </select>
            </div>

            {formData.type === 'CLAN_WAR' ? renderClanWarForm() : renderRegularForm()}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 disabled:opacity-50 text-black font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              {loading ? 'Creating...' : 'Create Competition'}
            </button>
          </form>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border-2 border-yellow-600/50 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-12 h-12 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-2">Important Warning</h3>
                  {formData.type === 'CLAN_WAR' ? (
                    <div className="space-y-3 text-gold-200">
                      <p className="text-base">
                        Please verify the following before proceeding:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>All clan names are correct</li>
                        <li>All clan members are accurate</li>
                        <li>You have selected the right clans for this tournament</li>
                      </ul>
                      <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                        <p className="text-red-300 font-semibold text-sm">
                          ⚠️ Once the competition is created, clan details and participants cannot be changed!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-gold-200">
                      <p className="text-base">
                        Please verify the following before proceeding:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>All player names are correct</li>
                        <li>You have selected the right players</li>
                        <li>Competition settings are configured properly</li>
                      </ul>
                      <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                        <p className="text-red-300 font-semibold text-sm">
                          ⚠️ Once the competition is created, participants cannot be changed!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-4 mb-6">
                <h4 className="text-gold-300 font-semibold mb-3">Competition Summary:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gold-400">Name:</span>
                    <span className="text-gold-200 font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gold-400">Type:</span>
                    <span className="text-gold-200">{formData.type}</span>
                  </div>
                  {formData.type === 'CLAN_WAR' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gold-400">Number of Clans:</span>
                        <span className="text-gold-200">{formData.numberOfClans}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gold-700/30">
                        <p className="text-gold-400 mb-2">Selected Clans:</p>
                        <ul className="space-y-1">
                          {formData.selectedClans
                            .map(id => existingClans.find(c => c._id === id))
                            .filter(Boolean)
                            .map(clan => (
                              <li key={clan._id} className="text-gold-200 text-xs">
                                • {clan.name} ({clan.members?.length || 0} members)
                              </li>
                            ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gold-400">Number of Players:</span>
                        <span className="text-gold-200">{formData.numberOfPlayers}</span>
                      </div>
                      {formData.type === 'LEAGUE' && (
                        <div className="flex justify-between">
                          <span className="text-gold-400">Rounds:</span>
                          <span className="text-gold-200">{formData.rounds}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={proceedWithCreation}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue & Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Player Modal */}
      {showCreatePlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gold-700/50 rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gold-300">Create New Player</h3>
                <button onClick={closeCreatePlayerModal} className="text-gold-500 hover:text-gold-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreatePlayer} className="space-y-4">
                <div>
                  <label className="block text-gold-300 mb-2 font-medium">Player Name</label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    required
                    className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white placeholder-gold-500/70"
                  />
                </div>

                <div>
                  <label className="block text-gold-300 mb-2 font-medium">Competition (Optional)</label>
                  <select
                    value={selectedCompetitionId}
                    onChange={(e) => setSelectedCompetitionId(e.target.value)}
                    className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white appearance-none"
                  >
                    <option value="">No specific competition</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeCreatePlayerModal}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPlayerLoading || !newPlayerName.trim()}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
                  >
                    {createPlayerLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Player'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionManagement;