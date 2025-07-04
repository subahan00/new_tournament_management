import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import {
  Trophy,
  Award,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ManageKoResult = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Load all competitions
  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        setLoading(true);
        const data = await fixtureService.fetchCompetitions();
        setCompetitions(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load competitions');
        setLoading(false);
      }
    };

    loadCompetitions();
  }, []);

  // Handle competition selection
  const handleCompetitionClick = (competition) => {
    const path = competition.type === 'LEAGUE'
      ? `/admin/results/${competition._id}`
      : `/admin/manage-kos/${competition._id}`;

    navigate(path, {
      state: { competition }
    });
  };

  // Get status badge color based on status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-emerald-900/40 to-emerald-800/30 text-emerald-300 border border-emerald-700';
      case 'pending': return 'bg-gradient-to-r from-amber-900/40 to-amber-800/30 text-amber-300 border border-amber-700';
      case 'upcoming': return 'bg-gradient-to-r from-sky-900/40 to-sky-800/30 text-sky-300 border border-sky-700';
      default: return 'bg-gradient-to-r from-gray-900/40 to-gray-800/30 text-gray-300 border border-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    const iconProps = {
      size: 16,
      className: "mr-2"
    };

    switch (status) {
      case 'completed': return <CheckCircle {...iconProps} className="text-emerald-400" />;
      case 'pending': return <Clock {...iconProps} className="text-amber-400" />;
      case 'upcoming': return <Calendar {...iconProps} className="text-sky-400" />;
      default: return <Activity {...iconProps} className="text-gray-400" />;
    }
  };

  // Render loading spinner
  const renderLoadingSpinner = () => (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <div className="mb-6 mt-4">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 bg-gradient-to-r from-yellow-500/10 to-yellow-400/10 border border-yellow-500/30 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-yellow-500/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Premium Header */}
        <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-yellow-500/20 rounded-xl mb-8 p-6 shadow-[0_0_25px_rgba(202,138,4,0.15)] hover:shadow-[0_0_30px_rgba(202,138,4,0.25)] transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-yellow-400/10 rounded-lg border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
              <Trophy size={32} className="text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-yellow-400 mb-1">Tournament Management</h1>
              <p className="text-yellow-400/80 font-light">Manage knockout stage fixtures and results</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-gradient-to-r from-red-900/40 to-red-800/30 border border-red-700/50 rounded-lg flex items-center text-red-300 shadow-lg shadow-red-500/10">
            <AlertTriangle size={20} className="mr-3 text-red-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Tournament List */}
        <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-yellow-500/20 rounded-xl shadow-[0_0_25px_rgba(202,138,4,0.15)] overflow-hidden">
          <div className="px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-gray-900 to-gray-800">
            <h3 className="text-xl font-semibold text-yellow-400 flex items-center">
              <Trophy size={20} className="mr-2 text-yellow-400" />
              Active Tournaments
            </h3>
          </div>

          {loading ? renderLoadingSpinner() : (
            competitions.length > 0 ? (
              <div className="divide-y divide-yellow-500/10">
                {competitions.map(competition => (
                  <div
                    key={competition._id}
                    className="group p-6 hover:bg-gradient-to-r from-yellow-500/5 to-yellow-400/5 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    onClick={() => handleCompetitionClick(competition)}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6 relative z-10">
                      <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-yellow-400/10 rounded-lg border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
                        <Trophy size={24} className="text-yellow-400" />
                      </div>

                      <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-3 gap-3">
                          <h4 className="text-lg font-semibold text-yellow-400 group-hover:text-yellow-300 transition-colors">
                            {competition.name}
                          </h4>
                          <span className={`${getStatusBadgeColor(competition.status)} 
                              px-3 py-1.5 rounded-full text-sm flex items-center`}>
                            {getStatusIcon(competition.status)}
                            <span className="capitalize">{competition.status}</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center text-yellow-400/90 bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                            <Award size={16} className="mr-2 text-yellow-400" />
                            <span className="text-sm capitalize">
                              {competition.type.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-yellow-400/90 bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                            <Users size={16} className="mr-2 text-yellow-400" />
                            <span className="text-sm">
                              {competition.numberOfPlayers} Players
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="inline-block p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-400/10 rounded-full mb-4 border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
                  <AlertTriangle size={40} className="text-yellow-400/80" />
                </div>
                <p className="text-yellow-400/70">No active tournaments available</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageKoResult;
