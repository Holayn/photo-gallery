<template>
  <div class="h-full w-full">
    <div v-if="loading || error" class="relative flex items-center justify-center h-full w-full pointer-events-none">
      <img class="w-full h-full object-contain blur-sm" :src="preview">
      <div class="absolute flex flex-col items-center justify-center pointer-events-auto">
        <Loading v-if="loading" class="w-16 h-16"></Loading>
        <div v-else-if="error" class="text-white">Failed to load</div>
        <button v-if="error" class="text-white mt-1" @click="retryLoad">
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
        </button>
      </div>
    </div>

    <template v-if="!error">
      <div v-if="!photo.metadata.video" class="swiper-zoom-container">
        <img :ref="imgRef" :src="photoSrc" class="object-contain" @load="onImgLoad" @error="onImgLoadError">
      </div>
      <div v-else class="flex items-center justify-center h-full">
        <!-- h-full flex is needed to size and position the video responsively. -->
        <div class="z-50 h-full flex justify-center relative" @click.stop="">
          <video ref="video" playsinline controls :data-poster="preview">
            <source :src="photo.urls.view[PHOTO_SIZES.LARGE]" type="video/mp4" @error="onVideoLoadError">
          </video>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import Plyr from 'plyr';

import { PHOTO_SIZES } from '../services/api';

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
    previewSize: {
      type: String,
      default: PHOTO_SIZES.SMALL,
    },
  },
  data() {
    return {
      loading: true,
      error: false,
      PHOTO_SIZES,
      player: null,
    }
  },
  computed: {
    preview() {
      return this.photo.urls.view[this.previewSize];
    },
    photoSrc() {
      return this.photo.urls.view[PHOTO_SIZES.LARGE];
    },
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
    if (this.photo.metadata.video) {
      const player = this.player = new Plyr(this.$refs.video, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'settings', 'fullscreen'],
      });

      player.on('ready', () => {
        this.loading = false;
      });

      if (this.active) {
        player.play();
      }

      setTimeout(() => {
        document.querySelector('.plyr__progress')?.classList.add('swiper-no-swiping');
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
    onImgLoad() {
      this.loading = false;
    },
    onImgLoadError() {
      this.error = true;
      this.loading = false;
    },
    onVideoLoadError() {
      this.error = true;
      this.loading = false;
    },

    imgRef(el) {
      if (el?.complete) {
        this.loading = false;
      }
    },

    retryLoad() {
      this.error = false;
      this.loading = true;
    },
  }
}
</script>
