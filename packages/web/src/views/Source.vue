<template>
  <div>
    <div class="mt-4">
      <Gallery ref="gallery" :has-more-photos="hasMorePhotos" :load-more="loadMoreFromServer">
        <template #heading>
          <h1 class="flex-auto text-5xl">
            <Loading v-if="loadingSourceInfo"></Loading>
            <span v-else>{{ title }}</span>
          </h1>
        </template>
      </Gallery>
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

    this.source = await getSource(this.sourceId);
    this.loadingSourceInfo = false;
    document.title = this.source.alias;

    this.$store.dispatch('clearPhotos');
    const { info, photos } = await getPhotosFromSource(this.sourceId, 0, this.$refs.gallery.estimateNumImagesFitOnPage());
    this.$store.dispatch('addPhotos', photos);

    this.loading = false;
      
    this.hasMorePhotos = info.hasMorePhotos;

    this.$refs.gallery.init();
  },
  methods: {
    async loadMoreFromServer() {
      console.debug('loading more photo info from server...');
      this.loading = true;

      const { info, photos } = await getPhotosFromSource(this.sourceId, this.$store.state.photos.length, this.$refs.gallery.estimateNumImagesFitOnPage());

      this.loading = false;

      this.hasMorePhotos = info.hasMorePhotos;
      this.$store.dispatch('addPhotos', photos);

      console.debug(`fetched photo info of ${photos.length} more photos from server.`);
    },
  }
}
</script>
