<template>
  <div ref="photos" class="relative" :style="{ height: `${layout?.containerHeight}px` }">
    <div 
      v-if="layout" 
      v-for="(photo, i) in renderPhotos" 
      :ref="setLayoutItemRef"
      :key="photo.id" 
      :data-photo-id="photo.id"
      :data-photo="getPhotoUrl(photo)"
      style="position: absolute;" 
      :style="{ 
        top: layout.boxes[i + renderPhotosStart].top + 'px', 
        left: layout.boxes[i + renderPhotosStart].left + 'px', 
        width: layout.boxes[i + renderPhotosStart].width + 'px', 
        height: layout.boxes[i + renderPhotosStart].height + 'px',
      }"
    >
      <button v-if="loadedImageErrors[photo.id]" class="w-full h-full border rounded-sm flex flex-col justify-center items-center gap-1" style="border-color: var(--theme-color-main);" @click="retryLoadImg(photo)">
        <div class="text-xs">load failed</div>
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
      </button>
      <div v-else-if="!loadedImages[photo.id]" class="flex justify-center items-center w-full h-full">
        <Loading class="w-8 h-8"></Loading>
      </div>
      <div v-if="showDates" class="absolute -bottom-8 h-8 px-1">
        <div class="text-xs">{{ formatPhotoDate(photo.date) }}</div>
      </div>
      <button @click="openLightbox(photo)">
        <img
          v-if="!loadedImageErrors[photo.id]"
          :ref="imgRender"
          :src="getPhotoUrl(photo)"
          :data-photo-id="photo.id"
          :style="{
            width: layout.boxes[i + renderPhotosStart].width + 'px', 
            height: layout.boxes[i + renderPhotosStart].height + 'px',
            opacity: loadedImages[photo.id] ? 1 : 0,
            objectFit: 'cover',
          }"
          style="transition: opacity 500ms linear;"
          @load="imgLoad(photo)"
          @error="imgError(photo)"
        >
      </button>
      <div v-if="photo.metadata.video" class="overlay flex items-end justify-end">
        <div class="text-white text-xs md:text-base md:mb-1 mr-1 md:mr-2">{{ photo.metadata.duration }}</div>
        <svg class="w-4 h-4 md:w-6 md:h-6 md:mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </div>
      <div v-if="photo.albums?.length" class="overlay flex justify-end items-start">
        <div class="bg-gray-500/50 md:mt-1 md:mr-1 p-1 rounded-full">
          <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>  
        </div>
      </div>
      <div v-if="isPhotoNew(photo)" class="overlay flex justify-start items-end">
        <div class="bg-gray-500/50 md:mb-1 md:ml-1 p-1 rounded-full flex items-center">
          <sl-icon class="text-white" name="stars"></sl-icon>
        </div>
      </div>
      <template v-if="isSelectionMode">
        <div v-if="selected[photo.id]" class="absolute top-0 w-full h-full pointer-events-none bg-white/50"></div>
        <div class="absolute top-0 right-0">
          <button class="p-2" @click="select(photo)">
            <div v-if="selected[photo.id]" class="text-orange-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div v-else class="text-orange-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            </div>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import justifiedLayout from 'justified-layout';
import dayjs from 'dayjs';
import { debounce, isElementFullyInView } from '../utils';
import Loading from './Loading.vue';

export const LAYOUT_TYPES = {
  AUTO: 'auto',
  JUSTIFIED: 'justified',
  TILE: 'tile',
};

const SMALL_SCREEN_THRESHOLD = 500;
const TILE_MODE_IMAGE_HEIGHT = 90;
const TILE_MODE_SMALL_SCREEN_NUM_COLUMNS = 5;
const JUSTIFIED_MODE_IMAGE_HEIGHT = 150;
const PHOTO_GRID_GAP = 2;

function isSmallScreen() {
  return window.innerWidth < SMALL_SCREEN_THRESHOLD;
}

function isTileMode(layoutType) {
  return layoutType === LAYOUT_TYPES.TILE || (layoutType === LAYOUT_TYPES.AUTO && isSmallScreen());
}

function getTileModeImageHeight() {
  return Math.min((window.innerWidth / TILE_MODE_SMALL_SCREEN_NUM_COLUMNS) - (PHOTO_GRID_GAP * 4), TILE_MODE_IMAGE_HEIGHT);
}

function getLayoutItemHeight(layoutType = LAYOUT_TYPES.JUSTIFIED) {
  if (layoutType === LAYOUT_TYPES.TILE) {
    return getTileModeImageHeight();
  }
  return JUSTIFIED_MODE_IMAGE_HEIGHT;
}

export default {
  name: 'PhotoGrid',
  components: {
    Loading,
  },
  props: {
    photos: {
      type: Array,
      required: true,
    },
    layoutType: {
      type: String,
      default: LAYOUT_TYPES.JUSTIFIED,
    },
    showDates: {
      type: Boolean,
      default: false,
    },
    isSelectionMode: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: Object,
      default: () => ({}),
    },
    newPhotos: {
      type: Array,
      default: () => ([]),
    },
  },
  emits: [
    'open-lightbox',
    'select',
    'selection-change',
    'layout-update',
  ],
  data() {
    return {
      layout: null,
      renderPhotosStart: 0,
      renderPhotosEnd: 0,
      loadedImages: {},
      loadedImageErrors: {},
      layoutItemRefs: [],
      isShiftPressed: false,
      lastSelected: null,

      imgEls: {},
      
      LAYOUT_TYPES,
    };
  },
  computed: {
    renderPhotos() {
      if (this.renderPhotosStart == null || this.renderPhotosEnd == null) {
        return [];
      }
      return this.photos.slice(this.renderPhotosStart, this.renderPhotosEnd);
    },
    renderPhotosIds() {
      return new Set(this.renderPhotos.map(photo => photo.id));
    },
    photosMap() {
      return this.photos.reduce((acc, photo) => {
        acc[photo.id] = photo;
        return acc;
      }, {});
    },
  },
  watch: {
    renderPhotos() {
      Object.keys(this.loadedImages).forEach(photoId => {
        if (!this.renderPhotosIds.has(photoId)) {
          delete this.loadedImages[photoId];
        }
      });
      Object.keys(this.imgEls).forEach(photoId => {
        if (!this.renderPhotosIds.has(photoId)) {
          this.imgEls[photoId].src = '';
          delete this.imgEls[photoId];
          delete this.loadedImageErrors[photoId];
        }
      });
    },
    photos() {
      this.updateRenderPhotos();
    },
    layoutType() {
      this.updateRenderPhotos();
    },
    showDates() {
      this.updateRenderPhotos();
    },
    isSelectionMode() {
      this.lastSelected = null;
    },
  },
  mounted() {
    this._updateRenderPhotosDebounce = debounce(() => this.updateRenderPhotos(false));
    this._updateRenderPhotosUpdateLayoutDebounce = debounce(() => this.updateRenderPhotos(), 50);
    
    window.addEventListener('scroll', this._updateRenderPhotosDebounce);
    window.addEventListener('resize', this._updateRenderPhotosUpdateLayoutDebounce);
    
    // Handle keyboard events for shift key
    this.keydown = (e => {
      this.isShiftPressed = e.key === 'Shift';
    }).bind(this);
    this.keyup = (e => {
      if (e.key === 'Shift') {
        this.isShiftPressed = false;
      }
    }).bind(this);
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
    
    // Initial layout update
    this.$nextTick(() => {
      this.updateRenderPhotos();
    });
  },
  beforeUnmount() {
    window.removeEventListener('resize', this._updateRenderPhotosUpdateLayoutDebounce);
    window.removeEventListener('scroll', this._updateRenderPhotosDebounce);
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
  },
  beforeUpdate() {
    this.layoutItemRefs = [];
  },
  methods: {
    updateLayout() {
      this.layout = justifiedLayout([...this.photos.map(p => ({
        width: isTileMode(this.layoutType) ? getTileModeImageHeight() : p.metadata.width,
        height: isTileMode(this.layoutType) ? getTileModeImageHeight() : p.metadata.height,
      }))], {
        containerPadding: 0,
        containerWidth: this.$refs.photos?.getBoundingClientRect().width,
        targetRowHeight: getLayoutItemHeight(this.layoutType),
        boxSpacing: {
          horizontal: PHOTO_GRID_GAP,
          vertical: this.showDates ? 32 : PHOTO_GRID_GAP,
        }
      });
    },
    async updateRenderPhotos(updateLayout = true) {
      if (updateLayout) {
        this.updateLayout();
      }
      
      if (!this.layout) return;
      
      let start = null;
      let end = null;

      // Add a buffer zone to prevent aggressive unloading, which can cause weird scroll jumping behavior in certain browsers.
      const buffer = window.innerHeight / 2;

      for (let i = 0; i < this.layout.boxes.length; i++) {
        const box = this.layout.boxes[i];
        if ((box.top + box.height + this.$refs.photos?.offsetTop > window.scrollY - buffer) && (box.top + this.$refs.photos?.offsetTop < window.scrollY + window.innerHeight)) {
          if (start === null) {
            start = i;
          }
        } else {
          if (start !== null) {
            end = i;
            break;
          }
        }
      }
      if (end === null) {
        end = this.layout.boxes.length;
      }
      this.renderPhotosStart = start;
      this.renderPhotosEnd = end;

      if (updateLayout) {
        // Scrollbar may show now, so re-update layout to accommodate for that.
        await this.$nextTick();
        this.updateLayout();
      }
    },
    
    getPhotoUrl(photo) {
      const PHOTO_SIZES = {
        THUMB: 'thumb',
        SMALL: 'small',
      };

      let size = PHOTO_SIZES.SMALL;
      
      if (this.layoutType === LAYOUT_TYPES.TILE) {
        size = PHOTO_SIZES.THUMB;
      }

      return photo.urls.view[size];
    },
    
    formatPhotoDate(date) {
      return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : 'Unknown Date';
    },
    
    imgLoad(photo) {
      this.loadedImages[photo.id] = true;
      delete this.loadedImageErrors[photo.id];
    },
    
    imgError(photo) {
      if (this.renderPhotosIds.has(photo.id) && !this.loadedImages[photo.id]) {
        this.loadedImageErrors[photo.id] = true;
      }
    },
    
    retryLoadImg(photo) {
      delete this.loadedImageErrors[photo.id];
    },
    
    setLayoutItemRef(el) {
      if (el) {
        this.layoutItemRefs.push({
          el,
          photo: this.photos.find(photo => photo.id === el.dataset.photoId),
        });
      }
    },
    
    imgRender(el) {
      if (el && el.complete && !this.loadedImages[el.dataset.photoId] && !this.loadedImageErrors[el.dataset.photoId]) {
        this.imgLoad(this.photosMap[el.dataset.photoId]);
      }
      if (el) {
        this.imgEls[el.dataset.photoId] = el;
      }
    },
    
    openLightbox(photo) {
      this.$emit('open-lightbox', photo);
    },
    
    select(photo) {
      const newSelected = { ...this.selected };
      
      if (newSelected[photo.id]) {
        this.lastSelected = null;
        delete newSelected[photo.id];
      } else {
        newSelected[photo.id] = {
          sourceId: photo.sourceId,
          sourceFileId: photo.sourceFileId,
        };

        if (this.isShiftPressed && this.lastSelected !== null) {
          let start, end;

          const indexOfLastSelected = this.photos.findIndex(p => p.id === this.lastSelected);
          const indexOfSelected = this.photos.findIndex(p => p.id === photo.id);

          if (indexOfSelected > indexOfLastSelected) {
            start = indexOfLastSelected;
            end = indexOfSelected;
          } else {
            start = indexOfSelected;
            end = indexOfLastSelected;
          }

          for (let i = start; i <= end; i++) {
            const { id, sourceId, sourceFileId } = this.photos[i];
            newSelected[id] = {
              sourceId,
              sourceFileId,
            };
          }
        }

        this.lastSelected = photo.id;
      }
      
      this.$emit('selection-change', {
        selected: newSelected,
        lastSelected: this.lastSelected,
      });
    },

    isPhotoNew(photo) {
      return this.newPhotos.find(p => p.id === photo.id);
    },
    
    // Public methods for parent component
    getImageRefByPhotoIndex(index) {
      return this.layoutItemRefs.find(ref => ref.photo === this.photos[index]);
    },
    async scrollImageIntoView(index) {
      const ref = this.getImageRefByPhotoIndex(index);
      if (ref) {
        const fullyInView = await isElementFullyInView(ref.el);
        if (!fullyInView) {
          ref.el.scrollIntoView();
        }
      }
    },
  },
};
</script>

<style scoped>
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    pointer-events: none;
  }
</style>
