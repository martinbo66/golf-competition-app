import ApiService from './ApiService';
import { useOrganizationsStore } from '@/stores/organizations';
import { useCompetitionsStore } from '@/stores/competitions';
import { useCoursesStore } from '@/stores/courses';
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
 * Bootstrap the app: select the default org (auto-selects best competition and
 * loads all data), handle edge cases (no competitions, no rounds), and load
 * the global course pool.
 * @throws {Error} When the backend is unavailable
 */
export async function initializeApp() {
  const uiStore = useUiStore();
  uiStore.setLoading(true);

  try {
    // 1. Load orgs and activate the default one.
    //    setActiveOrganization fetches competitions and auto-selects the best
    //    one via setActiveCompetition, which loads courses/players/teams/scores.
    const orgsStore = useOrganizationsStore();
    await orgsStore.fetchOrganizations();

    const defaultOrg = orgsStore.organizations.find(o => o.slug === 'default')
      || orgsStore.organizations[0];
    if (defaultOrg) {
      await orgsStore.setActiveOrganization(defaultOrg);
    }

    // 2. If the org had no competitions, create a starter one.
    const competitionsStore = useCompetitionsStore();
    if (!competitionsStore.activeCompetition) {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      try {
        await competitionsStore.createCompetition({
          name: 'Golf Competition',
          startDate: today,
          endDate,
          location: null
        });
      } catch (err) {
        NotificationService.error(`Failed to create a default competition: ${err.message || err}`);
      }
    }

    // 3. Ensure the active competition has at least one round (first-run setup).
    if (competitionsStore.activeCompetition) {
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

    // 4. Load the global course pool (used in course management / round selection).
    //    Competition-specific data was already loaded by setActiveCompetition.
    const coursesStore = useCoursesStore();
    try {
      await coursesStore.fetchAllCourses();
    } catch (err) {
      NotificationService.error('Some data failed to load. Please refresh.');
    }

  } finally {
    uiStore.setLoading(false);
  }
}
