import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { persistencePlugin } from './stores/persistence';
import { initializeApp } from './services/bootstrap';
import { useCoursesStore } from './stores/courses';
import { usePlayersStore } from './stores/players';
import { useTeamsStore } from './stores/teams';
import { useScoresStore } from './stores/scores';

const app = createApp(App);
const pinia = createPinia();
pinia.use(persistencePlugin);

app.use(pinia);
app.use(router);

function loadStoresFromApi() {
  const coursesStore = useCoursesStore();
  const playersStore = usePlayersStore();
  const teamsStore = useTeamsStore();
  const scoresStore = useScoresStore();
  return coursesStore.fetchCourses()
    .then(() => Promise.all([
      playersStore.fetchPlayers(),
      teamsStore.fetchTeams(),
      scoresStore.fetchScores()
    ]));
}

initializeApp()
  .then(() => loadStoresFromApi())
  .then(() => app.mount('#app'))
  .catch((error) => {
    console.error('Failed to initialize app:', error);
    window.__bootstrapError = error;
    app.mount('#app');
  });

