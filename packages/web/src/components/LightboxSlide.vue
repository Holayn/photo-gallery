<template>
  <div v-if="photo && !photo.metadata.video">
    <div v-if="loading" class="relative flex items-center justify-center h-full">
      <img class="w-full h-full object-contain blur-sm" :src="preview">
      <div class="absolute flex items-center justify-center top-0 left-0 w-full h-full">
        <Loading></Loading>
      </div>
    </div>
    <div v-else="!loading" class="flex justify-center w-screen h-screen">
      <img :src="large" class="max-w-full max-h-full object-contain">
      <!-- HACK: Force browser to render base64 image. -->
      <!-- Intermittent issue of where the browser just refuses to render the image. -->
      <img :src="large" class="w-0 h-0">
    </div>
  </div>
  <div v-else-if="photo.metadata.video" class="flex items-center justify-center h-full">
    <video ref="video" class="w-screen h-screen" controls preload="auto" :poster="preview">
      <source :src="photo.urls[PHOTO_SIZES.LARGE]" type="video/mp4"/>
    </video>
  </div>
</template>

<script>
import { PHOTO_SIZES } from '../services/api';
import { getGalleryPhotoSize, loadPhotoToBase64 } from '../utils';

import Loading from './Loading.vue';

export default {
  name: 'LightboxSlide',
  components: {
    Loading,
  },
  props: {
    active: {
      type: Boolean,
      default: false,
    },
    photo: Object,
    index: Number,
  },
  data() {
    return {
      loading: true,
      PHOTO_SIZES,
      large: null,
      preview: null,
    }
  },
  watch: {
    active() {
      if (!this.active) {
        this.stopVideo();
      }
    }
  },
  async mounted() {
    if (this.photo.data?.preview) {
        this.preview = this.photo.data.preview;
      } else {
        loadPhotoToBase64(this.photo.urls[getGalleryPhotoSize()]).then(data => {
          this.preview = data;
        });
      }

    if (this.photo.metadata.video) {
      // Defer to natively loading the video.
      this.loading = false;
    } else {
      loadPhotoToBase64(this.photo.urls[PHOTO_SIZES.LARGE]).then(data => {
        this.large = data;
        this.loaded();
      });
    }
  },
  beforeUnmount() {
    this.stopVideo();
  },
  methods: {
    getGalleryPhotoSize,
    loaded() {
      this.loading = false;
    },
    stopVideo() {
      this.$refs.video?.pause();
    },
  },
}
</script>
<style scoped>
</style>
