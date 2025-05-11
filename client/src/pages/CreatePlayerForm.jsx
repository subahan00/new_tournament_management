import React, { useEffect, useState } from 'react';
import axios from '../services/api'; // Adjust this path based on your structure

const CreatePlayerForm = () => {
  const [name, setName] = useState('');
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');

  // Fetch competitions from backend
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await axios.get('/competitions'); // Your endpoint to fetch competitions
        setCompetitions(res.data);
      } catch (error) {
        console.error('Error fetching competitions:', error);
      }
    };

    fetchCompetitions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Player name is required');
      return;
    }

  

    try {
      const res = await axios.post('/players', {
        name,
        competitionId: selectedCompetitionId,
      });

      alert(`Player "${res.data.name}" created successfully`);
      setName('');
      setSelectedCompetitionId('');
    } catch (error) {
      console.error('Error creating player:', error);
      alert('Failed to create player');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>Create Player</h2>

      <div style={{ marginBottom: '10px' }}>
        <label>Player Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player name"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

   

      <button type="submit" style={{ padding: '10px 20px' }}>
        Create Player
      </button>
    </form>
  );
};

export default CreatePlayerForm;
