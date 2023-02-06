<template>
  <div>
    <div class="mt-4">
      <Gallery ref="gallery" :has-more-photos="hasMorePhotos" :load-more="loadMoreFromServer">
        <template #heading>
          <h1 class="flex-auto text-5xl">
            <Loading v-if="loadingSourceInfo"></Loading>
            <span v-else>{{ title }} <span v-if="directory">({{ directory }})</span></span>
          </h1>
        </template>
      </Gallery>
      <div v-if="loading" class="flex flex-col items-center justify-center pb-4">
        <Loading></Loading>
        <p>Retrieving photo info</p>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';
import Gallery from './Gallery.vue';

import { getPhotosFromSource, getSource } from '../services/api';

export default {
  name: 'Source',
  components: {
    Gallery,
    Loading,
  },
  props: {
    directory: String,
    sourceId: String,
  },
  data() {
    return {
      hasMorePhotos: false,

      loading: false,
      loadingSourceInfo: false,

      source: null,
    };
  },
  computed: {
    title() {
      return this.source?.alias;
    },
  },
  async mounted() {
    this.loading = true;
    this.loadingSourceInfo = true;

    try {
      this.source = await getSource(this.sourceId);
      this.loadingSourceInfo = false;
      document.title = this.source.alias;

      this.$store.dispatch('clearPhotos');
      const { info, photos } = await getPhotosFromSource(
        this.sourceId, 
        0, 
        this.$refs.gallery.estimateNumImagesFitOnPage() * 2, 
        this.directory
      );
      this.$store.dispatch('addPhotos', { photos, sourceId: this.sourceId });

      this.hasMorePhotos = info.hasMorePhotos;

      this.$refs.gallery.init();
    } catch(e) {
      alert('An error occurred.');
      throw e;
    } finally {
      this.loadingSourceInfo = false;
      this.loading = false;
    }
  },
  methods: {
    async loadMoreFromServer() {
      console.debug('loading more photo info from server...');
      this.loading = true;

      try {
        const { info, photos } = await getPhotosFromSource(
          this.sourceId, 
          this.$store.state.photos.length, 
          this.$refs.gallery.estimateNumImagesFitOnPage() * 2, 
          this.directory
        );

        this.loading = false;

        this.hasMorePhotos = info.hasMorePhotos;
        this.$store.dispatch('addPhotos', { photos, sourceId: this.sourceId });

        console.debug(`fetched photo info of ${photos.length} more photos from server.`);
      } catch(e) {
        alert('An error occurred.');
        throw e;
      } finally {
        this.loading = false;
      }
    },
  }
}
</script>
