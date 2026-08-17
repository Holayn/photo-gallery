<template>
  <dialog ref="dialog">
    <div class="lightbox">
      <div class="lightbox_menu lightbox_menugrid top-0 p-2 md:px-4" :style="{ opacity: showMenu ? 1 : 0, pointerEvents: showMenu ? 'all' : 'none' }">
        <div class="flex h-9">
          <button @click.stop="showMetadata = !showMetadata">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
        <div class="h-9 flex items-center">
          <div v-if="currentPhoto.date" class="text-white text-center">
            <div class="text-sm">{{ dateDisplay.day }} {{ dateDisplay.date }}</div>
            <div class="text-xs">{{ dateDisplay.time }}</div>
          </div>
          <div v-else>
            <div class="text-sm text-white text-center">Unknown Date</div>
          </div>
        </div>
        <div class="flex justify-end gap-4 h-9 items-center">
          <slot name="additionalHeaderControls"></slot>
          <button @click="close()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div v-if="!showMetadata" class="lightbox_menu bottom-0 pt-1 pb-4 px-2 md:px-4" :style="{ opacity: showMenu ? 1 : 0, pointerEvents: showMenu ? 'all' : 'none' }">
        <div ref="photoStrip" class="mb-3 flex gap-1 overflow-hidden">
          <button
            v-for="item in photoStripPhotos"
            :key="item.photo.id"
            :ref="el => setThumbRef(item.photo.id, el)"
            class="relative shrink-0 h-10 rounded-sm"
            :class="[item.index === index ? 'w-12 md:w-16' : 'w-8 md:w-10', { 'border-2': item.index === index }]"
            @click.stop="goToPhoto(item.index)"
          >
            <div v-if="thumbs[item.photo.id]?.error" class="h-full w-full rounded-sm bg-slate-700 flex items-center justify-center text-white text-xs">:(</div>
            <template v-else>
              <div v-if="!thumbs[item.photo.id]?.loaded" class="h-full w-full rounded-sm bg-slate-700 flex items-center justify-center">
                <Loading class="w-6 h-6"></Loading>
              </div>
              <img
                class="h-full w-full rounded-sm object-cover"
                :class="{ hidden: !thumbs[item.photo.id]?.loaded }"
                :src="item.photo.urls.view[photoStripPhotoSize]"
                :alt="item.photo.metadata.fileName"
                @load="thumbLoad(item.photo)"
                @error="thumbError(item.photo)"
              >
            </template>
            <div v-if="item.photo.metadata.video" class="absolute bottom-0.5 right-0.5">
              <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </button>
        </div>
        <div class="lightbox_menugrid">
          <div class="flex items-center gap-2">
            <button @click="sharePhoto()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </button>
            <template v-if="authStore.isLoggedIn">
              <button v-if="isSelectionMode" @click="select()">
                <svg v-if="isSelected" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
              </button>
              <button v-else @click="enableSelectionMode()">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              </button>
            </template>
          </div>
          <div class="flex justify-center items-center">
            <button @click.stop="toggleSlideshow()">
              <svg v-if="!isSlideshowPlaying" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            </button>
          </div>
          <div class="flex justify-end items-center">
            <button class="ml-4" @click.stop="download()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-col h-full">
        <swiper
          class="min-h-0 h-full w-full"
          :keyboard="{enabled: true, onlyInViewport: false}"
          :modules="modules"
          :space-between="50"
          :threshold="10"
          :initial-slide="index"
          centered-slides
          virtual
          zoom
          @activeIndexChange="_swiperOnActiveIndexChange"
          @afterInit="_swiperOnAfterInit"
          @click="toggleMenu"
        >
          <swiper-slide
            v-for="(photo, i) in photos"
            :key="i"
            :virtualIndex="i"
            :zoom="!photo.metadata.video"
          >
            <lightbox-slide
              :ref="el => setSlideRef(i, el)"
              :active="i === index"
              :index="i"
              :photo="photo"
              :preview-size="previewSize"
              @video-ended="onVideoEnded"
              @video-paused="onVideoPaused"
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

            <div class="overflow-auto p-4 pt-0 pb-12">
              <div class="flex flex-col md:flex-row gap-y-4 gap-x-8">
                <div>
                  <div>
                    <div>{{ currentPhoto.metadata.fileName }}</div>
                    <div class="text-sm text-slate-600">
                      <p>{{ currentPhoto.metadata.width }} x {{ currentPhoto.metadata.height }}, {{ currentPhoto.metadata.fileSize }}</p>
                      <p>{{ currentPhoto.metadata.device }}</p>
                    </div>
                    <div class="leading-none">
                      <a class="text-xs underline" :href="fullSizeUrl" target="_blank">View full size</a>
                    </div>
                    <div v-if="currentPhoto.source" class="text-xs text-slate-600 leading-none">
                      <router-link class="text-sm underline" :to="{ name: 'source', params: { sourceId: currentPhoto.source.id } }" @click="close()">{{ currentPhoto.source.alias }}</router-link>
                    </div>
                  </div>
                </div>

                <div v-if="currentPhoto.albums.length">
                  <h2 class="text-sm text-slate-600">Albums</h2>
                  <div v-for="album in currentPhoto.albums" :key="album.idAlias"> 
                    <router-link class="text-blue-600 underline" :to="{ name: 'album', params: { albumId: album.idAlias } }">{{ album.name }}</router-link>
                  </div>
                </div>

                <div>
                  <div class="flex flex-col md:flex-row gap-2">
                    <div>
                      <div class="text-sm text-slate-600">Location</div>
                      <div v-if="location && location.lat != null && location.long != null" class="flex flex-col gap-1">
                        <iframe
                          class="max-w-full"
                          width="360"
                          height="120"
                          style="border:0"
                          loading="lazy"
                          allowfullscreen
                          referrerpolicy="no-referrer-when-downgrade"
                          :src="`https://www.google.com/maps?q=${location.lat},${location.long}&z=14&output=embed`"
                        ></iframe>
                        <div>
                          <a class="text-black underline" :href="location.link" target="_blank">lat:{{ location.lat }}, long:{{ location.long }}, alt:{{ location.altitude ?? '--' }}</a>
                        </div>
                      </div>
                      <div v-else>Unknown Location</div>
                    </div>

                    <div v-if="currentPhoto.metadata.timezone">
                      <div class="text-sm text-slate-600">Timezone</div>
                      <div>{{ currentPhoto.metadata.timezone }}</div>
                    </div>
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
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import LightboxSlide from './LightboxSlide.vue';
import Loading from './Loading.vue';
import Toast from './Toast.vue';

import { PHOTO_SIZES, sharePhoto } from '../services/api';
import { useAuthStore } from '../store';

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

// Must be kept in sync with the photo strip thumbnail classes (w-16/h-16, w-10, gap-1, and the md: breakpoint).
const PHOTO_STRIP_ACTIVE_THUMB_SIZE = 48;
const PHOTO_STRIP_THUMB_SIZE = 32;
const PHOTO_STRIP_ACTIVE_THUMB_SIZE_DESKTOP = 64;
const PHOTO_STRIP_THUMB_SIZE_DESKTOP = 40;
const PHOTO_STRIP_THUMB_GAP = 4;
const PHOTO_STRIP_DESKTOP_BREAKPOINT = 768;

const SLIDESHOW_INTERVAL_MS = 5000;

export default {
  name: 'Lightbox',
  components: {
    LightboxSlide,
    Loading,
    Swiper,
    SwiperSlide,
    Toast,
  },
  props: {
    isSelectionMode: Boolean,
    selected: Object,
    index: {
      type: Number,
      required: true,
    },
    photos: {
      type: Array,
      required: true,
    },
    previewSize: {
      type: String,
      default: PHOTO_SIZES.SMALL,
    },
  },
  setup() {
    const authStore = useAuthStore();
    return {
      authStore,
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
      showMetadata: false,
      showMenu: true,
      thumbs: {},
      photoStripCount: 5,
      isSlideshowPlaying: false,
      slideshowTimer: null,
      slideRefs: {},
    }
  },
  computed: {
    currentPhoto() {
      return this.photos[this.index];
    },
    dateDisplay() {
      const date = this.currentPhoto.date;
      const { timezone } = this.currentPhoto.metadata;

      if (!date) {
        return null;
      }

      let parsedDate = dayjs(date);

      if (timezone) {
        if (timezone === 'UTC') {
          parsedDate = parsedDate.utc();
        } else {
          const offsetValue = parseInt(timezone.replace('UTC', ''), 10);
          if (offsetValue) {
            parsedDate = parsedDate.utc().utcOffset(offsetValue);
          }
        }
      }

      return {
        date: parsedDate.format('LL'),
        time: parsedDate.format('LTS'),
        day: parsedDate.format('dddd'),
      };
    },
    fullSizeUrl() {
      return this.currentPhoto.urls.view[PHOTO_SIZES.FULL];
    },
    location() {
      const { location } = this.currentPhoto.metadata;
      if (location?.unknown) {
        return null;
      } else if (location) {
        if (location.lat == null && location.long == null) {
          return null;
        } else {
          return {
            ...location,
            link: `https://www.google.com/maps/place/${location.lat},${location.long}`,
          };
        }
      }

      return null;
    },
    isSelected() {
      return this.selected[this.currentPhoto.id];
    },

    photoStripPhotos() {
      const start = Math.max(0, this.index - Math.floor(this.photoStripCount / 2));
      const end = Math.min(this.index + this.photoStripCount + start, this.photos.length);
      return this.photos.slice(start, end).map((photo, i) => ({ photo, index: start + i }));
    },
    photoStripPhotoSize() {
      return PHOTO_SIZES.THUMB;
    },
  },
  watch: {
    async index() {
      await this.$nextTick();
      this.scrollThumbIntoView();

      if (this.isSlideshowPlaying) {
        this.scheduleSlideshowAdvance();
      }
    },
    async showMetadata(showMetadata) {
      if (!showMetadata) {
        await this.$nextTick();
        this.updatePhotoStripCount();
        this.scrollThumbIntoView();
      }
    },
  },
  mounted() {
    this.$refs.dialog.showModal();
    document.body.style.overflow = 'hidden';

    this.updatePhotoStripCount();
    window.addEventListener('resize', this.updatePhotoStripCount);

    this.$nextTick(() => this.scrollThumbIntoView());
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updatePhotoStripCount);
    clearTimeout(this.slideshowTimer);
    this.close();
  },
  methods: {
    close() {
      this.$refs.dialog?.close();
      document.body.style.overflow = '';
      this.$emit('close');
    },

    updatePhotoStripCount() {
      const container = this.$refs.photoStrip;
      if (!container) {
        return;
      }

      const isDesktop = window.innerWidth >= PHOTO_STRIP_DESKTOP_BREAKPOINT;
      const sideThumbSize = isDesktop ? PHOTO_STRIP_THUMB_SIZE_DESKTOP : PHOTO_STRIP_THUMB_SIZE;

      const availableWidth = isDesktop 
        ? container.clientWidth - PHOTO_STRIP_ACTIVE_THUMB_SIZE_DESKTOP - PHOTO_STRIP_THUMB_GAP 
        : container.clientWidth - PHOTO_STRIP_ACTIVE_THUMB_SIZE - PHOTO_STRIP_THUMB_GAP;
      const sideCount = Math.max(0, Math.floor(availableWidth / (sideThumbSize + PHOTO_STRIP_THUMB_GAP)));

      // Just bump up a little extra so there's a little overflow.
      const buffer = 2;

      this.photoStripCount = sideCount + buffer;
    },

    toggleMenu() {
      this.showMenu = !this.showMenu;
    },

    download() {
      window.location.href = this.currentPhoto.urls.download;
    },

    _swiperOnAfterInit(swiper) {
      this.swiper = swiper;

      setTimeout(() => {
        const appHeight = () => document.documentElement.style.setProperty('--lightbox-height', `${window.innerHeight}px`);
        window.addEventListener('resize', appHeight);
        appHeight();
      });

      // Prevent slides from changing while pinch-zooming, which looks janky.
      const activePointers = new Set();
      const setSlideEnabled = (enabled) => {
        swiper.allowSlideNext = enabled;
        swiper.allowSlidePrev = enabled;
      };
      swiper.el.addEventListener('pointerdown', (e) => {
        activePointers.add(e.pointerId);
        if (activePointers.size >= 2) setSlideEnabled(false);
      });
      const onPointerUp = (e) => {
        activePointers.delete(e.pointerId);
        if (activePointers.size < 2) setSlideEnabled(true);
      };
      swiper.el.addEventListener('pointerup', onPointerUp);
      swiper.el.addEventListener('pointercancel', onPointerUp);
    },
    _swiperOnActiveIndexChange({ activeIndex }) {
      this.$emit('index-update', activeIndex);
    },

    goToPhoto(index) {
      this.swiper?.slideTo(index);
    },

    toggleSlideshow() {
      if (this.isSlideshowPlaying) {
        this.stopSlideshow();
      } else {
        this.startSlideshow();
      }
    },
    startSlideshow() {
      this.isSlideshowPlaying = true;

      if (this.currentPhoto.metadata.video) {
        this.slideRefs[this.index]?.play();
      }

      this.scheduleSlideshowAdvance();
    },
    stopSlideshow() {
      this.isSlideshowPlaying = false;
      clearTimeout(this.slideshowTimer);
      this.slideshowTimer = null;
    },
    scheduleSlideshowAdvance() {
      clearTimeout(this.slideshowTimer);
      this.slideshowTimer = null;

      // Video slides advance on the video's own 'ended' event instead of a fixed timer.
      if (this.currentPhoto.metadata.video) {
        return;
      }

      this.slideshowTimer = setTimeout(() => this.advanceSlideshow(), SLIDESHOW_INTERVAL_MS);
    },
    advanceSlideshow() {
      const nextIndex = this.index + 1 >= this.photos.length ? 0 : this.index + 1;
      this.goToPhoto(nextIndex);
    },
    onVideoEnded() {
      if (this.isSlideshowPlaying) {
        this.advanceSlideshow();
      }
    },
    onVideoPaused() {
      if (this.isSlideshowPlaying) {
        this.stopSlideshow();
      }
    },

    setSlideRef(index, el) {
      if (el) {
        this.slideRefs[index] = el;
      } else {
        delete this.slideRefs[index];
      }
    },
    setThumbRef(photoId, el) {
      if (el) {
        (this.thumbs[photoId] ??= {}).ref = el;
      } else if (this.thumbs[photoId]) {
        delete this.thumbs[photoId].ref;
      }
    },
    scrollThumbIntoView() {
      this.thumbs[this.currentPhoto.id]?.ref?.scrollIntoView({ inline: 'center', block: 'nearest' });
    },
    thumbLoad(photo) {
      (this.thumbs[photo.id] ??= {}).loaded = true;
    },
    thumbError(photo) {
      (this.thumbs[photo.id] ??= {}).error = true;
    },

    enableSelectionMode() {
      this.$emit('enable-selection-mode');
    },
    select() {
      this.$emit('select', this.currentPhoto);
    },

    async sharePhoto() {
      if (!this.currentPhoto.shareUrl) {
        if (!confirm('Are you sure you want to share this photo? This link will be publicly accessible.')) {
          return;
        }

        this.currentPhoto.shareUrl = await sharePhoto(this.currentPhoto);
      }

      window.navigator.clipboard.writeText(`${window.location.origin}${this.currentPhoto.shareUrl}`);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Copied link to clipboard',
        }
      }))
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

    /* Prevents the browser from hijacking pinch gestures for native page zoom. Without this, the browser can take over mid-pinch, and Swiper never receives the pointerup events, leaving its zoom state stuck. */
    touch-action: none;
  }

  .lightbox_menu {
    position: absolute;
    left: 0;
    width: 100%;
    z-index: 99;

    background-color: rgba(0, 0, 0, 0.75);
    transition: opacity 0.2s linear;
  }

  .lightbox_menugrid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
</style>
