<template>
  <form @submit.prevent="submitForm" class="player-form">
    <div class="form-group">
      <label for="name">Name</label>
      <input 
        type="text" 
        id="name" 
        v-model="form.name" 
        class="form-control" 
        :class="{ 'is-invalid': errors.name }"
        required
      >
      <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
    </div>
    
    <div class="form-group">
      <label for="talentRating">Talent Rating</label>
      <select 
        id="talentRating" 
        v-model="form.talentRating" 
        class="form-control"
        :class="{ 'is-invalid': errors.talentRating }"
        required
      >
        <option value="">Select Rating</option>
        <option value="A">A (Highest)</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D (Lowest)</option>
      </select>
      <div v-if="errors.talentRating" class="invalid-feedback">{{ errors.talentRating }}</div>
    </div>
    
    <div class="form-group">
      <label for="entryFee">Entry Fee ($)</label>
      <input 
        type="number" 
        id="entryFee" 
        v-model="form.entryFee" 
        class="form-control"
        :class="{ 'is-invalid': errors.entryFee }"
        min="0"
        step="0.01"
      >
      <div v-if="errors.entryFee" class="invalid-feedback">{{ errors.entryFee }}</div>
    </div>
    
    <div class="form-group">
      <label for="winnings">Winnings ($)</label>
      <input 
        type="number" 
        id="winnings" 
        v-model="form.winnings" 
        class="form-control"
        :class="{ 'is-invalid': errors.winnings }"
        min="0"
        step="0.01"
      >
      <div v-if="errors.winnings" class="invalid-feedback">{{ errors.winnings }}</div>
    </div>
    
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
      <button type="submit" class="btn">{{ player ? 'Update' : 'Add' }} Player</button>
    </div>
  </form>
</template>

<script>
import { validatePlayer } from '@/utils';

export default {
  name: 'PlayerForm',
  props: {
    player: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      form: {
        name: '',
        talentRating: '',
        entryFee: 60,
        winnings: 0
      },
      errors: {}
    };
  },
  created() {
    this.initForm();
  },
  methods: {
    initForm() {
      if (this.player) {
        // Edit mode - populate form with player data
        this.form = {
          id: this.player.id,
          name: this.player.name,
          talentRating: this.player.talentRating,
          entryFee: this.player.entryFee,
          winnings: this.player.winnings
        };
      } else {
        // Add mode - reset form with default entry fee of $60
        this.form = {
          name: '',
          talentRating: '',
          entryFee: 60,
          winnings: 0
        };
      }
      this.errors = {};
    },
    submitForm() {
      // Validate form
      const validation = validatePlayer(this.form);
      
      if (!validation.isValid) {
        this.errors = validation.errors;
        return;
      }
      
      // Clear errors
      this.errors = {};
      
      // Emit save event with form data
      this.$emit('save', { ...this.form });
    },
    cancel() {
      this.$emit('cancel');
    }
  },
  watch: {
    player() {
      this.initForm();
    }
  }
};
</script>

<style scoped>
.player-form {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-actions button {
  margin-left: 10px;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: #dc3545;
}
</style>

