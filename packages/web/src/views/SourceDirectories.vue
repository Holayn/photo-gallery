<template>
  <div class="px-8">
    <div v-if="loadingSourceInfo">
      <Loading></Loading>
    </div>
    <div v-else>
      <h1 class="text-5xl">Directories ({{ source?.alias }})</h1>
      <div class="mt-4 pb-4">
        <Loading v-if="loadingDirectories"></Loading>
        <div v-else class="flex gap-2">
          <a v-for="directory in directories" :key="directory.id" class="btn px-6 py-2 h-full" @click="openSourceDirectory(directory)">
            {{ directory }}
          </a>
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
