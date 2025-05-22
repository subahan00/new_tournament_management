import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
// Update the import line to include missing icons
import { 
  Trophy, 
  Award, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,        // Add missing import
  Calendar,     // Add missing import
  Activity      // Add missing import
} from 'lucide-react';

const ManageKoResult = () => {
  
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Load all knock-out competitions
  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        setLoading(true);
        const data = await fixtureService.fetchCompetitions();
        setCompetitions(data.filter(comp => 
          comp.type.startsWith('KO_') && comp.status !== 'completed'
        ));
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
    navigate(`/admin/manage-kos/${competition._id}`, { 
      state: { competition } 
    });
  };

  // Get status badge color based on status
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-emerald-900/30 text-gold-400 border border-emerald-800';
      case 'pending': return 'bg-amber-900/30 text-gold-400 border border-amber-800';
      case 'upcoming': return 'bg-sky-900/30 text-gold-400 border border-sky-800';
      default: return 'bg-black-800 text-gold-400 border border-gold-800';
    }
  };
  const getStatusIcon = (status) => {
    const iconProps = {
      size: 16,
      className: "text-gold-500"
    };

    switch(status) {
      case 'completed': return <CheckCircle {...iconProps} />;
      case 'pending': return <Clock {...iconProps} />;
      case 'upcoming': return <Calendar {...iconProps} />;
      default: return <Activity {...iconProps} />;
    }
  };
  // Get status icon based on status
  // const getStatusIcon = (status) => {
  //   switch(status) {
  //     case 'completed': return <CheckCircle size={16} className="me-1" />;
  //     case 'pending': return <Clock size={16} className="me-1" />;
  //     case 'upcoming': return <Calendar size={16} className="me-1" />;
  //     default: return <Activity size={16} className="me-1" />;
  //   }
  // };

  // Render loading spinner
 const renderLoadingSpinner = () => (
    <div className="fixed inset-0 bg-black-900/95 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="animate-pulse-slow rounded-full h-16 w-16 border-4 border-gold-500 border-t-transparent"></div>
    </div>
  );

   return (
    <div className="manage-ko-result container mx-auto px-4 py-8 bg-black-900 min-h-screen">
      {/* Premium Header */}
      <div className="bg-black-800 border border-gold-800 rounded-xl mb-8 p-6 
           shadow-gold-lg hover:shadow-gold-lg transition-shadow duration-300">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gold-500/10 rounded-lg border border-gold-800">
            <Trophy size={32} className="text-gold-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gold-500 mb-1">Tournament Management</h1>
            <p className="text-gold-400/80 font-light">Manage knockout stage fixtures and results</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-900/20 border border-red-800/50 rounded-lg 
             flex items-center text-gold-400 shadow-gold-sm">
          <AlertTriangle size={20} className="mr-3 text-red-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Tournament List */}
      {loading ? renderLoadingSpinner() : (
        <div className="bg-black-800 border border-gold-800 rounded-xl shadow-gold-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gold-800 bg-black-900">
            <h3 className="text-xl font-semibold text-gold-500">Active Tournaments</h3>
          </div>
          
          {competitions.length > 0 ? (
            <div className="divide-y divide-gold-800/20">
              {competitions.map(competition => (
                <div 
                  key={competition._id}
                  className="group p-6 hover:bg-gold-500/5 transition-colors cursor-pointer
                       relative hover:border-l-4 border-gold-500"
                  onClick={() => handleCompetitionClick(competition)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gold-500/10 rounded-lg border border-gold-800 mt-1">
                      <Trophy size={24} className="text-gold-500" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gold-400 group-hover:text-gold-300">
                          {competition.name}
                        </h4>
                        <span className={`${getStatusBadgeColor(competition.status)} 
                             px-3 py-1.5 rounded-full text-sm flex items-center space-x-2`}>
                          {getStatusIcon(competition.status)}
                          <span>{competition.status}</span>
                        </span>
                      </div>
                      
                      <div className="flex gap-4 mt-3">
                        <div className="flex items-center text-gold-500/80">
                          <Award size={16} className="mr-2 text-gold-500" />
                          <span className="text-sm">{competition.type.replace('KO_', '')}</span>
                        </div>
                        <div className="flex items-center text-gold-500/80">
                          <Users size={16} className="mr-2 text-gold-500" />
                          <span className="text-sm">{competition.numberOfPlayers} Players</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="inline-block p-4 bg-gold-500/10 rounded-full mb-4 border border-gold-800">
                <AlertTriangle size={40} className="text-gold-500/80" />
              </div>
              <p className="text-gold-400/70">No active knockout tournaments available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Status icons with updated gold styling

};

export default ManageKoResult;
