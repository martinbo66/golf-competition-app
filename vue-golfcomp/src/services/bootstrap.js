import ApiService from './ApiService';

// Course IDs must match vue-golfcomp/src/stores/courses.js
const COURSE_IDS = [
  '071aaf93-773e-49d0-935e-4b825e25670f', // Parkland
  '2b81e674-816a-42ea-b524-54a96bfb2b14', // Heathland
  '38a5c806-7f44-4ebb-9472-6ec79431c5ff', // Heritage Club
  'd3d8aa11-5320-477b-9602-6501dd63b186'  // Moorland
];

/**
 * Find or create the default competition and ensure 4 rounds exist.
 * Idempotent: safe to run multiple times.
 * @throws {Error} When the API is unavailable or request fails
 */
export async function initializeApp() {
  // 1. Find or create competition
  const competitions = await ApiService.get('/competitions');

  let competitionId;
  if (competitions && competitions.length > 0) {
    competitionId = competitions[0].id;
  } else {
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const newComp = await ApiService.post('/competitions', {
      name: 'Golf Competition',
      startDate: today,
      endDate,
      location: null
    });
    competitionId = newComp.id;
  }

  ApiService.competitionId = competitionId;

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
}
