import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import competition from '../services/competitionService';



const CompetitionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [originalCompetition, setOriginalCompetition] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compData, playersData] = await Promise.all([
          getCompetition(id),
          getAllPlayers()
        ]);
        
        // Store original values with player IDs
        setOriginalCompetition({
          ...compData,
          players: compData.players.map(p => p._id)
        });
        
        setCompetition({
          ...compData,
          players: compData.players.map(p => p._id)
        });
        
        setAllPlayers(playersData);
      } catch (error) {
        console.error('Failed to load data:', error);
        navigate('/competitions', { state: { error: 'Failed to load competition' } });
      }
    };

    fetchData();
  }, [id]);

  const handlePlayerChange = (selectedPlayerIds) => {
    setCompetition(prev => ({
      ...prev,
      players: selectedPlayerIds
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Update basic competition info
      const updatedCompetition = await updateCompetition(id, {
        name: competition.name,
        status: competition.status
      });

      // 2. Calculate and update player changes
      const originalPlayers = originalCompetition.players;
      const currentPlayers = competition.players;
      
      const addedPlayers = currentPlayers.filter(id => !originalPlayers.includes(id));
      const removedPlayers = originalPlayers.filter(id => !currentPlayers.includes(id));

      if (addedPlayers.length > 0 || removedPlayers.length > 0) {
        await updateCompetitionPlayers(id, {
          addedPlayers,
          removedPlayers
        });
      }

      navigate(`/competitions/${id}`, { 
        state: { success: 'Competition updated successfully!' } 
      });
    } catch (error) {
      console.error('Update failed:', error);
      setCompetition(originalCompetition);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!competition) return <div className="p-4 text-lg">Loading competition data...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Competition</h1>
      
      <Form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Form.Input
            label="Competition Name"
            value={competition.name}
            onChange={(e) => setCompetition({ ...competition, name: e.target.value })}
            required
          />

          <Form.Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' },
              { value: 'upcoming', label: 'Upcoming' }
            ]}
            value={competition.status}
            onChange={(e) => setCompetition({ ...competition, status: e.target.value })}
          />

          <div className="border-t pt-4">
            <PlayerSelector
              label="Participants"
              players={allPlayers}
              selectedIds={competition.players}
              onChange={handlePlayerChange}
              maxSelection={competition.numberOfPlayers}
            />
            <p className="text-sm text-gray-500 mt-2">
              {competition.players.length} / {competition.numberOfPlayers} players selected
            </p>
          </div>

          <div className="flex gap-4 mt-8">
            <Button 
              type="submit" 
              variant="primary"
              disabled={isSubmitting}
              className="w-32"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button 
              onClick={() => navigate(-1)}
              variant="secondary"
              className="w-32"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default CompetitionEdit;