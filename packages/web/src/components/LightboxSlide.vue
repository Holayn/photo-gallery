<template>
  <div v-if="photo && !photo.metadata.video" class="h-full w-full">
    <div v-if="loading" class="relative flex items-center justify-center h-full w-full">
      <img class="w-full h-full object-contain blur-sm" :src="preview">
      <div class="absolute flex flex-col items-center justify-center">
        <Loading class="w-16 h-16"></Loading>
      </div>
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
    <div class="z-50 h-full flex" @click.stop="">
      <video ref="video" playsinline controls :data-poster="preview">
        <source :src="photo.urls[PHOTO_SIZES.LARGE]" type="video/mp4"/>
      </video>
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

    loadPhotoToBase64(this.photo.urls[getFetchedGalleryPhotoSize()]).then(data => {
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
      loadPhotoToBase64(this.photo.urls[PHOTO_SIZES.LARGE]).then(data => {
        this.large = data;
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
    onVideoOverlayClick() {
      this.player.togglePlay();
    }
  },
}
</script>
<style scoped>
</style>
