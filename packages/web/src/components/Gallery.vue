<template>
  <div>
    <div id="media">
      <a v-for="(photo, i) in loadedPhotos" :ref="setGalleryImageRef" :key="i" :href="toPhotoUrl(photo, PHOTO_SIZES.LARGE)" @click.prevent>
        <img :src="toPhotoUrl(photo, PHOTO_SIZES.SMALL)" @click="openSlides(i)">
        <div v-if="photo.metadata.video" class="overlay">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </div>
      </a>
    </div>
    <div v-if="moreToLoad" style="display: flex; justify-content: center; padding: 1rem;">
      <Loading></Loading>
    </div>
  </div>
</template>

<script>
import { getPhotos, PHOTO_SIZES, toPhotoUrl } from '../services/api';

import Loading from './Loading.vue';

const GALLERY_ROW_HEIGHT = 200;

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
      infiniteScrollCanLoadMore: true,
      infiniteScrollImagesToLoad: 20,
      pageIndex: 0,
      PHOTO_SIZES,
      moreToLoad: true,
    };
  },
  computed: {
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
    galleryIndex() {
      if (this.galleryIndex >= this.$store.state.photos.length) {
        this.moreToLoad = false;
      }
    },
  },
  async mounted() {
    // Let other resources load first
    await this.$nextTick();

    const { info, photos } = await getPhotos();
    
    this.hasNextPage = info.hasNextPage;
    this.$store.state.photos = photos;

    this.galleryIndex = this.calculateImagesToLoad();
    this.infiniteScrollImagesToLoad = this.galleryIndex;

    setTimeout(() => {
      window.$('#media').justifiedGallery({
        rowHeight: GALLERY_ROW_HEIGHT,
      });

      this.handleInfiniteScroll();
    });
  },
  beforeUpdate() {
    this.galleryImageRefs = [];
  },
  methods: {
    openSlides(i) {
      this.$store.state.lightbox.photoIndex = i;
      this.$emit('show-lightbox');
    },
    calculateImagesToLoad() {
      let numImagesToLoad = 0;
        // Calculate how many images to show on page load
      const { innerWidth, innerHeight } = window;
      // Add on another row just in case
      const rows = innerHeight / GALLERY_ROW_HEIGHT + 1;

      let currWidth = 0;
      const totalWidth = innerWidth * rows;

      for (let i = 0; i < this.$store.state.photos.length; i++) {
        const { width, height } = this.$store.state.photos[i].metadata;
        const thumbnailWidth = (width / height) * GALLERY_ROW_HEIGHT;

        if (currWidth >= totalWidth || currWidth + thumbnailWidth >= totalWidth) {
          break;
        }

        currWidth += thumbnailWidth;
        numImagesToLoad++;
      }

      return numImagesToLoad;
    },
    handleInfiniteScroll() {
      this.infiniteScrollBound = this.infiniteScroll.bind(this);
      window.addEventListener('scroll', this.infiniteScrollBound);
    },
    disableInfiniteScroll() {
      window.removeEventListener('scroll', this.infiniteScrollBound);
    },
    infiniteScroll() {
      if (this.infiniteScrollCanLoadMore && (window.innerHeight + window.scrollY + (window.innerHeight / 2)) >= document.querySelector('#app').offsetHeight) {
        this.infiniteScrollCanLoadMore = false;
        this.loadMoreImagesToGallery();

        // Prevent scrolling from loading too many images at once
        setTimeout(() => {
          this.infiniteScrollCanLoadMore = true;
          this.infiniteScroll();
        }, 1000);
      }
    },
    loadMoreImagesToGallery() {
      for (let i = this.galleryIndex, j = 0; i < this.$store.state.photos.length && j < this.infiniteScrollImagesToLoad; i++, j++) {
        this.galleryIndex++;

        if (i === this.$store.state.photos.length - 1) {
          this.loadNextPage();
          return;
        }
      }

      window.$('#media').justifiedGallery('norewind');
    },
    async loadNextPage() {
      this.pageIndex++;

      const { info, photos } = await getPhotos(this.pageIndex);

      this.hasNextPage = info.hasNextPage;
      this.$store.state.photos.push(...photos);
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
