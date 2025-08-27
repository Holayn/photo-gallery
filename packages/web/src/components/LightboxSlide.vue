<template>
  <div v-if="photo && !photo.metadata.video" class="h-full w-full">
    <div v-if="loading" class="relative flex items-center justify-center h-full w-full">
      <img class="w-full h-full object-contain blur-sm" :src="preview">
      <div class="absolute flex flex-col items-center justify-center">
        <Loading class="w-16 h-16"></Loading>
      </div>
    </div>
    <div v-else-if="!loading && error" class="flex items-center justify-center w-full h-full text-white">
      Failed to load
    </div>
    <div v-else="!loading" class="flex justify-center w-full h-full">
      <img :src="large" class="max-w-full max-h-full object-contain">
      <!-- HACK: Force browser to render base64 image. -->
      <!-- Intermittent issue of where the browser just refuses to render the image. -->
      <img :src="large" class="w-0 h-0">
    </div>
  </div>
  <div v-else-if="photo.metadata.video" class="flex items-center justify-center h-full">
    <!-- h-full flex is needed to size and position the video responsively. -->
    <div class="z-50 h-full flex justify-center relative" @click.stop="">
      <video ref="video" playsinline controls :data-poster="preview" @loadstart="onVideoLoadStart" @loadeddata="onVideoLoad">
        <source :src="photo.urls.view[PHOTO_SIZES.LARGE]" type="video/mp4"/>
      </video>
      <div v-if="!videoLoaded && videoLoadTimeout" class="absolute top-0 left-0 w-full h-full flex items-center justify-center text-center text-white pointer-events-none">
        <div>Videos can sometimes take up to 10 seconds to load, please wait...</div>
      </div>
    </div>
  </div>
</template>

<script>
import Plyr from 'plyr';

import { PHOTO_SIZES } from '../services/api';
import { getFetchedGalleryPhotoSize, loadPhotoToBase64 } from '../utils';

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
      videoLoaded: false,
      videoLoadTimeout: false,
      error: false,
      PHOTO_SIZES,
      large: null,
      preview: null,
      player: null,
    }
  },
  watch: {
    active() {
      if (this.player) {
        if (!this.active) {
          this.player.pause();
        } else {
          this.player.play();
        }
      }
    }
  },
  async mounted() {
    if (!this.active) {
      await this.$nextTick();
    }

    loadPhotoToBase64(this.photo.urls.view[getFetchedGalleryPhotoSize()]).then(data => {
      this.preview = data;
    });

    if (this.photo.metadata.video) {
      this.loading = false;

      this.player = new Plyr(this.$refs.video, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'settings', 'fullscreen'],
      });

      if (this.active) {
        this.player.play();
      }

      setTimeout(() => {
        document.querySelector('.plyr__progress')?.classList.add('swiper-no-swiping');
      });
    } else {
      loadPhotoToBase64(this.photo.urls.view[PHOTO_SIZES.LARGE]).then(data => {
        this.large = data;
        this.loading = false;
      }).catch(() => {
        this.error = true;
        this.loading = false;
      });
    }
  },
  beforeUnmount() {
    if (this.player) {
      this.player.pause();
      this.player.destroy();
    }
  },
  methods: {
    onVideoLoadStart() {
      setTimeout(() => {
        if (this.$refs.video && !this.videoLoaded && this.player.playing) {
          this.videoLoadTimeout = true;
        }
      }, 2000);
    },
    onVideoLoad() {
      this.videoLoaded = true;
      this.videoLoadTimeout = false;
    }
  },
}
</script>
<style scoped>
</style>
