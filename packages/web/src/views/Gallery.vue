<template>
  <div class="md:px-6">
    <PhotoGrid
      ref="photos"
      :photos="displayedPhotos"
      :layout-type="galleryLayout"
      :show-dates="showDates"
      :is-selection-mode="isSelectionMode"
      :selected="selected"
      :new-photos="newPhotos"
      @open-lightbox="openLightbox"
      @selection-change="onSelectionChange"
    >
      <template #header>
        <div class="sticky top-0 z-20 bg-white py-2 md:pb-2 px-4 md:px-0 md:top-[var(--header-height)]">
          <template v-if="authStore.isLoggedIn && isSelectionMode">
            <div class="flex items-center justify-end gap-2">
                <div>Selected: {{ Object.keys(selected).length }}</div>
                <div class="relative">
                  <button v-if="albumId" class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="removeSelectedFromAlbum()">Remove From Album</button>
                  <div class="absolute top-0 left-0 flex justify-center w-full">
                    <Loading v-if="loadingRemoveFromAlbum" class="h-8 w-8"></Loading>
                  </div>
                </div>
                <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="showAlbumSelection()">Add to Album</button>
                <button @click="toggleSelectionMode(false)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
          </template>
          <template v-else>
            <div class="flex-auto break-word">
              <div class="flex items-center gap-4">
                <div class="flex-auto">
                  <div class="break-word">
                    <slot name="heading"></slot>
                  </div>
                </div>
                <div>
                  <div class="flex items-center">
                    <button v-if="authStore.isLoggedIn" class="p-2 text-gray-700" @click="toggleSelectionMode(true)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                    </button>
                    <slot name="controls"></slot>
                    
                    <template v-if="!isSelectionMode">
                      <sl-dropdown v-if="sortable">
                        <sl-icon-button slot="trigger" class="text-xl" name="arrow-down-up"></sl-icon-button>
                        <sl-menu @sl-select="onSortSelect">
                          <sl-menu-label>Sort by...</sl-menu-label>
                          <sl-menu-item :value="SORT_TYPES.DATE_ASC">
                            <sl-icon v-if="sort === SORT_TYPES.DATE_ASC" slot="prefix" name="check-lg"></sl-icon>
                            Date (Earliest)
                          </sl-menu-item>
                          <sl-menu-item :value="SORT_TYPES.DATE_DESC">
                            <sl-icon v-if="sort === SORT_TYPES.DATE_DESC" slot="prefix" name="check-lg"></sl-icon>
                            Date (Latest)
                          </sl-menu-item>
                          <sl-menu-item v-if="canSortByDateAdded" :value="SORT_TYPES.DATE_ADDED">
                            <sl-icon v-if="sort === SORT_TYPES.DATE_ADDED" slot="prefix" name="check-lg"></sl-icon>
                            Date Added
                          </sl-menu-item>
                        </sl-menu>
                      </sl-dropdown>
                      <sl-dropdown>
                        <sl-icon-button slot="trigger" class="text-xl" name="three-dots-vertical"></sl-icon-button>
                        <sl-menu @sl-select="onOptionsSelect">
                          <sl-menu-item value="viewDates" type="checkbox" :checked="showDates">
                            Show dates
                          </sl-menu-item>
                          <sl-menu-item v-if="hasPhotosWithUnknownDates" value="viewUnknownDateItems" type="checkbox" :checked="isViewModeShowUnknownDateItems">
                            Show photos with unknown dates
                          </sl-menu-item>
                          <sl-menu-item value="viewDateSelection">
                            Show photos before...
                          </sl-menu-item>
                          <sl-menu-item>
                            Gallery layout
                            <sl-menu slot="submenu" @sl-select="onGalleryLayoutSelect">
                              <sl-menu-item :value="LAYOUT_TYPES.AUTO" type="checkbox" :checked="galleryLayout === LAYOUT_TYPES.AUTO">Auto</sl-menu-item>
                              <sl-menu-item :value="LAYOUT_TYPES.JUSTIFIED" type="checkbox" :checked="galleryLayout === LAYOUT_TYPES.JUSTIFIED">Justified</sl-menu-item>
                              <sl-menu-item :value="LAYOUT_TYPES.TILE" type="checkbox" :checked="galleryLayout === LAYOUT_TYPES.TILE">Tile</sl-menu-item>
                            </sl-menu>
                          </sl-menu-item>
                        </sl-menu>
                      </sl-dropdown>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="photos.length" class="mt-1 text-gray-600 text-sm md:text-base">
              <div>
                {{ photos.length }} photos
                <span v-if="photos.filter(p => !p.date).length">&bull; {{ photos.filter(p => !p.date).length }} unknown dates
                  <span class="text-xs md:text-sm text-gray-500">
                    <span v-if="isViewModeShowUnknownDateItems">
                      <svg class="inline w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </span>
                    <span v-else>
                      <svg class="inline w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    </span>
                  </span>
                </span>
              </div>
            </div>
          </template>
        </div>

        <div v-if="$slots.notices || hasNewPhotos" class="mb-2 px-4 md:px-0 flex flex-col gap-1">
          <slot name="notices"></slot>
          <template v-if="hasNewPhotos">
            <div class="py-1 px-2 bg-blue-200 border border-blue-300 flex items-center gap-2">
              <template v-if="!isViewModeNewOnly">
                <div class="flex items-center gap-1">
                  <sl-icon class="text-white" name="stars"></sl-icon>
                  New photos have been added
                </div>
                <sl-button size="small" @click="viewNewPhotos">View</sl-button>
              </template>
              <template v-else>
                Viewing new photos
                <sl-button size="small" @click="viewAllPhotos">View All Photos</sl-button>
              </template>
            </div>
          </template>
        </div>
      </template>

      <template #footer>
        <div v-if="$slots.loading" class="mt-8"></div>
        <slot name="loading">
          <div v-if="!photos.length" class="text-center">No photos available.</div>
          <div v-else-if="isNoDisplayPhotos" class="text-center">No photos to display.</div>
        </slot>
      </template>
    </PhotoGrid>

    <Lightbox
      v-if="isShowLightbox"
      :photos="displayedPhotos"
      :index="lightboxIndex"
      :is-selection-mode="isSelectionMode"
      :selected="selected"
      :preview-size="getLightboxPreviewSize(galleryLayout)"
      @close="closeLightbox()"
      @enable-selection-mode="toggleSelectionMode(true)"
      @select="photo => select(photo)"
      @index-update="lightboxIndex = $event"
    ></Lightbox>

    <Modal v-if="showAddToAlbum" @close="showAddToAlbum = false">
      <div class="w-[500px] max-w-full">
        <div v-if="loadingAlbums" class="flex justify-center">
          <Loading class="w-24 h-24"></Loading>
        </div>
        <div v-else class="grid gap-2">
          <button v-for="album in albums" :key="album.id" class="py-2 px-4 bg-slate-50 flex w-full text-left" @click="addToAlbumFromSelected(album)">
            <div class="flex-auto">{{ album.name }}</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div class="mt-4 flex gap-2">
          <button class="btn px-2 py-1" :disabled="loadingCreateAlbum || !Object.keys(selected).length" @click="createAlbumFromSelected()">Create Album</button>
          <Loading v-if="loadingCreateAlbum" class="h-8 w-8"></Loading>
        </div>
      </div>
    </Modal>

    <Modal v-if="showDateSelection" @close="showDateSelection = false">
      <div class="w-[500px] max-w-full flex flex-col items-center justify-center py-4">
        <input v-model="date" type="date">
        <button class="btn mt-4" @click="onDateSelection()">Update</button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { getAlbums, createAlbum, addToAlbum, deleteFromAlbum, PHOTO_SIZES } from '../services/api';
import { useAuthStore } from '../store';

import Lightbox from '../components/Lightbox.vue'
import Loading from '../components/Loading.vue';
import Modal from '../components/Modal.vue';
import PhotoGrid from '../components/PhotoGrid.vue';
import { LAYOUT_TYPES } from '../components/PhotoGrid.vue';

export const SORT_TYPES = {
  DATE_ASC: 'dateAsc',
  DATE_DESC: 'dateDesc',
  DATE_ADDED: 'dateAdded',
};

export default {
  name: 'Gallery',
  components: {
    Lightbox,
    Loading,
    Modal,
    PhotoGrid,
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    albumId: String,
    showLightbox: Boolean,
    defaultSort: {
      type: String,
      default: SORT_TYPES.DATE_DESC,
    },
    defaultShowUnknownDates: {
      type: Boolean,
      default: false,
    },
    sortable: { 
      type: Boolean,
      default: true,
    },
    viewTracking: {
      type: Boolean,
      default: true,
    },
    photos: {
      type: Array,
      default: () => [],
    }
  },
  data() {
    return {
      date: null,

      albums: [],
      loadingCreateAlbum: false,
      loadingAlbums: false,
      loadingRemoveFromAlbum: false,
      showAddToAlbum: false,

      isSelectionMode: false,
      selected: {},

      isShowLightbox: false,
      lightboxIndex: 0,

      sort: this.defaultSort,
      viewMode: null,
      showDates: false,
      galleryLayout: LAYOUT_TYPES.JUSTIFIED,

      showDateSelection: false,

      SORT_TYPES,
      LAYOUT_TYPES,
    };
  },
  computed: {
    isNoDisplayPhotos() {
      return this.displayedPhotos.length === 0;
    },
    token() {
      return this.authStore.authToken;
    },
    displayedPhotos() {
      if (this.isViewModeNewOnly) {
        return this.photos.filter(photo => this.isPhotoNew(photo));
      }

      return this.photos
      .filter(photo => this.isViewModeShowUnknownDateItems || photo.date)
      .sort((a, b) => {
        if (this.sort === SORT_TYPES.DATE_DESC) {
          return b.date - a.date;
        } else if (this.sort === SORT_TYPES.DATE_ASC) {
          return a.date - b.date;
        } else if (this.sort === SORT_TYPES.DATE_ADDED) {
          return (b.createdAt || b.date) - (a.createdAt || a.date);
        }
      });
    },
    hasNewPhotos() {
      if (!this.viewTracking) return false;
      if (!getLastViewed(this.id)) {
        return false;
      }
      return this.displayedPhotos.some(photo => this.isPhotoNew(photo));
    },
    newPhotos() {
      return this.photos.filter(photo => this.isPhotoNew(photo));
    },
    isViewModeNewOnly() {
      return this.viewMode === 'newOnly';
    },
    isViewModeShowUnknownDateItems() {
      return this.viewMode === 'showUnknownDateItems';
    },
    canSortByDateAdded() {
      return this.photos.some(photo => photo.createdAt);
    },
    hasPhotosWithUnknownDates() {
      return this.photos.some(photo => !photo.date);
    },
  },
  watch: {
    async lightboxIndex() {
      await this.scrollImageIntoView();
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
    sort() {
      localStorage.setItem(`sort-${this.id}`, this.sort);
    },
    photos(val, old) {
      if (!old.length && val.length && val.every(photo => !photo.date)) {
        this.viewMode = 'showUnknownDateItems';
      }
    },
  },
  created() {
    // Ensure the page isn't loaded with this query parameter set.
    this.removeLightboxParam(true);

    if (this.viewTracking) {
      this.updateLastViewed();
    }

    if (this.sortable) {
      if (localStorage.getItem(`sort-${this.id}`)) {
        this.sort = localStorage.getItem(`sort-${this.id}`);
      }
    }

    if (this.defaultShowUnknownDates) {
      this.viewMode = 'showUnknownDateItems';
    }
  },
  methods: {
    onSelectionChange({ selected }) {
      this.selected = selected;
    },

    select(photo) {
      if (this.$refs.photos && this.$refs.photos.select) {
        this.$refs.photos.select(photo);
      }
    },
    
    async scrollImageIntoView() {
      if (this.$refs.photos && this.$refs.photos.scrollImageIntoView) {
        await this.$refs.photos.scrollImageIntoView(this.lightboxIndex);
      }
    },

    openLightbox(photo) {
      if (!this.isShowLightbox) {
        this.isShowLightbox = true;

        if (photo) {
          this.lightboxIndex = this.displayedPhotos.findIndex(p => p === photo);
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
          if (this.$refs.photos && this.$refs.photos.getImageRefByPhotoIndex) {
            const ref = this.$refs.photos.getImageRefByPhotoIndex(this.lightboxIndex);
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

    async showAlbumSelection() {
      this.showAddToAlbum = true;
      this.loadingAlbums = true;
      this.albums = await getAlbums();
      this.loadingAlbums = false;
    },
    async addToAlbumFromSelected({ id, name }) {
      this.loadingAlbums = true;

      await addToAlbum(id, Object.values(this.selected));
      Object.keys(this.selected).forEach(selected => {
        const file = this.displayedPhotos.find(photo => photo.id === selected);
        file.albums.push({
          name,
          idAlias: id,
        });
      });
      alert(`Album updated.`);
      this.selected = {};
      this.isSelectionMode = false;
      this.showAddToAlbum = false;
      
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
          const file = this.displayedPhotos.find(photo => photo.id === selected);
          file.albums.push({
            name,
            idAlias: id,
          });
        });
        this.selected = {};
        this.isSelectionMode = false;
        this.showAddToAlbum = false;
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

    onDateSelection() {
      this.showDateSelection = false;
      this.$emit('date', this.date);
      this.reset();
    },

    reset() {
      this.$emit('reset');
    },

    onSortSelect(e) {
      const item = e.detail.item;
      this.sort = item.value;
      this.clearLastViewed();
    },

    viewNewPhotos() {
      if (!this.viewTracking) return;
      this.viewMode = 'newOnly';
      this.clearLastViewed();
    },
    viewAllPhotos() {
      this.viewMode = null;
    },

    updateLastViewed() {
      if (!this.viewTracking) return;
      if (!getLastViewed(this.id) || localStorage.getItem(`canClearLastViewed-${this.id}`)) {
        localStorage.setItem(`lastViewed-${this.id}`, new Date().getTime());
        localStorage.removeItem(`canClearLastViewed-${this.id}`);
      }
    },
    clearLastViewed() {
      if (!this.viewTracking) return;
      localStorage.setItem(`canClearLastViewed-${this.id}`, true);
    },
    isPhotoNew(photo) {
      if (!this.viewTracking) return false;
      return photo.createdAt && getLastViewed(this.id) < photo.createdAt;
    },

    onOptionsSelect(e) {
      const item = e.detail.item;
      if (item.value === 'viewDates') {
        this.showDates = item.checked;
      }
      if (item.value === 'viewUnknownDateItems') {
        this.viewMode = item.checked ? 'showUnknownDateItems' : null;
      }
      if (item.value === 'viewDateSelection') {
        this.showDateSelection = true;
      }
    },
    
    onGalleryLayoutSelect(e) {
      const item = e.detail.item;
      this.galleryLayout = item.value;
    },

    getLightboxPreviewSize(galleryLayout = LAYOUT_TYPES.JUSTIFIED) {
      if (galleryLayout === LAYOUT_TYPES.TILE) {
        return PHOTO_SIZES.THUMB;
      }
      return PHOTO_SIZES.SMALL;
    },
  },
}

function getLastViewed(id) {
  return parseInt(localStorage.getItem(`lastViewed-${id}`));
}
</script>
