<template>
  <div v-if="photo && !photo.metadata.video" style="width: 100vw; height: 100vh;">
    <div v-if="loading" style="position: relative; display: flex; align-items: center; justify-content: center; height: 100%;">
      <img style="width: 100%; height: 100%; object-fit: contain; filter: blur(3px);" :src="preview">
      <div style="position: absolute; display: flex; align-items: center; justify-content: center; top: 0; left: 0; width: 100%; height: 100%;">
        <Loading></Loading>
      </div>
    </div>
    <div v-show="!loading" style="display: flex; justify-content: center; width: 100vw; height: 100vh;">
      <img :src="large" style="max-width: 100%; max-height: 100%; object-fit: contain;">
    </div>
  </div>
  <div v-else-if="photo.metadata.video" style="display: flex; align-items: center; justify-content: center; height: 100%;">
    <video :id="'video-' + index" class="video-js" controls preload="auto" :poster="preview" style="height: 100vw; width: 100vw; max-height: 75vh;">
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
  computed: {
    token() {
      return this.$store.state.token;
    },
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
  methods: {
    getGalleryPhotoSize,
    loaded() {
      this.loading = false;
    },
  },
}
</script>
<style scoped>
</style>
