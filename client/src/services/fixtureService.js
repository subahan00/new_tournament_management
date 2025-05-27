import axios from 'axios';
// const BASE_URL = 'http://localhost:5000/BASE_URL';
const BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;
export default {
  // Fixture Creation
  createLeagueFixtures: async (competitionId) => {
  try {
    const token = localStorage.getItem('token');  // or wherever you store it
    const response = await axios.post(
      `${BASE_URL}/fixtures/create/${competitionId}`,
      {}, // empty body if none
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'League fixtures created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
    };
  }
},

  

 generateFixtures : async (competitionId) => {
  try {
    const response = await axios.post(`${BASE_URL}/fixtures/ko/generate/${competitionId}`);
    return response.data;
  } catch (error) {
    console.error('Error generating fixtures:', error);
    throw error;
  }
},
getCompetitionFixtures: (competitionId) => {
    return axios.get(`${BASE_URL}/fixtures/competition/${competitionId}`);
  },
  // Fixture Management
 fetchFixturesByCompetition : async (competitionId) => {
  try {
    const response = await axios.get(`${BASE_URL}/fixtures/ko/competition/${competitionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    throw error;
  }
},

  fetchCompetitions : async () => {
  try {
    const response = await axios.get(`${BASE_URL}/fixtures/ko/competitions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
},
updateKoFixtureResult : async (fixtureId, homeScore, awayScore) => {
  try {
    const response = await axios.put(`${BASE_URL}/fixtures/ko/${fixtureId}/result`, {
      homeScore,
      awayScore
    });
    return response.data;
  } catch (error) {
    console.error('Error updating fixture result:', error);
    throw error;
  }
},
// fixtureService.js
 updateFixtureResult : async (fixtureId, { homeScore, awayScore }) => {
  try {
    // Convert to numbers first
    const home = Number(homeScore);
    const away = Number(awayScore);

    if (isNaN(home) || isNaN(away)) {
      throw new Error('Scores must be numbers');
    }

    const response = await axios.put(
      `${BASE_URL}/fixtures/${fixtureId}/result`,
      { homeScore: home, awayScore: away },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error('Update Error:', {
      config: error.config,
      response: error.response?.data
    });
    
    // Enhance error message
    const backendError = error.response?.data?.error;
    throw new Error(backendError || 'Failed to update result');
  }
},
 advanceToNextRound : async (competitionId, currentRound) => {
  try {
    const response = await axios.post(`${BASE_URL}/fixtures/advance-round`, {
      competitionId,
      currentRound
    });
    return response.data;
  } catch (error) {
    console.error('Error advancing to next round:', error);
    throw error;
  }
},
  generateNextRound: (competitionId) => {
      const token = localStorage.getItem('token'); // or your auth storage

    return axios.post(`${BASE_URL}/fixtures/${competitionId}/next-round`);
  },
 getCompetitionById : async (competitionId) => {
  try {
    const response = await axios.get(`${BASE_URL}/fixtures/competition-details/${competitionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching competition details:', error);
    throw error;
  }
} ,
 updateCompetitionStatus : async (competitionId, status) => {
  try {
    const response = await axios.put(`${BASE_URL}/fixtures/competition/${competitionId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating competition status:', error);
    throw error;
  }
},
 setCompetitionWinner : async (competitionId, playerId) => {
  try {
    const response = await axios.put(`${BASE_URL}/fixtures/competition/${competitionId}/winner`, {
      winnerId: playerId
    });
    return response.data;
  } catch (error) {
    console.error('Error setting competition winner:', error);
    throw error;
  }
},

  // Competition Status
  getOngoingCompetitions: () => {
    return axios.get(`${BASE_URL}/fixtures/ongoing`);
  },
  getUpcomingCompetitions: () => {
    return axios.get(`${BASE_URL}/fixtures/upcoming`);
  },
  // Additional Methods
  deleteFixtures: (competitionId) => {
    return axios.delete(`${BASE_URL}/fixtures/${competitionId}`);
  }
};