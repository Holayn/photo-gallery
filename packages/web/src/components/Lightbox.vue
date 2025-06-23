<template>
  <dialog ref="dialog">
    <div class="lightbox">
      <div class="lightbox_menu p-2 md:px-4" :style="{ opacity: showMenu ? 1 : 0, pointerEvents: showMenu ? 'all' : 'none' }">
        <div class="flex">
          <button @click.stop="showMetadata = !showMetadata">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
          <button class="ml-4" @click.stop="download()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
          </button>
        </div>
        <div>
          <div class="text-white text-center">
            <div class="text-sm">{{ currentPhotoMetadata.date?.day }} {{ currentPhotoMetadata.date?.date }}</div>
            <div class="text-xs">{{ currentPhotoMetadata.date?.time }}</div>
          </div>
        </div>
        <div class="flex justify-end">
          <template v-if="$store.state.isLoggedIn">
            <button v-if="isSelectionMode" class="mr-4" @click="select()">
              <svg v-if="isCurrentPhotoSelected" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            </button>
            <button v-else class="mr-4" @click="enableSelectionMode()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            </button>
          </template>
          <button @click="close()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div class="flex flex-col h-full">
        <swiper
          class="min-h-0 h-full w-full"
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
          @click="toggleMenu"
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

        <div v-if="showMetadata" class="h-1/4 min-h-[12rem] bg-white">
          <div class="flex flex-col min-h-0 h-full">
            <div class="flex gap-4 p-4 pb-2">
              <h2 class="flex-auto text-lg">Info</h2>
              <button @click="showMetadata = false">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div class="overflow-auto p-4 pt-0">
              <div class="flex flex-col md:flex-row gap-y-4 gap-x-8">
                <div>
                  <h2 class="text-sm text-slate-600">Details</h2>
                  <div>
                    <div>{{ currentPhotoMetadata.fileName }}</div>
                    <div class="text-sm text-slate-600">
                      <p>{{ currentPhotoMetadata.width }} x {{ currentPhotoMetadata.height }}, {{ currentPhotoMetadata.fileSize }}</p>
                      <p>{{ currentPhotoMetadata.device }}</p>
                    </div>
                    <div>
                      <a class="text-sm underline" :href="currentPhotoOriginalUrl" target="_blank">View Original</a>
                    </div>
                  </div>
                </div>

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

                <div v-if="currentPhoto.albums.length">
                  <h2 class="text-sm text-slate-600">Albums</h2>
                  <div v-for="album in currentPhoto.albums" :key="album.idAlias"> 
                    <router-link class="text-blue-600 underline" :to="{ name: 'album', params: { albumId: album.idAlias } }">{{ album.name }}</router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Toast></Toast>
  </dialog>
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
import Toast from './Toast.vue';

import { getLocationInfo, PHOTO_SIZES } from '../services/api';

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

export default {
  name: 'Lightbox',
  components: {
    LightboxSlide,
    Swiper,
    SwiperSlide,
    Toast,
  },
  props: {
    isSelectionMode: Boolean,
    selected: Object,
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
      const { fileName, fileSize, width, height, location, device } = this.currentPhoto.metadata;
      const date = this.currentPhoto.date;
      const parsedDate = dayjs(date);
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
      return this.currentPhoto.urls.view[PHOTO_SIZES.ORIGINAL];
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
    isCurrentPhotoSelected() {
      return this.selected[this.currentPhoto.id];
    }
  },
  watch: {
    location() {
      if (this.showMetadata) {
        this.loadLocation();
      }
    },
    showMetadata() {
      if (this.showMetadata) {
        this.loadLocation();
      }
    }
  },
  mounted() {
    this.$refs.dialog.showModal();
  },
  beforeUnmount() {
    this.close();
  },
  methods: {
    async loadLocation(retry = false) {
      if (this.location) {
        if (this._getLocationInfoAbortController) {
          this._getLocationInfoAbortController.abort();
        }

        this.loadingLocationInfo = true;
        this.currentPhotoLocationInfo = null;
        const { lat, long } = this.location;
        try {
          this._getLocationInfoAbortController = new AbortController();
          const data = await getLocationInfo(lat, long, this._getLocationInfoAbortController);
          if (data) {
            this.currentPhotoLocationInfo = data.label;
            this.loadingLocationInfo = false;
            this._getLocationInfoAbortController = null;
          } else {
            if (!retry) {
              setTimeout(() => {
                this.loadLocation(true);
              }, 3000);
            } else {
              this.loadingLocationInfo = false;
              this._getLocationInfoAbortController = null;
            }
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            this.loadingLocationInfo = false;
          }
        }
      }
    },

    close() {
      this.$refs.dialog.close();
      this.$emit('close');
    },

    toggleMenu() {
      this.showMenu = !this.showMenu;
    },

    download() {
      window.location.href = this.currentPhoto.urls.download;
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
    },

    enableSelectionMode() {
      this.$emit('enable-selection-mode');
    },
    select() {
      this.$emit('select', this.currentPhoto);
    }
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
    /* display: flex;
    justify-content: flex-end;
    align-items: center; */
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;

    background-color: rgba(0, 0, 0, 0.75);
    transition: opacity 0.2s linear;
  }
</style>
