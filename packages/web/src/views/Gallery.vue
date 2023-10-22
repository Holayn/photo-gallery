<template>
  <div ref="gallery">
    <div class="px-4 md:px-8 md:flex md:gap-8 items-center">
      <div class="flex-auto break-all">
        <slot name="heading"></slot>
      </div>
      <Teleport to="#headerAdditionalControls">
        <div v-if="$store.state.isAdmin" class="flex gap-4 justify-end">
          <div v-if="isSelectionMode" class="flex flex-col md:flex-row items-end md:items-center gap-2">
            <div>Selected: {{ Object.keys(selected).length }}</div>
            <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="showAlbumSelection()">Add to Existing Album</button>
            <div class="relative">
              <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="createAlbumFromSelected()">Create Album</button>
              <div class="absolute top-0 left-0 flex justify-center w-full">
                <Loading v-if="loadingCreateAlbum" class="h-8 w-8"></Loading>
              </div>
            </div>
            <button @click="toggleSelect()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div v-else class="flex items-center"> 
            <div v-if="showDateSelection" class="mr-8"> 
              <input v-model="date" type="date" @blur="onDateBlur">
            </div>
            <button @click="toggleSelect()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            </button>
          </div>
          <slot name="controls"></slot>
        </div>
      </Teleport>
    </div>

    <div id="media" class="justified-gallery mt-4">  
      <a v-for="(photo, i) in loadedPhotos" :ref="setGalleryImageRef" :key="i" @click.prevent>
        <img :src="photo.data?.preview" @click="isSelectionMode ? select(photo) : openLightbox(i)">
        <div v-if="photo.metadata.video" class="overlay">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </div>
        <div v-if="isSelectionMode" class="overlay p-2 justify-end items-start" :class="{ 'bg-white/25': !selected[photo.id], 'bg-white/75': selected[photo.id] }">
          <div v-if="selected[photo.id]" class="text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div v-else class="text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
          </div>
        </div>
      </a>
    </div>

    <div class="h-48">
      <div v-if="loadingPhotos" class="flex flex-col items-center justify-center mt-4">
        <Loading class="w-16 h-16"></Loading>
        <p>Loading photos, {{ numPhotosToLoad }} remaining</p>
      </div>
    </div>

    <div v-if="isNoPhotos" class="text-center">No photos found.</div>
    
    <Lightbox v-if="isShowLightbox" @close="closeLightbox()"></Lightbox>

    <Modal v-if="showAddToExistingAlbum" @close="showAddToExistingAlbum = false">
      <div class="w-[500px] max-w-full">
        <div v-if="loadingAlbums" class="flex justify-center">
          <Loading class="w-16 h-16"></Loading>
        </div>
        <div v-else class="grid gap-2">
          <button v-for="album in albums" :key="album.id" class="py-2 px-4 bg-slate-50 flex w-full text-left" @click="addToAlbumFromSelected(album.id)">
            <div class="flex-auto">{{ album.name }}</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { getAlbums, createAlbum, addToAlbum } from '../services/api';
import { DIMENSIONS, getGalleryPhotoSize, isMobileScreen, loadPhotoToBase64 } from '../utils';

import Lightbox from '../components/Lightbox.vue'
import Loading from '../components/Loading.vue';
import Modal from '../components/Modal.vue';
import { useInfiniteScroll } from '../composables/infinite-scroll';

export default {
  name: 'Gallery',
  components: {
    Lightbox,
    Loading,
    Modal,
  },
  props: {
    hasMorePhotos: Boolean,
    loadMore: Function,
    showDateSelection: Boolean,
    showLightbox: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const store = useStore();

    const { 
      enable,
      disable,
      reset,
      scroll,
      scrolling,
      scrollIndex,
    } = useInfiniteScroll({
      photos: computed(() => store.state.photos),
      canLoadMore: props.hasMorePhotos,
      loadMore: props.loadMore,
    });

    return { 
      infiniteScrollEnable: enable,
      infiniteScrollDisable: disable,
      infiniteScrollReset: reset,
      scroll,
      scrolling,
      scrollIndex,
    };
  },
  data() {
    return {
      date: null,

      galleryImageRefs: [],

      albums: [],
      loadingCreateAlbum: false,
      loadingAlbums: false,
      showAddToExistingAlbum: false,

      loadedPhotoIndex: 0,
      loadingPhotos: false,
      numPhotosToLoad: 0,

      scrollPosition: 0,

      isSelectionMode: false,
      selected: {},

      isShowLightbox: false,
    };
  },
  computed: {
    loadedPhotos() {
      return this.$store.state.photos?.slice(0, this.loadedPhotoIndex);
    },
    lightboxIndex() {
      return this.$store.state.lightbox.photoIndex;
    },
    isNoPhotos() {
      return !this.scrolling && this.numPhotos === 0;
    },
    numPhotos() {
      return this.$store.state.photos.length;
    },
    token() {
      return this.$store.state.token;
    },
  },
  watch: {
    lightboxIndex() {
      // Handling for navigating the lightbox past loaded gallery thumbnails.
      if (this.lightboxIndex + 1 >= this.scrollIndex) {
        this.scroll();
      }
    },
    showLightbox() {
      if (this.showLightbox) {
        this.openLightbox();
      } else {
        this.closeLightbox();
      }
    },
    isShowLightbox() {
      this.updateLightboxQueryParam();
    },
    scrollIndex() {
      this.loadPhotos();
    },
  },
  created() {
    // Ensure the page isn't loaded with this query parameter set.
    this.removeLightboxParam(true);
  },
  mounted() {
    // Need to initialize this plugin.
    window.$('#media').justifiedGallery({
      rowHeight: isMobileScreen() ? DIMENSIONS.IMAGE_HEIGHT_MOBILE : DIMENSIONS.IMAGE_HEIGHT,
      maxRowHeight: isMobileScreen() ? DIMENSIONS.IMAGE_HEIGHT_MOBILE : DIMENSIONS.IMAGE_HEIGHT,
    });

    this.scroll();
  },
  beforeUpdate() {
    this.galleryImageRefs = [];
  },
  beforeUnmount() {
    this.infiniteScrollDisable();
  },
  methods: {
    async loadPhotos() {
      console.debug('loadPhotos(): loading photos...');
      this.loadingPhotos = true;
      const photosToLoad = this.$store.state.photos.slice(this.loadedPhotoIndex, this.scrollIndex);
      this.numPhotosToLoad = photosToLoad.length;
      this.loadedPhotoIndex = this.scrollIndex;
      const loadPromises = photosToLoad.map(photo => {
        return new Promise((resolve) => {
          const url = photo.urls[getGalleryPhotoSize()];

          loadPhotoToBase64(url).then(data => {
            if (!photo.data) photo.data = {};
            photo.data.preview = data;
            this.numPhotosToLoad--;
            resolve();
          })
        });
      });

      await Promise.all(loadPromises);

      console.debug('loadPhotos(): photos loaded.');

      if (!this.loadedPhotos.length) {
        this.loadingPhotos = false;
      } else {
        setTimeout(() => {
          window.$('#media').justifiedGallery({
            rowHeight: isMobileScreen() ? DIMENSIONS.IMAGE_HEIGHT_MOBILE : DIMENSIONS.IMAGE_HEIGHT,
            maxRowHeight: isMobileScreen() ? DIMENSIONS.IMAGE_HEIGHT_MOBILE : DIMENSIONS.IMAGE_HEIGHT,
          }).on('jg.complete', () => {
            this.loadingPhotos = false;
            this.infiniteScrollEnable();
          });
        });
      }
    },

    isScrolledIntoView(el) {
      const rect = el.getBoundingClientRect();
      const elemTop = rect.top;
      const elemBottom = rect.bottom;

      const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
      return isVisible;
    },
    scrollCurrentImageIntoView() {
      const galleryPhoto = this.galleryImageRefs[this.lightboxIndex];
      if (galleryPhoto && !this.isScrolledIntoView(galleryPhoto)) {
        galleryPhoto.scrollIntoView();
        window.scrollBy(0, -1 * window.innerHeight / 2);
      }
    },
    setGalleryImageRef(el) {
      if (el) {
        this.galleryImageRefs.push(el);
      }
    },

    openLightbox(index) {
      if (!this.isShowLightbox) {
        this.isShowLightbox = true;

        document.body.style.position = 'fixed';
        document.body.style.overflow = 'hidden';

        if (index !== null && index !== undefined) {
          this.$store.state.lightbox.photoIndex = index;
        }

        this.scrollPosition = window.scrollY;
        this.infiniteScrollDisable();
      }
    },
    closeLightbox() {
      if (this.isShowLightbox) {
        this.isShowLightbox = false;

        document.body.style.position = '';
        document.body.style.overflow = '';

        this.$nextTick(() => {
          window.scrollTo(0, this.scrollPosition);
          setTimeout(() => {
            this.scrollCurrentImageIntoView();
            this.infiniteScrollEnable();
          });
        });
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

    toggleSelect() {
      this.isSelectionMode = !this.isSelectionMode;
    },
    select({ id, sourceId, sourceFileId }) {
      if (this.selected[id]) {
        delete this.selected[id];
      } else {
        this.selected[id] = {
          sourceId,
          sourceFileId,
        };
      }
    },

    async showAlbumSelection() {
      this.showAddToExistingAlbum = true;
      this.loadingAlbums = true;
      this.albums = await getAlbums();
      this.loadingAlbums = false;
    },
    async addToAlbumFromSelected(albumId) {
      this.loadingAlbums = true;

      try {
        await addToAlbum(albumId, Object.values(this.selected));
        alert(`Album updated.`);
        this.selected = {};
        this.isSelectionMode = false;
        this.showAddToExistingAlbum = false;
      } catch (e) {
        alert(e);
      }
      
      this.loadingAlbums = false;
    },
    async createAlbumFromSelected() {
      this.loadingCreateAlbum = true;
      const albumName = prompt('Enter album name');
      if (!albumName) {
        alert('Album name required.');
      } else {
        try {
          await createAlbum(albumName, Object.values(this.selected));
          alert(`Album "${albumName}" created.`);
          this.selected = {};
          this.isSelectionMode = false;
        } catch (e) {
          alert(e);
        }
      }

      this.loadingCreateAlbum = false;
    },

    onDateBlur() {
      this.$emit('date', this.date);
      this.reset();
    },

    reset() {
      this.loadedPhotoIndex = 0;
      this.$store.dispatch('clearPhotos');
      this.infiniteScrollReset();
    },
  },
}
</script>

<style scoped>
  .overlay {
    position: absolute;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
</style>
