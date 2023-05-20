<template>
  <div ref="gallery">
    <div class="px-4 md:px-8 md:flex md:gap-8 items-center">
      <div class="flex-auto break-all">
        <slot name="heading"></slot>
      </div>
      <Teleport to="#headerAdditionalControls">
        <div v-if="$store.state.isAdmin" class="flex gap-4 justify-end">
          <div v-if="isSelectionMode" class="flex gap-2 items-center">
            <div>Selected: {{ Object.keys(selected).length }}</div>
            <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="showAlbumSelection()">Add to Existing Album</button>
            <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="createAlbumFromSelected()">Create Album</button>
            <Loading v-if="loadingCreateAlbum"></Loading>
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
        <img :src="photo.data?.preview" @click="isSelectionMode ? select(photo) : openSlides(i)" @load="rendered(i)" @error="rendered(i)">
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
      <div v-if="loadingPhotos" class="flex flex-col items-center justify-center">
        <Loading></Loading>
        <p>Loading photos, {{ numPhotosToLoad }} remaining</p>
      </div>
    </div>

    <div v-if="noPhotos" class="text-center">No photos found.</div>


    
    <Lightbox ref="lightbox" v-show="showLightbox" @close="closeLightbox()"></Lightbox>

    <Modal v-if="showAddToExistingAlbum" @close="showAddToExistingAlbum = false">
      <Loading v-if="loadingAlbums"></Loading>
      <div v-else class="grid grid-cols-3 gap-1">
        <button v-for="album in albums" :key="album.id" class="btn px-6 py-4" @click="addToAlbumFromSelected(album.id)">
          {{ album.name }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { PHOTO_SIZES, getAlbums, createAlbum, addToAlbum } from '../services/api';
import { getGalleryPhotoSize, isMobileScreen, loadPhotoToBase64 } from '../utils';

import Lightbox from '../components/Lightbox.vue'
import Loading from '../components/Loading.vue';
import Modal from '../components/Modal.vue';

const GALLERY_ROW_HEIGHT = 200;
const GALLERY_ROW_HEIGHT_MOBILE = 80;
const AVERAGE_IMAGE_WIDTH = 180;
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
    showDateSelection: Boolean,
    showLightbox: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      albums: [],
      date: null,

      galleryIndex: 0,
      galleryImageRefs: [],
      infiniteScrollEnabled: false,
      infiniteScrollNumImages: null,
      loadingCreateAlbum: false,
      loadingAlbums: false,
      renderingMore: false,
      PHOTO_SIZES,

      loadedPhotoIndex: 0,
      loadingPhotos: false,
      noPhotos: false,
      numPhotosToLoad: 0,

      scrollPosition: 0,
      showAddToExistingAlbum: false,

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
      return this.$store.state.photos?.slice(0, this.loadedPhotoIndex);
    },
    lightboxIndex() {
      return this.$store.state.lightbox.photoIndex;
    },
    token() {
      return this.$store.state.token;
    },
  },
  watch: {
    lightboxIndex() {
      // Handling for navigating the lightbox past loaded gallery thumbnails.
      if (this.lightboxIndex + 1 >= this.galleryIndex) {
        this.renderMore();
      }
    },
    showLightbox() {
      if (this.showLightbox) {
        this.openLightbox();
      }
      else {
        this.closeLightbox();
      }
    },
  },
  created() {
    // Ensure the page isn't loaded with this query parameter set.
    this.removeLightboxParam(true);

    this.getGalleryPhotoSize = getGalleryPhotoSize;
  },
  beforeUpdate() {
    this.galleryImageRefs = [];
  },
  beforeUnmount() {
    this.disableInfiniteScroll();
  },
  methods: {
    async loadPhotos(firstLoad) {
      if (this.galleryIndex > this.loadedPhotoIndex) {
        console.debug('loadPhotos(): loading photos...');
        this.loadingPhotos = true;
        const photosToLoad = this.$store.state.photos.slice(this.loadedPhotoIndex, this.galleryIndex);
        this.numPhotosToLoad = photosToLoad.length;
        const loadPromises = photosToLoad.map(photo => {
          return new Promise((resolve, reject) => {
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
        this.loadedPhotoIndex = this.galleryIndex;

        if (!this.loadedPhotos.length) {
          this.noPhotos = true;
          this.loadingPhotos = false;
        } else {
          if (firstLoad) {
            window.$('#media').justifiedGallery({
              rowHeight: this.galleryRowHeight,
              maxRowHeight: this.galleryRowHeight,
            });

            this.handleInfiniteScroll();
          }

          setTimeout(() => {
            window.$('#media').justifiedGallery('norewind').on('jg.complete', () => {
              this.loadingPhotos = false;
            });
          });
        }
      }
    },
    reset() {
      window.$('#media').justifiedGallery('destroy');
      this.loadedPhotoIndex = 0;
      this.galleryIndex = 0;
      this.noPhotos = false;
    },
    async init() {
      const numImages = this.estimateNumImagesFitOnPage();
      this.galleryIndex = numImages;
      this.infiniteScrollNumImages = numImages;

      this.loadPhotos(true);
    },
    openSlides(i) {
      this.$store.state.lightbox.photoIndex = i;
      this.openLightbox();
    },
    estimateNumImagesFitOnPage() {
      const { innerWidth, innerHeight } = window;
      const rows = Math.ceil((innerHeight) / this.galleryRowHeight);
      const widthOfImage = isMobileScreen() ? IMAGE_WIDTH_MOBILE : AVERAGE_IMAGE_WIDTH;
      const imagesPerRow = Math.ceil(innerWidth / widthOfImage);

      return rows * imagesPerRow;
    },
    handleInfiniteScroll() {
      if (!this.infiniteScrollBound) {
        this.infiniteScrollBound = this.infiniteScroll.bind(this);
        this.enableInfiniteScroll();
      }
    },
    enableInfiniteScroll() {
      window.addEventListener('scroll', this.infiniteScrollBound);
    },
    disableInfiniteScroll() {
      window.removeEventListener('scroll', this.infiniteScrollBound);
    },
    async infiniteScroll() {
      if (this.infiniteScrollEnabled) {
        const boundaryOffset = window.innerHeight / 3;
        const boundary = window.document.documentElement.scrollHeight - boundaryOffset;
        const viewingWindowBottom = window.scrollY + window.innerHeight;
        const isPastBoundary = viewingWindowBottom > boundary;
        if (isPastBoundary) {
          this.infiniteScrollEnabled = false;
          await this.renderMore();
        }
      }
    },
    rendered(photoIndexRendered) {
      // Somehow, rendered is being called twice in rapid succession for each photo. Probably has something to do with the gallery library.
      setTimeout(() => {
        if (photoIndexRendered === this.loadedPhotos.length - 1) {
          // Last photo has finished rendering, allow for infinite scrolling.
          console.debug('rendered(): infinite scroll enabled.');
          this.infiniteScrollEnabled = true;
        }
      }, 100);
    },
    async renderMore() {
      if (this.renderingMore) { return; }

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

      this.loadPhotos();
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

    openLightbox() {
      this.scrollPosition = window.pageYOffset;
      this.disableInfiniteScroll();
      document.body.style.position = 'fixed';
      document.body.style.overflow = 'hidden';
      this.$refs.lightbox.open();
      this.$router.push({ path: this.$route.path, query: { showLightbox: true } });
    },
    closeLightbox() {
      this.removeLightboxParam();
      document.body.style.position = '';
      document.body.style.overflow = '';
      this.$nextTick(() => {
        window.scrollTo(0, this.scrollPosition);
        setTimeout(() => {
          this.scrollCurrentImageIntoView();
          this.enableInfiniteScroll();
        });
      });
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
        return;
      }

      try {
        await createAlbum(albumName, Object.values(this.selected));
        alert(`Album "${albumName}" created.`);
        this.selected = {};
        this.isSelectionMode = false;
      } catch (e) {
        alert(e);
      }

      this.loadingCreateAlbum = false;
    },

    onDateBlur() {
      this.$emit('date', this.date);
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
