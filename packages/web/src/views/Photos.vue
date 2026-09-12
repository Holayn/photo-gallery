<template>
  <div class="px-6 py-4">
    <div class="mb-2">
      <button class="text-lg flex items-center gap-1" @click="$router.push({ name: 'memories' })">
        Memories
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>

    <MemoriesList layout="row"></MemoriesList>

    <div class="mt-4 mb-2">
      <div class="text-lg">Recently Updated</div>
    </div>

    <Loading v-if="loading" class="w-16 h-16"></Loading>
    <div v-else-if="error" class="text-red-500">Failed to load recently updated collections</div>
    <div v-else-if="!recentCollections.length">No recently updated collections</div>
    <div v-else class="flex gap-2 overflow-x-auto">
      <div v-for="collection in recentCollections" :key="collectionKey(collection)" class="w-32 md:w-60 shrink-0">
        <CollectionTile :covers="collectionCovers[collectionKey(collection)]?.items" :error="!!collectionCovers[collectionKey(collection)]?.error" @click="openCollection(collection)">
          <div class="break-word text-left text-sm text-gray-800">{{ collection.name }}</div>
          <div class="text-left text-xs text-gray-500">{{ formatUpdatedDate(collection.updatedDate) }}</div>
        </CollectionTile>
      </div>
    </div>

    <div class="mt-4 mb-2">
      <div class="text-lg">Photo of the Day</div>
    </div>

    <Loading v-if="photoOfDayLoading" class="w-16 h-16"></Loading>
    <div v-else-if="photoOfDayError" class="text-red-500">Failed to load photo of the day</div>
    <div v-else-if="!photoOfDay">No photo of the day</div>
    <div v-else class="w-32 md:w-60">
      <button class="w-full p-1 bg-slate-100 rounded-md" style="aspect-ratio: 1/1;" @click="showPhotoOfDay = true">
        <img class="w-full h-full object-cover rounded-sm" :src="photoOfDay.urls.view[PHOTO_SIZES.THUMB]">
      </button>
    </div>

    <Lightbox
      v-if="showPhotoOfDay"
      :photos="[photoOfDay]"
      :index="0"
      :is-selection-mode="false"
      :selected="{}"
      @close="showPhotoOfDay = false"
    ></Lightbox>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import MemoriesList from '../components/MemoriesList.vue';
import CollectionTile from '../components/CollectionTile.vue';
import Lightbox from '../components/Lightbox.vue';
import Loading from '../components/Loading.vue';
import { getRecentlyUpdatedCollections, getAlbumCover, getSourceCover, getPhotoOfDay, PHOTO_SIZES } from '../services/api';

dayjs.extend(relativeTime);

export default {
  name: 'Photos',
  components: {
    MemoriesList,
    CollectionTile,
    Lightbox,
    Loading,
  },
  data() {
    return {
      PHOTO_SIZES,
      recentCollections: [],
      collectionCovers: {},
      loading: true,
      error: false,
      photoOfDay: null,
      photoOfDayLoading: true,
      photoOfDayError: false,
      showPhotoOfDay: false,
    };
  },
  async mounted() {
    await Promise.all([
      this.loadRecentCollections(),
      this.loadPhotoOfDay(),
    ]);
  },
  methods: {
    async loadRecentCollections() {
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
    async loadPhotoOfDay() {
      try {
        this.photoOfDay = await getPhotoOfDay();
      } catch (e) {
        this.photoOfDayError = true;
      } finally {
        this.photoOfDayLoading = false;
      }
    },
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
