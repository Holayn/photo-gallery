<template>
  <Modal size="md" @close="$emit('close')">
    <div>
      <h2 class="text-xl font-semibold mb-4">Manage Users for "{{ album.name }}"</h2>

      <div v-if="loading" class="flex justify-center py-4">
        <Loading class="w-8 h-8"></Loading>
      </div>

      <div v-else>
        <div class="mb-4">
          <h3 class="font-medium mb-2">Assigned Users</h3>
          <div v-if="albumUsers.length === 0" class="text-gray-500 text-sm">
            No other users assigned yet
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="user in albumUsers"
              :key="user.id"
              class="flex items-center justify-between bg-gray-100 px-3 py-2 rounded"
            >
              <span>{{ user.name }}</span>
              <span v-if="this.album.createdBy === user.id">(creator)</span>
              <button
                v-if="this.album.createdBy !== user.id"
                class="text-red-600 hover:text-red-800 text-sm"
                :disabled="removing === user.id"
                @click="removeUser(user)"
              >
                <span v-if="removing === user.id">Removing...</span>
                <span v-else>Remove</span>
              </button>
            </div>
          </div>
        </div>

        <div class="border-t pt-4">
          <h3 class="font-medium mb-2">Assign Another User</h3>
          <div v-if="availableUsers.length === 0" class="text-gray-500 text-sm">
            All other users are already assigned
          </div>
          <div v-else class="flex gap-2">
            <select v-model="selectedUserId" class="flex-1 border rounded px-2 py-1">
              <option value="">Select a user...</option>
              <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
            <button
              class="btn disabled:opacity-50"
              :disabled="!selectedUserId || adding"
              @click="addUser"
            >
              {{ adding ? 'Assigning...' : 'Assign' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from './Modal.vue';
import Loading from './Loading.vue';
import { getUsers, getAlbumUsers, addAlbumUser, removeAlbumUser } from '../services/api';

export default {
  name: 'AlbumUsersModal',
  components: {
    Modal,
    Loading,
  },
  props: {
    album: {
      type: Object,
      required: true,
    },
  },
  emits: ['close', 'users-updated'],
  data() {
    return {
      loading: true,
      allUsers: [],
      albumUsers: [],
      selectedUserId: '',
      adding: false,
      removing: null,
    };
  },
  computed: {
    availableUsers() {
      const albumUserIds = new Set(this.albumUsers.map(u => u.id));
      return this.allUsers.filter(u => !albumUserIds.has(u.id) && u.id !== this.album.createdBy);
    },
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [users, albumUsers] = await Promise.all([
          getUsers(),
          getAlbumUsers(this.album.id),
        ]);
        this.allUsers = users;
        this.albumUsers = albumUsers;
        this.emitUsersUpdated();
      } catch (e) {
        console.error('Failed to load users:', e);
        alert(`Failed to load users: ${e.message}`);
      } finally {
        this.loading = false;
      }
    },
    emitUsersUpdated() {
      this.$emit('users-updated', { albumId: this.album.id, users: this.albumUsers.slice() });
    },
    async addUser() {
      if (!this.selectedUserId) return;

      this.adding = true;
      try {
        await addAlbumUser(this.album.id, this.selectedUserId);
        const user = this.allUsers.find(u => u.id === parseInt(this.selectedUserId));
        if (user) {
          this.albumUsers.push(user);
          this.emitUsersUpdated();
        }
        this.selectedUserId = '';
      } catch (e) {
        console.error('Failed to add user:', e);
        alert(`Failed to add user: ${e.message}`);
      } finally {
        this.adding = false;
      }
    },
    async removeUser(user) {
      this.removing = user.id;
      try {
        await removeAlbumUser(this.album.id, user.id);
        this.albumUsers = this.albumUsers.filter(u => u.id !== user.id);
        this.emitUsersUpdated();
      } catch (e) {
        console.error('Failed to remove user:', e);
        alert(`Failed to remove user: ${e.message}`);
      } finally {
        this.removing = null;
      }
    },
  },
};
</script>
