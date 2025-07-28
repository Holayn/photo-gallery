<template>
  <div>
    <div v-if="$store.state.isLoggedIn">
      <header class="sticky top-0 bg-white z-40 shadow-md flex gap-4 px-4 md:px-8 py-4">
        <div class="flex flex-auto">
          <button @click="showLeftDrawer = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
          </button>
        </div>
        <div id="headerAdditionalControls"></div>
        <button @click="showRightDrawer = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </header>

      <div class="py-12">
        <router-view></router-view>
      </div>
     

      <nav v-if="showLeftDrawer" class="fixed z-50 top-0 w-full h-full bg-black/25" @click="showLeftDrawer = false">
        <div class="bg-white px-8 py-4 h-full" style="width: 256px;" @click.stop>
          <div class="mt-4">
            <router-link :to="{ name: 'albums' }" @click="showLeftDrawer = false">Albums</router-link>
          </div>
          <div class="mt-4">
            <router-link :to="{ name: 'sources' }" @click="showLeftDrawer = false">Sources</router-link>
          </div>
        </div>
      </nav>
      <nav v-if="showRightDrawer" class="fixed z-50 top-0 w-full h-full bg-black/25" @click="showRightDrawer = false">
        <div class="bg-white px-8 py-4 h-full absolute right-0" style="width: 256px;" @click.stop>
          <div class="mt-4">
            <router-link :to="{ name: 'login' }" @click="logout">Logout</router-link>
          </div>
        </div>
      </nav>
    </div>
    <div v-else style="--header-height: 0">
      <div id="headerAdditionalControls" hidden></div>
      <router-view></router-view>
    </div>

    <Toast></Toast>
  </div>
</template>

<script>
import Toast from './components/Toast.vue';
import { logout } from './services/api';

export default {
  name: 'App',
  components: {
    Toast,
  },
  data() {
    return {
      showLeftDrawer: false,
      showRightDrawer: false,
    }
  },
  methods: {
    async logout() {
      await logout();
      this.showRightDrawer = false;
      this.$store.dispatch('setIsLoggedIn', false);
    }
  }
}
</script>
