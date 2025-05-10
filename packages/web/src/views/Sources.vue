<template>
  <div class="px-8">
    <h1 class="text-5xl">Sources</h1>
    <div class="mt-4">
      <Loading v-if="loading" class="w-16 h-16"></Loading>
      <div v-else class="grid grid-cols-2 md:flex md:flex-wrap gap-2">
        <div v-for="source in sources" :key="source.id" class="w-full md:w-auto">
          <button class="p-1 bg-slate-100 rounded-md w-full" @click="openSource(source)">
            <div class="md:w-64 md:h-64">
              <div v-if="sourceCovers[source.id]" class="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                <div v-for="photo in sourceCovers[source.id]" :key="photo" class="relative">
                  <div v-if="!loadedImages[photo]" class="flex justify-center items-center w-full h-full py-4">
                    <Loading class="w-8 h-8"></Loading>
                  </div>
                  <img class="rounded-sm w-full h-full" :class="{ 'hidden': !loadedImages[photo] }" :src="photo" @load="imgLoad(photo)">
                </div>
              </div>
              <div v-else class="flex h-full items-center justify-center">
                <Loading class="w-8 h-8 my-4"></Loading>
              </div>
            </div>
            <div class="break-all">{{ source.alias }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';

import { getSources, getSourceCover, PHOTO_SIZES } from '../services/api';

export default {
  name: 'Sources',
  components: {
    Loading,
  },
  data() {
    return {
      sources: [],
      sourceCovers: {},
      loading: true,
      loadedImages: {},
    };
  },
  async mounted() {
    this.sources = await getSources();
    this.sources.sort((a, b) => b.alias.localeCompare(a.alias));
    this.loading = false;

    await Promise.all(this.sources.map(async (source) => {
      const { photos } = await getSourceCover(source.id);
      this.sourceCovers[source.id] = photos.map(photo => photo.urls.view[PHOTO_SIZES.THUMB]);
    }));
  },
  methods: {
    openSource(source, directory) {
      if (directory) {
        this.$router.push({ name: 'sourceDirectories', params: { sourceId: source.id } });
      } else {
        this.$router.push({ name: 'source', params: { sourceId: source.id } });
      }
    },
    imgLoad(photo) {
      this.loadedImages[photo] = true;
    },
  },
}
</script>
