import { useEffect, useState } from "react";
import fixtureService from "../services/fixtureService";
import competitionService from "../services/competitionService";

export default function FixtureManagement() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await fixtureService.getUpcomingLeagueCompetitions();
        console.log('Fetched competitions:', res);
        if (res && res.data && Array.isArray(res.data)) {
          setCompetitions(res.data);
        } else {
          setError('No valid data received from server.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Error fetching competitions.');
      } finally {
        setLoading(false); // This will run regardless of success or failure
      }
    };
  
    fetchCompetitions();
  }, []);

  const handleCreateFixtures = async (competitionId) => {
    try {
      setMessage("Creating fixtures...");
      setError(null);
      const response = await fixtureService.createFixtures(competitionId);
      setMessage(response.data.message || "Fixtures created successfully!");
    } catch (err) {
      // Extract the backend's error message (if available)
      const backendError = err.response?.data?.error || err.message;
      console.error("Fixture creation failed:", backendError);
      setError(backendError);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Fixture Management</h2>

      {message && (
        <div className="mb-4 text-sm text-white bg-blue-500 p-2 rounded shadow">{message}</div>
      )}

      {error && (
        <div className="mb-4 text-sm text-white bg-red-500 p-2 rounded shadow">{error}</div>
      )}

      {loading ? (
        <p>Loading competitions...</p>
      ) : competitions.length === 0 ? (
        <p className="text-gray-600">No eligible competitions available for fixture generation.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitions.map((comp) => (
            <div key={comp._id} className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-lg font-semibold">{comp.name}</h3>
              <p>Type: {comp.type}</p>
              <p>Status: {comp.status}</p>
              <p className="text-sm text-gray-500">
                Players: {comp.players?.length || 0}
              </p>

              <button
                onClick={() => handleCreateFixtures(comp._id)}
                className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded transition"
              >
                Create Fixtures
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}