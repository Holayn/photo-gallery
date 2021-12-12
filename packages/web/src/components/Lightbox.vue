<template>
  <div class="lightbox">
    <div class="lightbox__menu">
      <div @click="close()" style="margin: 1rem; z-index: 99; cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
    </div>
    <swiper
      :centered-slides="true"
      :keyboard="{enabled: true, onlyInViewport: false}"
      :modules="modules"
      :space-between="50"
      virtual
      :zoom="true"
      @activeIndexChange="activeIndexChange"
      @afterInit="afterInit"
    >
      <swiper-slide
        v-for="(photo, index) in $store.state.photos"
        :key="index"
        :virtualIndex="index"
        :zoom="true"
      >
        <div v-if="photo.isVideo" style="display: flex; align-items: center; justify-content: center; height: 100%;">
          <video class="video-js" controls preload="auto" :poster="getUrl(photo.output.large.path)" style="height: 100%; width: 100%; max-height: 75vh;">
            <source :src="getUrl(photo.output.download.path)" type="video/mp4"/>
          </video>
        </div>
        <img v-else :src="getUrl(photo.output.large.path)" style="max-width: 100%; max-height: 100vh;">
      </swiper-slide>
    </swiper>
  </div>
</template>

<script>
import { Keyboard, Virtual, Zoom } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue/swiper-vue.js';

import { BASE } from '../services/fetch';

import 'swiper/swiper.scss'; // core Swiper
import 'swiper/modules/navigation/navigation.scss'; // Navigation module
import 'swiper/modules/pagination/pagination.scss'; // Pagination module

export default {
  name: 'Lightbox',
  components: {
    Swiper,
    SwiperSlide,
  },
  props: {
    title: String,
  },
  setup() {
    return {
      modules: [
        Keyboard,
        Virtual,
        Zoom,
      ],
    };
  },
  data() {
    return {
      swiper: null,
    }
  },
  computed: {
    initialSlide() {
      return this.$store.state.lightbox.photoIndex;
    },
  },
  methods: {
    activeIndexChange({ activeIndex }) {
      this.$store.state.lightbox.photoIndex = activeIndex;
    },
    afterInit(e) {
      this.swiper = e;
    },
    close() {
      document.body.style.position = '';
      this.$emit('close');
    },
    getUrl(path) {
      return `${BASE}/media/${this.title}/${path}`;
    },
    open() {
      document.body.style.position = 'fixed';
      setTimeout(() => {
        const appHeight = () => {
          document.documentElement.style.setProperty('--lightbox-height', `${window.innerHeight}px`);
        };
        window.addEventListener('resize', appHeight);
        appHeight();
      });

      this.swiper.slideTo(this.$store.state.lightbox.photoIndex, 0)
    },
  },
}
</script>
<style scoped>
  .lightbox {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    background-color: black;
    z-index: 99;
    top: 0;
    left: 0;
    width: 100%;
    height: var(--lightbox-height);
  }

  .lightbox__menu {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;

    background-color: rgba(0, 0, 0, 0.25);
  }

  .lightbox__prev, .lightbox__next {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    z-index: 99;
    width: 2rem;
    height: 2rem;

    border-radius: 10rem;
    background-color: rgba(255, 255, 255, 0.5);
  }
</style>
