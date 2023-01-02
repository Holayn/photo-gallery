<template>
  <div class="px-8">
    <h1 class="text-5xl">Sources</h1>
    <div class="mt-4">
      <Loading v-if="loading"></Loading>
      <div v-else class="flex flex-wrap gap-4">
        <div v-for="source in sources" :key="source.id" class="px-6 py-4 bg-orange-100 rounded-md cursor-pointer" @click="openSource(source)">
          {{ source.alias }} ({{ source.path }})
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
    openSource(source) {
      this.$router.push({ name: 'source', params: { sourceId: source.id } });
    },
  },
}
</script>
