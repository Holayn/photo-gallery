<template>
  <Modal size="md" @close="$emit('close')">
    <div>
      <h2 class="text-xl font-semibold mb-4">Create Source</h2>

      <form class="space-y-3" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium mb-1">Source files path</label>
          <input
            v-model="sourceFilesPath"
            type="text"
            class="w-full border rounded px-2 py-1"
            placeholder="/path/to/photos"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Alias</label>
          <input
            v-model="alias"
            type="text"
            class="w-full border rounded px-2 py-1"
            placeholder="my-source"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Exclude (comma-separated, optional)</label>
          <input
            v-model="exclude"
            type="text"
            class="w-full border rounded px-2 py-1"
            placeholder="thumbs, .DS_Store"
          >
        </div>

        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            class="btn disabled:opacity-50"
            :disabled="!sourceFilesPath || !alias || creating"
          >
            {{ creating ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script>
import Modal from './Modal.vue';
import { createSource } from '../services/api';

export default {
  name: 'CreateSourceModal',
  components: {
    Modal,
  },
  emits: ['close', 'created'],
  data() {
    return {
      sourceFilesPath: '',
      alias: '',
      exclude: '',
      creating: false,
      error: null,
    };
  },
  methods: {
    async submit() {
      this.creating = true;
      this.error = null;
      try {
        const exclude = this.exclude
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const { id } = await createSource(this.sourceFilesPath, this.alias, exclude);
        this.$emit('created', { id });
      } catch (e) {
        this.error = e.description || 'Failed to create source.';
      } finally {
        this.creating = false;
      }
    },
  },
};
</script>
