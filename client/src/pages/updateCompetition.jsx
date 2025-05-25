// components/CompetitionsPage.js
import { useEffect, useState } from 'react';
import axios from 'axios';
import { updatePlayerNameInCompetition } from '../services/competitionService';

const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');

  // Fetch competitions on mount
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/competitions');
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
    setMessage(''); // Clear previous messages
  };

  // Handle player name update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompetition) return;
    
    const response = await updatePlayerNameInCompetition(
      selectedCompetition._id,
      playerId,
      newName
    );
    console.log('API Response:', response); // Debug log
    // Check what exactly was updated
console.log('Updated fixtures:', response.data); 
    if (response.success) {
      setMessage('Player name updated successfully!');
      setPlayerId('');
      setNewName('');
    } else {
      setMessage(`Error: ${response.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Competitions</h1>

      {/* Competitions List */}
      <div className="grid gap-4 mb-8">
        {competitions.map(competition => (
          <div
            key={competition._id}
            onClick={() => handleCompetitionSelect(competition)}
            className={`p-4 rounded-lg shadow-md cursor-pointer transition-all ${
              selectedCompetition?._id === competition._id
                ? 'bg-blue-50 border-2 border-blue-500'
                : 'bg-white hover:shadow-lg'
            }`}
          >
            <h2 className="text-xl font-semibold">{competition.name}</h2>
            <p className="text-gray-600">{competition.description}</p>
          </div>
        ))}
      </div>

      {/* Rename Player Form */}
      {selectedCompetition && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            Manage {selectedCompetition.name}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Player ID</label>
              <input
                type="text"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">New Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Update Player Name
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.includes('Error') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompetitionsPage;