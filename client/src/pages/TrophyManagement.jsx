import React, { useState, useEffect } from 'react';
import {
  getWinners,
  getWinnerById,
  createWinner,
  addTrophy,
  updateTrophy,
  deleteTrophy,
  deleteWinner,
  handleApiError
} from '../services/winnerService';
import {
  Trophy,
  User,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Medal,
  Star,
  UserPlus
} from 'lucide-react';

const TrophyManagement = () => {
  const [winners, setWinners] = useState([]);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Form states
  const [newPlayerForm, setNewPlayerForm] = useState({ name: '', trophies: [] });
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [newTrophyForm, setNewTrophyForm] = useState({ competition: '', timesWon: 1 });
  const [showNewTrophyForm, setShowNewTrophyForm] = useState(false);
  const [editingTrophy, setEditingTrophy] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getWinners();
      setWinners(response.data || []);
    } catch (err) {
      setError(handleApiError(err));
      showToast('Failed to load players', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleWinnerSelect = async (winnerId) => {
    try {
      const response = await getWinnerById(winnerId);
      setSelectedWinner(response.data);
      setShowNewTrophyForm(false);
      setEditingTrophy(null);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    }
  };

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await createWinner(newPlayerForm);
      setWinners([...winners, response.data]);
      setNewPlayerForm({ name: '', trophies: [] });
      setShowNewPlayerForm(false);
      showToast(`Player "${response.data.name}" created successfully`);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTrophy = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await addTrophy(selectedWinner._id, newTrophyForm);
      setSelectedWinner(response.data);
      setWinners(winners.map(w => w._id === response.data._id ? response.data : w));
      setNewTrophyForm({ competition: '', timesWon: 1 });
      setShowNewTrophyForm(false);
      showToast(`Trophy "${newTrophyForm.competition}" added successfully`);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTrophy = async (trophy) => {
    setSaving(true);
    
    try {
      const response = await updateTrophy(selectedWinner._id, trophy);
      setSelectedWinner(response.data);
      setWinners(winners.map(w => w._id === response.data._id ? response.data : w));
      setEditingTrophy(null);
      showToast(`Trophy "${trophy.competition}" updated successfully`);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrophy = async (trophy) => {
    setSaving(true);
    
    try {
      const response = await deleteTrophy(selectedWinner._id, trophy);
      setSelectedWinner(response.data);
      setWinners(winners.map(w => w._id === response.data._id ? response.data : w));
      showToast(`Trophy "${trophy.competition}" deleted successfully`);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    setSaving(true);
    
    try {
      await deleteWinner(playerId);
      setWinners(winners.filter(w => w._id !== playerId));
      if (selectedWinner && selectedWinner._id === playerId) {
        setSelectedWinner(null);
      }
      setDeleteConfirm(null);
      showToast('Player deleted successfully');
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const getTrophyIcon = (timesWon) => {
    if (timesWon >= 5) return <Star className="w-5 h-5 text-yellow-500" />;
    if (timesWon >= 3) return <Medal className="w-5 h-5 text-orange-500" />;
    return <Trophy className="w-5 h-5 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading trophy management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          <div className="flex items-center">
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">Trophy Management</h1>
            </div>
            <button
              onClick={() => setShowNewPlayerForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              New Player
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Players ({winners.length})
                </h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {winners.length === 0 ? (
                  <div className="p-8 text-center">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No players yet</p>
                    <p className="text-sm text-gray-400 mt-1">Add your first player to get started</p>
                  </div>
                ) : (
                  winners
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((winner) => (
                      <div
                        key={winner._id}
                        onClick={() => handleWinnerSelect(winner._id)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedWinner && selectedWinner._id === winner._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-800">{winner.name}</h3>
                            <p className="text-sm text-gray-600">
                              {winner.totalTrophies} {winner.totalTrophies === 1 ? 'trophy' : 'trophies'}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="font-semibold text-blue-600">{winner.totalTrophies}</span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg">
              {!selectedWinner ? (
                <div className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">Select a Player</h3>
                  <p className="text-gray-400">Choose a player from the list to manage their trophies</p>
                </div>
              ) : (
                <>
                  {/* Selected Player Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedWinner.name}</h2>
                        <p className="text-gray-600">
                          {selectedWinner.totalTrophies} {selectedWinner.totalTrophies === 1 ? 'trophy' : 'trophies'} 
                          {selectedWinner.trophies.length > 0 && ` across ${selectedWinner.trophies.length} competitions`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowNewTrophyForm(true)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Trophy
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(selectedWinner)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Player
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add New Trophy Form */}
                  {showNewTrophyForm && (
                    <div className="p-6 bg-green-50 border-b border-green-200">
                      <form onSubmit={handleAddTrophy} className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Add New Trophy</h3>
                          <button
                            type="button"
                            onClick={() => setShowNewTrophyForm(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Competition Name
                            </label>
                            <input
                              type="text"
                              value={newTrophyForm.competition}
                              onChange={(e) => setNewTrophyForm({ ...newTrophyForm, competition: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                              placeholder="e.g., World Championship"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Times Won
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={newTrophyForm.timesWon}
                              onChange={(e) => setNewTrophyForm({ ...newTrophyForm, timesWon: parseInt(e.target.value) || 1 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowNewTrophyForm(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Add Trophy
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Trophies List */}
                  <div className="p-6">
                    {selectedWinner.trophies.length === 0 ? (
                      <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No trophies yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add the first trophy to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Trophies</h3>
                        {selectedWinner.trophies
                          .sort((a, b) => b.timesWon - a.timesWon || a.competition.localeCompare(b.competition))
                          .map((trophy, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              {editingTrophy && editingTrophy.competition === trophy.competition ? (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdateTrophy(editingTrophy);
                                  }}
                                  className="space-y-3"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2">
                                      <input
                                        type="text"
                                        value={editingTrophy.competition}
                                        onChange={(e) => setEditingTrophy({ ...editingTrophy, competition: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        min="1"
                                        value={editingTrophy.timesWon}
                                        onChange={(e) => setEditingTrophy({ ...editingTrophy, timesWon: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingTrophy(null)}
                                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={saving}
                                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                                    >
                                      {saving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                      )}
                                      Save
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {getTrophyIcon(trophy.timesWon)}
                                    <div className="ml-3">
                                      <h4 className="font-semibold text-gray-800">{trophy.competition}</h4>
                                      <p className="text-sm text-gray-600">
                                        Won {trophy.timesWon} {trophy.timesWon === 1 ? 'time' : 'times'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl font-bold text-blue-600">{trophy.timesWon}</span>
                                    <button
                                      onClick={() => setEditingTrophy({ ...trophy })}
                                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                      title="Edit trophy"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTrophy(trophy)}
                                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                      title="Delete trophy"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Player Modal */}
      {showNewPlayerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Create New Player</h3>
                <button
                  onClick={() => setShowNewPlayerForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreatePlayer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={newPlayerForm.name}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter player name"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewPlayerForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Create Player
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                <h3 className="text-xl font-semibold text-gray-800">Delete Player</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? 
                This will permanently remove the player and all their trophies. This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePlayer(deleteConfirm._id)}
                  disabled={saving}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrophyManagement;
