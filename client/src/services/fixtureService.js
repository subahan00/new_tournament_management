import axios from 'axios';
const BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Helper function
const getAuthToken = () => {
  let token = localStorage.getItem('authToken');
  if (!token) {
    token = sessionStorage.getItem('authToken');
  }
  return token;
};

export default {
  createLeagueFixtures: async (competitionId) => {
    try {
      const token = getAuthToken(); // ✅ FIXED
      const response = await axios.post(
        `${BASE_URL}/fixtures/create/${competitionId}`,
        {},
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

  createGroupStageFixtures: async (competitionId) => {
    try {
      console.log(' createGroupStageFixtures', competitionId);
      const token = getAuthToken(); // ✅ FIXED
      const response = await axios.post(
        `${BASE_URL}/fixtures/create-groupstage/${competitionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Group stage fixtures created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 500,
      };
    }
  },

  generateFixtures: async (competitionId) => {
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

  fetchFixturesByCompetition: async (competitionId) => {
    try {
      const response = await axios.get(`${BASE_URL}/fixtures/ko/competition/${competitionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      throw error;
    }
  },

  fetchCompetitions: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/fixtures/ko/competitions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching competitions:', error);
      throw error;
    }
  },

  updateKoFixtureResult: async (fixtureId, homeScore, awayScore) => {
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

  updateFixtureResult: async (fixtureId, { homeScore, awayScore }) => {
    try {
      const home = Number(homeScore);
      const away = Number(awayScore);

      if (isNaN(home) || isNaN(away)) {
        throw new Error('Scores must be numbers');
      }

      const token = getAuthToken(); // ✅ FIXED
      const response = await axios.put(
        `${BASE_URL}/fixtures/${fixtureId}/result`,
        { homeScore: home, awayScore: away },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;

    } catch (error) {
      console.error('Update Error:', {
        config: error.config,
        response: error.response?.data
      });
      
      const backendError = error.response?.data?.error;
      throw new Error(backendError || 'Failed to update result');
    }
  },

  revertFixtureResult: async (fixtureId) => {
    try {
      const response = await axios.put(`${BASE_URL}/fixtures/${fixtureId}/revert`);
      return response.data;
    } catch (error) {
      console.error('Error reverting fixture result:', error);
      throw error;
    }
  },

  advanceToNextRound: async (competitionId, currentRound) => {
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
    const token = getAuthToken(); // ✅ FIXED
    return axios.post(`${BASE_URL}/fixtures/${competitionId}/next-round`);
  },

  getCompetitionById: async (competitionId) => {
    try {
      const response = await axios.get(`${BASE_URL}/fixtures/competition-details/${competitionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching competition details:', error);
      throw error;
    }
  },

  updateCompetitionStatus: async (competitionId, status) => {
    try {
      const response = await axios.put(`${BASE_URL}/fixtures/competition/${competitionId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating competition status:', error);
      throw error;
    }
  },

  setCompetitionWinner: async (competitionId, playerId) => {
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

  getOngoingCompetitions: () => {
    return axios.get(`${BASE_URL}/fixtures/ongoing`);
  },

  getUpcomingCompetitions: () => {
    return axios.get(`${BASE_URL}/fixtures/upcoming`);
  },

  deleteFixtures: (competitionId) => {
    return axios.delete(`${BASE_URL}/fixtures/${competitionId}`);
  },

  getClanWarFixtures: async (competitionId) => {
    try {
      const response = await axios.get(`${BASE_URL}/competitions/${competitionId}/clan-war-fixtures`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch clan war fixtures'
      );
    }
  }
};