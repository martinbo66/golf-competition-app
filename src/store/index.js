import Vue from 'vue';
import Vuex from 'vuex';

// Import modules
import players from './modules/players';
import teams from './modules/teams';
import scores from './modules/scores';
import courses from './modules/courses';
import ui from './modules/ui';

Vue.use(Vuex);

// Create persistence plugin
const STORAGE_KEY = 'golf-competition-app';

const persistencePlugin = store => {
  // Initialize store from localStorage
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (savedState) {
    try {
      const data = JSON.parse(savedState);
      
      // Set initial state from saved data
      if (data.players) store.commit('players/SET_PLAYERS', data.players);
      if (data.teams) store.commit('teams/SET_TEAMS', data.teams);
      if (data.scores) store.commit('scores/SET_SCORES', data.scores);
      if (data.courses) store.commit('courses/SET_COURSES', data.courses);
    } catch (e) {
      console.error('Error loading data from localStorage:', e);
    }
  }
  
  // Subscribe to store mutations to save state
  store.subscribe((mutation, state) => {
    // Only save when data-related mutations occur
    const dataModules = ['players', 'teams', 'scores', 'courses'];
    const modulePrefix = mutation.type.split('/')[0];
    
    if (dataModules.includes(modulePrefix)) {
      const dataToSave = {
        players: state.players.players,
        teams: state.teams.teams,
        scores: state.scores.scores,
        courses: state.courses.courses,
        appMetadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString()
        }
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  });
};

export default new Vuex.Store({
  modules: {
    players,
    teams,
    scores,
    courses,
    ui
  },
  plugins: [persistencePlugin]
});

