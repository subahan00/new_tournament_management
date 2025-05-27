import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

// Initialize socket connection
const socket = io(`${process.env.REACT_APP_BACKEND_URL}`); // Update with your backend URL

export default function CompetitionFixtures() {
  const { competitionId } = useParams();
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const res = await fixtureService.getCompetitionFixtures(competitionId);
        setFixtures(res.data.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load fixtures');
      } finally {
        setLoading(false);
      }
    };

    fetchFixtures();

    // Set up socket listener for real-time updates
    socket.on('fixtureUpdate', (updatedFixture) => {
      setFixtures(prev => prev.map(f => 
        f._id === updatedFixture._id ? updatedFixture : f
      ));
    });

    socket.on('playerNameUpdate', ({ playerId, newName }) => {
      setFixtures(prev => prev.map(f => ({
        ...f,
        homePlayerName: f.homePlayer === playerId ? newName : f.homePlayerName,
        awayPlayerName: f.awayPlayer === playerId ? newName : f.awayPlayerName
      })));
    });

    return () => {
      socket.off('fixtureUpdate');
      socket.off('playerNameUpdate');
    };
  }, [competitionId]);

  if (loading) return <div className="p-6">Loading fixtures...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Fixtures</h2>
      
      <div className="space-y-4">
        {fixtures.length === 0 ? (
          <div className="text-center py-8">No fixtures found</div>
        ) : (
          fixtures.map(fixture => (
            <div key={fixture._id} className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {fixture.homePlayerName || fixture.homePlayer?.name || 'TBD'}
                </span>
                <span className="mx-4 text-gray-500">vs</span>
                <span className="font-medium">
                  {fixture.awayPlayerName || fixture.awayPlayer?.name || 'TBD'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{new Date(fixture.matchDate).toLocaleString()}</span>
                <span>{fixture.round}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}