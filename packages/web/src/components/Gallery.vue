<template>
  <div id="media">
    <a v-for="(photo, i) in loadedPhotos" :ref="setGalleryImageRef" :key="i" :href="getHref(photo)" @click.prevent>
      <img :src="getImgSrc(photo)" @click="openSlides(i)">
      <div v-if="photo.isVideo" class="overlay">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </div>
    </a>
  </div>
</template>

<script>
import { fetchPhotos } from '../services/fetch';
import { getUrl } from '../utils';

const GALLERY_ROW_HEIGHT = 200;
const INFINITE_SCROLL_IMAGES_TO_LOAD = 20;

export default {
  name: 'Gallery',
  props: {
    title: String,
  },
  data() {
    return {
      galleryIndex: 0,
      galleryImageRefs: [],
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
      if (this.lightboxIndex + INFINITE_SCROLL_IMAGES_TO_LOAD >= this.galleryIndex) {
        this.loadMoreImagesToGallery();
      }
    },
  },
  async mounted() {
    // Let other resources load first
    await this.$nextTick();
    this.$store.state.photos = await fetchPhotos(this.title);
    this.galleryIndex = this.calculateImagesToLoad();

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
    getUrl(path) {
      return getUrl(path, this.title);
    },
    getHref(photo) {
      return photo.isVideo ? this.getUrl(photo.output.download.path) : this.getUrl(photo.output.large.path);
    },
    getImgSrc(photo) {
      return this.getUrl(photo.output.small.path)
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
        const { width, height } = this.$store.state.photos[i].meta;
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
      if ((window.innerHeight + window.scrollY) >= document.querySelector('#app').offsetHeight) {
        this.loadMoreImagesToGallery();
      }
    },
    loadMoreImagesToGallery() {
      for (let i = this.galleryIndex, j = 0; i < this.$store.state.photos.length && j < INFINITE_SCROLL_IMAGES_TO_LOAD; i++, j++) {
        this.galleryIndex++;
      }

      window.$('#media').justifiedGallery('norewind');
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
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
