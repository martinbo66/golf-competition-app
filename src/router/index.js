import Vue from 'vue';
import VueRouter from 'vue-router';

// Import views
import PlayerManagement from '@/views/PlayerManagement.vue';
import TeamManagement from '@/views/TeamManagement.vue';
import CourseScoring from '@/views/CourseScoring.vue';
import Leaderboards from '@/views/Leaderboards.vue';

Vue.use(VueRouter);

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
    path: '/scoring/:courseName',
    name: 'CourseScoring',
    component: CourseScoring,
    props: true
  },
  {
    path: '/leaderboards',
    name: 'Leaderboards',
    component: Leaderboards
  },
  {
    path: '*',
    redirect: '/admin/players'
  }
];

const router = new VueRouter({
  mode: 'hash', // Changed from 'history' to 'hash' for better static hosting compatibility
  base: process.env.BASE_URL,
  routes
});

// Navigation guard to update active section and sidebar item
router.beforeEach((to, from, next) => {
  const store = router.app.$store;
  
  // Set active section based on route
  if (to.path.startsWith('/admin')) {
    store.dispatch('ui/setActiveSection', 'administration');
  } else if (to.path.startsWith('/scoring')) {
    store.dispatch('ui/setActiveSection', 'scoring');
  } else if (to.path.startsWith('/leaderboards')) {
    store.dispatch('ui/setActiveSection', 'leaderboards');
  }
  
  // Set active sidebar item based on route
  if (to.path === '/admin/players') {
    store.dispatch('ui/setActiveSidebarItem', 'players');
  } else if (to.path === '/admin/teams') {
    store.dispatch('ui/setActiveSidebarItem', 'teams');
  } else if (to.path.startsWith('/scoring/')) {
    const courseName = to.params.courseName;
    store.dispatch('ui/setActiveSidebarItem', courseName);
  } else if (to.path === '/leaderboards') {
    store.dispatch('ui/setActiveSidebarItem', 'leaderboards');
  }
  
  next();
});

export default router;

