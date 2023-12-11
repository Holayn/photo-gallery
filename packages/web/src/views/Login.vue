<template>
  <div class="flex flex-col items-center px-4 md:px-8">
    <form class="mt-8 max-w-lg" @submit.prevent="login">
      <div>
        <label for="username" class="mb-1">Username</label>
        <input id="username" class="input w-full" v-model="username">
      </div>

      <div class="mt-2">
        <label for="password" class="mb-1">Password</label>
        <input id="password" class="input w-full" v-model="password" type="password">
      </div>
      
      <div class="mt-4">
        <button class="btn w-full" type="submit">Login</button>
      </div>
    </form>
    <Loading v-if="loading" class="w-16 h-16"></Loading>
    <p v-if="isBadLogin" class="mt-2">Incorrect username or password.</p>
  </div>
</template>
<script>
import Loading from '../components/Loading.vue';

import { auth } from '../services/api';

export default {
  name: 'Login',
  components: {
    Loading,
  },
  props: {
    next: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      isBadLogin: false,
      loading: false,
      username: null,
      password: null,
    };
  },
  methods: {
    async login() {
      if (this.username && this.password) {
        this.isBadLogin = false;
        this.loading = true;
        const { data, error } = await auth(this.username, this.password);
        if (error || (data && data.success === false)) {
          this.isBadLogin = true;
        } else {
          this.$store.dispatch('setIsAdmin', true);

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