/**
 * PlayerForm component tests.
 * Pure form component — no stores, tests form logic, validation, and emits.
 */
import { mount } from '@vue/test-utils';
import PlayerForm from '../src/components/admin/PlayerForm.vue';

const mountForm = (props = {}) => mount(PlayerForm, { props });

describe('PlayerForm — add mode (no player prop)', () => {
    test('starts with default values: empty name/talent, entryFee=60', () => {
        const wrapper = mountForm();
        expect(wrapper.vm.form.name).toBe('');
        expect(wrapper.vm.form.talentRating).toBe('');
        expect(wrapper.vm.form.entryFee).toBe(60);
        expect(wrapper.vm.form.winnings).toBeUndefined();
    });

    test('submit button shows "Add Player"', () => {
        const wrapper = mountForm();
        expect(wrapper.find('[type="submit"]').text()).toBe('Add Player');
    });

    test('starts with no validation errors', () => {
        const wrapper = mountForm();
        expect(wrapper.vm.errors).toEqual({});
    });
});

describe('PlayerForm — edit mode (player prop provided)', () => {
    const player = { id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 100, winnings: 50 };

    test('populates form from player prop', () => {
        const wrapper = mountForm({ player });
        expect(wrapper.vm.form.name).toBe('Alice');
        expect(wrapper.vm.form.talentRating).toBe('A');
        expect(wrapper.vm.form.entryFee).toBe(100);
    });

    test('submit button shows "Update Player"', () => {
        const wrapper = mountForm({ player });
        expect(wrapper.find('[type="submit"]').text()).toBe('Update Player');
    });

    test('re-initializes form when player prop changes', async () => {
        const wrapper = mountForm({ player });
        await wrapper.setProps({ player: { ...player, name: 'Bob', talentRating: 'B' } });
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.form.name).toBe('Bob');
        expect(wrapper.vm.form.talentRating).toBe('B');
    });

    test('resets to add-mode defaults when player prop changes to null', async () => {
        const wrapper = mountForm({ player });
        await wrapper.setProps({ player: null });
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.form.name).toBe('');
        expect(wrapper.vm.form.talentRating).toBe('');
        expect(wrapper.vm.form.entryFee).toBe(60);
    });
});

describe('PlayerForm — validation', () => {
    test('blocks submit and sets name error when name is empty', async () => {
        const wrapper = mountForm();
        await wrapper.find('form').trigger('submit');
        expect(wrapper.emitted('save')).toBeFalsy();
        expect(wrapper.vm.errors.name).toBeTruthy();
    });

    test('blocks submit and sets talentRating error when rating not selected', async () => {
        const wrapper = mountForm();
        await wrapper.find('#name').setValue('Alice');
        // talentRating left empty
        await wrapper.find('form').trigger('submit');
        expect(wrapper.emitted('save')).toBeFalsy();
        expect(wrapper.vm.errors.talentRating).toBeTruthy();
    });

    test('shows invalid-feedback element when name error exists', async () => {
        const wrapper = mountForm();
        await wrapper.find('form').trigger('submit');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.invalid-feedback').exists()).toBe(true);
    });

    test('clears errors on a subsequent valid submit', async () => {
        const wrapper = mountForm();
        // Trigger validation errors
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors.name).toBeTruthy();
        // Provide valid data and resubmit
        await wrapper.find('#name').setValue('Alice');
        await wrapper.find('#talentRating').setValue('A');
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors).toEqual({});
    });
});

describe('PlayerForm — submit', () => {
    test('emits save with correct form data on valid submit', async () => {
        const wrapper = mountForm();
        await wrapper.find('#name').setValue('Bob');
        await wrapper.find('#talentRating').setValue('B');
        await wrapper.find('#entryFee').setValue('75');
        await wrapper.find('form').trigger('submit');
        expect(wrapper.emitted('save')).toBeTruthy();
        const emitted = wrapper.emitted('save')[0][0];
        expect(emitted.name).toBe('Bob');
        expect(emitted.talentRating).toBe('B');
    });

    test('does not emit save when form is invalid', async () => {
        const wrapper = mountForm();
        await wrapper.find('form').trigger('submit');
        expect(wrapper.emitted('save')).toBeFalsy();
    });

    test('emits cancel when cancel button is clicked', async () => {
        const wrapper = mountForm();
        await wrapper.find('.btn-secondary').trigger('click');
        expect(wrapper.emitted('cancel')).toBeTruthy();
    });
});

describe('PlayerForm — loading state', () => {
    test('disables all buttons when loading=true', () => {
        const wrapper = mountForm({ loading: true });
        wrapper.findAll('button').forEach(btn => {
            expect(btn.element.disabled).toBe(true);
        });
    });

    test('enables all buttons when loading=false', () => {
        const wrapper = mountForm({ loading: false });
        wrapper.findAll('button').forEach(btn => {
            expect(btn.element.disabled).toBe(false);
        });
    });
});
