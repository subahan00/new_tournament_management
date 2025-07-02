import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function ManageResults() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fixtureService.getOngoingCompetitions();
        console.log('API Response:', response); // Debug log
        
        // Extract competitions from the nested data structure
        const competitionsData = response.data.data || [];
        
        console.log('Competitions Data:', competitionsData); // Debug log
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

  return (
    <div className="p-6">
      <div className="mb-6">
  <Link
    to="/admin/dashboard"
    className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
  >
    <ArrowLeft className="w-4 h-4" />
    Back to Dashboard
  </Link>
</div>

      <h1 className="text-2xl font-bold mb-6">Post Match Results</h1>
      
      {loading && (
        <div className="text-center p-4">
          <p>Loading competitions...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="grid gap-4">
          {competitions.length > 0 ? (
            competitions.map(comp => (
              <div 
                key={comp._id}
                onClick={() => navigate(`/admin/results/${comp._id}`)}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold text-lg">{comp.name}</h3>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{comp.type}</span>
                  <span>{new Date(comp.startDate).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-blue-600">{comp.players?.length || 0} players</span>
                  {comp.currentRound && (
                    <span className="ml-3 text-green-600">
                      Current: {comp.currentRound.name}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No ongoing competitions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
