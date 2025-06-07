// UI store module
const state = {
  activeSection: 'administration',
  activeSidebarItem: 'players',
  isLoading: false,
  notifications: []
};

const getters = {
  activeSection: state => state.activeSection,
  activeSidebarItem: state => state.activeSidebarItem,
  isLoading: state => state.isLoading,
  notifications: state => state.notifications
};

const actions = {
  setActiveSection({ commit }, section) {
    commit('SET_ACTIVE_SECTION', section);
  },
  setActiveSidebarItem({ commit }, item) {
    commit('SET_ACTIVE_SIDEBAR_ITEM', item);
  },
  setLoading({ commit }, isLoading) {
    commit('SET_LOADING', isLoading);
  },
  addNotification({ commit }, notification) {
    const id = Date.now();
    commit('ADD_NOTIFICATION', { ...notification, id });
    
    // Auto-remove notifications after a delay
    setTimeout(() => {
      commit('REMOVE_NOTIFICATION', id);
    }, notification.timeout || 5000);
    
    return id;
  },
  removeNotification({ commit }, id) {
    commit('REMOVE_NOTIFICATION', id);
  }
};

const mutations = {
  SET_ACTIVE_SECTION(state, section) {
    state.activeSection = section;
  },
  SET_ACTIVE_SIDEBAR_ITEM(state, item) {
    state.activeSidebarItem = item;
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  ADD_NOTIFICATION(state, notification) {
    state.notifications.push(notification);
  },
  REMOVE_NOTIFICATION(state, id) {
    state.notifications = state.notifications.filter(n => n.id !== id);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};

