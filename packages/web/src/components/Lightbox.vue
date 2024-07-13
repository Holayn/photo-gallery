<template>
  <div class="lightbox" @click="toggleMenu">
    <div class="lightbox_menu" :style="{ opacity: showMenu ? 1 : 0 }">
      <div class="m-4 cursor-pointer" @click.stop="showMetadata = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      </div>
      <div class="flex-auto flex items-center justify-center mx-2 mt-2 h-full">
        <div class="text-white text-center">
          <div class="text-sm">{{ currentPhotoMetadata.date?.day }} {{ currentPhotoMetadata.date?.date }}</div>
          <div class="text-xs">{{ currentPhotoMetadata.date?.time }}</div>
        </div>
      </div>
      <div class="m-4 cursor-pointer" @click="close()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
    </div>
    <swiper
      :keyboard="{enabled: true, onlyInViewport: false}"
      :modules="modules"
      :space-between="50"
      :threshold="10"
      :initial-slide="$store.state.lightbox.photoIndex"
      centered-slides
      virtual
      zoom
      @activeIndexChange="_swiperOnActiveIndexChange"
      @afterInit="_swiperOnAfterInit"
    >
      <swiper-slide
        v-for="(photo, index) in $store.state.photos"
        :key="index"
        :virtualIndex="index"
        :zoom="!photo.metadata.video"
      >
        <lightbox-slide
          :active="index === $store.state.lightbox.photoIndex"
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
          <div v-if="location">
            <div>
              <a class="text-black underline" :href="location.link" target="_blank">{{ loadingLocationInfo ? 'loading...' : currentPhotoLocationInfo ?? 'Unknown' }}</a>
            </div>
            <div class="text-sm text-slate-600">
              <div>lat:{{ location.lat ?? '--' }}, long:{{ location.long ?? '--' }},</div>
              <div>alt:{{ location.altitude ?? '--' }}</div>
            </div>
          </div>
          <div v-else>Unknown</div>
        </div>
        <div>
          <h2 class="text-sm text-slate-600">Details</h2>
          <div>
            <div>{{ currentPhotoMetadata.fileName }}</div>
            <div class="text-sm text-slate-600">
              <div class="grid md:grid-cols-2 gap-x-2">
                <p>{{ currentPhotoMetadata.width }} x {{ currentPhotoMetadata.height }}</p>
                <p>{{ currentPhotoMetadata.fileSize }}</p>
              </div>
              <p>
                {{ currentPhotoMetadata.device }}
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
import { Keyboard, Virtual, Zoom } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import LightboxSlide from './LightboxSlide.vue';
import Modal from './Modal.vue';

import { getLocationInfo, PHOTO_SIZES } from '../services/api';

const DATE_FORMAT = 'YYYY:MM:DD HH:mm:ss';
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

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
      showMenu: true,
    }
  },
  computed: {
    currentPhoto() {
      return this.$store.state.photos[this.$store.state.lightbox.photoIndex];
    },
    currentPhotoMetadata() {
      const { date, fileName, fileSize, width, height, location, device } = this.currentPhoto.metadata;
      const parsedDate = dayjs(date, DATE_FORMAT);
      return {
        date: {
          date: parsedDate.format('LL'),
          time: parsedDate.format('LTS'),
          day: parsedDate.format('dddd'),
        },
        fileName,
        fileSize,
        width,
        height,
        location,
        device,
      };
    },
    currentPhotoOriginalUrl() {
      return this.currentPhoto.urls[PHOTO_SIZES.ORIGINAL];
    },
    location() {
      if (this.currentPhotoMetadata.location?.unknown) {
        return null;
      } else if (this.currentPhotoMetadata.location) {
        if (this.currentPhotoMetadata.location.lat == null && this.currentPhotoMetadata.location.long == null) {
          return null;
        } else {
          return {
            ...this.currentPhotoMetadata.location,
            link: `https://www.google.com/maps/place/${this.currentPhotoMetadata.location.lat},${this.currentPhotoMetadata.location.long}`,
          };
        }
      }
    },
  },
  watch: {
    async showMetadata() {
      if (this.showMetadata && this.location) {
        this.loadingLocationInfo = true;
        const { lat, long } = this.location;
        try {
          const response = await getLocationInfo(lat, long);
          if (response) {
            this.currentPhotoLocationInfo = response.label;
          }
        } finally {
          this.loadingLocationInfo = false;
        }
      }
    },
  },
  mounted() {
    this.handleEscapeKey();
  },
  beforeUnmount() {
    this.close();
  },
  methods: {
    close() {
      this.$emit('close');
    },

    handleEscapeKey() {
      window.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
      });
    },

    toggleMenu() {
      this.showMenu = !this.showMenu;
    },

    _swiperOnAfterInit() {
      setTimeout(() => {
        const appHeight = () => document.documentElement.style.setProperty('--lightbox-height', `${window.innerHeight}px`);
        window.addEventListener('resize', appHeight);
        appHeight();
      });
    },
    _swiperOnActiveIndexChange({ activeIndex }) {
      this.$store.state.lightbox.photoIndex = activeIndex;
      this.showMetadata = false;
    },
  },
}
</script>
<style scoped>
  .lightbox {
    position: fixed;
    background-color: black;
    z-index: 99;
    top: 0;
    left: 0;
    width: 100%;
    height: var(--lightbox-height);
  }

  .lightbox_menu {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;

    background-color: rgba(0, 0, 0, 0.25);
    transition: opacity 0.2s linear;
  }
</style>
