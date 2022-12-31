<template>
  <div>
    <div class="mt-4">
      <Gallery ref="gallery" :has-more-photos="hasMorePhotos" :load-more="loadMoreFromServer">
        <template #heading>
          <h1 class="flex-auto text-5xl">
            <Loading v-if="loadingAlbumInfo"></Loading>
            <span v-else>{{ title }}</span>
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

import { getPhotosFromAlbum, getAlbum } from '../services/api';

export default {
  name: 'Album',
  components: {
    Gallery,
    Loading,
  },
  props: {
    albumId: String,
  },
  data() {
    return {
      hasMorePhotos: false,

      loading: false,
      loadingAlbumInfo: false,

      album: null,
    };
  },
  computed: {
    albumToken() {
      return this.$route.query.albumToken;
    },
    title() {
      return this.album?.name;
    },
    token() {
      return this.$route.query.token;
    },
  },
  async mounted() {
    this.$store.dispatch('setAlbumToken', this.albumToken);

    this.loading = true;
    this.loadingAlbumInfo = true;

    try {
      this.album = (await getAlbum(this.albumId, this.albumToken)).data;
      
      document.title = this.album.name;

      this.$store.dispatch('clearPhotos');
      const { info, photos } = (await getPhotosFromAlbum(this.albumId, 0, this.$refs.gallery.estimateNumImagesFitOnPage(), this.albumToken)).data;
      this.$store.dispatch('addPhotos', { photos });

      this.loading = false;
        
      this.hasMorePhotos = info.hasMorePhotos;

      this.$refs.gallery.init();
    } catch(e) {
      alert(e);
    } finally {
      this.loadingAlbumInfo = false;
    }
  },
  methods: {
    async loadMoreFromServer() {
      console.debug('loading more photo info from server...');
      this.loading = true;

      const { info, photos } = (await getPhotosFromAlbum(this.albumId, this.$store.state.photos.length, this.$refs.gallery.estimateNumImagesFitOnPage(), this.albumToken)).data;

      this.loading = false;

      this.hasMorePhotos = info.hasMorePhotos;
      this.$store.dispatch('addPhotos', { photos });

      console.debug(`fetched photo info of ${photos.length} more photos from server.`);
    },
  }
}
</script>
