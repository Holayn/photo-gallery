<template>
  <div class="lightbox">
    <div class="lightbox__menu">
      <div ref="download" @click="triggerDownloadTooltip()" style="margin: 1rem; z-index: 99; cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
      </div>
      <div class="m-4 cursor-pointer" @click="showMetadata = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <div class="m-4 cursor-pointer" @click="close()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
    </div>
    <swiper
      :centered-slides="true"
      :keyboard="{enabled: true, onlyInViewport: false}"
      :modules="modules"
      :space-between="50"
      :virtual="true"
      :zoom="true"
      :threshold="10"
      @activeIndexChange="activeIndexChange"
      @afterInit="afterInit"
    >
      <swiper-slide
        v-for="(photo, index) in $store.state.photos"
        :key="index"
        :virtualIndex="index"
        :zoom="true"
      >
        <lightbox-slide
          :index="index"
          :photo="photo"
        ></lightbox-slide>
      </swiper-slide>
    </swiper>

    <Modal v-if="showMetadata" @close="(showMetadata = false)">
      <div class="grid grid-cols-3 gap-x-6 gap-y-2">
        <div v-for="meta in currentPhotoMetadata" :key="meta.label">
          <div class="text-sm">{{ meta.label }}</div>
          <div>{{ meta.value }}</div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { Keyboard, Virtual, Zoom } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue/swiper-vue.js';

import 'swiper/swiper.scss'; // core Swiper
import 'swiper/modules/navigation/navigation.scss'; // Navigation module
import 'swiper/modules/pagination/pagination.scss'; // Pagination module

import LightboxSlide from './LightboxSlide.vue';
import Modal from './Modal.vue';

export default {
  name: 'Lightbox',
  components: {
    LightboxSlide,
    Modal,
    Swiper,
    SwiperSlide,
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
      tippy: null,

      showMetadata: false,
    }
  },
  computed: {
    currentPhotoMetadata() {
      const metadata = this.$store.state.photos[this.$store.state.lightbox.photoIndex].metadata;
      metadata.date = new Date(metadata.date);
      return ['date', 'fileName', 'fileSize', 'width', 'height', 'orientation'].map(field => ({ label: field, value: metadata[field] }));
    }
  },
  mounted() {
    this.tippy = window.tippy(this.$refs.download, {
      allowHTML: true,
      content: `
        <div>
          <div><strong>Mobile:</strong> Tap and hold down on the image</div>
          <div><strong>PC:</strong> Right-click on the image -> Save image as...</div>
        </div>
      `,
      trigger: 'click',
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  },
  methods: {
    activeIndexChange({ activeIndex }) {
      this.stopCurrentVideo();
      this.$store.state.lightbox.photoIndex = activeIndex;

      if (this.tippy) {
        this.tippy.hide();
      }
    },
    afterInit(e) {
      this.swiper = e;
    },
    close() {
      document.body.style.position = '';
      this.stopCurrentVideo();
      this.$emit('close');
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
    stopCurrentVideo() {
      document.querySelector(`#video-${this.$store.state.lightbox.photoIndex}`)?.pause();
    },
    triggerDownloadTooltip() {
      // this.tippy.show();
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
    justify-content: flex-end;
    align-items: flex-end;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;

    background-color: rgba(0, 0, 0, 0.25);
  }
</style>
