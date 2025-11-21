export function persistencePlugin({ store }) {
    const STORAGE_KEY = 'golf-competition-app';
    const dataModules = ['players', 'teams', 'scores', 'courses'];

    // Only persist data modules
    if (!dataModules.includes(store.$id)) return;

    // Load initial state
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
        try {
            const data = JSON.parse(savedState);
            // The old data structure has keys: players, teams, scores, courses
            // The store state has a property with the same name (e.g. players store has players property)
            // So we want to set store.players = data.players

            if (data[store.$id]) {
                store.$patch({
                    [store.$id]: data[store.$id]
                });
            }
        } catch (e) {
            console.error('Error loading data', e);
        }
    }

    // Subscribe to changes
    store.$subscribe((mutation, state) => {
        const currentSavedState = localStorage.getItem(STORAGE_KEY);
        let data = {};
        if (currentSavedState) {
            try {
                data = JSON.parse(currentSavedState);
            } catch (e) { }
        }

        // Update the specific module's data
        // state is the whole state object of the store (e.g. { players: [...] })
        // We want to save state.players to data.players
        data[store.$id] = state[store.$id];

        // Also update metadata
        data.appMetadata = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });
}
