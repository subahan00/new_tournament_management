import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import standingService from '../services/standingService';

export default function ManageStandings() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await standingService.getOngoingCompetitions();
        
        // Validate response structure
        if (!response.data || !Array.isArray(response.data.data)) {
          throw new Error('Invalid server response format');
        }

        setCompetitions(response.data.data);
        setError(null);

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  if (loading) {
    return <div className="p-6 text-yellow-400">Loading competitions...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-400">
        Error: {error}
        <button 
          onClick={() => window.location.reload()}
          className="ml-4 bg-yellow-500 text-black px-3 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-yellow-400">Active Competitions</h1>
      <div className="grid gap-4">
        {competitions.map(comp => (
          <div
            key={comp._id}
            onClick={() => navigate(`/standings/${comp._id}`)}
            className="p-4 border border-yellow-500 rounded-lg cursor-pointer hover:bg-yellow-900 transition-colors"
          >
            <h3 className="text-xl font-semibold text-yellow-300">{comp.name}</h3>
            <div className="mt-2 text-yellow-200">
              <p>Type: {comp.type}</p>
              <p>Players: {comp.playerCount}</p>
              <p>Started: {new Date(comp.startDate).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}