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
    <div v-else-if="error" class="text-red-500">Failed to load recently updated collections</div>
    <div v-else-if="!recentCollections.length">No recently updated collections</div>
    <div v-else class="flex gap-2 overflow-x-auto pb-2">
      <div v-for="collection in recentCollections" :key="collectionKey(collection)" class="w-32 shrink-0">
        <CollectionTile :covers="collectionCovers[collectionKey(collection)]?.items" :error="!!collectionCovers[collectionKey(collection)]?.error" @click="openCollection(collection)">
          <div class="break-word text-left text-sm text-gray-800">{{ collection.name }}</div>
          <div class="text-left text-xs text-gray-500">{{ formatUpdatedDate(collection.updatedDate) }}</div>
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
import { getRecentlyUpdatedCollections, getAlbumCover, getSourceCover } from '../services/api';

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
      recentCollections: [],
      collectionCovers: {},
      loading: true,
      error: false,
    };
  },
  async mounted() {
    try {
      this.recentCollections = await getRecentlyUpdatedCollections();
    } catch (e) {
      this.error = true;
    } finally {
      this.loading = false;
    }

    await Promise.all(this.recentCollections.map(async (collection) => {
      const key = this.collectionKey(collection);
      this.collectionCovers[key] = {
        loading: true,
      };

      try {
        const { photos } = collection.type === 'source'
          ? await getSourceCover(collection.id)
          : await getAlbumCover(collection.id);
        this.collectionCovers[key].items = photos;
      } catch (e) {
        this.collectionCovers[key].error = true;
      }
    }));
  },
  methods: {
    collectionKey(collection) {
      return `${collection.type}:${collection.id}`;
    },
    formatUpdatedDate(updatedDate) {
      return dayjs(updatedDate).fromNow();
    },
    openCollection(collection) {
      if (collection.type === 'source') {
        this.$router.push({ name: 'source', params: { sourceId: collection.id } });
      } else {
        this.$router.push({ name: 'album', params: { albumId: collection.id } });
      }
    },
  },
}
</script>
