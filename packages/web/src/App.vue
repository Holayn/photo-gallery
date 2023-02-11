<template>
  <div>
    <div>
      <header id="header" class="sticky top-0 bg-white z-40 shadow-md flex items-center gap-2 px-4 md:px-8 py-4">
        <div v-if="$store.state.isAdmin" class="flex-auto cursor-pointer">
          <svg @click="showSidebar = true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </div>
      </header>

      <router-view></router-view>
    </div>

    <nav v-if="showSidebar" class="fixed z-50 top-0 left-0 w-full h-full bg-black/25" @click="showSidebar = false">
      <div class="bg-white px-8 py-4 h-full" style="width: 256px;" @click.stop>
        <h2 class="text-3xl">Photo Gallery</h2>
        <div class="mt-4 border-t border-slate-100"></div>
        <div class="mt-4">
          <router-link :to="{ name: 'albums' }" @click="showSidebar = false">Albums</router-link>
        </div>
        <div class="mt-4">
          <router-link :to="{ name: 'sources' }" @click="showSidebar = false">Sources</router-link>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      showSidebar: false,
    }
  },
}
</script>
