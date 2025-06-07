/**
 * Utility functions for the Golf Competition App
 */

/**
 * Converts a talent rating to a numeric value
 * @param {string} rating - The talent rating (A, B, C, or D)
 * @returns {number} The numeric value (A=4, B=3, C=2, D=1)
 */
export const talentRatingToPoints = (rating) => {
  const points = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
  return points[rating] || 0;
};

/**
 * Formats a currency value
 * @param {number} value - The value to format
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value || 0);
};

/**
 * Formats a date string
 * @param {string} dateString - The ISO date string
 * @returns {string} The formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Generates a team name
 * @param {number} index - The team index
 * @returns {string} A generated team name
 */
export const generateTeamName = (index) => {
  const adjectives = [
    'Mighty', 'Royal', 'Golden', 'Silver', 'Elite',
    'Premier', 'Dynamic', 'Classic', 'Grand', 'Supreme'
  ];
  
  const nouns = [
    'Eagles', 'Tigers', 'Lions', 'Bears', 'Wolves',
    'Hawks', 'Falcons', 'Panthers', 'Jaguars', 'Sharks'
  ];
  
  const adjIndex = index % adjectives.length;
  const nounIndex = Math.floor(index / adjectives.length) % nouns.length;
  
  return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
};

/**
 * Validates a player object
 * @param {Object} player - The player object to validate
 * @returns {Object} An object with isValid and errors properties
 */
export const validatePlayer = (player) => {
  const errors = {};
  
  if (!player.name || player.name.trim() === '') {
    errors.name = 'Name is required';
  }
  
  if (!player.talentRating || !['A', 'B', 'C', 'D'].includes(player.talentRating)) {
    errors.talentRating = 'Valid talent rating (A, B, C, or D) is required';
  }
  
  if (player.entryFee !== undefined && isNaN(parseFloat(player.entryFee))) {
    errors.entryFee = 'Entry fee must be a valid number';
  }
  
  if (player.winnings !== undefined && isNaN(parseFloat(player.winnings))) {
    errors.winnings = 'Winnings must be a valid number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates a score value
 * @param {number|string} score - The score to validate
 * @returns {Object} An object with isValid and error properties
 */
export const validateScore = (score) => {
  const scoreValue = parseInt(score);
  
  if (isNaN(scoreValue)) {
    return {
      isValid: false,
      error: 'Score must be a valid number'
    };
  }
  
  if (scoreValue < 18 || scoreValue > 150) {
    return {
      isValid: false,
      error: 'Score must be between 18 and 150'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Calculates team balance metrics
 * @param {Array} teams - Array of team objects
 * @param {Array} players - Array of player objects
 * @returns {Array} Array of team balance metrics
 */
export const calculateTeamBalanceMetrics = (teams, players) => {
  if (!teams || !players) return [];
  
  return teams.map(team => {
    const teamPlayers = players.filter(player => player.teamId === team.id);
    
    // Calculate talent distribution
    const talentCounts = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
    teamPlayers.forEach(player => {
      talentCounts[player.talentRating]++;
    });
    
    // Calculate total talent points
    const totalTalentPoints = teamPlayers.reduce((total, player) => {
      return total + talentRatingToPoints(player.talentRating);
    }, 0);
    
    // Calculate average talent rating
    const avgTalentRating = teamPlayers.length > 0 
      ? totalTalentPoints / teamPlayers.length 
      : 0;
    
    return {
      teamId: team.id,
      teamName: team.name,
      playerCount: teamPlayers.length,
      talentCounts,
      totalTalentPoints,
      avgTalentRating
    };
  });
};

/**
 * Exports data to a JSON file
 * @param {Object} data - The data to export
 * @returns {string} The JSON string
 */
export const exportDataToJson = (data) => {
  return JSON.stringify(data, null, 2);
};

/**
 * Parses imported JSON data
 * @param {string} jsonString - The JSON string to parse
 * @returns {Object} The parsed data object or null if invalid
 */
export const parseImportedJson = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate the data structure
    if (!data.players || !Array.isArray(data.players)) {
      throw new Error('Invalid data format: players array is missing');
    }
    
    if (!data.teams || !Array.isArray(data.teams)) {
      throw new Error('Invalid data format: teams array is missing');
    }
    
    if (!data.scores || !Array.isArray(data.scores)) {
      throw new Error('Invalid data format: scores array is missing');
    }
    
    if (!data.courses || !Array.isArray(data.courses)) {
      throw new Error('Invalid data format: courses array is missing');
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing imported data:', error);
    return null;
  }
};

