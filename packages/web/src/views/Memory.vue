<template>
  <div v-if="error" class="px-6 py-4 text-red-500">Failed to load memory</div>
  <Gallery v-else-if="memory" :id="'memory' + memory.year" :show-lightbox="showLightbox" :sortable="false" :default-sort="SORT_TYPES.DATE_ASC" :photos="photos">
    <template #heading>
      <h1 class="text-xl md:text-2xl">
        {{ getYearsAgo(memory.year) }} {{ getYearsAgo(memory.year) === 1 ? 'year' : 'years' }} ago
      </h1>
    </template>
  </Gallery>
</template>

<script>
import Gallery, { SORT_TYPES } from './Gallery.vue';
import Photo from '../model/photo';
import { getMemories, getSources } from '../services/api';
import dayjs from 'dayjs';
import { setDocumentTitle } from '../utils';

export default {
  name: 'Memory',
  components: {
    Gallery,
  },
  props: {
    year: {
      type: [String, Number],
      required: true,
    },
    showLightbox: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      memory: null,
      photos: [],
      sources: [],
      error: false,
      SORT_TYPES,
    };
  },
  watch: {
    year() {
      this.loadMemory();
    },
  },
  async mounted() {
    await this.loadMemory();
  },
  methods: {
    async loadMemory() {
      try {
        const [memories, sources] = await Promise.all([
          getMemories(this.year),
          getSources(),
        ]);
        this.sources = sources;

        this.memory = memories.years[0] || null;

        if (this.memory) {
          this.photos = this.getMemoryPhotos(this.memory);
          setDocumentTitle(`${this.getYearsAgo(this.memory.year)} ${this.getYearsAgo(this.memory.year) === 1 ? 'year' : 'years'} ago`);
        } else {
          this.photos = [];
        }
      } catch (e) {
        console.error(e);
        this.error = true;
      }
    },
    getMemoryPhotos({ files }) {
      return files.map(file => new Photo({ ...file, source: this.sources.find(s => s.id === file.sourceId) }));
    },
    getYearsAgo(year) {
      return dayjs().year() - year;
    },
  },
}
</script>
