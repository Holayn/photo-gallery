<template>
  <button class="h-full w-full rounded-md flex flex-col" @click="onClick">
    <div class="flex-auto p-1 bg-slate-100">
      <div v-if="error" class="h-full flex items-center justify-center">
        <div class="text-red-500 px-2">Failed to load cover</div>
      </div>
      <div v-else-if="covers" class="grid grid-cols-2 grid-rows-2 gap-1 h-full">
        <div
          v-for="(photo, i) in covers"
          :key="photo.id"
          class="relative select-none"
          style="aspect-ratio: 1/1; -webkit-touch-callout: none;"
          @pointerdown="onPointerDown($event, i)"
          @pointerup="onPointerUp"
          @pointermove="onPointerMove"
          @pointerleave="onPointerCancel"
          @pointercancel="onPointerCancel"
          @contextmenu.prevent
        >
          <div v-if="errorImages[photo.id]" class="flex justify-center items-center w-full h-full py-4">
            <div>:(</div>
          </div>
          <div v-else-if="!loadedImages[photo.id]" class="flex justify-center items-center w-full h-full py-4">
            <Loading class="w-8 h-8"></Loading>
          </div>
          <img class="rounded-sm w-full h-full object-cover" :class="{ 'hidden': !loadedImages[photo.id] }" :src="thumbSrc(photo)" @load="imgLoad(photo)" @error="imgError(photo)">

          <svg v-if="pressingIndex === i" class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 36 36">
            <circle
              class="press-ring"
              :class="{ 'press-ring--filling': pressRingFilling }"
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="white"
              stroke-width="3"
            />
          </svg>
        </div>
      </div>
      <div v-else class="flex h-full items-center justify-center" style="aspect-ratio: 1/1;">
        <Loading class="w-8 h-8 my-4"></Loading>
      </div>
    </div>

    <div class="h-16 p-1 w-full">
      <slot></slot>
    </div>
  </button>

  <Lightbox
    v-if="showLightbox"
    :photos="covers"
    :index="lightboxIndex"
    :is-selection-mode="false"
    :selected="{}"
    @close="showLightbox = false"
    @index-update="lightboxIndex = $event"
  ></Lightbox>
</template>

<script>
import Lightbox from './Lightbox.vue';
import Loading from './Loading.vue';
import { PHOTO_SIZES } from '../services/api';

// Must be kept in sync with the .press-ring--filling transition duration below.
const LONG_PRESS_DURATION_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

export default {
  name: 'CollectionTile',
  components: {
    Lightbox,
    Loading,
  },
  props: {
    covers: {
      type: Array,
      default: null,
    },
    error: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  data() {
    return {
      loadedImages: {},
      errorImages: {},
      pressingIndex: null,
      pressRingFilling: false,
      pressTimer: null,
      pressStart: null,
      longPressFired: false,
      showLightbox: false,
      lightboxIndex: 0,
    };
  },
  beforeUnmount() {
    clearTimeout(this.pressTimer);
  },
  methods: {
    onClick() {
      if (this.longPressFired) {
        this.longPressFired = false;
        return;
      }

      this.$emit('click');
    },

    thumbSrc(photo) {
      return photo.urls.view[PHOTO_SIZES.THUMB];
    },
    imgLoad(photo) {
      this.loadedImages[photo.id] = true;
    },
    imgError(photo) {
      this.errorImages[photo.id] = true;
    },

    onPointerDown(event, i) {
      this.pressingIndex = i;
      this.pressRingFilling = false;
      this.pressStart = { x: event.clientX, y: event.clientY };

      // Double rAF forces a style flush between setting the ring to its empty
      // state and adding the class that transitions it to full, so the fill
      // animation actually plays instead of jumping straight to complete.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.pressingIndex === i) {
            this.pressRingFilling = true;
          }
        });
      });

      this.pressTimer = setTimeout(() => {
        this.longPressFired = true;
        this.pressingIndex = null;
        this.lightboxIndex = i;
        this.showLightbox = true;
      }, LONG_PRESS_DURATION_MS);
    },
    onPointerMove(event) {
      if (this.pressingIndex === null || !this.pressStart) {
        return;
      }

      const dx = event.clientX - this.pressStart.x;
      const dy = event.clientY - this.pressStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_THRESHOLD_PX) {
        this.cancelPress();
      }
    },
    onPointerUp() {
      this.cancelPress();
    },
    onPointerCancel() {
      this.cancelPress();
    },
    cancelPress() {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
      this.pressingIndex = null;
      this.pressRingFilling = false;
      this.pressStart = null;
    },
  },
}
</script>
<style scoped>
  .press-ring {
    stroke-dasharray: 97.4;
    stroke-dashoffset: 97.4;
  }
  .press-ring--filling {
    stroke-dashoffset: 0;
    transition: stroke-dashoffset 500ms linear;
  }
</style>
