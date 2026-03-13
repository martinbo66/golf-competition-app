/**
 * RoundList component tests (CM-07: add rounds, CM-08: delete round).
 */
jest.mock('@/services/ApiService', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
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

  test('shows add-round row with course select, date input, round number, Add button', () => {
    const compStore = useCompetitionsStore();
    compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };

    const wrapper = mount(RoundList, {
      global: { stubs: { ConfirmationDialog: true } }
    });

    expect(wrapper.find('select[aria-label="Course"]').exists()).toBe(true);
    expect(wrapper.find('input[type="date"]').exists()).toBe(true);
    expect(wrapper.find('input[type="number"][aria-label="Round number"]').exists()).toBe(true);
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('Add');
  });

  test('course dropdown has four course options', () => {
    const compStore = useCompetitionsStore();
    compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };

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

    const wrapper = mount(RoundList, {
      global: { stubs: { ConfirmationDialog: true } }
    });

    await wrapper.find('select[aria-label="Course"]').setValue('071aaf93-773e-49d0-935e-4b825e25670f');
    await wrapper.find('input[type="date"]').setValue('2026-06-14');
    await wrapper.find('input[type="number"]').setValue(1);

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

      const deleteButtons = wrapper.findAll('button.btn-danger');
      expect(deleteButtons.length).toBe(1);
      expect(deleteButtons[0].text()).toContain('Delete');
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

      await wrapper.find('button.btn-danger').trigger('click');

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

      await wrapper.find('button.btn-danger').trigger('click');
      await wrapper.findComponent({ name: 'ConfirmationDialog' }).vm.$emit('confirm');

      expect(compStore.deleteRound).toHaveBeenCalledWith('r1');
      expect(NotificationService.success).toHaveBeenCalledWith('Round deleted');
    });

    test('when delete fails, shows error and keeps dialog state', async () => {
      const compStore = useCompetitionsStore();
      compStore.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      useCoursesStore().rounds = [
        { id: 'r1', course: { name: 'Parkland' }, roundNumber: 1, playDate: '2026-06-14' }
      ];
      jest.spyOn(compStore, 'deleteRound').mockRejectedValue(new Error('Network error'));

      const wrapper = mount(RoundList, {
        global: { stubs: { ConfirmationDialog: true } }
      });

      await wrapper.find('button.btn-danger').trigger('click');
      await wrapper.findComponent({ name: 'ConfirmationDialog' }).vm.$emit('confirm');

      expect(NotificationService.error).toHaveBeenCalledWith('Network error');
    });
  });
});
