import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  updatePlayerNameInCompetition,
  updateCompetitionStatus 
} from '../services/competitionService';
import { TrophyIcon, UserCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [message, setMessage] = useState('');

  // Fetch competitions on mount and when status changes
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
   

  // Handle competition selection
  const handleCompetitionSelect = (competition) => {
    setSelectedCompetition(competition);
    setNewStatus(competition.status); // Initialize status
    setMessage('');
  };

  // Handle player name update
  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompetition) return;
    
    const response = await updatePlayerNameInCompetition(
      selectedCompetition._id,
      playerId,
      newName
    );

    if (response.success) {
      setMessage('Player name updated successfully!');
      setPlayerId('');
      setNewName('');
      refreshCompetitionData();
    } else {
      setMessage(`Error: ${response.message}`);
    }
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

            {/* Player Name Update Section */}
            <div className="border-t border-gray-700/50 pt-5 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-300">
                <UserCircleIcon className="h-5 w-5" />
                Player Management
              </h3>
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Player ID</label>
                  <input
                    type="text"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    className="w-full bg-gray-700/30 border border-gray-600/30 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-gray-100"
                    placeholder="Enter Player ID"
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Don't know Player IDs? <Link to="/admin/manage-players" className="text-yellow-500 hover:text-yellow-400">Find them here →</Link>
                  </p>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">New Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-gray-700/30 border border-gray-600/30 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-gray-100"
                    placeholder="Enter New Name"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 px-6 py-3 rounded-lg font-medium transition-all"
                >
                  Update Player Name
                </button>
              </form>
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
    </div>
  );
};

export default CompetitionsPage;
