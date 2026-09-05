<template>
  <div class="px-6 py-4">
    <div class="mb-2">
      <button class="text-lg flex items-center gap-1" @click="$router.push({ name: 'memories' })">
        Memories
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>

    <MemoriesList layout="row"></MemoriesList>

    <div class="mt-6 mb-2">
      <div class="text-lg">Recently Updated</div>
    </div>

    <Loading v-if="loading" class="w-16 h-16"></Loading>
    <div v-else-if="error" class="text-red-500">Failed to load recently updated albums</div>
    <div v-else-if="!recentAlbums.length">No recently updated albums</div>
    <div v-else class="flex gap-2 overflow-x-auto pb-2">
      <div v-for="album in recentAlbums" :key="album.id" class="w-32 shrink-0">
        <CollectionTile :covers="albumCovers[album.id]?.items" :error="!!albumCovers[album.id]?.error" @click="openAlbum(album)">
          <div class="break-word text-left text-sm text-gray-800">{{ album.name }}</div>
          <div class="text-left text-xs text-gray-500">{{ formatModifiedDate(album.modifiedDate) }}</div>
        </CollectionTile>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import MemoriesList from '../components/MemoriesList.vue';
import CollectionTile from '../components/CollectionTile.vue';
import Loading from '../components/Loading.vue';
import { getRecentlyUpdatedAlbums, getAlbumCover } from '../services/api';

dayjs.extend(relativeTime);

export default {
  name: 'Photos',
  components: {
    MemoriesList,
    CollectionTile,
    Loading,
  },
  data() {
    return {
      recentAlbums: [],
      albumCovers: {},
      loading: true,
      error: false,
    };
  },
  async mounted() {
    try {
      this.recentAlbums = await getRecentlyUpdatedAlbums();
    } catch (e) {
      this.error = true;
    } finally {
      this.loading = false;
    }

    await Promise.all(this.recentAlbums.map(async (album) => {
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
    formatModifiedDate(modifiedDate) {
      return dayjs(modifiedDate).fromNow();
    },
    openAlbum(album) {
      this.$router.push({ name: 'album', params: { albumId: album.id } });
    },
  },
}
</script>
