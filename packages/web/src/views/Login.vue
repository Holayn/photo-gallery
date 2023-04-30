<template>
  <div class="flex flex-col items-center px-4 md:px-8">
    <form class="mt-8 max-w-lg">
      <label for="password">Password</label>
      <input id="password" class="input w-full mt-1" v-model="password" type="password">
      <div class="mt-4">
        <button class="btn w-full" type="submit" @click="login">Login</button>
      </div>
    </form>
    <Loading v-if="loading"></Loading>
    <p v-if="isBadLogin" class="mt-2">Incorrect password.</p>
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
  data() {
    return {
      isBadLogin: false,
      loading: false,
      password: null,
    };
  },
  methods: {
    async login() {
      if (this.password !== null) {
        this.isBadLogin = false;
        this.loading = true;
        const { data, error } = await auth(this.password);
        if (error || data && data.success === false) {
          this.isBadLogin = true;
        } else {
          this.$store.dispatch('setIsAdmin', true);
          this.$router.push({ name: 'home' });
        }
        this.loading = false;
      }
    }
  }
}
</script>