import teamsModule from '../src/store/modules/teams.js';
import playersModule from '../src/store/modules/players.js';

// Simple mock of Vuex functionality for testing
class MockStore {
  constructor(modules) {
    this.modules = modules;
    this.state = {};
    this.getters = {};
    this.actions = {};
    
    // Initialize module states (each module exports its state as a function or object)
    Object.keys(modules).forEach(key => {
      const module = modules[key];
      // Handle state as function or object
      this.state[key] = typeof module.state === 'function' ? module.state() : { ...module.state };
      
      // Bind getters (they receive the module state as first param)
      Object.keys(module.getters).forEach(getterKey => {
        this.getters[`${key}/${getterKey}`] = (moduleState = this.state[key]) => module.getters[getterKey](moduleState);
      });
      
      // Bind actions
      Object.keys(module.actions).forEach(actionKey => {
        this.actions[`${key}/${actionKey}`] = module.actions[actionKey];
      });
    });
  }

  dispatch(actionPath, payload, options = {}) {
    const action = this.actions[actionPath];
    if (!action) {
      throw new Error(`Action ${actionPath} not found`);
    }
    
    const [moduleName] = actionPath.split('/');
    const context = {
      state: this.state[moduleName],
      commit: (mutationPath, data) => {
        // If mutation path doesn't include module, add it
        if (!mutationPath.includes('/')) {
          mutationPath = `${moduleName}/${mutationPath}`;
        }
        return this.commit(mutationPath, data);
      },
      dispatch: (path, data, opts = {}) => {
        // Handle root dispatch for cross-module calls
        if (opts.root) {
          return this.dispatch(path, data, opts);
        } else {
          // Local dispatch within the module
          return this.dispatch(`${moduleName}/${path}`, data, opts);
        }
      },
      rootGetters: this.getAllGetterValues()
    };
    
    return action(context, payload);
  }

  commit(mutationPath, payload) {
    const [moduleName, mutationName] = mutationPath.split('/');
    const module = this.modules[moduleName];
    if (module && module.mutations && module.mutations[mutationName]) {
      module.mutations[mutationName](this.state[moduleName], payload);
    }
  }

  getAllGetterValues() {
    const result = {};
    Object.keys(this.getters).forEach(key => {
      const [moduleName] = key.split('/');
      result[key] = this.getters[key](this.state[moduleName]);
    });
    return result;
  }

  getGetter(getterPath) {
    const [moduleName] = getterPath.split('/');
    return this.getters[getterPath] ? this.getters[getterPath](this.state[moduleName]) : undefined;
  }
}

describe('Teams Module - Generate Teams and Player Assignment', () => {
  let store;

  beforeEach(() => {
    store = new MockStore({
      teams: teamsModule,
      players: playersModule
    });
  });

  test('full generateTeams workflow', async () => {
    // Setup test data - create some players with different talent ratings
    const testPlayers = [
      { name: 'Player A1', talentRating: 'A', entryFee: 100 },
      { name: 'Player A2', talentRating: 'A', entryFee: 100 },
      { name: 'Player B1', talentRating: 'B', entryFee: 100 },
      { name: 'Player B2', talentRating: 'B', entryFee: 100 },
      { name: 'Player C1', talentRating: 'C', entryFee: 100 },
      { name: 'Player C2', talentRating: 'C', entryFee: 100 },
      { name: 'Player D1', talentRating: 'D', entryFee: 100 },
      { name: 'Player D2', talentRating: 'D', entryFee: 100 }
    ];

    // Add players to the store
    for (const player of testPlayers) {
      await store.dispatch('players/addPlayer', player);
    }

    // Verify players were added
    const allPlayers = store.getGetter('players/allPlayers');
    expect(allPlayers).toHaveLength(8);

    // Generate 4 teams
    const teamIds = await store.dispatch('teams/generateTeams', 4);

    // Verify teams were created
    expect(teamIds).toHaveLength(4);
    expect(teamIds.every(id => typeof id === 'string')).toBe(true); // All IDs should be strings, not Promises
    
    const allTeams = store.getGetter('teams/allTeams');
    expect(allTeams).toHaveLength(4);

    // Check that all players have been assigned to teams
    const playersAfterAssignment = store.getGetter('players/allPlayers');
    const unassignedPlayers = store.getGetter('players/unassignedPlayers');

    // Assertions
    expect(unassignedPlayers).toHaveLength(0); // All players should be assigned
    
    // Check that players are distributed across teams
    for (const teamId of teamIds) {
      const playersByTeamGetter = store.getters['players/playersByTeam'];
      const teamPlayers = playersByTeamGetter(store.state.players)(teamId);
      expect(teamPlayers.length).toBeGreaterThan(0); // Each team should have at least one player
    }

    // Check talent distribution (higher rated players should be distributed first)
    const teamPlayerCounts = teamIds.map(teamId => {
      const playersByTeamGetter = store.getters['players/playersByTeam'];
      return playersByTeamGetter(store.state.players)(teamId).length;
    });
    const maxPlayers = Math.max(...teamPlayerCounts);
    const minPlayers = Math.min(...teamPlayerCounts);
    // With 8 players and 4 teams, the distribution should be 2,2,2,2 or 3,2,2,1 depending on the algorithm
    expect(maxPlayers - minPlayers).toBeLessThanOrEqual(2); // Teams should be reasonably balanced
  });

  test('assignPlayersToTeams action directly', async () => {
    // Test the assignPlayersToTeams action in isolation
    const testPlayers = [
      { id: '1', name: 'Player1', talentRating: 'A' },
      { id: '2', name: 'Player2', talentRating: 'B' },
      { id: '3', name: 'Player3', talentRating: 'C' },
      { id: '4', name: 'Player4', talentRating: 'D' }
    ];

    // Add players to store manually
    testPlayers.forEach(player => {
      store.commit('players/ADD_PLAYER', { 
        ...player, 
        teamId: null, 
        entryFee: 0,
        winnings: 0,
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      });
    });

    // Create teams manually
    const teamIds = ['team1', 'team2'];
    teamIds.forEach(id => {
      store.commit('teams/ADD_TEAM', { 
        id, 
        name: `Team ${id}`, 
        logoUrl: null,
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      });
    });

    // Call assignPlayersToTeams directly
    await store.dispatch('teams/assignPlayersToTeams', { 
      players: testPlayers, 
      teamIds 
    });

    // Check assignments
    const finalPlayers = store.getGetter('players/allPlayers');

    // All players should be assigned
    const unassigned = finalPlayers.filter(p => !p.teamId);
    expect(unassigned).toHaveLength(0);
  });

  test('test players/assignPlayerToTeam action directly', async () => {
    // Add a player
    store.commit('players/ADD_PLAYER', { 
      id: 'test1',
      name: 'TestPlayer', 
      talentRating: 'A',
      teamId: null, 
      entryFee: 0,
      winnings: 0,
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    });

    // Try to assign the player to a team
    await store.dispatch('players/assignPlayerToTeam', { 
      playerId: 'test1', 
      teamId: 'team1' 
    });

    // Check if the player was assigned
    const player = store.getGetter('players/playerById')('test1');
    expect(player.teamId).toBe('team1');
  });
}); 