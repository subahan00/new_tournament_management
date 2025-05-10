import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fixtureService from '../services/fixtureService';

export default function ManageResults() {
  const [competitions, setCompetitions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data } = await fixtureService.getOngoingCompetitions();
      setCompetitions(data);
    };
    fetchCompetitions();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Post Match Results</h1>
      <div className="grid gap-4">
        {competitions.map(comp => (
          <div 
            key={comp._id}
            onClick={() => navigate(`/results/${comp._id}`)}
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <h3 className="font-semibold">{comp.name}</h3>
            <p className="text-sm text-gray-600">
              {comp.type} • {new Date(comp.startDate).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}