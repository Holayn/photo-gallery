<template>
  <div>
    <div class="mt-4">
      <Gallery ref="gallery" :has-more-photos="hasMorePhotos" :load-more="loadMoreFromServer" :show-date-selection="true" :show-lightbox="showLightbox" @date="onDateUpdate($event)">
        <template #heading>
          <h1 class="flex-auto text-3xl md:text-5xl">
            <div v-if="showLoadingSourceInfo" class="flex justify-center">
              <Loading class="w-16 h-16"></Loading>
            </div>
            <template v-else>
              <div>{{ title }}</div>
              <div v-if="directory" class="text-xl mt-1">({{ directory }})</div>
            </template>
          </h1>
        </template>
      </Gallery>
      <div v-if="loadingPhotoInfo" class="flex flex-col items-center justify-center pb-4">
        <Loading class="w-16 h-16"></Loading>
        <div>Retrieving photo info</div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';
import Gallery from './Gallery.vue';

import { getPhotosFromSource, getSource } from '../services/api';
import { estimateNumImagesFitOnPage, setDocumentTitle } from '../utils';

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
      hasMorePhotos: true,

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
    async loadMoreFromServer() {
      console.debug('loading more photo info from server...');

      try {
        this.loadingPhotoInfo = true;
        const { info, photos } = await getPhotosFromSource(
          this.sourceId, 
          this.$store.state.photos.length, 
          estimateNumImagesFitOnPage() * 2, 
          this.date,
          this.directory
        );
        this.loadingPhotoInfo = false;

        this.hasMorePhotos = info.hasMorePhotos;
        this.$store.dispatch('addPhotos', { photos, sourceId: this.sourceId });

        console.debug(`fetched photo info of ${photos.length} more photos from server.`);
      } catch(e) {
        alert('An error occurred.');
        throw e;
      } finally {
        this.loadingPhotoInfo = false;
      }
    },
    onDateUpdate(date) {
      // Only update the date and call init if the date actually changed.
      if (date !== this.date) {
        this.hasMorePhotos = true;
        this.date = date;
      }
    },
  }
}
</script>
