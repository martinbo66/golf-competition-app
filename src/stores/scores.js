import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { usePlayersStore } from './players';
import { useTeamsStore } from './teams';
import { useCoursesStore } from './courses';

export const useScoresStore = defineStore('scores', {
    state: () => ({
        scores: []
    }),

    getters: {
        allScores: (state) => state.scores,
        scoresByPlayer: (state) => (playerId) => state.scores.filter(score => score.playerId === playerId),
        scoresByCourse: (state) => (courseId) => state.scores.filter(score => score.courseId === courseId),
        scoreByPlayerAndCourse: (state) => (playerId, courseId) => {
            return state.scores.find(score => score.playerId === playerId && score.courseId === courseId);
        },
        playerTotalScore: (state) => (playerId) => {
            return state.scores
                .filter(score => score.playerId === playerId)
                .reduce((total, score) => total + score.value, 0);
        },
        teamTotalScore: (state) => (teamId) => {
            const playersStore = usePlayersStore();
            const teamPlayers = playersStore.playersByTeam(teamId);
            return teamPlayers.reduce((total, player) => {
                // We need to call the getter function
                const pTotal = state.scores
                    .filter(score => score.playerId === player.id)
                    .reduce((t, s) => t + s.value, 0);
                return total + pTotal;
            }, 0);
        },
        playerLeaderboard: (state) => {
            const playersStore = usePlayersStore();
            const coursesStore = useCoursesStore();
            const teamsStore = useTeamsStore();

            const players = playersStore.allPlayers;
            const courses = coursesStore.allCourses;

            return players.map(player => {
                const courseScores = {};
                courses.forEach(course => {
                    const score = state.scores.find(s => s.playerId === player.id && s.courseId === course.id);
                    courseScores[course.name] = score ? score.value : null;
                });

                const totalScore = state.scores
                    .filter(score => score.playerId === player.id)
                    .reduce((total, score) => total + score.value, 0);

                const team = player.teamId ? teamsStore.teamById(player.teamId) : null;

                return {
                    id: player.id,
                    name: player.name,
                    talentRating: player.talentRating,
                    teamId: player.teamId,
                    teamName: team ? team.name : null,
                    courseScores,
                    totalScore
                };
            }).sort((a, b) => {
                // Sort by total score (highest first), then by name if scores are equal
                const scoreDiff = (b.totalScore || 0) - (a.totalScore || 0);
                if (scoreDiff !== 0) return scoreDiff;
                return a.name.localeCompare(b.name);
            });
        },
        teamLeaderboard: (state) => {
            const teamsStore = useTeamsStore();
            const playersStore = usePlayersStore();
            const coursesStore = useCoursesStore();

            const teams = teamsStore.allTeams;
            const courses = coursesStore.allCourses;

            return teams.map(team => {
                const teamPlayers = playersStore.playersByTeam(team.id);
                const courseScores = {};

                courses.forEach(course => {
                    let courseTotal = 0;
                    teamPlayers.forEach(player => {
                        const score = state.scores.find(s => s.playerId === player.id && s.courseId === course.id);
                        if (score) {
                            courseTotal += score.value;
                        }
                    });
                    courseScores[course.name] = courseTotal;
                });

                // Calculate team total score manually to avoid circular getter issues or complexity
                const teamTotalScore = teamPlayers.reduce((total, player) => {
                    const pTotal = state.scores
                        .filter(score => score.playerId === player.id)
                        .reduce((t, s) => t + s.value, 0);
                    return total + pTotal;
                }, 0);

                return {
                    id: team.id,
                    name: team.name,
                    logoUrl: team.logoUrl,
                    playerCount: teamPlayers.length,
                    courseScores,
                    totalScore: teamTotalScore
                };
            }).sort((a, b) => {
                // Sort by total score (highest first), then by name if scores are equal
                const scoreDiff = (b.totalScore || 0) - (a.totalScore || 0);
                if (scoreDiff !== 0) return scoreDiff;
                return a.name.localeCompare(b.name);
            });
        },
        playerMoneyLeaderboard: (state) => {
            const playersStore = usePlayersStore();
            const teamsStore = useTeamsStore();
            const players = playersStore.allPlayers;

            return players.map(player => {
                const team = player.teamId ? teamsStore.teamById(player.teamId) : null;
                return {
                    id: player.id,
                    name: player.name,
                    talentRating: player.talentRating,
                    teamId: player.teamId,
                    teamName: team ? team.name : null,
                    entryFee: player.entryFee || 0,
                    winnings: player.winnings || 0,
                    netWinnings: (player.winnings || 0) - (player.entryFee || 0)
                };
            }).sort((a, b) => {
                const winningsDiff = (b.winnings || 0) - (a.winnings || 0);
                if (winningsDiff !== 0) return winningsDiff;

                const netWinningsDiff = (b.netWinnings || 0) - (a.netWinnings || 0);
                if (netWinningsDiff !== 0) return netWinningsDiff;

                return a.name.localeCompare(b.name);
            });
        },
        teamMoneyLeaderboard: (state) => {
            const teamsStore = useTeamsStore();
            const playersStore = usePlayersStore();
            const teams = teamsStore.allTeams;

            return teams.map(team => {
                const teamPlayers = playersStore.playersByTeam(team.id);

                const totalEntryFees = teamPlayers.reduce((total, player) => total + (player.entryFee || 0), 0);
                const totalWinnings = teamPlayers.reduce((total, player) => total + (player.winnings || 0), 0);
                const netWinnings = totalWinnings - totalEntryFees;

                return {
                    id: team.id,
                    name: team.name,
                    logoUrl: team.logoUrl,
                    playerCount: teamPlayers.length,
                    totalEntryFees,
                    totalWinnings,
                    netWinnings
                };
            }).sort((a, b) => {
                const winningsDiff = (b.totalWinnings || 0) - (a.totalWinnings || 0);
                if (winningsDiff !== 0) return winningsDiff;

                const netWinningsDiff = (b.netWinnings || 0) - (a.netWinnings || 0);
                if (netWinningsDiff !== 0) return netWinningsDiff;

                return a.name.localeCompare(b.name);
            });
        },
        courseScoresByTeam: (state) => (courseId) => {
            const teamsStore = useTeamsStore();
            const playersStore = usePlayersStore();
            const teams = teamsStore.allTeams;

            return teams.map(team => {
                const teamPlayers = playersStore.playersByTeam(team.id);
                const playerScores = teamPlayers.map(player => {
                    const score = state.scores.find(s => s.playerId === player.id && s.courseId === courseId);
                    return {
                        playerId: player.id,
                        playerName: player.name,
                        talentRating: player.talentRating,
                        score: score ? score.value : null
                    };
                }).sort((a, b) => a.playerName.localeCompare(b.playerName));

                const teamTotal = playerScores.reduce((total, player) => {
                    return total + (player.score || 0);
                }, 0);

                return {
                    teamId: team.id,
                    teamName: team.name,
                    logoUrl: team.logoUrl,
                    playerScores,
                    teamTotal
                };
            });
        }
    },

    actions: {
        updateScore({ playerId, courseId, value }) {
            // Validate score value
            const scoreValue = parseInt(value);
            if (isNaN(scoreValue)) {
                throw new Error('Score must be a valid number');
            }

            const existingScore = this.scores.find(score => score.playerId === playerId && score.courseId === courseId);

            if (existingScore) {
                existingScore.value = scoreValue;
                existingScore.timestamp = new Date().toISOString();
            } else {
                const newScore = {
                    id: uuidv4(),
                    playerId,
                    courseId,
                    value: scoreValue,
                    timestamp: new Date().toISOString()
                };
                this.scores.push(newScore);
            }
        },

        deleteScore(id) {
            this.scores = this.scores.filter(score => score.id !== id);
        },

        deletePlayerScores(playerId) {
            this.scores = this.scores.filter(score => score.playerId !== playerId);
        },

        deleteCourseScores(courseId) {
            this.scores = this.scores.filter(score => score.courseId !== courseId);
        }
    }
});
