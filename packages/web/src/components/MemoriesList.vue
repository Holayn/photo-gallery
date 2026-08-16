<template>
  <Loading v-if="loading" class="w-16 h-16"></Loading>
  <div v-else-if="error" class="text-red-500">Failed to load memories</div>
  <div v-else-if="!memories.years.length">No memories found</div>
  <div v-else :class="containerClass">
    <div v-for="memory in memories.years" :key="memory.year" :class="itemClass" :style="itemStyle">
      <CollectionTile :covers="memoryCovers[memory.year]" :error="!!errorMemoryCovers[memory.year]" @click="openMemory(memory)">
        <div class="break-word text-left text-sm text-gray-800">{{ getYearsAgo(memory.year) }} {{ getYearsAgo(memory.year) === 1 ? 'year' : 'years' }} ago</div>
        <div class="text-left text-xs text-gray-500">{{ memory.count }} {{ memory.count === 1 ? 'item' : 'items' }}</div>
      </CollectionTile>
    </div>
  </div>
</template>

<script>
import CollectionTile from './CollectionTile.vue';
import Loading from './Loading.vue';
import { getMemoriesCovers, PHOTO_SIZES } from '../services/api';
import dayjs from 'dayjs';

export default {
  name: 'MemoriesList',
  components: {
    CollectionTile,
    Loading,
  },
  props: {
    layout: {
      type: String,
      default: 'grid',
      validator: (value) => ['grid', 'row'].includes(value),
    },
  },
  data() {
    return {
      memories: null,
      memoryCovers: {},
      loading: true,
      error: false,
      errorMemoryCovers: {},
    };
  },
  computed: {
    containerClass() {
      return this.layout === 'row' ? 'flex gap-2 overflow-x-auto pb-2' : 'flex flex-wrap gap-2';
    },
    itemClass() {
      return this.layout === 'row' ? 'w-32 shrink-0' : 'min-w-32 max-w-60';
    },
    itemStyle() {
      return this.layout === 'row' ? {} : { width: 'calc(50% - 0.5rem)' };
    },
  },
  async mounted() {
    try {
      this.memories = await getMemoriesCovers();

      this.memories.years.forEach(memory => {
        try {
          this.memoryCovers[memory.year] = memory.files.map(file => file.urls.view[PHOTO_SIZES.THUMB]);
        } catch (e) {
          this.errorMemoryCovers[memory.year] = true;
        }
      });
    } catch (e) {
      console.error(e);
      this.error = true;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    getYearsAgo(year) {
      return dayjs().year() - year;
    },
    openMemory(memory) {
      this.$router.push({ name: 'memory', params: { year: memory.year } });
    },
  },
}
</script>
