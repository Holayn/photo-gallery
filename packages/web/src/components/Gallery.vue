<template>
  <div ref="gallery">
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
      <div v-else-if="hasNextPage && infiniteScrollCanLoadMore" style="display: flex; align-items: center; justify-content: center; height: 100%;">
        <button style="padding: 8px 16px; background-color: var(--theme-color-main); border: none;" @click="loadMoreImagesToGallery">Load more images</button>
      </div>
    </div>
  </div>
</template>

<script>
import { debounce } from 'lodash';
import { getPhotos, PHOTO_SIZES, toPhotoUrl } from '../services/api';
import { getGalleryPhotoSize, isMobileScreen } from '../utils';

import Loading from './Loading.vue';

const GALLERY_ROW_HEIGHT = 200;
const GALLERY_ROW_HEIGHT_MOBILE = 80;
const AVERAGE_IMAGE_WIDTH = 200;
const IMAGE_WIDTH_MOBILE = 80;

export default {
  name: 'Gallery',
  components: {
    Loading,
  },
  props: {
    title: String,
  },
  data() {
    return {
      galleryIndex: 0,
      galleryImageRefs: [],
      hasNextPage: false,
      infiniteScrollBeforeHeight: null,
      infiniteScrollCanLoadMore: false,
      infiniteScrollDebounce: null,
      infiniteScrollImagesToLoad: null,
      loading: false,
      pageIndex: 0,
      PHOTO_SIZES,
    };
  },
  computed: {
    galleryRowHeight() {
      return isMobileScreen() ? GALLERY_ROW_HEIGHT_MOBILE : GALLERY_ROW_HEIGHT;
    },
    loadedPhotos() {
      return this.$store.state.photos?.slice(0, this.galleryIndex);
    },
    lightboxIndex() {
      return this.$store.state.lightbox.photoIndex;
    },
  },
  watch: {
    lightboxIndex() {
      if (this.lightboxIndex + this.infiniteScrollImagesToLoad >= this.galleryIndex) {
        setTimeout(() => {
          // Delay this slightly to prevent blocking other resources from loading first.
          // This is in the background when this is called.
          this.loadMoreImagesToGallery();
        }, 500);
      }
    },
  },
  created() {
    this.infiniteScrollDebounce = debounce(this.infiniteScroll, 100);
  },
  async mounted() {
    this.loading = true;
    
    try {
      const { info, photos } = await getPhotos(0, this.estimateNumImagesFitOnPage());

      this.loading = false;
      
      this.hasNextPage = info.hasNextPage;
      this.$store.dispatch('addPhotos', photos);

      const numImagesCanFitOnPage = this.calculateNumImagesFitOnPage();
      this.galleryIndex = numImagesCanFitOnPage;
      this.infiniteScrollImagesToLoad = numImagesCanFitOnPage;

      setTimeout(() => {
        window.$('#media').justifiedGallery({
          rowHeight: this.galleryRowHeight,
          maxRowHeight: this.galleryRowHeight,
        }).on('jg.complete', () => {
          this.infiniteScrollCanLoadMore = true;
        });

        this.handleInfiniteScroll();
      });
    } catch(e) {
      alert(e);
    }
  },
  beforeUpdate() {
    this.galleryImageRefs = [];
  },
  methods: {
    getGalleryPhotoSize,
    openSlides(i) {
      this.$store.state.lightbox.photoIndex = i;
      this.$emit('show-lightbox');
    },
    estimateNumImagesFitOnPage() {
      const { innerWidth, innerHeight } = window;
      // Add on a couple rows just in case.
      const rows = Math.ceil(innerHeight / this.galleryRowHeight) + 2;
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
      this.infiniteScrollBound = this.infiniteScrollDebounce.bind(this);
      window.addEventListener('scroll', this.infiniteScrollBound);
    },
    disableInfiniteScroll() {
      window.removeEventListener('scroll', this.infiniteScrollBound);
    },
    async infiniteScroll() {
      // Load more if at least half a page length from the bottom.
      if (this.infiniteScrollCanLoadMore && (window.innerHeight + window.scrollY + (window.innerHeight / 2)) >= this.$refs.gallery.offsetHeight) {
        this.infiniteScrollCanLoadMore = false;
        this.infiniteScrollBeforeHeight = window.document.documentElement.scrollHeight;
        await this.loadMoreImagesToGallery();
        console.debug('infinite scroll: disabled');
      }

      // Re-enable infinite scrolling once the user has scrolled down past where the infinite scrolling was originally triggered.
      if (window.innerHeight + window.scrollY > this.infiniteScrollBeforeHeight) {
        this.infiniteScrollCanLoadMore = true;
        console.debug('infinite scroll: enabled')
      }
    },
    async loadMoreImagesToGallery() {
      console.debug('loading more images to gallery');
      if (this.galleryIndex === this.$store.state.photos.length && this.hasNextPage) {
        await this.loadNextPage();
      }

      for (let i = this.galleryIndex, j = 0; i < this.$store.state.photos.length && j < this.infiniteScrollImagesToLoad; i++, j++) {
        this.galleryIndex++;

        // If we haven't reached infiniteScrollImagesToLoad but there are no more photos, we need to load the next page from the server.
        if (this.galleryIndex === this.$store.state.photos.length && j < this.infiniteScrollImagesToLoad - 1) {
          await this.loadNextPage();
        }
      }

      setTimeout(() => {
        window.$('#media').justifiedGallery('norewind');
      });
    },
    async loadNextPage() {
      console.debug('loading more photos from server');
      this.loading = true;
      this.pageIndex++;

      const { info, photos } = await getPhotos(this.pageIndex, this.estimateNumImagesFitOnPage());

      this.loading = false;

      this.hasNextPage = info.hasNextPage;
      this.$store.dispatch('addPhotos', photos);
    },
    isScrolledIntoView(el) {
      const rect = el.getBoundingClientRect();
      const elemTop = rect.top;
      const elemBottom = rect.bottom;

      const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
      return isVisible;
    },
    scrollCurrentImageIntoView() {
      // TODO: into center of view
      const galleryPhoto = this.galleryImageRefs[this.lightboxIndex];
      if (!this.isScrolledIntoView(galleryPhoto)) {
        galleryPhoto.scrollIntoView();
      }
    },
    setGalleryImageRef(el) {
      if (el) {
        this.galleryImageRefs.push(el);
      }
    },
    toPhotoUrl,
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
