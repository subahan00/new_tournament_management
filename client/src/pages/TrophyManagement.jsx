import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  UserPlus,
  Menu,
  Crown,
  Award,
  Target,
  Search,
  Filter,
  ChevronDown,
  BarChart3,
  Download,
  Upload,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TrophyManagement = () => {
  const [winners, setWinners] = useState([]);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form states
  const [newPlayerForm, setNewPlayerForm] = useState({ name: '', trophies: [] });
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [newTrophyForm, setNewTrophyForm] = useState({ competition: '', timesWon: 1 });
  const [showNewTrophyForm, setShowNewTrophyForm] = useState(false);
  const [editingTrophyIndex, setEditingTrophyIndex] = useState(null); // Changed to use index
  const [editingTrophyData, setEditingTrophyData] = useState(null); // Separate data state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trophies'); // 'trophies', 'name', 'competitions'
  const [filterMinTrophies, setFilterMinTrophies] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = useCallback(async () => {
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
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleWinnerSelect = useCallback(async (winnerId) => {
    try {
      const response = await getWinnerById(winnerId);
      setSelectedWinner(response.data);
      setShowNewTrophyForm(false);
      setEditingTrophyIndex(null);
      setEditingTrophyData(null);
      setSidebarOpen(false); // Close sidebar on mobile after selection
    } catch (err) {
      showToast(handleApiError(err), 'error');
    }
  }, [showToast]);

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await createWinner(newPlayerForm);
      setWinners(prev => [...prev, response.data]);
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
      setWinners(prev => prev.map(w => w._id === response.data._id ? response.data : w));
      setNewTrophyForm({ competition: '', timesWon: 1 });
      setShowNewTrophyForm(false);
      showToast(`Trophy "${newTrophyForm.competition}" added successfully`);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTrophy = async (originalTrophy) => {
    setSaving(true);

    try {
      console.log("winnerId being passed:", selectedWinner?._id);
      console.log("Trophy being updated:", editingTrophyData);

      const payload = {
        competition: originalTrophy.competition,            // original name
        newCompetition: editingTrophyData.competition,      // new (possibly same) name
        timesWon: editingTrophyData.timesWon
      };

      const response = await updateTrophy(selectedWinner._id, payload);
      setSelectedWinner(response.data);
      setWinners(prev => prev.map(w => w._id === response.data._id ? response.data : w));
      setEditingTrophyIndex(null);
      setEditingTrophyData(null);
      showToast(`Trophy updated successfully`);
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
      setWinners(prev => prev.map(w => w._id === response.data._id ? response.data : w));
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
      setWinners(prev => prev.filter(w => w._id !== playerId));
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

  const startEditing = useCallback((trophy, index) => {
    setEditingTrophyIndex(index);
    setEditingTrophyData({ ...trophy });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingTrophyIndex(null);
    setEditingTrophyData(null);
  }, []);

  const getTrophyIcon = useCallback((timesWon) => {
    if (timesWon >= 5) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (timesWon >= 3) return <Award className="w-5 h-5 text-yellow-500" />;
    if (timesWon >= 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <Trophy className="w-5 h-5 text-gray-400" />;
  }, []);

  const getTrophyGradient = useCallback((timesWon) => {
    if (timesWon >= 5) return 'from-yellow-400 to-yellow-600';
    if (timesWon >= 3) return 'from-yellow-500 to-amber-600';
    if (timesWon >= 2) return 'from-amber-500 to-orange-600';
    return 'from-gray-400 to-gray-600';
  }, []);

  const filteredAndSortedWinners = useMemo(() => {
    let filtered = winners.filter(winner => {
      const matchesSearch = winner.name.toLowerCase().includes(searchQuery.toLowerCase());
      const totalTrophies = winner.trophies?.reduce((sum, t) => sum + t.timesWon, 0) || 0;
      const meetsMinTrophies = totalTrophies >= filterMinTrophies;
      return matchesSearch && meetsMinTrophies;
    });

    return filtered.sort((a, b) => {
      const aTotalTrophies = a.trophies?.reduce((sum, t) => sum + t.timesWon, 0) || 0;
      const bTotalTrophies = b.trophies?.reduce((sum, t) => sum + t.timesWon, 0) || 0;
      const aCompetitions = a.trophies?.length || 0;
      const bCompetitions = b.trophies?.length || 0;

      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'competitions':
          return bCompetitions - aCompetitions || a.name.localeCompare(b.name);
        case 'trophies':
        default:
          return bTotalTrophies - aTotalTrophies || a.name.localeCompare(b.name);
      }
    });
  }, [winners, searchQuery, sortBy, filterMinTrophies]);

  const handleBulkDelete = async (playerIds) => {
    setSaving(true);
    try {
      await Promise.all(playerIds.map(id => deleteWinner(id)));
      setWinners(prev => prev.filter(w => !playerIds.includes(w._id)));
      if (selectedWinner && playerIds.includes(selectedWinner._id)) {
        setSelectedWinner(null);
      }
      showToast(`${playerIds.length} players deleted successfully`);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };
  const sortedTrophies = useMemo(() =>
    selectedWinner?.trophies?.sort((a, b) =>
      b.timesWon - a.timesWon || a.competition.localeCompare(b.competition)
    ) || [], [selectedWinner]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 w-16 h-16 mx-auto">
              <div className="w-full h-full rounded-full border-2 border-yellow-400/20 animate-pulse"></div>
            </div>
          </div>
          <p className="text-xl text-gray-300 font-medium">Loading Trophy Management...</p>
          <div className="mt-2 w-32 h-1 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="mb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl transition-all duration-500 transform ${toast.type === 'error'
          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-500/50'
          : 'bg-gradient-to-r from-emerald-600 to-green-700 text-white border border-emerald-500/50'
          } backdrop-blur-sm`}>
          <div className="flex items-center">
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 mr-3 animate-pulse" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-3" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-sm border-b border-yellow-500/20 shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-3 p-2 text-yellow-400 hover:text-yellow-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center">
                <div className="relative">
                  <Trophy className="w-8 h-8 text-yellow-400 mr-3" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Trophy Management
                  </h1>
                  <p className="text-gray-400 text-sm hidden sm:block">Manage players and their achievements</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewPlayerForm(true)}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-4 py-2 rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all duration-300 flex items-center font-semibold shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">New Player</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Players List Panel */}
          <div className={`lg:col-span-1 ${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-80 lg:relative lg:w-auto' : 'hidden lg:block'}`}>
            <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 h-full lg:h-auto">
              {/* Header with Search */}
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <User className="w-5 h-5 mr-2 text-yellow-400" />
                    Players ({filteredAndSortedWinners.length})
                  </h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-white placeholder-gray-400 text-sm transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm text-gray-400 hover:text-yellow-400 transition-colors mb-2"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Sort by</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-yellow-500 outline-none"
                      >
                        <option value="trophies">Trophy Count</option>
                        <option value="name">Name</option>
                        <option value="competitions">Competitions</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Min Trophies</label>
                      <input
                        type="number"
                        min="0"
                        value={filterMinTrophies}
                        onChange={(e) => setFilterMinTrophies(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-yellow-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Stats */}
                {winners.length > 0 && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-yellow-500/10 to-amber-600/10 rounded-lg border border-yellow-500/20">
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Total: {winners.reduce((sum, w) => sum + (w.trophies?.reduce((tSum, t) => tSum + t.timesWon, 0) || 0), 0)} trophies</div>
                      <div>Avg: {Math.round(winners.reduce((sum, w) => sum + (w.trophies?.reduce((tSum, t) => tSum + t.timesWon, 0) || 0), 0) / winners.length)} per player</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Players List */}
              <div className="max-h-[calc(100vh-300px)] lg:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-600 scrollbar-track-gray-800">
                {filteredAndSortedWinners.length === 0 ? (
                  <div className="p-8 text-center">
                    {searchQuery || filterMinTrophies > 0 ? (
                      <>
                        <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No players found</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setFilterMinTrophies(0);
                          }}
                          className="mt-3 text-yellow-400 hover:text-yellow-300 text-sm underline"
                        >
                          Clear filters
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative mx-auto w-20 h-20 mb-4">
                          <User className="w-full h-full text-gray-600" />
                          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-600 animate-pulse"></div>
                        </div>
                        <p className="text-gray-400 font-medium">No players yet</p>
                        <p className="text-sm text-gray-500 mt-1">Add your first champion!</p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredAndSortedWinners.map((winner, index) => {
                    const totalTrophies = winner.trophies?.reduce((sum, t) => sum + t.timesWon, 0) || 0;
                    const isSelected = selectedWinner && selectedWinner._id === winner._id;

                    return (
                      <div
                        key={winner._id}
                        onClick={() => handleWinnerSelect(winner._id)}
                        className={`p-4 border-b border-gray-700/30 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/50 ${isSelected
                          ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border-yellow-500/30 shadow-lg'
                          : ''
                          } group`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              {index < 3 && (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' :
                                  index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black' :
                                    'bg-gradient-to-r from-amber-600 to-orange-700 text-white'
                                  }`}>
                                  {index + 1}
                                </div>
                              )}
                              <h3 className="font-semibold text-white group-hover:text-yellow-300 transition-colors">
                                {winner.name}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {totalTrophies} {totalTrophies === 1 ? 'trophy' : 'trophies'}
                              {winner.trophies?.length > 0 && ` • ${winner.trophies.length} competitions`}
                            </p>
                          </div>
                          <div className="flex items-center ml-3">
                            <div className={`p-2 rounded-full bg-gradient-to-r ${getTrophyGradient(totalTrophies)} text-white font-bold text-sm min-w-[2rem] text-center`}>
                              {totalTrophies}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>


          {/* Detail Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50">
              {!selectedWinner ? (
                <div className="p-12 text-center">
                  <div className="relative mx-auto w-24 h-24 mb-6">
                    <Trophy className="w-full h-full text-gray-600" />
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-600 animate-spin" style={{ animationDuration: '8s' }}></div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-300 mb-2">Select a Champion</h3>
                  <p className="text-gray-500">Choose a player to manage their trophies and achievements</p>
                </div>
              ) : (
                <>
                  {selectedWinner && (
                    <div className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-b border-gray-700/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">
                            {selectedWinner.trophies?.reduce((sum, t) => sum + t.timesWon, 0) || 0}
                          </div>
                          <div className="text-xs text-gray-400">Total Trophies</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {selectedWinner.trophies?.length || 0}
                          </div>
                          <div className="text-xs text-gray-400">Competitions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {selectedWinner.trophies?.filter(t => t.timesWon >= 3).length || 0}
                          </div>
                          <div className="text-xs text-gray-400">Multi-Wins</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {Math.round((selectedWinner.trophies?.reduce((sum, t) => sum + t.timesWon, 0) || 0) / Math.max(selectedWinner.trophies?.length || 1, 1) * 10) / 10}
                          </div>
                          <div className="text-xs text-gray-400">Avg/Competition</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Add Trophy Button */}
                  <div className="p-4 border-b border-gray-700/30">
                    <button
                      onClick={() => setShowNewTrophyForm(true)}
                      className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-4 py-2 rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all duration-300 flex items-center font-semibold shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Trophy
                    </button>
                  </div>

                  {/* Add New Trophy Form */}
                  {showNewTrophyForm && (
                    <div className="p-6 bg-gradient-to-r from-emerald-900/30 to-green-900/30 border-b border-emerald-500/20">
                      <form onSubmit={handleAddTrophy} className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-white">Add New Trophy</h3>
                          <button
                            type="button"
                            onClick={() => setShowNewTrophyForm(false)}
                            className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Competition Name
                            </label>
                            <input
                              type="text"
                              value={newTrophyForm.competition}
                              onChange={(e) => setNewTrophyForm({ ...newTrophyForm, competition: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-gray-400 transition-all duration-200"
                              placeholder="e.g., World Championship"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Times Won
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={newTrophyForm.timesWon}
                              onChange={(e) => setNewTrophyForm({ ...newTrophyForm, timesWon: parseInt(e.target.value) || 1 })}
                              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white transition-all duration-200"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowNewTrophyForm(false)}
                            className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-gradient-to-r from-emerald-600 to-green-700 text-white px-6 py-2 rounded-xl hover:from-emerald-500 hover:to-green-600 transition-all duration-300 flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                    {sortedTrophies.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="relative mx-auto w-20 h-20 mb-4">
                          <Trophy className="w-full h-full text-gray-600" />
                          <Target className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1" />
                        </div>
                        <p className="text-gray-400 font-medium text-lg">No trophies yet</p>
                        <p className="text-sm text-gray-500 mt-1">Add the first trophy to start the collection!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                          <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                          Trophy Collection
                        </h3>
                        {sortedTrophies.map((trophy, index) => (
                          <div key={`${trophy.competition}-${index}`} className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl p-4 border border-gray-600/30 hover:border-yellow-500/30 transition-all duration-300 shadow-lg hover:shadow-xl">
                            {editingTrophyIndex === index ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleUpdateTrophy(trophy);
                                }}
                                className="space-y-4"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="md:col-span-2">
                                    <input
                                      type="text"
                                      value={editingTrophyData.competition}
                                      onChange={(e) => setEditingTrophyData({
                                        ...editingTrophyData,
                                        competition: e.target.value
                                      })}
                                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-white transition-all duration-200"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="number"
                                      min="1"
                                      value={editingTrophyData.timesWon}
                                      onChange={(e) => setEditingTrophyData({
                                        ...editingTrophyData,
                                        timesWon: parseInt(e.target.value) || 1
                                      })}
                                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-white transition-all duration-200"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-3">
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-6 py-2 rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all duration-300 flex items-center font-semibold disabled:opacity-50 shadow-lg"
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
                                <div className="flex items-center flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {getTrophyIcon(trophy.timesWon)}
                                  </div>
                                  <div className="ml-4 flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-lg truncate">{trophy.competition}</h4>
                                    <p className="text-sm text-gray-400 mt-1">
                                      Won {trophy.timesWon} {trophy.timesWon === 1 ? 'time' : 'times'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTrophyGradient(trophy.timesWon)} text-white font-bold text-lg min-w-[3rem] text-center`}>
                                    {trophy.timesWon}
                                  </div>
                                  <button
                                    onClick={() => startEditing(trophy, index)}
                                    className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-gray-700/50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                    title="Edit trophy"
                                  >
                                    <Edit3 className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTrophy(trophy)}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700/50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                    title="Delete trophy"
                                  >
                                    <Trash2 className="w-5 h-5" />
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full border border-gray-700/50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Create New Player
                </h3>
                <button
                  onClick={() => setShowNewPlayerForm(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreatePlayer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={newPlayerForm.name}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-white placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter champion's name"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewPlayerForm(false)}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-6 py-2 rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all duration-300 flex items-center font-semibold disabled:opacity-50 shadow-lg transform hover:scale-105"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full border border-gray-700/50">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-red-500/20 rounded-full mr-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Delete Player</h3>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-yellow-400">{deleteConfirm.name}</span>?
                This will permanently remove the player and all their trophies. This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePlayer(deleteConfirm._id)}
                  disabled={saving}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 flex items-center font-semibold disabled:opacity-50 shadow-lg transform hover:scale-105"
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
