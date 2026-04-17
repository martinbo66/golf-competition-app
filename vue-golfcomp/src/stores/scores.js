import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';
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
        scoreByPlayerAndRound: (state) => (playerId, roundId) => {
            return state.scores.find(score => score.playerId === playerId && score.roundId === roundId);
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
                    name: player.nickname || player.name,
                    talentRating: player.talentRating,
                    teamId: player.teamId,
                    teamName: team ? team.name : null,
                    courseScores,
                    totalScore
                };
            }).sort((a, b) => {
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
                const scoreDiff = (b.totalScore || 0) - (a.totalScore || 0);
                if (scoreDiff !== 0) return scoreDiff;
                return a.name.localeCompare(b.name);
            });
        },
        /* eslint-disable-next-line no-unused-vars */
        playerMoneyLeaderboard: (state) => {
            const playersStore = usePlayersStore();
            const teamsStore = useTeamsStore();
            const players = playersStore.allPlayers;

            return players.map(player => {
                const team = player.teamId ? teamsStore.teamById(player.teamId) : null;
                return {
                    id: player.id,
                    name: player.nickname || player.name,
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
        /* eslint-disable-next-line no-unused-vars */
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
        courseScoresByTeam: (state) => (roundId) => {
            const teamsStore = useTeamsStore();
            const playersStore = usePlayersStore();
            const teams = teamsStore.allTeams;

            return teams.map(team => {
                const teamPlayers = playersStore.playersByTeam(team.id);
                const playerScores = teamPlayers.map(player => {
                    const score = state.scores.find(s => s.playerId === player.id && s.roundId === roundId);
                    return {
                        playerId: player.id,
                        playerName: player.nickname || player.name,
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
        async fetchScores() {
            const coursesStore = useCoursesStore();
            const allScores = [];

            for (const course of coursesStore.allCourses) {
                if (!course.roundId) continue;
                const roundScores = await ApiService.get(ApiService.scoresUrl(course.roundId));
                const mapped = (roundScores || []).map(score => ({
                    id: score.id,
                    playerId: score.playerId,
                    courseId: course.id,
                    roundId: course.roundId,
                    value: score.value,
                    timestamp: score.updatedAt || score.createdAt
                }));
                allScores.push(...mapped);
            }

            this.scores = allScores;
        },

        async updateScore({ playerId, roundId, courseId, value }) {
            const coursesStore = useCoursesStore();
            let resolvedRoundId = roundId;
            let resolvedCourseId = courseId;

            if (resolvedRoundId && !resolvedCourseId) {
                resolvedCourseId = coursesStore.allCourses.find(c => c.roundId === resolvedRoundId)?.id;
            } else if (!resolvedRoundId && resolvedCourseId) {
                resolvedRoundId = coursesStore.roundIdByCourseId(resolvedCourseId);
                if (!resolvedRoundId) throw new Error(`No round found for course ${resolvedCourseId}`);
            }

            const scoreValue = Number.parseInt(value, 10);
            if (Number.isNaN(scoreValue)) throw new Error('Score must be a valid number');

            const result = await ApiService.put(ApiService.scoresUrl(resolvedRoundId), {
                playerId,
                value: scoreValue
            });

            const mappedScore = {
                id: result.id,
                playerId: result.playerId,
                courseId: resolvedCourseId,
                roundId: resolvedRoundId,
                value: result.value,
                timestamp: result.updatedAt || result.createdAt
            };

            const existingIndex = this.scores.findIndex(
                s => s.playerId === playerId && s.roundId === resolvedRoundId
            );
            if (existingIndex !== -1) {
                this.scores[existingIndex] = mappedScore;
            } else {
                this.scores.push(mappedScore);
            }
        },

        deleteScore(id) {
            // Backend DELETE /api/v1/.../scores/{id} not yet implemented.
            // Removing from local state only; score will reappear on next fetchScores().
            this.scores = this.scores.filter(score => score.id !== id);
        },

        deletePlayerScores(playerId) {
            // Backend may cascade on player delete; bulk delete not yet implemented. Local-only for now.
            this.scores = this.scores.filter(score => score.playerId !== playerId);
        },

        deleteCourseScores(courseId) {
            // Backend has no per-round clear endpoint. Local-only for now.
            this.scores = this.scores.filter(score => score.courseId !== courseId);
        }
    }
});
