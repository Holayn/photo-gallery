<template>
  <div class="px-8">
    <h1 class="text-5xl">Albums</h1>
    <div class="mt-4">
      <Loading v-if="loading" class="w-16 h-16"></Loading>
      <div v-else class="grid gap-2">
        <div v-for="album in albums" :key="album.id">
          <button class="py-2 px-4 bg-slate-50 flex w-full text-left" @click="openAlbum(album)">
            <div class="flex-auto">{{ album.name }}</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';

import { getAlbums } from '../services/api';

export default {
  name: 'Albums',
  components: {
    Loading,
  },
  data() {
    return {
      albums: [],
      loading: true,
    };
  },
  async mounted() {
    this.albums = await getAlbums();
    this.albums.sort((a, b) => a.name.localeCompare(b.name));
    this.loading = false;
  },
  methods: {
    openAlbum(album) {
      this.$router.push({ name: 'album', params: { albumId: album.id } });
    },
  },
}
</script>
