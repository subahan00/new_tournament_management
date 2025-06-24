import { useEffect, useState } from "react";
import fixtureService from "../services/fixtureService";

export default function FixtureManagement() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await fixtureService.getUpcomingCompetitions();
        const receivedData = response?.data?.data || response?.data || [];
        if (Array.isArray(receivedData)) {
          setCompetitions(receivedData);
        } else {
          setError("Invalid competition data format");
          setCompetitions([]);
        }
      } catch (err) {
        setError(err.message);
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  const handleCreateFixtures = async (competition) => {
    try {
      setMessage("Creating fixtures...");
      setError(null);

      let response;
      console.log("competition",competition);
      if (competition.type === "LEAGUE") {
        response = await fixtureService.createLeagueFixtures(competition._id);
      } else if (competition.type === "KO_REGULAR") {
        response = await fixtureService.generateFixtures(competition._id);
      } else if (competition.type==="GROUP_STAGE"){
response=await fixtureService.createGroupStageFixtures(competition._id);

}
else {
        setError("Unsupported competition type");
        return;
      }

      setMessage(
        response?.data?.message ||
          response?.message ||
          "Fixtures created successfully!"
      );

      // Refresh competition list
      const updated = await fixtureService.getUpcomingCompetitions();
      const updatedData = updated?.data?.data || updated?.data || [];

      if (Array.isArray(updatedData)) {
        setCompetitions(updatedData);
      } else {
        setCompetitions([]);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Unknown error occurred";
      console.error("Fixture creation failed:", errorMessage);
      setError(errorMessage);
    }
  };

  const safeCompetitions = Array.isArray(competitions) ? competitions : [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Fixture Management</h2>

      {message && (
        <div className="mb-4 text-sm text-white bg-blue-500 p-2 rounded shadow">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-white bg-red-500 p-2 rounded shadow">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading competitions...</p>
      ) : safeCompetitions.length === 0 ? (
        <p className="text-gray-600">
          No eligible competitions available for fixture generation.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeCompetitions.map((comp) => (
            <div
              key={comp._id}
              className="bg-white p-4 rounded-lg shadow border"
            >
              <h3 className="text-lg font-semibold">{comp.name}</h3>
              <p>Type: {comp.type}</p>
              <p>Status: {comp.status}</p>
              <p className="text-sm text-gray-500">
                Players: {comp.players?.length || 0}
              </p>

              <button
                onClick={() => handleCreateFixtures(comp)}
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
