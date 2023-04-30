<template>
  <div class="px-8">
    <h1 class="text-5xl">Albums</h1>
    <div class="mt-4">
      <Loading v-if="loading"></Loading>
      <div v-else class="flex flex-wrap gap-4">
        <a v-for="album in albums" :key="album.id" class="btn px-6 py-4 h-full" @click="openAlbum(album)">
          {{ album.name }}
        </a>
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
    this.loading = false;
  },
  methods: {
    openAlbum(album) {
      this.$router.push({ name: 'album', params: { albumId: album.id } });
    },
  },
}
</script>
