<template>
  <div class="px-8">
    <h1 class="text-5xl">Sources</h1>
    <div class="mt-4">
      <Loading v-if="loading" class="w-16 h-16"></Loading>
      <div v-else class="grid gap-4 md:gap-2">
        <div v-for="source in sources" :key="source.id">
          <div class="flex gap-1">
            <button class="flex items-center py-2 px-4 bg-slate-50 w-full text-left" @click="openSource(source)">
              <div class="flex-auto">{{ source.alias }}</div>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </button>
            <button class="flex items-center gap-1 py-2 px-4 bg-slate-50" @click="openSource(source, true)">
              <div class="flex-auto whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';

import { getSources } from '../services/api';

export default {
  name: 'Sources',
  components: {
    Loading,
  },
  data() {
    return {
      sources: [],
      loading: true,
    };
  },
  async mounted() {
    this.sources = await getSources();
    this.sources.sort((a, b) => a.alias.localeCompare(b.alias));
    this.loading = false;
  },
  methods: {
    openSource(source, directory) {
      if (directory) {
        this.$router.push({ name: 'sourceDirectories', params: { sourceId: source.id } });
      } else {
        this.$router.push({ name: 'source', params: { sourceId: source.id } });
      }
    },
  },
}
</script>
