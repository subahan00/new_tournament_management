import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fixtureService from '../services/fixtureService';

export default function ManageFixtures() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await fixtureService.getOngoingCompetitions();
        setCompetitions(res.data);
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