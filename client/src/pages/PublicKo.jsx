import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fixtureService from '../services/fixtureService';

const PublicKo = () => {
  const [competitions, setCompetitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        const data = await fixtureService.fetchCompetitions();
        setCompetitions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadCompetitions();
  }, []);

  const handleCompetitionClick = (competitionId) => {
    navigate(`/manage-ko/${competitionId}`);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-2xl font-bold text-gold-300 animate-pulse">
        Loading Competitions...
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-red-400 text-xl font-semibold">{`Error: ${error}`}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-gold-300">
          KO Competitions
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((competition) => (
            <div 
              key={competition._id}
              className="relative bg-gray-800/50 rounded-xl border-2 border-gold-700/30 p-6 transform transition-all 
                       hover:scale-105 hover:border-gold-500/50 cursor-pointer group shadow-xl hover:shadow-2xl"
              onClick={() => handleCompetitionClick(competition._id)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-transparent rounded-xl" />
              
              <div className="relative space-y-4">
                <h3 className="text-2xl font-bold text-gold-300 group-hover:text-gold-200 transition-colors">
                  {competition.name}
                </h3>
                
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Type:</span>
                    <span className="text-gold-400">{competition.type}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Players:</span>
                    <span className="text-gold-400">{competition.numberOfPlayers}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Status:</span>
                    <span className={`px-2 py-1 rounded-full ${
                      competition.status === 'active' ? 'text-green-400' : 
                      competition.status === 'completed' ? 'text-blue-400' : 
                      'text-red-400'
                    }`}>
                      {competition.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Created:</span>
                    <span className="text-gold-400">
                      {new Date(competition.createdAt.$date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicKo;