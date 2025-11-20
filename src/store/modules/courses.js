// Courses store module
const state = {
  courses: [
    { id: '071aaf93-773e-49d0-935e-4b825e25670f', name: 'Parkland', order: 1 },
    { id: '2b81e674-816a-42ea-b524-54a96bfb2b14', name: 'Heathland', order: 2 },
    { id: '38a5c806-7f44-4ebb-9472-6ec79431c5ff', name: 'Heritage Club', order: 3 },
    { id: 'd3d8aa11-5320-477b-9602-6501dd63b186', name: 'Moorland', order: 4 }
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

