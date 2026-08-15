<template>
  <div class="min-h-screen flex flex-col">
    <template v-if="authStore.isLoggedIn">
      <header class="md:sticky md:top-0 z-40 h-14 border-b bg-white flex gap-4 px-4 md:px-8 py-4">
        <div class="flex-auto"></div>
        <button @click="showRightDrawer = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </header>

      <div class="flex-auto flex">
        <nav class="sticky top-0 hidden md:block shrink-0 w-[var(--sidebar-nav-width)] border-r p-8" style="top: var(--header-height); height: calc(100vh - var(--header-height));">
          <div class="grid grid-cols-1 gap-6 text-sm">
            <div>
              <router-link class="flex items-center gap-4" :class="{ 'text-orange-500 font-bold': isAlbumsActive }" :to="{ name: 'albums' }">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                Albums
              </router-link>
            </div>
            <div>
              <router-link class="flex items-center gap-4" :class="{ 'text-orange-500 font-bold': isSourcesActive }" :to="{ name: 'sources' }">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                Sources
              </router-link>
            </div>
            <div>
              <router-link class="flex items-center gap-4" :class="{ 'text-orange-500 font-bold': isMemoriesActive }" :to="{ name: 'memories' }">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Memories
              </router-link>
            </div>
            <div>
              <button class="flex items-center gap-4" @click="startExplore">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                Explore
              </button>
            </div>
          </div>
        </nav>

        <div class="flex-auto">
          <router-view></router-view>
        </div>
      </div>

      <div class="sticky bottom-0 z-20 md:hidden w-full border-t py-1 px-1 bg-white" style="height: var(--mobile-nav-footer-height);">
        <div class="grid grid-cols-4 gap-1">
          <button class="rounded p-2 flex flex-col items-center gap-1" :class="{ 'text-orange-500 font-bold': isAlbumsActive }" @click="$router.push({ name: 'albums' })">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            <div class="text-xs">Albums</div>
          </button>
          <button class="rounded p-2 flex flex-col items-center gap-1" :class="{ 'text-orange-500 font-bold': isSourcesActive }" @click="$router.push({ name: 'sources' })">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <div class="text-xs">Sources</div>
          </button>
          <button class="rounded p-2 flex flex-col items-center gap-1" :class="{ 'text-orange-500 font-bold': isMemoriesActive }" @click="$router.push({ name: 'memories' })">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <div class="text-xs">Memories</div>
          </button>
          <button class="rounded p-2 flex flex-col items-center gap-1" @click="startExplore">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
            <div class="text-xs">Explore</div>
          </button>
        </div>
      </div>
      
      <nav v-if="showRightDrawer" class="fixed z-50 top-0 w-full h-full bg-black/25" @click="showRightDrawer = false">
        <div class="bg-white px-8 py-4 h-full absolute right-0 w-[var(--sidebar-nav-width)]" @click.stop>
          <div class="mt-4">
            <button @click="logout">Logout</button>
          </div>
        </div>
      </nav>
    </template>
    <template v-else>
      <div class="flex-auto">
        <div class="h-full pt-8 pb-24 md:pt-6 md:pb-6" style="--header-height: 0">
          <router-view></router-view>  
        </div>
      </div>
    </template>

    <Explore v-if="showExplore" @close="showExplore = false" @restart="onExploreRestart"></Explore>

    <Toast></Toast>
  </div>
</template>

<script>
import Toast from './components/Toast.vue';
import { logout } from './services/api';
import { useAuthStore } from './store';
import { redirectToLogin } from './utils.js';
import Explore from './views/Explore.vue';

export default {
  name: 'App',
  components: {
    Toast,
    Explore,
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      showLeftDrawer: false,
      showRightDrawer: false,

      showExplore: false,
    }
  },
  computed: {
    isAlbumsActive() {
      return this.$route.path.includes('album');
    },
    isSourcesActive() {
      return this.$route.path.includes('source');
    },
    isMemoriesActive() {
      return this.$route.path.includes('memories');
    },
  },
  methods: {
    async logout() {
      await logout();
      redirectToLogin();
    },
    startExplore() {
      this.showExplore = true;
      this.showLeftDrawer = false;
    },
    async onExploreRestart() {
      this.showExplore = false;
      await this.$nextTick();
      this.showExplore = true;
    },
  }
}
</script>
