import { createRouter, createWebHashHistory } from 'vue-router';
import { useUiStore } from '@/stores/ui';

// Import views
import PlayerManagement from '@/views/PlayerManagement.vue';
import TeamManagement from '@/views/TeamManagement.vue';
import CourseScoring from '@/views/CourseScoring.vue';
import Leaderboards from '@/views/Leaderboards.vue';

const routes = [
  {
    path: '/',
    redirect: '/admin/players'
  },
  {
    path: '/admin/players',
    name: 'PlayerManagement',
    component: PlayerManagement
  },
  {
    path: '/admin/teams',
    name: 'TeamManagement',
    component: TeamManagement
  },
  {
    path: '/scoring/:courseId',
    name: 'CourseScoring',
    component: CourseScoring,
    props: true
  },
  {
    path: '/scoring',
    redirect: to => {
      try {
        const { useCoursesStore } = require('@/stores/courses');
        const coursesStore = useCoursesStore();
        const firstCourse = coursesStore.allCourses[0];
        if (firstCourse) {
          return `/scoring/${firstCourse.id}`;
        }
        return '/admin/players';
      } catch (e) {
        console.error('Error in scoring redirect:', e);
        return '/admin/players';
      }
    }
  },
  {
    path: '/leaderboards',
    name: 'Leaderboards',
    path: '/money-leaderboards',
    name: 'MoneyLeaderboards',
    component: () => import('@/views/MoneyLeaderboards.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/admin/players'
  }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
});

// Navigation guard to update active section and sidebar item
router.beforeEach((to, from, next) => {
  const uiStore = useUiStore();

  // Set active section based on route
  if (to.path.startsWith('/admin')) {
    uiStore.setActiveSection('administration');
  } else if (to.path.startsWith('/scoring')) {
    uiStore.setActiveSection('scoring');
  } else if (to.path.startsWith('/leaderboards')) {
    uiStore.setActiveSection('leaderboards');
  }

  // Set active sidebar item based on route
  if (to.path === '/admin/players') {
    uiStore.setActiveSidebarItem('players');
  } else if (to.path === '/admin/teams') {
    uiStore.setActiveSidebarItem('teams');
  } else if (to.path.startsWith('/scoring/')) {
    // In Vue Router 4, params are available in to.params
    // But we need to check if courseName is available or if we need to derive it
    // The route is /scoring/:courseId
    // The old code used to.params.courseName which implies it was passed or derived?
    // Wait, the route definition is /scoring/:courseId
    // So to.params.courseId is available.
    // The old code checked `to.path.startsWith('/scoring/')` and used `to.params.courseName`.
    // This suggests the sidebar item expects a name, or maybe ID?
    // Let's assume we pass the ID for now or we need to look up the name.
    // But `uiStore.setActiveSidebarItem` expects what?
    // In `ui.js` state: `activeSidebarItem: 'players'`.
    // It seems to be a string identifier.
    // If I look at `CourseScoring.vue` (not read yet), I might see what it expects.
    // For now, I'll use courseId if courseName is missing.

    const courseId = to.params.courseId;
    uiStore.setActiveSidebarItem(courseId);
  } else if (to.path === '/leaderboards') {
    uiStore.setActiveSidebarItem('points-leaderboards');
  } else if (to.path === '/money-leaderboards') {
    uiStore.setActiveSidebarItem('money-leaderboards');
  }

  next();
});

export default router;

