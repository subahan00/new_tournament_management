import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Users, Calendar, ChevronRight, CircleDashed, ServerCrash, FolderSearch } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import competitionService from '../services/fixtureService';



// Competition Card Component
const CompetitionCard = ({ comp, onClick }) => (
  <div
    onClick={onClick}
    className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/80 rounded-xl p-6 cursor-pointer hover:bg-gray-800/60 hover:border-amber-400/50 transition-all duration-300 transform hover:-translate-y-1.5 group relative overflow-hidden shadow-lg"
  >
    <div className="absolute -top-1 -right-1 h-2 w-2 bg-amber-400 rounded-bl-full transition-all duration-500 ease-out group-hover:h-16 group-hover:w-16"></div>
    <div className="relative z-10">
      <h3 className="font-bold text-xl text-amber-300 group-hover:text-amber-200 transition-colors duration-300 mb-4 truncate pr-8">{comp.name}</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3 text-gray-400">
          <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>{comp.type}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <Users className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>{comp.players?.length || 0} players</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Starts: {new Date(comp.startDate).toLocaleDateString()}</span>
        </div>
      </div>

      {comp.currentRound && (
        <div className="mt-5 pt-4 border-t border-gray-700/80">
          <p className="text-xs text-gray-500 mb-1 tracking-wider uppercase">Current Stage</p>
          <p className="font-semibold text-amber-400">{comp.currentRound.name}</p>
        </div>
      )}

      <div className="absolute bottom-6 right-6 text-amber-400 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
        <ChevronRight className="w-6 h-6" />
      </div>
    </div>
  </div>
);

// Loading State Component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-64 text-amber-400/80">
    <CircleDashed className="w-12 h-12 animate-spin mb-4" />
    <p className="text-lg tracking-widest uppercase">Loading Competitions</p>
  </div>
);

// Error State Component
const ErrorState = ({ error }) => (
  <div className="bg-red-900/40 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg flex items-center gap-4 animate-pulse">
    <ServerCrash className="w-8 h-8 flex-shrink-0" />
    <div>
      <h3 className="font-bold text-lg">An Error Occurred</h3>
      <p>{error}</p>
    </div>
  </div>
);

// Empty State Component
const EmptyState = () => (
    <div className="text-center p-12 bg-gray-800/30 border border-dashed border-gray-700 rounded-lg mt-4">
      <FolderSearch className="w-16 h-16 mx-auto text-gray-600 mb-4" />
      <h3 className="text-xl font-semibold text-gray-400">No Competitions Found</h3>
      <p className="text-gray-500 mt-2">There are no ongoing competitions to manage at the moment.</p>
  </div>
);


export default function App() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using the mocked service. In your app, this would be `fixtureService`.
        const response = await competitionService.getOngoingCompetitions();
        const competitionsData = response.data.data || [];
        
        setCompetitions(competitionsData);
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load competitions');
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompetitions();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }
    
    if (error) {
      return <ErrorState error={error} />;
    }
    
    if (competitions.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map(comp => (
            <CompetitionCard 
              key={comp._id} 
              comp={comp} 
              onClick={() => navigate(`/admin/results/${comp._id}`)} 
            />
          ))}
        </div>
      );
    }

    return <EmptyState />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-[#100c08] text-gray-300 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-wider">
                Manage Results
            </h1>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-100 bg-gray-800/50 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:border-amber-400/70 hover:bg-gray-800 shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}
