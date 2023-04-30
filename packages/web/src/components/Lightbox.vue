<template>
  <div class="lightbox">
    <div class="lightbox__menu">
      <div class="m-4 cursor-pointer" @click="showMetadata = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
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
      <div class="grid gap-4">
        <div>{{ currentPhotoMetadata.date?.date }} - {{ currentPhotoMetadata.date?.time }}</div>
        <div>
          <h2 class="text-sm text-slate-600">Location</h2>
          <div v-if="!currentPhotoMetadata.location?.unknown">
            <p v-if="loadingLocationInfo">loading...</p>
            <p v-else>
              <a class="text-black underline" :href="currentPhotoLocationLink" target="_blank">{{ currentPhotoLocationInfo }}</a>
            </p>
            <p class="text-sm text-slate-600">{{ currentPhotoMetadata.location?.lat }}, {{ currentPhotoMetadata.location?.long }}. {{ currentPhotoMetadata.location?.altitude }}</p>
          </div>
          <div v-else>
            Unknown
          </div>
        </div>
        <div>
          <h2 class="text-sm text-slate-600">Details</h2>
          <div>
            <div>{{ currentPhotoMetadata.fileName }}</div>
            <div class="text-sm text-slate-600">
              <div class="flex gap-2">
                <p>{{ currentPhotoMetadata.width }} x {{ currentPhotoMetadata.height }}</p>
                <p>{{ currentPhotoMetadata.orientation }}</p>
                <p>{{ currentPhotoMetadata.fileSize }}</p>
              </div>
              <p>
                {{ currentPhotoMetadata.device }}
              </p>
              <p class="text-xs">
                {{ currentPhotoMetadata.path }}
              </p>
            </div>
            <div>
              <a class="text-sm underline" :href="currentPhotoOriginalUrl" target="_blank">View Original</a>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { Keyboard, Virtual, Zoom } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(LocalizedFormat);

import LightboxSlide from './LightboxSlide.vue';
import Modal from './Modal.vue';

import { getLocationInfo, PHOTO_SIZES } from '../services/api';

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

      currentPhotoLocationInfo: null,
      loadingLocationInfo: false,
      showMetadata: false,

      isOpen: false,
    }
  },
  computed: {
    currentPhoto() {
      return this.$store.state.photos[this.$store.state.lightbox.photoIndex];
    },
    currentPhotoMetadata() {
      if (this.currentPhoto) {
        const { date, fileName, fileSize, width, height, orientation, location, device } = this.currentPhoto.metadata;
        const parsedDate = dayjs(date);
        return {
          date: {
            date: parsedDate.format('LL'),
            time: parsedDate.format('LTS'),
          },
          fileName,
          fileSize,
          width,
          height,
          orientation,
          location,
          device,
          path: this.currentPhoto.sourceFileId,
        };
      } else {
        return {};
      }
    },
    currentPhotoLocationLink() {
      return `https://www.google.com/maps/place/${this.currentPhotoMetadata.location.lat},${this.currentPhotoMetadata.location.long}`;
    },
    currentPhotoOriginalUrl() {
      return this.currentPhoto.urls[PHOTO_SIZES.ORIGINAL];
    }
  },
  watch: {
    showMetadata: {
      immediate: true,
      async handler() {
        if (this.showMetadata && !this.currentPhotoMetadata.location?.unknown) {
          this.loadingLocationInfo = true;
          const { lat, long } = this.currentPhotoMetadata.location;
          try {
            const response = await getLocationInfo(lat, long);
            if (response) {
              this.currentPhotoLocationInfo = response.label;
            }
          } finally {
            this.loadingLocationInfo = false;
          }
        }
      }
    },
    isOpen() {
      this.currentPhotoLocationInfo = null;
      this.showMetadata = false;
    },
  },
  mounted() {
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
      this.showMetadata = false;
    },
    afterInit(e) {
      this.swiper = e;
    },
    close() {
      document.body.style.position = '';
      this.stopCurrentVideo();
      this.$emit('close');

      this.isOpen = false;
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

      this.swiper.slideTo(this.$store.state.lightbox.photoIndex, 0);

      this.isOpen = true;
    },
    stopCurrentVideo() {
      document.querySelector(`#video-${this.$store.state.lightbox.photoIndex}`)?.pause();
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
