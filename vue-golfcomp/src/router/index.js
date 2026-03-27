import { createRouter, createWebHashHistory } from 'vue-router';
import { useUiStore } from '@/stores/ui';

// Import views
import PlayerManagement from '@/views/PlayerManagement.vue';
import TeamManagement from '@/views/TeamManagement.vue';
import CourseScoring from '@/views/CourseScoring.vue';

const routes = [
  {
    path: '/',
    redirect: '/admin/competitions'
  },
  {
    path: '/admin/organizations',
    name: 'OrganizationManagement',
    component: () => import('@/views/OrganizationManagement.vue')
  },
  {
    path: '/admin/competitions',
    name: 'CompetitionManagement',
    component: () => import('@/views/CompetitionManagement.vue')
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
    path: '/admin/courses',
    name: 'CourseManagement',
    component: () => import('@/views/CourseManagement.vue')
  },
  {
    path: '/scoring/:roundId',
    name: 'CourseScoring',
    component: CourseScoring,
    props: true
  },
  {
    path: '/scoring',
    redirect: () => {
      try {
        const { useCoursesStore } = require('@/stores/courses');
        const coursesStore = useCoursesStore();
        const firstCourse = coursesStore.allCourses[0];
        if (firstCourse) {
          return `/scoring/${firstCourse.roundId || firstCourse.id}`;
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
    component: () => import('@/views/Leaderboards.vue')
  },
  {
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
  if (to.path === '/admin/organizations') {
    uiStore.setActiveSidebarItem('organizations');
  } else if (to.path === '/admin/competitions') {
    uiStore.setActiveSidebarItem('competitions');
  } else if (to.path === '/admin/players') {
    uiStore.setActiveSidebarItem('players');
  } else if (to.path === '/admin/teams') {
    uiStore.setActiveSidebarItem('teams');
  } else if (to.path === '/admin/courses') {
    uiStore.setActiveSidebarItem('courses');
  } else if (to.path.startsWith('/scoring/')) {
    uiStore.setActiveSidebarItem(to.params.roundId);
  } else if (to.path === '/leaderboards') {
    uiStore.setActiveSidebarItem('points-leaderboards');
  } else if (to.path === '/money-leaderboards') {
    uiStore.setActiveSidebarItem('money-leaderboards');
  }

  next();
});

export default router;

