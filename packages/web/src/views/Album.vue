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
        <template #controls> 
          <button @click="showModalAlbumLink()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </button>
        </template>
      </Gallery>
      <div v-if="loading" class="flex flex-col items-center justify-center pb-4">
        <Loading></Loading>
        <p>Retrieving photo info</p>
      </div>
    </div>

    <Modal v-if="isModalAlbumLinkShowing" full="true" @close="(isModalAlbumLinkShowing = false)">
      <div class="flex items-center gap-2">
        <input class="flex-auto" :value="albumLink">
        <div class="flex gap-1 items-center">
          <button @click="copyToClipboard(albumLink)">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
          </button>
          <p v-if="isModalAlbumLinkCopied">copied!</p>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';
import Modal from '../components/Modal.vue';
import Gallery from './Gallery.vue';

import { getPhotosFromAlbum, getAlbum } from '../services/api';
import { setDocumentTitle } from '../utils';

export default {
  name: 'Album',
  components: {
    Gallery,
    Loading,
    Modal,
  },
  props: {
    albumId: String,
  },
  data() {
    return {
      hasMorePhotos: false,
      
      isModalAlbumLinkShowing: false,
      isModalAlbumLinkCopied: false,

      loading: false,
      loadingAlbumInfo: false,

      album: null,
    };
  },
  computed: {
    albumToken() {
      return this.$route.query.albumToken;
    },
    albumLink() {
      return `${window.location.href.split('?')[0]}?albumToken=${this.album.token}`;
    },
    title() {
      return this.album?.name;
    },
    token() {
      return this.$route.query.token;
    },
  },
  watch: {
    isModalAlbumLinkShowing() {
      if (this.isModalAlbumLinkShowing) {
        this.isModalAlbumLinkCopied = false;
      }
    }
  },
  async mounted() {
    this.$store.dispatch('setAlbumToken', this.albumToken);

    this.loading = true;
    this.loadingAlbumInfo = true;

    try {
      const album = await getAlbum(this.albumId, this.albumToken);
      this.loadingAlbumInfo = false;
      this.album = album;
      
      setDocumentTitle(this.album.name);

      this.$store.dispatch('clearPhotos');
      const { info, photos } = await getPhotosFromAlbum(this.albumId, 0, this.$refs.gallery.estimateNumImagesFitOnPage() * 2, this.albumToken);
      this.$store.dispatch('addPhotos', { photos });

      this.hasMorePhotos = info.hasMorePhotos;

      this.$refs.gallery.init();
    } catch(e) {
      alert('An error occurred.');
      throw e;
    } finally {
      this.loadingAlbumInfo = false;
      this.loading = false;
    }
  },
  methods: {
    async loadMoreFromServer() {
      console.debug('loading more photo info from server...');
      this.loading = true;

      try {
        const { info, photos } = await getPhotosFromAlbum(this.albumId, this.$store.state.photos.length, this.$refs.gallery.estimateNumImagesFitOnPage() * 2, this.albumToken);

        this.loading = false;

        this.hasMorePhotos = info.hasMorePhotos;
        this.$store.dispatch('addPhotos', { photos });

        console.debug(`fetched photo info of ${photos.length} more photos from server.`);
      } catch(e) {
        alert('An error occurred.');
        throw e;
      } finally {
        this.loading = false;
      }
    },
    showModalAlbumLink() {
      this.isModalAlbumLinkShowing = true;
    },
    copyToClipboard(link) {
      window.navigator.clipboard.writeText(link);
      this.isModalAlbumLinkCopied = true;
    },
  }
}
</script>
