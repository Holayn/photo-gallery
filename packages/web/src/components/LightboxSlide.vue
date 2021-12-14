<template>
  <div style="display: flex; align-items: center; justify-content: center; height: 100vh; width: 100vw;">
    <div v-if="loading" style="position: absolute; width: 100%;">
      <div style="position: relative; height: 100%; width: 100%;">
        <img style="width: 100%; filter: blur(3px);" :src="getUrl(photo.output.small.path)">
        <div style="position: absolute; display: flex; align-items: center; justify-content: center; top: 0; left: 0; width: 100%; height: 100%;">
          <Loading></Loading>
        </div>
      </div>
    </div>
    <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
      <div v-if="photo.isVideo" style="display: flex; align-items: center; justify-content: center; height: 100%;">
        <video :id="'video-' + index" class="video-js" controls preload="auto" :poster="getUrl(photo.output.small.path)" style="height: 100%; width: 100%; max-height: 75vh;">
          <source :src="getUrl(photo.output.download.path)" type="video/mp4"/>
        </video>
      </div>
      <img v-else @load="loaded" :src="getUrl(photo.output.large.path)" style="max-width: 100%; max-height: 100vh;">
    </div>
  </div>
</template>

<script>

import Loading from './Loading.vue';
import { getUrl } from '../utils';

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
    }
  },
  mounted() {
    if (this.photo.isVideo) {
      this.loading = false;
    }
  },
  methods: {
    getUrl(path) {
      return getUrl(path, this.title);
    },
    loaded() {
      this.loading = false;
    },
  },
}
</script>
<style scoped>
</style>
