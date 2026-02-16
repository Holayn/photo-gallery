<template>
  <Modal size="md" @close="$emit('close')">
    <div>
      <h2 class="text-xl font-semibold mb-4">Manage Users for {{ source.alias }}</h2>
      
      <div v-if="loading" class="flex justify-center py-4">
        <Loading class="w-8 h-8"></Loading>
      </div>
      
      <div v-else>
        <!-- Current Users -->
        <div class="mb-4">
          <h3 class="font-medium mb-2">Current Users</h3>
          <div v-if="sourceUsers.length === 0" class="text-gray-500 text-sm">
            No users assigned to this source
          </div>
          <div v-else class="space-y-2">
            <div 
              v-for="user in sourceUsers" 
              :key="user.id" 
              class="flex items-center justify-between bg-gray-100 px-3 py-2 rounded"
            >
              <span>{{ user.name }}</span>
              <button 
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
        
        <!-- Add User -->
        <div class="border-t pt-4">
          <h3 class="font-medium mb-2">Add User</h3>
          <div v-if="availableUsers.length === 0" class="text-gray-500 text-sm">
            All users are already assigned
          </div>
          <div v-else class="flex gap-2">
            <select v-model="selectedUserId" class="flex-1 border rounded px-2 py-1">
              <option value="">Select a user...</option>
              <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
            <button 
              class="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              :disabled="!selectedUserId || adding"
              @click="addUser"
            >
              {{ adding ? 'Adding...' : 'Add' }}
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
import { getUsers, getSourceUsers, addSourceUser, removeSourceUser } from '../services/api';

export default {
  name: 'SourceUsersModal',
  components: {
    Modal,
    Loading,
  },
  props: {
    source: {
      type: Object,
      required: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      loading: true,
      allUsers: [],
      sourceUsers: [],
      selectedUserId: '',
      adding: false,
      removing: null,
    };
  },
  computed: {
    availableUsers() {
      const sourceUserIds = new Set(this.sourceUsers.map(u => u.id));
      return this.allUsers.filter(u => !sourceUserIds.has(u.id));
    },
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [users, sourceUsers] = await Promise.all([
          getUsers(),
          getSourceUsers(this.source.id),
        ]);
        this.allUsers = users;
        this.sourceUsers = sourceUsers;
      } catch (e) {
        console.error('Failed to load users:', e);
      } finally {
        this.loading = false;
      }
    },
    async addUser() {
      if (!this.selectedUserId) return;
      
      this.adding = true;
      try {
        await addSourceUser(this.source.id, this.selectedUserId);
        const user = this.allUsers.find(u => u.id === parseInt(this.selectedUserId));
        if (user) {
          this.sourceUsers.push(user);
        }
        this.selectedUserId = '';
      } catch (e) {
        console.error('Failed to add user:', e);
        alert('Failed to add user');
      } finally {
        this.adding = false;
      }
    },
    async removeUser(user) {
      this.removing = user.id;
      try {
        await removeSourceUser(this.source.id, user.id);
        this.sourceUsers = this.sourceUsers.filter(u => u.id !== user.id);
      } catch (e) {
        console.error('Failed to remove user:', e);
        alert('Failed to remove user');
      } finally {
        this.removing = null;
      }
    },
  },
};
</script>
