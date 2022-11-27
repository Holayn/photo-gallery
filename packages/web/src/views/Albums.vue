<template>
  <div class="px-8">
    <h1 class="text-5xl">Albums</h1>
    <Loading v-if="loading"></Loading>
    <div v-else class="flex flex-wrap gap-4">
      <div v-for="album in albums" :key="album.id" class="px-6 py-4 bg-orange-100 rounded-md cursor-pointer">
        <div @click="openAlbum(album)">{{ album.name }}</div>
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
  computed: {
  },
  watch: {
  },
  async mounted() {
    this.albums = await getAlbums();
    this.$store.dispatch('setAlbums', this.albums);
    this.loading = false;
  },
  methods: {
    openAlbum(album) {
      this.$router.push({ name: 'gallery', params: { albumId: album.id } });
    },
  },
}
</script>
