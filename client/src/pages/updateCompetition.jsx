import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  replacePlayerInCompetition,
  updateCompetitionStatus 
} from '../services/competitionService';
import { TrophyIcon, UserCircleIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';

const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedOldPlayer, setSelectedOldPlayer] = useState('');
  const [selectedNewPlayer, setSelectedNewPlayer] = useState('');
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch competitions on mount
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/competitions`);
        setCompetitions(response.data);
      } catch (error) {
        console.error('Error fetching competitions:', error);
      }
    };
    fetchCompetitions();
  }, []);

  // Fetch all available players
  useEffect(() => {
    const fetchAvailablePlayers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/players`);
        setAvailablePlayers(response.data);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };
    fetchAvailablePlayers();
  }, []);

  // Handle competition selection
  const handleCompetitionSelect = (competition) => {
    setSelectedCompetition(competition);
    setNewStatus(competition.status);
    setSelectedOldPlayer('');
    setSelectedNewPlayer('');
    setPlayerSearchTerm('');
    setMessage('');
  };

  // Handle status change
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompetition || !newStatus) return;

    setMessage('Updating status...');
    
    const response = await updateCompetitionStatus(
      selectedCompetition._id,
      newStatus
    );

    if (response.success) {
      setMessage(response.message || 'Competition status updated!');
      refreshCompetitionData();
    } else {
      setMessage(`Error: ${response.message}`);
      console.error('Status update failed:', response.error);
    }
  };

  // Handle player replacement
  const handlePlayerReplacement = async () => {
    if (!selectedCompetition || !selectedOldPlayer || !selectedNewPlayer) return;

    setLoading(true);
    setMessage('Processing player replacement...');

    try {
      const response = await replacePlayerInCompetition(
        selectedCompetition._id,
        selectedOldPlayer,
        selectedNewPlayer
      );

      if (response.success) {
        setMessage(response.message || 'Player replaced successfully!');
        setSelectedOldPlayer('');
        setSelectedNewPlayer('');
        setPlayerSearchTerm('');
        refreshCompetitionData();
      } else {
        setMessage(`Error: ${response.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error('Player replacement failed:', error);
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Refresh competition data after updates
  const refreshCompetitionData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/competitions/${selectedCompetition._id}`);
      setSelectedCompetition(response.data);
      
      // Update competitions list
      setCompetitions(prev => prev.map(comp => 
        comp._id === response.data._id ? response.data : comp
      ));
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Get current competition players
 const getCurrentCompetitionPlayers = () => {
  if (!selectedCompetition?.players || !Array.isArray(availablePlayers)) return [];

  return availablePlayers.filter(player =>
    selectedCompetition.players.some(p =>
      typeof p === 'object' ? p._id === player._id : p === player._id
    )
  );
};


  // Get available replacement players (excluding current competition players)
  const getAvailableReplacementPlayers = () => {
    if (!selectedCompetition) return [];
    const currentPlayerIds = selectedCompetition.players.map(p => p._id || p);
    return availablePlayers.filter(player => 
      !currentPlayerIds.includes(player._id) &&
      player.name.toLowerCase().includes(playerSearchTerm.toLowerCase())
    );
  };

  // Get selected old player details
  const getSelectedOldPlayerDetails = () => {
    return getCurrentCompetitionPlayers().find(p => p._id === selectedOldPlayer);
  };

  // Get selected new player details
  const getSelectedNewPlayerDetails = () => {
    return availablePlayers.find(p => p._id === selectedNewPlayer);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'upcoming': return 'bg-yellow-600/30 text-yellow-400';
      case 'ongoing': return 'bg-yellow-600/60 text-yellow-300';
      case 'completed': return 'bg-green-900/30 text-green-400';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="mb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
            Competitions
          </h1>
          <Link 
            to="/admin/manage-players"
            className="flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 px-4 py-2 rounded-lg transition-all border border-yellow-600/50"
          >
            <UserCircleIcon className="h-5 w-5" />
            Manage Players
          </Link>
        </div>

        {/* Competitions List */}
        <div className="space-y-4 mb-8">
          {competitions.map(competition => (
            <div
              key={competition._id}
              onClick={() => handleCompetitionSelect(competition)}
              className={`p-4 rounded-xl cursor-pointer transition-all 
                ${selectedCompetition?._id === competition._id
                  ? 'bg-gray-800/60 border-2 border-yellow-600/50'
                  : 'bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30'}
                shadow-lg hover:shadow-yellow-500/10`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-yellow-50">{competition.name}</h2>
                  <p className="text-gray-400 mt-1">{competition.description}</p>
                </div>
                <span className={`${getStatusColor(competition.status)} px-3 py-1 rounded-full text-sm`}>
                  {competition.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Competition Management Section */}
        {selectedCompetition && (
          <div className="bg-gray-800/40 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">
                Managing: {selectedCompetition.name}
              </h2>
              <button
                onClick={() => setSelectedCompetition(null)}
                className="text-gray-400 hover:text-yellow-500 transition-colors"
              >
                × Close
              </button>
            </div>

            {/* Status Update Section */}
            <div className="border-t border-gray-700/50 pt-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-300">
                <ArrowPathIcon className="h-5 w-5" />
                Competition Status
              </h3>
              <form onSubmit={handleStatusSubmit} className="flex gap-4 items-end">
                <div className="flex-1">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-gray-700/30 border border-gray-600/30 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-gray-100"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 px-6 py-2 rounded-lg font-medium transition-all"
                >
                  Update Status
                </button>
              </form>
            </div>

            {/* Player Replacement Section */}
            <div className="border-t border-gray-700/50 pt-5 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-300">
                <UserIcon className="h-5 w-5" />
                Player Replacement
              </h3>
              
              <div className="space-y-6">
                {/* Select Player to Replace */}
                <div>
                  <label className="block text-gray-300 mb-2">Select Player to Replace</label>
                  <select
                    value={selectedOldPlayer}
                    onChange={(e) => setSelectedOldPlayer(e.target.value)}
                    className="w-full bg-gray-700/30 border border-gray-600/30 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-gray-100"
                  >
                    <option value="">-- Select Player --</option>
                    {getCurrentCompetitionPlayers().map(player => (
                      <option key={player._id} value={player._id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search and Select Replacement Player */}
                <div>
                  <label className="block text-gray-300 mb-2">Search Replacement Player</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={playerSearchTerm}
                      onChange={(e) => setPlayerSearchTerm(e.target.value)}
                      className="w-full bg-gray-700/30 border border-gray-600/30 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-gray-100"
                      placeholder="Search for a player..."
                    />
                  </div>
                  
                  {playerSearchTerm && (
                    <div className="max-h-48 overflow-y-auto bg-gray-700/50 border border-gray-600/30 rounded-lg">
                      {getAvailableReplacementPlayers().map(player => (
                        <div
                          key={player._id}
                          onClick={() => {
                            setSelectedNewPlayer(player._id);
                            setPlayerSearchTerm(player.name);
                          }}
                          className={`p-3 cursor-pointer hover:bg-gray-600/30 transition-colors ${
                            selectedNewPlayer === player._id ? 'bg-yellow-600/20' : ''
                          }`}
                        >
                          <div className="text-white">{player.name}</div>
                        </div>
                      ))}
                      {getAvailableReplacementPlayers().length === 0 && (
                        <div className="p-3 text-gray-400">No players found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Replacement Summary */}
                {selectedOldPlayer && selectedNewPlayer && (
                  <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
                    <h4 className="text-yellow-300 font-semibold mb-2">Replacement Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Current Player</p>
                        <p className="text-white font-medium">{getSelectedOldPlayerDetails()?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Replacement Player</p>
                        <p className="text-white font-medium">{getSelectedNewPlayerDetails()?.name}</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                      <p className="text-yellow-300 text-sm">
                        <strong>Note:</strong> The replacement player will inherit all match results and standings from the current player.
                      </p>
                    </div>
                  </div>
                )}

                {/* Replace Button */}
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!selectedOldPlayer || !selectedNewPlayer || loading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-all"
                >
                  {loading ? 'Processing...' : 'Replace Player'}
                </button>
              </div>
            </div>

            {/* Status Message Display */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg border ${
                message.includes('Error') 
                  ? 'bg-red-900/20 border-red-700/50 text-red-300'
                  : 'bg-green-900/20 border-green-700/50 text-green-300'
              }`}>
                {message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Confirm Player Replacement</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to replace <strong>{getSelectedOldPlayerDetails()?.name}</strong> with <strong>{getSelectedNewPlayerDetails()?.name}</strong>?
            </p>
            <p className="text-yellow-300 text-sm mb-6">
              This action cannot be undone. The replacement player will inherit all match results and continue in the competition.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlayerReplacement}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Processing...' : 'Confirm Replace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionsPage;
