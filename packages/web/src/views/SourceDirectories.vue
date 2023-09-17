<template>
  <div class="px-8">
    <div v-if="loadingSourceInfo">
      <Loading></Loading>
    </div>
    <div v-else>
      <h1 class="flex flex-col">
        <div class="text-5xl">Directories</div>
        <div class=text-xl>({{ source?.alias }})</div>
      </h1>
      <div class="mt-4 pb-4">
        <Loading v-if="loadingDirectories"></Loading>
        <div v-else class="grid gap-2">
          <button v-for="directory in directories" :key="directory.id" class="flex items-center py-2 px-4 bg-slate-50 w-full text-left" @click="openSourceDirectory(directory)">
            <div class="flex-auto">{{ directory }}</div>
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';

import { getSource, getSourceDirectories } from '../services/api';

export default {
  name: 'SourceDirectory',
  components: {
    Loading,
  },
  props: {
    sourceId: String,
  },
  data() {
    return {
      loadingSourceInfo: false,
      loadingDirectories: false,

      directories: [],
      source: null,
    };
  },
  async mounted() {
    this.loadingSourceInfo = true;
    this.loadingDirectories = true;
    
    try {
      getSource(this.sourceId).then(source => {
        this.source = source;
        this.loadingSourceInfo = false;
        document.title = this.source.alias;
      });

      getSourceDirectories(this.sourceId).then(directories => {
        this.directories = directories;
        this.directories.sort((a, b) => {
          const splitA = a.split('/');
          const splitB = b.split('/');

          if (splitA.length > splitB.length) {
            return 1;
          } else if (splitA.length < splitB.length) {
            return -1;
          } else {
            for (const i in splitA) {
              if (splitA[i] !== splitB[i]) {
                return splitA[i].localeCompare(splitB[i]);
              }
            }
          }
        });
        this.loadingDirectories = false;
      });
    } catch(e) {
      alert('An error occurred.');
      throw e;
    }
  },
  methods: {
    openSourceDirectory(directory) {
      this.$router.push({ name: 'source', params: { sourceId: this.source.id, directory } });
    },
  },
}
</script>
