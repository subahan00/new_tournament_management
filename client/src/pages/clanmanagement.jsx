// pages/ClanManagement.jsx
import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Edit2, Trash2, Users, X, Check, UserPlus } from 'lucide-react';
import axios from '../services/api';
import clanService from '../services/clanService';
import competitionService from '../services/competitionService';

const ClanManagement = () => {
  const [clans, setClans] = useState([]);
  const [existingPlayers, setExistingPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Clan Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    members: ['', '', '', '', '']
  });

  // Edit Clan Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClan, setEditingClan] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    members: []
  });

  // View Clan Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClan, setSelectedClan] = useState(null);

  // Player search for editing
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');

  // Create Player Modal
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [createPlayerLoading, setCreatePlayerLoading] = useState(false);

  // Fetch clans and players
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clansData, playersData] = await Promise.all([
        clanService.getAllClans(),
        competitionService.getAllPlayers()
      ]);
      setClans(clansData);
      setExistingPlayers(playersData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-hide success/error messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Create Clan Handlers
  const handleCreateClanChange = (index, value) => {
    setCreateFormData(prev => ({
      ...prev,
      members: prev.members.map((member, i) => i === index ? value : member)
    }));
  };

  const handleCreateClan = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!createFormData.name.trim()) {
      setError('Clan name is required');
      return;
    }

    const filledMembers = createFormData.members.filter(m => m.trim());
    if (filledMembers.length !== 5) {
      setError('Please provide exactly 5 member names');
      return;
    }

    // Check for duplicate member names
    const uniqueMembers = new Set(filledMembers.map(m => m.toLowerCase().trim()));
    if (uniqueMembers.size !== 5) {
      setError('All member names must be unique');
      return;
    }

    setLoading(true);
    try {
      // Create players first using axios
      const memberIds = [];
      for (const memberName of filledMembers) {
        const response = await axios.post('/players', {
          name: memberName.trim(),
          competitionId: null // Competition ID is null when creating clan
        });
        memberIds.push(response.data._id);
      }

      // Create clan with dummy competition ID (will be set when adding to competition)
      const clanData = {
        name: createFormData.name.trim(),
        members: memberIds,
        competitionId: '000000000000000000000000' // Placeholder - will be updated when added to competition
      };

      await clanService.createClan(clanData);
      setSuccess(`Clan "${createFormData.name}" created successfully!`);
      setShowCreateModal(false);
      setCreateFormData({ name: '', members: ['', '', '', '', ''] });
      fetchData();
    } catch (err) {
      console.error('Error creating clan:', err);
      setError(err.response?.data?.message || 'Failed to create clan');
    } finally {
      setLoading(false);
    }
  };

  // Edit Clan Handlers
  const openEditModal = (clan) => {
    setEditingClan(clan);
    setEditFormData({
      name: clan.name,
      members: clan.members.map(m => m._id)
    });
    setShowEditModal(true);
  };

  const handleEditClanNameChange = (value) => {
    setEditFormData(prev => ({ ...prev, name: value }));
  };

  const handleToggleMember = (playerId) => {
    const isSelected = editFormData.members.includes(playerId);
    
    if (isSelected) {
      setEditFormData(prev => ({
        ...prev,
        members: prev.members.filter(id => id !== playerId)
      }));
    } else {
      if (editFormData.members.length >= 5) {
        setError('A clan can have maximum 5 members');
        return;
      }
      setEditFormData(prev => ({
        ...prev,
        members: [...prev.members, playerId]
      }));
    }
    setError(null);
  };

  const handleRemoveMember = (playerId) => {
    setEditFormData(prev => ({
      ...prev,
      members: prev.members.filter(id => id !== playerId)
    }));
  };

  const handleUpdateClan = async (e) => {
    e.preventDefault();
    setError(null);

    if (!editFormData.name.trim()) {
      setError('Clan name is required');
      return;
    }

    if (editFormData.members.length !== 5) {
      setError('A clan must have exactly 5 members');
      return;
    }

    setLoading(true);
    try {
      await clanService.updateClan(editingClan._id, {
        name: editFormData.name.trim(),
        members: editFormData.members
      });
      setSuccess(`Clan "${editFormData.name}" updated successfully!`);
      setShowEditModal(false);
      setEditingClan(null);
      fetchData();
    } catch (err) {
      console.error('Error updating clan:', err);
      setError(err.response?.data?.message || 'Failed to update clan');
    } finally {
      setLoading(false);
    }
  };

  // Delete Clan Handler
  const handleDeleteClan = async (clanId, clanName) => {
    if (!window.confirm(`Are you sure you want to delete "${clanName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await clanService.deleteClan(clanId);
      setSuccess(`Clan "${clanName}" deleted successfully!`);
      fetchData();
    } catch (err) {
      console.error('Error deleting clan:', err);
      setError(err.response?.data?.message || 'Failed to delete clan');
    } finally {
      setLoading(false);
    }
  };

  // View Details Handler
  const handleViewDetails = (clan) => {
    setSelectedClan(clan);
    setShowDetailsModal(true);
  };

  // Create Player Handler - Updated to use axios
  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      setError('Player name is required');
      return;
    }

    setCreatePlayerLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/players', {
        name: newPlayerName.trim(),
        competitionId: null // Competition ID is null when creating standalone player
      });
      setExistingPlayers(prev => [...prev, response.data]);
      setNewPlayerName('');
      setShowCreatePlayerModal(false);
      setSuccess(`Player "${response.data.name}" created successfully`);
    } catch (error) {
      console.error('Error creating player:', error);
      setError(error.response?.data?.message || 'Failed to create player');
    } finally {
      setCreatePlayerLoading(false);
    }
  };

  // Filtered data
  const filteredClans = clans.filter(clan =>
    clan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clan.members?.some(member => member.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredPlayers = existingPlayers
    .filter(player => player.name.toLowerCase().includes(playerSearchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-black text-gold-100 p-6">
      {/* Header */}
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
        {/* Title Section */}
        <div className="mb-8 border-b border-gold-500 pb-4">
          <h2 className="text-4xl font-bold text-gold-400 mb-2">Clan Management</h2>
          <p className="text-gold-300">Create, edit, and manage your gaming clans</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/80 border border-red-700 text-red-100 rounded-lg shadow-lg">
            <div className="flex items-center gap-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
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

        {/* Search and Create Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gold-700/30 rounded-xl p-6 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gold-500" />
              </div>
              <input
                type="text"
                placeholder="Search clans by name or members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gold-500/70"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-black font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Create New Clan
            </button>
          </div>
        </div>

        {/* Clans List */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gold-700/30 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6 border-b border-gold-800 pb-3">
            <h3 className="text-2xl font-semibold text-gold-300">All Clans ({filteredClans.length})</h3>
            <button
              onClick={fetchData}
              className="text-gold-300 hover:text-gold-200 flex items-center text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading && clans.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
            </div>
          ) : filteredClans.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-16 h-16 text-gold-500/50 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gold-300">No clans found</h4>
              <p className="text-gold-500 mt-1">
                {searchTerm ? 'Try a different search term' : 'Create your first clan to get started'}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredClans.map(clan => (
                <div
                  key={clan._id}
                  className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-5 hover:border-gold-500/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-gold-400" />
                    <h4 className="text-xl font-bold text-gold-300 group-hover:text-gold-200 flex-1 truncate">
                      {clan.name}
                    </h4>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gold-400 mb-2">Members ({clan.members?.length || 0}/5):</p>
                    <div className="space-y-1">
                      {clan.members?.slice(0, 3).map((member, idx) => (
                        <p key={idx} className="text-sm text-gold-200 truncate">
                          • {member.name}
                        </p>
                      ))}
                      {clan.members?.length > 3 && (
                        <p className="text-sm text-gold-400 italic">
                          +{clan.members.length - 3} more...
                        </p>
                      )}
                    </div>
                  </div>

                  {clan.competitionId && (
                    <div className="mb-4 p-2 bg-blue-900/20 border border-blue-700/30 rounded">
                      <p className="text-xs text-blue-300">
                        In Competition: {clan.competitionId.name || 'Unknown'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(clan)}
                      className="flex-1 bg-blue-900/50 hover:bg-blue-800/70 text-blue-300 hover:text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all"
                    >
                      <Users className="w-4 h-4" />
                      Details
                    </button>
                    <button
                      onClick={() => openEditModal(clan)}
                      className="flex-1 bg-green-900/50 hover:bg-green-800/70 text-green-300 hover:text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClan(clan._id, clan.name)}
                      className="flex-1 bg-red-900/50 hover:bg-red-800/70 text-red-300 hover:text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Clan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gold-700/50 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gold-300">Create New Clan</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({ name: '', members: ['', '', '', '', ''] });
                  }}
                  className="text-gold-500 hover:text-gold-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateClan} className="space-y-6">
                <div>
                  <label className="block text-gold-300 mb-2 font-medium">Clan Name</label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter clan name"
                    required
                    className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white placeholder-gold-500/70"
                  />
                </div>

                <div>
                  <label className="block text-gold-300 mb-2 font-medium">Clan Members (5 required)</label>
                  <div className="space-y-3">
                    {createFormData.members.map((member, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-gold-400 w-8">{index + 1}.</span>
                        <input
                          type="text"
                          value={member}
                          onChange={(e) => handleCreateClanChange(index, e.target.value)}
                          placeholder={`Member ${index + 1} name`}
                          required
                          className="flex-1 bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-2 text-white placeholder-gold-500/70"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gold-500 mt-2">
                    All members will be created as new players
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateFormData({ name: '', members: ['', '', '', '', ''] });
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 disabled:opacity-50 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300"
                  >
                    {loading ? 'Creating...' : 'Create Clan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Clan Modal */}
      {showEditModal && editingClan && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gold-700/50 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gold-300">Edit Clan</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClan(null);
                    setPlayerSearchTerm('');
                  }}
                  className="text-gold-500 hover:text-gold-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateClan} className="space-y-6">
                <div>
                  <label className="block text-gold-300 mb-2 font-medium">Clan Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => handleEditClanNameChange(e.target.value)}
                    placeholder="Enter clan name"
                    required
                    className="w-full bg-gray-800 border border-gold-700/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 rounded-lg px-4 py-3 text-white placeholder-gold-500/70"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-gold-300 font-medium">
                      Clan Members <span className="text-gold-400">({editFormData.members.length}/5)</span>
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

                  <div className="max-h-60 overflow-y-auto grid grid-cols-2 gap-2 p-2 bg-gray-800/20 rounded-lg border border-gold-800/50 mb-4">
                    {filteredPlayers.length > 0 ? (
                      filteredPlayers.map(player => {
                        const isSelected = editFormData.members.includes(player._id);
                        const isAtCapacity = editFormData.members.length >= 5;
                        const isDisabled = !isSelected && isAtCapacity;
                        
                        return (
                          <button
                            type="button"
                            key={player._id}
                            onClick={() => handleToggleMember(player._id)}
                            disabled={isDisabled}
                            className={`text-sm p-2 rounded-lg transition-all duration-200 text-center truncate relative ${
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
                              <Check className="absolute top-1 right-1 w-4 h-4 text-green-500" />
                            )}
                            {player.name}
                          </button>
                        );
                      })
                    ) : (
                      <p className="col-span-2 text-center text-gold-400 py-4">No players found</p>
                    )}
                  </div>

                  {editFormData.members.length > 0 && (
                    <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-4">
                      <h4 className="text-gold-300 font-medium mb-3">Selected Members</h4>
                      <ul className="space-y-2">
                        {editFormData.members
                          .map(id => existingPlayers.find(p => p._id === id))
                          .filter(Boolean)
                          .map(player => (
                            <li key={player._id} className="flex justify-between items-center bg-gray-700/50 px-3 py-2 rounded">
                              <span className="text-gold-200">{player.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(player._id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingClan(null);
                      setPlayerSearchTerm('');
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
                  >
                    {loading ? 'Updating...' : 'Update Clan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedClan && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gold-700/50 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-gold-400" />
                  <h3 className="text-2xl font-bold text-gold-300">{selectedClan.name}</h3>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedClan(null);
                  }}
                  className="text-gold-500 hover:text-gold-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Clan Info */}
                <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-4">
                  <h4 className="text-gold-400 font-medium mb-3">Clan Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gold-300">Members:</span>
                      <span className="text-gold-200">{selectedClan.members?.length || 0}/5</span>
                    </div>
                    {selectedClan.competitionId && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gold-300">Competition:</span>
                          <span className="text-gold-200">{selectedClan.competitionId.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gold-300">Points:</span>
                          <span className="text-gold-200">{selectedClan.points || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gold-300">Matches Won:</span>
                          <span className="text-green-400">{selectedClan.matchesWon || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gold-300">Matches Drawn:</span>
                          <span className="text-yellow-400">{selectedClan.matchesDrawn || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gold-300">Matches Lost:</span>
                          <span className="text-red-400">{selectedClan.matchesLost || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gold-300">Status:</span>
                          <span className={selectedClan.isEliminated ? 'text-red-400' : 'text-green-400'}>
                            {selectedClan.isEliminated ? 'Eliminated' : 'Active'}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gold-300">Created:</span>
                      <span className="text-gold-200">
                        {new Date(selectedClan.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Members List */}
                <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg p-4">
                  <h4 className="text-gold-400 font-medium mb-3">Clan Members</h4>
                  <div className="space-y-2">
                    {selectedClan.members?.map((member, index) => (
                      <div
                        key={member._id}
                        className="flex items-center gap-3 bg-gray-700/50 px-4 py-3 rounded-lg"
                      >
                        <span className="text-gold-400 font-bold">{index + 1}.</span>
                        <span className="text-gold-200 flex-1">{member.name}</span>
                        <span className="text-xs text-gold-500">Player ID: {member._id.slice(-6)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedClan(null);
                  }}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Close
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
                <button
                  onClick={() => {
                    setShowCreatePlayerModal(false);
                    setNewPlayerName('');
                  }}
                  className="text-gold-500 hover:text-gold-300"
                >
                  <X className="w-6 h-6" />
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePlayerModal(false);
                      setNewPlayerName('');
                    }}
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

export default ClanManagement;