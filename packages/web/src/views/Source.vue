<template>
  <div class="px-8 mb-2">
    <router-link to="/sources" class="underline">Sources</router-link>
  </div>

  <div v-if="loadingSourceInfo" class="flex justify-center px-8">
    <Loading class="w-16 h-16"></Loading>
  </div>
  <div v-else-if="source && !source.processed" class="px-8">
    <h1 class="text-3xl md:text-5xl mb-4">{{ title }}</h1>
    <div v-if="processing" class="flex flex-col items-center gap-2 py-8">
      <Loading class="w-16 h-16"></Loading>
      <div>Source is processing...</div>
    </div>
    <div v-else class="py-8">
      Source is processing, come back later.
    </div>
  </div>
  <Gallery v-else :id="sourceId" :show-date-selection="true" :show-lightbox="showLightbox" :photos="photos" @date="onDateUpdate($event)" @reset="photos = []">
    <template #heading>
      <h1 class="text-3xl md:text-5xl">
        <div>{{ title }}</div>
        <div v-if="directory" class="text-xl mt-1">({{ directory }})</div>
      </h1>
    </template>
    <template v-if="loadingPhotoInfo" #loading>
      <div class="flex flex-col items-center justify-center pb-4">
        <Loading class="w-16 h-16"></Loading>
        <div>Retrieving photo info</div>
      </div>
    </template>
  </Gallery>
</template>

<script>
import Loading from '../components/Loading.vue';
import Gallery from './Gallery.vue';

import { getPhotosFromSource, getSource, subscribeToSourceCreation } from '../services/api';
import {  setDocumentTitle } from '../utils';

export default {
  name: 'Source',
  components: {
    Gallery,
    Loading,
  },
  props: {
    directory: String,
    showLightbox: {
      type: Boolean,
      default: false,
    },
    sourceId: String,
  },
  data() {
    return {
      loadingPhotoInfo: false,
      loadingSourceInfo: false,

      processing: false,
      eventSource: null,

      date: null,
      source: null,
      photos: [],
    };
  },
  computed: {
    title() {
      return this.source?.alias;
    },
  },
  async mounted() {
    await this.loadSourceInfo();
  },
  beforeUnmount() {
    this.closeEventSource();
  },
  watch: {
    sourceId() {
      this.closeEventSource();
      this.photos = [];
      this.source = null;
      this.date = null;
      this.loadSourceInfo();
    },
  },
  methods: {
    async loadSourceInfo() {
      try {
        this.loadingSourceInfo = true;
        this.source = await getSource(this.sourceId);
        setDocumentTitle(this.directory ? `${this.source.alias} (${this.directory})` : this.source.alias);

        if (this.source.processed) {
          this.loadPhotoInfo();
        } else {
          this.subscribeToProcessing();
        }
      } catch(e) {
        alert('An error occurred.');
        throw e;
      } finally {
        this.loadingSourceInfo = false;
      }
    },
    subscribeToProcessing() {
      this.processing = true;

      try {
        this.eventSource = subscribeToSourceCreation(this.sourceId);
      } catch (e) {
        alert('Failed to subscribe to source creation');
        this.processing = false;
        return;
      }

      this.eventSource.addEventListener('done', (event) => {
        this.closeEventSource();
        this.processing = false;

        const result = JSON.parse(event.data);
        if (result.success) {
          this.loadSourceInfo();
        } else {
          alert('Source processing failed.');
        }
      });
      this.eventSource.onerror = () => {
        this.closeEventSource();
        this.processing = false;
      };
    },
    closeEventSource() {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    },
    async loadPhotoInfo() {
      try {
        this.loadingPhotoInfo = true;
        const { photos } = await getPhotosFromSource(
          this.sourceId,
          this.date,
          this.directory
        );
        this.loadingPhotoInfo = false;

        this.photos = photos;
      } catch(e) {
        alert('An error occurred.');
        throw e;
      } finally {
        this.loadingPhotoInfo = false;
      }
    },
    onDateUpdate(date) {
      this.date = date;
      this.loadPhotoInfo();
    },
  }
}
</script>
