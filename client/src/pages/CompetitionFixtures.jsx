import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import fixtureService from '../services/fixtureService';

export default function CompetitionFixtures() {
  const { competitionId } = useParams();
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const res = await fixtureService.getCompetitionFixtures(competitionId);
        setFixtures(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFixtures();
  }, [competitionId]);

  if (loading) return <div>Loading fixtures...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Fixtures</h2>
      
      <div className="space-y-4">
        {fixtures.map(fixture => (
          <div key={fixture._id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <span>{fixture.homePlayer?.name || 'TBD'}</span>
              <span>vs</span>
              <span>{fixture.awayPlayer?.name || 'TBD'}</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {new Date(fixture.matchDate).toLocaleString()} • {fixture.round}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}