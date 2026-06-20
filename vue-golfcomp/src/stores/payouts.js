import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';
import { usePlayersStore } from './players';

function mapPayoutResponse(response) {
    return {
        id: response.id,
        competitionId: response.competitionId,
        roundId: response.roundId || null,
        eventId: response.eventId || null,
        eventName: response.eventName || null,
        playerId: response.playerId,
        playerName: response.playerName,
        teamId: response.teamId || null,
        teamName: response.teamName || null,
        type: response.type,
        amount: Number.parseFloat(response.amount) || 0,
        note: response.note || '',
        paid: response.paid === true,
        paidAt: response.paidAt || null,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
    };
}

export const usePayoutsStore = defineStore('payouts', {
    state: () => ({
        payouts: []
    }),

    getters: {
        allPayouts: (state) => state.payouts,
        payoutsByRound: (state) => (roundId) => state.payouts.filter(p => p.roundId === roundId),
        payoutsByEvent: (state) => (eventId) => state.payouts.filter(p => p.eventId === eventId),
        eventTotal: (state) => (eventId) => state.payouts
            .filter(p => p.eventId === eventId)
            .reduce((sum, p) => sum + (p.amount || 0), 0),
        eventPaidTotal: (state) => (eventId) => state.payouts
            .filter(p => p.eventId === eventId && p.paid)
            .reduce((sum, p) => sum + (p.amount || 0), 0),
        payoutsByPlayer: (state) => (playerId) => state.payouts.filter(p => p.playerId === playerId),
        roundTotal: (state) => (roundId) => state.payouts
            .filter(p => p.roundId === roundId)
            .reduce((sum, p) => sum + (p.amount || 0), 0),
        roundPaidTotal: (state) => (roundId) => state.payouts
            .filter(p => p.roundId === roundId && p.paid)
            .reduce((sum, p) => sum + (p.amount || 0), 0),
        roundUnpaidTotal: (state) => (roundId) => state.payouts
            .filter(p => p.roundId === roundId && !p.paid)
            .reduce((sum, p) => sum + (p.amount || 0), 0),
        roundPayoutsByType: (state) => (roundId, type) => state.payouts
            .filter(p => p.roundId === roundId && p.type === type),
        paidTotalByPlayer: (state) => (playerId) => state.payouts
            .filter(p => p.playerId === playerId && p.paid)
            .reduce((sum, p) => sum + (p.amount || 0), 0),
        unpaidTotalByPlayer: (state) => (playerId) => state.payouts
            .filter(p => p.playerId === playerId && !p.paid)
            .reduce((sum, p) => sum + (p.amount || 0), 0),
        competitionUnpaidTotal: (state) => state.payouts
            .filter(p => !p.paid)
            .reduce((sum, p) => sum + (p.amount || 0), 0)
    },

    actions: {
        async fetchPayouts() {
            const list = await ApiService.get(ApiService.payoutsUrl());
            this.payouts = (list || []).map(mapPayoutResponse);
        },

        async createPayout({ roundId, playerId, type, amount, note }) {
            const created = await ApiService.post(ApiService.roundPayoutsUrl(roundId), {
                playerId,
                type,
                amount: Number.parseFloat(amount) || 0,
                note: note || null
            });
            const mapped = mapPayoutResponse(created);
            this.payouts.push(mapped);
            await this._refreshPlayerWinnings(mapped.playerId);
            return mapped;
        },

        async createEventPayout({ eventId, playerId, amount, note }) {
            const created = await ApiService.post(ApiService.eventPayoutsUrl(eventId), {
                playerId,
                type: 'EVENT',
                amount: Number.parseFloat(amount) || 0,
                note: note || null
            });
            const mapped = mapPayoutResponse(created);
            this.payouts.push(mapped);
            await this._refreshPlayerWinnings(mapped.playerId);
            return mapped;
        },

        async recordTeamWin({ roundId, teamId, teamAmount }) {
            const created = await ApiService.post(ApiService.teamWinPayoutUrl(roundId), {
                teamId,
                teamAmount: Number.parseFloat(teamAmount) || 0
            });
            const mappedList = (created || []).map(mapPayoutResponse);
            this.payouts.push(...mappedList);
            const touched = new Set(mappedList.map(p => p.playerId));
            for (const pid of touched) {
                await this._refreshPlayerWinnings(pid);
            }
            return mappedList;
        },

        async updatePayout({ id, updates }) {
            const existing = this.payouts.find(p => p.id === id);
            const updated = await ApiService.put(ApiService.payoutsUrl(id), {
                playerId: updates.playerId ?? existing?.playerId,
                type: updates.type ?? existing?.type,
                amount: Number.parseFloat(updates.amount ?? existing?.amount) || 0,
                note: updates.note ?? existing?.note ?? null
            });
            const mapped = mapPayoutResponse(updated);
            const idx = this.payouts.findIndex(p => p.id === id);
            if (idx !== -1) this.payouts[idx] = mapped;
            else this.payouts.push(mapped);
            if (existing && existing.playerId !== mapped.playerId) {
                await this._refreshPlayerWinnings(existing.playerId);
            }
            await this._refreshPlayerWinnings(mapped.playerId);
            return mapped;
        },

        async setPayoutPaid({ id, paid }) {
            const updated = await ApiService.patch(ApiService.markPayoutPaidUrl(id), { paid });
            const mapped = mapPayoutResponse(updated);
            const idx = this.payouts.findIndex(p => p.id === id);
            if (idx !== -1) this.payouts[idx] = mapped;
            else this.payouts.push(mapped);
            await this._refreshPlayerWinnings(mapped.playerId);
            return mapped;
        },

        async deletePayout(id) {
            const existing = this.payouts.find(p => p.id === id);
            await ApiService.delete(ApiService.payoutsUrl(id));
            this.payouts = this.payouts.filter(p => p.id !== id);
            if (existing) {
                await this._refreshPlayerWinnings(existing.playerId);
            }
        },

        async _refreshPlayerWinnings(playerId) {
            const playersStore = usePlayersStore();
            const player = playersStore.playerById(playerId);
            if (!player) return;
            // Winnings reflect money actually received: paid payouts only.
            const newTotal = this.payouts
                .filter(p => p.playerId === playerId && p.paid)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            player.winnings = newTotal;
        }
    }
});
