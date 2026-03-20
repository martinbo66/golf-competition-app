/**
 * RoundList component tests (CM-07: add rounds, CM-08: delete round).
 */
jest.mock('@/services/ApiService', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    roundsUrl: jest.fn(id => (id ? `/competitions/comp/rounds/${id}` : '/competitions/comp/rounds'))
  }
}));

jest.mock('@/services/NotificationService', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import RoundList from '../src/components/admin/RoundList.vue';
import { useCompetitionsStore } from '../src/stores/competitions';
import { useCoursesStore } from '../src/stores/courses';
import ApiService from '@/services/ApiService';
import NotificationService from '@/services/NotificationService';

describe('RoundList', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    ApiService.post.mockReset();
    ApiService.put.mockReset();
    ApiService.delete.mockReset();
    NotificationService.success.mockClear();
    NotificationService.error.mockClear();
  });

  test('renders nothing when no active competition', () => {
    const wrapper = mount(RoundList);
    expect(wrapper.find('.round-list').exists()).toBe(false);
  });

  test('renders rounds section with heading when active competition set', () => {
    const compStore = useCompetitionsStore();
    compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };

    const wrapper = mount(RoundList, {
      global: {
        stubs: { ConfirmationDialog: true }
      }
    });

    expect(wrapper.find('.round-list').exists()).toBe(true);
    expect(wrapper.text()).toContain('Rounds — Summer Cup');
  });

  test('shows add-round row with course select, date input, next round #, Add button', () => {
    const compStore = useCompetitionsStore();
    compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };

    const wrapper = mount(RoundList, {
      global: { stubs: { ConfirmationDialog: true } }
    });

    expect(wrapper.find('select[aria-label="Course"]').exists()).toBe(true);
    expect(wrapper.find('input[type="date"]').exists()).toBe(true);
    const addRowFirstCell = wrapper.find('tr.round-list__add-row td');
    expect(addRowFirstCell.exists()).toBe(true);
    expect(addRowFirstCell.text()).toBe('1');
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('Add');
  });

  test('course dropdown has four course options', () => {
    const compStore = useCompetitionsStore();
    compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
    useCoursesStore().allCoursesCache = [
      { id: '071aaf93-773e-49d0-935e-4b825e25670f', name: 'Parkland' },
      { id: '2b81e674-816a-42ea-b524-54a96bfb2b14', name: 'Heathland' },
      { id: '38a5c806-7f44-4ebb-9472-6ec79431c5ff', name: 'Heritage Club' },
      { id: 'd3d8aa11-5320-477b-9602-6501dd63b186', name: 'Moorland' }
    ];

    const wrapper = mount(RoundList, {
      global: { stubs: { ConfirmationDialog: true } }
    });

    const options = wrapper.findAll('select[aria-label="Course"] option');
    expect(options.length).toBeGreaterThanOrEqual(4);
    const text = wrapper.text();
    expect(text).toContain('Parkland');
    expect(text).toContain('Heathland');
    expect(text).toContain('Heritage Club');
    expect(text).toContain('Moorland');
  });

  test('displays existing rounds from courses store', () => {
    const compStore = useCompetitionsStore();
    compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
    useCoursesStore().rounds = [
      { id: 'r1', course: { id: 'c1', name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' },
      { id: 'r2', course: { id: 'c2', name: 'Heathland' }, roundNumber: 2, playDate: '2026-07-12' }
    ];

    const wrapper = mount(RoundList, {
      global: { stubs: { ConfirmationDialog: true } }
    });

    expect(wrapper.text()).toContain('Parkland');
    expect(wrapper.text()).toContain('Heathland');
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('2');
  });

  test('Add button calls createRound and shows success when form valid', async () => {
    const compStore = useCompetitionsStore();
    compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
    jest.spyOn(compStore, 'createRound').mockResolvedValue();
    useCoursesStore().allCoursesCache = [
      { id: '071aaf93-773e-49d0-935e-4b825e25670f', name: 'Parkland' }
    ];

    const wrapper = mount(RoundList, {
      global: { stubs: { ConfirmationDialog: true } }
    });

    await wrapper.find('select[aria-label="Course"]').setValue('071aaf93-773e-49d0-935e-4b825e25670f');
    await wrapper.find('input[type="date"]').setValue('2026-06-14');

    await wrapper.find('button.btn-primary').trigger('click');

    expect(compStore.createRound).toHaveBeenCalledWith({
      courseId: '071aaf93-773e-49d0-935e-4b825e25670f',
      playDate: '2026-06-14',
      roundNumber: 1
    });
    expect(NotificationService.success).toHaveBeenCalledWith('Round added');
  });

  describe('delete round (CM-08)', () => {
    test('each round row has a Delete button', () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];

      const wrapper = mount(RoundList, {
        global: { stubs: { ConfirmationDialog: true } }
      });

      expect(wrapper.find('button[title="Delete round"]').exists()).toBe(true);
    });

    test('clicking Delete opens confirmation dialog with round details', async () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];

      const wrapper = mount(RoundList, {
        global: { stubs: { ConfirmationDialog: true } }
      });

      await wrapper.find('button[title="Delete round"]').trigger('click');

      const dialog = wrapper.findComponent({ name: 'ConfirmationDialog' });
      expect(dialog.exists()).toBe(true);
      expect(dialog.props('show')).toBe(true);
      expect(dialog.props('title')).toBe('Delete Round');
      expect(dialog.props('message')).toContain('round 1');
      expect(dialog.props('message')).toContain('Parkland');
    });

    test('confirming delete calls deleteRound and shows success', async () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];
      jest.spyOn(compStore, 'deleteRound').mockResolvedValue();

      const wrapper = mount(RoundList, {
        global: { stubs: { ConfirmationDialog: true } }
      });

      await wrapper.find('button[title="Delete round"]').trigger('click');
      await wrapper.findComponent({ name: 'ConfirmationDialog' }).vm.$emit('confirm');

      expect(compStore.deleteRound).toHaveBeenCalledWith('r1');
      expect(NotificationService.success).toHaveBeenCalledWith('Round deleted');
    });

    test('when delete fails, shows error', async () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];
      jest.spyOn(compStore, 'deleteRound').mockRejectedValue(new Error('Network error'));

      const wrapper = mount(RoundList, {
        global: { stubs: { ConfirmationDialog: true } }
      });

      await wrapper.find('button[title="Delete round"]').trigger('click');
      await wrapper.findComponent({ name: 'ConfirmationDialog' }).vm.$emit('confirm');

      expect(NotificationService.error).toHaveBeenCalledWith('Network error');
    });
  });

  describe('edit round', () => {
    test('each round row has an Edit button in read mode', () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { id: 'c1', name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];

      const wrapper = mount(RoundList, { global: { stubs: { ConfirmationDialog: true } } });

      expect(wrapper.find('button[title="Edit round"]').exists()).toBe(true);
    });

    test('clicking Edit enters edit mode with course select and date input', async () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { id: '071aaf93-773e-49d0-935e-4b825e25670f', name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];

      const wrapper = mount(RoundList, { global: { stubs: { ConfirmationDialog: true } } });
      await wrapper.find('button[title="Edit round"]').trigger('click');

      expect(wrapper.find('select[aria-label="Edit course"]').exists()).toBe(true);
      expect(wrapper.find('input[aria-label="Edit play date"]').exists()).toBe(true);
      expect(wrapper.find('button[title="Save changes"]').exists()).toBe(true);
      expect(wrapper.find('button[title="Cancel edit"]').exists()).toBe(true);
    });

    test('Cancel edit returns to read mode', async () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { id: 'c1', name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];

      const wrapper = mount(RoundList, { global: { stubs: { ConfirmationDialog: true } } });
      await wrapper.find('button[title="Edit round"]').trigger('click');
      await wrapper.find('button[title="Cancel edit"]').trigger('click');

      expect(wrapper.find('select[aria-label="Edit course"]').exists()).toBe(false);
      expect(wrapper.find('button[title="Edit round"]').exists()).toBe(true);
    });

    test('Save calls updateRound and shows success notification', async () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { id: '071aaf93-773e-49d0-935e-4b825e25670f', name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];
      useCoursesStore().allCoursesCache = [
        { id: '071aaf93-773e-49d0-935e-4b825e25670f', name: 'Parkland' },
        { id: '2b81e674-816a-42ea-b524-54a96bfb2b14', name: 'Heathland' }
      ];
      jest.spyOn(compStore, 'updateRound').mockResolvedValue();

      const wrapper = mount(RoundList, { global: { stubs: { ConfirmationDialog: true } } });
      await wrapper.find('button[title="Edit round"]').trigger('click');
      await wrapper.find('select[aria-label="Edit course"]').setValue('2b81e674-816a-42ea-b524-54a96bfb2b14');
      await wrapper.find('button[title="Save changes"]').trigger('click');

      expect(compStore.updateRound).toHaveBeenCalledWith({
        roundId: 'r1',
        courseId: '2b81e674-816a-42ea-b524-54a96bfb2b14',
        playDate: '2026-06-14'
      });
      expect(NotificationService.success).toHaveBeenCalledWith('Round updated');
    });

    test('Save failure shows error notification', async () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { id: 'c1', name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];
      useCoursesStore().allCoursesCache = [
        { id: 'c1', name: 'Parkland' },
        { id: '2b81e674-816a-42ea-b524-54a96bfb2b14', name: 'Heathland' }
      ];
      jest.spyOn(compStore, 'updateRound').mockRejectedValue(new Error('Server error'));

      const wrapper = mount(RoundList, { global: { stubs: { ConfirmationDialog: true } } });
      await wrapper.find('button[title="Edit round"]').trigger('click');
      await wrapper.find('select[aria-label="Edit course"]').setValue('2b81e674-816a-42ea-b524-54a96bfb2b14');
      await wrapper.find('button[title="Save changes"]').trigger('click');

      expect(NotificationService.error).toHaveBeenCalledWith('Server error');
    });
  });
});
