<template>
  <div class="flex flex-col items-center px-4 md:px-8">
    <form class="mt-8 max-w-lg" @submit.prevent="onSubmit">
      <div>
        <label for="code" class="mb-1">Code</label>
        <input id="code" class="input w-full" v-model="code">
        <div>This code is valid for 1 minute.</div>
      </div>

      <div class="mt-4">
        <button class="btn w-full" type="submit">Verify</button>
      </div>
    </form>
    <Loading v-if="loading" class="w-16 h-16"></Loading>
    <p v-if="error" class="mt-2">{{ error }}</p>
  </div>
</template>
<script>
import Loading from '../components/Loading.vue';

import { auth2FA } from '../services/api';
import { useAuthStore } from '../store';

export default {
  name: '2FA',
  components: {
    Loading,
  },
  props: {
    next: {
      type: String,
      default: null,
    },
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      loading: false,
      code: null,
      error: null,
    };
  },
  methods: {
    async onSubmit() {
      if (this.code) {
        this.error = null;
        this.loading = true;
        const { data, error } = await auth2FA(this.code);
        if (data && data.success === false) {
          this.error = 'Failed';
        } else if (error) {
          this.error = 'Error';
        } else {
          this.authStore.setIsLoggedIn(true);

          if (this.next !== null) {
            this.$router.push({ path: this.next });
          } else {
            this.$router.push({ name: 'home' });
          }
        }
        this.loading = false;
      }
    }
  }
}
</script>