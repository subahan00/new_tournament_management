import React, { useEffect, useState } from 'react';
import axios from '../services/api';
import { FiCopy, FiSearch } from 'react-icons/fi';

const CreatePlayerForm = () => {
  const [name, setName] = useState('');
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch competitions and players
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [compRes, playersRes] = await Promise.all([
          axios.get('/competitions'),
          axios.get('/players')
        ]);
        setCompetitions(compRes.data);
        setPlayers(playersRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

      // Update players list with new player
      setPlayers([...players, res.data]);
      alert(`Player "${res.data.name}" created successfully`);
      setName('');
      setSelectedCompetitionId('');
    } catch (error) {
      console.error('Error creating player:', error);
      alert('Failed to create player');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
        <h2>Create Player</h2>

        <div style={{ marginBottom: '15px' }}>
          <label>Player Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter player name"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

    

        <button 
          type="submit" 
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create Player
        </button>
      </form>

      <div>
        <h2>Player List</h2>
        
        <div style={{ marginBottom: '15px', position: 'relative' }}>
          <FiSearch style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666'
          }} />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 8px 8px 35px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        {isLoading ? (
          <p>Loading players...</p>
        ) : (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map(player => (
                    <tr key={player._id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px' }}>{player.name}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                        {player._id}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => copyToClipboard(player._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <FiCopy /> Copy
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '12px', textAlign: 'center' }}>
                      No players found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePlayerForm;