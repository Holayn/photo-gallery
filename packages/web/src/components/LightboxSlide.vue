<template>
  <div class="h-full w-full">
    <div v-if="loading || error" class="relative flex items-center justify-center h-full w-full pointer-events-none">
      <img class="w-full h-full object-contain blur-sm" :src="preview">
      <div class="absolute flex flex-col items-center justify-center pointer-events-auto">
        <Loading v-if="loading" class="w-24 h-24"></Loading>
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
      <div v-else-if="photo.processing" class="relative flex items-center justify-center h-full w-full">
        <img class="w-full h-full object-contain blur-sm" :src="preview">
        <div class="absolute flex flex-col items-center gap-2 text-white text-center px-4 bg-gray-500/50 p-2">
          <svg class="w-12 h-12 animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
          <div>Video is being converted</div>
        </div>
      </div>
      <div v-else-if="photo.previewOnly" class="relative flex items-center justify-center h-full w-full">
        <img class="w-full h-full object-contain blur-sm" :src="preview">
        <div class="absolute flex flex-col items-center gap-2 text-white text-center px-4 bg-gray-500/50 p-2">
          <svg class="w-12 h-12" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          <div>Video too large - not automatically converted</div>
          <button v-if="authStore.isLoggedIn" class="btn px-3 py-1 text-black" :disabled="converting" @click.stop="convert">Convert</button>
        </div>
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

import { PHOTO_SIZES, convertFile } from '../services/api';
import { useAuthStore } from '../store';

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
    previewSize: {
      type: String,
      default: PHOTO_SIZES.SMALL,
    },
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      loading: true,
      error: false,
      PHOTO_SIZES,
      player: null,
      programmaticPause: false,
      converting: false,
    }
  },
  computed: {
    preview() {
      return this.photo.urls.view[this.previewSize];
    },
    photoSrc() {
      return this.photo.urls.view[PHOTO_SIZES.LARGE];
    },
    isVideoUnavailable() {
      return this.photo.metadata.video && (this.photo.previewOnly || this.photo.processing);
    },
  },
  watch: {
    active() {
      if (this.player) {
        if (!this.active) {
          this.programmaticPause = true;
          this.player.pause();
        } else {
          this.player.play();
        }
      }
    },
    async isVideoUnavailable(isVideoUnavailable) {
      // The video became available (conversion finished) - the real <video>
      // element now exists in the DOM in place of the placeholder, so set up
      // the player against it.
      if (!isVideoUnavailable && !this.player) {
        await this.$nextTick();
        this.setupPlayer();
      }
    },
  },
  async mounted() {
    if (this.photo.metadata.video) {
      if (this.isVideoUnavailable) {
        this.loading = false;
        return;
      }

      this.setupPlayer();
    }
  },
  beforeUnmount() {
    if (this.player) {
      this.programmaticPause = true;
      this.player.pause();
      this.player.destroy();
    }
  },
  methods: {
    setupPlayer() {
      const player = this.player = new Plyr(this.$refs.video, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'settings', 'fullscreen'],
      });

      player.on('ready', () => {
        this.loading = false;
      });
      player.on('ended', () => {
        if (this.active) {
          this.$emit('video-ended');
        }
      });
      player.on('pause', () => {
        if (this.programmaticPause) {
          this.programmaticPause = false;
          return;
        }
        // Reaching the end of playback fires 'pause' before 'ended' — skip so that
        // doesn't get mistaken for the user pausing.
        if (this.active && !player.ended) {
          this.$emit('video-paused');
        }
      });

      if (this.active) {
        player.play();
      }

      setTimeout(() => {
        document.querySelector('.plyr__progress')?.classList.add('swiper-no-swiping');
      });
    },

    play() {
      this.player?.play();
    },

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

    async convert() {
      this.converting = true;
      try {
        await convertFile(this.photo.sourceId, this.photo.sourceFileId);
        this.photo.processing = true;
      } catch (e) {
        alert(`Error converting video: ${e.message}`);
      } finally {
        this.converting = false;
      }
    },

    retryLoad() {
      this.error = false;
      this.loading = true;
    },
  }
}
</script>
