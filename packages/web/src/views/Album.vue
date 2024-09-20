<template>
  <div>
    <div class="mt-4">
      <Gallery ref="gallery" :show-lightbox="showLightbox">
        <template #heading>
          <h1 class="flex-auto text-3xl md:text-5xl">
            <div v-if="showLoadingAlbumInfo" class="flex justify-center">
              <Loading class="w-16 h-16"></Loading>
            </div>
            <span v-else>{{ title }}</span>
          </h1>
        </template>
        <template #controls> 
          <button @click="showModalAlbumLink()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </button>
        </template>
        <template v-if="loadingPhotoInfo" #loading>
          <div class="flex flex-col items-center justify-center pb-4">
            <Loading class="w-16 h-16" show-long-wait></Loading>
            <p>Retrieving photo info</p>
          </div>
        </template>
      </Gallery>
    </div>

    <Modal v-if="isModalAlbumLinkShowing" size="full" @close="(isModalAlbumLinkShowing = false)">
      <div class="flex items-center gap-2">
        <button v-if="!album.token" class="btn" @click="shareAlbum">Share</button>
        <template v-else>
          <input class="flex-auto" :value="albumLink">
          <div class="flex gap-1 items-center">
            <button @click="copyToClipboard(albumLink)">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            </button>
            <p v-if="isModalAlbumLinkCopied">copied!</p>
          </div>
        </template>
      </div>
    </Modal>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';
import Modal from '../components/Modal.vue';
import Gallery from './Gallery.vue';

import { getPhotosFromAlbum, getAlbum, shareAlbum } from '../services/api';
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
    showLightbox: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      isModalAlbumLinkShowing: false,
      isModalAlbumLinkCopied: false,

      loadingPhotoInfo: false,
      loadingAlbumInfo: false,

      album: null,
    };
  },
  computed: {
    albumToken() {
      return this.$route.query.token;
    },
    albumLink() {
      return `${window.location.href.split('?')[0]}?token=${this.album.token}`;
    },
    showLoadingAlbumInfo() {
      return this.loadingAlbumInfo && !this.loadingPhotoInfo;
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
    this.loadingAlbumInfo = true;
    this.loadPhotoInfo();
    this.album = await getAlbum(this.albumId, this.albumToken);
    this.loadingAlbumInfo = false;

    setDocumentTitle(this.album.name);
  },
  beforeUnmount() {
    this.$store.dispatch('clearPhotos');
  },
  methods: {
    async loadPhotoInfo() {
      this.loadingPhotoInfo = true;
      const { photos } = await getPhotosFromAlbum(this.albumId, this.albumToken);
      this.loadingPhotoInfo = false;

      this.$store.dispatch('setPhotos', { photos, urlParams: `id=${this.albumId}&token=${this.albumToken}` });
      this.$refs.gallery.updateRenderPhotos();
    },

    showModalAlbumLink() {
      this.isModalAlbumLinkShowing = true;
    },
    async shareAlbum() {
      const token = await shareAlbum(this.album);
      this.album.token = token;
    },
    copyToClipboard(link) {
      window.navigator.clipboard.writeText(link);
      this.isModalAlbumLinkCopied = true;
    },
  }
}
</script>
