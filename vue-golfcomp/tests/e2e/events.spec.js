const { test, expect } = require('@playwright/test');

const API = '/api/v1';

async function getData(res) {
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.success).toBe(true);
  return body.data;
}

test.describe('Events (non-round competition components)', () => {
  test('event API flow: create event, award an event payout, winnings reflect it', async ({ request }) => {
    // Default organization is always seeded.
    const orgs = await getData(await request.get(`${API}/organizations`));
    expect(orgs.length).toBeGreaterThan(0);
    const orgId = orgs[0].id;

    let competitionId;
    try {
      // Create a throwaway competition under the org.
      const comp = await getData(await request.post(`${API}/organizations/${orgId}/competitions`, {
        data: {
          name: `E2E Events ${Date.now()}`,
          startDate: '2026-06-01',
          endDate: '2026-06-05',
          location: 'E2E'
        }
      }));
      competitionId = comp.id;
      const base = `${API}/organizations/${orgId}/competitions/${competitionId}`;

      // Create an event.
      const event = await getData(await request.post(`${base}/events`, {
        data: { name: 'Putting Competition', eventDate: '2026-06-02', note: 'Worth $20' }
      }));
      expect(event.name).toBe('Putting Competition');

      // Create a player to win the event.
      const player = await getData(await request.post(`${base}/players`, {
        data: { name: 'E2E Putter', talentRating: 'A' }
      }));

      // Award an event payout — it should link to the event, not a round.
      const payout = await getData(await request.post(`${base}/events/${event.id}/payouts`, {
        data: { playerId: player.id, type: 'EVENT', amount: 20, note: '1st place' }
      }));
      expect(payout.eventId).toBe(event.id);
      expect(payout.roundId == null).toBeTruthy();
      expect(payout.type).toBe('EVENT');

      // Unpaid → winnings still zero.
      let fetched = await getData(await request.get(`${base}/players/${player.id}`));
      expect(Number(fetched.winnings)).toBe(0);

      // Mark the payout paid → winnings reflect the $20 prize.
      await getData(await request.patch(`${base}/payouts/${payout.id}/paid`, { data: { paid: true } }));
      fetched = await getData(await request.get(`${base}/players/${player.id}`));
      expect(Number(fetched.winnings)).toBe(20);

      // The event payout shows up in the competition-wide payout list.
      const payouts = await getData(await request.get(`${base}/payouts`));
      expect(payouts.some(p => p.id === payout.id && p.eventId === event.id)).toBeTruthy();
    } finally {
      // Clean up — cascade-deletes the event, payout, and player.
      if (competitionId) {
        await request.delete(`${API}/organizations/${orgId}/competitions/${competitionId}`);
      }
    }
  });

  test('Competition admin renders the Other Events section', async ({ page }) => {
    await page.goto('/#/admin/competitions');
    await expect(page).toHaveURL(/#\/admin\/competitions$/);
    // EventList renders only when a competition is active; the section root carries a stable test id.
    const section = page.getByTestId('events-section');
    if (await section.count()) {
      await expect(section.first()).toBeVisible();
      await expect(page.getByRole('heading', { name: /other events/i })).toBeVisible();
    }
  });
});
