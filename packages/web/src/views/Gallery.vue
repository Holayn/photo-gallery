<template>
  <div ref="gallery">
    <div class="px-8 flex items-center gap-8">
      <div class="flex-auto">
        <slot name="heading"></slot>
      </div>
      <div class="cursor-pointer">
        <div v-if="isSelectionMode" class="flex gap-2 items-center">
          <div>Selected: {{ Object.keys(selected).length }}</div>
          <button class="px-2 py-1 bg-orange-100" :disabled="!Object.keys(selected).length" @click="showAlbumSelection()">Add to Existing Album</button>
          <button class="px-2 py-1 bg-orange-100" :disabled="!Object.keys(selected).length" @click="createAlbumFromSelected()">Create Album</button>
          <button @click="toggleSelect()">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <svg v-else @click="toggleSelect()" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
      </div>
      <div class="cursor-pointer">
        <svg @click="toggleHelp(true)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      </div>
    </div>

    <div id="media" class="justified-gallery">
      <a v-for="(photo, i) in loadedPhotos" :ref="setGalleryImageRef" :key="i" :href="toPhotoUrl(photo, PHOTO_SIZES.LARGE)" @click.prevent>
        <img :src="toPhotoUrl(photo, getGalleryPhotoSize())" @click="isSelectionMode ? select(photo) : openSlides(i)">
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
    <div style="height: 200px;">
      <div v-if="loading" style="display: flex; justify-content: center; padding: 16px;">
        <Loading></Loading>
      </div>
      <div v-else-if="allPhotosDisplaying && hasMorePhotos && infiniteScrollEnabled" style="display: flex; align-items: center; justify-content: center; height: 100%;">
        <button style="padding: 8px 16px; background-color: var(--theme-color-main); border: none;" @click="renderMore">Load more images</button>
      </div>
    </div>

    
    <Lightbox ref="lightbox" v-show="showLightbox" @close="closeLightbox()"></Lightbox>

    <Modal v-if="showAddToExistingAlbum" @close="showAddToExistingAlbum = false">
      <Loading v-if="loadingAlbums"></Loading>
      <div v-else class="grid grid-cols-3 gap-1">
        <div v-for="album in albums" :key="album.id" class="px-6 py-4 bg-orange-100 rounded-md cursor-pointer" @click="addToAlbumFromSelected(album.id)">
          {{ album.name }}
        </div>
      </div>
    </Modal>

    <Modal v-if="showHelp" @close="toggleHelp(false)">
      <div style="display: flex; align-items: center;">
        <ul>
          <li>
            click or tap to view an image
            <ul>
              <li>swipe or use arrow keys to view more images</li>
            </ul>
          </li>
          <li>
            downloading images:
            <ul>
              <li>
                on mobile: open the image, then tap and hold down on an image
                <img style="width: 50%;" src="../assets/photo-gallery-help-mobile-save.gif"/>
              </li>
              <li>on desktop: open the image, then right-click + save image as...</li>
            </ul>
          </li>
        </ul>
      </div>
    </Modal>
  </div>
</template>

<script>
import { PHOTO_SIZES, toPhotoUrl, getAlbums, createAlbum, addToAlbum } from '../services/api';
import { getGalleryPhotoSize, isMobileScreen } from '../utils';

import Lightbox from '../components/Lightbox.vue'
import Loading from '../components/Loading.vue';
import Modal from '../components/Modal.vue';

const GALLERY_ROW_HEIGHT = 200;
const GALLERY_ROW_HEIGHT_MOBILE = 80;
const AVERAGE_IMAGE_WIDTH = 200;
const IMAGE_WIDTH_MOBILE = 80;

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
  },
  data() {
    return {
      albums: [],

      galleryIndex: 0,
      galleryImageRefs: [],
      infiniteScrollBeforeHeight: null,
      infiniteScrollEnabled: true,
      infiniteScrollNumImages: null,
      loading: false,
      loadingAlbums: false,
      renderingMore: false,
      PHOTO_SIZES,

      scrollPosition: 0,
      showAddToExistingAlbum: false,
      showLightbox: false,
      showHelp: false,

      isSelectionMode: false,
      selected: {},
    };
  },
  computed: {
    allPhotosDisplaying() {
      return this.galleryIndex === this.$store.state.photos.length;
    },
    galleryRowHeight() {
      return isMobileScreen() ? GALLERY_ROW_HEIGHT_MOBILE : GALLERY_ROW_HEIGHT;
    },
    loadedPhotos() {
      return this.$store.state.photos?.slice(0, this.galleryIndex);
    },
    lightboxIndex() {
      return this.$store.state.lightbox.photoIndex;
    },
    token() {
      return this.$store.state.token;
    },
  },
  watch: {
    galleryIndex() {
      setTimeout(() => {
        window.$('#media').justifiedGallery('norewind');
      });
    },
    lightboxIndex() {
      if (this.lightboxIndex + this.infiniteScrollNumImages >= this.galleryIndex) {
        setTimeout(() => {
          // Delay this slightly to prevent blocking other resources from loading first.
          // This is in the background when this is called.
          this.renderMore();
        }, 500);
      }
    },
    showLightbox() {
      if (this.showLightbox) {
        document.body.style.overflow = 'hidden';
        this.$refs.lightbox.open();
      }
      else {
        document.body.style.overflow = '';
      }
    },
  },
  created() {
    this.getGalleryPhotoSize = getGalleryPhotoSize;
  },
  beforeUpdate() {
    this.galleryImageRefs = [];
  },
  beforeUnmount() {
    this.disableInfiniteScroll();
  },
  methods: {
    init() {
      const numImagesCanFitOnPage = this.calculateNumImagesFitOnPage();
      this.galleryIndex = numImagesCanFitOnPage;
      this.infiniteScrollNumImages = numImagesCanFitOnPage;

      setTimeout(() => {
        window.$('#media').justifiedGallery({
          rowHeight: this.galleryRowHeight,
          maxRowHeight: this.galleryRowHeight,
        });

        this.handleInfiniteScroll();
      });
    },
    openSlides(i) {
      this.$store.state.lightbox.photoIndex = i;
      this.openLightbox();
    },
    estimateNumImagesFitOnPage() {
      const { innerWidth, innerHeight } = window;
      const rows = Math.ceil((innerHeight * 2) / this.galleryRowHeight) + 2;
      const widthOfImage = isMobileScreen() ? IMAGE_WIDTH_MOBILE : AVERAGE_IMAGE_WIDTH;
      const imagesPerRow = Math.ceil(innerWidth / widthOfImage);

      return rows * imagesPerRow;
    },
    calculateNumImagesFitOnPage() {
      let num = 0;

      const { innerWidth, innerHeight } = window;

      const rows = Math.ceil(innerHeight / this.galleryRowHeight);

      let currWidth = 0;
      const totalWidth = innerWidth * rows;

      for (let i = 0; i < this.$store.state.photos.length; i++) {
        let thumbnailWidth = null;
        if (isMobileScreen()) {
          thumbnailWidth = IMAGE_WIDTH_MOBILE;
        } else {
          const { width, height } = this.$store.state.photos[i].metadata;
          thumbnailWidth = (width / height) * this.galleryRowHeight;
        }

        if (currWidth >= totalWidth || currWidth + thumbnailWidth >= totalWidth) {
          break;
        }

        currWidth += thumbnailWidth;
        num++;
      }

      return num;
    },
    handleInfiniteScroll() {
      this.infiniteScrollBound = this.infiniteScroll.bind(this);
      window.addEventListener('scroll', this.infiniteScrollBound);
    },
    disableInfiniteScroll() {
      window.removeEventListener('scroll', this.infiniteScrollBound);
    },
    async infiniteScroll() {
      // Load more if at least half a page length from the bottom.
      if (this.infiniteScrollEnabled && (window.innerHeight + window.scrollY + (window.innerHeight / 2)) >= this.$refs.gallery.offsetHeight) {
        this.infiniteScrollEnabled = false;
        console.debug('infinite scroll: disabled');

        this.infiniteScrollBeforeHeight = window.document.documentElement.scrollHeight;
        await this.renderMore();
        
      }

      // Re-enable infinite scrolling once the user has scrolled down past where the infinite scrolling was originally triggered.
      if (window.innerHeight + window.scrollY > this.infiniteScrollBeforeHeight) {
        if (!this.infiniteScrollEnabled && !this.renderingMore) {
          this.infiniteScrollEnabled = true;
          console.debug('infinite scroll: enabled')
        }
      }
    },
    async renderMore() {
      console.debug('adding more images for rendering...');
      this.renderingMore = true;

      const originalIndex = this.galleryIndex;

      if (this.galleryIndex === this.$store.state.photos.length && this.hasMorePhotos) {
        await this.loadMore();
      }

      let newGalleryIndex = this.galleryIndex;

      for (let i = this.galleryIndex, j = 0; i < this.$store.state.photos.length && j < this.infiniteScrollNumImages; i++, j++) {
        newGalleryIndex++;

        // If we haven't reached infiniteScrollNumImages but there are no more photos, we need to load the next page from the server.
        if (newGalleryIndex === this.$store.state.photos.length && j < this.infiniteScrollNumImages - 1) {
          await this.loadMore();
        }
      }

      console.debug(`added ${newGalleryIndex - originalIndex} more images for rendering.`);
      this.galleryIndex = newGalleryIndex;
      this.renderingMore = false;
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
      if (!this.isScrolledIntoView(galleryPhoto)) {
        galleryPhoto.scrollIntoView();
        window.scrollBy(0, -1 * window.innerHeight / 2);
      }
    },
    setGalleryImageRef(el) {
      if (el) {
        this.galleryImageRefs.push(el);
      }
    },

    toPhotoUrl(photo, size) {
      return toPhotoUrl(photo, size, this.token);
    },

    openLightbox() {
      this.scrollPosition = window.pageYOffset;
      this.showLightbox = true;
    },
    closeLightbox() {
      this.showLightbox = false;
      this.$nextTick(() => {
        window.scrollTo(0, this.scrollPosition);
        setTimeout(() => {
          this.scrollCurrentImageIntoView();
        });
      });
    },
    toggleHelp(show) {
      this.showHelp = show;
    },

    toggleSelect() {
      this.isSelectionMode = !this.isSelectionMode;
    },
    select(photo) {
      if (this.selected[photo.id]) {
        delete this.selected[photo.id];
      } else {
        this.selected[photo.id] = photo;
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
        await addToAlbum(albumId, this.selected);
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
      const albumName = prompt('Enter album name');
      if (!albumName) {
        alert('Album name required.');
        return;
      }

      await createAlbum(albumName, Object.keys(this.selected));
      alert(`Album "${albumName}" created.`);
      this.selected = {};
      this.isSelectionMode = false;
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
