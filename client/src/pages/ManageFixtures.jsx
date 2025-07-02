import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
export default function ManageFixtures() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

 useEffect(() => {
  const fetchCompetitions = async () => {
    try {
      const res = await fixtureService.getOngoingCompetitions();
      console.log("API competitions data:", res.data);  // <-- add this
setCompetitions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetchCompetitions();
}, []);


  if (loading) return <div>Loading...</div>;

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

      <h2 className="text-2xl font-bold mb-4">Manage Fixtures</h2>
      
      {competitions.length === 0 ? (
        <p>No ongoing competitions found</p>
      ) : (
        <div className="grid gap-4">
          {competitions.map(comp => (
            <div 
              key={comp._id}
              onClick={() => navigate(`/fixtures/${comp._id}`)}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <h3 className="font-semibold">{comp.name}</h3>
              <p>{comp.type} • {new Date(comp.startDate).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
