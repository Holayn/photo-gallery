<template>
  <div class="px-6 py-4">
    <h1 class="mt-4 md:mt-0 mb-4 text-2xl">Albums</h1>
    <div>
      <Loading v-if="loading" class="m-auto w-24 h-24"></Loading>
      <div v-else-if="error" class="text-red-500">Failed to load albums</div>
      <div v-else class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        <div v-for="album in albums" :key="album.id" class="sm:w-60">
          <CollectionTile :covers="albumCovers[album.id]?.items" :error="!!albumCovers[album.id]?.error" @click="openAlbum(album)">
            <div class="break-word text-left text-sm text-gray-800">{{ album.name }}</div>
            <div class="text-left text-xs text-gray-500">{{ album.fileCount }} {{ album.fileCount === 1 ? 'item' : 'items' }}</div>
          </CollectionTile>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CollectionTile from '../components/CollectionTile.vue';
import Loading from '../components/Loading.vue';

import { getAlbums, getAlbumCover } from '../services/api';

export default {
  name: 'Albums',
  components: {
    CollectionTile,
    Loading,
  },
  data() {
    return {
      albums: [],
      albumCovers: {},
      loading: true,
      error: false,
    };
  },
  async mounted() {
    try {
      this.albums = await getAlbums();
    } catch (e) {
      this.error = true;
    } finally {
      this.loading = false;
    }

    await Promise.all(this.albums.map(async (album) => {
      this.albumCovers[album.id] = {
        loading: true,
      };

      try {
        const { photos } = await getAlbumCover(album.id);
        this.albumCovers[album.id].items = photos;
      } catch (e) {
        this.albumCovers[album.id].error = true;
      }
    }));
  },
  methods: {
    openAlbum(album) {
      this.$router.push({ name: 'album', params: { albumId: album.id } });
    },
  },
}
</script>
