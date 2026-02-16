<template>
  <div class="px-8 mb-2">
    <router-link to="/sources" class="underline">Sources</router-link>
  </div>

  <Gallery :id="sourceId" :show-date-selection="true" :show-lightbox="showLightbox" @date="onDateUpdate($event)">
    <template #heading>
      <h1 class="text-3xl md:text-5xl">
        <div v-if="showLoadingSourceInfo" class="flex justify-center">
          <Loading class="w-16 h-16"></Loading>
        </div>
        <template v-else>
          <div>{{ title }}</div>
          <div v-if="directory" class="text-xl mt-1">({{ directory }})</div>
        </template>
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

import { getPhotosFromSource, getSource } from '../services/api';
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

      date: null,
      source: null,
    };
  },
  computed: {
    showLoadingSourceInfo() {
      return this.loadingSourceInfo && !this.loadingPhotoInfo;
    },
    title() {
      return this.source?.alias;
    },
  },
  async mounted() {
    try {
      this.loadingSourceInfo = true;
      this.loadPhotoInfo();
      this.source = await getSource(this.sourceId);
      this.loadingSourceInfo = false;
      
      setDocumentTitle(this.directory ? `${this.source.alias} (${this.directory})` : this.source.alias);
    } catch(e) {
      alert('An error occurred.');
      throw e;
    } finally {
      this.loadingSourceInfo = false;
    }
  },
  beforeUnmount() {
    this.$store.dispatch('clearPhotos');
  },
  methods: {
    async loadPhotoInfo() {
      try {
        this.loadingPhotoInfo = true;
        const { photos } = await getPhotosFromSource(
          this.sourceId, 
          this.date,
          this.directory
        );
        this.loadingPhotoInfo = false;

        this.$store.dispatch('setPhotos', { photos, sourceId: this.sourceId });
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
