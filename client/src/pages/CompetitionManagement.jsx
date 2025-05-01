import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Competitions = () => {
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    axios.get('/api/competitions') // Adjust the API endpoint as needed
      .then(response => {
        setCompetitions(response.data);
      })
      .catch(error => {
        console.error('Error fetching competitions:', error);
      });
  }, []);

  return (
    <div className="competitions-container">
      <h2 className="text-center text-xl font-bold">Competitions</h2>
      <div className="competitions-list">
        {competitions.length > 0 ? (
          competitions.map(competition => (
            <div key={competition._id} className="competition-card">
              <h3>{competition.name}</h3>
              <p>{competition.type}</p>
              <p>Players: {competition.numberOfPlayers}</p>
              <p>Status: {competition.status}</p>
            </div>
          ))
        ) : (
          <p>No competitions available.</p>
        )}
      </div>
    </div>
  );
};

export default Competitions;
