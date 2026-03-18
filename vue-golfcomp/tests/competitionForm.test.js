/**
 * CompetitionForm component tests.
 * Pure form component — no stores, tests form logic, validation, and emits.
 */
import { mount } from '@vue/test-utils';
import CompetitionForm from '../src/components/admin/CompetitionForm.vue';

const mountForm = (props = {}) => mount(CompetitionForm, { props });

describe('CompetitionForm — add mode (no competition prop)', () => {
    test('renders empty form fields', () => {
        const wrapper = mountForm();
        expect(wrapper.find('#comp-name').element.value).toBe('');
        expect(wrapper.find('#comp-start').element.value).toBe('');
        expect(wrapper.find('#comp-end').element.value).toBe('');
        expect(wrapper.find('#comp-location').element.value).toBe('');
    });

    test('submit button shows "Create Competition"', () => {
        const wrapper = mountForm();
        expect(wrapper.find('[type="submit"]').text()).toBe('Create Competition');
    });

    test('auto-sets endDate to match startDate when endDate is empty', async () => {
        const wrapper = mountForm();
        await wrapper.find('#comp-start').setValue('2026-06-01');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('#comp-end').element.value).toBe('2026-06-01');
    });

    test('does NOT override endDate when it was already set before startDate', async () => {
        const wrapper = mountForm();
        await wrapper.find('#comp-end').setValue('2026-07-01');
        await wrapper.find('#comp-start').setValue('2026-06-01');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('#comp-end').element.value).toBe('2026-07-01');
    });
});

describe('CompetitionForm — edit mode (competition prop provided)', () => {
    const competition = {
        id: 'c1',
        name: 'Spring Cup',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        location: 'Augusta, GA'
    };

    test('populates all form fields from competition prop', () => {
        const wrapper = mountForm({ competition });
        expect(wrapper.find('#comp-name').element.value).toBe('Spring Cup');
        expect(wrapper.find('#comp-start').element.value).toBe('2026-05-01');
        expect(wrapper.find('#comp-end').element.value).toBe('2026-05-03');
        expect(wrapper.find('#comp-location').element.value).toBe('Augusta, GA');
    });

    test('submit button shows "Save Changes"', () => {
        const wrapper = mountForm({ competition });
        expect(wrapper.find('[type="submit"]').text()).toBe('Save Changes');
    });

    test('does NOT auto-set endDate in edit mode', async () => {
        const noEndDateComp = { ...competition, endDate: null };
        const wrapper = mountForm({ competition: noEndDateComp });
        await wrapper.find('#comp-start').setValue('2026-06-15');
        await wrapper.vm.$nextTick();
        // watch guard: !this.competition prevents auto-set in edit mode
        expect(wrapper.find('#comp-end').element.value).toBe('');
    });

    test('re-initializes form when competition prop changes', async () => {
        const wrapper = mountForm({ competition });
        await wrapper.setProps({ competition: { ...competition, name: 'Updated Cup' } });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('#comp-name').element.value).toBe('Updated Cup');
    });

    test('handles null optional fields gracefully', () => {
        const sparse = { id: 'c2', name: 'Sparse Cup', startDate: null, endDate: null, location: null };
        const wrapper = mountForm({ competition: sparse });
        expect(wrapper.find('#comp-start').element.value).toBe('');
        expect(wrapper.find('#comp-end').element.value).toBe('');
        expect(wrapper.find('#comp-location').element.value).toBe('');
    });
});

describe('CompetitionForm — validation', () => {
    test('blocks submit and shows error when name is empty', async () => {
        const wrapper = mountForm();
        await wrapper.find('form').trigger('submit');
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('save')).toBeFalsy();
        expect(wrapper.find('.invalid-feedback').text()).toContain('required');
    });

    test('blocks submit and shows error when end date is before start date', async () => {
        const wrapper = mountForm();
        await wrapper.find('#comp-name').setValue('Test Cup');
        await wrapper.find('#comp-start').setValue('2026-06-10');
        await wrapper.find('#comp-end').setValue('2026-06-01');
        await wrapper.find('form').trigger('submit');
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('save')).toBeFalsy();
        expect(wrapper.text()).toContain('End date must be on or after start date');
    });

    test('allows end date equal to start date', async () => {
        const wrapper = mountForm();
        await wrapper.find('#comp-name').setValue('One Day Cup');
        await wrapper.find('#comp-start').setValue('2026-06-01');
        await wrapper.find('#comp-end').setValue('2026-06-01');
        await wrapper.find('form').trigger('submit');
        expect(wrapper.emitted('save')).toBeTruthy();
    });

    test('clears errors after a successful submit', async () => {
        const wrapper = mountForm();
        // Trigger validation error first
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors.name).toBeTruthy();
        // Fix and resubmit
        await wrapper.find('#comp-name').setValue('Fixed Cup');
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors).toEqual({});
    });
});

describe('CompetitionForm — submit', () => {
    test('emits save with trimmed name and null for empty optional fields', async () => {
        const wrapper = mountForm();
        await wrapper.find('#comp-name').setValue('  Summer Cup  ');
        await wrapper.find('form').trigger('submit');
        expect(wrapper.emitted('save')[0][0]).toEqual({
            name: 'Summer Cup',
            startDate: null,
            endDate: null,
            location: null
        });
    });

    test('emits save with all fields present when all are filled', async () => {
        const wrapper = mountForm();
        await wrapper.find('#comp-name').setValue('Summer Cup');
        await wrapper.find('#comp-start').setValue('2026-06-01');
        await wrapper.find('#comp-end').setValue('2026-06-03');
        await wrapper.find('#comp-location').setValue('Pinehurst');
        await wrapper.find('form').trigger('submit');
        expect(wrapper.emitted('save')[0][0]).toEqual({
            name: 'Summer Cup',
            startDate: '2026-06-01',
            endDate: '2026-06-03',
            location: 'Pinehurst'
        });
    });

    test('emits cancel when cancel button is clicked', async () => {
        const wrapper = mountForm();
        await wrapper.find('[type="button"]').trigger('click');
        expect(wrapper.emitted('cancel')).toBeTruthy();
    });
});

describe('CompetitionForm — loading state', () => {
    test('disables both buttons when loading=true', () => {
        const wrapper = mountForm({ loading: true });
        expect(wrapper.find('[type="submit"]').element.disabled).toBe(true);
        expect(wrapper.find('[type="button"]').element.disabled).toBe(true);
    });

    test('enables buttons when loading=false', () => {
        const wrapper = mountForm({ loading: false });
        expect(wrapper.find('[type="submit"]').element.disabled).toBe(false);
        expect(wrapper.find('[type="button"]').element.disabled).toBe(false);
    });
});
