import { v4 as uuidv4 } from 'uuid';

// Courses store module
const state = {
  courses: [
    { id: uuidv4(), name: 'Parkland', order: 1 },
    { id: uuidv4(), name: 'Heathland', order: 2 },
    { id: uuidv4(), name: 'Heritage Club', order: 3 },
    { id: uuidv4(), name: 'Moorland', order: 4 }
  ]
};

const getters = {
  allCourses: state => state.courses,
  courseById: state => id => state.courses.find(course => course.id === id),
  courseByName: state => name => state.courses.find(course => course.name.toLowerCase() === name.toLowerCase()),
  coursesSorted: state => [...state.courses].sort((a, b) => a.order - b.order)
};

const actions = {
  // Courses are predefined, so we only need basic actions
  fetchCourses() {
    // In a real app, this might be an API call
    // For now, we use the predefined courses
  }
};

const mutations = {
  SET_COURSES(state, courses) {
    state.courses = courses;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};

