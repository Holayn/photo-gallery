<template>
  <div ref="gallery" class="absolute inset-0 overflow-auto py-12" style="top: var(--header-height);">
    <div class="px-4 md:px-8 flex gap-4">
      <div class="flex-auto break-all">
        <slot name="heading"></slot>
      </div>
      <div>
        <sl-dropdown>
          <sl-icon-button slot="trigger" class="text-xl" name="arrow-down-up"></sl-icon-button>
          <sl-menu @sl-select="onSortSelect">
            <sl-menu-label>Sort by...</sl-menu-label>
            <sl-menu-item value="dateAsc">
              <sl-icon v-if="sort === 'dateAsc'" slot="prefix" name="check-lg"></sl-icon>
              Date (Earliest)
            </sl-menu-item>
            <sl-menu-item value="dateDesc">
              <sl-icon v-if="sort === 'dateDesc'" slot="prefix" name="check-lg"></sl-icon>
              Date (Latest)
            </sl-menu-item>
            <sl-menu-item v-if="canSortByDateAdded" value="dateAdded">
              <sl-icon v-if="sort === 'dateAdded'" slot="prefix" name="check-lg"></sl-icon>
              Date Added
            </sl-menu-item>
          </sl-menu>
        </sl-dropdown>
        <sl-dropdown>
          <sl-icon-button slot="trigger" class="text-xl" name="three-dots-vertical"></sl-icon-button>
          <sl-menu @sl-select="onOptionsSelect">
            <sl-menu-item value="viewDates" type="checkbox">
              Show Dates
            </sl-menu-item>
          </sl-menu>
        </sl-dropdown>
      </div>
      <Teleport to="#headerAdditionalControls">
        <div v-if="$store.state.isLoggedIn" class="flex gap-4 justify-end">
          <div v-if="isSelectionMode" class="flex flex-col md:flex-row items-end md:items-center gap-2">
            <div>Selected: {{ Object.keys(selected).length }}</div>
            <div class="relative">
              <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="removeSelectedFromAlbum()">Delete From Album</button>
              <div class="absolute top-0 left-0 flex justify-center w-full">
                <Loading v-if="loadingRemoveFromAlbum" class="h-8 w-8"></Loading>
              </div>
            </div>
            <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="showAlbumSelection()">Add to Existing Album</button>
            <div class="relative">
              <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="createAlbumFromSelected()">Create Album</button>
              <div class="absolute top-0 left-0 flex justify-center w-full">
                <Loading v-if="loadingCreateAlbum" class="h-8 w-8"></Loading>
              </div>
            </div>
            <button @click="toggleSelectionMode(false)">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div v-else class="flex items-center"> 
            <div v-if="showDateSelection" class="mr-8"> 
              <input v-model="date" type="date" @blur="onDateBlur">
            </div>
            <button @click="toggleSelectionMode(true)">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            </button>
          </div>
          <slot name="controls"></slot>
        </div>
      </Teleport>
    </div>

    <div v-if="$slots.notices || hasNewPhotos" class="px-4 md:px-8 mt-2 flex flex-col gap-1">
      <slot name="notices"></slot>
      <template v-if="hasNewPhotos && !isViewModeNewOnly">
        <div class="bg-blue-200 border border-blue-300 py-1 px-2 flex items-center gap-2 h-10">
          <div class="flex items-center gap-1">
            <sl-icon class="text-white" name="stars"></sl-icon>
            New photos have been added
          </div>
          <sl-button size="small" @click="viewNewPhotos">View</sl-button>
        </div>
      </template>
      <template v-if="hasNewPhotos && isViewModeNewOnly">
        <div class="bg-blue-200 border border-blue-300 py-1 px-2 flex items-center gap-2 h-10">
          Viewing new photos
          <sl-button size="small" @click="viewAllPhotos">View All Photos</sl-button>
        </div>
      </template>
    </div>

    <div ref="photos" class="mt-4 relative" :style="{ height: `${layout?.containerHeight}px` }">
      <div 
        v-if="layout" 
        v-for="(photo, i) in renderPhotos" 
        :ref="setGalleryImageRef"
        :key="photo.id" 
        :data-photo-id="photo.id"
        style="position: absolute;" 
        :style="{ 
          top: layout.boxes[i + renderPhotosStart].top + 'px', 
          left: layout.boxes[i + renderPhotosStart].left + 'px', 
          width: layout.boxes[i + renderPhotosStart].width + 'px', 
          height: layout.boxes[i + renderPhotosStart].height + 'px',
        }"
      >
        <div v-if="loadedImageErrors[photo.id]" class="flex justify-center items-center w-full h-full text-xs">
          load failed
        </div>
        <div v-else-if="!loadedImages[photo.id]" class="flex justify-center items-center w-full h-full">
          <Loading class="w-8 h-8"></Loading>
        </div>
        <div v-if="showDates" class="absolute -bottom-8 h-8 px-1">
          <div class="text-xs">{{ formatPhotoDate(photo.date) }}</div>
        </div>
        <button @click="openLightbox(photo)">
          <img 
            :src="getPhotoUrl(photo)"
            :style="{
              width: layout.boxes[i + renderPhotosStart].width + 'px', 
              height: layout.boxes[i + renderPhotosStart].height + 'px',
              opacity: loadedImages[photo.id] ? 1 : 0,
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
        <div v-if="photo.albums.length" class="overlay flex justify-end items-start">
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

    <div v-if="$slots.loading" class="mt-8"></div>
    <slot name="loading">
      <div v-if="isNoPhotos" class="text-center">No photos found.</div>
    </slot>
    
    <Lightbox v-if="isShowLightbox" :is-selection-mode="isSelectionMode" :selected="selected" @close="closeLightbox()" @enable-selection-mode="toggleSelectionMode(true)" @select="photo => select(photo)"></Lightbox>

    <Modal v-if="showAddToExistingAlbum" @close="showAddToExistingAlbum = false">
      <div class="w-[500px] max-w-full">
        <div v-if="loadingAlbums" class="flex justify-center">
          <Loading class="w-16 h-16"></Loading>
        </div>
        <div v-else class="grid gap-2">
          <button v-for="album in albums" :key="album.id" class="py-2 px-4 bg-slate-50 flex w-full text-left" @click="addToAlbumFromSelected(album)">
            <div class="flex-auto">{{ album.name }}</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import justifiedLayout from 'justified-layout';
import dayjs from 'dayjs';

import { getAlbums, createAlbum, addToAlbum, deleteFromAlbum } from '../services/api';
import { debounce, getGalleryImageHeight, getMobileGalleryImageHeight, isMobileScreen, getFetchedGalleryPhotoSize, isElementFullyInView } from '../utils';

import Lightbox from '../components/Lightbox.vue'
import Loading from '../components/Loading.vue';
import Modal from '../components/Modal.vue';

export default {
  name: 'Gallery',
  components: {
    Lightbox,
    Loading,
    Modal,
  },
  props: {
    album: Boolean,
    albumId: String,
    showDateSelection: Boolean,
    showLightbox: Boolean,
    defaultSort: {
      type: String,
      default: 'dateDesc',
    }
  },
  data() {
    return {
      date: null,

      galleryImageRefs: [],

      albums: [],
      loadingCreateAlbum: false,
      loadingAlbums: false,
      loadingRemoveFromAlbum: false,
      showAddToExistingAlbum: false,

      renderPhotosStart: 0,
      renderPhotosEnd: 0,
      loadedImages: {},
      loadedImageErrors: {},
      layout: null,

      isSelectionMode: false,
      selected: {},
      lastSelected: null,
      isShiftPressed: false,

      isShowLightbox: false,

      sort: this.defaultSort,
      viewMode: null,
      showDates: false,
    };
  },
  computed: {
    lightboxIndex() {
      return this.$store.state.lightbox.photoIndex;
    },
    isNoPhotos() {
      return this.photos.length === 0;
    },
    token() {
      return this.$store.state.token;
    },
    photos() {
      if (this.isViewModeNewOnly) {
        return this.$store.state.photos.filter(photo => this.isPhotoNew(photo));
      }

      return this.$store.state.photos.sort((a, b) => {
        if (this.sort === 'dateDesc') {
          return b.date - a.date;
        } else if (this.sort === 'dateAsc') {
          return a.date - b.date;
        } else if (this.sort === 'dateAdded') {
          return (b.createdAt || b.date) - (a.createdAt || a.date);
        }
      });
    },
    renderPhotos() {
      return this.photos.slice(this.renderPhotosStart, this.renderPhotosEnd);
    },
    hasNewPhotos() {
      if (!getLastViewed(this.albumId)) {
        return false;
      }
      return this.photos.some(photo => photo.createdAt > getLastViewed(this.albumId));
    },
    isViewModeNewOnly() {
      return this.viewMode === 'newOnly';
    },
    canSortByDateAdded() {
      return this.photos.some(photo => photo.createdAt);
    },
  },
  watch: {
    async lightboxIndex() {
      await this.scrollLightboxImageIntoView();
      this.updateRenderPhotos();
    },
    showLightbox() {
      if (this.showLightbox) {
        this.openLightbox();
      } else {
        this.closeLightbox(false);
      }
    },
    isShowLightbox() {
      this.updateLightboxQueryParam();
    },
    isSelectionMode() {
      this.lastSelected = null;
    },
  },
  created() {
    // Ensure the page isn't loaded with this query parameter set.
    this.removeLightboxParam(true);

    this._updateRenderPhotosDebounce = debounce(() => this.updateRenderPhotos(), 50);

    this.updateLastViewed();
  },
  async mounted() {
    this.$refs.gallery.addEventListener('scroll', this._updateRenderPhotosDebounce);
    window.addEventListener('resize', this._updateRenderPhotosDebounce);
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
  },
  beforeUnmount() {
    window.removeEventListener('resize', this._updateRenderPhotosDebounce);
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
  },
  beforeUpdate() {
    this.galleryImageRefs = [];
  },
  methods: {
    updateLayout() {
      this.layout = justifiedLayout([...this.photos.map(p => ({
        width: isMobileScreen() ? getMobileGalleryImageHeight() : p.metadata.width,
        height: isMobileScreen() ? getMobileGalleryImageHeight() : p.metadata.height,
      }))], {
        containerPadding: 0,
        containerWidth: this.$refs.photos?.getBoundingClientRect().width,
        targetRowHeight: getGalleryImageHeight(),
        boxSpacing: {
          horizontal: 2,
          vertical: this.showDates ? 32 : 2,
        }
      });
    },
    async updateRenderPhotos() {
      this.updateLayout();
      let start = null;
      let end = null;
      for (let i = 0; i < this.layout.boxes.length; i++) {
        const box = this.layout.boxes[i];
        if ((box.top + box.height + 128 > this.$refs.gallery.scrollTop) && (box.top < this.$refs.gallery.scrollTop + this.$refs.gallery.getBoundingClientRect().height)) {
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

      // Scrollbar may show now, so re-update layout to accommodate for that.
      await this.$nextTick();
      this.updateLayout();
    },
    
    getPhotoUrl(photo) {
      return photo.urls.view[getFetchedGalleryPhotoSize()];
    },

    imgLoad(photo) {
      this.loadedImages[photo.id] = true;
    },
    imgError(photo) {
      this.loadedImageErrors[photo.id] = true;
      console.error('Failed to load photo', photo);
    },
    
    async scrollLightboxImageIntoView() {
      const ref = this.getGalleryImageRefForLightboxPhoto();
      if (ref) {
        const fullyInView = await isElementFullyInView(ref.el);
        if (!fullyInView) {
          ref.el.scrollIntoView();
        }
      }
    },
    setGalleryImageRef(el) {
      if (el) {
        this.galleryImageRefs.push({
          el,
          photo: this.photos.find(photo => photo.id === el.dataset.photoId),
        });
      }
    },
    getGalleryImageRefForLightboxPhoto() {
      const lightboxPhoto = this.photos[this.lightboxIndex];
      const galleryPhotoRef = this.galleryImageRefs.find(ref => ref.photo === lightboxPhoto);
      return galleryPhotoRef;
    },

    openLightbox(photo) {
      if (!this.isShowLightbox) {
        this.isShowLightbox = true;

        if (photo) {
          this.$store.state.lightbox.photoIndex = this.photos.findIndex(p => p === photo);
          if (this.isPhotoNew(photo)) {
            this.clearLastViewed();
          }
        }
      }
    },
    closeLightbox(showTransition = true) {
      if (this.isShowLightbox) {
        this.isShowLightbox = false;

        // Helps to show which photo was just being viewed in the lightbox.
        if (showTransition) {
          const ref = this.getGalleryImageRefForLightboxPhoto();
          if (ref) {
            ref.el.style.zIndex = '1';
            ref.el.animate([
              {
                transform: 'scale(4)',
              },
              {
                transform: 'scale(1)',
              }
            ], { duration: 250, easing: 'ease-in' }).finished.then(() => {
              ref.el.style.zIndex = '';
            });
          }
        }
      }
    },
    updateLightboxQueryParam() {
      if (this.isShowLightbox && !this.$route.query.showLightbox) {
        this.$router.push({ path: this.$route.path, query: { ...this.$route.query, showLightbox: true } });
      } else if (!this.isShowLightbox) {
        this.removeLightboxParam();
      }
    },
    removeLightboxParam(replace) {
      const queryParams = { ...this.$route.query };
      delete queryParams.showLightbox;
      if (replace) {
        this.$router.replace({ path: this.$route.path, query: queryParams });
      } else {
        this.$router.push({ path: this.$route.path, query: queryParams });
      }
    },

    toggleSelectionMode(val) {
      this.isSelectionMode = val;
      this.selected = {};
    },
    select({ id, sourceId, sourceFileId }) {
      if (this.selected[id]) {
        this.lastSelected = null;
        delete this.selected[id];
      } else {
        this.selected[id] = {
          sourceId,
          sourceFileId,
        };

        if (this.isShiftPressed && this.lastSelected !== null) {
          let start, end;

          const indexOfLastSelected = this.photos.findIndex(photo => photo.id === this.lastSelected);
          const indexOfSelected = this.photos.findIndex(photo => photo.id === id);

          if (indexOfSelected > indexOfLastSelected) {
            start = indexOfLastSelected;
            end = indexOfSelected;
          } else {
            start = indexOfSelected;
            end = indexOfLastSelected;
          }

          for (let i = start; i <= end; i++) {
            const { id, sourceId, sourceFileId } = this.photos[i];
            this.selected[id] = {
              sourceId,
              sourceFileId,
            };
          }
        }

        this.lastSelected = id;
      }
    },

    async showAlbumSelection() {
      this.showAddToExistingAlbum = true;
      this.loadingAlbums = true;
      this.albums = await getAlbums();
      this.loadingAlbums = false;
    },
    async addToAlbumFromSelected({ id, name }) {
      this.loadingAlbums = true;

      await addToAlbum(id, Object.values(this.selected));
      Object.keys(this.selected).forEach(selected => {
        const file = this.photos.find(photo => photo.id === selected);
        file.albums.push({
          name,
          idAlias: id,
        });
      });
      alert(`Album updated.`);
      this.selected = {};
      this.isSelectionMode = false;
      this.showAddToExistingAlbum = false;
      
      this.loadingAlbums = false;
    },
    async createAlbumFromSelected() {
      this.loadingCreateAlbum = true;
      const albumName = prompt('Enter album name');
      if (!albumName) {
        alert('Album name required.');
      } else {
        const { id, name } = (await createAlbum(albumName, Object.values(this.selected))).data;
        alert(`Album "${name}" created.`);
        Object.keys(this.selected).forEach(selected => {
          const file = this.photos.find(photo => photo.id === selected);
          file.albums.push({
            name,
            idAlias: id,
          });
        });
        this.selected = {};
        this.isSelectionMode = false;
      }

      this.loadingCreateAlbum = false;
    },
    async removeSelectedFromAlbum() {
      this.loadingRemoveFromAlbum = true;
      try {
        await deleteFromAlbum(this.albumId, Object.values(this.selected));
        alert(`Removed selected from album.`);
        this.selected = {};
        this.isSelectionMode = false;
        window.location.reload();
      } catch (e) {
        alert(e);
      } finally {
        this.loadingRemoveFromAlbum = false;
      }
    },

    onDateBlur() {
      this.$emit('date', this.date);
      this.reset();
    },

    reset() {
      this.$store.dispatch('clearPhotos');
    },

    onSortSelect(e) {
      const item = e.detail.item;
      this.sort = item.value;
      if (this.sort === 'dateAdded') {
        this.clearLastViewed();
      }
      this.updateRenderPhotos();
    },

    formatPhotoDate(date) {
      return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
    },

    viewNewPhotos() {
      this.viewMode = 'newOnly';
      this.clearLastViewed();
    },
    viewAllPhotos() {
      this.viewMode = null;
    },

    updateLastViewed() {
      if (!getLastViewed(this.albumId) || localStorage.getItem(`canClearLastViewed-${this.albumId}`)) {
        localStorage.setItem(`lastViewed-${this.albumId}`, new Date().getTime());
        localStorage.removeItem(`canClearLastViewed-${this.albumId}`);
      }
    },
    clearLastViewed() {
      localStorage.setItem(`canClearLastViewed-${this.albumId}`, true);
    },
    isPhotoNew(photo) {
      return  photo.createdAt && getLastViewed(this.albumId) < photo.createdAt;
    },

    onOptionsSelect(e) {
      const item = e.detail.item;
      if (item.value === 'viewDates') {
        this.showDates = item.checked;
        this.updateRenderPhotos();
      }
    }
  },
}

function getLastViewed(albumId) {
  return parseInt(localStorage.getItem(`lastViewed-${albumId}`));
}
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
