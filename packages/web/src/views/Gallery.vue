<template>
  <div ref="gallery">
    <div class="px-8 flex items-center">
      <h1 class="flex-auto text-5xl">
        <span v-if="loadingAlbumInfo">(loading...)</span>
        <span v-else>{{ title }}</span>
      </h1>
      <div class="cursor-pointer">
        <svg @click="toggleHelp(true)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      </div>
    </div>
    <div id="media" class="justified-gallery">
      <a v-for="(photo, i) in loadedPhotos" :ref="setGalleryImageRef" :key="i" :href="toPhotoUrl(photo, PHOTO_SIZES.LARGE)" @click.prevent>
        <img :src="toPhotoUrl(photo, getGalleryPhotoSize())" @click="openSlides(i)">
        <div v-if="photo.metadata.video" class="overlay">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
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

    
    <Lightbox ref="lightbox" v-show="showLightbox" :title="'Photos'" @close="closeLightbox()"></Lightbox>
    <div v-if="showHelp" @click="toggleHelp(false)" style="display: flex; align-items: center; justify-content: center; position: fixed; z-index: 99; top: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5);">
      <div style="background-color: white; margin: 1rem;">
        <div style="height: 100%; padding: 1rem;">
          <div style="display: flex; justify-content: flex-end;">
            <div>
              <svg @click="toggleHelp(false)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </div>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getPhotos, PHOTO_SIZES, toPhotoUrl, getAlbum } from '../services/api';
import { getGalleryPhotoSize, isMobileScreen } from '../utils';

import Lightbox from '../components/Lightbox.vue'
import Loading from '../components/Loading.vue';

const GALLERY_ROW_HEIGHT = 200;
const GALLERY_ROW_HEIGHT_MOBILE = 80;
const AVERAGE_IMAGE_WIDTH = 200;
const IMAGE_WIDTH_MOBILE = 80;

export default {
  name: 'Gallery',
  components: {
    Lightbox,
    Loading,
  },
  props: {
    albumId: String,
  },
  data() {
    return {
      album: null,
      galleryIndex: 0,
      galleryImageRefs: [],
      hasMorePhotos: false,
      infiniteScrollBeforeHeight: null,
      infiniteScrollEnabled: true,
      infiniteScrollNumImages: null,
      loading: false,
      loadingAlbumInfo: false,
      renderingMore: false,
      PHOTO_SIZES,

      scrollPosition: 0,
      showLightbox: false,
      showHelp: false,
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
    title() {
      return this.albumId ? this.album?.name : 'All Photos';
    },
  },
  watch: {
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
    this.toPhotoUrl = toPhotoUrl;
  },
  async mounted() {
    this.loading = true;
    
    try {
      if (this.albumId) {
        this.loadingAlbumInfo = true;
        this.album = await getAlbum(this.albumId);
        this.loadingAlbumInfo = false;
        document.title = this.album.name;
      }

      this.$store.dispatch('clearPhotos');
      const { info, photos } = await getPhotos(this.albumId, 0, this.estimateNumImagesFitOnPage());

      this.loading = false;
      
      this.hasMorePhotos = info.hasMorePhotos;
      this.$store.dispatch('addPhotos', photos);

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
    } catch(e) {
      alert(e);
      throw e;
    }
  },
  beforeUpdate() {
    this.galleryImageRefs = [];
  },
  methods: {
    getGalleryPhotoSize,
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
        await this.loadMoreFromServer();
      }

      for (let i = this.galleryIndex, j = 0; i < this.$store.state.photos.length && j < this.infiniteScrollNumImages; i++, j++) {
        this.galleryIndex++;

        // If we haven't reached infiniteScrollNumImages but there are no more photos, we need to load the next page from the server.
        if (this.galleryIndex === this.$store.state.photos.length && j < this.infiniteScrollNumImages - 1) {
          await this.loadMoreFromServer();
        }
      }

      console.debug(`added ${this.galleryIndex - originalIndex} more images for rendering.`);
      this.renderingMore = false;

      setTimeout(() => {
        window.$('#media').justifiedGallery('norewind');
      });
    },
    async loadMoreFromServer() {
      console.debug('loading more photo info from server...');
      this.loading = true;

      const { info, photos } = await getPhotos(this.albumId, this.$store.state.photos.length, this.estimateNumImagesFitOnPage());

      this.loading = false;

      this.hasMorePhotos = info.hasMorePhotos;
      this.$store.dispatch('addPhotos', photos);

      console.debug(`fetched photo info of ${photos.length} more photos from server.`);
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
  },
}
</script>

<style scoped>
  .overlay {
    position: absolute;
    z-index: 99;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
</style>