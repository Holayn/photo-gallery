<template>
  <div v-if="photo && loading" style="width: 100vw; height: 100vh;">
    <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 100%;">
      <img style="width: 100%; height: 100%; object-fit: contain; filter: blur(3px);" :src="toPhotoUrl(photo, getGalleryPhotoSize())">
      <div style="position: absolute; display: flex; align-items: center; justify-content: center; top: 0; left: 0; width: 100%; height: 100%;">
        <Loading></Loading>
      </div>
    </div>
  </div>
  <div v-else-if="photo.metadata.video" style="display: flex; align-items: center; justify-content: center; height: 100%;">
    <video :id="'video-' + index" class="video-js" controls preload="auto" :poster="toPhotoUrl(photo, getGalleryPhotoSize())" style="height: 100vw; width: 100vw; max-height: 75vh;">
      <source :src="toPhotoUrl(photo, PHOTO_SIZES.LARGE)" type="video/mp4"/>
    </video>
  </div>
  <div v-show="!loading" style="display: flex; justify-content: center; width: 100vw; height: 100vh;">
    <img @load="loaded" :src="toPhotoUrl(photo, PHOTO_SIZES.LARGE)" style="max-width: 100%; max-height: 100vh;">
  </div>
</template>

<script>
import { PHOTO_SIZES, toPhotoUrl } from '../services/api';
import { getGalleryPhotoSize } from '../utils';

import Loading from './Loading.vue';

export default {
  name: 'LightboxSlide',
  components: {
    Loading,
  },
  props: {
    photo: Object,
    title: String,
    index: Number,
  },
  data() {
    return {
      loading: true,
      PHOTO_SIZES,
    }
  },
  mounted() {
    if (this.photo.metadata.video) {
      this.loading = false;
    }
  },
  methods: {
    getGalleryPhotoSize,
    loaded() {
      console.debug('Loaded');
      this.loading = false;
    },
    toPhotoUrl,
  },
}
</script>
<style scoped>
</style>
