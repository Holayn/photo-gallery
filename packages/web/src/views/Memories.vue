<template>
  <template v-if="memory">
    <div class="px-8 mb-2">
      <router-link to="/memories" class="underline">Memories</router-link>
    </div>
    <Gallery :id="'memory' + memory.year" :show-lightbox="showLightbox" :sortable="false" :default-sort="SORT_TYPES.DATE_ASC" :photos="photos">
      <template #heading>
        <h1 class="text-3xl md:text-5xl">
          {{ getYearsAgo(memory.year) }} {{ getYearsAgo(memory.year) === 1 ? 'year' : 'years' }} ago
        </h1>
      </template>
    </Gallery>
  </template>
  <template v-else>
    <div class="px-8">
      <h1 class="text-5xl">Memories</h1>
      <div class="mt-4">
        <Loading v-if="loading" class="w-16 h-16"></Loading>
        <div v-else-if="error" class="text-red-500">Failed to load memories</div>
        <template v-else>
          <div v-if="!memories.years.length">No memories found</div>
          <div v-else class="flex flex-wrap gap-2">
            <div v-for="memory in memories.years" :key="memory.year" class="min-w-32 max-w-60" style="width: calc(50% - 0.5rem);">
              <button class="p-1 bg-slate-100 rounded-md w-full" @click="openMemory(memory)">
                <div>
                  <div v-if="memoryCovers[memory.year]" class="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                    <div v-for="photo in memoryCovers[memory.year]" :key="photo" class="relative">
                      <div v-if="errorImages[photo]" class="flex justify-center items-center w-full h-full py-4">
                        <div>:(</div>
                      </div>
                      <div v-else-if="!loadedImages[photo]" class="flex justify-center items-center w-full h-full py-4">
                        <Loading class="w-8 h-8"></Loading>
                      </div>
                      <img class="rounded-sm w-full object-cover" :class="{ 'hidden': !loadedImages[photo] }" :src="photo" style="aspect-ratio: 1/1;" @load="imgLoad(photo)" @error="imgError(photo)">
                    </div>
                  </div>
                  <div v-else-if="errorMemories[memory.year]" class="flex h-full items-center justify-center">
                    <div class="text-red-500">Failed to load cover</div>
                  </div>
                  <div v-else class="flex h-full items-center justify-center">
                    <Loading class="w-8 h-8 my-4"></Loading>
                  </div>
                </div>
                <div class="break-word">{{ getYearsAgo(memory.year) }} {{ getYearsAgo(memory.year) === 1 ? 'year' : 'years' }} ago</div>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </template>
</template>

<script>
import Loading from '../components/Loading.vue';
import PhotoGrid from '../components/PhotoGrid.vue';
import Gallery, { SORT_TYPES } from './Gallery.vue';
import Photo from '../model/photo';
import { getMemories, PHOTO_SIZES, getSources } from '../services/api';
import dayjs from 'dayjs';
import { setDocumentTitle } from '../utils';

export default {
  name: 'Memories',
  components: {
    Loading,
    PhotoGrid,
    Gallery,
  },
  props: {
    showLightbox: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      memories: null,
      memory: null,
      photos: [],
      memoryCovers: {},
      loading: true,
      loadedImages: {},
      error: false,
      errorImages: {},
      errorMemories: {},
      sources: [],
      SORT_TYPES,
    };
  },
  watch: {
    '$route.query.year'() {
      this.syncMemoryFromRoute();
    },
    memories() {
      this.syncMemoryFromRoute();
    },
  },
  async mounted() {
    try {
      const [memories, sources] = await Promise.all([
         getMemories(),
         getSources(),
      ]);
      this.sources = sources;
      this.memories = memories;
      
      await Promise.all(this.memories.years.map(async (memory) => {
        try {
          const photos = this.getMemoryPhotos(memory);
          this.memoryCovers[memory.year] = photos.slice(0, 4).map(photo => photo.urls.view[PHOTO_SIZES.THUMB]);
        } catch (e) {
          this.errorMemories[memory.year] = true;
        }
      }));
    } catch (e) {
      console.error(e);
      this.error = true;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    syncMemoryFromRoute() {
      if (!this.memories) {
        return;
      }

      const yearParam = this.$route.query.year;
      if (!yearParam) {
        this.memory = null;
        return;
      }

      const year = Number(yearParam);
      const selected = this.memories.years.find(memory => Number(memory.year) === year);
      this.memory = selected || null;

      if (this.memory) {
        this.photos = this.getMemoryPhotos(this.memory);

        setDocumentTitle(`${this.getYearsAgo(this.memory.year)} ${this.getYearsAgo(this.memory.year) === 1 ? 'year' : 'years'} ago`);
      } else {
        this.photos = [];
      }
    },
    getMemoryPhotos({ files }) {
      return files.map(file => new Photo({ ...file, source: this.sources.find(s => s.id === file.sourceId) }));
    },
    getYearsAgo(year) {
      return dayjs().year() - year;
    },
    openMemory(memory) {
      if (!memory || !memory.year) {
        return;
      }

      if (Number(this.$route.query.year) === Number(memory.year)) {
        this.memory = memory;
        return;
      }

      this.$router.push({
        name: 'memories',
        query: {
          year: memory.year,
        },
      });
    },
    imgLoad(photo) {
      this.loadedImages[photo] = true;
    },
    imgError(photo) {
      this.errorImages[photo] = true;
    },
  },
}
</script>
