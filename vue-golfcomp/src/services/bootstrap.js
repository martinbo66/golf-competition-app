import ApiService from './ApiService';
import { useCompetitionsStore } from '@/stores/competitions';
import { useCoursesStore } from '@/stores/courses';
import { usePlayersStore } from '@/stores/players';
import { useTeamsStore } from '@/stores/teams';
import { useScoresStore } from '@/stores/scores';
import { useUiStore } from '@/stores/ui';
import NotificationService from './NotificationService';

// Course IDs must match vue-golfcomp/src/stores/courses.js
const COURSE_IDS = [
  '071aaf93-773e-49d0-935e-4b825e25670f', // Parkland
  '2b81e674-816a-42ea-b524-54a96bfb2b14', // Heathland
  '38a5c806-7f44-4ebb-9472-6ec79431c5ff', // Heritage Club
  'd3d8aa11-5320-477b-9602-6501dd63b186'  // Moorland
];

/**
 * Find or create the default competition, ensure 4 rounds exist, then load all
 * store data from the API. Idempotent: safe to run multiple times.
 * @throws {Error} When the backend is unavailable or competition bootstrap fails
 */
export async function initializeApp() {
  const uiStore = useUiStore();
  uiStore.setLoading(true);

  try {
    // 1. Find or create competition
    const competitionsStore = useCompetitionsStore();
    await competitionsStore.fetchCompetitions();

    let competition;
    if (competitionsStore.competitions.length > 0) {
      competition = competitionsStore.competitions[0];
    } else {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      competition = await competitionsStore.createCompetition({
        name: 'Golf Competition',
        startDate: today,
        endDate,
        location: null
      });
    }

    competitionsStore.activeCompetition = competition;
    ApiService.competitionId = competition.id;

    // 2. Ensure rounds exist (one per course)
    const rounds = await ApiService.get(ApiService.roundsUrl());
    if (!rounds || rounds.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      for (let i = 0; i < COURSE_IDS.length; i++) {
        await ApiService.post(ApiService.roundsUrl(), {
          courseId: COURSE_IDS[i],
          playDate: today,
          roundNumber: i + 1
        });
      }
    }

    // 3. Load all data from API in dependency order
    const coursesStore = useCoursesStore();
    const playersStore = usePlayersStore();
    const teamsStore = useTeamsStore();
    const scoresStore = useScoresStore();

    // Courses must load first — scores need the roundId mapping
    await coursesStore.fetchCourses();

    try {
      await Promise.all([
        playersStore.fetchPlayers(),
        teamsStore.fetchTeams()
      ]);
      await scoresStore.fetchScores(); // After courses (needs roundId mapping)
    } catch (dataError) {
      NotificationService.error('Some data failed to load. Please refresh.');
    }

  } finally {
    uiStore.setLoading(false);
  }
}
