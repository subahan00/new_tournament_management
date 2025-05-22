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

  if (isLoading) return <div className="loading">Loading competitions...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="public-ko">
      <h1>KO Competitions</h1>
      <div className="competitions-list">
        {competitions.map((competition) => (
          <div 
            key={competition._id} 
            className="competition-card"
            onClick={() => handleCompetitionClick(competition._id)}
          >
            <h3>{competition.name}</h3>
            <p>Type: {competition.type}</p>
            <p>Players: {competition.numberOfPlayers}</p>
            <p>Status: {competition.status}</p>
            <p>Created: {new Date(competition.createdAt.$date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicKo;