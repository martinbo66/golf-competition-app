/**
 * Organizations store tests.
 */
import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { useOrganizationsStore } from '@/stores/organizations';

jest.mock('@/services/ApiService', () => ({
  __esModule: true,
  default: {
    _organizationId: null,
    _competitionId: null,
    get organizationId() { return this._organizationId; },
    set organizationId(id) { this._organizationId = id; },
    get competitionId() { return this._competitionId; },
    set competitionId(id) { this._competitionId = id; },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    organizationsUrl: jest.fn(id => (id ? `/organizations/${id}` : '/organizations')),
    competitionsUrl: jest.fn(function competitionsUrlMock(id) {
      const oid = this._organizationId;
      if (oid) {
        return id
          ? `/organizations/${oid}/competitions/${id}`
          : `/organizations/${oid}/competitions`;
      }
      return id ? `/competitions/${id}` : '/competitions';
    })
  }
}));

describe('organizations store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    ApiService._organizationId = null;
    ApiService._competitionId = null;
    ApiService.get.mockReset();
    ApiService.post.mockReset();
    ApiService.put.mockReset();
    ApiService.delete.mockReset();
    ApiService.organizationsUrl.mockImplementation(id => (id ? `/organizations/${id}` : '/organizations'));
    ApiService.competitionsUrl.mockImplementation(function competitionsUrlImpl(id) {
      const oid = this._organizationId;
      if (oid) {
        return id
          ? `/organizations/${oid}/competitions/${id}`
          : `/organizations/${oid}/competitions`;
      }
      return id ? `/competitions/${id}` : '/competitions';
    });
    ApiService.get.mockResolvedValue([]);
  });

  describe('fetchOrganizations', () => {
    test('fetches and stores organizations', async () => {
      const store = useOrganizationsStore();
      const mockOrgs = [
        { id: 'org-1', name: 'Club Alpha', slug: 'club-alpha', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
        { id: 'org-2', name: 'Club Beta', slug: 'club-beta', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-02T00:00:00Z' }
      ];
      ApiService.get.mockResolvedValue(mockOrgs);

      await store.fetchOrganizations();

      expect(store.organizations).toHaveLength(2);
      expect(store.organizations[0]).toEqual({
        id: 'org-1',
        name: 'Club Alpha',
        slug: 'club-alpha',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z'
      });
      expect(store.organizations[1]).toEqual({
        id: 'org-2',
        name: 'Club Beta',
        slug: 'club-beta',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-02T00:00:00Z'
      });
      expect(ApiService.get).toHaveBeenCalledWith('/organizations');
    });

    test('handles empty response', async () => {
      const store = useOrganizationsStore();
      ApiService.get.mockResolvedValue(null);

      await store.fetchOrganizations();

      expect(store.organizations).toEqual([]);
    });
  });

  describe('setActiveOrganization', () => {
    test('sets active org and ApiService.organizationId', async () => {
      const store = useOrganizationsStore();
      const org = { id: 'org-1', name: 'Test Club', slug: 'test-club', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };

      await store.setActiveOrganization(org);

      expect(store.activeOrganization.id).toBe('org-1');
      expect(ApiService.organizationId).toBe('org-1');
    });
  });

  describe('createOrganization', () => {
    test('posts and adds to list', async () => {
      const store = useOrganizationsStore();
      const newOrg = { id: 'org-3', name: 'New Club', slug: 'new-club', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' };
      ApiService.post.mockResolvedValue(newOrg);

      const result = await store.createOrganization({ name: 'New Club', slug: 'new-club' });

      expect(ApiService.post).toHaveBeenCalledWith('/organizations', { name: 'New Club', slug: 'new-club' });
      expect(store.organizations).toHaveLength(1);
      expect(store.organizations[0]).toEqual({
        id: 'org-3',
        name: 'New Club',
        slug: 'new-club',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z'
      });
      expect(result.id).toBe('org-3');
    });
  });

  describe('updateOrganization', () => {
    test('puts and updates list', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ id: 'org-1', name: 'Old Name', slug: 'old-name', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }];
      const updatedOrg = { id: 'org-1', name: 'New Name', slug: 'new-name', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' };
      ApiService.put.mockResolvedValue(updatedOrg);

      await store.updateOrganization({ id: 'org-1', updates: { name: 'New Name', slug: 'new-name' } });

      expect(ApiService.put).toHaveBeenCalledWith('/organizations/org-1', { name: 'New Name', slug: 'new-name' });
      expect(store.organizations[0].name).toBe('New Name');
      expect(store.organizations[0].slug).toBe('new-name');
    });

    test('updates activeOrganization when it matches', async () => {
      const store = useOrganizationsStore();
      const originalOrg = { id: 'org-1', name: 'Old Name', slug: 'old-name', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
      store.organizations = [originalOrg];
      store.activeOrganization = originalOrg;
      const updatedOrg = { id: 'org-1', name: 'New Name', slug: 'new-name', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' };
      ApiService.put.mockResolvedValue(updatedOrg);

      await store.updateOrganization({ id: 'org-1', updates: { name: 'New Name', slug: 'new-name' } });

      expect(store.activeOrganization.name).toBe('New Name');
      expect(store.activeOrganization.slug).toBe('new-name');
    });
  });

  describe('deleteOrganization', () => {
    test('deletes and removes from list', async () => {
      const store = useOrganizationsStore();
      store.organizations = [
        { id: 'org-1', name: 'Club Alpha', slug: 'club-alpha', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }
      ];
      ApiService.delete.mockResolvedValue(null);

      await store.deleteOrganization('org-1');

      expect(ApiService.delete).toHaveBeenCalledWith('/organizations/org-1');
      expect(store.organizations).toHaveLength(0);
    });

    test('clears activeOrganization and organizationId when deleting active org', async () => {
      const store = useOrganizationsStore();
      const org = { id: 'org-1', name: 'Club Alpha', slug: 'club-alpha', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
      store.organizations = [org];
      store.activeOrganization = org;
      ApiService._organizationId = 'org-1';
      ApiService.delete.mockResolvedValue(null);

      await store.deleteOrganization('org-1');

      expect(store.activeOrganization).toBeNull();
      expect(ApiService.organizationId).toBeNull();
    });
  });

  describe('getters', () => {
    test('allOrganizations returns all orgs', async () => {
      const store = useOrganizationsStore();
      store.organizations = [
        { id: 'org-1', name: 'Club Alpha', slug: 'club-alpha', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'org-2', name: 'Club Beta', slug: 'club-beta', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' }
      ];

      expect(store.allOrganizations).toHaveLength(2);
      expect(store.allOrganizations[0].id).toBe('org-1');
      expect(store.allOrganizations[1].id).toBe('org-2');
    });

    test('activeOrganizationId returns id of active org', async () => {
      const store = useOrganizationsStore();
      store.activeOrganization = { id: 'org-1', name: 'Club Alpha', slug: 'club-alpha', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };

      expect(store.activeOrganizationId).toBe('org-1');
    });

    test('activeOrganizationId returns null when no active org', async () => {
      const store = useOrganizationsStore();
      store.activeOrganization = null;

      expect(store.activeOrganizationId).toBeNull();
    });

    test('hasMultipleOrganizations returns true when more than one org', async () => {
      const store = useOrganizationsStore();
      store.organizations = [
        { id: 'org-1', name: 'Club Alpha', slug: 'club-alpha', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'org-2', name: 'Club Beta', slug: 'club-beta', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' }
      ];

      expect(store.hasMultipleOrganizations).toBe(true);
    });

    test('hasMultipleOrganizations returns false for one org', async () => {
      const store = useOrganizationsStore();
      store.organizations = [
        { id: 'org-1', name: 'Club Alpha', slug: 'club-alpha', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }
      ];

      expect(store.hasMultipleOrganizations).toBe(false);
    });

    test('hasMultipleOrganizations returns false for zero orgs', async () => {
      const store = useOrganizationsStore();
      store.organizations = [];

      expect(store.hasMultipleOrganizations).toBe(false);
    });
  });
});
