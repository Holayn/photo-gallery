<template>
  <div class="px-8">
    <h1 class="text-5xl">Sources</h1>
    <div class="mt-4">
      <Loading v-if="loading"></Loading>
      <div v-else class="grid gap-4 w-full min-w-0">
        <div v-for="source in sources" :key="source.id" class="flex flex-wrap gap-8 px-6 py-4 bg-orange-100 rounded-md">
          <p class="flex-auto">{{ source.alias }} ({{ source.path }})</p>
          <div class="flex gap-4">
            <button @click="openSource(source)">View All</button>
            <button  @click="openSource(source, true)">View By Directory</button>
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
